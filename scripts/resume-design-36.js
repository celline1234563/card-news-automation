import 'dotenv/config';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from '../agents/config-loader.js';
import { harmonizeAndDesign } from '../agents/series-harmonizer.js';
import { validateAll } from '../agents/design-validator.js';
import { renderCards } from '../agents/renderer.js';
import { qaAndRegenerate } from '../agents/visual-qa.js';
import { appendFilePaths, setStatus } from '../agents/notion-connector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const PAGE_ID = '3066efb1-2186-808e-a5a6-c77e2ffd977c';
const today = new Date().toISOString().slice(0, 10);
const OUTPUT_DIR = join(ROOT, 'output', `올인원 수학학원-이화여대-의대-합격-후기-${today}`);

// ── 기존 copy.json 로드 (기획은 이미 완료됨) ──
console.log('═══ 기존 카드 데이터 로드 ═══');
const copyJson = JSON.parse(await readFile(join(OUTPUT_DIR, 'copy.json'), 'utf-8'));
const cards = copyJson.cards;

// 기존 HTML 제거 (재디자인)
for (const card of cards) {
  delete card.generated_html;
  delete card.layout_used;
}
console.log(`  ✅ 카드 ${cards.length}장 로드\n`);

// ── 학원 설정 ──
const { academy, cssVariables } = await loadConfig('ollinone');

// ── 디자인 (레퍼런스 포함) ──
console.log('═══ 레퍼런스 기반 디자인 ═══');
await harmonizeAndDesign(cards, cssVariables, academy, { academyKey: 'ollinone' });
console.log('');

// ── HTML 검증 ──
console.log('═══ HTML 품질 검증 ═══');
await validateAll(cards);
console.log('');

// ── PNG 렌더링 ──
console.log('═══ PNG 렌더링 ═══');
const { htmlSources } = await renderCards(cards, cssVariables, academy.name, OUTPUT_DIR);
console.log('');

// ── 비주얼 QA ──
console.log('═══ 비주얼 QA ═══');
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

// ── 노션 업로드 ──
console.log('═══ 노션 업로드 ═══');
const pngPaths = cards.map((_, i) =>
  join(OUTPUT_DIR, `card-${String(i + 1).padStart(2, '0')}.png`)
);
await appendFilePaths(PAGE_ID, pngPaths, '[올인원 고등 3-6] 이화여대 의대 합격 후기', academy.name, academy.drive_folder_id, htmlSources);
console.log(`  ✅ PNG ${pngPaths.length}장 노션 업로드 완료`);

await setStatus(PAGE_ID, '디자인 1차');
console.log('  ✅ 상태 → 디자인 1차');
console.log('\n═══ 완료! ═══');
