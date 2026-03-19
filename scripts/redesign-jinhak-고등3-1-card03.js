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

// ── 카드 3 HTML 작성 ──
console.log('═══ 카드 3 리디자인 ═══');

const card3Html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<style>
:root {
  --navy: #0B1340;
  --orange: #FF6B00;
  --orange-light: rgba(255, 107, 0, 0.08);
  --white: #FFFFFF;
  --light-bg: #F5F6FA;
  --text-dark: #1A1A2E;
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

/* ── 배경 장식 ── */
.bg-ring {
  position: absolute;
  border-radius: 50%;
  border: 3px solid rgba(255, 107, 0, 0.12);
  pointer-events: none;
}
.bgr-1 { width: 600px; height: 600px; top: -200px; left: -200px; }
.bgr-2 { width: 400px; height: 400px; bottom: -100px; right: -80px; }

/* ── 상단 로고 자리 ── */
.top-logo {
  position: absolute;
  top: 44px; left: 64px;
  z-index: 10;
  background: rgba(255,255,255,0.95);
  padding: 8px 16px;
  border-radius: 8px;
}
.top-logo img {
  height: 44px;
  object-fit: contain;
}

/* ── 헤더 ── */
.header {
  padding: 130px 72px 0;
  text-align: center;
  position: relative;
  z-index: 5;
}
.header-badge {
  display: inline-block;
  background: var(--orange);
  color: var(--white);
  font-size: 26px;
  font-weight: 700;
  padding: 8px 28px;
  border-radius: 24px;
  margin-bottom: 24px;
}
.header-title {
  font-size: 72px;
  font-weight: 900;
  line-height: 1.2;
  margin-bottom: 12px;
}
.header-title .accent { color: var(--orange); }
.header-sub {
  font-size: 30px;
  font-weight: 400;
  opacity: 0.5;
}

/* ── VS 비교 영역 ── */
.compare-area {
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 0;
  padding: 48px 64px 0;
  position: relative;
  z-index: 5;
}

/* 일반학생 — 왼쪽, 연하게 */
.box-normal {
  flex: 1;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 48px 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  opacity: 0.55;
}
.box-normal .box-label {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 20px;
  opacity: 0.7;
}
.box-normal .box-stat {
  font-size: 120px;
  font-weight: 900;
  line-height: 1;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.7);
}
.box-normal .box-unit {
  font-size: 36px;
  font-weight: 700;
  opacity: 0.6;
}

/* VS 배지 — 두 박스 사이 중앙 */
.vs-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px; height: 80px;
  background: var(--white);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 900;
  color: var(--navy);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  z-index: 10;
}

/* 합격생 — 오른쪽, 주황 배경 + 강조 */
.box-pass {
  flex: 1;
  background: var(--orange);
  border-radius: 24px;
  padding: 48px 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: 0 8px 40px rgba(255, 107, 0, 0.4);
  margin-left: 28px;
}
.box-pass .box-label {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 20px;
  opacity: 0.9;
}
.box-pass .box-stat {
  font-size: 170px;
  font-weight: 900;
  line-height: 1;
  margin-bottom: 8px;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}
.box-pass .box-unit {
  font-size: 36px;
  font-weight: 700;
  opacity: 0.85;
}

/* ── 차이 시각화 바 ── */
.diff-section {
  padding: 44px 72px 0;
  position: relative;
  z-index: 5;
}
.diff-label {
  font-size: 26px;
  font-weight: 700;
  opacity: 0.5;
  margin-bottom: 16px;
  text-align: center;
}
.bar-container {
  display: flex;
  align-items: center;
  gap: 20px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 20px 28px;
}
.bar-track {
  flex: 1;
  height: 36px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  position: relative;
  overflow: hidden;
}
.bar-fill-normal {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 37.6%;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 18px;
}
.bar-fill-pass {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 100%;
  background: var(--orange);
  border-radius: 18px;
}
.bar-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 180px;
}
.bar-diff-num {
  font-size: 48px;
  font-weight: 900;
  color: var(--orange);
  line-height: 1.1;
}
.bar-diff-label {
  font-size: 26px;
  font-weight: 700;
  opacity: 0.5;
}

/* 두 번째 바 (배수) */
.multiplier-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
  padding: 16px 28px;
  background: rgba(255, 107, 0, 0.1);
  border-radius: 14px;
  border: 1px solid rgba(255, 107, 0, 0.2);
}
.multiplier-num {
  font-size: 56px;
  font-weight: 900;
  color: var(--orange);
}
.multiplier-label {
  font-size: 30px;
  font-weight: 700;
  opacity: 0.6;
}

/* ── 하단 로고 ── */
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
  <!-- 배경 장식 -->
  <div class="bg-ring bgr-1"></div>
  <div class="bg-ring bgr-2"></div>

  <!-- 상단 로고 -->
  <div class="top-logo">
    <img src="${logoDataUri}" />
  </div>

  <!-- 헤더 -->
  <div class="header">
    <div class="header-badge">생기부 글자수 비교</div>
    <h1 class="header-title"><span class="accent">합격생</span>은 다르다</h1>
    <p class="header-sub">같은 3년, 결과는 완전히 다릅니다</p>
  </div>

  <!-- VS 비교 영역 -->
  <div class="compare-area">
    <!-- 일반학생 (왼쪽, 연하게) -->
    <div class="box-normal">
      <div class="box-label">일반 학생</div>
      <div class="box-stat">320</div>
      <div class="box-unit">자</div>
    </div>

    <!-- VS 배지 -->
    <div class="vs-badge">VS</div>

    <!-- 합격생 (오른쪽, 주황 강조) -->
    <div class="box-pass">
      <div class="box-label">합격생 평균</div>
      <div class="box-stat">850</div>
      <div class="box-unit">자</div>
    </div>
  </div>

  <!-- 차이 시각화 바 -->
  <div class="diff-section">
    <div class="diff-label">생기부 세부능력 및 특기사항 평균 글자수</div>

    <div class="bar-container">
      <div class="bar-track">
        <div class="bar-fill-pass"></div>
        <div class="bar-fill-normal"></div>
      </div>
      <div class="bar-stats">
        <div class="bar-diff-num">+530자</div>
        <div class="bar-diff-label">차이</div>
      </div>
    </div>

    <div class="multiplier-row">
      <div class="multiplier-num">2.6배</div>
      <div class="multiplier-label">합격생이 더 많은 기록을 남깁니다</div>
    </div>
  </div>

  <!-- 하단 로고 -->
  <div class="bottom-logo">
    <img src="${logoDataUri}" />
  </div>
</body>
</html>`;

// copy.json 카드 3 업데이트
copyData.cards[2].generated_html = card3Html;
await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('  ✅ copy.json 카드 3 업데이트 완료\n');

// ── Puppeteer 렌더링 (카드 3만) ──
console.log('═══ PNG 렌더링 ═══');
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1350 });
await page.setContent(card3Html, { waitUntil: 'load', timeout: 120000 });
await page.evaluate(() => document.fonts.ready);

const outPath = join(OUTPUT_DIR, 'card-03.png');
await page.screenshot({ path: outPath, type: 'png' });
await page.close();
await browser.close();

console.log(`  ✅ card-03.png 저장 완료`);
console.log(`  📁 ${outPath}\n`);

console.log('═══ 완료! ═══');
console.log('카드 3 리디자인 내역:');
console.log('  • 합격생 850자(우) — 주황 배경 + 170px 볼드 + 그림자');
console.log('  • 일반학생 320자(좌) — 반투명 연한 처리 대비');
console.log('  • VS 배지 — 두 박스 사이 중앙');
console.log('  • 차이 바 그래프 — +530자, 2.6배 시각화');
console.log('  • 로고 — 상단/하단 2곳 누끼 배치');
