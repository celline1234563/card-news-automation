/**
 * 올인원 3세트 레퍼런스 스타일 재디자인
 * - 경북대 의예과 합격후기: 메달/배지 그래픽
 * - 과제 이행률 100%: 시스템/프로그램
 * - 수내 내신1등급: 전략/교육
 *
 * 사용법: node scripts/redesign-ollinone.js
 * 이후: node scripts/re-render.js "폴더명" --academy ollinone
 */
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// ─── 공통 CSS ───
const BASE_FONT = `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap');`;

const CSS_VARS = `
:root {
  --primary: #202487;
  --secondary: #fff3c8;
  --accent: #4a9eff;
  --gold: #FFE030;
  --dark-bg: #0a0a14;
  --dark-navy: #0d1440;
  --light-bg: #F5F7FA;
  --white: #FFFFFF;
  --text-dark: #1A1A2E;
  --text-light: rgba(255,255,255,0.9);
  --text-muted: rgba(255,255,255,0.6);
}`;

const RESET = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1080px; height: 1350px; overflow: visible;
  font-family: 'Noto Sans KR', sans-serif;
  word-break: keep-all; line-height: 1.5;
}`;

// ─── 로고 플레이스홀더 (re-render 시 실제 로고로 교체됨) ───
function logoArea(variant = 'light') {
  const opacity = variant === 'dark' ? '0.9' : '1';
  // brand-bar 클래스로 injectLogo가 자동 교체
  return `<div class="brand-bar" style="position:absolute; top:36px; left:50%; transform:translateX(-50%); z-index:10; opacity:${opacity};">올인원 수학학원</div>`;
}

// ─── 장식 요소 ───
function confettiElements() {
  const pieces = [];
  const colors = ['#4a9eff', '#FFE030', '#ff6b6b', '#51cf66', '#fff'];
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * 1080;
    const y = Math.random() * 400;
    const size = 6 + Math.random() * 12;
    const rotation = Math.random() * 360;
    const color = colors[i % colors.length];
    const opacity = 0.3 + Math.random() * 0.4;
    pieces.push(`<div style="position:absolute;top:${y}px;left:${x}px;width:${size}px;height:${size * 0.6}px;background:${color};opacity:${opacity};transform:rotate(${rotation}deg);border-radius:1px;"></div>`);
  }
  return pieces.join('\n');
}

function decoCircles(variant = 'dark') {
  const color = variant === 'dark' ? 'rgba(255,255,255,' : 'rgba(32,36,135,';
  return `
    <div style="position:absolute;top:-80px;right:-60px;width:340px;height:340px;border-radius:50%;background:${color}0.04);"></div>
    <div style="position:absolute;bottom:100px;left:-50px;width:240px;height:240px;border-radius:50%;background:${color}0.06);"></div>
    <div style="position:absolute;top:300px;right:100px;width:160px;height:160px;border-radius:50%;background:${color}0.03);"></div>`;
}

// ─── HTML 래퍼 ───
function htmlWrap(cssExtra, bodyContent) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<style>
${BASE_FONT}
${CSS_VARS}
${RESET}
${cssExtra}
</style>
</head>
<body>
${bodyContent}
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════
// 카드 타입별 템플릿
// ═══════════════════════════════════════════════════════

// ─── HOOK (1번 카드) ─── 다크 배경, 대형 타이포, 임팩트
function hookDark(card, options = {}) {
  const hasMedal = options.medal;
  const medalHtml = hasMedal ? `
    <div class="medal">
      <div class="medal-circle">
        <div class="medal-star">★</div>
        <div class="medal-label">${options.medalLabel || '합격'}</div>
      </div>
      <div class="ribbon-left"></div>
      <div class="ribbon-right"></div>
    </div>` : '';

  const medalCss = hasMedal ? `
    .medal { position:relative; margin-bottom:48px; }
    .medal-circle {
      width:180px; height:180px; border-radius:50%;
      background: linear-gradient(135deg, #5ba8ff 0%, #1a6dff 50%, #003cc8 100%);
      border: 6px solid rgba(255,255,255,0.25);
      box-shadow: 0 0 60px rgba(74,158,255,0.35), inset 0 -6px 20px rgba(0,0,0,0.3);
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      color:var(--white); z-index:1; position:relative;
    }
    .medal-star { font-size:28px; margin-bottom:4px; color:var(--gold); }
    .medal-label { font-size:24px; font-weight:900; letter-spacing:3px; }
    .ribbon-left, .ribbon-right {
      position:absolute; bottom:-24px; width:36px; height:50px;
      background: linear-gradient(180deg, #3388ff, #1a5fff);
      z-index:0;
    }
    .ribbon-left { left:50%; margin-left:-45px; transform:skewX(15deg); border-radius:0 0 4px 4px; }
    .ribbon-right { left:50%; margin-left:9px; transform:skewX(-15deg); border-radius:0 0 4px 4px; }
  ` : '';

  const css = `
    body { background: var(--dark-bg); color: var(--white); }
    .card {
      width:1080px; height:1350px; position:relative;
      display:flex; flex-direction:column; justify-content:center; align-items:center;
      padding:60px 72px; text-align:center;
    }
    .headline {
      font-size:${card.headline.length > 20 ? '62px' : '72px'}; font-weight:900;
      line-height:1.35; max-width:960px; margin-bottom:28px; z-index:1;
    }
    .headline em { color:var(--accent); font-style:normal; font-weight:900; }
    .subtext {
      font-size:26px; font-weight:400; opacity:0.7; z-index:1; max-width:800px;
    }
    ${medalCss}
  `;

  const body = `
  <div class="card">
    ${decoCircles('dark')}
    ${options.confetti ? confettiElements() : ''}
    ${logoArea('dark')}
    ${medalHtml}
    <h1 class="headline">${card.headline}</h1>
    <p class="subtext">${card.subtext || ''}</p>
  </div>`;

  return htmlWrap(css, body);
}

// ─── PROBLEM (말풍선형) ───
function problemSpeech(card) {
  const css = `
    body { background: var(--light-bg); color: var(--text-dark); }
    .card {
      width:1080px; height:1350px; position:relative;
      display:flex; flex-direction:column; justify-content:center;
      padding:80px 72px;
    }
    .card-num {
      position:absolute; top:28px; right:50px;
      font-size:15px; font-weight:700; color:var(--primary); opacity:0.4;
    }
    .section-label {
      font-size:16px; font-weight:700; color:var(--accent); letter-spacing:3px;
      text-transform:uppercase; margin-bottom:20px;
    }
    .headline {
      font-size:42px; font-weight:900; color:var(--text-dark); margin-bottom:48px;
      line-height:1.35;
    }
    .bubble {
      background:var(--primary); color:var(--white);
      border-radius:28px 28px 28px 4px;
      padding:44px 52px; font-size:32px; font-weight:500;
      line-height:1.65; max-width:900px; margin-bottom:40px;
      position:relative;
      box-shadow: 0 8px 32px rgba(32,36,135,0.15);
    }
    .bubble::after {
      content:''; position:absolute; bottom:-16px; left:40px;
      border:10px solid transparent;
      border-top-color:var(--primary); border-right-color:var(--primary);
    }
    .subtext {
      font-size:22px; color:var(--text-dark); opacity:0.5; margin-top:24px;
    }
  `;

  const body = `
  <div class="card">
    ${logoArea('light')}
    <span class="card-num">${card.number} / 10</span>
    <div class="section-label">PROBLEM</div>
    <h2 class="headline">${card.headline}</h2>
    <div class="bubble">${card.quote_main || card.subtext || ''}</div>
    <p class="subtext">${card.subtext || ''}</p>
  </div>`;

  return htmlWrap(css, body);
}

// ─── PROBLEM (리스트형) ───
function problemList(card) {
  const items = card.items || [];
  const css = `
    body { background: var(--white); color: var(--text-dark); }
    .card {
      width:1080px; height:1350px; position:relative;
      display:flex; flex-direction:column;
      padding:100px 80px 60px;
    }
    .card-num {
      position:absolute; top:28px; right:50px;
      font-size:15px; font-weight:700; color:var(--primary); opacity:0.4;
    }
    .top-accent {
      position:absolute; top:0; left:0; right:0; height:6px;
      background: linear-gradient(90deg, var(--primary), var(--accent));
    }
    .section-label {
      font-size:16px; font-weight:700; color:var(--accent); letter-spacing:3px;
      margin-bottom:16px;
    }
    .headline {
      font-size:44px; font-weight:900; color:var(--text-dark); margin-bottom:16px;
      line-height:1.3;
    }
    .sub-headline {
      font-size:22px; color:var(--text-dark); opacity:0.5; margin-bottom:48px;
    }
    .list { display:flex; flex-direction:column; gap:0; flex:1; justify-content:center; }
    .list-item {
      display:flex; align-items:center; gap:24px;
      padding:28px 0; border-bottom:1px solid rgba(0,0,0,0.06);
    }
    .list-item:last-child { border-bottom:none; }
    .item-icon {
      width:52px; height:52px; min-width:52px; border-radius:14px;
      background:var(--primary); color:var(--white);
      display:flex; align-items:center; justify-content:center;
      font-size:22px; font-weight:900;
    }
    .item-text { font-size:28px; font-weight:500; line-height:1.5; }
  `;

  const itemsHtml = items.filter(i => i).map((item, idx) => `
    <div class="list-item">
      <div class="item-icon">${idx + 1}</div>
      <span class="item-text">${item}</span>
    </div>`).join('');

  const body = `
  <div class="card">
    <div class="top-accent"></div>
    ${logoArea('light')}
    <span class="card-num">${card.number} / 10</span>
    <div class="section-label">POINT</div>
    <h1 class="headline">${card.headline}</h1>
    <p class="sub-headline">${card.subtext || ''}</p>
    <div class="list">${itemsHtml}</div>
  </div>`;

  return htmlWrap(css, body);
}

// ─── DATA (통계 강조) ─── 다크 배경, 큰 숫자
function dataStat(card, options = {}) {
  const hasMedal = options.medal;
  const medalHtml = hasMedal ? `
    <div class="medal-badge">
      <div class="badge-circle">
        <div class="badge-inner">
          <div class="badge-label">${options.medalTopLabel || ''}</div>
          <div class="badge-main">${options.medalMainLabel || ''}</div>
          <div class="badge-sub">${options.medalSubLabel || ''}</div>
        </div>
      </div>
      <div class="badge-ribbon-l"></div>
      <div class="badge-ribbon-r"></div>
    </div>` : '';

  const medalCss = hasMedal ? `
    .medal-badge { position:relative; margin-bottom:48px; }
    .badge-circle {
      width:220px; height:220px; border-radius:50%;
      background: linear-gradient(135deg, #5ba8ff, #1a6dff, #003cc8);
      padding:7px;
      box-shadow: 0 0 50px rgba(74,158,255,0.35);
      position:relative; z-index:1;
    }
    .badge-inner {
      width:100%; height:100%; border-radius:50%;
      background: linear-gradient(135deg, #1a5fff, #0044bb);
      border: 3px solid rgba(255,255,255,0.15);
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      color:var(--white); text-align:center;
    }
    .badge-label { font-size:14px; font-weight:500; opacity:0.8; letter-spacing:1px; margin-bottom:4px; }
    .badge-main { font-size:22px; font-weight:900; letter-spacing:2px; line-height:1.3; }
    .badge-sub { font-size:13px; font-weight:500; opacity:0.7; margin-top:4px; }
    .badge-ribbon-l, .badge-ribbon-r {
      position:absolute; bottom:-22px; width:34px; height:48px;
      background: linear-gradient(180deg, #3388ff, #1a5fff);
      z-index:0;
    }
    .badge-ribbon-l { left:50%; margin-left:-42px; transform:skewX(15deg); border-radius:0 0 3px 3px; }
    .badge-ribbon-r { left:50%; margin-left:8px; transform:skewX(-15deg); border-radius:0 0 3px 3px; }
  ` : '';

  const css = `
    body { background: var(--dark-bg); color: var(--white); position:relative; }
    .card {
      width:1080px; height:1350px;
      display:flex; flex-direction:column; justify-content:center; align-items:center;
      padding:60px; position:relative; text-align:center;
    }
    .headline {
      font-size:40px; font-weight:700; opacity:0.85; margin-bottom:48px; z-index:1;
      max-width:900px; line-height:1.4;
    }
    .stat {
      font-size:${(card.stat || '').length > 6 ? '100px' : '180px'}; font-weight:900;
      background: linear-gradient(135deg, var(--accent), #80c4ff);
      -webkit-background-clip:text; -webkit-text-fill-color:transparent;
      background-clip:text; line-height:1; margin-bottom:20px; z-index:1;
      filter: drop-shadow(0 4px 24px rgba(74,158,255,0.3));
    }
    .stat-label {
      font-size:32px; font-weight:700; opacity:0.85; margin-bottom:48px; z-index:1;
      letter-spacing:1px;
    }
    .subtext { font-size:24px; opacity:0.5; z-index:1; }
    .card-num {
      position:absolute; top:28px; right:50px;
      font-size:15px; font-weight:700; opacity:0.3;
    }
    ${medalCss}
  `;

  const body = `
  <div class="card">
    ${decoCircles('dark')}
    ${logoArea('dark')}
    <span class="card-num">${card.number} / 10</span>
    <h2 class="headline">${card.headline}</h2>
    ${medalHtml}
    <div class="stat">${card.stat || ''}</div>
    <p class="stat-label">${card.stat_label || ''}</p>
    <p class="subtext">${card.subtext || ''}</p>
  </div>`;

  return htmlWrap(css, body);
}

// ─── INSIGHT (스텝 타임라인) ───
function insightSteps(card) {
  const steps = card.steps || [];
  const css = `
    body { background: var(--white); color: var(--text-dark); }
    .card {
      width:1080px; height:1350px; position:relative;
      display:flex; flex-direction:column;
      padding:100px 80px 60px;
    }
    .card-num {
      position:absolute; top:28px; right:50px;
      font-size:15px; font-weight:700; color:var(--primary); opacity:0.4;
    }
    .section-label {
      font-size:16px; font-weight:700; color:var(--accent); letter-spacing:3px;
      margin-bottom:16px;
    }
    .headline {
      font-size:44px; font-weight:900; color:var(--primary); margin-bottom:60px;
      line-height:1.3;
    }
    .steps { display:flex; flex-direction:column; flex:1; justify-content:center; gap:0; }
    .step {
      display:flex; align-items:flex-start; position:relative;
      padding-bottom:36px;
    }
    .step:last-child { padding-bottom:0; }
    .step-line {
      position:absolute; left:35px; top:72px; bottom:0;
      width:3px; background:linear-gradient(180deg, var(--primary), var(--accent));
      opacity:0.3;
    }
    .step:last-child .step-line { display:none; }
    .step-num {
      width:72px; height:72px; min-width:72px; border-radius:50%;
      background: linear-gradient(135deg, var(--primary), #3344aa);
      color:var(--white); display:flex; align-items:center; justify-content:center;
      font-size:28px; font-weight:900; margin-right:32px; z-index:1;
      box-shadow: 0 4px 16px rgba(32,36,135,0.2);
    }
    .step-content { flex:1; padding-top:12px; }
    .step-title { font-size:36px; font-weight:900; margin-bottom:8px; }
    .step-desc { font-size:22px; color:var(--text-dark); opacity:0.5; }
    .subtext {
      margin-top:auto; padding-top:24px; font-size:20px;
      color:var(--text-dark); opacity:0.4;
    }
  `;

  const stepsHtml = steps.map((s, i) => `
    <div class="step">
      ${i < steps.length - 1 ? '<div class="step-line"></div>' : ''}
      <span class="step-num">${i + 1}</span>
      <div class="step-content">
        <div class="step-title">${s.title}</div>
        <div class="step-desc">${s.desc || ''}</div>
      </div>
    </div>`).join('');

  const body = `
  <div class="card">
    ${logoArea('light')}
    <span class="card-num">${card.number} / 10</span>
    <div class="section-label">PROCESS</div>
    <h1 class="headline">${card.headline}</h1>
    <div class="steps">${stepsHtml}</div>
    <p class="subtext">${card.subtext || ''}</p>
  </div>`;

  return htmlWrap(css, body);
}

// ─── SOLUTION (리스트) ─── 다크 네이비 배경 + 아이템 카드
function solutionList(card) {
  const items = card.items || [];
  const css = `
    body { background: var(--dark-navy); color: var(--white); }
    .card {
      width:1080px; height:1350px; position:relative;
      display:flex; flex-direction:column;
      padding:100px 72px 60px;
    }
    .card-num {
      position:absolute; top:28px; right:50px;
      font-size:15px; font-weight:700; opacity:0.3;
    }
    .section-label {
      font-size:16px; font-weight:700; color:var(--accent); letter-spacing:3px;
      margin-bottom:16px;
    }
    .headline {
      font-size:42px; font-weight:900; margin-bottom:16px; line-height:1.3;
    }
    .sub-headline {
      font-size:22px; opacity:0.5; margin-bottom:48px;
    }
    .list { display:flex; flex-direction:column; gap:16px; flex:1; justify-content:center; }
    .list-item {
      display:flex; align-items:center; gap:20px;
      background: rgba(255,255,255,0.06);
      border-radius:16px; padding:24px 28px;
      border-left: 4px solid var(--accent);
    }
    .item-icon {
      width:44px; height:44px; min-width:44px; border-radius:50%;
      background:var(--accent); color:var(--dark-bg);
      display:flex; align-items:center; justify-content:center;
      font-size:18px; font-weight:900;
    }
    .item-text { font-size:26px; font-weight:500; line-height:1.5; }
  `;

  const itemsHtml = items.filter(i => i).map((item, idx) => `
    <div class="list-item">
      <div class="item-icon">✓</div>
      <span class="item-text">${item}</span>
    </div>`).join('');

  const body = `
  <div class="card">
    ${decoCircles('dark')}
    ${logoArea('dark')}
    <span class="card-num">${card.number} / 10</span>
    <div class="section-label">SOLUTION</div>
    <h1 class="headline">${card.headline}</h1>
    <p class="sub-headline">${card.subtext || ''}</p>
    <div class="list">${itemsHtml}</div>
  </div>`;

  return htmlWrap(css, body);
}

// ─── SOLUTION (비교형) ───
function solutionCompare(card) {
  const css = `
    body { background: var(--light-bg); color: var(--text-dark); }
    .card {
      width:1080px; height:1350px; position:relative;
      display:flex; flex-direction:column;
      padding:100px 72px 60px;
    }
    .card-num {
      position:absolute; top:28px; right:50px;
      font-size:15px; font-weight:700; color:var(--primary); opacity:0.4;
    }
    .headline {
      font-size:42px; font-weight:900; color:var(--primary); text-align:center; margin-bottom:12px;
    }
    .sub-headline {
      font-size:22px; text-align:center; color:var(--text-dark); opacity:0.5; margin-bottom:40px;
    }
    .compare { display:flex; gap:24px; flex:1; align-items:stretch; }
    .side {
      border-radius:24px; padding:44px 32px;
      display:flex; flex-direction:column;
    }
    .before {
      flex:0.9; background:#eef0f4; color:var(--text-dark);
    }
    .after {
      flex:1.1; background: linear-gradient(135deg, var(--primary), #3344aa);
      color:var(--white);
      box-shadow: 0 8px 40px rgba(32,36,135,0.25);
    }
    .label {
      font-size:15px; font-weight:900; letter-spacing:4px; opacity:0.4; margin-bottom:28px;
    }
    .side-title {
      font-size:30px; font-weight:900; margin-bottom:32px; line-height:1.3;
    }
    .after .side-title { color:var(--secondary); font-size:34px; }
    .side-items { font-size:24px; line-height:2.2; }
    .after .side-items { font-size:26px; font-weight:500; }
    .vs-circle {
      position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
      width:64px; height:64px; border-radius:50%;
      background:var(--gold); color:var(--dark-bg);
      display:flex; align-items:center; justify-content:center;
      font-size:20px; font-weight:900; z-index:2;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
  `;

  const beforeItems = card.before_items || (card.before_data ? `${card.before_data.period}<br>${card.before_data.score}<br>${card.before_data.details}` : '일반 학원');
  const afterItems = card.after_items || (card.after_data ? `${card.after_data.period}<br>${card.after_data.score}<br>${card.after_data.details}` : '올인원 수학학원');
  const beforeTitle = card.before_title || (card.before_data ? card.before_data.period : 'BEFORE');
  const afterTitle = card.after_title || (card.after_data ? card.after_data.period : 'AFTER');

  const body = `
  <div class="card">
    ${logoArea('light')}
    <span class="card-num">${card.number} / 10</span>
    <h1 class="headline">${card.headline}</h1>
    <p class="sub-headline">${card.subtext || ''}</p>
    <div class="compare">
      <div class="side before">
        <span class="label">BEFORE</span>
        <div class="side-title">${beforeTitle}</div>
        <div class="side-items">${beforeItems}</div>
      </div>
      <div class="side after">
        <span class="label">AFTER</span>
        <div class="side-title">${afterTitle}</div>
        <div class="side-items">${afterItems}</div>
      </div>
    </div>
    <div class="vs-circle">VS</div>
  </div>`;

  return htmlWrap(css, body);
}

// ─── EXAMPLE (성과 그리드) ─── 다크 배경
function exampleGrid(card) {
  const items = card.items || [];
  const css = `
    body { background: var(--dark-bg); color: var(--white); }
    .card {
      width:1080px; height:1350px; position:relative;
      display:flex; flex-direction:column;
      padding:100px 72px 60px;
    }
    .card-num {
      position:absolute; top:28px; right:50px;
      font-size:15px; font-weight:700; opacity:0.3;
    }
    .section-label {
      font-size:16px; font-weight:700; color:var(--accent); letter-spacing:3px;
      margin-bottom:16px;
    }
    .headline {
      font-size:44px; font-weight:900; margin-bottom:16px; line-height:1.3;
    }
    .sub-headline { font-size:22px; opacity:0.5; margin-bottom:48px; }
    .grid {
      display:grid; grid-template-columns:1fr 1fr; gap:20px;
      flex:1; align-content:center;
    }
    .grid-item {
      background: rgba(255,255,255,0.06); border-radius:20px;
      padding:40px 32px; text-align:center;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .grid-icon {
      font-size:36px; margin-bottom:16px; color:var(--accent);
    }
    .grid-text {
      font-size:28px; font-weight:700; line-height:1.4;
    }
  `;

  const icons = ['◆', '★', '●', '▲', '■'];
  const gridHtml = items.filter(i => i).map((item, idx) => `
    <div class="grid-item">
      <div class="grid-icon">${icons[idx % icons.length]}</div>
      <div class="grid-text">${item}</div>
    </div>`).join('');

  const body = `
  <div class="card">
    ${decoCircles('dark')}
    ${logoArea('dark')}
    <span class="card-num">${card.number} / 10</span>
    <div class="section-label">RESULT</div>
    <h1 class="headline">${card.headline}</h1>
    <p class="sub-headline">${card.subtext || ''}</p>
    <div class="grid">${gridHtml}</div>
  </div>`;

  return htmlWrap(css, body);
}

// ─── SUMMARY (요약 리스트) ─── 라이트 배경 + 번호
function summaryList(card) {
  const items = card.items || [];
  const css = `
    body { background: var(--light-bg); color: var(--text-dark); }
    .card {
      width:1080px; height:1350px; position:relative;
      display:flex; flex-direction:column;
      padding:100px 80px 60px;
    }
    .card-num {
      position:absolute; top:28px; right:50px;
      font-size:15px; font-weight:700; color:var(--primary); opacity:0.4;
    }
    .top-accent {
      position:absolute; top:0; left:0; right:0; height:6px;
      background: linear-gradient(90deg, var(--primary), var(--accent));
    }
    .section-label {
      font-size:16px; font-weight:700; color:var(--accent); letter-spacing:3px;
      margin-bottom:16px;
    }
    .headline {
      font-size:42px; font-weight:900; color:var(--primary); margin-bottom:16px;
      line-height:1.3;
    }
    .sub-headline {
      font-size:22px; color:var(--text-dark); opacity:0.5; margin-bottom:48px;
    }
    .list { display:flex; flex-direction:column; gap:16px; flex:1; justify-content:center; }
    .list-item {
      display:flex; align-items:center; gap:24px;
      background:var(--white); border-radius:16px;
      padding:28px 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    }
    .item-num {
      width:48px; height:48px; min-width:48px; border-radius:50%;
      background: linear-gradient(135deg, var(--primary), #3344aa);
      color:var(--white); display:flex; align-items:center; justify-content:center;
      font-size:20px; font-weight:900;
    }
    .item-text { font-size:26px; font-weight:500; line-height:1.5; }
  `;

  const itemsHtml = items.filter(i => i).map((item, idx) => `
    <div class="list-item">
      <div class="item-num">${idx + 1}</div>
      <span class="item-text">${item}</span>
    </div>`).join('');

  const body = `
  <div class="card">
    <div class="top-accent"></div>
    ${logoArea('light')}
    <span class="card-num">${card.number} / 10</span>
    <div class="section-label">SUMMARY</div>
    <h1 class="headline">${card.headline}</h1>
    <p class="sub-headline">${card.subtext || ''}</p>
    <div class="list">${itemsHtml}</div>
  </div>`;

  return htmlWrap(css, body);
}

// ─── CTA (행동 유도) ─── 다크 배경 + 버튼
function ctaCard(card) {
  const css = `
    body { background: var(--dark-bg); color: var(--white); }
    .card {
      width:1080px; height:1350px; position:relative;
      display:flex; flex-direction:column; justify-content:center; align-items:center;
      padding:60px; text-align:center;
    }
    .card-num {
      position:absolute; top:28px; right:50px;
      font-size:15px; font-weight:700; opacity:0.3;
    }
    .headline {
      font-size:52px; font-weight:900; line-height:1.4; margin-bottom:28px;
      max-width:900px; z-index:1;
    }
    .subtext {
      font-size:26px; opacity:0.7; margin-bottom:56px; max-width:800px;
      line-height:1.6; z-index:1;
    }
    .cta-btn {
      display:inline-flex; align-items:center; gap:14px;
      background: linear-gradient(135deg, var(--accent), #80c4ff);
      color:var(--dark-bg); font-size:32px; font-weight:900;
      padding:28px 60px; border-radius:60px;
      box-shadow: 0 8px 40px rgba(74,158,255,0.35);
      z-index:1;
    }
    .cta-sub {
      font-size:18px; opacity:0.4; margin-top:24px; z-index:1;
    }
  `;

  const headline = (card.headline || '').replace('{{ACADEMY_NAME}}', '올인원 수학학원');
  const body = `
  <div class="card">
    ${decoCircles('dark')}
    ${logoArea('dark')}
    <span class="card-num">${card.number} / 10</span>
    <h1 class="headline">${headline}</h1>
    <p class="subtext">${card.subtext || ''}</p>
    <div class="cta-btn">${card.cta_text || '무료 상담 신청하기'}</div>
    <p class="cta-sub">분당 수내동 올인원 수학학원</p>
  </div>`;

  return htmlWrap(css, body);
}

// ─── NOTEBOOK (전략 TIP형) ─── 다크 배경 + 노트북 스파이럴
function notebookStrategy(card) {
  const items = card.items || [];
  const css = `
    body { background: var(--dark-navy); color: var(--white); }
    .card {
      width:1080px; height:1350px; position:relative;
      display:flex; flex-direction:column;
      padding:100px 80px 60px;
    }
    .card-num {
      position:absolute; top:28px; right:50px;
      font-size:15px; font-weight:700; opacity:0.3;
    }
    /* 스파이럴 효과 */
    .spiral {
      position:absolute; top:200px; left:56px; right:56px;
      display:flex; justify-content:center; gap:32px;
    }
    .spiral-dot {
      width:16px; height:16px; border-radius:50%;
      background:rgba(255,255,255,0.15); border:2px solid rgba(255,255,255,0.1);
    }
    .headline {
      font-size:46px; font-weight:900; margin-bottom:16px; line-height:1.3;
      text-align:center;
    }
    .headline em { color:var(--accent); font-style:normal; }
    .sub-headline {
      font-size:22px; opacity:0.5; margin-bottom:48px; text-align:center;
    }
    .content-box {
      background:rgba(255,255,255,0.06); border-radius:20px;
      padding:40px 36px; flex:1; display:flex; flex-direction:column;
      justify-content:center;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .box-title {
      font-size:28px; font-weight:900; color:var(--accent);
      text-align:center; margin-bottom:32px;
      padding-bottom:20px; border-bottom:2px solid rgba(255,255,255,0.1);
    }
    .box-item {
      padding:16px 0; font-size:24px; line-height:1.7;
    }
    .box-item-title {
      font-size:26px; font-weight:900; color:var(--white); margin-bottom:8px;
    }
    .box-item-title::before { content:'▶ '; color:var(--accent); }
    .box-item-desc { font-size:22px; opacity:0.7; padding-left:24px; }
  `;

  const itemsHtml = items.filter(i => i).map(item => `
    <div class="box-item">
      <div class="box-item-title">${item}</div>
    </div>`).join('');

  const spiralDots = Array(12).fill('<div class="spiral-dot"></div>').join('');

  const body = `
  <div class="card">
    ${logoArea('dark')}
    <span class="card-num">${card.number} / 10</span>
    <div class="spiral">${spiralDots}</div>
    <h1 class="headline">${card.headline}</h1>
    <p class="sub-headline">${card.subtext || ''}</p>
    <div class="content-box">
      <div class="box-title">${card.boxTitle || ''}</div>
      ${itemsHtml}
    </div>
  </div>`;

  return htmlWrap(css, body);
}

// ─── DATA TABLE (성적표) ─── 라이트 배경 + 테이블
function dataTable(card, options = {}) {
  const rows = options.rows || [];
  const headers = options.headers || ['구분', '항목', '결과'];
  const css = `
    body { background: var(--white); color: var(--text-dark); }
    .card {
      width:1080px; height:1350px; position:relative;
      display:flex; flex-direction:column;
      padding:100px 72px 60px;
    }
    .card-num {
      position:absolute; top:28px; right:50px;
      font-size:15px; font-weight:700; color:var(--primary); opacity:0.4;
    }
    .headline {
      font-size:42px; font-weight:900; color:var(--primary); text-align:center;
      margin-bottom:16px;
    }
    .sub-headline {
      font-size:22px; text-align:center; opacity:0.5; margin-bottom:40px;
    }
    table {
      width:100%; border-collapse:collapse; flex:1;
    }
    thead th {
      background:var(--primary); color:var(--white);
      padding:18px 16px; font-size:20px; font-weight:700;
      text-align:center;
    }
    thead th:first-child { border-radius:12px 0 0 0; }
    thead th:last-child { border-radius:0 12px 0 0; }
    tbody td {
      padding:16px; font-size:20px; text-align:center;
      border-bottom:1px solid #eef0f4;
    }
    tbody tr:nth-child(even) { background:#f8f9fb; }
    tbody td.highlight {
      color:var(--primary); font-weight:900;
    }
  `;

  const thHtml = headers.map(h => `<th>${h}</th>`).join('');
  const rowsHtml = rows.map(row =>
    `<tr>${row.map((cell, i) => `<td${i === row.length - 1 ? ' class="highlight"' : ''}>${cell}</td>`).join('')}</tr>`
  ).join('');

  const body = `
  <div class="card">
    ${logoArea('light')}
    <span class="card-num">${card.number} / 10</span>
    <h1 class="headline">${card.headline}</h1>
    <p class="sub-headline">${card.subtext || ''}</p>
    <table>
      <thead><tr>${thHtml}</tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  </div>`;

  return htmlWrap(css, body);
}


// ═══════════════════════════════════════════════════════
// 세트별 디자인 적용
// ═══════════════════════════════════════════════════════

async function processFolder(folderName, designFn) {
  const copyPath = join(ROOT, 'output', folderName, 'copy.json');
  const data = JSON.parse(await readFile(copyPath, 'utf-8'));
  designFn(data.cards);
  await writeFile(copyPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ ${folderName} — ${data.cards.length}장 재디자인 완료`);
}

// ── 1. 경북대 의예과 합격후기 ──
function design합격후기(cards) {
  for (const card of cards) {
    switch (card.number) {
      case 1:
        card.generated_html = hookDark(card, {
          medal: true,
          medalLabel: '합격',
          confetti: true
        });
        break;
      case 2:
        card.generated_html = problemSpeech(card);
        break;
      case 3:
        card.generated_html = problemList(card);
        break;
      case 4:
        card.generated_html = dataStat(card, {
          medal: true,
          medalTopLabel: '성적 변화',
          medalMainLabel: '3.4등급\n상승',
          medalSubLabel: '중3→고3'
        });
        break;
      case 5:
        card.generated_html = insightSteps(card);
        break;
      case 6:
        card.generated_html = solutionList(card);
        break;
      case 7:
        card.generated_html = solutionCompare(card);
        break;
      case 8:
        card.generated_html = exampleGrid(card);
        break;
      case 9:
        card.generated_html = summaryList(card);
        break;
      case 10:
        card.generated_html = ctaCard(card);
        break;
    }
  }
}

// ── 2. 과제 이행률 100% ──
function design과제이행률(cards) {
  for (const card of cards) {
    switch (card.number) {
      case 1:
        card.generated_html = hookDark(card, { confetti: false });
        break;
      case 2:
        card.generated_html = problemSpeech(card);
        break;
      case 3:
        card.generated_html = problemList(card);
        break;
      case 4:
        card.generated_html = dataStat(card);
        break;
      case 5:
        card.generated_html = insightSteps(card);
        break;
      case 6:
        card.generated_html = solutionList(card);
        break;
      case 7:
        card.generated_html = solutionCompare(card);
        break;
      case 8:
        card.generated_html = exampleGrid(card);
        break;
      case 9:
        card.generated_html = summaryList(card);
        break;
      case 10:
        card.generated_html = ctaCard(card);
        break;
    }
  }
}

// ── 3. 수내 내신1등급 ──
function design내신1등급(cards) {
  for (const card of cards) {
    switch (card.number) {
      case 1:
        card.generated_html = hookDark(card, { confetti: false });
        break;
      case 2:
        card.generated_html = problemSpeech(card);
        break;
      case 3:
        card.generated_html = problemList(card);
        break;
      case 4:
        card.generated_html = dataStat(card);
        break;
      case 5:
        card.generated_html = insightSteps(card);
        break;
      case 6:
        card.generated_html = solutionList(card);
        break;
      case 7:
        card.generated_html = solutionCompare(card);
        break;
      case 8:
        card.generated_html = exampleGrid(card);
        break;
      case 9:
        card.generated_html = summaryList(card);
        break;
      case 10:
        card.generated_html = ctaCard(card);
        break;
    }
  }
}

// ═══════════════════════════════════════════════════════
// 실행
// ═══════════════════════════════════════════════════════

async function main() {
  const folders = [
    {
      name: '올인원 수학학원-경북대-의예과-합격-후기-2026-03-17',
      fn: design합격후기
    },
    {
      name: '올인원 수학학원-과제-이행률-100--시스템-2026-03-16',
      fn: design과제이행률
    },
    {
      name: '올인원 수학학원-수내-수학학원-내신1등급--2026-새-학기엔-준비-방-2026-03-17',
      fn: design내신1등급
    }
  ];

  for (const { name, fn } of folders) {
    try {
      await processFolder(name, fn);
    } catch (e) {
      console.error(`❌ ${name}: ${e.message}`);
    }
  }

  console.log('\n🎯 모든 copy.json 업데이트 완료!');
  console.log('다음 명령어로 렌더링:');
  for (const { name } of folders) {
    console.log(`  node scripts/re-render.js "${name}" --academy ollinone`);
  }
}

main();
