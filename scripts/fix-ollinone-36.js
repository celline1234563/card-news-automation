import 'dotenv/config';
import { copyFile, readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from '../agents/config-loader.js';
import { harmonizeAndDesign } from '../agents/series-harmonizer.js';
import { validateAll } from '../agents/design-validator.js';
import { renderCards } from '../agents/renderer.js';
import { qaAndRegenerate } from '../agents/visual-qa.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const OUTPUT_DIR = join(ROOT, 'output', '올인원 수학학원-이화여대-의대-합격-후기-2026-03-12');
const REFS_DIR = join(ROOT, 'config', 'references', 'ollinone');

// ── Step 1: 레퍼런스 이미지 세팅 ──
console.log('═══ Step 1: 레퍼런스 이미지 세팅 ═══');
const refMapping = [
  { src: '올인원_후기0.png', dest: 'hook-01.png' },
  { src: '올인원_후기1.png', dest: 'solution-01.png' },
  { src: '올인원_후기2.png', dest: 'example-01.png' },
  { src: '올인원_후기3.png', dest: 'cta-01.png' },
];

for (const { src, dest } of refMapping) {
  await copyFile(join(ROOT, 'reference', src), join(REFS_DIR, dest));
  console.log(`  📎 ${src} → ${dest}`);
}
console.log('  ✅ 레퍼런스 4장 세팅 완료\n');

// ── Step 2: copy.json 로드 + 카드 10 배경 제거 ──
console.log('═══ Step 2: 기존 카드 데이터 로드 ═══');
const copyJson = JSON.parse(await readFile(join(OUTPUT_DIR, 'copy.json'), 'utf-8'));
const cards = copyJson.cards;

// 카드 10 AI 생성 배경 제거 (이상한 글자 문제)
const card10 = cards.find(c => c.number === 10);
if (card10) {
  card10.bg_image_url = null;
  card10.image_category = null;
  console.log('  🔧 카드 10: AI 배경 이미지 제거');
}

// 기존 generated_html 제거 (재디자인하므로)
for (const card of cards) {
  delete card.generated_html;
  delete card.layout_used;
}
console.log(`  ✅ 카드 ${cards.length}장 로드 완료\n`);

// ── Step 3: 학원 설정 로드 ──
console.log('═══ Step 3: 학원 설정 로드 ═══');
const { academy, cssVariables } = await loadConfig('ollinone');
console.log(`  ✅ ${academy.name} 설정 로드\n`);

// ── Step 4: 레퍼런스 포함 재디자인 (Stage 5) ──
console.log('═══ Step 4: 레퍼런스 기반 재디자인 ═══');
await harmonizeAndDesign(cards, cssVariables, academy, { academyKey: 'ollinone' });
console.log('');

// ── Step 5: HTML 품질 검증 ──
console.log('═══ Step 5: HTML 품질 검증 ═══');
await validateAll(cards);
console.log('');

// ── Step 6: PNG 렌더링 ──
console.log('═══ Step 6: PNG 재렌더링 ═══');
const { htmlSources } = await renderCards(cards, cssVariables, academy.name, OUTPUT_DIR);
console.log('');

// ── Step 7: 비주얼 QA ──
console.log('═══ Step 7: 비주얼 QA ═══');
try {
  await qaAndRegenerate(cards, cssVariables, academy, OUTPUT_DIR, { academyKey: 'ollinone' });
  const regenerated = cards.filter(c => c._regenerated);
  if (regenerated.length > 0) {
    console.log(`  🔄 ${regenerated.length}장 재렌더링...`);
    await renderCards(cards, cssVariables, academy.name, OUTPUT_DIR);
    regenerated.forEach(c => delete c._regenerated);
  }
} catch (err) {
  console.log(`  ⚠️ QA 스킵: ${err.message}`);
}
console.log('');

// ── Step 8: 노션 재업로드 ──
console.log('═══ Step 8: 노션 재업로드 ═══');
try {
  const notion = await import('../agents/notion-connector.js');
  const pageId = '3066efb1-2186-808e-a5a6-c77e2ffd977c';
  const pngPaths = cards.map((_, i) =>
    join(OUTPUT_DIR, `card-${String(i + 1).padStart(2, '0')}.png`)
  );

  await notion.appendFilePaths(
    pageId,
    pngPaths,
    '[올인원 고등 3-6] 이화여대 의대 합격 후기',
    academy.name,
    academy.drive_folder_id,
    htmlSources
  );
  console.log(`  ✅ PNG ${pngPaths.length}장 노션 업로드 완료`);
} catch (err) {
  console.log(`  ❌ 노션 업로드 실패: ${err.message}`);
}

console.log('\n═══ 전체 완료! ═══');
