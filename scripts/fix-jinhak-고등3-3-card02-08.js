import 'dotenv/config';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const OUTPUT_DIR = join(ROOT, 'output', '진학학원-우리학교-내신--옆-학교보다-어렵다----인근-고등학교-2026-03-20');

// ── 로고 로드 ──
const logoBuf = await readFile(join(ROOT, 'config', 'logos', 'jinhak.png'));
const logoDataUri = `data:image/png;base64,${logoBuf.toString('base64')}`;

// ── 배경 이미지 로드 (카드2용 — 공부하는 남학생) ──
const bg02Buf = await readFile(join(ROOT, 'temp', 'bg-02-unconfident.png'));
const bg02DataUri = `data:image/png;base64,${bg02Buf.toString('base64')}`;

// ── copy.json 로드 ──
const copyPath = join(OUTPUT_DIR, 'copy.json');
const copyData = JSON.parse(await readFile(copyPath, 'utf-8'));

// ════════════════════════════════════════════
// 카드 2 — 배경 사진 교체 (bg-02-unconfident.png)
// ════════════════════════════════════════════
const card2Html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<style>
:root {
  --color-primary: #081459;
  --color-secondary: #ff871e;
  --color-background: #F5F6FA;
  --color-text: #1A1A2E;
  --color-highlight: #FFE0C0;
  --color-accent: #ff871e;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1080px; height: 1350px;
  font-family: 'Noto Sans KR', sans-serif;
  word-break: keep-all;
  background: var(--color-background);
  color: var(--color-text);
  position: relative;
}

.bg-image-overlay {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background-image: url('${bg02DataUri}');
  background-size: cover; background-position: center;
  opacity: 0.18; z-index: 0;
}

.main-content {
  position: relative; z-index: 1;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  height: calc(100% - 100px);
  padding: 60px;
  text-align: center;
}

.headline {
  font-size: 80px; font-weight: 900;
  line-height: 1.15; margin-bottom: 32px;
  max-width: 90%;
}
.headline em {
  color: var(--color-primary);
  font-style: normal; font-weight: 900;
  font-size: 110%;
  display: inline;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}

.subtext {
  font-size: 28px; font-weight: 400;
  line-height: 1.5; color: #6B7280;
  margin-bottom: 64px;
}

.speech-bubble-container {
  background: #FFFFFF;
  border-radius: 24px;
  padding: 48px 56px;
  max-width: 820px;
  box-shadow: 0 4px 24px rgba(8,20,89,0.1);
  text-align: center;
}
.speech-icon-wrapper {
  width: 72px; height: 72px;
  border-radius: 50%;
  background-color: var(--color-secondary);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 28px auto;
}
.speech-icon-wrapper svg {
  width: 36px; height: 36px;
  fill: none; stroke: #fff; stroke-width: 2;
  stroke-linecap: round; stroke-linejoin: round;
}

.quote-text {
  font-size: 30px; font-weight: 700;
  line-height: 1.4; color: var(--color-text);
  margin-bottom: 16px;
}
.quote-response {
  font-size: 26px; font-weight: 400;
  line-height: 1.3; color: #6B7280;
}

.brand-bar {
  position: absolute; bottom: 0; left: 0;
  width: 100%; height: 100px;
  background: var(--color-primary);
  display: flex; align-items: center; justify-content: center;
  z-index: 1;
}
.brand-bar img { height: 36px; object-fit: contain; }
</style>
</head>
<body>
<div class="bg-image-overlay"></div>
<div class="main-content">
  <h1 class="headline">우리 아이만 <em>불공평하게</em><br>당하는 건 아닐까</h1>
  <p class="subtext">학부모들이 가장 궁금해하는<br>진짜 이야기를 들어봤습니다<br>실제 상황은 어떨까요?</p>
  <div class="speech-bubble-container">
    <div class="speech-icon-wrapper">
      <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    </div>
    <p class="quote-text">"옆 학교는 100점 막 나온다던데<br>우리 애만 90점도 힘들어해요"</p>
    <p class="quote-response">"그런 생각 너무 당연해요"</p>
  </div>
</div>
<div class="brand-bar"><img src="${logoDataUri}" /></div>
</body></html>`;

// ════════════════════════════════════════════
// 카드 8 — 성과 그리드 텍스트 잘림 수정
// ════════════════════════════════════════════
const card8Html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<style>
:root {
  --color-primary: #081459;
  --color-secondary: #ff871e;
  --color-accent: #ff871e;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1080px; height: 1350px;
  font-family: 'Noto Sans KR', sans-serif;
  word-break: keep-all;
  background: var(--color-primary);
  color: #FFFFFF;
  position: relative;
}

.container {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  padding: 60px; padding-bottom: 0;
}

h1 {
  font-size: 76px; font-weight: 900;
  line-height: 1.15;
  margin-bottom: 16px;
  position: relative; z-index: 1;
}
h1 em {
  color: var(--color-accent);
  font-style: normal; font-weight: 900;
}

.subtext {
  font-size: 26px; line-height: 1.45;
  color: rgba(255,255,255,0.7);
  margin-bottom: 48px;
  position: relative; z-index: 1;
}

.achievement-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 32px;
  flex: 1;
  padding-bottom: 24px;
  position: relative; z-index: 1;
}

.achievement-item {
  background: rgba(255,255,255,0.06);
  border-radius: 20px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center;
  padding: 32px 24px;
}

.achievement-item .icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.achievement-item .title {
  font-size: 56px; font-weight: 900;
  color: var(--color-accent);
  line-height: 1.2;
  margin-bottom: 10px;
}

.achievement-item .desc {
  font-size: 24px; font-weight: 400;
  color: rgba(255,255,255,0.65);
  line-height: 1.3;
}

.brand-bar {
  width: 100%; height: 100px;
  background: var(--color-primary);
  border-top: 3px solid var(--color-accent);
  display: flex; align-items: center; justify-content: center;
  position: relative; z-index: 1;
}
.brand-bar img { height: 36px; object-fit: contain; }

/* 장식 */
.deco-circle {
  position: absolute; border-radius: 50%;
  background: var(--color-accent);
  pointer-events: none;
}
.deco-circle.top-right {
  top: -80px; right: -80px;
  width: 300px; height: 300px; opacity: 0.06;
}
.deco-circle.bottom-left {
  bottom: 120px; left: -100px;
  width: 350px; height: 350px; opacity: 0.04;
}
</style>
</head>
<body>
<div class="deco-circle top-right"></div>
<div class="deco-circle bottom-left"></div>

<div class="container">
  <h1><em>진학학원</em> 2025년 실제 성과</h1>
  <p class="subtext">
    문일고 · 동일고 · 금천고 · 독산고<br>
    다양한 학교에서 검증된 결과<br>
    이제 우리가 증명합니다
  </p>

  <div class="achievement-grid">
    <div class="achievement-item">
      <div class="icon">🏆</div>
      <div class="title">1등급 128명</div>
      <div class="desc">2025년 1학기 종합 기준</div>
    </div>
    <div class="achievement-item">
      <div class="icon">🎯</div>
      <div class="title">서울대 5명</div>
      <div class="desc">2026 대입 수시 지원</div>
    </div>
    <div class="achievement-item">
      <div class="icon">💯</div>
      <div class="title">올백 44명</div>
      <div class="desc">중등부 연간 누적</div>
    </div>
    <div class="achievement-item">
      <div class="icon">📈</div>
      <div class="title">17명 강사진</div>
      <div class="desc">과목별 전문가 시스템</div>
    </div>
  </div>
</div>

<div class="brand-bar"><img src="${logoDataUri}" /></div>
</body></html>`;

// ── 렌더링 ──
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350 });

  // 카드 2
  console.log('=== 카드 2 렌더링 (배경 사진 교체) ===');
  await page.setContent(card2Html, { waitUntil: 'load', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(OUTPUT_DIR, 'card-02.png'), type: 'png' });
  console.log('  card-02.png 저장 완료');

  // 카드 8
  console.log('=== 카드 8 렌더링 (그리드 수정) ===');
  await page.setContent(card8Html, { waitUntil: 'load', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(OUTPUT_DIR, 'card-08.png'), type: 'png' });
  console.log('  card-08.png 저장 완료');

  await page.close();

  // copy.json 업데이트
  copyData.cards[1].generated_html = card2Html;
  copyData.cards[1].bg_image_url = join(ROOT, 'temp', 'bg-02-unconfident.png');
  copyData.cards[7].generated_html = card8Html;
  await writeFile(copyPath, JSON.stringify(copyData, null, 2), 'utf-8');
  console.log('  copy.json 업데이트 완료');
} finally {
  await browser.close();
}

console.log('\n=== 완료 ===');
