import 'dotenv/config';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const OUTPUT_DIR = join(ROOT, 'output', '진학학원--진학중등3-5--전과목클리닉확대-2026-03-19');

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
.headline { font-size: 88px; font-weight: 900; line-height: 1.2; margin-bottom: 24px; color: var(--navy); }
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
  <div class="warning-tag">중3 필독</div>
  <h1 class="headline"><span class="accent">전과목 올백</span><br>가능할까?</h1>
  <p class="sub-copy">중3 2학기, 지금이 마지막 기회<br>국영수만으론 1등급 절대 불가</p>
  <div class="emphasis-box">진학학원만의<br><span class="accent">전과목 클리닉</span>이 답입니다</div>
</div>
<div class="cta-circle"><svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
<div class="bottom-logo-sm"><img src="${logoDataUri}" /></div>
</body></html>`;

// ════════════════════════════════════════════
// 카드 2 — Problem/Quote: navy header + speech bubble
// ════════════════════════════════════════════
const card2Html = `${commonHead}
body { background: var(--light-bg); }
.header { padding: 130px 72px 48px; position: relative; z-index: 5; }
.header-badge { display: inline-block; background: var(--orange); color: var(--white); font-size: 24px; font-weight: 700; padding: 8px 24px; border-radius: 24px; margin-bottom: 20px; }
.header-title { font-size: 72px; font-weight: 900; line-height: 1.2; color: var(--navy); }
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
  <h1 class="header-title">다른 과목은 포기하고<br>국영수만 하면 되겠지?</h1>
  <p class="header-sub">절대 그렇지 않습니다</p>
</div>
<div class="quote-area">
  <div class="quote-bubble">국영수는 다 잘하는데<br>왜 등급이 안 올라가지?</div>
  <p class="quote-label">— 학부모 실제 고민</p>
</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 3 — Problem/Two-column: 4항목 그리드
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
  <h1 class="header-title"><span class="accent">이런 상황</span> 많지 않나요?</h1>
  <p class="header-sub">대부분의 학생이 겪는 악순환</p>
</div>
<div class="grid-area">
  <div class="grid-card">
    <div class="grid-icon"><svg viewBox="0 0 24 24"><path d="M18.364 5.636a9 9 0 11-12.728 0"/><path d="M12 2v4"/></svg></div>
    <div class="grid-title">과학·사회 방치</div>
    <div class="grid-desc">국영수만 하다가<br>나머지 과목 포기</div>
  </div>
  <div class="grid-card">
    <div class="grid-icon"><svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg></div>
    <div class="grid-title">암기만 반복</div>
    <div class="grid-desc">이해 없이 외우기만<br>반복하는 악순환</div>
  </div>
  <div class="grid-card">
    <div class="grid-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg></div>
    <div class="grid-title">구멍 누적</div>
    <div class="grid-desc">기초부터 빠져서<br>점점 벌어지는 격차</div>
  </div>
  <div class="grid-card">
    <div class="grid-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
    <div class="grid-title">시간 부족</div>
    <div class="grid-desc">중3 2학기<br>시간이 없다</div>
  </div>
</div>
<div class="warning-banner">지금 잡지 않으면 고등에서 무너집니다</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 4 — Data/Stat: big stat + 서브 바
// ════════════════════════════════════════════
const card4Html = `${commonHead}
body { background: var(--light-bg); }
.content { position: relative; z-index: 5; padding: 130px 72px 100px; display: flex; flex-direction: column; align-items: center; text-align: center; }
.badge { display: inline-block; background: var(--orange); color: var(--white); font-size: 24px; font-weight: 700; padding: 8px 24px; border-radius: 24px; margin-bottom: 24px; }
.headline { font-size: 76px; font-weight: 900; line-height: 1.2; margin-bottom: 48px; color: var(--navy); }
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
  <h1 class="headline"><span class="accent">수시 모집</span> 비율<br>얼마인지 아세요?</h1>
  <div class="big-stat">79.6%</div>
  <p class="stat-label">2025 수시 모집 비율</p>
  <div class="sub-bar">
    <span class="sub-bar-icon"><svg viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg></span>
    <span class="sub-bar-text">내신이 곧 대입, 전과목이 관건</span>
  </div>
</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 5 — Insight: 무너지는 구조 (flow/cascade)
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
.headline { font-size: 72px; font-weight: 900; line-height: 1.2; margin-bottom: 8px; color: var(--navy); }
.hl-block { background: var(--orange); color: var(--white); padding: 4px 14px; border-radius: 6px; }
.cascade { padding: 32px 72px 0; position: relative; z-index: 5; display: flex; flex-direction: column; align-items: center; gap: 0; }
.cascade-step { width: 100%; padding: 28px 36px; border-radius: 16px; text-align: center; position: relative; }
.cascade-step.step1 { background: var(--white); border: 1px solid rgba(11,19,64,0.1); box-shadow: 0 2px 12px rgba(11,19,64,0.05); }
.cascade-step.step2 { background: rgba(255,107,0,0.06); border: 1px solid rgba(255,107,0,0.15); width: 92%; }
.cascade-step.step3 { background: rgba(255,107,0,0.12); border: 1px solid rgba(255,107,0,0.25); width: 84%; }
.cascade-step.step4 { background: var(--orange); width: 76%; color: var(--white); }
.cascade-num { font-size: 18px; font-weight: 900; color: var(--orange); letter-spacing: 2px; margin-bottom: 6px; }
.cascade-step.step4 .cascade-num { color: rgba(255,255,255,0.7); }
.cascade-title { font-size: 34px; font-weight: 900; line-height: 1.3; color: var(--navy); }
.cascade-step.step4 .cascade-title { color: var(--white); }
.cascade-desc { font-size: 22px; color: var(--dim); margin-top: 4px; }
.cascade-step.step4 .cascade-desc { color: rgba(255,255,255,0.8); }
.cascade-arrow { display: flex; justify-content: center; padding: 8px 0; }
.cascade-arrow svg { width: 28px; height: 28px; fill: none; stroke: var(--orange); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.result-msg { margin: 28px 72px 0; text-align: center; font-size: 28px; font-weight: 700; color: var(--orange); background: rgba(255,107,0,0.06); border: 1px solid rgba(255,107,0,0.2); border-radius: 14px; padding: 18px 24px; position: relative; z-index: 5; }
</style>
</head>
<body>
${commonRings}
<div class="top-bar"><div class="bar-logo"><img src="${logoDataUri}" /></div><div class="bar-badge">구조 분석</div></div>
<div class="header">
  <div class="header-label"><span class="header-label-line"></span> 왜 성적이 무너질까?</div>
  <h1 class="headline"><span class="hl-block">무너지는</span> 구조 공개</h1>
</div>
<div class="cascade">
  <div class="cascade-step step1">
    <div class="cascade-num">STEP 01</div>
    <div class="cascade-title">국영수만 집중</div>
    <div class="cascade-desc">다른 과목은 나중에 하면 되겠지</div>
  </div>
  <div class="cascade-arrow"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg></div>
  <div class="cascade-step step2">
    <div class="cascade-num">STEP 02</div>
    <div class="cascade-title">과학·사회 방치</div>
    <div class="cascade-desc">시간 부족으로 아예 손을 놓음</div>
  </div>
  <div class="cascade-arrow"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg></div>
  <div class="cascade-step step3">
    <div class="cascade-num">STEP 03</div>
    <div class="cascade-title">이해 부족 누적</div>
    <div class="cascade-desc">기초 구멍이 점점 커짐</div>
  </div>
  <div class="cascade-arrow"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg></div>
  <div class="cascade-step step4">
    <div class="cascade-num">STEP 04</div>
    <div class="cascade-title">전체 성적 무너짐</div>
    <div class="cascade-desc">내신 등급 회복 불가</div>
  </div>
</div>
<div class="result-msg">이 구조를 끊어야 성적이 오릅니다</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 6 — Solution/List: 전과목 클리닉 해결책
// ════════════════════════════════════════════
const card6Html = `${commonHead}
body { background: var(--light-bg); }
.top-bar { position: absolute; top: 40px; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; z-index: 10; }
.top-bar .bar-logo { padding: 8px 16px; border-radius: 8px; }
.top-bar .bar-logo img { height: 40px; object-fit: contain; }
.top-bar .bar-badge { background: rgba(255,107,0,0.1); color: var(--orange); font-size: 22px; font-weight: 700; padding: 8px 22px; border-radius: 20px; }
.header { padding: 120px 72px 12px; position: relative; z-index: 5; }
.headline { font-size: 72px; font-weight: 900; line-height: 1.2; margin-bottom: 10px; color: var(--navy); }
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
<div class="top-bar"><div class="bar-logo"><img src="${logoDataUri}" /></div><div class="bar-badge">해결책 공개</div></div>
<div class="header">
  <h1 class="headline"><span class="hl-block">전과목 클리닉</span><br>해결책</h1>
  <p class="header-sub">진학학원이 준비한 5가지 솔루션</p>
</div>
<div class="benefits-area">
  <div class="benefit-item"><div class="benefit-icon"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div><div class="benefit-text">개별 질문으로 즉시 해결</div></div>
  <div class="benefit-item"><div class="benefit-icon"><svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg></div><div class="benefit-text">숙제 오답까지 완벽 관리</div></div>
  <div class="benefit-item"><div class="benefit-icon"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><div class="benefit-text">약점 집중 맞춤 보완</div></div>
  <div class="benefit-item"><div class="benefit-icon"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg></div><div class="benefit-text">시험 대비 체계적 점검</div></div>
  <div class="benefit-item"><div class="benefit-icon"><svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg></div><div class="benefit-text">모든 과목 빈틈없이 케어</div></div>
</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 7 — Compare/VS: 대부분 학원 vs 진학학원
// ════════════════════════════════════════════
const card7Html = `${commonHead}
body { background: var(--light-bg); }
.header { padding: 120px 72px 20px; position: relative; z-index: 5; }
.header-label { display: flex; align-items: center; gap: 10px; font-size: 22px; color: var(--dim); margin-bottom: 12px; }
.header-label-line { width: 30px; height: 3px; background: var(--orange); border-radius: 2px; }
.headline { font-size: 68px; font-weight: 900; line-height: 1.2; margin-bottom: 10px; color: var(--navy); }
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
  <div class="header-label"><span class="header-label-line"></span> 차별화의 완성</div>
  <h1 class="headline">대부분 학원 vs <span class="accent">진학학원</span></h1>
  <p class="header-sub">놓치는 부분까지 완벽하게</p>
</div>
<div class="compare-table">
  <div class="col-headers"><span class="col-left">대부분 학원</span><div class="col-vs">VS</div><span class="col-right">✦ 진학학원</span></div>
  <div class="compare-row"><div class="cell-left">국영수만 관리</div><div class="cell-right">전과목 완벽 케어</div></div>
  <div class="compare-row"><div class="cell-left">모르는 문제 넘어감</div><div class="cell-right">개별 1:1 즉시 해결</div></div>
  <div class="compare-row"><div class="cell-left">일괄 진도 수업</div><div class="cell-right">맞춤형 약점 보완</div></div>
  <div class="compare-row"><div class="cell-left">숙제 확인만</div><div class="cell-right">오답까지 완벽 관리</div></div>
  <div class="compare-row"><div class="cell-left">시험 전 벼락치기</div><div class="cell-right">체계적 시험 대비</div></div>
</div>
<div class="highlight-msg">진학학원은 놓치는 과목이 없습니다</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 8 — Example/Stats: 실제 효과 (2x2 grid)
// ════════════════════════════════════════════
const card8Html = `${commonHead}
body { background: var(--light-bg); }
.top-bar { position: absolute; top: 40px; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; z-index: 10; }
.top-bar .bar-logo { padding: 8px 16px; border-radius: 8px; }
.top-bar .bar-logo img { height: 40px; object-fit: contain; }
.top-bar .bar-badge { background: rgba(255,107,0,0.1); color: var(--orange); font-size: 22px; font-weight: 700; padding: 8px 22px; border-radius: 20px; }
.trophy-header { margin: 120px 56px 28px; background: var(--white); border: 1px solid rgba(11,19,64,0.08); border-radius: 20px; padding: 28px 36px; text-align: center; position: relative; z-index: 5; box-shadow: 0 4px 20px rgba(11,19,64,0.06); }
.trophy-emoji { font-size: 44px; margin-bottom: 8px; }
.trophy-en { font-size: 20px; font-weight: 900; color: var(--orange); letter-spacing: 3px; margin-bottom: 4px; }
.trophy-ko { font-size: 28px; font-weight: 700; color: var(--navy); }
.stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 0 56px; position: relative; z-index: 5; }
.stat-card { background: var(--white); border-left: 5px solid var(--orange); border-radius: 0 20px 20px 0; padding: 32px 28px; text-align: center; box-shadow: 0 2px 12px rgba(11,19,64,0.05); }
.stat-icon { font-size: 36px; margin-bottom: 10px; }
.stat-title { font-size: 32px; font-weight: 900; color: var(--orange); line-height: 1.2; margin-bottom: 6px; }
.stat-label { font-size: 22px; font-weight: 700; color: var(--dim); margin-top: 4px; line-height: 1.4; }
.cta-banner { margin: 24px 56px 0; background: rgba(255,107,0,0.06); border: 1px solid rgba(255,107,0,0.2); border-radius: 14px; padding: 18px 24px; text-align: center; font-size: 26px; font-weight: 700; color: var(--orange); position: relative; z-index: 5; }
</style>
</head>
<body>
${commonRings}
<div class="top-bar"><div class="bar-logo"><img src="${logoDataUri}" /></div><div class="bar-badge">효과 검증</div></div>
<div class="trophy-header">
  <div class="trophy-emoji">📊</div>
  <div class="trophy-en">REAL RESULTS</div>
  <div class="trophy-ko">실제 효과 확인됨</div>
</div>
<div class="stat-grid">
  <div class="stat-card"><div class="stat-icon">🚀</div><div class="stat-title">만족도<br>급상승</div><div class="stat-label">수강생 만족도<br>대폭 상승</div></div>
  <div class="stat-card"><div class="stat-icon">💡</div><div class="stat-title">이해도<br>완성</div><div class="stat-label">과학·사회<br>개념 이해 완료</div></div>
  <div class="stat-card"><div class="stat-icon">📚</div><div class="stat-title">전과목<br>확대</div><div class="stat-label">국영수 + 과학사회<br>완벽 커버</div></div>
  <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-title">검증된<br>시스템</div><div class="stat-label">체계적 관리로<br>성적 향상 입증</div></div>
</div>
<div class="cta-banner">검증된 시스템으로 전과목을 잡으세요</div>
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
  <div class="trophy-ko">전과목 관리 핵심정리</div>
  <div class="trophy-sub">이것만 기억하세요</div>
</div>
<div class="summary-list">
  <div class="summary-item"><div class="summary-num">01</div><div class="summary-text">국영수 + 과학사회 전과목 커버</div><div class="summary-tag">범위</div></div>
  <div class="summary-item"><div class="summary-num">02</div><div class="summary-text">개별 맞춤형 1:1 클리닉 시스템</div><div class="summary-tag">핵심</div></div>
  <div class="summary-item"><div class="summary-num">03</div><div class="summary-text">모르는 문제 즉시 완벽 해결</div><div class="summary-tag">즉시</div></div>
  <div class="summary-item"><div class="summary-num">04</div><div class="summary-text">월화 성공 → 수목 전과목 확대</div><div class="summary-tag">확장</div></div>
  <div class="summary-item"><div class="summary-num">05</div><div class="summary-text">중3 마지막 성적 상승 기회</div><div class="summary-tag">긴급</div></div>
</div>
<div class="cta-banner">지금이 전과목을 잡을 마지막 타이밍입니다</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 10 — CTA: clean CTA
// ════════════════════════════════════════════
const card10Html = `${commonHead}
body { background: var(--light-bg); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.content { position: relative; z-index: 5; display: flex; flex-direction: column; align-items: center; padding: 0 72px; }
.badge { display: inline-block; background: rgba(255,107,0,0.1); color: var(--orange); font-size: 26px; font-weight: 700; padding: 10px 28px; border-radius: 24px; margin-bottom: 32px; }
.headline { font-size: 84px; font-weight: 900; line-height: 1.2; margin-bottom: 20px; color: var(--navy); }
.headline .accent { color: var(--orange); }
.sub-copy { font-size: 30px; font-weight: 400; color: var(--dim); margin-bottom: 20px; line-height: 1.5; }
.info-line { font-size: 26px; font-weight: 700; color: var(--orange); margin-bottom: 48px; }
.cta-btn { background: var(--orange); color: var(--white); font-size: 38px; font-weight: 900; padding: 24px 72px; border-radius: 60px; box-shadow: 0 8px 36px rgba(255,107,0,0.3); margin-bottom: 32px; }
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
  <div class="badge">지금 바로 신청</div>
  <h1 class="headline"><span class="accent">진학학원</span>에서<br>시작하세요</h1>
  <p class="sub-copy">전과목 클리닉 일정 곧 공개</p>
  <p class="info-line">선착순 마감 예상</p>
  <div class="cta-btn">전과목 클리닉 상담신청 →</div>
  <p class="info-text">중3 전과목 | 1:1 맞춤 클리닉 | 선착순 마감</p>
</div>
<div class="bottom-logo-pill"><img src="${logoDataUri}" /></div>
</body></html>`;

// ── 카드 배열 구성 ──
const allCards = [
  { number: 1, type: 'hook', generated_html: card1Html },
  { number: 2, type: 'problem-quote', generated_html: card2Html },
  { number: 3, type: 'problem-grid', generated_html: card3Html },
  { number: 4, type: 'data-stat', generated_html: card4Html },
  { number: 5, type: 'insight-cascade', generated_html: card5Html },
  { number: 6, type: 'solution-list', generated_html: card6Html },
  { number: 7, type: 'compare-vs', generated_html: card7Html },
  { number: 8, type: 'example-stats', generated_html: card8Html },
  { number: 9, type: 'summary', generated_html: card9Html },
  { number: 10, type: 'cta', generated_html: card10Html },
];

// ── copy.json 저장 ──
console.log('═══ copy.json 저장 ═══');
const copyData = {
  topic: '전과목클리닉확대',
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
