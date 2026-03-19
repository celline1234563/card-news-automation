import 'dotenv/config';
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const OUTPUT_DIR = join(ROOT, 'output', '진학학원--진학-고등-3-1--2026-03-11');

const logoBuf = await readFile(join(ROOT, 'config', 'logos', 'jinhak.png'));
const logoDataUri = `data:image/png;base64,${logoBuf.toString('base64')}`;
const raw = await readFile(join(OUTPUT_DIR, 'copy.json'), 'utf-8');
const copyData = JSON.parse(raw);

console.log('═══ 카드 9 리디자인: 핵심 정리 ═══');

const card9Html = `<!DOCTYPE html>
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
  --dim: rgba(255,255,255,0.45);
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1080px; height: 1350px;
  background: var(--navy);
  font-family: 'Noto Sans KR', sans-serif;
  color: var(--white);
  overflow: hidden; word-break: keep-all;
  position: relative;
}
.bg-ring { position: absolute; border-radius: 50%; border: 2px solid rgba(255,107,0,0.08); pointer-events: none; }
.bgr-1 { width: 450px; height: 450px; bottom: -120px; right: -100px; }

/* 상단 바 */
.top-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 36px 64px 0; position: relative; z-index: 10;
}
.top-logo { background: rgba(255,255,255,0.95); padding: 8px 16px; border-radius: 8px; }
.top-logo img { height: 40px; object-fit: contain; }
.top-badge { background: var(--orange); color: var(--white); font-size: 24px; font-weight: 700; padding: 8px 24px; border-radius: 8px; }

/* 헤더 박스 */
.header-box {
  margin: 20px 72px 16px;
  background: var(--navy-light);
  border-radius: 20px;
  padding: 28px 36px;
  display: flex; align-items: center; gap: 24px;
  position: relative; z-index: 5;
}
.header-icon { font-size: 56px; }
.header-text { flex: 1; }
.header-label { font-size: 22px; font-weight: 700; color: var(--orange); letter-spacing: 2px; margin-bottom: 4px; }
.header-title { font-size: 42px; font-weight: 900; line-height: 1.2; }
.header-sub { font-size: 22px; color: var(--dim); margin-top: 4px; }
.header-sub .accent { color: var(--orange); font-weight: 700; }

/* 번호 리스트 */
.num-list { padding: 0 72px; display: flex; flex-direction: column; gap: 10px; position: relative; z-index: 5; }
.num-item {
  background: var(--navy-light);
  border-radius: 14px;
  padding: 18px 28px;
  display: flex; align-items: center; gap: 20px;
}
.num-badge {
  min-width: 48px; height: 48px;
  background: var(--orange); border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; font-weight: 900;
}
.num-body { flex: 1; }
.num-title { font-size: 32px; font-weight: 900; line-height: 1.25; margin-bottom: 2px; }
.num-desc { font-size: 22px; color: var(--dim); }
.num-tag {
  background: rgba(255,107,0,0.15);
  color: var(--orange);
  font-size: 20px; font-weight: 700;
  padding: 4px 16px; border-radius: 6px;
  white-space: nowrap;
}

/* CTA 배너 */
.cta-banner {
  margin: 16px 72px 0;
  background: var(--orange);
  border-radius: 16px;
  padding: 22px 36px;
  display: flex; align-items: center; gap: 20px;
  position: relative; z-index: 5;
  box-shadow: 0 6px 24px rgba(255,107,0,0.4);
}
.cta-banner-icon { font-size: 36px; }
.cta-banner p { font-size: 30px; font-weight: 700; line-height: 1.5; }

/* 하단 */
.bottom-bar {
  position: absolute; bottom: 0; left: 0; right: 0; height: 88px;
  background: rgba(11,19,64,0.95); border-top: 1px solid rgba(255,255,255,0.06);
  display: flex; align-items: center; justify-content: space-between; padding: 0 64px; z-index: 10;
}
.bottom-logo { background: rgba(255,255,255,0.9); padding: 6px 12px; border-radius: 6px; }
.bottom-logo img { height: 40px; object-fit: contain; }
.bottom-cta { background: var(--orange); color: var(--white); font-size: 28px; font-weight: 700; padding: 12px 36px; border-radius: 32px; }
</style>
</head>
<body>
  <div class="bg-ring bgr-1"></div>

  <div class="top-bar">
    <div class="top-logo"><img src="${logoDataUri}" /></div>
    <div class="top-badge">핵심 정리</div>
  </div>

  <div class="header-box">
    <div class="header-icon">📋</div>
    <div class="header-text">
      <div class="header-label">KEY SUMMARY</div>
      <div class="header-title">고3 1학기 핵심 정리</div>
      <div class="header-sub">지금 시작하면 <span class="accent">아직 늦지 않았다</span></div>
    </div>
  </div>

  <div class="num-list">
    <div class="num-item">
      <div class="num-badge">01</div>
      <div class="num-body">
        <div class="num-title">수시 마지막 반영 학기</div>
        <div class="num-desc">절대적으로 중요한 시기, 놓치면 안 된다</div>
      </div>
      <div class="num-tag">필수</div>
    </div>

    <div class="num-item">
      <div class="num-badge">02</div>
      <div class="num-body">
        <div class="num-title">전략적 과목 선택</div>
        <div class="num-desc">무작정 공부보다 선택과 집중이 핵심</div>
      </div>
      <div class="num-tag">전략</div>
    </div>

    <div class="num-item">
      <div class="num-badge">03</div>
      <div class="num-body">
        <div class="num-title">대학별 반영 방식 파악</div>
        <div class="num-desc">목표 대학의 교과 반영 방법을 미리 확인</div>
      </div>
      <div class="num-tag">핵심</div>
    </div>

    <div class="num-item">
      <div class="num-badge">04</div>
      <div class="num-body">
        <div class="num-title">진로선택과목 차별화</div>
        <div class="num-desc">성취도 관리로 경쟁력 포인트 확보</div>
      </div>
      <div class="num-tag">차별화</div>
    </div>

    <div class="num-item">
      <div class="num-badge">05</div>
      <div class="num-body">
        <div class="num-title">체계적 관리가 성공 확률 UP</div>
        <div class="num-desc">전문 학원의 시스템이 결과를 만든다</div>
      </div>
      <div class="num-tag">검증</div>
    </div>
  </div>

  <div class="cta-banner">
    <div class="cta-banner-icon">🔥</div>
    <p>마지막 기회를 놓치지 마세요<br>전략적 접근이 답입니다</p>
  </div>

  <div class="bottom-bar">
    <div class="bottom-logo"><img src="${logoDataUri}" /></div>
    <div class="bottom-cta">무료 상담 →</div>
  </div>
</body>
</html>`;

copyData.cards[8].generated_html = card9Html;
await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('  ✅ copy.json 카드 9 업데이트\n');

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1350 });
await page.setContent(card9Html, { waitUntil: 'load', timeout: 120000 });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: join(OUTPUT_DIR, 'card-09.png'), type: 'png' });
await page.close();
await browser.close();
console.log('  ✅ card-09.png 저장 완료');
