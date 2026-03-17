/**
 * 진학중등3-4 카드 08 재디자인
 * - Drive 레퍼런스 폴더에서 "전교1둥.png" 다운로드
 * - 카드 08에 레퍼런스 이미지 적용하여 Gemini 재디자인
 * - HTML 검증 + 전체 PNG 재렌더링 + 노션 재업로드
 */
import 'dotenv/config';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from '../agents/config-loader.js';
import { designCard } from '../agents/gemini-designer.js';
import { extractSeriesDNA, formatDNAForPrompt } from '../agents/series-harmonizer.js';
import { buildSystemPrompt } from '../agents/prompt-builder.js';
import { validateCard } from '../agents/design-validator.js';
import { renderCards } from '../agents/renderer.js';
import { getByStatus, appendFilePaths, setStatus } from '../agents/notion-connector.js';
import { getClients } from '../agents/image-picker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const ACADEMY_KEY = 'jinhak';
const OUTPUT_DIR = join(ROOT, 'output', '진학학원--진학중등3-4--종합반-전환-이벤트-2026-03-12');
const REFS_DIR = join(ROOT, 'config', 'references', 'jinhak');
const REF_FOLDER_ID = '121YNwqOv256is-pdfsT0ep-8cM8FDhfl'; // jinhak 레퍼런스 Drive folder

// ── Step 1: Drive에서 "전교1둥.png" 다운로드 ──
console.log('═══ Step 1: Drive 레퍼런스 이미지 다운로드 ═══');

await mkdir(REFS_DIR, { recursive: true });

const { drive } = await getClients();

// 레퍼런스 폴더에서 파일 목록 조회
const response = await drive.files.list({
  q: `'${REF_FOLDER_ID}' in parents and mimeType contains 'image/' and trashed = false`,
  fields: 'files(id, name, mimeType)',
  orderBy: 'name',
  pageSize: 100,
});

const files = response.data.files || [];
console.log(`  레퍼런스 폴더 파일 ${files.length}개:`);
files.forEach(f => console.log(`    - ${f.name} (${f.id})`));

const targetFile = files.find(f => f.name === '전교1등최다배출.png');
if (!targetFile) {
  console.error('  "전교1등최다배출.png" 파일을 찾을 수 없습니다!');
  console.error('  사용 가능한 파일:', files.map(f => f.name).join(', '));
  process.exit(1);
}

// example-01.png로 저장 (findReference가 cardType-번호.png 형식으로 매칭)
const localRefPath = join(REFS_DIR, 'example-01.png');
const fileData = await drive.files.get(
  { fileId: targetFile.id, alt: 'media' },
  { responseType: 'arraybuffer' }
);
await writeFile(localRefPath, Buffer.from(fileData.data));
console.log(`  "전교1등최다배출.png" -> ${localRefPath} 저장 완료\n`);

// ── Step 2: copy.json 로드 ──
console.log('═══ Step 2: copy.json 로드 ═══');
const copyRaw = await readFile(join(OUTPUT_DIR, 'copy.json'), 'utf-8');
const copyData = JSON.parse(copyRaw);
console.log(`  카드 ${copyData.cards.length}장 로드\n`);

// ── Step 3: 학원 설정 로드 ──
console.log('═══ Step 3: 학원 설정 로드 ═══');
const { academy, cssVariables } = await loadConfig(ACADEMY_KEY);
console.log(`  ${academy.name} 설정 로드 완료\n`);

// ── Step 4: 카드 01 DNA 추출 ──
console.log('═══ Step 4: 카드 01 DNA 추출 ═══');
const card1 = copyData.cards[0];
if (!card1.generated_html) {
  console.error('  카드 01에 generated_html이 없습니다!');
  process.exit(1);
}
const dna = await extractSeriesDNA(card1.generated_html);
const seriesDNA = formatDNAForPrompt(dna);
console.log(`  DNA 추출 완료: ${dna.colors.length}개 CSS 변수, ${dna.fontSizes.length}개 폰트 사이즈\n`);

// ── Step 5: 카드 08 재디자인 ──
console.log('═══ Step 5: 카드 08 Gemini 재디자인 ═══');
const card8 = copyData.cards.find(c => c.number === 8);
if (!card8) {
  console.error('  카드 08을 찾을 수 없습니다!');
  process.exit(1);
}

// 레퍼런스 이미지 로드 (방금 다운로드한 전교1둥.png)
const refBuffer = await readFile(localRefPath);
const referenceImage = {
  base64: refBuffer.toString('base64'),
  mimeType: 'image/png',
};
console.log(`  레퍼런스 이미지 로드: ${(refBuffer.length / 1024).toFixed(1)}KB`);

// 이미 사용한 레이아웃 수집 (카드 08 제외)
const usedLayouts = copyData.cards
  .filter(c => c.number !== 8 && c.layout_used)
  .map(c => c.layout_used);
console.log(`  사용된 레이아웃: [${usedLayouts.join(', ')}]`);

// 시스템 프롬프트 빌드 (DNA 포함)
const systemPrompt = await buildSystemPrompt(ACADEMY_KEY, academy, { seriesDNA });

// 기존 generated_html 초기화
card8.generated_html = null;
card8.layout_used = null;

console.log(`  카드 08 재디자인 시작 (type: ${card8.type}, layout_hint: ${card8.layout_hint})...`);

const newHtml = await designCard(card8, cssVariables, academy, usedLayouts, {
  academyKey: ACADEMY_KEY,
  systemPrompt,
  referenceImage,
});
card8.generated_html = newHtml;
card8.layout_used = card8.layout_hint || 'card-08';
console.log(`  카드 08 재디자인 완료!\n`);

// ── Step 6: HTML 검증 ──
console.log('═══ Step 6: 카드 08 HTML 검증 ═══');
const validation = await validateCard(newHtml, card8);
if (validation.pass) {
  console.log('  PASS');
} else {
  console.log(`  FAIL - 자동수정 적용: ${validation.feedback.substring(0, 120)}`);
  card8.generated_html = validation.html;
}
console.log('');

// ── Step 7: copy.json 저장 ──
console.log('═══ Step 7: copy.json 저장 ═══');
await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('  저장 완료\n');

// ── Step 8: 전체 PNG 재렌더링 ──
console.log('═══ Step 8: 전체 PNG 재렌더링 ═══');
console.log(`  출력 폴더: ${OUTPUT_DIR}`);
const { htmlSources } = await renderCards(copyData.cards, cssVariables, academy.name, OUTPUT_DIR);
console.log('');

// ── Step 9: 노션 업로드 ──
console.log('═══ Step 9: 노션 재업로드 ═══');

// 노션에서 진학중등3-4 페이지 찾기
const searchStatuses = ['디자인 1차', '제작 요청', '기획 컨펌', '원고작업', '기획컨펌대기'];
let targetPage = null;

for (const status of searchStatuses) {
  try {
    const pages = await getByStatus(status);
    const found = pages.find(p =>
      p.title.includes('진학중등3-4') ||
      p.title.includes('진학 중등3-4')
    );
    if (found) {
      targetPage = found;
      console.log(`  페이지 발견: "${found.title}" (상태: ${status})`);
      break;
    }
  } catch (err) {
    console.log(`  상태 "${status}" 검색 실패: ${err.message}`);
  }
}

if (!targetPage) {
  console.log('  노션 페이지를 찾을 수 없음 — 업로드 스킵');
  console.log('  PNG는 로컬에 저장되어 있습니다.');
} else {
  const pngPaths = copyData.cards.map((_, i) =>
    join(OUTPUT_DIR, `card-${String(i + 1).padStart(2, '0')}.png`)
  );
  await appendFilePaths(
    targetPage.id,
    pngPaths,
    targetPage.title,
    academy.name,
    academy.drive_folder_id,
    htmlSources
  );
  console.log(`  PNG ${pngPaths.length}장 노션 업로드 완료`);

  await setStatus(targetPage.id, '디자인 1차');
  console.log('  상태 -> 디자인 1차');
}

console.log('\n═══ 완료! 카드 08 재디자인 성공 ═══');
