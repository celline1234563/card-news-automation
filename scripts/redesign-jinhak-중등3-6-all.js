import 'dotenv/config';
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const OUTPUT_DIR = join(ROOT, 'output', '진학학원-내신대비-본격시작-2026-03-20');
const logoBuf = await readFile(join(ROOT, 'config', 'logos', 'jinhak.png'));
const logoDataUri = `data:image/png;base64,${logoBuf.toString('base64')}`;

const copyPath = join(OUTPUT_DIR, 'copy.json');
const copyData = JSON.parse(await readFile(copyPath, 'utf-8'));

// ── em 색상 일괄 수정 ──
function fixEmColor(html, isDark) {
  if (isDark) {
    // 어두운 배경: em → 주황 accent, 하이라이트 마커 제거
    html = html.replace(
      /em\s*\{[^}]*\}/gs,
      (match) => match
        .replace(/color:\s*#FFFFFF/g, 'color: var(--color-accent)')
        .replace(/background:\s*linear-gradient[^;]+;/g, 'background: none;')
    );
  } else {
    // 밝은 배경: em → 네이비 primary + 하이라이트 마커 유지
    html = html.replace(
      /em\s*\{[^}]*\}/gs,
      (match) => match
        .replace(/color:\s*#FFFFFF/g, 'color: var(--color-primary)')
    );
  }
  return html;
}

// 카드별 배경 분류
const darkCards = [0, 1, 3, 4, 7, 9]; // 1,2,4,5,8,10
const lightCards = [2, 5, 6, 8]; // 3,6,7,9

// ── 전체 em 색상 수정 ──
for (const i of darkCards) {
  copyData.cards[i].generated_html = fixEmColor(copyData.cards[i].generated_html, true);
}
for (const i of lightCards) {
  copyData.cards[i].generated_html = fixEmColor(copyData.cards[i].generated_html, false);
}

// ════════════════════════════════════════════
// 카드 1 — 헤드라인 변경 + 아이콘 수정
// ════════════════════════════════════════════
let card1 = copyData.cards[0].generated_html;
// 헤드라인 변경
card1 = card1.replace(/고1 첫 시험[\s\S]*?충격받았다면/, '고1 첫 시험\n      성공적으로 하고 싶다면?');
// alert-circle 아이콘 → target/rocket 느낌으로
card1 = card1.replace(
  /<i data-lucide="alert-circle"[^>]*><\/i>/g,
  '<i data-lucide="target" style="color: var(--color-accent); width: 64px; height: 64px;"></i>'
);
// 만약 SVG 아이콘이면 교체
card1 = card1.replace(
  /data-lucide="[^"]*"/g,
  'data-lucide="rocket"'
);
copyData.cards[0].generated_html = card1;

// ════════════════════════════════════════════
// 카드 3 — 하단 그리드 텍스트 잘림 수정 (밝은 배경)
// ════════════════════════════════════════════
let card3 = copyData.cards[2].generated_html;
// 그리드 아이템 패딩/폰트 조정
card3 = card3.replace(/\.grid-item-title\s*\{[^}]*\}/gs, (m) =>
  m.replace(/font-size:\s*[^;]+;/, 'font-size: 36px;')
);
card3 = card3.replace(/\.grid-item-desc\s*\{[^}]*\}/gs, (m) =>
  m.replace(/font-size:\s*[^;]+;/, 'font-size: 24px;')
);
// 전체 카드 높이에서 브랜드바 공간 확보
card3 = card3.replace(/padding-bottom:\s*0;?/, 'padding-bottom: 120px;');
copyData.cards[2].generated_html = card3;

// ════════════════════════════════════════════
// 카드 5 — 하단 텍스트 잘림 수정
// ════════════════════════════════════════════
let card5 = copyData.cards[4].generated_html;
card5 = card5.replace(/padding-bottom:\s*0;?/, 'padding-bottom: 120px;');
copyData.cards[4].generated_html = card5;

// ════════════════════════════════════════════
// 카드 8 — 상단 빈 공간 축소
// ════════════════════════════════════════════
let card8 = copyData.cards[7].generated_html;
card8 = card8.replace(
  /justify-content:\s*space-between/g,
  'justify-content: flex-start'
);
card8 = card8.replace(
  /margin-bottom:\s*var\(--space-4xl\)/g,
  'margin-bottom: var(--space-xl)'
);
copyData.cards[7].generated_html = card8;

// ── 저장 ──
await writeFile(copyPath, JSON.stringify(copyData, null, 2), 'utf-8');
console.log('copy.json em 색상 + 카드별 수정 완료');

// ── 전체 렌더링 ──
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350 });

  for (let i = 0; i < 10; i++) {
    const html = copyData.cards[i].generated_html;
    await page.setContent(html, { waitUntil: 'load', timeout: 120000 });
    await page.evaluate(() => document.fonts.ready);
    const filepath = join(OUTPUT_DIR, `card-${String(i + 1).padStart(2, '0')}.png`);
    await page.screenshot({ path: filepath, type: 'png' });
    console.log(`card-${String(i + 1).padStart(2, '0')}.png 완료`);
  }
  await page.close();
} finally {
  await browser.close();
}

console.log('\n=== 10장 전체 렌더링 완료 ===');
