import { readFileSync, writeFileSync } from 'fs';

const copyPath = 'output/올인원-고등3-3-내신1등급-재디자인-2026-03-23/copy.json';
const data = JSON.parse(readFileSync(copyPath, 'utf-8'));

const BRIGHT_BG = '#F8F8FF';
const PRIMARY = '#202487';
const GOLD = '#f5c842';
const TEXT_DARK = '#1A1A2E';
const TEXT_MUTED = '#6B7280';

// === 카드 2: 밝은배경 + 헤드라인→인포그래픽→제목 순서 ===
data.cards[1].generated_html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    :root { --font-main: 'Noto Sans KR', sans-serif; }
    body {
      width: 1080px; height: 1350px; margin: 0;
      font-family: var(--font-main); word-break: keep-all;
      background: ${BRIGHT_BG}; color: ${TEXT_DARK};
      display: flex; flex-direction: column; overflow: visible;
    }
    .container {
      flex: 1; padding: 56px 60px 24px;
      display: flex; flex-direction: column; gap: 28px;
      box-sizing: border-box;
    }
    .headline {
      font-size: 48px; font-weight: 900; line-height: 1.25; margin: 0;
    }
    .subtext { font-size: 22px; color: ${TEXT_MUTED}; margin: 0; }

    /* 인포그래픽 */
    .infographic {
      background: #fff; border: 1px solid #e0e0e8;
      border-radius: 16px; padding: 28px 24px 20px;
      display: flex; flex-direction: column; gap: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .compare-header {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 16px; color: ${TEXT_MUTED};
    }
    .compare-badge { color: ${PRIMARY}; font-weight: 700; }
    .compare-cards { display: flex; gap: 16px; }
    .score-card {
      flex: 1; border-radius: 14px; padding: 28px 24px;
      display: flex; flex-direction: column; align-items: center; gap: 6px;
    }
    .score-card.before { background: #f0f1f8; }
    .score-card.after { background: ${PRIMARY}; color: #fff; }
    .year-label { font-size: 16px; opacity: 0.6; }
    .score { font-size: 64px; font-weight: 900; line-height: 1; }
    .score-card.after .score { color: #fff; }
    .score-desc { font-size: 16px; opacity: 0.5; }
    .score-tag {
      display: inline-block; padding: 5px 14px; border-radius: 20px;
      font-size: 14px; font-weight: 700; margin-top: 4px;
    }
    .tag-pass { background: #e0e0e8; color: ${TEXT_MUTED}; }
    .tag-warning { background: ${GOLD}; color: ${PRIMARY}; }
    .arrow-between { font-size: 24px; color: #ccc; align-self: center; }
    .cutline-badge {
      align-self: center; background: ${PRIMARY}; color: #fff;
      font-size: 18px; font-weight: 900; padding: 10px 28px; border-radius: 24px;
    }
    .stats-row { display: flex; gap: 12px; }
    .stat-card {
      flex: 1; background: #fff; border: 1px solid #e0e0e8;
      border-radius: 12px; padding: 20px; text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .stat-num { font-size: 40px; font-weight: 900; color: ${PRIMARY}; }
    .stat-label { font-size: 14px; color: ${TEXT_MUTED}; margin-top: 6px; line-height: 1.4; }

    .section-title {
      font-size: 36px; font-weight: 900; line-height: 1.3; margin: 0;
      color: ${TEXT_DARK};
    }
    .section-title em { font-style: normal; color: ${PRIMARY}; }

    .quote-box {
      border-left: 4px solid ${GOLD}; padding: 16px 20px;
      background: #fff; border-radius: 0 10px 10px 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .quote-box p { font-size: 20px; font-weight: 700; line-height: 1.5; margin: 0; color: ${TEXT_DARK}; }
    .quote-box p strong { color: ${PRIMARY}; }
    .brand-bar {
      width: 100%; height: 80px; background: ${PRIMARY};
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; font-weight: 700; color: #fff;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="headline">학교 내 경쟁 구조에<br>변화가 생겼습니다</h1>
    <p class="subtext">일반고 내신 1등급 취득 기준의 변화</p>

    <div class="infographic">
      <div class="compare-header">
        <span>3년 전</span>
        <span class="compare-badge">&#9650; 기준 상승</span>
        <span>지금</span>
      </div>
      <div class="compare-cards">
        <div class="score-card before">
          <span class="year-label">2021년</span>
          <span class="score">93점</span>
          <span class="score-desc">&rarr; 내신 1등급</span>
          <span class="score-tag tag-pass">통과</span>
        </div>
        <div class="arrow-between">&rarr;</div>
        <div class="score-card after">
          <span class="year-label">2024년</span>
          <span class="score">97점</span>
          <span class="score-desc">&rarr; 내신 1등급</span>
          <span class="score-tag tag-warning">4점 더 필요</span>
        </div>
      </div>
    </div>

    <div class="cutline-badge">3년 사이 커트라인 +4점 상승</div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-num">4.7%</div>
        <div class="stat-label">현재 일반고<br>내신 1등급 비율</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">&darr; 38%</div>
        <div class="stat-label">1등급 배출<br>3년간 감소율</div>
      </div>
    </div>

    <h2 class="section-title"><em>1등급 경쟁이 더 치열해진 이유</em></h2>

    <div class="quote-box">
      <p>상위권 학생도 <strong>이유를 모른 채 등급이 떨어집니다.</strong><br>내신 시스템이 바뀌었기 때문입니다.</p>
    </div>
  </div>
  <div class="brand-bar">올인원 수학학원</div>
</body>
</html>`;

// === 카드 3: 밝은 배경으로 변경 ===
data.cards[2].generated_html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    :root { --font-main: 'Noto Sans KR', sans-serif; }
    body {
      width: 1080px; height: 1350px; margin: 0;
      font-family: var(--font-main); word-break: keep-all;
      background: ${BRIGHT_BG}; color: ${TEXT_DARK};
      display: flex; flex-direction: column; overflow: visible;
    }
    .container {
      flex: 1; padding: 56px 60px 24px;
      display: flex; flex-direction: column; justify-content: center; gap: 32px;
      box-sizing: border-box;
    }
    .header { text-align: center; }
    .subtext { font-size: 22px; color: ${TEXT_MUTED}; margin: 0 0 12px 0; }
    .headline { font-size: 64px; font-weight: 900; line-height: 1.15; margin: 0; }
    .headline em { font-style: normal; color: ${PRIMARY}; }
    .infographic {
      background: #fff; border: 1px solid #e0e0e8; border-radius: 14px;
      padding: 28px 24px 20px; display: flex; flex-direction: column; gap: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .info-row { display: flex; align-items: center; justify-content: center; gap: 20px; }
    .bar-group { display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .bar-label { font-size: 16px; font-weight: 700; color: ${TEXT_DARK}; }
    .stacked-bar { width: 280px; height: 36px; border-radius: 6px; overflow: hidden; display: flex; }
    .stacked-bar .seg { display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }
    .bar-9 .seg:nth-child(1) { flex: 4; background: ${GOLD}; color: ${PRIMARY}; }
    .bar-9 .seg:nth-child(2) { flex: 7; background: #ffd966; color: ${PRIMARY}; }
    .bar-9 .seg:nth-child(3) { flex: 12; background: #ffe699; color: ${PRIMARY}; }
    .bar-9 .seg:nth-child(4) { flex: 17; background: #c5cae9; color: ${PRIMARY}; }
    .bar-9 .seg:nth-child(5) { flex: 20; background: #9fa8da; color: #fff; }
    .bar-9 .seg:nth-child(6) { flex: 17; background: #c5cae9; color: ${PRIMARY}; }
    .bar-9 .seg:nth-child(7) { flex: 12; background: #ffe699; color: ${PRIMARY}; }
    .bar-9 .seg:nth-child(8) { flex: 7; background: #ffd966; color: ${PRIMARY}; }
    .bar-9 .seg:nth-child(9) { flex: 4; background: ${GOLD}; color: ${PRIMARY}; }
    .bar-5 .seg:nth-child(1) { flex: 10; background: ${GOLD}; color: ${PRIMARY}; font-weight: 900; }
    .bar-5 .seg:nth-child(2) { flex: 24; background: #ffd966; color: ${PRIMARY}; }
    .bar-5 .seg:nth-child(3) { flex: 32; background: #c5cae9; color: ${PRIMARY}; }
    .bar-5 .seg:nth-child(4) { flex: 24; background: #9fa8da; color: #fff; }
    .bar-5 .seg:nth-child(5) { flex: 10; background: #7986cb; color: #fff; }
    .arrow-area { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .arrow-icon { font-size: 24px; color: ${PRIMARY}; font-weight: 900; }
    .arrow-label { font-size: 13px; font-weight: 700; color: ${PRIMARY}; }
    .stat-row { display: flex; align-items: center; justify-content: center; gap: 16px; }
    .stat-box { background: #f0f1f8; border-radius: 8px; padding: 8px 16px; text-align: center; }
    .stat-box .num { font-size: 20px; font-weight: 900; color: ${TEXT_DARK}; }
    .stat-box .label { font-size: 12px; color: ${TEXT_MUTED}; }
    .stat-arrow { font-size: 15px; font-weight: 900; color: ${PRIMARY}; }
    .stat-box.highlight { background: rgba(32,36,135,0.08); border: 1px solid rgba(32,36,135,0.2); }
    .stat-box.highlight .num { color: ${PRIMARY}; }
    .icon-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 24px 40px; max-width: 750px; width: 100%; align-self: center;
    }
    .grid-item { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px; }
    .icon-circle {
      width: 68px; height: 68px; border-radius: 50%; background: ${PRIMARY};
      display: flex; align-items: center; justify-content: center;
    }
    .icon-circle svg { width: 32px; height: 32px; color: #fff; }
    .grid-item p { font-size: 24px; font-weight: 700; margin: 0; color: ${TEXT_DARK}; }
    .brand-bar {
      width: 100%; height: 80px; background: ${PRIMARY};
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; font-weight: 700; color: #fff;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p class="subtext">학교 내 경쟁 구조에 변화가 생겼습니다</p>
      <h1 class="headline">1등급 경쟁이 <em>더 치열해진 이유</em></h1>
    </div>
    <div class="infographic">
      <div class="info-row">
        <div class="bar-group"><span class="bar-label">9등급제</span>
          <div class="stacked-bar bar-9"><div class="seg">1</div><div class="seg">2</div><div class="seg">3</div><div class="seg">4</div><div class="seg">5</div><div class="seg">6</div><div class="seg">7</div><div class="seg">8</div><div class="seg">9</div></div>
        </div>
        <div class="arrow-area"><span class="arrow-icon">&#9654;&#9654;</span><span class="arrow-label">2025 개편</span></div>
        <div class="bar-group"><span class="bar-label">5등급제</span>
          <div class="stacked-bar bar-5"><div class="seg">1</div><div class="seg">2</div><div class="seg">3</div><div class="seg">4</div><div class="seg">5</div></div>
        </div>
      </div>
      <div class="stat-row">
        <div class="stat-box"><div class="num">4%</div><div class="label">기존 1등급</div></div>
        <span class="stat-arrow">+6%p 확대 &rarr;</span>
        <div class="stat-box highlight"><div class="num">10%</div><div class="label">신 1등급</div></div>
      </div>
    </div>
    <div class="icon-grid">
      <div class="grid-item"><div class="icon-circle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg></div><p>상위권 몰림</p></div>
      <div class="grid-item"><div class="icon-circle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg></div><p>1등급 구간</p></div>
      <div class="grid-item"><div class="icon-circle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div><p>점수 격차</p></div>
      <div class="grid-item"><div class="icon-circle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div><p>동점자 속출</p></div>
    </div>
  </div>
  <div class="brand-bar">올인원 수학학원</div>
</body>
</html>`;

// === 카드 4: 밝은 배경 ===
data.cards[3].generated_html = data.cards[3].generated_html
  .replace(/background:\s*var\(--color-primary\)/g, `background: ${BRIGHT_BG}`)
  .replace(/background-color:\s*var\(--color-primary\)/g, `background-color: ${BRIGHT_BG}`)
  .replace(/background:\s*#[0-9a-fA-F]{6}/g, `background: ${BRIGHT_BG}`)
  .replace(/color:\s*var\(--text-inverse\)/g, `color: ${TEXT_DARK}`)
  .replace(/color:\s*#FFFFFF/g, `color: ${TEXT_DARK}`)
  .replace(/color:\s*rgba\(255,\s*255,\s*255/g, `color: rgba(26, 26, 46`);

// === 카드 6: 밝은배경 + 인포그래픽 크게 + 18교→분당 18개교 + 1-5번 간결요약 ===
data.cards[5].generated_html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    :root { --font-main: 'Noto Sans KR', sans-serif; }
    body {
      width: 1080px; height: 1350px; margin: 0;
      font-family: var(--font-main); word-break: keep-all;
      background: ${BRIGHT_BG}; color: ${TEXT_DARK};
      display: flex; flex-direction: column; overflow: visible;
    }
    .container {
      flex: 1; padding: 48px 52px 20px;
      display: flex; flex-direction: column; gap: 20px;
      box-sizing: border-box;
    }
    .headline { font-size: 48px; font-weight: 900; line-height: 1.2; margin: 0; }
    .headline em { font-style: normal; color: ${PRIMARY}; }
    .subtext { font-size: 20px; color: ${TEXT_MUTED}; margin: 0; }

    /* 인포그래픽 크게 */
    .infographic {
      background: #fff; border: 1px solid #e0e0e8; border-radius: 16px;
      padding: 32px 28px 24px; display: flex; flex-direction: column; gap: 20px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .info-label { font-size: 15px; color: ${TEXT_MUTED}; letter-spacing: 0.05em; text-align: center; font-weight: 700; }
    .flow-row { display: flex; align-items: flex-start; justify-content: center; gap: 12px; }
    .flow-step { display: flex; flex-direction: column; align-items: center; gap: 8px; width: 170px; }
    .flow-circle {
      width: 80px; height: 80px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 700;
    }
    .flow-circle.step-default { background: #f0f1f8; border: 2px solid #d0d2e8; color: ${TEXT_DARK}; }
    .flow-circle.step-accent { background: ${PRIMARY}; color: #fff; }
    .flow-circle.step-complete { background: ${GOLD}; color: ${PRIMARY}; }
    .flow-title { font-size: 18px; font-weight: 700; text-align: center; color: ${TEXT_DARK}; }
    .flow-desc { font-size: 13px; color: ${TEXT_MUTED}; text-align: center; }
    .flow-arrow { font-size: 22px; color: ${PRIMARY}; font-weight: 900; margin-top: 28px; }

    .progress-section { display: flex; flex-direction: column; gap: 4px; }
    .progress-labels { display: flex; justify-content: space-between; font-size: 13px; color: ${TEXT_MUTED}; }
    .progress-labels .accent { color: ${PRIMARY}; font-weight: 700; }
    .progress-track { height: 8px; border-radius: 4px; background: #e0e0e8; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #c5cae9, ${PRIMARY}); animation: prog 1.6s ease forwards; }
    @keyframes prog { from { width: 0; } to { width: 100%; } }

    .stats-row { display: flex; gap: 12px; }
    .stat-item {
      flex: 1; background: #fff; border: 1px solid #e0e0e8;
      border-radius: 10px; padding: 14px; text-align: center;
      box-shadow: 0 1px 6px rgba(0,0,0,0.04);
    }
    .stat-num { font-size: 28px; font-weight: 900; color: ${PRIMARY}; }
    .stat-label { font-size: 13px; color: ${TEXT_MUTED}; }

    /* 간결 요약 리스트 */
    .summary-list {
      display: flex; flex-wrap: wrap; gap: 10px;
      justify-content: center;
    }
    .summary-tag {
      background: ${PRIMARY}; color: #fff;
      font-size: 17px; font-weight: 700;
      padding: 10px 20px; border-radius: 10px;
    }
    .brand-bar {
      width: 100%; height: 80px; background: ${PRIMARY};
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; font-weight: 700; color: #fff;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="headline">올인원 수학학원<br><em>내신1등급</em> 전략 첫 번째</h1>
    <p class="subtext">올인원만의 2세트 반복 훈련 시스템</p>

    <div class="infographic">
      <div class="info-label">2세트 반복 &rarr; 완벽 이해 사이클</div>
      <div class="flow-row">
        <div class="flow-step">
          <div class="flow-circle step-default">1세트</div>
          <div class="flow-title">1세트 기출</div>
          <div class="flow-desc">기출문제 풀기</div>
        </div>
        <div class="flow-arrow">&#9654;</div>
        <div class="flow-step">
          <div class="flow-circle step-default">오답</div>
          <div class="flow-title">오답 노트</div>
          <div class="flow-desc">틀린 문제 분석</div>
        </div>
        <div class="flow-arrow">&#9654;</div>
        <div class="flow-step">
          <div class="flow-circle step-accent">2세트</div>
          <div class="flow-title">2세트 변형</div>
          <div class="flow-desc">변형문제 재도전</div>
        </div>
        <div class="flow-arrow">&#9654;</div>
        <div class="flow-step">
          <div class="flow-circle step-complete">&#10003;</div>
          <div class="flow-title">완벽 &#10003;</div>
          <div class="flow-desc">완벽 이해</div>
        </div>
      </div>
      <div class="progress-section">
        <div class="progress-labels"><span>1세트</span><span class="accent">완벽 &#10003;</span></div>
        <div class="progress-track"><div class="progress-fill"></div></div>
      </div>
      <div class="stats-row">
        <div class="stat-item"><div class="stat-num">2&times;</div><div class="stat-label">반복 횟수</div></div>
        <div class="stat-item"><div class="stat-num">주 3회</div><div class="stat-label">변형 집중 훈련</div></div>
        <div class="stat-item"><div class="stat-num">분당 18개교</div><div class="stat-label">기출문제 분석</div></div>
      </div>
    </div>

    <div class="summary-list">
      <div class="summary-tag">18개교 기출 3년치 분석</div>
      <div class="summary-tag">학교별 맞춤 문제</div>
      <div class="summary-tag">2세트 단계별 완주</div>
      <div class="summary-tag">주 3회 변형 훈련</div>
      <div class="summary-tag">오답 &rarr; 재테스트 &rarr; 완벽</div>
    </div>
  </div>
  <div class="brand-bar">올인원 수학학원</div>
</body>
</html>`;

// === 나머지 어두운 카드들 밝은 배경으로 변경 (카드4, 8, 9, 10) ===
// 카드4는 위에서 regex로 처리

// 카드8: 밝은 배경
let h8 = data.cards[7].generated_html;
h8 = h8.replace(/background:\s*#1a237e;/g, `background: ${BRIGHT_BG};`);
h8 = h8.replace(/color:\s*#fff;/g, `color: ${TEXT_DARK};`);
h8 = h8.replace(/.headline em \{ font-style: normal; font-weight: 900; color: #f5c842; \}/, `.headline em { font-style: normal; font-weight: 900; color: ${PRIMARY}; }`);
h8 = h8.replace(/color: rgba\(255,255,255,0\.6\)/g, `color: ${TEXT_MUTED}`);
h8 = h8.replace(/background: var\(--color-secondary\); opacity: 0\.08;/, `background: ${PRIMARY}; opacity: 0.06;`);
h8 = h8.replace(/color: var\(--color-secondary\);/g, `color: ${PRIMARY};`);
h8 = h8.replace(/background: rgba\(0,0,0,0\.2\);/, `background: ${PRIMARY};`);
h8 = h8.replace(/font-size: 26px; font-weight: 700; color: var\(--color-secondary\);/, `font-size: 24px; font-weight: 700; color: #fff;`);
data.cards[7].generated_html = h8;

// 카드9: 밝은 배경
let h9 = data.cards[8].generated_html;
h9 = h9.replace(/background(?:-color)?:\s*var\(--color-primary\)/g, `background: ${BRIGHT_BG}`);
h9 = h9.replace(/background:\s*#[12][0-9a-fA-F]{5}/g, `background: ${BRIGHT_BG}`);
h9 = h9.replace(/color:\s*var\(--text-inverse\)/g, `color: ${TEXT_DARK}`);
h9 = h9.replace(/color:\s*#FFFFFF(?![\da-fA-F])/g, `color: ${TEXT_DARK}`);
h9 = h9.replace(/color:\s*rgba\(255,\s*255,\s*255/g, `color: rgba(26, 26, 46`);
h9 = h9.replace(/background:\s*rgba\(0,\s*0,\s*0,\s*0\.[12]\)/g, `background: ${PRIMARY}`);
data.cards[8].generated_html = h9;

// 카드10: 밝은 배경
let h10 = data.cards[9].generated_html;
h10 = h10.replace(/background(?:-color)?:\s*var\(--color-primary\)/g, `background: ${BRIGHT_BG}`);
h10 = h10.replace(/background:\s*#[12][0-9a-fA-F]{5}/g, `background: ${BRIGHT_BG}`);
h10 = h10.replace(/color:\s*var\(--text-inverse\)/g, `color: ${TEXT_DARK}`);
h10 = h10.replace(/color:\s*#FFFFFF(?![\da-fA-F])/g, `color: ${TEXT_DARK}`);
h10 = h10.replace(/color:\s*rgba\(255,\s*255,\s*255/g, `color: rgba(26, 26, 46`);
h10 = h10.replace(/background:\s*rgba\(0,\s*0,\s*0,\s*0\.[12]\)/g, `background: ${PRIMARY}`);
data.cards[9].generated_html = h10;

writeFileSync(copyPath, JSON.stringify(data, null, 2), 'utf-8');
console.log('All cards updated to bright background + card2/card6 redesigned');
