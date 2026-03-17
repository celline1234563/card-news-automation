import 'dotenv/config';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFile, writeFile } from 'fs/promises';
import { loadConfig } from '../agents/config-loader.js';
import { harmonizeAndDesign } from '../agents/series-harmonizer.js';
import { validateAll } from '../agents/design-validator.js';
import { renderCards } from '../agents/renderer.js';
import { qaAndRegenerate } from '../agents/visual-qa.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const ACADEMY_KEY = 'ollinone';
const SOURCE_DIR = join(ROOT, 'output', '올인원 수학학원-과제-이행률-100--시스템-2026-03-16');
const today = new Date().toISOString().slice(0, 10);
const OUTPUT_DIR = join(ROOT, 'output', `올인원 수학학원-과제-이행률-100--재디자인-${today}`);

// ── 기존 copy.json 로드 ──
console.log('═══════════════════════════════════════════');
console.log('  올인원 중등 3-3 재디자인 (개선 프롬프트 적용 + 로고)');
console.log('═══════════════════════════════════════════');

const copyData = JSON.parse(await readFile(join(SOURCE_DIR, 'copy.json'), 'utf-8'));
console.log(`  카드 ${copyData.cards.length}장 로드 완료`);

// 기존 generated_html 초기화 (재생성을 위해)
for (const card of copyData.cards) {
  card.generated_html = null;
  card.layout_used = null;
}
console.log('  기존 HTML 초기화 완료\n');

// ── Stage 0: 설정 로드 ──
console.log('▶ Stage 0: 학원 설정 로드');
const { academy, cssVariables } = await loadConfig(ACADEMY_KEY);
console.log(`  ✅ ${academy.name} 설정 로드 완료\n`);

// ── Stage 5: 시리즈 하모나이저 + HTML 디자인 (업데이트된 프롬프트) ──
console.log('▶ Stage 5: 시리즈 하모나이저 + HTML 디자인 (개선 프롬프트 적용)');
await harmonizeAndDesign(copyData.cards, cssVariables, academy, { academyKey: ACADEMY_KEY });
console.log('');

// ── Stage 5.5: HTML 품질 검증 ──
console.log('▶ Stage 5.5: HTML 품질 검증');
await validateAll(copyData.cards);
console.log('');

// ── Stage 6: PNG 렌더링 (로고 포함) ──
console.log(`▶ Stage 6: PNG 렌더링 (로고 포함)`);
console.log(`  출력 폴더: ${OUTPUT_DIR}`);
const { htmlSources } = await renderCards(copyData.cards, cssVariables, academy.name, OUTPUT_DIR, ACADEMY_KEY);
console.log('');

// copy.json 저장
await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('  ✅ copy.json 저장 완료');

// ── Stage 7: PNG 비주얼 QA ──
console.log('');
console.log('▶ Stage 7: PNG 비주얼 QA');
try {
  const qaResult = await qaAndRegenerate(copyData.cards, cssVariables, academy, OUTPUT_DIR, { academyKey: ACADEMY_KEY });
  const regenerated = copyData.cards.filter(c => c._regenerated);
  if (regenerated.length > 0) {
    console.log(`  🔄 ${regenerated.length}장 재렌더링...`);
    await renderCards(copyData.cards, cssVariables, academy.name, OUTPUT_DIR, ACADEMY_KEY);
    regenerated.forEach(c => delete c._regenerated);
  }
  // 최종 copy.json 저장
  await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
} catch (err) {
  console.log(`  ⚠️ QA 스킵: ${err.message}`);
}

console.log('');
console.log('═══════════════════════════════════════════');
console.log('  ✅ 재디자인 완료!');
console.log(`  출력: ${OUTPUT_DIR}`);
console.log('═══════════════════════════════════════════');
