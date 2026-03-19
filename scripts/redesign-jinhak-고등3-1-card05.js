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

console.log('═══ 카드 5 리디자인: 일반 관리 vs 진학학원 ═══');

const card5Html = `<!DOCTYPE html>
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

/* 배경 */
.bg-ring { position: absolute; border-radius: 50%; border: 2px solid rgba(255,107,0,0.1); pointer-events: none; }
.bgr-1 { width: 420px; height: 420px; top: -100px; right: -80px; }
.bgr-2 { width: 280px; height: 280px; bottom: 120px; left: -60px; }

/* 헤더 */
.header { padding: 44px 72px 20px; position: relative; z-index: 5; }
.header-label { display: flex; align-items: center; gap: 14px; font-size: 22px; color: var(--dim); margin-bottom: 12px; }
.header-label-line { width: 36px; height: 3px; background: var(--orange); border-radius: 2px; }
.headline { font-size: 72px; font-weight: 900; line-height: 1.2; margin-bottom: 10px; }
.headline .accent { color: var(--orange); }
.header-sub { font-size: 26px; color: var(--dim); }

/* 컬럼 헤더 */
.col-header {
  display: flex; align-items: center; justify-content: center;
  gap: 16px; padding: 16px 72px; margin-top: 12px; position: relative; z-index: 5;
}
.col-label {
  flex: 1; text-align: center; font-size: 26px; font-weight: 700;
  padding: 12px 0; border-radius: 10px;
}
.col-label.normal { background: rgba(255,255,255,0.06); color: var(--dim); }
.col-label.jinhak { background: var(--orange); color: var(--white); }
.vs-badge {
  width: 48px; height: 48px; border-radius: 50%;
  background: rgba(255,255,255,0.1); display: flex;
  align-items: center; justify-content: center;
  font-size: 18px; font-weight: 900; color: var(--dim);
}

/* 비교 행 */
.compare-rows { padding: 10px 72px 0; position: relative; z-index: 5; }
.compare-row {
  display: flex; gap: 16px; margin-bottom: 10px;
}
.cell {
  flex: 1; padding: 18px 24px; border-radius: 12px;
  display: flex; flex-direction: column; gap: 4px; position: relative;
}
.cell.normal {
  background: rgba(255,255,255,0.04);
  opacity: 0.5;
}
.cell.normal .cell-icon { font-size: 24px; margin-bottom: 4px; opacity: 0.6; }
.cell.normal .cell-title { font-size: 30px; font-weight: 700; color: rgba(255,255,255,0.7); }
.cell.normal .cell-desc { font-size: 20px; color: rgba(255,255,255,0.4); }

.cell.jinhak {
  background: var(--navy-light);
  border-left: 5px solid var(--orange);
}
.cell.jinhak .cell-icon { font-size: 24px; margin-bottom: 4px; }
.cell.jinhak .cell-title { font-size: 30px; font-weight: 900; color: var(--orange); }
.cell.jinhak .cell-desc { font-size: 20px; color: var(--dim); }
.cell.jinhak .check-mark {
  position: absolute; top: 14px; right: 14px;
  width: 28px; height: 28px; background: #22C55E;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 16px; color: var(--white);
}

/* 중앙 세로 커넥터 */
.row-connector {
  display: flex; justify-content: center; padding: 2px 0;
}
.row-connector-dot {
  width: 28px; height: 28px; background: rgba(255,255,255,0.06);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
}
.row-connector-dot svg { width: 14px; height: 14px; fill: none; stroke: rgba(255,255,255,0.3); stroke-width: 2; stroke-linecap: round; }

/* 강조 문구 */
.highlight-msg {
  margin: 14px 72px 0; padding: 20px 32px;
  background: rgba(255,107,0,0.1); border: 1px solid rgba(255,107,0,0.2);
  border-radius: 14px; display: flex; align-items: center; gap: 16px;
  position: relative; z-index: 5;
}
.highlight-msg .icon { font-size: 32px; }
.highlight-msg p { font-size: 28px; font-weight: 700; color: var(--orange); line-height: 1.5; }

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

  <div class="header">
    <div class="header-label"><span class="header-label-line"></span>구체적 차이점 비교표</div>
    <h1 class="headline">일반 관리 vs <span class="accent">진학학원</span></h1>
    <p class="header-sub">무엇이 합격을 만드는가</p>
  </div>

  <div class="col-header">
    <div class="col-label normal">일반 관리</div>
    <div class="vs-badge">VS</div>
    <div class="col-label jinhak">✦ 진학학원</div>
  </div>

  <div class="compare-rows">
    <div class="compare-row">
      <div class="cell normal">
        <div class="cell-icon">📋</div>
        <div class="cell-title">획일적 진도 학습</div>
        <div class="cell-desc">모든 학생 동일 진행</div>
      </div>
      <div class="cell jinhak">
        <div class="check-mark">✓</div>
        <div class="cell-icon">🎯</div>
        <div class="cell-title">개별 맞춤 커리큘럼</div>
        <div class="cell-desc">학생별 전략 설계</div>
      </div>
    </div>

    <div class="row-connector"><div class="row-connector-dot"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg></div></div>

    <div class="compare-row">
      <div class="cell normal">
        <div class="cell-icon">📖</div>
        <div class="cell-title">정해진 교재 사용</div>
        <div class="cell-desc">교재 중심 수업</div>
      </div>
      <div class="cell jinhak">
        <div class="check-mark">✓</div>
        <div class="cell-icon">⭐</div>
        <div class="cell-title">과목별 전문 강사진</div>
        <div class="cell-desc">입시 전문가 직접 지도</div>
      </div>
    </div>

    <div class="row-connector"><div class="row-connector-dot"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg></div></div>

    <div class="compare-row">
      <div class="cell normal">
        <div class="cell-icon">📝</div>
        <div class="cell-title">단순 숙제 관리</div>
        <div class="cell-desc">제출 여부만 확인</div>
      </div>
      <div class="cell jinhak">
        <div class="check-mark">✓</div>
        <div class="cell-icon">📊</div>
        <div class="cell-title">주간 학습 성과 분석</div>
        <div class="cell-desc">데이터 기반 피드백</div>
      </div>
    </div>

    <div class="row-connector"><div class="row-connector-dot"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg></div></div>

    <div class="compare-row">
      <div class="cell normal">
        <div class="cell-icon">✖</div>
        <div class="cell-title">개인별 전략 부재</div>
        <div class="cell-desc">입시 전략 없음</div>
      </div>
      <div class="cell jinhak">
        <div class="check-mark">✓</div>
        <div class="cell-icon">🏆</div>
        <div class="cell-title">최상위권 입시 전략</div>
        <div class="cell-desc">목표 대학 맞춤 로드맵</div>
      </div>
    </div>
  </div>

  <div class="highlight-msg">
    <div class="icon">💡</div>
    <p>진학학원은 단순 관리가 아닌<br>합격을 설계합니다</p>
  </div>

  <div class="bottom-bar">
    <div class="bottom-logo"><img src="${logoDataUri}" /></div>
    <div class="bottom-cta">무료 상담 →</div>
  </div>
</body>
</html>`;

copyData.cards[4].generated_html = card5Html;
await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('  ✅ copy.json 카드 5 업데이트\n');

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1350 });
await page.setContent(card5Html, { waitUntil: 'load', timeout: 120000 });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: join(OUTPUT_DIR, 'card-05.png'), type: 'png' });
await page.close();
await browser.close();
console.log('  ✅ card-05.png 저장 완료');
