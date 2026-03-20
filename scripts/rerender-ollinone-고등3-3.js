import 'dotenv/config';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFile, writeFile } from 'fs/promises';
import { loadConfig } from '../agents/config-loader.js';
import { renderCards } from '../agents/renderer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const ACADEMY_KEY = 'ollinone';
const OUTPUT_DIR = join(ROOT, 'output', '올인원 수학학원-내신1등급-재디자인-2026-03-18');

console.log('═══ 올인원 고등3-3 재렌더링 (로고 수정 + em 색상 수정) ═══');

// copy.json 로드
const copyData = JSON.parse(await readFile(join(OUTPUT_DIR, 'copy.json'), 'utf-8'));
console.log(`  카드 ${copyData.cards.length}장 로드 완료`);

// 학원 설정 로드
const { academy, cssVariables } = await loadConfig(ACADEMY_KEY);
console.log(`  ${academy.name} 설정 로드 완료`);

// em 하이라이트 텍스트 색상 수정 (다크 배경 카드에서 흰색으로)
for (const card of copyData.cards) {
  if (!card.generated_html) continue;
  const html = card.generated_html;

  // 다크 배경 감지
  const isDark = /body\s*\{[^}]*background[^}]*(?:var\(--color-primary\)|var\(--color-text\)|#[0-3][0-9a-fA-F]{5})/s.test(html);
  if (isDark) {
    card.generated_html = html.replace(/([\w\s.*#\->:,]*\bem\b[^{]*)\{([^}]+)\}/g, (match, selector, styles) => {
      if (!/\bem\b/.test(selector)) return match;
      let corrected = styles;
      if (/color\s*:/.test(corrected)) {
        corrected = corrected.replace(/color\s*:[^;]+;?/g, 'color: #FFFFFF;');
      } else {
        corrected += '\n      color: #FFFFFF;';
      }
      return `${selector}{${corrected}}`;
    });
    console.log(`  카드 ${String(card.number).padStart(2, '0')}: 다크 배경 → em 색상 #FFFFFF`);
  }
}

// PNG 렌더링 (수정된 로고 로직 적용)
console.log(`\n▶ PNG 렌더링 (로고 1개만 + em 흰색)`);
console.log(`  출력 폴더: ${OUTPUT_DIR}`);
await renderCards(copyData.cards, cssVariables, academy.name, OUTPUT_DIR, ACADEMY_KEY);

// copy.json 저장
await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');

console.log('\n═══ 완료! ═══');
