import { readFileSync, writeFileSync } from 'fs';

const copyPath = 'output/올인원-고등3-3-내신1등급-재디자인-2026-03-23/copy.json';
const data = JSON.parse(readFileSync(copyPath, 'utf-8'));

// Photo to base64
const photoBuf = readFileSync('output/올인원-고등3-3-내신1등급-재디자인-2026-03-23/photo.png');
const photoB64 = 'data:image/png;base64,' + photoBuf.toString('base64');

// === CARD 1: 밝은배경 + 사진상단 + 텍스트하단 + 좌측정렬 ===
data.cards[0].generated_html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --color-primary: #202487;
      --color-secondary: #fff3c8;
      --color-background: #F8F8FF;
      --color-text: #1A1A2E;
      --color-highlight: #FFE030;
      --font-main: 'Noto Sans KR', sans-serif;
    }
    body {
      width: 1080px; height: 1350px; margin: 0;
      font-family: var(--font-main);
      word-break: keep-all;
      background-color: var(--color-background);
      display: flex; flex-direction: column;
      overflow: visible;
    }
    .photo-area {
      height: 580px;
      background-image: url('${photoB64}');
      background-size: cover;
      background-position: center;
      position: relative;
    }
    .photo-overlay {
      position: absolute; bottom: 0; left: 0; right: 0;
      height: 120px;
      background: linear-gradient(to top, var(--color-background) 0%, transparent 100%);
    }
    .content {
      flex: 1;
      padding: 40px 60px 32px 60px;
      display: flex; flex-direction: column;
      justify-content: center;
    }
    .headline {
      font-size: 58px; font-weight: 900;
      line-height: 1.25; color: var(--color-text);
      text-align: left; margin: 0 0 24px 0;
    }
    .headline em {
      background: linear-gradient(to top, var(--color-highlight) 35%, transparent 35%);
      font-style: normal; font-weight: 900;
      padding: 2px 6px; display: inline;
      box-decoration-break: clone; -webkit-box-decoration-break: clone;
    }
    .subtext {
      font-size: 26px; font-weight: 400;
      color: #6B7280; text-align: left;
      line-height: 1.5; margin: 0;
    }
    .brand-bar {
      width: 100%; height: 90px;
      background-color: var(--color-primary);
      display: flex; align-items: center; justify-content: center;
      font-size: 26px; font-weight: 700;
      color: #FFFFFF;
    }
  </style>
</head>
<body>
  <div class="photo-area">
    <div class="photo-overlay"></div>
  </div>
  <div class="content">
    <h1 class="headline">2026 새 학기, 내신<br><em>예전처럼 준비하면 위험하다!</em></h1>
    <p class="subtext">일반고가 특목고보다 유리해진 이유를 아시나요?</p>
  </div>
  <div class="brand-bar">올인원 수학학원</div>
</body>
</html>`;

// === CARD 3: 인포그래픽 추가 + 아이콘 위치 조정 ===
data.cards[2].generated_html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --color-primary: #202487;
      --color-secondary: #fff3c8;
      --color-highlight: #FFE030;
      --font-main: 'Noto Sans KR', sans-serif;
    }
    body {
      width: 1080px; height: 1350px; margin: 0;
      font-family: var(--font-main);
      word-break: keep-all;
      background: #1a237e;
      color: #fff;
      display: flex; flex-direction: column;
      overflow: visible;
      position: relative;
    }
    .deco-circle {
      position: absolute; top: -80px; left: -80px;
      width: 350px; height: 350px; border-radius: 50%;
      background: var(--color-secondary); opacity: 0.08; z-index: 0;
    }
    .deco-bars {
      position: absolute; bottom: 100px; right: -20px;
      display: flex; gap: 8px; opacity: 0.08; z-index: 0;
    }
    .deco-bars div { width: 16px; border-radius: 8px; background: var(--color-secondary); }
    .container {
      flex: 1; width: 100%;
      display: flex; flex-direction: column;
      padding: 60px; padding-bottom: 0;
      box-sizing: border-box;
      position: relative; z-index: 1;
    }
    .header { text-align: center; margin-bottom: 24px; }
    .subtext {
      font-size: 24px; font-weight: 700;
      color: rgba(255,255,255,0.8);
      margin: 0 0 12px 0;
    }
    .headline {
      font-size: 72px; font-weight: 900;
      line-height: 1.15; margin: 0;
    }
    .headline em {
      background: linear-gradient(to top, var(--color-highlight) 35%, transparent 35%);
      font-style: normal; font-weight: 900;
      padding: 2px 6px; display: inline;
      box-decoration-break: clone; -webkit-box-decoration-break: clone;
      text-shadow: none;
    }
    .infographic {
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.13);
      border-radius: 12px;
      padding: 28px 24px 20px;
      margin-bottom: 8px;
      display: flex; flex-direction: column; gap: 20px;
    }
    .info-row {
      display: flex; align-items: center;
      justify-content: center; gap: 24px;
    }
    .bar-group { display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .bar-label { font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.9); }
    .stacked-bar {
      width: 280px; height: 36px;
      border-radius: 6px; overflow: hidden;
      display: flex;
    }
    .stacked-bar .seg {
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: #1a237e;
    }
    .bar-9 .seg:nth-child(1) { flex: 4; background: #f5c842; }
    .bar-9 .seg:nth-child(2) { flex: 7; background: #ffd966; }
    .bar-9 .seg:nth-child(3) { flex: 12; background: #ffe699; }
    .bar-9 .seg:nth-child(4) { flex: 17; background: #a8b4e0; }
    .bar-9 .seg:nth-child(5) { flex: 20; background: #8090cc; }
    .bar-9 .seg:nth-child(6) { flex: 17; background: #a8b4e0; }
    .bar-9 .seg:nth-child(7) { flex: 12; background: #ffe699; }
    .bar-9 .seg:nth-child(8) { flex: 7; background: #ffd966; }
    .bar-9 .seg:nth-child(9) { flex: 4; background: #f5c842; }
    .bar-5 .seg:nth-child(1) { flex: 10; background: #f5c842; font-size: 13px; font-weight: 900; }
    .bar-5 .seg:nth-child(2) { flex: 24; background: #ffd966; }
    .bar-5 .seg:nth-child(3) { flex: 32; background: #a8b4e0; }
    .bar-5 .seg:nth-child(4) { flex: 24; background: #8090cc; }
    .bar-5 .seg:nth-child(5) { flex: 10; background: #6070b0; color: #fff; }
    .arrow-area {
      display: flex; flex-direction: column;
      align-items: center; gap: 4px;
    }
    .arrow-icon { font-size: 28px; color: #f5c842; font-weight: 900; letter-spacing: -4px; }
    .arrow-label { font-size: 14px; font-weight: 700; color: #f5c842; white-space: nowrap; }
    .stat-row {
      display: flex; align-items: center;
      justify-content: center; gap: 16px;
    }
    .stat-box {
      background: rgba(255,255,255,0.1);
      border-radius: 8px; padding: 8px 16px;
      text-align: center;
    }
    .stat-box .num { font-size: 22px; font-weight: 900; color: #fff; }
    .stat-box .label { font-size: 13px; color: rgba(255,255,255,0.7); }
    .stat-arrow {
      font-size: 16px; font-weight: 900;
      color: #f5c842; white-space: nowrap;
    }
    .stat-box.highlight { background: rgba(245,200,66,0.2); border: 1px solid rgba(245,200,66,0.4); }
    .stat-box.highlight .num { color: #f5c842; }
    .icon-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 28px 40px;
      margin-top: 16px;
      padding-bottom: 14px;
      max-width: 750px; width: 100%;
      align-self: center;
    }
    .grid-item {
      display: flex; flex-direction: column;
      align-items: center; text-align: center; gap: 12px;
    }
    .icon-circle {
      width: 72px; height: 72px; border-radius: 50%;
      background: var(--color-secondary);
      display: flex; align-items: center; justify-content: center;
    }
    .icon-circle svg { width: 36px; height: 36px; color: #1a237e; }
    .grid-item p { font-size: 28px; font-weight: 700; margin: 0; }
    .brand-bar {
      width: 100%; height: 100px;
      background: rgba(0,0,0,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; font-weight: 900;
      color: var(--color-secondary);
    }
  </style>
</head>
<body>
  <div class="deco-circle"></div>
  <div class="deco-bars">
    <div style="height:80px"></div><div style="height:120px"></div><div style="height:160px"></div>
  </div>
  <div class="container">
    <div class="header">
      <p class="subtext">학교 내 경쟁 구조에 변화가 생겼습니다</p>
      <h1 class="headline">1등급 경쟁이 <em>더 치열해진 이유</em></h1>
    </div>
    <div class="infographic">
      <div class="info-row">
        <div class="bar-group">
          <span class="bar-label">9등급제</span>
          <div class="stacked-bar bar-9">
            <div class="seg">1</div><div class="seg">2</div><div class="seg">3</div>
            <div class="seg">4</div><div class="seg">5</div><div class="seg">6</div>
            <div class="seg">7</div><div class="seg">8</div><div class="seg">9</div>
          </div>
        </div>
        <div class="arrow-area">
          <span class="arrow-icon">▶▶</span>
          <span class="arrow-label">2025 개편</span>
        </div>
        <div class="bar-group">
          <span class="bar-label">5등급제</span>
          <div class="stacked-bar bar-5">
            <div class="seg">1</div><div class="seg">2</div>
            <div class="seg">3</div><div class="seg">4</div><div class="seg">5</div>
          </div>
        </div>
      </div>
      <div class="stat-row">
        <div class="stat-box">
          <div class="num">4%</div>
          <div class="label">기존 1등급</div>
        </div>
        <span class="stat-arrow">+6%p 확대 →</span>
        <div class="stat-box highlight">
          <div class="num">10%</div>
          <div class="label">신 1등급</div>
        </div>
      </div>
    </div>
    <div class="icon-grid">
      <div class="grid-item">
        <div class="icon-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
        </div>
        <p>상위권 몰림</p>
      </div>
      <div class="grid-item">
        <div class="icon-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
        </div>
        <p>1등급 구간</p>
      </div>
      <div class="grid-item">
        <div class="icon-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        </div>
        <p>점수 격차</p>
      </div>
      <div class="grid-item">
        <div class="icon-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <p>동점자 속출</p>
      </div>
    </div>
  </div>
  <div class="brand-bar">올인원 수학학원</div>
</body>
</html>`;

writeFileSync(copyPath, JSON.stringify(data, null, 2), 'utf-8');
console.log('Card 1 (photo) and Card 3 (infographic) updated');
