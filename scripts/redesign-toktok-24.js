import 'dotenv/config';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from '../agents/config-loader.js';
import { harmonizeAndDesign } from '../agents/series-harmonizer.js';
import { validateAll } from '../agents/design-validator.js';
import { renderCards } from '../agents/renderer.js';
import { qaAndRegenerate } from '../agents/visual-qa.js';
import { getByStatus, appendFilePaths, setStatus, getPageContent, getComments } from '../agents/notion-connector.js';
import { research } from '../agents/researcher.js';
import { critiqueHook } from '../agents/hook-critic.js';
import { reviewAndFix } from '../agents/structure-reviewer.js';
import { generateAllImages } from '../agents/gemini-imager.js';
import { pickAllImages } from '../agents/image-picker.js';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const ACADEMY_KEY = 'toktok';

// ── Step 1: 톡톡 2-4 페이지 찾기 ──
console.log('═══ Step 1: 톡톡 2-4 페이지 찾기 ═══');

const searchStatuses = ['디자인 수정', '디자인 1차', '제작 요청', '기획 컨펌', '기획컨펌대기', '원고작업'];
let targetPage = null;

for (const status of searchStatuses) {
  console.log(`  검색 중: 상태="${status}"`);
  try {
    const pages = await getByStatus(status);
    const found = pages.find(p =>
      p.title.includes('톡톡2-4') ||
      p.title.includes('톡톡 2-4')
    );
    if (found) {
      targetPage = found;
      console.log(`  발견! 상태="${status}"`);
      break;
    }
  } catch (err) {
    console.log(`  상태 "${status}" 검색 실패: ${err.message}`);
  }
}

if (!targetPage) {
  console.error('톡톡 2-4 페이지를 찾을 수 없습니다.');
  process.exit(1);
}

console.log(`  페이지: ${targetPage.title}`);
console.log(`  ID: ${targetPage.id}`);
console.log(`  상태: ${targetPage.statuses?.join(', ')}\n`);

// ── Step 2: copy.json 로드 ──
console.log('═══ Step 2: 카드 데이터 로드 ═══');

const today = new Date().toISOString().slice(0, 10);
const safeTopic = targetPage.title.replace(/[^가-힣a-zA-Z0-9]/g, '-').substring(0, 50);
const OUTPUT_DIR = join(ROOT, 'output', `톡톡 잉글리쉬-${safeTopic}-${today}`);

await mkdir(OUTPUT_DIR, { recursive: true });

let copyData = null;

// 기존 output 폴더에서 copy.json 찾기
try {
  const existingCopy = await readFile(join(OUTPUT_DIR, 'copy.json'), 'utf-8');
  copyData = JSON.parse(existingCopy);
  console.log(`  기존 copy.json 로드 (카드 ${copyData.cards.length}장)\n`);
} catch {
  console.log('  오늘 날짜 폴더에 copy.json 없음 — 이전 폴더 검색');
  try {
    const matches = await glob('output/*톡톡*경기초*/copy.json', { cwd: ROOT });
    if (matches.length > 0) {
      const latestMatch = matches.sort().pop();
      const fullPath = join(ROOT, latestMatch);
      console.log(`  이전 copy.json 발견: ${latestMatch}`);
      const existingCopy = await readFile(fullPath, 'utf-8');
      copyData = JSON.parse(existingCopy);
      console.log(`  카드 ${copyData.cards.length}장 로드\n`);
      await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
    }
  } catch (err) {
    console.log(`  이전 폴더 검색 실패: ${err.message}`);
  }
}

if (!copyData) {
  console.log('  copy.json 없음 — 리서치 + 기획 생성 시작');

  const comments = await getComments(targetPage.id);
  const pageContent = await getPageContent(targetPage.id);

  const topic = targetPage.title.replace(/^\[.*?\]\s*/, '') || '톡톡 2-4';
  copyData = await research(topic, '톡톡 잉글리쉬', {
    academyKey: ACADEMY_KEY,
    keyword: targetPage.keyword || '',
    comments: comments.map(c => c.text),
    pageContent: pageContent.planningContent,
  });
  console.log(`  카드 ${copyData.cards.length}장 기획 완료`);

  await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
  console.log(`  copy.json 저장 완료\n`);

  console.log('  API rate limit 대기 (60초)...');
  await new Promise(r => setTimeout(r, 60000));
}

const cards = copyData.cards;

// ── Step 3: 학원 설정 로드 ──
console.log('═══ Step 3: 학원 설정 로드 ═══');
const { academy, cssVariables } = await loadConfig(ACADEMY_KEY);
console.log(`  ${academy.name} 설정 로드 완료\n`);

// ── Step 4: 후킹 카드 채점 ──
console.log('═══ Step 4: 후킹 카드 채점 ═══');
try {
  cards[0] = await critiqueHook(cards[0], academy);
  console.log('  후킹 채점 완료');
} catch (err) {
  console.log(`  후킹 채점 스킵: ${err.message}`);
}
await new Promise(r => setTimeout(r, 10000));
console.log('');

// ── Step 4.5: 실사진 매칭 ──
console.log('═══ Step 4.5: 실사진 매칭 ═══');
try {
  await pickAllImages(cards, ACADEMY_KEY);
  console.log('  실사진 매칭 완료');
} catch (err) {
  console.log(`  실사진 매칭 스킵: ${err.message}`);
}
console.log('');

// ── Step 5: 구조 검토 ──
console.log('═══ Step 5: 구조 검토 ═══');
try {
  const reviewedCards = await reviewAndFix(cards, academy);
  if (reviewedCards) {
    copyData.cards = reviewedCards;
  }
  console.log('  구조 검토 완료');
} catch (err) {
  console.log(`  구조 검토 스킵: ${err.message}`);
}
console.log('');

// ── Step 6: Imagen 배경 이미지 생성 ──
console.log('═══ Step 6: Imagen 배경 이미지 생성 ═══');
try {
  await generateAllImages(copyData.cards, academy);
  console.log('  배경 이미지 생성 완료');
} catch (err) {
  console.log(`  배경 이미지 생성 스킵: ${err.message}`);
}
console.log('');

// ── Step 7: 시리즈 하모나이저 + HTML 디자인 ──
console.log('═══ Step 7: 시리즈 하모나이저 + HTML 디자인 ═══');
await harmonizeAndDesign(copyData.cards, cssVariables, academy, { academyKey: ACADEMY_KEY });
console.log('');

// ── Step 8: HTML 품질 검증 ──
console.log('═══ Step 8: HTML 품질 검증 ═══');
await validateAll(copyData.cards);
console.log('');

// ── Step 9: PNG 렌더링 ──
console.log('═══ Step 9: PNG 렌더링 ═══');
console.log(`  출력 폴더: ${OUTPUT_DIR}`);
const { htmlSources } = await renderCards(copyData.cards, cssVariables, academy.name, OUTPUT_DIR);
console.log('');

await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');

// ── Step 10: 비주얼 QA ──
console.log('═══ Step 10: 비주얼 QA ═══');
try {
  await qaAndRegenerate(copyData.cards, cssVariables, academy, OUTPUT_DIR, { academyKey: ACADEMY_KEY });
  const regenerated = copyData.cards.filter(c => c._regenerated);
  if (regenerated.length > 0) {
    console.log(`  ${regenerated.length}장 재렌더링...`);
    await renderCards(copyData.cards, cssVariables, academy.name, OUTPUT_DIR);
    regenerated.forEach(c => delete c._regenerated);
  }
} catch (err) {
  console.log(`  QA 스킵: ${err.message}`);
}
console.log('');

// ── Step 11: 노션 업로드 ──
console.log('═══ Step 11: 노션 업로드 ═══');
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

await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');

console.log('\n═══ 완료! ═══');
