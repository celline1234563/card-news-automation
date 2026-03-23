import 'dotenv/config';
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const OUTPUT_DIR = join(ROOT, 'output', '진학학원-우리학교-내신--옆-학교보다-어렵다----인근-고등학교-2026-03-20');

const logoBuf = await readFile(join(ROOT, 'config', 'logos', 'jinhak.png'));
const logoDataUri = `data:image/png;base64,${logoBuf.toString('base64')}`;

const copyPath = join(OUTPUT_DIR, 'copy.json');
const copyData = JSON.parse(await readFile(copyPath, 'utf-8'));

const card3Html = `<!DOCTYPE html>
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
  display: flex; flex-direction: column;
}

.container {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; padding: 60px;
  position: relative;
}

.content-wrapper {
  flex: 1; display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  width: 100%; z-index: 1;
}

.headline-area {
  text-align: center; margin-bottom: 56px;
}

.headline {
  font-size: 96px; font-weight: 900;
  line-height: 1.15; color: var(--color-text);
}
.headline em {
  background: linear-gradient(to top, var(--color-highlight) 35%, transparent 35%);
  font-style: normal; font-weight: 900;
  padding: 2px 6px;
  display: inline;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  color: var(--color-primary);
}

.subtext {
  font-size: 28px; font-weight: 700;
  line-height: 1.4; color: #555;
  margin-top: 24px;
}

.grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  width: 100%; max-width: 920px;
}

.grid-item {
  background: #FFFFFF;
  border-radius: 24px;
  padding: 40px 36px;
  box-shadow: 0 2px 8px rgba(8,20,89,0.08);
  display: flex; flex-direction: column;
  align-items: flex-start;
}

.icon-circle {
  width: 80px; height: 80px;
  border-radius: 50%;
  background: var(--color-primary);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px;
}
.icon-circle svg {
  width: 40px; height: 40px;
  fill: none; stroke: #FFFFFF; stroke-width: 2;
  stroke-linecap: round; stroke-linejoin: round;
}

.grid-item .title {
  font-size: 34px; font-weight: 900;
  color: var(--color-text);
  margin-bottom: 8px; line-height: 1.2;
}
.grid-item .desc {
  font-size: 26px; font-weight: 400;
  color: #555; line-height: 1.3;
}

/* 장식 삼각형 */
.deco-triangle {
  position: absolute;
  top: 32%; left: 50%;
  transform: translate(-50%, -50%);
  width: 220px; height: 220px;
  opacity: 0.06; z-index: 0;
}

.brand-bar {
  width: 100%; height: 100px;
  background: var(--color-primary);
  display: flex; align-items: center; justify-content: center;
}
.brand-bar img { height: 36px; object-fit: contain; }
</style>
</head>
<body>
<div class="container">
  <svg class="deco-triangle" viewBox="0 0 24 24" fill="none" stroke="#ff871e" stroke-width="1.5">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
  </svg>
  <div class="content-wrapper">
    <div class="headline-area">
      <h1 class="headline"><em>똑같은 1등급</em>인데<br>왜 이렇게 다를까</h1>
      <p class="subtext">학교별 내신의 숨겨진 차이<br>우리가 몰랐던 진실들<br>지금 확인해보세요</p>
    </div>

    <div class="grid-container">
      <div class="grid-item">
        <div class="icon-circle">
          <svg viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
        </div>
        <h3 class="title">시험 난이도</h3>
        <p class="desc">학교마다 출제 수준이 달라</p>
      </div>
      <div class="grid-item">
        <div class="icon-circle">
          <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <h3 class="title">학생 구성</h3>
        <p class="desc">상위권 밀집도 차이 존재</p>
      </div>
      <div class="grid-item">
        <div class="icon-circle">
          <svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        </div>
        <h3 class="title">출제 방향</h3>
        <p class="desc">교과서 vs 심화문제</p>
      </div>
      <div class="grid-item">
        <div class="icon-circle">
          <svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18M8 8l8 8M16 8l-8 8"/></svg>
        </div>
        <h3 class="title">채점 기준</h3>
        <p class="desc">서술형 감점 폭이 다름</p>
      </div>
    </div>
  </div>
</div>
<div class="brand-bar"><img src="${logoDataUri}" /></div>
</body></html>`;

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350 });
  await page.setContent(card3Html, { waitUntil: 'load', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(OUTPUT_DIR, 'card-03.png'), type: 'png' });
  console.log('card-03.png 저장 완료');

  copyData.cards[2].generated_html = card3Html;
  await writeFile(copyPath, JSON.stringify(copyData, null, 2), 'utf-8');
  console.log('copy.json 업데이트 완료');
} finally {
  await browser.close();
}
