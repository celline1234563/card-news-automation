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

const card6Html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<style>
:root {
  --color-primary: #081459;
  --color-accent: #ff871e;
  --color-background: #F5F6FA;
  --color-text: #1A1A2E;
  --color-highlight: #FFE0C0;
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
  justify-content: flex-start;
  padding: 60px 60px 24px;
}

.headline {
  font-size: 96px; font-weight: 900;
  line-height: 1.15; color: var(--color-text);
  margin-bottom: 20px;
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
  color: #555; line-height: 1.45;
  margin-bottom: 56px;
}

.checklist {
  display: flex; flex-direction: column;
  gap: 32px;
}

.check-item {
  display: flex; align-items: center;
  gap: 20px;
  background: #FFFFFF;
  border-radius: 16px;
  padding: 28px 32px;
  box-shadow: 0 2px 8px rgba(8,20,89,0.06);
}

.check-icon {
  width: 52px; height: 52px;
  border-radius: 50%;
  background: var(--color-accent);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.check-icon svg {
  width: 28px; height: 28px;
  fill: none; stroke: #FFFFFF; stroke-width: 2.5;
  stroke-linecap: round; stroke-linejoin: round;
}

.check-text {
  font-size: 32px; font-weight: 700;
  color: var(--color-text);
  line-height: 1.3;
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
  <h1 class="headline"><em>내신 격차</em> 극복 전략</h1>
  <p class="subtext">학교 상관없이 1등급 받는<br>검증된 학습 방법들 진학학원이 제시합니다</p>

  <div class="checklist">
    <div class="check-item">
      <div class="check-icon"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
      <span class="check-text">학교별 기출문제 철저 분석</span>
    </div>
    <div class="check-item">
      <div class="check-icon"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
      <span class="check-text">담당 선생님 출제 패턴 파악</span>
    </div>
    <div class="check-item">
      <div class="check-icon"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
      <span class="check-text">상위권 학생들 학습법 벤치마킹</span>
    </div>
    <div class="check-item">
      <div class="check-icon"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
      <span class="check-text">서술형 채점 기준 미리 확인</span>
    </div>
    <div class="check-item">
      <div class="check-icon"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
      <span class="check-text">시험 범위별 난이도 예측 훈련</span>
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
  await page.setContent(card6Html, { waitUntil: 'load', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(OUTPUT_DIR, 'card-06.png'), type: 'png' });
  console.log('card-06.png 저장 완료');

  copyData.cards[5].generated_html = card6Html;
  await writeFile(copyPath, JSON.stringify(copyData, null, 2), 'utf-8');
  console.log('copy.json 업데이트 완료');
} finally {
  await browser.close();
}
