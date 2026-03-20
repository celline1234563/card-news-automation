import 'dotenv/config';
import { readFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const OUTPUT_DIR = join(ROOT, 'output', '진학학원--진학고등3-6--입학사정관-성적표-2026-03-20');

await mkdir(OUTPUT_DIR, { recursive: true });

const logoBuf = await readFile(join(ROOT, 'config', 'logos', 'jinhak.png'));
const logoDataUri = `data:image/png;base64,${logoBuf.toString('base64')}`;

console.log('=== [진학고등3-6] 카드 5 리디자인: 내용 잘림 수정 ===\n');

const card5Html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<style>
:root {
  --navy: #081459;
  --navy-light: #0F1D6B;
  --navy-card: #111F70;
  --orange: #ff871e;
  --orange-glow: rgba(255,135,30,0.15);
  --white: #FFFFFF;
  --dim: rgba(255,255,255,0.5);
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1080px; height: 1350px;
  background: var(--navy);
  font-family: 'Noto Sans KR', sans-serif;
  color: var(--white);
  word-break: keep-all;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* 배경 장식 */
.bg-circle {
  position: absolute; border-radius: 50%; pointer-events: none;
}
.bg-c1 {
  width: 500px; height: 500px;
  top: -150px; right: -150px;
  background: radial-gradient(circle, rgba(255,135,30,0.06) 0%, transparent 70%);
}
.bg-c2 {
  width: 400px; height: 400px;
  bottom: -100px; left: -100px;
  background: radial-gradient(circle, rgba(255,135,30,0.04) 0%, transparent 70%);
}

/* 상단 */
.top-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 40px 64px 0;
  position: relative; z-index: 10;
}
.top-logo { background: rgba(255,255,255,0.95); padding: 8px 16px; border-radius: 8px; }
.top-logo img { height: 36px; object-fit: contain; }
.top-badge {
  background: var(--orange); color: var(--white);
  font-size: 22px; font-weight: 700;
  padding: 8px 22px; border-radius: 8px;
  letter-spacing: 1px;
}

/* 헤더 */
.header {
  padding: 36px 64px 0;
  position: relative; z-index: 5;
}
.header-label {
  font-size: 20px; font-weight: 700; color: var(--orange);
  letter-spacing: 3px; margin-bottom: 12px;
}
.header-title {
  font-size: 44px; font-weight: 900; line-height: 1.3;
  margin-bottom: 10px;
}
.header-sub {
  font-size: 24px; color: var(--dim); line-height: 1.5;
}

/* 스텝 영역 */
.steps {
  flex: 1;
  padding: 32px 64px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative; z-index: 5;
}

.step-item {
  background: var(--navy-card);
  border-radius: 18px;
  padding: 28px 32px;
  display: flex;
  align-items: flex-start;
  gap: 24px;
  border-left: 5px solid var(--orange);
  position: relative;
}

.step-num {
  min-width: 56px; height: 56px;
  background: var(--orange);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; font-weight: 900;
  flex-shrink: 0;
}

.step-body { flex: 1; }
.step-title {
  font-size: 30px; font-weight: 900; line-height: 1.3;
  margin-bottom: 6px;
}
.step-desc {
  font-size: 21px; color: var(--dim); line-height: 1.5;
}

/* 스텝 사이 화살표 커넥터 */
.step-connector {
  display: flex;
  justify-content: center;
  margin: -6px 0;
  position: relative; z-index: 5;
}
.step-connector span {
  color: var(--orange);
  font-size: 28px;
  opacity: 0.6;
}

/* 하단 */
.bottom-bar {
  padding: 24px 64px 40px;
  display: flex; align-items: center; justify-content: space-between;
  position: relative; z-index: 10;
}
.bottom-logo { background: rgba(255,255,255,0.9); padding: 6px 12px; border-radius: 6px; }
.bottom-logo img { height: 36px; object-fit: contain; }
.page-num {
  font-size: 20px; color: var(--dim);
  font-weight: 700;
}
</style>
</head>
<body>
  <div class="bg-circle bg-c1"></div>
  <div class="bg-circle bg-c2"></div>

  <div class="top-bar">
    <div class="top-logo"><img src="${logoDataUri}" /></div>
    <div class="top-badge">INSIGHT</div>
  </div>

  <div class="header">
    <div class="header-label">STEP BY STEP</div>
    <div class="header-title">입학사정관이 실제로 보는 것들</div>
    <div class="header-sub">4단계 평가 시스템을 알면 준비가 보여요</div>
  </div>

  <div class="steps">
    <div class="step-item">
      <div class="step-num">01</div>
      <div class="step-body">
        <div class="step-title">성적 분포 확인</div>
        <div class="step-desc">등급만이 아니라 전체적인 성적 흐름과 추이를 종합적으로 살펴봅니다</div>
      </div>
    </div>

    <div class="step-connector"><span>▼</span></div>

    <div class="step-item">
      <div class="step-num">02</div>
      <div class="step-body">
        <div class="step-title">세특 심층 분석</div>
        <div class="step-desc">전공과의 연관성, 활동의 진정성, 탐구 깊이를 꼼꼼히 평가합니다</div>
      </div>
    </div>

    <div class="step-connector"><span>▼</span></div>

    <div class="step-item">
      <div class="step-num">03</div>
      <div class="step-body">
        <div class="step-title">교차 재검토</div>
        <div class="step-desc">다른 사정관의 시각으로 놓친 부분이 없는지 다시 한 번 확인합니다</div>
      </div>
    </div>

    <div class="step-connector"><span>▼</span></div>

    <div class="step-item">
      <div class="step-num">04</div>
      <div class="step-body">
        <div class="step-title">최종 협의 및 결정</div>
        <div class="step-desc">복수의 사정관이 합의하여 최종 합불 여부를 결정합니다</div>
      </div>
    </div>
  </div>

  <div class="bottom-bar">
    <div class="bottom-logo"><img src="${logoDataUri}" /></div>
    <div class="page-num">5 / 10</div>
  </div>
</body>
</html>`;

// 렌더링
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1350 });
await page.setContent(card5Html, { waitUntil: 'networkidle0', timeout: 120000 });
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 2000));

const pngPath = join(OUTPUT_DIR, 'card-05.png');
await page.screenshot({ path: pngPath, type: 'png' });
await page.close();
await browser.close();

console.log(`  card-05.png 저장 완료: ${pngPath}`);
