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

const card5Html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<style>
:root {
  --color-primary: #081459;
  --color-secondary: #ff871e;
  --color-background: #FFFFFF;
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
  align-items: flex-start;
  justify-content: flex-start;
  padding: 60px;
}

/* 제목 */
.headline {
  margin-top: 20px;
  font-size: 28px;
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: 2px;
  text-transform: uppercase;
  text-align: left;
}

/* 메인 타이틀 */
.main-title {
  margin-top: 12px;
  font-size: 76px; font-weight: 900;
  line-height: 1.15;
  color: var(--color-text);
  text-align: left;
}
.main-title em {
  background: linear-gradient(to top, var(--color-highlight) 35%, transparent 35%);
  font-style: normal; font-weight: 900;
  padding: 2px 6px;
  display: inline;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  color: var(--color-primary);
}

/* 부제목 */
.subtext {
  margin-top: 12px;
  font-size: 26px; font-weight: 400;
  line-height: 1.45; color: #6B7280;
  text-align: left;
}

/* 콘텐츠 목록 */
.steps-container {
  margin-top: 60px;
  display: flex; flex-direction: column;
  gap: 36px;
  width: 100%;
  padding-left: 20px;
  position: relative;
}

.steps-container::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  background: var(--color-primary);
  opacity: 0.12;
  border-radius: 4px;
}

.step-item {
  display: flex; align-items: center;
  gap: 28px;
  text-align: left;
  position: relative;
}

.step-icon {
  width: 72px; height: 72px;
  border-radius: 50%;
  background: var(--color-primary);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  z-index: 2;
}
.step-icon svg {
  width: 36px; height: 36px;
  fill: none; stroke: #FFFFFF; stroke-width: 2;
  stroke-linecap: round; stroke-linejoin: round;
}

.step-content h3 {
  font-size: 34px; font-weight: 900;
  color: var(--color-text);
  margin-bottom: 6px; line-height: 1.2;
}
.step-content p {
  font-size: 26px; font-weight: 400;
  color: #6B7280; line-height: 1.3;
}

/* 장식 */
.deco-circle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
.deco-circle.top-left {
  top: -60px; left: -60px;
  width: 220px; height: 220px;
  background: var(--color-accent); opacity: 0.07;
}
.deco-icon-bg {
  position: absolute;
  bottom: 120px; right: -40px;
  width: 300px; height: 300px;
  opacity: 0.05;
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
<div class="container" style="position: relative;">
  <div class="deco-circle top-left"></div>

  <div class="headline">학교별 내신 비교</div>
  <h1 class="main-title"><em>내신 차이</em> 발생 원리</h1>
  <p class="subtext">왜 이런 차이가 생기는지 체계적으로 분석해봤습니다<br>원인을 알아야 대응 가능</p>

  <div class="steps-container">
    <div class="step-item">
      <div class="step-icon">
        <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      </div>
      <div class="step-content">
        <h3>학생 구성</h3>
        <p>상위권 집중도가 등급컷 좌우</p>
      </div>
    </div>
    <div class="step-item">
      <div class="step-icon">
        <svg viewBox="0 0 24 24"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
      </div>
      <div class="step-content">
        <h3>출제 성향</h3>
        <p>교사별 문제 난이도 편차</p>
      </div>
    </div>
    <div class="step-item">
      <div class="step-icon">
        <svg viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 4 3 6 3s6-1 6-3v-5"/></svg>
      </div>
      <div class="step-content">
        <h3>교육 환경</h3>
        <p>사교육 접근성과 학습 자원</p>
      </div>
    </div>
    <div class="step-item">
      <div class="step-icon">
        <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
      </div>
      <div class="step-content">
        <h3>학교 정책</h3>
        <p>성적 관리 시스템 차이</p>
      </div>
    </div>
  </div>

  <svg class="deco-icon-bg" viewBox="0 0 24 24" fill="none" stroke="#081459" stroke-width="1">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
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
  await page.setContent(card5Html, { waitUntil: 'load', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(OUTPUT_DIR, 'card-05.png'), type: 'png' });
  console.log('card-05.png 저장 완료');

  copyData.cards[4].generated_html = card5Html;
  await writeFile(copyPath, JSON.stringify(copyData, null, 2), 'utf-8');
  console.log('copy.json 업데이트 완료');
} finally {
  await browser.close();
}
