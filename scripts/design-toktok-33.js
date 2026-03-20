import 'dotenv/config';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from '../agents/config-loader.js';
import { harmonizeAndDesign } from '../agents/series-harmonizer.js';
import { validateAll } from '../agents/design-validator.js';
import { renderCards } from '../agents/renderer.js';
import { qaAndRegenerate } from '../agents/visual-qa.js';
import { getByStatus, appendFilePaths, setStatus } from '../agents/notion-connector.js';
import { critiqueHook } from '../agents/hook-critic.js';
import { reviewAndFix } from '../agents/structure-reviewer.js';
import { generateAllImages } from '../agents/gemini-imager.js';
import { pickAllImages } from '../agents/image-picker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const ACADEMY_KEY = 'toktok';
const OUTPUT_DIR = join(ROOT, 'output', '톡톡 잉글리쉬--톡톡3-3--정규vs챌린지-2026-03-19');

console.log('═══ 톡톡 3-3 디자인 제작 시작 ═══\n');

// ── Step 1: 데이터 로드 ──
console.log('═══ Step 1: 데이터 로드 ═══');
const copyData = JSON.parse(await readFile(join(OUTPUT_DIR, 'copy.json'), 'utf-8'));
const cards = copyData.cards;
const { academy, cssVariables } = await loadConfig(ACADEMY_KEY);
console.log(`  ${academy.name} 설정 로드, 카드 ${cards.length}장\n`);

// ── Step 2: 후킹 카드 채점 ──
console.log('═══ Step 2: 후킹 카드 채점 ═══');
try {
  cards[0] = await critiqueHook(cards[0], academy);
  console.log('  후킹 채점 완료');
} catch (err) {
  console.log(`  후킹 채점 스킵: ${err.message}`);
}
await new Promise(r => setTimeout(r, 10000));
console.log('');

// ── Step 3: 실사진 매칭 ──
console.log('═══ Step 3: 실사진 매칭 ═══');
try {
  await pickAllImages(cards, ACADEMY_KEY);
  console.log('  실사진 매칭 완료');
} catch (err) {
  console.log(`  실사진 매칭 스킵: ${err.message}`);
}
console.log('');

// ── Step 4: 구조 검토 ──
console.log('═══ Step 4: 구조 검토 ═══');
try {
  const reviewedCards = await reviewAndFix(cards, academy);
  if (reviewedCards) copyData.cards = reviewedCards;
  console.log('  구조 검토 완료');
} catch (err) {
  console.log(`  구조 검토 스킵: ${err.message}`);
}
console.log('');

// ── Step 5: Imagen 배경 이미지 생성 ──
console.log('═══ Step 5: Imagen 배경 이미지 생성 ═══');
try {
  await generateAllImages(copyData.cards, academy);
  console.log('  배경 이미지 생성 완료');
} catch (err) {
  console.log(`  배경 이미지 생성 스킵: ${err.message}`);
}
console.log('');

// ── Step 6: 시리즈 하모나이저 + HTML 디자인 ──
console.log('═══ Step 6: 시리즈 하모나이저 + HTML 디자인 ═══');
await harmonizeAndDesign(copyData.cards, cssVariables, academy, { academyKey: ACADEMY_KEY });
console.log('');

// ── Step 7: HTML 품질 검증 ──
console.log('═══ Step 7: HTML 품질 검증 ═══');
await validateAll(copyData.cards);
console.log('');

// ── Step 8: PNG 렌더링 ──
console.log('═══ Step 8: PNG 렌더링 ═══');
console.log(`  출력 폴더: ${OUTPUT_DIR}`);
const { htmlSources } = await renderCards(copyData.cards, cssVariables, academy.name, OUTPUT_DIR, ACADEMY_KEY);
console.log('');

await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');

// ── Step 9: 비주얼 QA ──
console.log('═══ Step 9: 비주얼 QA ═══');
try {
  await qaAndRegenerate(copyData.cards, cssVariables, academy, OUTPUT_DIR, { academyKey: ACADEMY_KEY });
  const regenerated = copyData.cards.filter(c => c._regenerated);
  if (regenerated.length > 0) {
    console.log(`  ${regenerated.length}장 재렌더링...`);
    await renderCards(copyData.cards, cssVariables, academy.name, OUTPUT_DIR, ACADEMY_KEY);
    regenerated.forEach(c => delete c._regenerated);
  }
} catch (err) {
  console.log(`  QA 스킵: ${err.message}`);
}
console.log('');

// ── Step 10: 노션 업로드 ──
console.log('═══ Step 10: 노션 업로드 ═══');
const searchStatuses = ['기획컨펌대기', '기획착수', '디자인 수정', '디자인 1차', '제작 요청', '원고작업'];
let targetPage = null;
for (const status of searchStatuses) {
  try {
    const pages = await getByStatus(status);
    const found = pages.find(p => p.title.includes('톡톡3-3') || p.title.includes('톡톡 3-3'));
    if (found) {
      targetPage = found;
      console.log(`  페이지: "${found.title}" (상태: ${status})`);
      break;
    }
  } catch {}
}

if (targetPage) {
  const pngPaths = copyData.cards.map((_, i) =>
    join(OUTPUT_DIR, `card-${String(i + 1).padStart(2, '0')}.png`)
  );
  await appendFilePaths(targetPage.id, pngPaths, targetPage.title, academy.name, academy.drive_folder_id, htmlSources);
  console.log(`  PNG ${pngPaths.length}장 노션 업로드 완료`);
  await setStatus(targetPage.id, '디자인 1차');
  console.log('  상태 → 디자인 1차');
} else {
  console.log('  ⚠️ 톡톡 3-3 노션 페이지를 찾을 수 없습니다');
}

await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('\n═══ 완료! ═══');
