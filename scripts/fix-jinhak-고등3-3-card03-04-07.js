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

// ════════════════════════════════════════════
// 카드 3 — em 색상 수정 + 배경 아이콘 삭제
// ════════════════════════════════════════════
const card3Html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<style>
:root {
  --color-primary: #081459;
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
}

.content-wrapper {
  flex: 1; display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  width: 100%;
}

.headline-area { text-align: center; margin-bottom: 56px; }

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

// ════════════════════════════════════════════
// 카드 4 — 여백 tight 배치 (#1a2357 배경)
// ════════════════════════════════════════════
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
  position: relative;
}

.container {
  width: 100%; height: calc(100% - 100px);
  display: flex; flex-direction: column;
  align-items: center;
  padding: 20px 60px 24px;
}

/* 상단 설명문 */
.subtext {
  font-size: 30px; font-weight: 700;
  line-height: 1.45;
  color: rgba(255,255,255,0.75);
  text-align: center;
  margin-bottom: 20px;
}

/* 메인 숫자 */
.stat-number {
  font-size: 40px; font-weight: 400;
  color: rgba(255,255,255,0.7);
  text-align: center;
  letter-spacing: 2px;
}
.stat-big {
  display: block;
  font-size: 180px; font-weight: 900;
  color: var(--color-accent);
  line-height: 1.05;
  letter-spacing: -4px;
}

/* 내신 1.7등급 달성률 */
.stat-label {
  margin-top: 6px;
  font-size: 52px; font-weight: 900;
  color: #FFFFFF;
  text-align: center;
  line-height: 1.15;
}

/* 설명문 */
.stat-desc {
  margin-top: 32px;
  font-size: 30px; font-weight: 400;
  color: rgba(255,255,255,0.8);
  text-align: center;
  line-height: 1.4;
}

/* 하단 차트 */
.chart-section {
  margin-top: 24px;
  display: flex; flex-direction: column;
  align-items: center;
  flex: 1;
  justify-content: flex-end;
  padding-bottom: 20px;
  width: 100%;
}

.chart-label {
  font-size: 22px; font-weight: 700;
  color: rgba(255,255,255,0.5);
  margin-bottom: 16px;
  letter-spacing: 1px;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 20px;
  height: 200px;
  width: 80%; max-width: 600px;
}

.bar-group {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; gap: 8px;
}
.bar {
  width: 100%;
  border-radius: 8px 8px 0 0;
}
.bar-label {
  font-size: 18px; font-weight: 700;
  color: rgba(255,255,255,0.6);
}
.bar-value {
  font-size: 20px; font-weight: 900;
  color: #FFFFFF;
  margin-bottom: 4px;
}

/* 장식 */
.deco-circle {
  position: absolute; border-radius: 50%; pointer-events: none;
}
.deco-circle.tr {
  top: -80px; right: -60px;
  width: 300px; height: 300px;
  background: rgba(255,255,255,0.06);
}
.deco-circle.bl {
  bottom: 140px; left: -40px;
  width: 200px; height: 200px;
  background: rgba(255,255,255,0.04);
}

.brand-bar {
  position: absolute; bottom: 0; left: 0;
  width: 100%; height: 100px;
  background: rgba(0,0,0,0.15);
  display: flex; align-items: center; justify-content: center;
}
.brand-bar img { height: 36px; object-fit: contain; }
</style>
</head>
<body>
<div class="deco-circle tr"></div>
<div class="deco-circle bl"></div>

<div class="container">
  <p class="subtext">
    내신 쉬운 학교라 해도<br>
    실제로는 이 정도밖에 안 돼<br>
    생각보다 훨씬 어려워
  </p>

  <div class="stat-number">
    <span class="stat-big">상위 10%</span>
  </div>
  <h2 class="stat-label">내신 1.7등급 달성률</h2>

  <p class="stat-desc">중학교 때 반에서 2등 수준</p>

  <div class="chart-section">
    <div class="chart-label">학교별 1등급 비율</div>
    <div class="bar-chart">
      <div class="bar-group">
        <div class="bar-value">3%</div>
        <div class="bar" style="height:36px; background:rgba(255,255,255,0.2);"></div>
        <div class="bar-label">A고</div>
      </div>
      <div class="bar-group">
        <div class="bar-value">5%</div>
        <div class="bar" style="height:60px; background:rgba(255,255,255,0.3);"></div>
        <div class="bar-label">B고</div>
      </div>
      <div class="bar-group">
        <div class="bar-value">7%</div>
        <div class="bar" style="height:84px; background:rgba(255,255,255,0.4);"></div>
        <div class="bar-label">C고</div>
      </div>
      <div class="bar-group">
        <div class="bar-value">10%</div>
        <div class="bar" style="height:120px; background:var(--color-accent);"></div>
        <div class="bar-label">평균</div>
      </div>
    </div>
  </div>
</div>

<div class="brand-bar"><img src="${logoDataUri}" /></div>
</body></html>`;

// ════════════════════════════════════════════
// 카드 7 — em 색상 수정 + 비교 프레임 잘림 해결
// ════════════════════════════════════════════
const card7Html = `<!DOCTYPE html>
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
  padding: 48px 48px 24px;
}

.header-section {
  text-align: center;
  margin-bottom: 28px;
}
.headline {
  font-size: 80px; font-weight: 900;
  line-height: 1.15; color: var(--color-text);
  margin-bottom: 14px;
}
.headline em {
  color: var(--color-accent);
  font-style: normal; font-weight: 900;
}

.subtext {
  font-size: 26px; font-weight: 400;
  color: #6B7280; line-height: 1.4;
}

.comparison-section {
  flex: 1;
  display: flex;
  gap: 24px;
  min-height: 0;
}

.column {
  flex: 1;
  display: flex; flex-direction: column;
  border-radius: 20px;
  padding: 36px 32px;
}

.column-title {
  font-size: 44px; font-weight: 900;
  margin-bottom: 28px;
  line-height: 1.15;
  text-align: center;
}

.column-item {
  display: flex; align-items: center;
  gap: 16px;
  font-size: 30px; font-weight: 700;
  line-height: 1.3;
  flex: 1;
}

.column-item svg {
  width: 32px; height: 32px;
  flex-shrink: 0;
  fill: none; stroke-width: 2;
  stroke-linecap: round; stroke-linejoin: round;
}

.general-column {
  background: #FFFFFF;
  color: var(--color-text);
  box-shadow: 0 2px 12px rgba(8,20,89,0.08);
}
.general-column .column-title { color: var(--color-text); }
.general-column .column-item svg { stroke: #9CA3AF; }

.jinhak-column {
  background: var(--color-primary);
  color: #FFFFFF;
  box-shadow: 0 4px 24px rgba(8,20,89,0.2);
}
.jinhak-column .column-title { color: #FFFFFF; }
.jinhak-column .column-item svg { stroke: var(--color-accent); }

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
  <div class="header-section">
    <h1 class="headline">일반 학원 vs <em>진학학원</em><br>차이점</h1>
    <p class="subtext">같은 내신 대비라도<br>접근 방식이 이렇게 다릅니다<br>결과의 차이는 당연합니다</p>
  </div>

  <div class="comparison-section">
    <div class="column general-column">
      <h3 class="column-title">일반 학원</h3>
      <div class="column-item">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        <span>교재 위주 진도 진행</span>
      </div>
      <div class="column-item">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        <span>획일화된 문제 풀이</span>
      </div>
      <div class="column-item">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        <span>결과 중심 점수 관리</span>
      </div>
      <div class="column-item">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        <span>일반적인 시험 대비</span>
      </div>
    </div>

    <div class="column jinhak-column">
      <h3 class="column-title">진학학원</h3>
      <div class="column-item">
        <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <span>학교별 맞춤 분석</span>
      </div>
      <div class="column-item">
        <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <span>개별 약점 집중 보완</span>
      </div>
      <div class="column-item">
        <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <span>전략적 등급 관리</span>
      </div>
      <div class="column-item">
        <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <span>체계적 실적 관리</span>
      </div>
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

  console.log('=== 카드 3 렌더링 ===');
  await page.setContent(card3Html, { waitUntil: 'load', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(OUTPUT_DIR, 'card-03.png'), type: 'png' });
  console.log('  card-03.png 완료');

  console.log('=== 카드 4 렌더링 ===');
  await page.setContent(card4Html, { waitUntil: 'load', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(OUTPUT_DIR, 'card-04.png'), type: 'png' });
  console.log('  card-04.png 완료');

  console.log('=== 카드 7 렌더링 ===');
  await page.setContent(card7Html, { waitUntil: 'load', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(OUTPUT_DIR, 'card-07.png'), type: 'png' });
  console.log('  card-07.png 완료');

  await page.close();

  copyData.cards[2].generated_html = card3Html;
  copyData.cards[3].generated_html = card4Html;
  copyData.cards[6].generated_html = card7Html;
  await writeFile(copyPath, JSON.stringify(copyData, null, 2), 'utf-8');
  console.log('copy.json 업데이트 완료');
} finally {
  await browser.close();
}

console.log('\n=== 3장 수정 완료 ===');
