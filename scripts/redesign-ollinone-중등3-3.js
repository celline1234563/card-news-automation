import 'dotenv/config';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFile, writeFile } from 'fs/promises';
import { loadConfig } from '../agents/config-loader.js';
import { renderCards } from '../agents/renderer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const ACADEMY_KEY = 'ollinone';
const SOURCE_DIR = join(ROOT, 'output', '올인원 수학학원--올인원-중등3-3--과제-이행률-100--시스템-2026-03-11');
const today = new Date().toISOString().slice(0, 10);
const OUTPUT_DIR = join(ROOT, 'output', `올인원 수학학원-과제-이행률-100--재디자인-${today}`);

console.log('═══════════════════════════════════════════');
console.log('  올인원 중등 3-3 전면 재디자인');
console.log('  네이비 #1B2B6B + 임팩트 옐로우 #F5C518');
console.log('═══════════════════════════════════════════');

const copyData = JSON.parse(await readFile(join(SOURCE_DIR, 'copy.json'), 'utf-8'));
console.log(`  카드 ${copyData.cards.length}장 로드 완료\n`);

// ── 공통 CSS 변수 (새 컬러 시스템) ──
const CSS_VARS = `
:root {
  --navy: #1B2B6B;
  --deep-navy: #111E52;
  --white: #FFFFFF;
  --light-bg: #F4F6FB;
  --gray-line: #D0D5E8;
  --yellow: #F5C518;
  --cream: #F5F0E8;
  --text-dark: #1A1A2E;
}`;

const FONT_IMPORT = `<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Inter:wght@700;800;900&display=swap" rel="stylesheet">`;

const BASE_RESET = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1080px; height: 1350px; overflow: visible;
  font-family: 'Noto Sans KR', sans-serif;
  word-break: keep-all; line-height: 1.5;
}`;

// ════════════════════════════════════════════
// 카드 1: Hook — 중앙 임팩트 (다크 그라디언트)
// ════════════════════════════════════════════
const card01 = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
${FONT_IMPORT}
<style>
${CSS_VARS}
${BASE_RESET}
body {
  background: linear-gradient(160deg, var(--deep-navy) 0%, var(--navy) 100%);
  color: var(--white);
}
.card {
  width: 1080px; height: 1350px;
  display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  padding: 72px; position: relative;
}
/* 기하 도형 레이어 */
.geo { position: absolute; border-radius: 50%; }
.geo-1 { width: 420px; height: 420px; top: -80px; right: -80px; background: var(--yellow); opacity: 0.08; }
.geo-2 { width: 280px; height: 280px; bottom: 120px; left: -60px; background: var(--white); opacity: 0.05; }
.geo-3 { width: 160px; height: 160px; top: 240px; left: 180px; background: var(--yellow); opacity: 0.12; }
.geo-4 { width: 100px; height: 100px; bottom: 300px; right: 160px; background: var(--cream); opacity: 0.06; border-radius: 16px; transform: rotate(45deg); }
.geo-5 { width: 600px; height: 600px; bottom: -200px; left: 50%; transform: translateX(-50%); background: var(--navy); opacity: 0.3; }

.top-line { position: absolute; top: 0; left: 0; width: 100%; height: 6px; background: var(--yellow); }

.headline {
  font-size: 76px; font-weight: 900; text-align: center;
  line-height: 1.3; max-width: 900px; z-index: 1;
  letter-spacing: -0.03em;
}
.headline em {
  background: var(--yellow); color: var(--text-dark);
  font-style: normal; font-weight: 900;
  padding: 4px 14px; display: inline;
  box-decoration-break: clone; -webkit-box-decoration-break: clone;
}
.subtext {
  font-size: 32px; font-weight: 400; text-align: center;
  color: var(--cream); opacity: 0.85; max-width: 800px;
  margin-top: 36px; z-index: 1; line-height: 1.7;
}
.divider {
  width: 80px; height: 4px; background: var(--yellow);
  border-radius: 2px; margin-top: 48px; z-index: 1;
}
</style>
</head>
<body>
<div class="card">
  <div class="top-line"></div>
  <div class="geo geo-1"></div>
  <div class="geo geo-2"></div>
  <div class="geo geo-3"></div>
  <div class="geo geo-4"></div>
  <div class="geo geo-5"></div>
  <h1 class="headline">중3 수학<br><em>포기하는</em> 이유</h1>
  <p class="subtext">과제만 제대로 해도<br>성적은 바뀝니다</p>
  <div class="divider"></div>
</div>
</body>
</html>`;

// ════════════════════════════════════════════
// 카드 2: Problem — 말풍선 (라이트 배경)
// ════════════════════════════════════════════
const card02 = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
${FONT_IMPORT}
<style>
${CSS_VARS}
${BASE_RESET}
body { background: var(--light-bg); color: var(--text-dark); }
.card {
  width: 1080px; height: 1350px; padding: 72px 72px 60px;
  position: relative; display: flex; flex-direction: column;
}
/* 상단 네이비 헤더 */
.header-bar {
  position: absolute; top: 0; left: 0; width: 100%; height: 140px;
  background: var(--navy); display: flex; align-items: center;
  padding: 0 72px;
}
.header-bar h2 {
  font-size: 42px; font-weight: 900; color: var(--white);
  letter-spacing: -0.03em;
}
.header-bar em {
  background: var(--yellow); color: var(--text-dark);
  font-style: normal; font-weight: 900; padding: 2px 10px;
  box-decoration-break: clone; -webkit-box-decoration-break: clone;
}
.content { margin-top: 180px; flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 28px; }

.bubble-q {
  background: var(--white); border-radius: 24px 24px 24px 4px;
  padding: 44px 52px; font-size: 38px; font-weight: 500;
  line-height: 1.65; max-width: 860px;
  box-shadow: 0 4px 20px rgba(27,43,107,0.08);
  border-left: 5px solid var(--navy);
  position: relative;
}
.bubble-q::after {
  content: ''; position: absolute; bottom: -16px; left: 48px;
  width: 0; height: 0;
  border-left: 14px solid transparent; border-right: 14px solid transparent;
  border-top: 16px solid var(--white);
}
.sender {
  display: flex; align-items: center; gap: 14px; margin-left: 20px;
}
.avatar {
  width: 48px; height: 48px; border-radius: 50%;
  background: var(--navy); color: var(--white);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: 900;
}
.sender-label { font-size: 24px; font-weight: 700; color: var(--navy); opacity: 0.6; }

.bubble-a {
  background: var(--navy); color: var(--white);
  border-radius: 24px 24px 4px 24px;
  padding: 36px 48px; font-size: 36px; font-weight: 700;
  max-width: 720px; align-self: flex-end;
  position: relative;
}
.bubble-a::after {
  content: ''; position: absolute; bottom: -14px; right: 48px;
  width: 0; height: 0;
  border-left: 12px solid transparent; border-right: 12px solid transparent;
  border-top: 14px solid var(--navy);
}

.sub-note {
  font-size: 24px; color: var(--text-dark); opacity: 0.5;
  text-align: center; margin-top: 16px;
}
</style>
</head>
<body>
<div class="card">
  <div class="header-bar">
    <h2>학부모의 <em>진짜</em> 고민</h2>
  </div>
  <div class="content">
    <div class="bubble-q">과제는 대충하고 시험만 벼락치기 하는데<br>성적이 안 나와요</div>
    <div class="sender">
      <div class="avatar">Q</div>
      <span class="sender-label">학부모</span>
    </div>
    <div class="bubble-a">바로 그게 문제입니다</div>
    <p class="sub-note">우리 아이만 이런 게 아니었구나</p>
  </div>
</div>
</body>
</html>`;

// ════════════════════════════════════════════
// 카드 3: Problem — 2×2 아이콘 그리드 (라이트 + 상단 헤더)
// ════════════════════════════════════════════
const card03 = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
${FONT_IMPORT}
<style>
${CSS_VARS}
${BASE_RESET}
body { background: var(--light-bg); color: var(--text-dark); }
.card {
  width: 1080px; height: 1350px; position: relative;
  display: flex; flex-direction: column;
}
.header {
  background: var(--navy); padding: 56px 72px 48px;
  position: relative;
}
.header h1 {
  font-size: 46px; font-weight: 900; color: var(--white);
  letter-spacing: -0.03em;
}
.header em {
  color: var(--yellow); font-style: normal; font-weight: 900;
}
.header .sub { font-size: 24px; color: var(--cream); opacity: 0.7; margin-top: 12px; }
/* 헤더 하단 삼각형 장식 */
.header::after {
  content: ''; position: absolute; bottom: -24px; left: 72px;
  width: 0; height: 0;
  border-left: 28px solid transparent; border-right: 28px solid transparent;
  border-top: 24px solid var(--navy);
}

.grid-area {
  flex: 1; padding: 56px 56px 48px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
  align-content: center;
}
.box {
  background: var(--white); border-radius: 16px;
  padding: 40px 36px;
  box-shadow: 0 2px 12px rgba(27,43,107,0.06);
  display: flex; flex-direction: column;
  border-left: 5px solid var(--navy);
}
.box-icon {
  width: 56px; height: 56px; border-radius: 12px;
  background: var(--navy); color: var(--yellow);
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; margin-bottom: 20px;
}
.box-title { font-size: 34px; font-weight: 900; margin-bottom: 10px; color: var(--navy); }
.box-desc { font-size: 24px; color: var(--text-dark); opacity: 0.6; line-height: 1.5; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h1>과제 관리 <em>실패</em>의 패턴</h1>
    <p class="sub">이런 신호가 보이면 위험합니다</p>
  </div>
  <div class="grid-area">
    <div class="box">
      <div class="box-icon">⏰</div>
      <div class="box-title">지각 제출</div>
      <div class="box-desc">항상 마지막에 급하게</div>
    </div>
    <div class="box">
      <div class="box-icon">📝</div>
      <div class="box-title">대충 완성</div>
      <div class="box-desc">양만 채우고 질은 무시</div>
    </div>
    <div class="box">
      <div class="box-icon">💔</div>
      <div class="box-title">누적 미완</div>
      <div class="box-desc">안 한 과제가 계속 쌓임</div>
    </div>
    <div class="box">
      <div class="box-icon">😰</div>
      <div class="box-title">스트레스</div>
      <div class="box-desc">과제 때문에 공부 싫어함</div>
    </div>
  </div>
</div>
</body>
</html>`;

// ════════════════════════════════════════════
// 카드 4: Data — 73% 대형 숫자 임팩트 (다크 그라디언트)
// ════════════════════════════════════════════
const card04 = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
${FONT_IMPORT}
<style>
${CSS_VARS}
${BASE_RESET}
body {
  background: linear-gradient(170deg, var(--deep-navy) 0%, var(--navy) 100%);
  color: var(--white);
}
.card {
  width: 1080px; height: 1350px;
  display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  padding: 72px; position: relative;
}
/* 기하 도형 */
.geo { position: absolute; }
.geo-ring {
  width: 380px; height: 380px; border-radius: 50%;
  border: 3px solid var(--yellow); opacity: 0.12;
  top: -60px; right: -40px;
}
.geo-rect {
  width: 200px; height: 200px; border-radius: 20px;
  background: var(--yellow); opacity: 0.06;
  bottom: 140px; left: -40px; transform: rotate(15deg);
}
.geo-circle {
  width: 300px; height: 300px; border-radius: 50%;
  background: var(--white); opacity: 0.04;
  top: 350px; right: 60px;
}
.geo-sm {
  width: 120px; height: 120px; border-radius: 50%;
  background: var(--yellow); opacity: 0.1;
  bottom: 80px; right: 200px;
}

.headline {
  font-size: 40px; font-weight: 700; text-align: center;
  color: var(--cream); opacity: 0.9; margin-bottom: 48px; z-index: 1;
  letter-spacing: -0.02em;
}
.stat {
  font-family: 'Inter', sans-serif;
  font-size: 220px; font-weight: 900;
  color: var(--yellow); text-align: center;
  line-height: 1; z-index: 1;
  text-shadow: 0 8px 40px rgba(245,197,24,0.25);
}
.stat-label {
  font-size: 36px; font-weight: 700; text-align: center;
  color: var(--white); opacity: 0.85;
  margin-top: 24px; z-index: 1;
  letter-spacing: 1px;
}
.stat-sub {
  font-size: 26px; font-weight: 400; text-align: center;
  color: var(--cream); opacity: 0.6; margin-top: 20px; z-index: 1;
  max-width: 700px; line-height: 1.6;
}
/* 하단 얇은 Yellow 라인 */
.bottom-line {
  position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%);
  width: 120px; height: 3px; background: var(--yellow); opacity: 0.5;
  border-radius: 2px;
}
</style>
</head>
<body>
<div class="card">
  <div class="geo geo-ring"></div>
  <div class="geo geo-rect"></div>
  <div class="geo geo-circle"></div>
  <div class="geo geo-sm"></div>
  <h2 class="headline">과제 완성도와 성적의 관계</h2>
  <div class="stat">73%</div>
  <p class="stat-label">과제 완성도가 성적 향상에 미치는 영향</p>
  <p class="stat-sub">과제를 꼼꼼히 하는 학생과<br>대충 하는 학생의 차이</p>
  <div class="bottom-line"></div>
</div>
</body>
</html>`;

// ════════════════════════════════════════════
// 카드 5: Insight — 스텝 플로우 (라이트, 좌측 세로바)
// ════════════════════════════════════════════
const card05 = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
${FONT_IMPORT}
<style>
${CSS_VARS}
${BASE_RESET}
body { background: var(--light-bg); color: var(--text-dark); }
.card {
  width: 1080px; height: 1350px; padding: 72px;
  position: relative; display: flex; flex-direction: column;
}
/* 좌측 굵은 세로 악센트 바 */
.accent-bar {
  position: absolute; left: 0; top: 0; width: 8px; height: 100%;
  background: linear-gradient(to bottom, var(--yellow) 0%, var(--navy) 100%);
}

.headline {
  font-size: 46px; font-weight: 900; color: var(--navy);
  margin-bottom: 16px; letter-spacing: -0.03em;
}
.headline em {
  background: var(--yellow); color: var(--text-dark);
  font-style: normal; font-weight: 900; padding: 2px 10px;
  box-decoration-break: clone; -webkit-box-decoration-break: clone;
}
.sub { font-size: 24px; color: var(--text-dark); opacity: 0.5; margin-bottom: 40px; }

.steps { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 12px; }
.step {
  display: flex; align-items: flex-start; position: relative;
  padding: 8px 0;
}
.step-connector {
  position: absolute; left: 35px; top: 76px; width: 3px; height: calc(100% - 20px);
  background: var(--gray-line);
}
.step:last-child .step-connector { display: none; }
.step-num {
  width: 72px; height: 72px; min-width: 72px;
  background: var(--navy); border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: var(--yellow); font-family: 'Inter', sans-serif;
  font-size: 30px; font-weight: 900;
  margin-right: 32px;
  box-shadow: 0 4px 16px rgba(27,43,107,0.15);
}
.step-body { flex: 1; padding-top: 6px; }
.step-title {
  font-size: 38px; font-weight: 900; color: var(--text-dark);
  margin-bottom: 8px;
}
.step-desc { font-size: 24px; color: var(--text-dark); opacity: 0.55; }
</style>
</head>
<body>
<div class="card">
  <div class="accent-bar"></div>
  <h1 class="headline">과제 관리 실패의 <em>진짜</em> 이유</h1>
  <p class="sub">시스템이 없으면 의지만으로는 안 됩니다</p>
  <div class="steps">
    <div class="step">
      <div class="step-connector"></div>
      <span class="step-num">1</span>
      <div class="step-body"><div class="step-title">계획 부재</div><div class="step-desc">언제까지 뭘 해야 할지 모름</div></div>
    </div>
    <div class="step">
      <div class="step-connector"></div>
      <span class="step-num">2</span>
      <div class="step-body"><div class="step-title">진도 파악 불가</div><div class="step-desc">어디까지 했는지 헷갈림</div></div>
    </div>
    <div class="step">
      <div class="step-connector"></div>
      <span class="step-num">3</span>
      <div class="step-body"><div class="step-title">피드백 없음</div><div class="step-desc">잘못된 방향인지 모름</div></div>
    </div>
    <div class="step">
      <span class="step-num">4</span>
      <div class="step-body"><div class="step-title">동기 부족</div><div class="step-desc">왜 해야 하는지 이해 부족</div></div>
    </div>
  </div>
</div>
</body>
</html>`;

// ════════════════════════════════════════════
// 카드 6: Solution — 체크리스트 (상단 네이비 블록 + 하단 화이트)
// ════════════════════════════════════════════
const card06 = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
${FONT_IMPORT}
<style>
${CSS_VARS}
${BASE_RESET}
body { background: var(--white); color: var(--text-dark); }
.card {
  width: 1080px; height: 1350px; position: relative;
  display: flex; flex-direction: column;
}
.header-block {
  background: linear-gradient(135deg, var(--deep-navy) 0%, var(--navy) 100%);
  padding: 56px 72px 52px; position: relative;
}
.header-block h1 {
  font-size: 46px; font-weight: 900; color: var(--white);
  letter-spacing: -0.03em;
}
.header-block em {
  background: var(--yellow); color: var(--text-dark);
  font-style: normal; font-weight: 900; padding: 2px 10px;
  box-decoration-break: clone; -webkit-box-decoration-break: clone;
}
.header-block .sub {
  font-size: 24px; color: var(--cream); opacity: 0.7; margin-top: 12px;
}
/* 헤더 하단 곡선 */
.header-block::after {
  content: ''; position: absolute; bottom: -1px; left: 0;
  width: 100%; height: 24px;
  background: var(--white);
  border-radius: 24px 24px 0 0;
}

.list-area {
  flex: 1; padding: 40px 64px 48px;
  display: flex; flex-direction: column; justify-content: center; gap: 16px;
}
.list-item {
  display: flex; align-items: center; gap: 24px;
  padding: 28px 32px; background: var(--light-bg);
  border-radius: 12px; border-left: 4px solid var(--navy);
}
.check-icon {
  width: 48px; height: 48px; min-width: 48px;
  border-radius: 50%; background: var(--navy);
  display: flex; align-items: center; justify-content: center;
}
.check-icon svg { width: 24px; height: 24px; }
.item-text { font-size: 32px; font-weight: 500; color: var(--text-dark); line-height: 1.4; }
</style>
</head>
<body>
<div class="card">
  <div class="header-block">
    <h1>과제 이행률 <em>100%</em> 시스템</h1>
    <p class="sub">올인원만의 체계적인 과제 관리 방법</p>
  </div>
  <div class="list-area">
    <div class="list-item">
      <div class="check-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#F5C518" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
      <span class="item-text">매일 과제 체크리스트 개별 제공</span>
    </div>
    <div class="list-item">
      <div class="check-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#F5C518" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
      <span class="item-text">실시간 완성도 모니터링</span>
    </div>
    <div class="list-item">
      <div class="check-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#F5C518" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
      <span class="item-text">단계별 힌트와 가이드 제공</span>
    </div>
    <div class="list-item">
      <div class="check-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#F5C518" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
      <span class="item-text">완료시 즉시 피드백</span>
    </div>
    <div class="list-item">
      <div class="check-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#F5C518" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
      <span class="item-text">학부모 진행상황 실시간 공유</span>
    </div>
  </div>
</div>
</body>
</html>`;

// ════════════════════════════════════════════
// 카드 7: Compare — 좌우 분할 (라이트)
// ════════════════════════════════════════════
const card07 = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
${FONT_IMPORT}
<style>
${CSS_VARS}
${BASE_RESET}
body { background: var(--white); color: var(--text-dark); }
.card {
  width: 1080px; height: 1350px; padding: 56px 48px 48px;
  position: relative; display: flex; flex-direction: column;
}
.title-area {
  text-align: center; margin-bottom: 36px;
}
.title-area h1 {
  font-size: 44px; font-weight: 900; color: var(--navy);
  letter-spacing: -0.03em;
}
.title-area em { color: var(--yellow); font-style: normal; font-weight: 900; }
.title-area .sub { font-size: 22px; color: var(--text-dark); opacity: 0.5; margin-top: 12px; }

.compare { display: flex; gap: 20px; flex: 1; }
.side { border-radius: 16px; padding: 44px 36px; display: flex; flex-direction: column; }

.before {
  flex: 1; background: #F0F1F5; border: 1px solid var(--gray-line);
}
.after {
  flex: 1.1; background: var(--navy); color: var(--white);
  box-shadow: 0 8px 32px rgba(27,43,107,0.2);
}

.side-label {
  font-size: 16px; font-weight: 900; letter-spacing: 3px;
  text-transform: uppercase; opacity: 0.4; margin-bottom: 20px;
}
.side-title { font-size: 34px; font-weight: 900; margin-bottom: 32px; line-height: 1.3; }
.after .side-title { color: var(--yellow); }

.side-list { list-style: none; }
.side-list li {
  font-size: 28px; line-height: 1.5;
  padding: 14px 0; border-bottom: 1px solid rgba(0,0,0,0.06);
  display: flex; align-items: flex-start; gap: 12px;
}
.side-list li:last-child { border-bottom: none; }
.after .side-list li { border-bottom-color: rgba(255,255,255,0.1); }
.bullet-before { color: var(--gray-line); font-weight: 900; }
.bullet-after { color: var(--yellow); font-weight: 900; }

/* VS 배지 */
.vs {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 68px; height: 68px; border-radius: 50%;
  background: var(--yellow); color: var(--navy);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 900;
  box-shadow: 0 4px 20px rgba(245,197,24,0.4); z-index: 2;
}
</style>
</head>
<body>
<div class="card">
  <div class="title-area">
    <h1>일반 학원 vs <em>올인원</em></h1>
    <p class="sub">과제 관리 시스템의 구체적 차이점</p>
  </div>
  <div class="compare">
    <div class="side before">
      <span class="side-label">BEFORE</span>
      <div class="side-title">일반 학원</div>
      <ul class="side-list">
        <li><span class="bullet-before">•</span> 과제 체크: 완성 여부만 확인</li>
        <li><span class="bullet-before">•</span> 피드백: 주 1회 간단히</li>
        <li><span class="bullet-before">•</span> 학부모 소통: 월말 전화</li>
        <li><span class="bullet-before">•</span> 진도 관리: 일률적 진행</li>
      </ul>
    </div>
    <div class="side after">
      <span class="side-label">AFTER</span>
      <div class="side-title">올인원 시스템</div>
      <ul class="side-list">
        <li><span class="bullet-after">✓</span> 과제 체크: 단계별 진행률 추적</li>
        <li><span class="bullet-after">✓</span> 피드백: 매일 실시간 제공</li>
        <li><span class="bullet-after">✓</span> 학부모 소통: 앱으로 즉시</li>
        <li><span class="bullet-after">✓</span> 진도 관리: 개별 맞춤 조정</li>
      </ul>
    </div>
  </div>
  <div class="vs">VS</div>
</div>
</body>
</html>`;

// ════════════════════════════════════════════
// 카드 8: Example — 카드형 2×2 (라이트 배경)
// ════════════════════════════════════════════
const card08 = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
${FONT_IMPORT}
<style>
${CSS_VARS}
${BASE_RESET}
body { background: var(--light-bg); color: var(--text-dark); }
.card {
  width: 1080px; height: 1350px; padding: 72px 56px 48px;
  position: relative; display: flex; flex-direction: column;
}
/* 좌상단 장식 라인 */
.deco-lines { position: absolute; top: 0; left: 0; }
.deco-lines div { background: var(--yellow); }
.dl-h { width: 160px; height: 4px; position: absolute; top: 0; left: 0; }
.dl-v { width: 4px; height: 160px; position: absolute; top: 0; left: 0; }

.headline {
  font-size: 46px; font-weight: 900; color: var(--navy);
  margin-bottom: 8px; letter-spacing: -0.03em;
}
.headline em {
  background: var(--yellow); color: var(--text-dark);
  font-style: normal; font-weight: 900; padding: 2px 10px;
  box-decoration-break: clone; -webkit-box-decoration-break: clone;
}
.sub { font-size: 24px; color: var(--text-dark); opacity: 0.5; margin-bottom: 40px; }

.grid {
  flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
  align-content: center;
}
.result-box {
  background: var(--white); border-radius: 16px;
  padding: 44px 36px; text-align: center;
  box-shadow: 0 4px 16px rgba(27,43,107,0.06);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.result-icon {
  width: 64px; height: 64px; border-radius: 16px;
  background: var(--navy); color: var(--yellow);
  display: flex; align-items: center; justify-content: center;
  font-size: 32px; margin-bottom: 20px;
}
.result-title { font-size: 34px; font-weight: 900; color: var(--navy); margin-bottom: 12px; }
.result-desc { font-size: 26px; color: var(--text-dark); opacity: 0.6; }
.result-stat {
  font-family: 'Inter', sans-serif; font-size: 48px; font-weight: 900;
  color: var(--yellow); margin-top: 8px;
}
</style>
</head>
<body>
<div class="card">
  <div class="deco-lines"><div class="dl-h"></div><div class="dl-v"></div></div>
  <h1 class="headline"><em>실제</em> 변화 사례</h1>
  <p class="sub">과제 시스템 도입 후 학생들의 변화</p>
  <div class="grid">
    <div class="result-box">
      <div class="result-icon">📈</div>
      <div class="result-title">성적 상승</div>
      <div class="result-stat">+23점</div>
      <div class="result-desc">평균 향상</div>
    </div>
    <div class="result-box">
      <div class="result-icon">⏰</div>
      <div class="result-title">시간 관리</div>
      <div class="result-desc">계획적 학습 습관</div>
    </div>
    <div class="result-box">
      <div class="result-icon">😊</div>
      <div class="result-title">학습 동기</div>
      <div class="result-desc">수학이 재미있어짐</div>
    </div>
    <div class="result-box">
      <div class="result-icon">👨‍👩‍👧‍👦</div>
      <div class="result-title">학부모 만족</div>
      <div class="result-desc">과제 스트레스 해소</div>
    </div>
  </div>
</div>
</body>
</html>`;

// ════════════════════════════════════════════
// 카드 9: Summary — 대각선 분할 + 핵심 메시지 (다크)
// ════════════════════════════════════════════
const card09 = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
${FONT_IMPORT}
<style>
${CSS_VARS}
${BASE_RESET}
body {
  background: linear-gradient(155deg, var(--deep-navy) 0%, var(--navy) 100%);
  color: var(--white);
}
.card {
  width: 1080px; height: 1350px; padding: 72px;
  position: relative; display: flex; flex-direction: column;
}
/* 대각선 장식 */
.diag {
  position: absolute; top: 0; right: 0;
  width: 0; height: 0;
  border-top: 320px solid rgba(245,197,24,0.08);
  border-left: 520px solid transparent;
}
/* 기하 도형 */
.geo-1 {
  position: absolute; bottom: 100px; left: -40px;
  width: 200px; height: 200px; border-radius: 50%;
  background: var(--yellow); opacity: 0.06;
}
.geo-2 {
  position: absolute; top: 400px; right: -20px;
  width: 140px; height: 140px; border-radius: 20px;
  background: var(--white); opacity: 0.04; transform: rotate(30deg);
}

.headline {
  font-size: 46px; font-weight: 900; color: var(--white);
  margin-bottom: 12px; z-index: 1; letter-spacing: -0.03em;
}
.headline em { color: var(--yellow); font-style: normal; font-weight: 900; }
.sub { font-size: 24px; color: var(--cream); opacity: 0.6; margin-bottom: 40px; z-index: 1; }

.key-list { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 20px; z-index: 1; }
.key-item {
  display: flex; align-items: center; gap: 24px;
  padding: 28px 32px;
  background: rgba(255,255,255,0.06);
  border-radius: 12px; border-left: 4px solid var(--yellow);
}
.key-num {
  font-family: 'Inter', sans-serif; font-size: 28px; font-weight: 900;
  color: var(--yellow); min-width: 40px;
}
.key-text { font-size: 30px; font-weight: 500; color: var(--cream); line-height: 1.4; }
</style>
</head>
<body>
<div class="card">
  <div class="diag"></div>
  <div class="geo-1"></div>
  <div class="geo-2"></div>
  <h1 class="headline">과제 관리 성공의 <em>핵심</em></h1>
  <p class="sub">이것만 기억하세요</p>
  <div class="key-list">
    <div class="key-item">
      <span class="key-num">01</span>
      <span class="key-text">체계적 관리 시스템이 성공의 열쇠</span>
    </div>
    <div class="key-item">
      <span class="key-num">02</span>
      <span class="key-text">실시간 피드백으로 방향 수정</span>
    </div>
    <div class="key-item">
      <span class="key-num">03</span>
      <span class="key-text">학부모와 함께하는 진행 관리</span>
    </div>
    <div class="key-item">
      <span class="key-num">04</span>
      <span class="key-text">단계별 성취로 동기 부여</span>
    </div>
    <div class="key-item">
      <span class="key-num">05</span>
      <span class="key-text">꾸준함이 실력 향상의 지름길</span>
    </div>
  </div>
</div>
</body>
</html>`;

// ════════════════════════════════════════════
// 카드 10: CTA — 중앙 임팩트 (다크 그라디언트)
// ════════════════════════════════════════════
const card10 = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
${FONT_IMPORT}
<style>
${CSS_VARS}
${BASE_RESET}
body {
  background: linear-gradient(160deg, var(--deep-navy) 0%, var(--navy) 100%);
  color: var(--white);
}
.card {
  width: 1080px; height: 1350px; padding: 72px;
  position: relative; display: flex; flex-direction: column;
  justify-content: center; align-items: center; text-align: center;
}
/* 기하 도형 */
.geo { position: absolute; border-radius: 50%; }
.geo-1 { width: 400px; height: 400px; background: var(--yellow); opacity: 0.06; top: -100px; left: -80px; }
.geo-2 { width: 260px; height: 260px; background: var(--white); opacity: 0.04; bottom: 60px; right: -60px; }
.geo-3 { width: 160px; height: 160px; background: var(--yellow); opacity: 0.1; bottom: 300px; left: 120px; }

.top-accent {
  position: absolute; top: 0; left: 50%; transform: translateX(-50%);
  width: 200px; height: 5px; background: var(--yellow); border-radius: 0 0 3px 3px;
}

.headline {
  font-size: 50px; font-weight: 900; line-height: 1.4;
  max-width: 800px; z-index: 1; letter-spacing: -0.03em;
}
.headline em {
  background: var(--yellow); color: var(--text-dark);
  font-style: normal; font-weight: 900; padding: 4px 14px;
  box-decoration-break: clone; -webkit-box-decoration-break: clone;
}
.sub-main {
  font-size: 28px; color: var(--cream); opacity: 0.8;
  margin-top: 32px; z-index: 1; line-height: 1.7;
}
.cta-btn {
  display: inline-flex; align-items: center; gap: 12px;
  background: var(--yellow); color: var(--navy);
  font-size: 34px; font-weight: 900;
  padding: 28px 64px; border-radius: 60px;
  margin-top: 48px; z-index: 1;
  box-shadow: 0 8px 32px rgba(245,197,24,0.3);
  letter-spacing: -0.02em;
}
.cta-sub {
  font-size: 22px; color: var(--cream); opacity: 0.5;
  margin-top: 24px; z-index: 1;
}
</style>
</head>
<body>
<div class="card">
  <div class="top-accent"></div>
  <div class="geo geo-1"></div>
  <div class="geo geo-2"></div>
  <div class="geo geo-3"></div>
  <h1 class="headline"><em>올인원 수학학원</em>에서<br>시작하세요</h1>
  <p class="sub-main">과제 이행률 100% 시스템<br>지금 체험해보세요</p>
  <div class="cta-btn">무료 상담 신청하기</div>
  <p class="cta-sub">카카오 오픈채팅 / 전화 상담 가능</p>
</div>
</body>
</html>`;

// ── HTML 매핑 ──
const htmlMap = {
  1: card01, 2: card02, 3: card03, 4: card04, 5: card05,
  6: card06, 7: card07, 8: card08, 9: card09, 10: card10,
};

// 각 카드에 새 HTML 적용
for (const card of copyData.cards) {
  if (htmlMap[card.number]) {
    card.generated_html = htmlMap[card.number];
    console.log(`  카드 ${String(card.number).padStart(2, '0')}: 새 디자인 적용 완료`);
  }
}
console.log('');

// ── 설정 로드 ──
console.log('▶ 학원 설정 로드');
const { academy, cssVariables } = await loadConfig(ACADEMY_KEY);
console.log(`  ${academy.name} 설정 로드 완료\n`);

// ── PNG 렌더링 ──
console.log(`▶ PNG 렌더링 (로고 포함)`);
console.log(`  출력 폴더: ${OUTPUT_DIR}`);
await renderCards(copyData.cards, cssVariables, academy.name, OUTPUT_DIR, ACADEMY_KEY);

// copy.json 저장
await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('  copy.json 저장 완료');

console.log('');
console.log('═══════════════════════════════════════════');
console.log('  재디자인 완료!');
console.log(`  출력: ${OUTPUT_DIR}`);
console.log('═══════════════════════════════════════════');
