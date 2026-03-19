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
const logoBuf = await readFile(join(ROOT, 'config', 'logos', 'jinhak.png'));
const logoDataUri = `data:image/png;base64,${logoBuf.toString('base64')}`;
console.log('✅ 로고 로드 완료');

// ── copy.json 로드 ──
const raw = await readFile(join(OUTPUT_DIR, 'copy.json'), 'utf-8');
const copyData = JSON.parse(raw);
console.log(`✅ copy.json 로드 (${copyData.cards.length}장)\n`);

// ── 카드 4 HTML ──
console.log('═══ 카드 4 리디자인 ═══');

const card4Html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<style>
:root {
  --navy: #0B1340;
  --navy-light: #151B4A;
  --orange: #FF6B00;
  --white: #FFFFFF;
  --text-dim: rgba(255,255,255,0.5);
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
  border: 2px solid rgba(255, 107, 0, 0.1);
  pointer-events: none;
}
.bgr-1 { width: 500px; height: 500px; top: -150px; right: -120px; }
.bgr-2 { width: 350px; height: 350px; bottom: 80px; left: -100px; }

/* 도트 그리드 */
.dot-grid {
  position: absolute;
  bottom: 160px; right: 60px;
  width: 120px; height: 120px;
  background-image: radial-gradient(rgba(255,255,255,0.08) 2px, transparent 2px);
  background-size: 16px 16px;
  pointer-events: none;
}

/* ── 상단 바 ── */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 36px 64px 0;
  position: relative;
  z-index: 10;
}
.top-logo {
  background: rgba(255,255,255,0.95);
  padding: 8px 16px;
  border-radius: 8px;
}
.top-logo img {
  height: 44px;
  object-fit: contain;
}
.top-badge {
  background: var(--orange);
  color: var(--white);
  font-size: 26px;
  font-weight: 700;
  padding: 10px 28px;
  border-radius: 10px;
}

/* ── 헤더 영역 ── */
.header {
  padding: 12px 72px 10px;
  position: relative;
  z-index: 5;
}
.header-label {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 24px;
  font-weight: 400;
  color: var(--text-dim);
  margin-bottom: 10px;
}
.header-label-line {
  width: 36px; height: 3px;
  background: var(--orange);
  border-radius: 2px;
}
.headline {
  font-size: 76px;
  font-weight: 900;
  line-height: 1.15;
  margin-bottom: 10px;
}
/* 성적표 — 주황 하이라이트 블록 */
.hl-block {
  background: var(--orange);
  color: var(--white);
  padding: 2px 14px;
  border-radius: 6px;
  display: inline;
}
.header-sub {
  font-size: 30px;
  font-weight: 400;
  color: var(--text-dim);
  line-height: 1.5;
}
.header-sub .accent {
  color: var(--orange);
  font-weight: 900;
}

/* ── 구분선 ── */
.divider {
  margin: 8px 72px;
  height: 1px;
  background: rgba(255,255,255,0.08);
}

/* ── 리스트 영역 ── */
.list-area {
  padding: 0 72px;
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
  z-index: 5;
}

.list-item {
  background: var(--navy-light);
  border-left: 5px solid var(--orange);
  border-radius: 0 16px 16px 0;
  padding: 14px 32px;
  display: flex;
  align-items: center;
  gap: 24px;
}

/* 아이콘 박스 */
.icon-box {
  min-width: 58px; height: 58px;
  background: var(--orange);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  box-shadow: 0 4px 16px rgba(255, 107, 0, 0.3);
}

.item-body {
  flex: 1;
}
.item-num {
  font-size: 22px;
  font-weight: 900;
  color: var(--orange);
  margin-bottom: 2px;
}
.item-title {
  font-size: 38px;
  font-weight: 900;
  line-height: 1.2;
  margin-bottom: 4px;
}
.item-desc {
  font-size: 24px;
  font-weight: 400;
  color: var(--text-dim);
}

/* 우측 화살표 */
.item-arrow {
  min-width: 44px; height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.item-arrow svg {
  width: 28px; height: 28px;
  fill: none;
  stroke: var(--orange);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* 아이템 간 화살표 */
.arrow-gap {
  display: flex;
  justify-content: center;
  padding: 3px 0;
}
.arrow-gap-circle {
  width: 32px; height: 32px;
  background: rgba(255,255,255,0.08);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.arrow-gap-circle svg {
  width: 18px; height: 18px;
  fill: none;
  stroke: rgba(255,255,255,0.4);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* ── CTA 질문 ── */
.cta-question {
  margin: 14px 72px 0;
  padding: 18px 36px;
  background: rgba(255, 107, 0, 0.1);
  border: 1px solid rgba(255, 107, 0, 0.2);
  border-radius: 16px;
  position: relative;
  z-index: 5;
}
.cta-question p {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.6;
  color: var(--orange);
}

/* ── 하단 바 ── */
.bottom-bar {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 88px;
  background: rgba(11, 19, 64, 0.95);
  border-top: 1px solid rgba(255,255,255,0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 64px;
  z-index: 10;
}
.bottom-logo {
  background: rgba(255,255,255,0.9);
  padding: 6px 12px;
  border-radius: 6px;
}
.bottom-logo img {
  height: 40px;
  object-fit: contain;
}
.bottom-cta {
  background: var(--orange);
  color: var(--white);
  font-size: 30px;
  font-weight: 700;
  padding: 14px 40px;
  border-radius: 36px;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
</head>
<body>
  <!-- 배경 장식 -->
  <div class="bg-ring bgr-1"></div>
  <div class="bg-ring bgr-2"></div>
  <div class="dot-grid"></div>

  <!-- 상단 바: 로고 + 배지 -->
  <div class="top-bar">
    <div class="top-logo">
      <img src="${logoDataUri}" />
    </div>
    <div class="top-badge">입시 분석</div>
  </div>

  <!-- 헤더 -->
  <div class="header">
    <div class="header-label">
      <span class="header-label-line"></span>
      입학사정관이 실제로 보는 것
    </div>
    <h1 class="headline"><span class="hl-block">성적표</span>가 아닌<br>성장 스토리</h1>
    <p class="header-sub">숫자가 아닌 <span class="accent">4가지 핵심 역량</span>으로 합격이 결정된다</p>
  </div>

  <div class="divider"></div>

  <!-- 리스트 -->
  <div class="list-area">
    <!-- 01 -->
    <div class="list-item">
      <div class="icon-box">📊</div>
      <div class="item-body">
        <div class="item-num">01</div>
        <div class="item-title">학업역량</div>
        <div class="item-desc">교과 성취도와 탐구·학습 깊이를 평가</div>
      </div>
      <div class="item-arrow">
        <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </div>
    </div>

    <div class="arrow-gap">
      <div class="arrow-gap-circle">
        <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
      </div>
    </div>

    <!-- 02 -->
    <div class="list-item">
      <div class="icon-box">🎯</div>
      <div class="item-body">
        <div class="item-num">02</div>
        <div class="item-title">전공적합성</div>
        <div class="item-desc">지원 전공과 연결된 활동·관심의 일관성</div>
      </div>
      <div class="item-arrow">
        <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </div>
    </div>

    <div class="arrow-gap">
      <div class="arrow-gap-circle">
        <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
      </div>
    </div>

    <!-- 03 -->
    <div class="list-item">
      <div class="icon-box">🚀</div>
      <div class="item-body">
        <div class="item-num">03</div>
        <div class="item-title">발전가능성</div>
        <div class="item-desc">성장 과정과 자기주도적 변화의 흔적</div>
      </div>
      <div class="item-arrow">
        <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </div>
    </div>

    <div class="arrow-gap">
      <div class="arrow-gap-circle">
        <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
      </div>
    </div>

    <!-- 04 -->
    <div class="list-item">
      <div class="icon-box">⭐</div>
      <div class="item-body">
        <div class="item-num">04</div>
        <div class="item-title">성실성</div>
        <div class="item-desc">꾸준한 참여와 책임감 있는 태도</div>
      </div>
      <div class="item-arrow">
        <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </div>
    </div>
  </div>

  <!-- CTA 질문 -->
  <div class="cta-question">
    <p>지금 당신의 생기부에는 이 4가지가<br>제대로 담겨 있나요?</p>
  </div>

  <!-- 하단 바 -->
  <div class="bottom-bar">
    <div class="bottom-logo">
      <img src="${logoDataUri}" />
    </div>
    <div class="bottom-cta">진학 컨설팅 →</div>
  </div>
</body>
</html>`;

// copy.json 카드 4 업데이트
copyData.cards[3].generated_html = card4Html;
await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('  ✅ copy.json 카드 4 업데이트 완료\n');

// ── Puppeteer 렌더링 ──
console.log('═══ PNG 렌더링 ═══');
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1350 });
await page.setContent(card4Html, { waitUntil: 'load', timeout: 120000 });
await page.evaluate(() => document.fonts.ready);

const outPath = join(OUTPUT_DIR, 'card-04.png');
await page.screenshot({ path: outPath, type: 'png' });
await page.close();
await browser.close();

console.log(`  ✅ card-04.png 저장 완료`);
console.log(`  📁 ${outPath}\n`);
console.log('═══ 완료! ═══');
