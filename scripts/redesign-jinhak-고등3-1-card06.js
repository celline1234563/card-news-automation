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

console.log('═══ 카드 6 리디자인: 성공 사례 ═══');

const card6Html = `<!DOCTYPE html>
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
  --dim: rgba(255,255,255,0.5);
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
.bg-ring { position: absolute; border-radius: 50%; border: 2px solid rgba(255,107,0,0.1); pointer-events: none; }
.bgr-1 { width: 400px; height: 400px; top: -100px; right: -80px; }
.bgr-2 { width: 300px; height: 300px; bottom: 200px; left: -80px; }

/* 상단 로고 */
.top-logo { position: absolute; top: 40px; left: 64px; z-index: 10; background: rgba(255,255,255,0.95); padding: 8px 16px; border-radius: 8px; }
.top-logo img { height: 40px; object-fit: contain; }

/* 헤더 */
.header { padding: 110px 72px 20px; position: relative; z-index: 5; }
.header-label { display: flex; align-items: center; gap: 14px; font-size: 22px; color: var(--dim); margin-bottom: 12px; }
.header-label-line { width: 36px; height: 3px; background: var(--orange); border-radius: 2px; }
.headline { font-size: 80px; font-weight: 900; line-height: 1.15; margin-bottom: 14px; }
.headline .accent { color: var(--orange); }
.header-sub { font-size: 28px; color: var(--dim); line-height: 1.5; }
.header-sub .accent { color: var(--orange); font-weight: 900; text-decoration: underline; text-underline-offset: 4px; }

/* 성과 리스트 */
.results-list { padding: 20px 72px 0; display: flex; flex-direction: column; gap: 12px; position: relative; z-index: 5; }
.result-item {
  background: var(--navy-light);
  border-left: 5px solid var(--orange);
  border-radius: 0 14px 14px 0;
  padding: 22px 32px;
  display: flex; align-items: center; gap: 24px;
}
.result-icon {
  min-width: 58px; height: 58px;
  background: var(--orange); border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px;
  box-shadow: 0 4px 16px rgba(255,107,0,0.3);
}
.result-body { flex: 1; }
.result-title { font-size: 36px; font-weight: 900; line-height: 1.25; margin-bottom: 4px; }
.result-title .accent { color: var(--orange); }
.result-desc { font-size: 24px; color: var(--dim); }

/* 화살표 커넥터 */
.connector { display: flex; justify-content: center; padding: 4px 0; }
.connector-circle {
  width: 32px; height: 32px; background: rgba(255,255,255,0.06);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
}
.connector-circle svg { width: 16px; height: 16px; fill: none; stroke: rgba(255,255,255,0.3); stroke-width: 2; stroke-linecap: round; }

/* 성과 배너 */
.banner {
  margin: 18px 72px 0; padding: 24px 36px;
  background: var(--orange); border-radius: 16px;
  display: flex; align-items: center; gap: 28px;
  position: relative; z-index: 5;
  box-shadow: 0 6px 28px rgba(255,107,0,0.4);
}
.banner-stat { font-size: 72px; font-weight: 900; line-height: 1; }
.banner-text { flex: 1; }
.banner-text p { font-size: 26px; font-weight: 700; line-height: 1.5; }
.banner-text p .accent { color: var(--navy); font-weight: 900; }

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
  <div class="bg-ring bgr-2"></div>

  <div class="top-logo"><img src="${logoDataUri}" /></div>

  <div class="header">
    <div class="header-label"><span class="header-label-line"></span>생기부 관리로 달라진 결과</div>
    <h1 class="headline"><span class="accent">일반고</span> 학생<br>성공 사례</h1>
    <p class="header-sub">포기하지 않아도 됩니다. <span class="accent">전략이 바뀌면 결과가 바뀝니다.</span></p>
  </div>

  <div class="results-list">
    <div class="result-item">
      <div class="result-icon">📈</div>
      <div class="result-body">
        <div class="result-title"><span class="accent">내신 5등급 → 2등급</span></div>
        <div class="result-desc">맞춤 학습 전략으로 3등급 수직 상승</div>
      </div>
    </div>

    <div class="result-item">
      <div class="result-icon">🏠</div>
      <div class="result-body">
        <div class="result-title">동아리 활동 체계화</div>
        <div class="result-desc">진로 연계 활동으로 생기부 스토리 완성</div>
      </div>
    </div>

    <div class="result-item">
      <div class="result-icon">📚</div>
      <div class="result-body">
        <div class="result-title">진로 연계 독서</div>
        <div class="result-desc">전공 적합성을 높이는 독서 포트폴리오 구성</div>
      </div>
    </div>

    <div class="connector">
      <div class="connector-circle"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg></div>
    </div>

    <div class="result-item">
      <div class="result-icon">🎤</div>
      <div class="result-body">
        <div class="result-title">면접 완벽 준비</div>
        <div class="result-desc">실전 모의면접으로 최종 합격 완성</div>
      </div>
    </div>
  </div>

  <div class="banner">
    <div class="banner-stat">3등급 ↑</div>
    <div class="banner-text">
      <p><span class="accent">내신 상승 · 생기부 완성</span><br>목표 대학 최종 합격</p>
    </div>
  </div>

  <div class="bottom-bar">
    <div class="bottom-logo"><img src="${logoDataUri}" /></div>
    <div class="bottom-cta">사례 더 보기 →</div>
  </div>
</body>
</html>`;

copyData.cards[5].generated_html = card6Html;
await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('  ✅ copy.json 카드 6 업데이트\n');

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1350 });
await page.setContent(card6Html, { waitUntil: 'load', timeout: 120000 });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: join(OUTPUT_DIR, 'card-06.png'), type: 'png' });
await page.close();
await browser.close();
console.log('  ✅ card-06.png 저장 완료');
