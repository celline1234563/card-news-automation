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

console.log('═══ 카드 8 리디자인: 성공 핵심 정리 ═══');

const card8Html = `<!DOCTYPE html>
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

/* 트로피 헤더 박스 */
.trophy-box {
  margin: 20px 72px 16px;
  background: var(--navy-light);
  border-radius: 20px;
  padding: 28px 36px;
  display: flex; align-items: center; gap: 24px;
  position: relative; z-index: 5;
}
.trophy-icon { font-size: 56px; }
.trophy-text { flex: 1; }
.trophy-label { font-size: 22px; font-weight: 700; color: var(--orange); letter-spacing: 2px; margin-bottom: 4px; }
.trophy-title { font-size: 42px; font-weight: 900; line-height: 1.2; }
.trophy-sub { font-size: 22px; color: var(--dim); margin-top: 4px; }
.trophy-sub .accent { color: var(--orange); font-weight: 700; }

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

  <div class="trophy-box">
    <div class="trophy-icon">🏆</div>
    <div class="trophy-text">
      <div class="trophy-label">SUCCESS FORMULA</div>
      <div class="trophy-title">성공 핵심 정리</div>
      <div class="trophy-sub">고1부터 시작하는 <span class="accent">생기부 관리</span></div>
    </div>
  </div>

  <div class="num-list">
    <div class="num-item">
      <div class="num-badge">01</div>
      <div class="num-body">
        <div class="num-title">진로 설정이 모든 활동의 기준점</div>
        <div class="num-desc">방향 없이 쌓인 활동은 입시에서 통하지 않는다</div>
      </div>
      <div class="num-tag">필수</div>
    </div>

    <div class="num-item">
      <div class="num-badge">02</div>
      <div class="num-body">
        <div class="num-title">수업 참여가 세특 기록의 핵심</div>
        <div class="num-desc">발표·질문으로 교사 기록에 남아야 한다</div>
      </div>
      <div class="num-tag">핵심</div>
    </div>

    <div class="num-item">
      <div class="num-badge">03</div>
      <div class="num-body">
        <div class="num-title">교사 소통이 생기부 퀄리티 결정</div>
        <div class="num-desc">담임·교과 선생님과의 관계가 생기부를 좌우</div>
      </div>
      <div class="num-tag">전략</div>
    </div>

    <div class="num-item">
      <div class="num-badge">04</div>
      <div class="num-body">
        <div class="num-title">탐구 보고서가 차별화 포인트</div>
        <div class="num-desc">깊이 있는 탐구 활동이 합격생을 만든다</div>
      </div>
      <div class="num-tag">차별화</div>
    </div>

    <div class="num-item">
      <div class="num-badge">05</div>
      <div class="num-body">
        <div class="num-title">3년 일관성이 입학사정관 어필</div>
        <div class="num-desc">고1부터 고3까지 하나의 스토리로 연결</div>
      </div>
      <div class="num-tag">완성</div>
    </div>
  </div>

  <div class="cta-banner">
    <div class="cta-banner-icon">🚀</div>
    <p>지금 시작하지 않으면<br>고3 때 후회합니다</p>
  </div>

  <div class="bottom-bar">
    <div class="bottom-logo"><img src="${logoDataUri}" /></div>
    <div class="bottom-cta">무료 상담 →</div>
  </div>
</body>
</html>`;

copyData.cards[7].generated_html = card8Html;
await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('  ✅ copy.json 카드 8 업데이트\n');

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1350 });
await page.setContent(card8Html, { waitUntil: 'load', timeout: 120000 });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: join(OUTPUT_DIR, 'card-08.png'), type: 'png' });
await page.close();
await browser.close();
console.log('  ✅ card-08.png 저장 완료');
