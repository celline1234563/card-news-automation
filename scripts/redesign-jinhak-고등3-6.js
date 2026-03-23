import 'dotenv/config';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const OUTPUT_DIR = join(ROOT, 'output', '진학학원-입학사정관이-직접보는-내-성적표는-어떨까--2026-03-20');

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
// 카드 1 — Hook: 밝은 배경 + 좌측정렬 + 하이라이트 마커
// ════════════════════════════════════════════
const card1Html = `${commonHead}
body { background: var(--light-bg); color: #1A1A2E; }
.card-sign { position: absolute; bottom: 36px; left: 64px; z-index: 10; opacity: 0.35; }
.card-sign img { height: 44px; object-fit: contain; }
.swipe-hint { position: absolute; bottom: 40px; right: 64px; font-size: 22px; font-weight: 700; color: var(--navy); opacity: 0.5; z-index: 10; }
.content { position: relative; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; height: 100%; padding: 0 80px; z-index: 5; }
.sub-text { font-size: 28px; font-weight: 700; color: #888; margin-bottom: 20px; }
.headline { font-size: 72px; font-weight: 900; line-height: 1.25; color: #1A1A2E; }
.headline em { font-style: normal; font-weight: 900; background: linear-gradient(to top, #FFE0C0 35%, transparent 35%); padding: 2px 6px; display: inline; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
.deco-icon { position: absolute; top: 100px; right: 80px; opacity: 0.08; z-index: 0; }
.deco-icon svg { width: 320px; height: 320px; fill: none; stroke: var(--navy); stroke-width: 1.5; }
</style>
</head>
<body>
<div class="deco-icon"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg></div>
<div class="content">
  <p class="sub-text">입학사정관이 직접 보는</p>
  <h1 class="headline">예비고3 수학,<br>지금 시작하면<br><em>3등급→1등급</em></h1>
</div>
<div class="swipe-hint">밀어서 확인하기 →</div>
<div class="card-sign"><img src="${logoDataUri}" /></div>
</body></html>`;

// ════════════════════════════════════════════
// 카드 2 — Problem/Quote: 학부모 고민
// ════════════════════════════════════════════
const card2Html = `${commonHead}
body { background: var(--navy); }
.header { padding: 130px 72px 48px; position: relative; z-index: 5; }
.header-badge { display: inline-block; background: var(--orange); color: var(--white); font-size: 24px; font-weight: 700; padding: 8px 24px; border-radius: 24px; margin-bottom: 20px; }
.header-title { font-size: 72px; font-weight: 900; line-height: 1.2; }
.header-sub { font-size: 30px; color: var(--dim); margin-top: 16px; }
.header-sub .accent { color: var(--orange); }
.quote-area { margin: 40px 72px 0; padding: 48px 52px; background: var(--light-bg); border-radius: 24px; position: relative; z-index: 5; }
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
  <h1 class="header-title">학부모들이<br>가장 많이 하는 말</h1>
  <p class="header-sub">고3 되면 그때 <span class="accent">준비해도</span></p>
</div>
<div class="quote-area">
  <div class="quote-bubble">"아직 고2인데...<br>고3 되면 준비해도<br>되지 않을까?"</div>
  <p class="quote-label">— 예비 고3 학부모</p>
</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 3 — Problem/Grid: 왜 지금 확인해야 할까
// ════════════════════════════════════════════
const card3Html = `${commonHead}
body { background: var(--navy); }
.header { padding: 120px 72px 28px; position: relative; z-index: 5; }
.header-badge { display: inline-block; background: rgba(255,107,0,0.15); color: var(--orange); font-size: 22px; font-weight: 700; padding: 8px 22px; border-radius: 20px; margin-bottom: 16px; }
.header-title { font-size: 76px; font-weight: 900; line-height: 1.2; margin-bottom: 10px; }
.header-title .accent { color: var(--orange); }
.header-sub { font-size: 28px; color: var(--dim); }
.icon-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 36px 56px 0; position: relative; z-index: 5; }
.icon-card { background: var(--card-bg); border-radius: 20px; padding: 40px 28px; text-align: center; border: 1px solid rgba(255,107,0,0.12); }
.icon-card .ic-icon { width: 72px; height: 72px; background: rgba(255,107,0,0.12); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
.icon-card .ic-icon svg { width: 36px; height: 36px; fill: none; stroke: var(--orange); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
.icon-card .ic-title { font-size: 30px; font-weight: 900; margin-bottom: 8px; }
.icon-card .ic-desc { font-size: 22px; color: var(--dim); line-height: 1.4; }
</style>
</head>
<body>
${commonRings}
${topLogo}
<div class="header">
  <div class="header-badge">● 핵심 포인트</div>
  <h1 class="header-title">왜 <span class="accent">지금</span><br>확인해야 할까</h1>
  <p class="header-sub">수시 판은 고3 시작과 동시에</p>
</div>
<div class="icon-grid">
  <div class="icon-card">
    <div class="ic-icon"><svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg></div>
    <div class="ic-title">고1~고2 내신</div>
    <div class="ic-desc">누적 성적이 곧 당락</div>
  </div>
  <div class="icon-card">
    <div class="ic-icon"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg></div>
    <div class="ic-title">생활기록부</div>
    <div class="ic-desc">활동 누적이 합격 열쇠</div>
  </div>
  <div class="icon-card">
    <div class="ic-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
    <div class="ic-title">고3 1학기</div>
    <div class="ic-desc">마지막 반영 기회</div>
  </div>
  <div class="icon-card">
    <div class="ic-icon"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
    <div class="ic-title">막연한 기대</div>
    <div class="ic-desc">근거 없는 낙관이 위험</div>
  </div>
</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 4 — Data/Stat: 교육부 발표 통계
// ════════════════════════════════════════════
const card4Html = `${commonHead}
body { background: var(--navy); }
.content { position: relative; z-index: 5; padding: 130px 72px 100px; display: flex; flex-direction: column; align-items: center; text-align: center; }
.badge { display: inline-block; background: var(--orange); color: var(--white); font-size: 24px; font-weight: 700; padding: 8px 24px; border-radius: 24px; margin-bottom: 24px; }
.headline { font-size: 76px; font-weight: 900; line-height: 1.2; margin-bottom: 16px; }
.headline .accent { color: var(--orange); }
.sub-label { font-size: 28px; font-weight: 400; opacity: 0.55; margin-bottom: 48px; }
.big-stat { font-size: 180px; font-weight: 900; color: var(--orange); line-height: 1; text-shadow: 0 6px 30px rgba(255,107,0,0.35); margin-bottom: 16px; }
.stat-label { font-size: 30px; font-weight: 400; opacity: 0.6; margin-bottom: 40px; }
.sub-bar { display: flex; align-items: center; justify-content: center; gap: 12px; background: rgba(255,107,0,0.12); border: 1px solid rgba(255,107,0,0.25); border-radius: 16px; padding: 18px 40px; }
.sub-bar-text { font-size: 28px; font-weight: 700; opacity: 0.7; }
</style>
</head>
<body>
${commonRings}
${topLogo}
<div class="content">
  <div class="badge">교육부 발표</div>
  <h1 class="headline"><span class="accent">학생부종합</span><br>합격생 분석결과</h1>
  <p class="sub-label">학생부종합전형 합격생 분석결과</p>
  <div class="big-stat">70%</div>
  <p class="stat-label">고1~고2 누적 기록 반영 비중</p>
  <div class="sub-bar">
    <span class="sub-bar-text">나머지 30%만 고3 성적으로 결정</span>
  </div>
</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 5 — Insight/Steps: 입학사정관이 보는 방식
// ════════════════════════════════════════════
const card5Html = `${commonHead}
body { background: var(--navy); }
.header { padding: 120px 72px 20px; position: relative; z-index: 5; }
.header-label { display: flex; align-items: center; gap: 10px; font-size: 22px; color: var(--dim); margin-bottom: 12px; }
.header-label-line { width: 30px; height: 3px; background: var(--orange); border-radius: 2px; }
.headline { font-size: 72px; font-weight: 900; line-height: 1.2; margin-bottom: 8px; }
.hl-block { background: var(--orange); color: var(--white); padding: 4px 14px; border-radius: 6px; }
.header-sub { font-size: 26px; color: var(--dim); margin-top: 8px; }
.steps-area { padding: 24px 56px 0; position: relative; z-index: 5; }
.step-item { display: flex; align-items: flex-start; gap: 18px; background: var(--card-bg); border-left: 5px solid var(--orange); border-radius: 0 16px 16px 0; padding: 22px 28px; }
.step-num { min-width: 44px; height: 44px; background: var(--orange); color: var(--white); font-size: 20px; font-weight: 900; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.step-icon { min-width: 40px; display: flex; align-items: center; justify-content: center; }
.step-icon svg { width: 32px; height: 32px; fill: none; stroke: var(--orange); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
.step-text { flex: 1; }
.step-title { font-size: 34px; font-weight: 900; line-height: 1.3; }
.step-desc { font-size: 22px; color: var(--dim); margin-top: 4px; }
.step-arrow { display: flex; justify-content: center; padding: 6px 0; }
.step-arrow-circle { width: 28px; height: 28px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.step-arrow-circle svg { width: 14px; height: 14px; fill: none; stroke: rgba(255,255,255,0.4); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
</style>
</head>
<body>
${commonRings}
${topLogo}
<div class="header">
  <div class="header-label"><span class="header-label-line"></span> 입학사정관 관점</div>
  <h1 class="headline"><span class="hl-block">사정관</span>이 보는 방식</h1>
  <p class="header-sub">숫자가 아닌 맥락을 읽는</p>
</div>
<div class="steps-area">
  <div class="step-item"><div class="step-num">01</div><div class="step-icon"><svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg></div><div class="step-text"><div class="step-title">활동 연결성</div><div class="step-desc">활동들이 하나의 스토리로 연결되는가</div></div></div>
  <div class="step-arrow"><div class="step-arrow-circle"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg></div></div>
  <div class="step-item"><div class="step-num">02</div><div class="step-icon"><svg viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 8 3 12 0v-5"/></svg></div><div class="step-text"><div class="step-title">전공 적합성</div><div class="step-desc">지원 학과와 활동의 일치도</div></div></div>
  <div class="step-arrow"><div class="step-arrow-circle"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg></div></div>
  <div class="step-item"><div class="step-num">03</div><div class="step-icon"><svg viewBox="0 0 24 24"><path d="M23 6l-13.5 13.5L3 13"/></svg></div><div class="step-text"><div class="step-title">성장 궤적</div><div class="step-desc">성적과 활동의 꾸준한 상승 곡선</div></div></div>
  <div class="step-arrow"><div class="step-arrow-circle"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg></div></div>
  <div class="step-item"><div class="step-num">04</div><div class="step-icon"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><div class="step-text"><div class="step-title">진정성</div><div class="step-desc">스펙 나열이 아닌 진짜 경험</div></div></div>
</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 6 — Solution/Checklist: 지금 해야 할 일들
// ════════════════════════════════════════════
const card6Html = `${commonHead}
body { background: var(--navy); }
.header { padding: 120px 72px 28px; position: relative; z-index: 5; }
.header-badge { display: inline-block; background: rgba(255,107,0,0.15); color: var(--orange); font-size: 22px; font-weight: 700; padding: 8px 22px; border-radius: 20px; margin-bottom: 16px; }
.header-title { font-size: 68px; font-weight: 900; line-height: 1.2; margin-bottom: 10px; }
.header-title .accent { color: var(--orange); }
.header-sub { font-size: 28px; color: var(--dim); }
.checklist-area { margin: 24px 56px 0; background: var(--light-bg); border-radius: 20px; padding: 32px 40px 28px; position: relative; z-index: 5; }
.cl-title { font-size: 20px; font-weight: 900; color: var(--orange); letter-spacing: 3px; margin-bottom: 20px; }
.cl-item { display: flex; align-items: flex-start; gap: 18px; padding: 14px 0; }
.cl-check { min-width: 40px; height: 40px; background: var(--orange); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.cl-check svg { width: 22px; height: 22px; fill: none; stroke: var(--white); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.cl-text { flex: 1; }
.cl-text-title { font-size: 28px; font-weight: 900; color: #1A1A2E; line-height: 1.3; }
.cl-text-desc { font-size: 20px; color: #666; margin-top: 4px; line-height: 1.4; }
.cl-divider { height: 1px; background: #e0e0e0; margin: 2px 0; }
</style>
</head>
<body>
${commonRings}
${topLogo}
<div class="header">
  <div class="header-badge">● 실천 가이드</div>
  <h1 class="header-title">입시 전문가와 함께<br><span class="accent">지금 해야 할 일들</span></h1>
  <p class="header-sub">입시 전문가와 함께</p>
</div>
<div class="checklist-area">
  <div class="cl-title">CHECK LIST</div>
  <div class="cl-item"><div class="cl-check"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></div><div class="cl-text"><div class="cl-text-title">현재 내신·생기부 정밀 분석</div><div class="cl-text-desc">지금 위치를 정확히 파악해야 합니다</div></div></div>
  <div class="cl-divider"></div>
  <div class="cl-item"><div class="cl-check"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></div><div class="cl-text"><div class="cl-text-title">지원 가능 대학 현실적 파악</div><div class="cl-text-desc">감이 아닌 데이터로 목표 설정</div></div></div>
  <div class="cl-divider"></div>
  <div class="cl-item"><div class="cl-check"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></div><div class="cl-text"><div class="cl-text-title">수시 6장 최적 배분 전략</div><div class="cl-text-desc">6장의 카드를 어디에 쓸 것인가</div></div></div>
  <div class="cl-divider"></div>
  <div class="cl-item"><div class="cl-check"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></div><div class="cl-text"><div class="cl-text-title">학생부종합 vs 교과 비교</div><div class="cl-text-desc">나에게 유리한 전형이 뭔지 확인</div></div></div>
  <div class="cl-divider"></div>
  <div class="cl-item"><div class="cl-check"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></div><div class="cl-text"><div class="cl-text-title">목표별 내신 컷 분석</div><div class="cl-text-desc">목표 대학에 필요한 등급 확인</div></div></div>
</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 7 — Compare/VS: AI vs 전문가 상담
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
  <div class="header-label"><span class="header-label-line"></span> 상담 방식 비교</div>
  <h1 class="headline"><span class="accent">AI</span> vs 전문가 상담</h1>
  <p class="header-sub">진짜 차이를 확인해보세요</p>
</div>
<div class="compare-table">
  <div class="col-headers"><span class="col-left">AI 분석</span><div class="col-vs">VS</div><span class="col-right">✦ 전문가 상담</span></div>
  <div class="compare-row"><div class="cell-left">통계 기반 일반 방향</div><div class="cell-right">학생별 심층 분석</div></div>
  <div class="compare-row"><div class="cell-left">표준화된 결과</div><div class="cell-right">맞춤 전략 수립</div></div>
  <div class="compare-row"><div class="cell-left">과거 데이터만 활용</div><div class="cell-right">최신 입시 트렌드 반영</div></div>
  <div class="compare-row"><div class="cell-left">기계적 추천</div><div class="cell-right">경험 기반 현실 조언</div></div>
  <div class="compare-row"><div class="cell-left">일회성 결과</div><div class="cell-right">지속적 관리·피드백</div></div>
</div>
<div class="highlight-msg">입학사정관 출신 전문가의 차이</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 8 — Example/Feature: 진학학원 입시연구소 특징
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
.feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 0 56px; position: relative; z-index: 5; }
.feature-card { background: var(--card-bg); border-left: 5px solid var(--orange); border-radius: 0 20px 20px 0; padding: 32px 28px; text-align: center; }
.feature-icon { width: 64px; height: 64px; background: rgba(255,107,0,0.12); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; }
.feature-icon svg { width: 32px; height: 32px; fill: none; stroke: var(--orange); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
.feature-title { font-size: 30px; font-weight: 900; margin-bottom: 6px; }
.feature-desc { font-size: 20px; color: var(--dim); line-height: 1.4; }
.cta-banner { margin: 24px 56px 0; background: rgba(255,107,0,0.1); border: 1px solid rgba(255,107,0,0.25); border-radius: 14px; padding: 18px 24px; text-align: center; font-size: 26px; font-weight: 700; color: var(--orange); position: relative; z-index: 5; }
</style>
</head>
<body>
${commonRings}
<div class="top-bar"><div class="bar-logo"><img src="${logoDataUri}" /></div><div class="bar-badge">입시연구소</div></div>
<div class="trophy-header">
  <div class="trophy-emoji">🏛️</div>
  <div class="trophy-en">ADMISSIONS LAB</div>
  <div class="trophy-ko">진학학원 입시연구소 특징</div>
</div>
<div class="feature-grid">
  <div class="feature-card">
    <div class="feature-icon"><svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg></div>
    <div class="feature-title">현장 경험</div>
    <div class="feature-desc">실제 입학사정관 출신</div>
  </div>
  <div class="feature-card">
    <div class="feature-icon"><svg viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg></div>
    <div class="feature-title">정밀 분석</div>
    <div class="feature-desc">데이터 기반 합격 예측</div>
  </div>
  <div class="feature-card">
    <div class="feature-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg></div>
    <div class="feature-title">맞춤 전략</div>
    <div class="feature-desc">학생별 1:1 진학 설계</div>
  </div>
  <div class="feature-card">
    <div class="feature-icon"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div>
    <div class="feature-title">현실적 조언</div>
    <div class="feature-desc">솔직한 합격 가능성 평가</div>
  </div>
</div>
<div class="cta-banner">입학사정관이 직접 분석해드립니다</div>
${bottomBar}
</body></html>`;

// ════════════════════════════════════════════
// 카드 9 — Summary: numbered list + tags
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
  <div class="trophy-ko">놓치면 후회하는 것들</div>
  <div class="trophy-sub">지금 확인하는 학생 vs 나중에 후회하는 학생</div>
</div>
<div class="summary-list">
  <div class="summary-item"><div class="summary-num">01</div><div class="summary-text">내 위치 정확한 파악 기회</div><div class="summary-tag">분석</div></div>
  <div class="summary-item"><div class="summary-num">02</div><div class="summary-text">현실적 목표 설정 가능성</div><div class="summary-tag">목표</div></div>
  <div class="summary-item"><div class="summary-num">03</div><div class="summary-text">전략적 수시 지원 계획</div><div class="summary-tag">전략</div></div>
  <div class="summary-item"><div class="summary-num">04</div><div class="summary-text">전문가 1:1 맞춤 조언</div><div class="summary-tag">맞춤</div></div>
  <div class="summary-item"><div class="summary-num">05</div><div class="summary-text">입학사정관 시각으로 분석</div><div class="summary-tag">핵심</div></div>
</div>
<div class="cta-banner">지금 확인하면 전략이 달라집니다</div>
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
.sub-copy { font-size: 30px; font-weight: 400; opacity: 0.5; margin-bottom: 56px; line-height: 1.5; }
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
  <div class="badge">지금 바로 시작</div>
  <h1 class="headline"><span class="accent">진학학원</span>에서<br>시작하세요</h1>
  <p class="sub-copy">입학사정관 출신 전문가와<br>함께하는 최고의 입시 솔루션</p>
  <div class="cta-btn">무료 상담 신청하기 →</div>
  <p class="info-text">입시 분석 | 수시 전략 | 1:1 맞춤 상담</p>
</div>
<div class="bottom-logo-pill"><img src="${logoDataUri}" /></div>
</body></html>`;

// ── 카드 배열 구성 ──
const allCards = [
  { number: 1, type: 'hook', generated_html: card1Html },
  { number: 2, type: 'problem-quote', generated_html: card2Html },
  { number: 3, type: 'problem-icon-grid', generated_html: card3Html },
  { number: 4, type: 'data-stat', generated_html: card4Html },
  { number: 5, type: 'insight-steps', generated_html: card5Html },
  { number: 6, type: 'solution-checklist', generated_html: card6Html },
  { number: 7, type: 'compare-vs', generated_html: card7Html },
  { number: 8, type: 'example-features', generated_html: card8Html },
  { number: 9, type: 'summary', generated_html: card9Html },
  { number: 10, type: 'cta', generated_html: card10Html },
];

// ── copy.json 저장 ──
console.log('═══ copy.json 저장 ═══');
const copyData = {
  topic: '입학사정관이 직접보는 내 성적표는 어떨까',
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
