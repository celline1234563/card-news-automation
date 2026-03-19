import 'dotenv/config';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const OUTPUT_DIR = join(ROOT, 'output', '진학학원--진학중등3-2--32프로는-그냥-놓치는-무료일일특강-2026-03-19');

// ── 출력 폴더 생성 ──
await mkdir(OUTPUT_DIR, { recursive: true });
console.log(`출력 폴더: ${OUTPUT_DIR}\n`);

// ── 로고 로드 ──
console.log('═══ 로고 로드 ═══');
const logoBuf = await readFile(join(ROOT, 'config', 'logos', 'jinhak.png'));
const logoDataUri = `data:image/png;base64,${logoBuf.toString('base64')}`;
console.log('  로고 로드 완료\n');

// ── 공통 스타일 조각 ──
const commonHead = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<style>
:root {
  --navy: #0B1340;
  --card-bg: #151B4A;
  --orange: #FF6B00;
  --white: #FFFFFF;
  --light-bg: #F5F6FA;
  --dim: rgba(255,255,255,0.5);
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1080px; height: 1350px;
  font-family: 'Noto Sans KR', sans-serif;
  color: var(--white);
  overflow: hidden; word-break: keep-all;
  position: relative; line-height: 1.45;
}
.bg-ring { position: absolute; border-radius: 50%; pointer-events: none; }
.top-logo { position: absolute; top: 40px; left: 64px; z-index: 10; background: rgba(255,255,255,0.95); padding: 8px 16px; border-radius: 8px; }
.top-logo img { height: 40px; object-fit: contain; }
.bottom-bar { position: absolute; bottom: 0; left: 0; width: 100%; height: 88px; background: rgba(11,19,64,0.95); display: flex; align-items: center; justify-content: space-between; padding: 0 48px; z-index: 20; }
.bottom-bar .bar-logo { background: rgba(255,255,255,0.95); padding: 6px 14px; border-radius: 6px; }
.bottom-bar .bar-logo img { height: 32px; object-fit: contain; }
.bottom-bar .bar-cta { background: var(--orange); color: var(--white); font-size: 22px; font-weight: 700; padding: 10px 28px; border-radius: 24px; }
`;

const commonRings = `
<div class="bg-ring" style="width:500px;height:500px;top:-120px;right:-120px;border:3px solid rgba(255,107,0,0.14);"></div>
<div class="bg-ring" style="width:350px;height:350px;bottom:150px;left:-100px;border:2px solid rgba(255,107,0,0.1);"></div>`;

const topLogo = `<div class="top-logo"><img src="${logoDataUri}" /></div>`;
const bottomBar = `<div class="bottom-bar"><div class="bar-logo"><img src="${logoDataUri}" /></div><div class="bar-cta">자세히 보기 →</div></div>`;

// ════════════════════════════════════════════
// 카드 1 — Hook: warning tag + big headline
// ════════════════════════════════════════════
const card1Html = `${commonHead}
body { background: var(--navy); }
.content { position: relative; padding: 160px 72px 160px; display: flex; flex-direction: column; height: 100%; z-index: 5; }
.warning-tag { display: inline-block; background: var(--orange); color: var(--white); font-size: 28px; font-weight: 700; padding: 10px 28px; border-radius: 6px; margin-bottom: 40px; width: fit-content; letter-spacing: 1px; }
.headline { font-size: 96px; font-weight: 900; line-height: 1.2; margin-bottom: 24px; }
.headline .accent { color: var(--orange); }
.sub-copy { font-size: 34px; font-weight: 400; opacity: 0.55; margin-bottom: 48px; line-height: 1.5; }
.emphasis-box { border-left: 6px solid var(--orange); padding: 24px 32px; font-size: 34px; font-weight: 700; line-height: 1.7; background: rgba(255,107,0,0.07); border-radius: 0 10px 10px 0; max-width: 720px; }
.cta-circle { position: absolute; bottom: 56px; right: 64px; width: 100px; height: 100px; border-radius: 50%; background: var(--orange); display: flex; align-items: center; justify-content: center; z-index: 10; box-shadow: 0 6px 28px rgba(255,107,0,0.45); }
.cta-circle svg { width: 36px; height: 36px; fill: none; stroke: var(--white); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.bottom-logo-sm { position: absolute; bottom: 36px; left: 64px; z-index: 10; background: rgba(255,255,255,0.9); padding: 6px 12px; border-radius: 6px; }
.bottom-logo-sm img { height: 32px; object-fit: contain; }
</style>
</head>
<body>
${commonRings}
${topLogo}
<div class="content">
  <div class="warning-tag">무료 특강 알림</div>
  <h1 class="headline"><span class="accent">10명 중 3명이</span><br>놓치는 무료 클리닉</h1>
  <p class="sub-copy">32%가 놓치는 진학 클리닉</p>
  <div class="emphasis-box">지금 놓치면<br>다음 기회는 없습니다</div>
</div>
<div class="cta-circle"><svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
<div class="bottom-logo-sm"><img src="${logoDataUri}" /></div>
</body></html>`;

// ════════════════════════════════════════════
// 카드 2 — Problem/Quote: navy header + speech bubble
// ════════════════════════════════════════════
const card2Html = `${commonHead}
body { background: var(--navy); }
.header { padding: 130px 72px 48px; position: relative; z-index: 5; }
.header-badge { display: inline-block; background: var(--orange); color: var(--white); font-size: 24px; font-weight: 700; padding: 8px 24px; border-radius: 24px; margin-bottom: 20px; }
.header-title { font-size: 72px; font-weight: 900; line-height: 1.2; }
.quote-area { margin: 0 72px; padding: 48px 52px; background: var(--light-bg); border-radius: 24px; position: relative; z-index: 5; }
.quote-bubble { background: var(--navy); color: var(--white); font-size: 34px; font-weight: 700; line-height: 1.6; padding: 40px 44px; border-radius: 20px; position: relative; word-break: keep-all; }
.quote-bubble::after { content: ''; position: absolute; top: -20px; left: 60px; border-left: 16px solid transparent; border-right: 16px solid transparent; border-bottom: 20px solid var(--navy); }
.quote-label { font-size: 22px; color: #666; margin-top: 20px; text-align: right; }
</style>
</head>
<body>
${commonRings}
${topLogo}
<div class="header">
  <div class="header-badge">학부모 실제 고민</div>
  <h1 class="header-title">무료라는데<br>진짜 효과 있을까?</h1>
</div>
<div class="quote-area">
  <div class="quote-bubble">무료 특강이라는데<br>괜히 시간낭비만<br>하는 건 아닐까요?</div>
  <p class="quote-label">— 관악구 학부모 실제 질문</p>
</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 3 — Problem/Checklist: 4-item checklist
// ════════════════════════════════════════════
const card3Html = `${commonHead}
body { background: var(--navy); }
.header { padding: 120px 72px 28px; position: relative; z-index: 5; }
.header-badge { display: inline-block; background: rgba(255,107,0,0.15); color: var(--orange); font-size: 22px; font-weight: 700; padding: 8px 22px; border-radius: 20px; margin-bottom: 16px; }
.header-badge .dot { color: var(--orange); }
.header-title { font-size: 68px; font-weight: 900; line-height: 1.2; margin-bottom: 10px; }
.header-title .accent { color: var(--orange); }
.header-sub { font-size: 28px; color: var(--dim); }
.checklist-area { margin: 24px 56px 0; background: var(--light-bg); border-radius: 20px; padding: 32px 40px 28px; position: relative; z-index: 5; }
.cl-title { font-size: 20px; font-weight: 900; color: var(--orange); letter-spacing: 3px; margin-bottom: 20px; }
.cl-item { display: flex; align-items: flex-start; gap: 18px; padding: 16px 0; }
.cl-num { min-width: 44px; height: 44px; background: var(--orange); color: var(--white); font-size: 20px; font-weight: 900; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.cl-text { flex: 1; }
.cl-text-title { font-size: 30px; font-weight: 900; color: #1A1A2E; line-height: 1.3; }
.cl-text-desc { font-size: 22px; color: #666; margin-top: 4px; line-height: 1.4; }
.cl-arrow { display: flex; justify-content: center; padding: 4px 0; }
.cl-arrow-circle { width: 28px; height: 28px; background: #ddd; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.cl-arrow-circle svg { width: 14px; height: 14px; fill: none; stroke: #999; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
</style>
</head>
<body>
${commonRings}
${topLogo}
<div class="header">
  <div class="header-badge"><span class="dot">●</span> 왜 놓칠까?</div>
  <h1 class="header-title"><span class="accent">놓치기</span> 쉬운 이유 4가지</h1>
  <p class="header-sub">10명 중 3명이 포기하는 이유</p>
</div>
<div class="checklist-area">
  <div class="cl-title">CHECK LIST</div>
  <div class="cl-item"><div class="cl-num">01</div><div class="cl-text"><div class="cl-text-title">시간 부족</div><div class="cl-text-desc">바쁜데 굳이? 하는 생각</div></div></div>
  <div class="cl-arrow"><div class="cl-arrow-circle"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg></div></div>
  <div class="cl-item"><div class="cl-num">02</div><div class="cl-text"><div class="cl-text-title">의구심</div><div class="cl-text-desc">정말 효과가 있을까 하는 걱정</div></div></div>
  <div class="cl-arrow"><div class="cl-arrow-circle"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg></div></div>
  <div class="cl-item"><div class="cl-num">03</div><div class="cl-text"><div class="cl-text-title">정보 부족</div><div class="cl-text-desc">어떤 내용인지 모르는 상황</div></div></div>
  <div class="cl-arrow"><div class="cl-arrow-circle"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg></div></div>
  <div class="cl-item"><div class="cl-num">04</div><div class="cl-text"><div class="cl-text-title">타이밍</div><div class="cl-text-desc">지금이 아니어도 괜찮다는 착각</div></div></div>
</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 4 — Data/Stat: big stat + bar
// ════════════════════════════════════════════
const card4Html = `${commonHead}
body { background: var(--navy); }
.content { position: relative; z-index: 5; padding: 130px 72px 100px; display: flex; flex-direction: column; align-items: center; text-align: center; }
.badge { display: inline-block; background: var(--orange); color: var(--white); font-size: 24px; font-weight: 700; padding: 8px 24px; border-radius: 24px; margin-bottom: 24px; }
.headline { font-size: 76px; font-weight: 900; line-height: 1.2; margin-bottom: 48px; }
.headline .accent { color: var(--orange); }
.big-stat { font-size: 170px; font-weight: 900; color: var(--orange); line-height: 1; text-shadow: 0 6px 30px rgba(255,107,0,0.35); margin-bottom: 16px; }
.stat-label { font-size: 30px; font-weight: 400; opacity: 0.6; margin-bottom: 40px; }
.sub-bar { display: flex; align-items: center; justify-content: center; gap: 12px; background: rgba(255,107,0,0.12); border: 1px solid rgba(255,107,0,0.25); border-radius: 16px; padding: 18px 40px; }
.sub-bar-num { font-size: 42px; font-weight: 900; color: var(--orange); }
.sub-bar-label { font-size: 28px; font-weight: 700; opacity: 0.6; }
</style>
</head>
<body>
${commonRings}
${topLogo}
<div class="content">
  <div class="badge">클리닉 후기</div>
  <h1 class="headline">클리닉 받아본<br><span class="accent">친구들은 안다</span></h1>
  <div class="big-stat">100%</div>
  <p class="stat-label">만족할 수 밖에 없는 무료 클리닉</p>
  <div class="sub-bar">
    <span class="sub-bar-num">100%</span>
    <span class="sub-bar-label">만족할 수 밖에 없는</span>
  </div>
</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 5 — Insight/Steps: 클리닉 시스템
// ════════════════════════════════════════════
const card5Html = `${commonHead}
body { background: var(--navy); }
.top-bar { position: absolute; top: 40px; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; z-index: 10; }
.top-bar .bar-logo { background: rgba(255,255,255,0.95); padding: 8px 16px; border-radius: 8px; }
.top-bar .bar-logo img { height: 40px; object-fit: contain; }
.top-bar .bar-badge { background: rgba(255,107,0,0.15); color: var(--orange); font-size: 22px; font-weight: 700; padding: 8px 22px; border-radius: 20px; }
.header { padding: 120px 72px 20px; position: relative; z-index: 5; }
.header-label { display: flex; align-items: center; gap: 10px; font-size: 22px; color: var(--dim); margin-bottom: 12px; }
.header-label-line { width: 30px; height: 3px; background: var(--orange); border-radius: 2px; }
.headline { font-size: 72px; font-weight: 900; line-height: 1.2; margin-bottom: 8px; }
.hl-block { background: var(--orange); color: var(--white); padding: 4px 14px; border-radius: 6px; }
.steps-area { padding: 20px 56px 0; position: relative; z-index: 5; }
.step-item { display: flex; align-items: flex-start; gap: 18px; background: var(--card-bg); border-left: 5px solid var(--orange); border-radius: 0 16px 16px 0; padding: 22px 28px; }
.step-num { min-width: 40px; height: 40px; background: var(--orange); color: var(--white); font-size: 18px; font-weight: 900; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.step-icon { font-size: 32px; min-width: 40px; text-align: center; }
.step-text { flex: 1; }
.step-title { font-size: 32px; font-weight: 900; line-height: 1.3; }
.step-desc { font-size: 22px; color: var(--dim); margin-top: 4px; }
.step-arrow { display: flex; justify-content: center; padding: 6px 0; }
.step-arrow-circle { width: 28px; height: 28px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.step-arrow-circle svg { width: 14px; height: 14px; fill: none; stroke: rgba(255,255,255,0.4); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
</style>
</head>
<body>
${commonRings}
<div class="top-bar"><div class="bar-logo"><img src="${logoDataUri}" /></div><div class="bar-badge">클리닉 시스템</div></div>
<div class="header">
  <div class="header-label"><span class="header-label-line"></span> 일반 수업과 다른 점</div>
  <h1 class="headline"><span class="hl-block">클리닉</span>이 필요한 이유</h1>
</div>
<div class="steps-area">
  <div class="step-item"><div class="step-num">01</div><div class="step-icon">📋</div><div class="step-text"><div class="step-title">진단</div><div class="step-desc">우리 아이 약점을 정확히 파악</div></div></div>
  <div class="step-arrow"><div class="step-arrow-circle"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg></div></div>
  <div class="step-item"><div class="step-num">02</div><div class="step-icon">💊</div><div class="step-text"><div class="step-title">처방</div><div class="step-desc">약점에 맞는 맞춤 학습 설계</div></div></div>
  <div class="step-arrow"><div class="step-arrow-circle"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg></div></div>
  <div class="step-item"><div class="step-num">03</div><div class="step-icon">🔧</div><div class="step-text"><div class="step-title">치료</div><div class="step-desc">집중적으로 부족한 부분 보완</div></div></div>
  <div class="step-arrow"><div class="step-arrow-circle"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg></div></div>
  <div class="step-item"><div class="step-num">04</div><div class="step-icon">✅</div><div class="step-text"><div class="step-title">점검</div><div class="step-desc">학습 효과 확인 및 피드백</div></div></div>
</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 6 — Solution/List: 혜택 안내
// ════════════════════════════════════════════
const card6Html = `${commonHead}
body { background: var(--navy); }
.top-bar { position: absolute; top: 40px; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; z-index: 10; }
.top-bar .bar-logo { background: rgba(255,255,255,0.95); padding: 8px 16px; border-radius: 8px; }
.top-bar .bar-logo img { height: 40px; object-fit: contain; }
.top-bar .bar-badge { background: rgba(255,107,0,0.15); color: var(--orange); font-size: 22px; font-weight: 700; padding: 8px 22px; border-radius: 20px; }
.header { padding: 120px 72px 12px; position: relative; z-index: 5; }
.headline { font-size: 72px; font-weight: 900; line-height: 1.2; margin-bottom: 10px; }
.hl-block { background: var(--orange); color: var(--white); padding: 4px 14px; border-radius: 6px; }
.header-sub { font-size: 28px; color: var(--dim); }
.benefits-area { padding: 28px 56px 0; position: relative; z-index: 5; display: flex; flex-direction: column; gap: 14px; }
.benefit-item { display: flex; align-items: center; gap: 20px; background: var(--card-bg); border-left: 5px solid var(--orange); border-radius: 0 16px 16px 0; padding: 24px 28px; }
.benefit-icon { min-width: 48px; height: 48px; background: var(--orange); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.benefit-icon svg { width: 24px; height: 24px; fill: none; stroke: var(--white); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
.benefit-text { font-size: 30px; font-weight: 700; flex: 1; line-height: 1.4; }
</style>
</head>
<body>
${commonRings}
<div class="top-bar"><div class="bar-logo"><img src="${logoDataUri}" /></div><div class="bar-badge">혜택 안내</div></div>
<div class="header">
  <h1 class="headline"><span class="hl-block">월·화</span> 클리닉 혜택</h1>
  <p class="header-sub">국어·과학·사회 무료 특강</p>
</div>
<div class="benefits-area">
  <div class="benefit-item"><div class="benefit-icon"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></div><div class="benefit-text">국어·과학·사회 3과목 무료</div></div>
  <div class="benefit-item"><div class="benefit-icon"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></div><div class="benefit-text">개별 약점 진단 포함</div></div>
  <div class="benefit-item"><div class="benefit-icon"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></div><div class="benefit-text">정규 수업과 동일한 퀄리티</div></div>
  <div class="benefit-item"><div class="benefit-icon"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></div><div class="benefit-text">전과목 확대 예정</div></div>
  <div class="benefit-item"><div class="benefit-icon"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></div><div class="benefit-text">월·화 연속 수업으로 집중 효과</div></div>
</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 7 — Compare/VS: 비교표
// ════════════════════════════════════════════
const card7Html = `${commonHead}
body { background: var(--navy); }
.header { padding: 120px 72px 20px; position: relative; z-index: 5; }
.header-label { display: flex; align-items: center; gap: 10px; font-size: 22px; color: var(--dim); margin-bottom: 12px; }
.header-label-line { width: 30px; height: 3px; background: var(--orange); border-radius: 2px; }
.headline { font-size: 68px; font-weight: 900; line-height: 1.2; margin-bottom: 10px; }
.headline .accent { color: var(--orange); }
.header-sub { font-size: 26px; color: var(--dim); }
.compare-table { margin: 24px 48px 0; position: relative; z-index: 5; }
.col-headers { display: flex; align-items: center; margin-bottom: 14px; padding: 0 8px; }
.col-left { flex: 1; font-size: 24px; font-weight: 700; opacity: 0.4; text-align: center; }
.col-vs { width: 56px; height: 56px; background: var(--white); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; color: var(--navy); margin: 0 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
.col-right { flex: 1; font-size: 24px; font-weight: 700; color: var(--orange); text-align: center; }
.compare-row { display: flex; align-items: stretch; margin-bottom: 10px; }
.cell-left { flex: 1; background: rgba(255,255,255,0.05); border-radius: 12px; padding: 18px 20px; font-size: 24px; color: rgba(255,255,255,0.4); text-align: center; display: flex; align-items: center; justify-content: center; margin-right: 10px; line-height: 1.4; }
.cell-right { flex: 1; background: rgba(255,107,0,0.12); border-left: 4px solid var(--orange); border-radius: 0 12px 12px 0; padding: 18px 20px; font-size: 24px; font-weight: 700; text-align: center; display: flex; align-items: center; justify-content: center; margin-left: 10px; line-height: 1.4; }
.highlight-msg { margin: 20px 48px 0; text-align: center; font-size: 28px; font-weight: 700; color: var(--orange); background: rgba(255,107,0,0.1); border: 1px solid rgba(255,107,0,0.25); border-radius: 14px; padding: 18px 24px; position: relative; z-index: 5; }
</style>
</head>
<body>
${commonRings}
${topLogo}
<div class="header">
  <div class="header-label"><span class="header-label-line"></span> 구체적 차이점 비교표</div>
  <h1 class="headline">일반학원 vs <span class="accent">진학학원</span></h1>
  <p class="header-sub">똑같은 무료특강이라고 생각하세요?</p>
</div>
<div class="compare-table">
  <div class="col-headers"><span class="col-left">일반 학원</span><div class="col-vs">VS</div><span class="col-right">✦ 진학학원</span></div>
  <div class="compare-row"><div class="cell-left">전체 대상 문제풀이</div><div class="cell-right">개별 1:1 약점분석</div></div>
  <div class="compare-row"><div class="cell-left">90분 일괄진행</div><div class="cell-right">60분 집중케어</div></div>
  <div class="compare-row"><div class="cell-left">다음 수업에 간단히</div><div class="cell-right">당일 상세 분석표</div></div>
  <div class="compare-row"><div class="cell-left">등록 후 시작</div><div class="cell-right">무료 기간에도 학습계획</div></div>
</div>
<div class="highlight-msg">진학학원은 무료특강도 다릅니다</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 8 — Example/Stats: trophy + stat grid
// ════════════════════════════════════════════
const card8Html = `${commonHead}
body { background: var(--navy); }
.top-bar { position: absolute; top: 40px; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; z-index: 10; }
.top-bar .bar-logo { background: rgba(255,255,255,0.95); padding: 8px 16px; border-radius: 8px; }
.top-bar .bar-logo img { height: 40px; object-fit: contain; }
.top-bar .bar-badge { background: rgba(255,107,0,0.15); color: var(--orange); font-size: 22px; font-weight: 700; padding: 8px 22px; border-radius: 20px; }
.trophy-header { margin: 120px 56px 28px; background: var(--card-bg); border: 1px solid rgba(255,107,0,0.2); border-radius: 20px; padding: 28px 36px; text-align: center; position: relative; z-index: 5; }
.trophy-emoji { font-size: 44px; margin-bottom: 8px; }
.trophy-en { font-size: 20px; font-weight: 900; color: var(--orange); letter-spacing: 3px; margin-bottom: 4px; }
.trophy-ko { font-size: 28px; font-weight: 700; opacity: 0.7; }
.stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 0 56px; position: relative; z-index: 5; }
.stat-card { background: var(--card-bg); border-left: 5px solid var(--orange); border-radius: 0 20px 20px 0; padding: 32px 28px; text-align: center; }
.stat-icon { font-size: 36px; margin-bottom: 10px; }
.stat-num { font-size: 64px; font-weight: 900; color: var(--orange); line-height: 1.1; }
.stat-label { font-size: 24px; font-weight: 700; opacity: 0.6; margin-top: 4px; }
.cta-banner { margin: 24px 56px 0; background: rgba(255,107,0,0.1); border: 1px solid rgba(255,107,0,0.25); border-radius: 14px; padding: 18px 24px; text-align: center; font-size: 26px; font-weight: 700; color: var(--orange); position: relative; z-index: 5; }
</style>
</head>
<body>
${commonRings}
<div class="top-bar"><div class="bar-logo"><img src="${logoDataUri}" /></div><div class="bar-badge">실적 공개</div></div>
<div class="trophy-header">
  <div class="trophy-emoji">🏆</div>
  <div class="trophy-en">PROVEN RESULTS</div>
  <div class="trophy-ko">2025년 진학학원 실적</div>
</div>
<div class="stat-grid">
  <div class="stat-card"><div class="stat-icon">📊</div><div class="stat-num">128</div><div class="stat-label">1등급 배출</div></div>
  <div class="stat-card"><div class="stat-icon">🎓</div><div class="stat-num">5</div><div class="stat-label">서울대 합격</div></div>
  <div class="stat-card"><div class="stat-icon">💯</div><div class="stat-num">44</div><div class="stat-label">올백 달성</div></div>
  <div class="stat-card"><div class="stat-icon">👨‍🏫</div><div class="stat-num">17</div><div class="stat-label">전문 강사진</div></div>
</div>
<div class="cta-banner">이 강사진이 무료특강을 진행합니다</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 9 — Summary: numbered list with tags
// ════════════════════════════════════════════
const card9Html = `${commonHead}
body { background: var(--navy); }
.top-bar { position: absolute; top: 40px; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; z-index: 10; }
.top-bar .bar-logo { background: rgba(255,255,255,0.95); padding: 8px 16px; border-radius: 8px; }
.top-bar .bar-logo img { height: 40px; object-fit: contain; }
.top-bar .bar-badge { background: rgba(255,107,0,0.15); color: var(--orange); font-size: 22px; font-weight: 700; padding: 8px 22px; border-radius: 20px; }
.trophy-box { margin: 116px 56px 20px; background: var(--card-bg); border: 1px solid rgba(255,107,0,0.2); border-radius: 20px; padding: 24px 36px; text-align: center; position: relative; z-index: 5; }
.trophy-check { font-size: 36px; margin-bottom: 6px; }
.trophy-en { font-size: 18px; font-weight: 900; color: var(--orange); letter-spacing: 3px; margin-bottom: 4px; }
.trophy-ko { font-size: 26px; font-weight: 700; opacity: 0.7; }
.trophy-sub { font-size: 20px; color: var(--dim); margin-top: 4px; }
.summary-list { padding: 12px 56px 0; display: flex; flex-direction: column; gap: 10px; position: relative; z-index: 5; }
.summary-item { display: flex; align-items: center; gap: 16px; background: var(--card-bg); border-left: 5px solid var(--orange); border-radius: 0 14px 14px 0; padding: 18px 22px; }
.summary-num { min-width: 38px; height: 38px; background: var(--orange); color: var(--white); font-size: 18px; font-weight: 900; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.summary-text { flex: 1; font-size: 26px; font-weight: 700; line-height: 1.4; }
.summary-tag { font-size: 18px; font-weight: 900; color: var(--orange); background: rgba(255,107,0,0.12); padding: 4px 14px; border-radius: 6px; white-space: nowrap; }
.cta-banner { margin: 16px 56px 0; background: rgba(255,107,0,0.1); border: 1px solid rgba(255,107,0,0.25); border-radius: 14px; padding: 16px 24px; text-align: center; font-size: 24px; font-weight: 700; color: var(--orange); position: relative; z-index: 5; }
</style>
</head>
<body>
${commonRings}
<div class="top-bar"><div class="bar-logo"><img src="${logoDataUri}" /></div><div class="bar-badge">핵심 정리</div></div>
<div class="trophy-box">
  <div class="trophy-check">✅</div>
  <div class="trophy-en">FINAL CHECK</div>
  <div class="trophy-ko">놓치면 안 되는 포인트</div>
  <div class="trophy-sub">32% 안에 들지 마세요</div>
</div>
<div class="summary-list">
  <div class="summary-item"><div class="summary-num">01</div><div class="summary-text">월·화 무료 클리닉은 한정 기간</div><div class="summary-tag">긴급</div></div>
  <div class="summary-item"><div class="summary-num">02</div><div class="summary-text">개별 진단으로 정확한 약점 파악</div><div class="summary-tag">핵심</div></div>
  <div class="summary-item"><div class="summary-num">03</div><div class="summary-text">전과목 확대 전 미리 경험</div><div class="summary-tag">전략</div></div>
  <div class="summary-item"><div class="summary-num">04</div><div class="summary-text">검증된 강사진의 체계적 관리</div><div class="summary-tag">차별화</div></div>
  <div class="summary-item"><div class="summary-num">05</div><div class="summary-text">68% 만족도의 검증된 프로그램</div><div class="summary-tag">검증</div></div>
</div>
<div class="cta-banner">지금 신청하지 않으면 32%가 됩니다</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 10 — CTA: clean CTA
// ════════════════════════════════════════════
const card10Html = `${commonHead}
body { background: var(--navy); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.content { position: relative; z-index: 5; display: flex; flex-direction: column; align-items: center; padding: 0 72px; }
.badge { display: inline-block; background: rgba(255,107,0,0.15); color: var(--orange); font-size: 26px; font-weight: 700; padding: 10px 28px; border-radius: 24px; margin-bottom: 32px; }
.headline { font-size: 84px; font-weight: 900; line-height: 1.2; margin-bottom: 20px; }
.headline .accent { color: var(--orange); }
.sub-copy { font-size: 32px; font-weight: 400; opacity: 0.5; margin-bottom: 56px; line-height: 1.5; }
.cta-btn { background: var(--orange); color: var(--white); font-size: 38px; font-weight: 900; padding: 24px 72px; border-radius: 60px; box-shadow: 0 8px 36px rgba(255,107,0,0.45); margin-bottom: 32px; }
.info-text { font-size: 22px; opacity: 0.4; }
.bottom-logo-pill { position: absolute; bottom: 48px; left: 50%; transform: translateX(-50%); z-index: 10; background: rgba(255,255,255,0.9); padding: 8px 20px; border-radius: 8px; }
.bottom-logo-pill img { height: 32px; object-fit: contain; }
</style>
</head>
<body>
<div class="bg-ring" style="width:600px;height:600px;top:-150px;left:-150px;border:3px solid rgba(255,107,0,0.14);"></div>
<div class="bg-ring" style="width:450px;height:450px;bottom:-100px;right:-100px;border:2px solid rgba(255,107,0,0.1);"></div>
<div class="bg-ring" style="width:300px;height:300px;top:200px;right:50px;border:2px solid rgba(255,107,0,0.08);"></div>
${topLogo}
<div class="content">
  <div class="badge">지금 바로 신청</div>
  <h1 class="headline"><span class="accent">진학학원</span>에서<br>시작하세요</h1>
  <p class="sub-copy">32%가 놓친 기회, 당신은 잡으세요</p>
  <div class="cta-btn">무료 클리닉 신청하기 →</div>
  <p class="info-text">국어·과학·사회 | 월·화 연속 | 소수정예 8명</p>
</div>
<div class="bottom-logo-pill"><img src="${logoDataUri}" /></div>
</body></html>`;

// ── 카드 배열 구성 ──
const allCards = [
  { number: 1, type: 'hook', generated_html: card1Html },
  { number: 2, type: 'problem-quote', generated_html: card2Html },
  { number: 3, type: 'problem-checklist', generated_html: card3Html },
  { number: 4, type: 'data', generated_html: card4Html },
  { number: 5, type: 'insight-steps', generated_html: card5Html },
  { number: 6, type: 'solution-list', generated_html: card6Html },
  { number: 7, type: 'compare-vs', generated_html: card7Html },
  { number: 8, type: 'example-stats', generated_html: card8Html },
  { number: 9, type: 'summary', generated_html: card9Html },
  { number: 10, type: 'cta', generated_html: card10Html },
];

// ── copy.json 저장 ──
console.log('═══ copy.json 저장 ═══');
const copyData = {
  topic: '32프로는 그냥 놓치는 무료일일특강',
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
