import 'dotenv/config';
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const OUTPUT_DIR = join(ROOT, 'output', '진학학원--진학-고등-3-1--2026-03-11');

// ── 로고 로드 ──
console.log('═══ 로고 로드 ═══');
const logoBuf = await readFile(join(ROOT, 'config', 'logos', 'jinhak.png'));
const logoDataUri = `data:image/png;base64,${logoBuf.toString('base64')}`;
console.log('  ✅ jinhak.png 로고 로드 완료\n');

// ── copy.json 로드 ──
console.log('═══ copy.json 로드 ═══');
const raw = await readFile(join(OUTPUT_DIR, 'copy.json'), 'utf-8');
const copyData = JSON.parse(raw);
console.log(`  카드 ${copyData.cards.length}장 로드 완료\n`);

// ── 카드 1 HTML 작성 ──
console.log('═══ 카드 1 리디자인 ═══');

const card1Html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<style>
:root {
  --navy: #0B1340;
  --orange: #FF6B00;
  --white: #FFFFFF;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1080px;
  height: 1350px;
  background: var(--navy);
  font-family: 'Noto Sans KR', sans-serif;
  color: var(--white);
  position: relative;
  overflow: hidden;
  word-break: keep-all;
  line-height: 1.45;
}

/* ── 배경 데코 링 ── */
.deco-ring {
  position: absolute;
  border-radius: 50%;
  border: 3px solid rgba(255, 107, 0, 0.18);
  pointer-events: none;
}
.ring-lg { width: 560px; height: 560px; bottom: -110px; right: -110px; }
.ring-md { width: 340px; height: 340px; top: 50px; right: -70px; }

/* ── 상단 좌측: 가로형 로고 누끼 ── */
.top-logo {
  position: absolute;
  top: 56px; left: 64px;
  z-index: 10;
  background: rgba(255,255,255,0.95);
  padding: 8px 16px;
  border-radius: 8px;
}
.top-logo img {
  height: 70px;
  object-fit: contain;
}

/* ── 콘텐츠 영역 ── */
.content {
  position: relative;
  padding: 200px 72px 160px;
  display: flex;
  flex-direction: column;
  height: 100%;
  z-index: 5;
}

/* 경고 태그 */
.warning-tag {
  display: inline-block;
  background: var(--orange);
  color: var(--white);
  font-size: 28px;
  font-weight: 700;
  padding: 10px 28px;
  border-radius: 6px;
  margin-bottom: 40px;
  width: fit-content;
  letter-spacing: 1px;
}

/* 메인 헤드라인 */
.headline {
  font-size: 100px;
  font-weight: 900;
  line-height: 1.2;
  margin-bottom: 28px;
}
.headline .accent {
  color: var(--orange);
}

/* 서브카피 */
.sub-copy {
  font-size: 38px;
  font-weight: 400;
  opacity: 0.55;
  margin-bottom: 52px;
  line-height: 1.5;
}

/* 주황 좌측 보더 강조박스 */
.emphasis-box {
  border-left: 6px solid var(--orange);
  padding: 28px 36px;
  font-size: 36px;
  font-weight: 700;
  line-height: 1.7;
  background: rgba(255, 107, 0, 0.07);
  border-radius: 0 10px 10px 0;
  max-width: 720px;
}

/* ── 하단 우측: CTA 원형 화살표 ── */
.cta-circle {
  position: absolute;
  bottom: 64px; right: 64px;
  width: 110px; height: 110px;
  border-radius: 50%;
  background: var(--orange);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  box-shadow: 0 6px 28px rgba(255, 107, 0, 0.45);
}
.cta-circle svg {
  width: 40px; height: 40px;
  fill: none;
  stroke: var(--white);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* ── 하단 좌측: 소형 로고 심볼 ── */
.bottom-logo {
  position: absolute;
  bottom: 40px; left: 64px;
  z-index: 10;
  background: rgba(255,255,255,0.9);
  padding: 6px 12px;
  border-radius: 6px;
}
.bottom-logo img {
  height: 36px;
  object-fit: contain;
}
</style>
</head>
<body>
  <!-- 배경 데코 링 -->
  <div class="deco-ring ring-lg"></div>
  <div class="deco-ring ring-md"></div>

  <!-- 상단 좌측: 가로형 로고 누끼 -->
  <div class="top-logo">
    <img src="${logoDataUri}" />
  </div>

  <!-- 메인 콘텐츠 -->
  <div class="content">
    <div class="warning-tag">지금 바로 확인하세요</div>
    <h1 class="headline"><span class="accent">고3</span>이 되서<br>만든다고?</h1>
    <p class="sub-copy">생기부는 고1부터 누적되는</p>
    <div class="emphasis-box">
      지금 시작 안 하면<br>
      3년이 통째로 날아갑니다
    </div>
  </div>

  <!-- 하단 우측: CTA 원형 화살표 -->
  <div class="cta-circle">
    <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
  </div>

  <!-- 하단 좌측: 소형 로고 심볼 -->
  <div class="bottom-logo">
    <img src="${logoDataUri}" />
  </div>
</body>
</html>`;

// copy.json 카드 1 업데이트
copyData.cards[0].generated_html = card1Html;
await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('  ✅ copy.json 카드 1 업데이트 완료\n');

// ── Puppeteer 렌더링 (카드 1만) ──
console.log('═══ PNG 렌더링 ═══');
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1350 });
await page.setContent(card1Html, { waitUntil: 'load', timeout: 120000 });
await page.evaluate(() => document.fonts.ready);

const outPath = join(OUTPUT_DIR, 'card-01.png');
await page.screenshot({ path: outPath, type: 'png' });
await page.close();
await browser.close();

console.log(`  ✅ card-01.png 저장 완료`);
console.log(`  📁 ${outPath}\n`);

console.log('═══ 완료! ═══');
console.log('카드 1 리디자인 내역:');
console.log('  • 배경: 네이비 #0B1340');
console.log('  • 상단 좌측: 가로형 로고 누끼 (흰색 필터)');
console.log('  • 경고 태그 → 헤드라인 → 서브카피 → 강조박스');
console.log('  • 하단 우측: 주황 원형 CTA 화살표');
console.log('  • 하단 좌측: 소형 로고 심볼 (반투명)');
console.log('  • 데코: 주황 원형 보더 오브젝트 2개');
