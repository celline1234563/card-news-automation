import 'dotenv/config';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const OUTPUT_DIR = join(ROOT, 'output', '진학학원--진학중등3-3--전교1등비결-선배와의대화-2026-03-23');

// ── 출력 폴더 생성 ──
await mkdir(OUTPUT_DIR, { recursive: true });
console.log(`출력 폴더: ${OUTPUT_DIR}\n`);

// ── 로고 로드 ──
console.log('═══ 로고 로드 ═══');
const logoBuf = await readFile(join(ROOT, 'config', 'logos', 'jinhak.png'));
const logoDataUri = `data:image/png;base64,${logoBuf.toString('base64')}`;
console.log('  로고 로드 완료\n');

// ── 공통 스타일 조각 (라이트 톤) ──
const commonHead = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<style>
:root {
  --navy: #0B1340;
  --card-bg: #FFFFFF;
  --orange: #FF6B00;
  --white: #FFFFFF;
  --light-bg: #F5F6FA;
  --text: #0B1340;
  --dim: rgba(11,19,64,0.45);
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1080px; height: 1350px;
  font-family: 'Noto Sans KR', sans-serif;
  color: var(--text);
  overflow: hidden; word-break: keep-all;
  position: relative; line-height: 1.45;
}
.bg-ring { position: absolute; border-radius: 50%; pointer-events: none; }
.top-logo { position: absolute; top: 40px; left: 64px; z-index: 10; padding: 8px 16px; border-radius: 8px; }
.top-logo img { height: 40px; object-fit: contain; }
.bottom-bar { position: absolute; bottom: 0; left: 0; width: 100%; height: 88px; background: var(--navy); display: flex; align-items: center; justify-content: space-between; padding: 0 48px; z-index: 20; }
.bottom-bar .bar-logo { background: rgba(255,255,255,0.95); padding: 6px 14px; border-radius: 6px; }
.bottom-bar .bar-logo img { height: 32px; object-fit: contain; }
.bottom-bar .bar-cta { background: var(--orange); color: var(--white); font-size: 22px; font-weight: 700; padding: 10px 28px; border-radius: 24px; }
`;

const commonRings = `
<div class="bg-ring" style="width:500px;height:500px;top:-120px;right:-120px;border:3px solid rgba(11,19,64,0.06);"></div>
<div class="bg-ring" style="width:350px;height:350px;bottom:150px;left:-100px;border:2px solid rgba(11,19,64,0.04);"></div>`;

const topLogo = `<div class="top-logo"><img src="${logoDataUri}" /></div>`;
const bottomBar = `<div class="bottom-bar"><div class="bar-logo"><img src="${logoDataUri}" /></div><div class="bar-cta">자세히 보기 →</div></div>`;

// ════════════════════════════════════════════
// 카드 1 — Hook: big-quote (경고 태그 + 큰 헤드라인)
// ════════════════════════════════════════════
const card1Html = `${commonHead}
body { background: var(--light-bg); }
.content { position: relative; padding: 160px 72px 160px; display: flex; flex-direction: column; height: 100%; z-index: 5; }
.warning-tag { display: inline-block; background: var(--orange); color: var(--white); font-size: 28px; font-weight: 700; padding: 10px 28px; border-radius: 6px; margin-bottom: 40px; width: fit-content; letter-spacing: 1px; }
.headline { font-size: 82px; font-weight: 900; line-height: 1.2; margin-bottom: 24px; color: var(--navy); }
.headline .accent { color: var(--orange); }
.sub-copy { font-size: 30px; font-weight: 400; color: var(--dim); margin-bottom: 48px; line-height: 1.6; }
.emphasis-box { border-left: 6px solid var(--orange); padding: 24px 32px; font-size: 32px; font-weight: 700; line-height: 1.7; background: rgba(255,107,0,0.06); border-radius: 0 10px 10px 0; max-width: 760px; color: var(--navy); }
.emphasis-box .accent { color: var(--orange); }
.cta-circle { position: absolute; bottom: 56px; right: 64px; width: 100px; height: 100px; border-radius: 50%; background: var(--orange); display: flex; align-items: center; justify-content: center; z-index: 10; box-shadow: 0 6px 28px rgba(255,107,0,0.35); }
.cta-circle svg { width: 36px; height: 36px; fill: none; stroke: var(--white); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.bottom-logo-sm { position: absolute; bottom: 36px; left: 64px; z-index: 10; padding: 6px 12px; border-radius: 6px; }
.bottom-logo-sm img { height: 32px; object-fit: contain; }
</style>
</head>
<body>
${commonRings}
${topLogo}
<div class="content">
  <div class="warning-tag">예비 중1 필독</div>
  <h1 class="headline"><span class="accent">전교 1등</span> 비결,<br>직접 들어보세요</h1>
  <p class="sub-copy">중위권이었던 학생이 3개월 만에<br>전교 1등을 차지한 진짜 이유</p>
  <div class="emphasis-box">우리학교 <span class="accent">전교 1등 선배</span>가<br>직접 알려드립니다</div>
</div>
<div class="cta-circle"><svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
<div class="bottom-logo-sm"><img src="${logoDataUri}" /></div>
</body></html>`;

// ════════════════════════════════════════════
// 카드 2 — Problem/Quote: 학부모 진짜 고민
// ════════════════════════════════════════════
const card2Html = `${commonHead}
body { background: var(--light-bg); }
.header { padding: 130px 72px 48px; position: relative; z-index: 5; }
.header-badge { display: inline-block; background: var(--orange); color: var(--white); font-size: 24px; font-weight: 700; padding: 8px 24px; border-radius: 24px; margin-bottom: 20px; }
.header-title { font-size: 68px; font-weight: 900; line-height: 1.2; color: var(--navy); }
.header-sub { font-size: 28px; color: var(--dim); margin-top: 14px; line-height: 1.5; }
.quote-area { margin: 32px 72px 0; padding: 48px 52px; background: var(--white); border-radius: 24px; position: relative; z-index: 5; box-shadow: 0 4px 24px rgba(11,19,64,0.08); }
.quote-bubble { background: var(--navy); color: var(--white); font-size: 34px; font-weight: 700; line-height: 1.6; padding: 40px 44px; border-radius: 20px; position: relative; word-break: keep-all; }
.quote-bubble::after { content: ''; position: absolute; top: -20px; left: 60px; border-left: 16px solid transparent; border-right: 16px solid transparent; border-bottom: 20px solid var(--navy); }
.quote-label { font-size: 22px; color: #999; margin-top: 20px; text-align: right; }
</style>
</head>
<body>
${commonRings}
${topLogo}
<div class="header">
  <div class="header-badge">학부모 진짜 속마음</div>
  <h1 class="header-title">중학교 가면<br>우리 아이 괜찮을까?</h1>
  <p class="header-sub">가장 많은 학부모가 공감하는 고민</p>
</div>
<div class="quote-area">
  <div class="quote-bubble">내신 난이도, 선생님 스타일,<br>동아리 활동... 뭐 하나<br>제대로 아는 게 없어요</div>
  <p class="quote-label">— 예비 중1 학부모 실제 고민</p>
</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 3 — Problem/Grid: 정보 부족 4가지 영역
// ════════════════════════════════════════════
const card3Html = `${commonHead}
body { background: var(--light-bg); }
.header { padding: 120px 72px 28px; position: relative; z-index: 5; }
.header-badge { display: inline-block; background: rgba(255,107,0,0.1); color: var(--orange); font-size: 22px; font-weight: 700; padding: 8px 22px; border-radius: 20px; margin-bottom: 16px; }
.header-title { font-size: 68px; font-weight: 900; line-height: 1.2; margin-bottom: 10px; color: var(--navy); }
.header-title .accent { color: var(--orange); }
.header-sub { font-size: 28px; color: var(--dim); }
.grid-area { margin: 36px 56px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; position: relative; z-index: 5; }
.grid-card { background: var(--white); border-radius: 20px; padding: 36px 28px; text-align: center; border-top: 4px solid var(--orange); box-shadow: 0 4px 20px rgba(11,19,64,0.06); }
.grid-icon { width: 60px; height: 60px; background: rgba(255,107,0,0.1); border-radius: 14px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; }
.grid-icon svg { width: 30px; height: 30px; fill: none; stroke: var(--orange); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
.grid-title { font-size: 30px; font-weight: 900; margin-bottom: 8px; color: var(--navy); }
.grid-desc { font-size: 22px; color: var(--dim); line-height: 1.4; }
.warning-banner { margin: 28px 56px 0; background: rgba(255,107,0,0.08); border: 1px solid rgba(255,107,0,0.2); border-radius: 14px; padding: 20px 28px; text-align: center; font-size: 28px; font-weight: 700; color: var(--orange); position: relative; z-index: 5; }
</style>
</head>
<body>
${commonRings}
${topLogo}
<div class="header">
  <div class="header-badge">● 현실 진단</div>
  <h1 class="header-title"><span class="accent">이 정보</span> 없이 입학하면?</h1>
  <p class="header-sub">인터넷으로는 절대 알 수 없는 것들</p>
</div>
<div class="grid-area">
  <div class="grid-card">
    <div class="grid-icon"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg></div>
    <div class="grid-title">내신 난이도</div>
    <div class="grid-desc">학교별 출제 스타일<br>체감 난이도 천차만별</div>
  </div>
  <div class="grid-card">
    <div class="grid-icon"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg></div>
    <div class="grid-title">선생님 스타일</div>
    <div class="grid-desc">과목별 선생님<br>수업·평가 방식 파악</div>
  </div>
  <div class="grid-card">
    <div class="grid-icon"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
    <div class="grid-title">동아리·생기부</div>
    <div class="grid-desc">어떤 활동이 유리한지<br>실전 전략 부재</div>
  </div>
  <div class="grid-card">
    <div class="grid-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
    <div class="grid-title">학교 분위기</div>
    <div class="grid-desc">적응 속도가<br>첫 시험 결과를 좌우</div>
  </div>
</div>
<div class="warning-banner">모르고 가면 1학기 내신에서 바로 드러납니다</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 4 — Data/Stat: 55.1% 중학생 진로 고민
// ════════════════════════════════════════════
const card4Html = `${commonHead}
body { background: var(--light-bg); }
.content { position: relative; z-index: 5; padding: 130px 72px 100px; display: flex; flex-direction: column; align-items: center; text-align: center; }
.badge { display: inline-block; background: var(--orange); color: var(--white); font-size: 24px; font-weight: 700; padding: 8px 24px; border-radius: 24px; margin-bottom: 24px; }
.headline { font-size: 72px; font-weight: 900; line-height: 1.2; margin-bottom: 48px; color: var(--navy); }
.headline .accent { color: var(--orange); }
.big-stat { font-size: 170px; font-weight: 900; color: var(--orange); line-height: 1; text-shadow: 0 6px 30px rgba(255,107,0,0.2); margin-bottom: 16px; }
.stat-label { font-size: 30px; font-weight: 400; color: var(--dim); margin-bottom: 40px; }
.sub-bar { display: flex; align-items: center; justify-content: center; gap: 12px; background: rgba(255,107,0,0.08); border: 1px solid rgba(255,107,0,0.2); border-radius: 16px; padding: 18px 40px; }
.sub-bar-icon svg { width: 28px; height: 28px; fill: none; stroke: var(--orange); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
.sub-bar-text { font-size: 28px; font-weight: 700; color: var(--dim); }
</style>
</head>
<body>
${commonRings}
${topLogo}
<div class="content">
  <div class="badge">놓칠 수 없는 현실</div>
  <h1 class="headline">중학생 <span class="accent">최대 고민</span><br>1위가 뭔지 아세요?</h1>
  <div class="big-stat">55.1%</div>
  <p class="stat-label">진로·진학 문제로 스트레스받는 중학생 비율</p>
  <div class="sub-bar">
    <span class="sub-bar-icon"><svg viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg></span>
    <span class="sub-bar-text">정확한 정보만 있으면 해결됩니다</span>
  </div>
</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 5 — Insight/List: 선배와의 대화가 필요한 이유
// ════════════════════════════════════════════
const card5Html = `${commonHead}
body { background: var(--light-bg); }
.top-bar { position: absolute; top: 40px; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; z-index: 10; }
.top-bar .bar-logo { padding: 8px 16px; border-radius: 8px; }
.top-bar .bar-logo img { height: 40px; object-fit: contain; }
.top-bar .bar-badge { background: rgba(255,107,0,0.1); color: var(--orange); font-size: 22px; font-weight: 700; padding: 8px 22px; border-radius: 20px; }
.header { padding: 120px 72px 20px; position: relative; z-index: 5; }
.header-label { display: flex; align-items: center; gap: 10px; font-size: 22px; color: var(--dim); margin-bottom: 12px; }
.header-label-line { width: 30px; height: 3px; background: var(--orange); border-radius: 2px; }
.headline { font-size: 68px; font-weight: 900; line-height: 1.2; margin-bottom: 16px; color: var(--navy); }
.hl-block { background: var(--orange); color: var(--white); padding: 4px 14px; border-radius: 6px; }
.reasons { padding: 16px 56px 0; display: flex; flex-direction: column; gap: 14px; position: relative; z-index: 5; }
.reason-item { display: flex; align-items: flex-start; gap: 20px; background: var(--white); border-left: 5px solid var(--orange); border-radius: 0 16px 16px 0; padding: 28px 28px; box-shadow: 0 2px 12px rgba(11,19,64,0.05); }
.reason-num { min-width: 44px; height: 44px; background: var(--orange); color: var(--white); font-size: 20px; font-weight: 900; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.reason-body { flex: 1; }
.reason-title { font-size: 30px; font-weight: 900; color: var(--navy); margin-bottom: 6px; }
.reason-desc { font-size: 22px; color: var(--dim); line-height: 1.4; }
</style>
</head>
<body>
${commonRings}
<div class="top-bar"><div class="bar-logo"><img src="${logoDataUri}" /></div><div class="bar-badge">핵심 이유</div></div>
<div class="header">
  <div class="header-label"><span class="header-label-line"></span> 왜 선배한테 들어야 할까?</div>
  <h1 class="headline"><span class="hl-block">선배 경험</span>이 다른 이유</h1>
</div>
<div class="reasons">
  <div class="reason-item">
    <div class="reason-num">01</div>
    <div class="reason-body">
      <div class="reason-title">내신 체감 난이도</div>
      <div class="reason-desc">교과서에 없는 실전 출제 경향</div>
    </div>
  </div>
  <div class="reason-item">
    <div class="reason-num">02</div>
    <div class="reason-body">
      <div class="reason-title">선생님별 특성 파악</div>
      <div class="reason-desc">과목별 수업·평가 스타일 미리 파악</div>
    </div>
  </div>
  <div class="reason-item">
    <div class="reason-num">03</div>
    <div class="reason-body">
      <div class="reason-title">생기부 전략 공유</div>
      <div class="reason-desc">어떤 활동이 실제로 유리한지 경험담</div>
    </div>
  </div>
  <div class="reason-item">
    <div class="reason-num">04</div>
    <div class="reason-body">
      <div class="reason-title">학교 문화·적응 노하우</div>
      <div class="reason-desc">남들보다 한 발 앞서는 준비 가능</div>
    </div>
  </div>
</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 6 — Solution/Checklist: 선배와의 대화 활용법
// ════════════════════════════════════════════
const card6Html = `${commonHead}
body { background: var(--light-bg); }
.top-bar { position: absolute; top: 40px; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; z-index: 10; }
.top-bar .bar-logo { padding: 8px 16px; border-radius: 8px; }
.top-bar .bar-logo img { height: 40px; object-fit: contain; }
.top-bar .bar-badge { background: rgba(255,107,0,0.1); color: var(--orange); font-size: 22px; font-weight: 700; padding: 8px 22px; border-radius: 20px; }
.header { padding: 120px 72px 12px; position: relative; z-index: 5; }
.headline { font-size: 68px; font-weight: 900; line-height: 1.2; margin-bottom: 10px; color: var(--navy); }
.hl-block { background: var(--orange); color: var(--white); padding: 4px 14px; border-radius: 6px; }
.header-sub { font-size: 28px; color: var(--dim); }
.benefits-area { padding: 28px 56px 0; position: relative; z-index: 5; display: flex; flex-direction: column; gap: 14px; }
.benefit-item { display: flex; align-items: center; gap: 20px; background: var(--white); border-left: 5px solid var(--orange); border-radius: 0 16px 16px 0; padding: 24px 28px; box-shadow: 0 2px 12px rgba(11,19,64,0.05); }
.benefit-icon { min-width: 48px; height: 48px; background: var(--orange); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.benefit-icon svg { width: 24px; height: 24px; fill: none; stroke: var(--white); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
.benefit-text { font-size: 30px; font-weight: 700; flex: 1; line-height: 1.4; color: var(--navy); }
</style>
</head>
<body>
${commonRings}
<div class="top-bar"><div class="bar-logo"><img src="${logoDataUri}" /></div><div class="bar-badge">활용 가이드</div></div>
<div class="header">
  <h1 class="headline"><span class="hl-block">이렇게</span> 활용하세요</h1>
  <p class="header-sub">선배와의 대화에서 꼭 물어볼 5가지</p>
</div>
<div class="benefits-area">
  <div class="benefit-item"><div class="benefit-icon"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg></div><div class="benefit-text">내신 시험 난이도와 출제 경향</div></div>
  <div class="benefit-item"><div class="benefit-icon"><svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg></div><div class="benefit-text">과목별 공부법과 준비 전략</div></div>
  <div class="benefit-item"><div class="benefit-icon"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg></div><div class="benefit-text">동아리 활동과 생기부 작성 팁</div></div>
  <div class="benefit-item"><div class="benefit-icon"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div><div class="benefit-text">학교생활 적응 노하우</div></div>
  <div class="benefit-item"><div class="benefit-icon"><svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg></div><div class="benefit-text">진로 선택과 진학 준비 경험담</div></div>
</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 7 — Compare/VS: 일반 정보 vs 선배 정보
// ════════════════════════════════════════════
const card7Html = `${commonHead}
body { background: var(--light-bg); }
.header { padding: 120px 72px 20px; position: relative; z-index: 5; }
.header-label { display: flex; align-items: center; gap: 10px; font-size: 22px; color: var(--dim); margin-bottom: 12px; }
.header-label-line { width: 30px; height: 3px; background: var(--orange); border-radius: 2px; }
.headline { font-size: 64px; font-weight: 900; line-height: 1.2; margin-bottom: 10px; color: var(--navy); }
.headline .accent { color: var(--orange); }
.header-sub { font-size: 26px; color: var(--dim); }
.compare-table { margin: 24px 48px 0; position: relative; z-index: 5; }
.col-headers { display: flex; align-items: center; margin-bottom: 14px; padding: 0 8px; }
.col-left { flex: 1; font-size: 24px; font-weight: 700; color: rgba(11,19,64,0.35); text-align: center; }
.col-vs { width: 56px; height: 56px; background: var(--navy); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; color: var(--white); margin: 0 10px; box-shadow: 0 4px 16px rgba(11,19,64,0.15); }
.col-right { flex: 1; font-size: 24px; font-weight: 700; color: var(--orange); text-align: center; }
.compare-row { display: flex; align-items: stretch; margin-bottom: 10px; }
.cell-left { flex: 1; background: rgba(11,19,64,0.04); border-radius: 12px; padding: 18px 20px; font-size: 24px; color: rgba(11,19,64,0.35); text-align: center; display: flex; align-items: center; justify-content: center; margin-right: 10px; line-height: 1.4; }
.cell-right { flex: 1; background: rgba(255,107,0,0.08); border-left: 4px solid var(--orange); border-radius: 0 12px 12px 0; padding: 18px 20px; font-size: 24px; font-weight: 700; color: var(--navy); text-align: center; display: flex; align-items: center; justify-content: center; margin-left: 10px; line-height: 1.4; }
.highlight-msg { margin: 20px 48px 0; text-align: center; font-size: 28px; font-weight: 700; color: var(--orange); background: rgba(255,107,0,0.06); border: 1px solid rgba(255,107,0,0.2); border-radius: 14px; padding: 18px 24px; position: relative; z-index: 5; }
</style>
</head>
<body>
${commonRings}
${topLogo}
<div class="header">
  <div class="header-label"><span class="header-label-line"></span> 정보의 차이</div>
  <h1 class="headline">인터넷 정보 vs <span class="accent">선배 경험담</span></h1>
  <p class="header-sub">디테일이 성적을 만듭니다</p>
</div>
<div class="compare-table">
  <div class="col-headers"><span class="col-left">일반 정보</span><div class="col-vs">VS</div><span class="col-right">✦ 선배 경험</span></div>
  <div class="compare-row"><div class="cell-left">"수학이 어려워요"</div><div class="cell-right">"2학기 중간 3번 유형 매년 출제"</div></div>
  <div class="compare-row"><div class="cell-left">"선생님이 까다로워요"</div><div class="cell-right">"프린트 중심, 서술형 30% 비중"</div></div>
  <div class="compare-row"><div class="cell-left">"동아리 하면 좋아요"</div><div class="cell-right">"이 동아리가 생기부에 유리해요"</div></div>
  <div class="compare-row"><div class="cell-left">"미리 공부하세요"</div><div class="cell-right">"1학기 중간까지 이 범위 끝내세요"</div></div>
  <div class="compare-row"><div class="cell-left">"학교 분위기 괜찮아요"</div><div class="cell-right">"야자 참여율 높고 학습 분위기 좋아요"</div></div>
</div>
<div class="highlight-msg">이 디테일이 전교 1등의 비밀입니다</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 8 — Testimonial: 실제 후기 4건
// ════════════════════════════════════════════
const card8Html = `${commonHead}
body { background: var(--light-bg); }
.top-bar { position: absolute; top: 40px; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; z-index: 10; }
.top-bar .bar-logo { padding: 8px 16px; border-radius: 8px; }
.top-bar .bar-logo img { height: 40px; object-fit: contain; }
.top-bar .bar-badge { background: rgba(255,107,0,0.1); color: var(--orange); font-size: 22px; font-weight: 700; padding: 8px 22px; border-radius: 20px; }
.trophy-header { margin: 120px 56px 24px; background: var(--white); border: 1px solid rgba(11,19,64,0.08); border-radius: 20px; padding: 24px 36px; text-align: center; position: relative; z-index: 5; box-shadow: 0 4px 20px rgba(11,19,64,0.06); }
.trophy-emoji { font-size: 40px; margin-bottom: 6px; }
.trophy-en { font-size: 18px; font-weight: 900; color: var(--orange); letter-spacing: 3px; margin-bottom: 4px; }
.trophy-ko { font-size: 26px; font-weight: 700; color: var(--navy); }
.reviews { padding: 0 56px; display: flex; flex-direction: column; gap: 12px; position: relative; z-index: 5; }
.review-card { background: var(--white); border-left: 5px solid var(--orange); border-radius: 0 16px 16px 0; padding: 24px 28px; box-shadow: 0 2px 12px rgba(11,19,64,0.05); }
.review-quote { font-size: 26px; font-weight: 700; color: var(--navy); line-height: 1.5; margin-bottom: 8px; }
.review-quote .accent { color: var(--orange); }
.review-who { font-size: 20px; color: var(--dim); }
.cta-banner { margin: 16px 56px 0; background: rgba(255,107,0,0.06); border: 1px solid rgba(255,107,0,0.2); border-radius: 14px; padding: 16px 24px; text-align: center; font-size: 24px; font-weight: 700; color: var(--orange); position: relative; z-index: 5; }
</style>
</head>
<body>
${commonRings}
<div class="top-bar"><div class="bar-logo"><img src="${logoDataUri}" /></div><div class="bar-badge">실제 후기</div></div>
<div class="trophy-header">
  <div class="trophy-emoji">💬</div>
  <div class="trophy-en">REAL REVIEWS</div>
  <div class="trophy-ko">선배 만남 후 실제 변화</div>
</div>
<div class="reviews">
  <div class="review-card">
    <div class="review-quote">"학교 전통을 미리 알아서<br><span class="accent">적응이 정말 빨랐어요</span>"</div>
    <div class="review-who">— 동일중 진학 학생</div>
  </div>
  <div class="review-card">
    <div class="review-quote">"시험 정보 덕분에<br><span class="accent">효율적으로 공부했어요</span>"</div>
    <div class="review-who">— 시흥중 진학 학생</div>
  </div>
  <div class="review-card">
    <div class="review-quote">"동아리 활동 방향을<br><span class="accent">제대로 잡을 수 있었어요</span>"</div>
    <div class="review-who">— 난우중 진학 학생</div>
  </div>
  <div class="review-card">
    <div class="review-quote">"<span class="accent">마음가짐부터 달라졌어요</span><br>자신감이 생겼습니다"</div>
    <div class="review-who">— 가산중 진학 학생</div>
  </div>
</div>
<div class="cta-banner">우리 아이도 이런 변화를 경험할 수 있어요</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 9 — Summary: 핵심정리 (번호 + 태그)
// ════════════════════════════════════════════
const card9Html = `${commonHead}
body { background: var(--light-bg); }
.top-bar { position: absolute; top: 40px; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; z-index: 10; }
.top-bar .bar-logo { padding: 8px 16px; border-radius: 8px; }
.top-bar .bar-logo img { height: 40px; object-fit: contain; }
.top-bar .bar-badge { background: rgba(255,107,0,0.1); color: var(--orange); font-size: 22px; font-weight: 700; padding: 8px 22px; border-radius: 20px; }
.trophy-box { margin: 116px 56px 20px; background: var(--white); border: 1px solid rgba(11,19,64,0.08); border-radius: 20px; padding: 24px 36px; text-align: center; position: relative; z-index: 5; box-shadow: 0 4px 20px rgba(11,19,64,0.06); }
.trophy-check { font-size: 36px; margin-bottom: 6px; }
.trophy-en { font-size: 18px; font-weight: 900; color: var(--orange); letter-spacing: 3px; margin-bottom: 4px; }
.trophy-ko { font-size: 26px; font-weight: 700; color: var(--navy); }
.trophy-sub { font-size: 20px; color: var(--dim); margin-top: 4px; }
.summary-list { padding: 12px 56px 0; display: flex; flex-direction: column; gap: 10px; position: relative; z-index: 5; }
.summary-item { display: flex; align-items: center; gap: 16px; background: var(--white); border-left: 5px solid var(--orange); border-radius: 0 14px 14px 0; padding: 18px 22px; box-shadow: 0 2px 12px rgba(11,19,64,0.05); }
.summary-num { min-width: 38px; height: 38px; background: var(--orange); color: var(--white); font-size: 18px; font-weight: 900; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.summary-text { flex: 1; font-size: 26px; font-weight: 700; line-height: 1.4; color: var(--navy); }
.summary-tag { font-size: 18px; font-weight: 900; color: var(--orange); background: rgba(255,107,0,0.08); padding: 4px 14px; border-radius: 6px; white-space: nowrap; }
.cta-banner { margin: 16px 56px 0; background: rgba(255,107,0,0.06); border: 1px solid rgba(255,107,0,0.2); border-radius: 14px; padding: 16px 24px; text-align: center; font-size: 24px; font-weight: 700; color: var(--orange); position: relative; z-index: 5; }
</style>
</head>
<body>
${commonRings}
<div class="top-bar"><div class="bar-logo"><img src="${logoDataUri}" /></div><div class="bar-badge">핵심 정리</div></div>
<div class="trophy-box">
  <div class="trophy-check">✅</div>
  <div class="trophy-en">KEY SUMMARY</div>
  <div class="trophy-ko">선배와의 대화 핵심정리</div>
  <div class="trophy-sub">이것만 기억하세요</div>
</div>
<div class="summary-list">
  <div class="summary-item"><div class="summary-num">01</div><div class="summary-text">우리 학교 특성과 전통 미리 파악</div><div class="summary-tag">적응</div></div>
  <div class="summary-item"><div class="summary-num">02</div><div class="summary-text">내신 난이도·출제 경향 정확 이해</div><div class="summary-tag">내신</div></div>
  <div class="summary-item"><div class="summary-num">03</div><div class="summary-text">동아리 활동 방향 설정</div><div class="summary-tag">생기부</div></div>
  <div class="summary-item"><div class="summary-num">04</div><div class="summary-text">생기부 전략과 진로 계획 수립</div><div class="summary-tag">전략</div></div>
  <div class="summary-item"><div class="summary-num">05</div><div class="summary-text">자신감 회복 + 목표 의식 강화</div><div class="summary-tag">마인드</div></div>
</div>
<div class="cta-banner">선배 한 명의 경험이 아이의 인생을 바꿉니다</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 10 — CTA: clean CTA
// ════════════════════════════════════════════
const card10Html = `${commonHead}
body { background: var(--light-bg); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.content { position: relative; z-index: 5; display: flex; flex-direction: column; align-items: center; padding: 0 72px; }
.badge { display: inline-block; background: rgba(255,107,0,0.1); color: var(--orange); font-size: 26px; font-weight: 700; padding: 10px 28px; border-radius: 24px; margin-bottom: 32px; }
.headline { font-size: 80px; font-weight: 900; line-height: 1.2; margin-bottom: 20px; color: var(--navy); }
.headline .accent { color: var(--orange); }
.sub-copy { font-size: 30px; font-weight: 400; color: var(--dim); margin-bottom: 20px; line-height: 1.5; }
.info-line { font-size: 26px; font-weight: 700; color: var(--orange); margin-bottom: 48px; }
.cta-btn { background: var(--orange); color: var(--white); font-size: 36px; font-weight: 900; padding: 24px 64px; border-radius: 60px; box-shadow: 0 8px 36px rgba(255,107,0,0.3); margin-bottom: 32px; }
.info-text { font-size: 22px; color: var(--dim); }
.bottom-logo-pill { position: absolute; bottom: 48px; left: 50%; transform: translateX(-50%); z-index: 10; padding: 8px 20px; border-radius: 8px; }
.bottom-logo-pill img { height: 32px; object-fit: contain; }
</style>
</head>
<body>
<div class="bg-ring" style="width:600px;height:600px;top:-150px;left:-150px;border:3px solid rgba(11,19,64,0.06);"></div>
<div class="bg-ring" style="width:450px;height:450px;bottom:-100px;right:-100px;border:2px solid rgba(11,19,64,0.04);"></div>
<div class="bg-ring" style="width:300px;height:300px;top:200px;right:50px;border:2px solid rgba(11,19,64,0.03);"></div>
${topLogo}
<div class="content">
  <div class="badge">선배 만남 신청</div>
  <h1 class="headline"><span class="accent">전교 1등</span> 선배가<br>기다리고 있어요</h1>
  <p class="sub-copy">동일중·난우중·시흥중 전교권 선배<br>직접 만나보세요</p>
  <p class="info-line">소그룹 5~8명 / 선착순 마감</p>
  <div class="cta-btn">선배 만남 상담신청 →</div>
  <p class="info-text">관악구·금천구 중학교 | 전교 1등 선배 | 선착순</p>
</div>
<div class="bottom-logo-pill"><img src="${logoDataUri}" /></div>
</body></html>`;

// ── 카드 배열 구성 ──
const allCards = [
  { number: 1, type: 'hook', generated_html: card1Html },
  { number: 2, type: 'problem-quote', generated_html: card2Html },
  { number: 3, type: 'problem-grid', generated_html: card3Html },
  { number: 4, type: 'data-stat', generated_html: card4Html },
  { number: 5, type: 'insight-list', generated_html: card5Html },
  { number: 6, type: 'solution-checklist', generated_html: card6Html },
  { number: 7, type: 'compare-vs', generated_html: card7Html },
  { number: 8, type: 'testimonial', generated_html: card8Html },
  { number: 9, type: 'summary', generated_html: card9Html },
  { number: 10, type: 'cta', generated_html: card10Html },
];

// ── copy.json 저장 ──
console.log('═══ copy.json 저장 ═══');
const copyData = {
  topic: '전교1등비결-선배와의대화',
  academy: 'jinhak',
  cards: allCards,
};
await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('  copy.json 저장 완료\n');

// ── Puppeteer 렌더링 ──
console.log('═══ PNG 렌더링 (10장) ═══');
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});

for (const card of allCards) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350 });
  await page.setContent(card.generated_html, { waitUntil: 'load', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);

  const num = String(card.number).padStart(2, '0');
  const outPath = join(OUTPUT_DIR, `card-${num}.png`);
  await page.screenshot({ path: outPath, type: 'png' });
  await page.close();
  console.log(`  card-${num}.png 완료`);
}

await browser.close();
console.log('\n═══ 전체 완료! 10장 PNG 렌더링 성공 ═══');
console.log(`출력 폴더: ${OUTPUT_DIR}`);
