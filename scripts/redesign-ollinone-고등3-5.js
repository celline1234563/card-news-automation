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
const SOURCE_DIR = join(ROOT, 'output', '올인원 수학학원-경북대-의예과-합격-후기-2026-03-17');
const today = new Date().toISOString().slice(0, 10);
const OUTPUT_DIR = join(ROOT, 'output', `올인원 수학학원-경북대-의예과-합격-후기-재디자인-${today}`);

console.log('═══════════════════════════════════════════');
console.log('  올인원 고등 3-5 의예과 합격 재디자인');
console.log('  하이라이트 직접 background 적용 + 강조색 대비 개선');
console.log('═══════════════════════════════════════════');

const copyData = JSON.parse(await readFile(join(SOURCE_DIR, 'copy.json'), 'utf-8'));
console.log(`  카드 ${copyData.cards.length}장 로드 완료\n`);

// ── 하이라이트 em 스타일 (인라인으로 직접 적용) ──
// 다크 배경: 골드 배경 + 다크 텍스트
const EM_DARK = 'background: #FFD700; color: #1A1A2E; font-style: normal; font-weight: 900; padding: 4px 10px; display: inline; box-decoration-break: clone; -webkit-box-decoration-break: clone; position: relative; z-index: 2;';
// 라이트 배경: 골드 배경 + 다크 텍스트
const EM_LIGHT = 'background: #FFD700; color: #1A1A2E; font-style: normal; font-weight: 900; padding: 4px 10px; display: inline; box-decoration-break: clone; -webkit-box-decoration-break: clone; position: relative; z-index: 2;';
// stat 전용: background-clip:text 오버라이드
const EM_STAT = 'background: #FFD700; color: #1A1A2E; -webkit-text-fill-color: #1A1A2E; -webkit-background-clip: padding-box; background-clip: padding-box; font-style: normal; font-weight: 900; padding: 4px 10px; display: inline; box-decoration-break: clone; -webkit-box-decoration-break: clone; position: relative; z-index: 2;';

/**
 * 헤드라인 HTML에서 특정 텍스트를 em 하이라이트로 감싸기
 */
function wrapWithEm(html, keyword, emStyle) {
  // headline 태그 안에서 키워드를 찾아서 em으로 감싸기
  // 이미 em 태그 안에 있으면 스킵
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?<!<em[^>]*>)${escaped}(?!</em>)`, 'g');
  return html.replace(re, `<em style="${emStyle}">${keyword}</em>`);
}

/**
 * 카드별 하이라이트 적용 맵
 * [카드번호]: { keywords: ['강조할 텍스트'], isDark: true/false }
 */
const highlightMap = {
  1: { keywords: ['경북대 의대 합격'], isDark: true },
  2: { keywords: ['치명적 한계'], isDark: false },
  3: { keywords: ['딜레마'], isDark: false },
  4: { keywords: ['1.8등급'], isDark: true, isStat: true },
  5: { keywords: ['의대 합격'], isDark: false },
  6: { keywords: ['차별화'], isDark: true },
  7: { keywords: ['확실한 변화'], isDark: false },
  8: { keywords: ['실제 성과'], isDark: true },
  9: { keywords: ['의대 합격 공식'], isDark: false },
  10: { keywords: ['시작하세요'], isDark: true },
};

// ── 각 카드에 하이라이트 적용 ──
for (const card of copyData.cards) {
  const map = highlightMap[card.number];
  if (!map || !card.generated_html) continue;

  const emStyle = map.isStat ? EM_STAT : (map.isDark ? EM_DARK : EM_LIGHT);
  let html = card.generated_html;

  for (const keyword of map.keywords) {
    html = wrapWithEm(html, keyword, emStyle);
  }

  // em 태그가 추가되었는지 확인
  const added = html !== card.generated_html;
  card.generated_html = html;
  console.log(`  카드 ${card.number}: ${added ? '✅ 하이라이트 적용' : '⚠️ 키워드 미발견'} [${map.keywords.join(', ')}]`);
}

console.log('');

// ── Stage 0: 설정 로드 ──
console.log('▶ Stage 0: 학원 설정 로드');
const { academy, cssVariables } = await loadConfig(ACADEMY_KEY);
console.log(`  ✅ ${academy.name} 설정 로드 완료\n`);

// ── Stage 6: PNG 렌더링 (로고 포함) ──
console.log(`▶ Stage 6: PNG 렌더링 (로고 포함)`);
console.log(`  출력 폴더: ${OUTPUT_DIR}`);
await renderCards(copyData.cards, cssVariables, academy.name, OUTPUT_DIR, ACADEMY_KEY);
console.log('');

// copy.json 저장
await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('  ✅ copy.json 저장 완료');

console.log('');
console.log('═══════════════════════════════════════════');
console.log('  ✅ 재디자인 완료!');
console.log(`  출력: ${OUTPUT_DIR}`);
console.log('═══════════════════════════════════════════');
