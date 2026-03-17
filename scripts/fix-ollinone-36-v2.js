import 'dotenv/config';
import { copyFile, readFile, writeFile } from 'fs/promises';
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
const OUTPUT_DIR = join(ROOT, 'output', '올인원 수학학원-이화여대-의대-합격-후기-2026-03-12');
const REFS_DIR = join(ROOT, 'config', 'references', 'ollinone');
const PAGE_ID = '3066efb1-2186-808e-a5a6-c77e2ffd977c';

// ── Step 1: 레퍼런스 이미지 세팅 (더 세밀한 매핑) ──
console.log('═══ Step 1: 레퍼런스 이미지 세팅 ═══');
const refMapping = [
  { src: '올인원_후기0.png', dests: ['hook-01.png', 'insight-01.png'] },
  { src: '올인원_후기1.png', dests: ['solution-01.png', 'problem-01.png'] },
  { src: '올인원_후기2.png', dests: ['example-01.png', 'summary-01.png'] },
  { src: '올인원_후기3.png', dests: ['cta-01.png', 'data-01.png'] },
];
for (const { src, dests } of refMapping) {
  for (const dest of dests) {
    await copyFile(join(ROOT, 'reference', src), join(REFS_DIR, dest));
    console.log(`  📎 ${src} → ${dest}`);
  }
}
console.log('  ✅ 레퍼런스 세팅 완료\n');

// ── Step 2: 기존 copy.json 로드 + 수정 ──
console.log('═══ Step 2: 카드 데이터 수정 ═══');
const copyJson = JSON.parse(await readFile(join(OUTPUT_DIR, 'copy.json'), 'utf-8'));
const cards = copyJson.cards;

for (const card of cards) {
  // 기존 HTML/배경 제거 (재디자인)
  delete card.generated_html;
  delete card.layout_used;

  // Imagen 배경이미지 제거 (남학생/어두운 표정 문제)
  card.bg_image_url = null;

  // 디자인 브리프에 여학생+밝은 톤 명시
  if (card.design_brief) {
    card.design_brief = card.design_brief
      .replace(/남학생/g, '여학생')
      .replace(/학생/g, '여학생');
  }

  // 이미지 카테고리가 학생사진인 경우 여학생 명시
  if (card.image_category === '학생사진') {
    card.visual_hint = 'illustration';
    card.design_brief = (card.design_brief || '') + ' 여학생 일러스트. 밝고 자신감 있는 표정. 레퍼런스 이미지 스타일 참고.';
  }
}

console.log('  🔧 전체 카드: Imagen 배경 제거, 여학생+밝은 톤 지정');
console.log(`  ✅ ${cards.length}장 수정 완료\n`);

// ── Step 3: 학원 설정 ──
const { academy, cssVariables } = await loadConfig('ollinone');

// ── Step 4: 레퍼런스 기반 재디자인 ──
console.log('═══ Step 4: 레퍼런스 기반 재디자인 ═══');
await harmonizeAndDesign(cards, cssVariables, academy, { academyKey: 'ollinone' });
console.log('');

// ── Step 5: HTML 검증 ──
console.log('═══ Step 5: HTML 품질 검증 ═══');
await validateAll(cards);
console.log('');

// ── Step 6: PNG 렌더링 ──
console.log('═══ Step 6: PNG 렌더링 ═══');
const { htmlSources } = await renderCards(cards, cssVariables, academy.name, OUTPUT_DIR);
console.log('');

// ── Step 7: QA ──
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

// ── Step 8: 노션 업로드 ──
console.log('═══ Step 8: 노션 업로드 ═══');
const pngPaths = cards.map((_, i) =>
  join(OUTPUT_DIR, `card-${String(i + 1).padStart(2, '0')}.png`)
);
await appendFilePaths(PAGE_ID, pngPaths, '[올인원 고등 3-6] 이화여대 의대 합격 후기', academy.name, academy.drive_folder_id, htmlSources);
console.log(`  ✅ PNG ${pngPaths.length}장 노션 업로드 완료`);
await setStatus(PAGE_ID, '디자인 1차');
console.log('  ✅ 상태 → 디자인 1차');
console.log('\n═══ 완료! ═══');
