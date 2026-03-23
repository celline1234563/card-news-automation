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

const card4Html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<style>
:root {
  --color-primary: #1a2357;
  --color-accent: #ff871e;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1080px; height: 1350px;
  font-family: 'Noto Sans KR', sans-serif;
  word-break: keep-all;
  background: var(--color-primary);
  color: #FFFFFF;
  display: flex; flex-direction: column;
}

.container {
  flex: 1; display: flex; flex-direction: column;
  justify-content: flex-start;
  padding: 80px 56px 24px;
  text-align: left;
}

.title-tag {
  font-size: 36px; font-weight: 900;
  color: var(--color-accent);
  margin-bottom: 12px;
}

.subtitle {
  font-size: 26px; font-weight: 400;
  color: rgba(255,255,255,0.7);
  line-height: 1.45;
  margin-bottom: 32px;
}

.body-text {
  font-size: 24px; font-weight: 700;
  color: rgba(255,255,255,0.85);
  margin-bottom: 24px;
}

/* 학교 데이터 테이블 */
.school-section {
  margin-bottom: 28px;
}

.school-name {
  font-size: 32px; font-weight: 900;
  color: var(--color-accent);
  margin-bottom: 12px;
  display: flex; align-items: center; gap: 12px;
}
.school-name .badge {
  background: var(--color-accent);
  color: #FFFFFF;
  font-size: 18px; font-weight: 700;
  padding: 4px 14px;
  border-radius: 20px;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 12px;
  overflow: hidden;
}
.data-table thead th {
  background: rgba(255,255,255,0.12);
  font-size: 20px; font-weight: 700;
  padding: 12px 10px;
  text-align: center;
  color: rgba(255,255,255,0.7);
  border-bottom: 2px solid rgba(255,255,255,0.1);
}
.data-table thead th:first-child {
  text-align: left; padding-left: 16px;
}
.data-table tbody td {
  font-size: 22px; font-weight: 400;
  padding: 11px 10px;
  text-align: center;
  color: rgba(255,255,255,0.85);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.data-table tbody td:first-child {
  text-align: left; padding-left: 16px;
  font-weight: 700; color: #FFFFFF;
}
.data-table tbody tr:last-child td {
  border-bottom: none;
}

/* A등급 강조 */
.highlight-a {
  color: var(--color-accent);
  font-weight: 900;
}

/* 하단 인사이트 */
.insight-box {
  background: rgba(255,107,0,0.1);
  border-left: 5px solid var(--color-accent);
  border-radius: 0 12px 12px 0;
  padding: 20px 24px;
  margin-top: auto;
  margin-bottom: 16px;
}
.insight-box p {
  font-size: 26px; font-weight: 700;
  line-height: 1.5;
  color: #FFFFFF;
}
.insight-box .accent {
  color: var(--color-accent);
}

.brand-bar {
  width: 100%; height: 100px;
  background: rgba(0,0,0,0.15);
  display: flex; align-items: center; justify-content: center;
}
.brand-bar img { height: 36px; object-fit: contain; }
</style>
</head>
<body>
<div class="container">
  <div class="title-tag">2025학년도 1학년 1학기 성취도</div>
  <div class="subtitle">인근 고등학교 성적 분포를 비교해봤습니다<br>같은 과목이라도 학교마다 등급 비율은 다릅니다</div>
  <div class="body-text">주요 과목 성취도별 분포비율 (%)</div>

  <!-- 독산고 -->
  <div class="school-section">
    <div class="school-name"><span class="badge">독산고</span> 평균 성적 현황</div>
    <table class="data-table">
      <thead>
        <tr><th>과목</th><th>평균</th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th></tr>
      </thead>
      <tbody>
        <tr><td>공통국어1</td><td>63.3</td><td class="highlight-a">41.2</td><td>19.4</td><td>20.6</td><td>7.9</td><td>10.9</td></tr>
        <tr><td>공통수학1</td><td>61.8</td><td class="highlight-a">29.7</td><td>27.9</td><td>26.1</td><td>10.9</td><td>5.5</td></tr>
        <tr><td>공통영어1</td><td>61.0</td><td class="highlight-a">35.2</td><td>15.2</td><td>22.4</td><td>13.9</td><td>13.3</td></tr>
      </tbody>
    </table>
  </div>

  <!-- 금천고 -->
  <div class="school-section">
    <div class="school-name"><span class="badge">금천고</span> 평균 성적 현황</div>
    <table class="data-table">
      <thead>
        <tr><th>과목</th><th>평균</th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th></tr>
      </thead>
      <tbody>
        <tr><td>공통국어1</td><td>69.8</td><td class="highlight-a">34.2</td><td>27.4</td><td>16.8</td><td>12.1</td><td>9.5</td></tr>
        <tr><td>공통수학1</td><td>64.2</td><td class="highlight-a">16.3</td><td>23.7</td><td>17.4</td><td>37.9</td><td>4.7</td></tr>
        <tr><td>공통영어1</td><td>62.3</td><td class="highlight-a">26.3</td><td>23.2</td><td>24.2</td><td>17.4</td><td>8.9</td></tr>
      </tbody>
    </table>
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
  await page.setContent(card4Html, { waitUntil: 'load', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(OUTPUT_DIR, 'card-04.png'), type: 'png' });
  console.log('card-04.png 저장 완료');

  copyData.cards[3].generated_html = card4Html;
  await writeFile(copyPath, JSON.stringify(copyData, null, 2), 'utf-8');
  console.log('copy.json 업데이트 완료');
} finally {
  await browser.close();
}
