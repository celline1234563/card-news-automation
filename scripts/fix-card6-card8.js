import { readFileSync, writeFileSync } from 'fs';

const copyPath = 'output/올인원-고등3-3-내신1등급-재디자인-2026-03-23/copy.json';
const data = JSON.parse(readFileSync(copyPath, 'utf-8'));

// === CARD 6: 인포그래픽 삽입 ===
data.cards[5].generated_html = `<!DOCTYPE html>
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
    .bg-deco {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 400px; height: 400px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.04);
      z-index: 0;
    }
    .bg-deco::after {
      content: ''; position: absolute; top: 40px; left: 40px;
      right: 40px; bottom: 40px; border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.03);
    }
    .container {
      flex: 1; width: 100%;
      display: flex; flex-direction: column;
      padding: 48px 52px 16px;
      box-sizing: border-box;
      position: relative; z-index: 1;
      gap: 16px;
    }
    .headline {
      font-size: 56px; font-weight: 900;
      line-height: 1.2; margin: 0;
    }
    .headline em { font-style: normal; font-weight: 900; color: #f5c842; }
    .subtext {
      font-size: 22px; font-weight: 400;
      color: rgba(255,255,255,0.6); margin: 0;
    }

    /* 인포그래픽 */
    .infographic {
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.13);
      border-radius: 14px;
      margin: 12px 14px 8px;
      padding: 14px 12px 12px;
      display: flex; flex-direction: column; gap: 14px;
    }
    .info-label {
      font-size: 13px; color: rgba(255,255,255,0.4);
      letter-spacing: 0.1em; text-align: center;
    }
    /* 4단계 플로우 */
    .flow-row {
      display: flex; align-items: flex-start;
      justify-content: center; gap: 8px;
    }
    .flow-step {
      display: flex; flex-direction: column;
      align-items: center; gap: 6px; width: 160px;
    }
    .flow-circle {
      width: 64px; height: 64px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; font-weight: 700;
    }
    .flow-circle.step-default {
      background: rgba(255,255,255,0.15);
      border: 1.5px solid rgba(255,255,255,0.3);
      color: #fff;
    }
    .flow-circle.step-accent {
      background: #f5c842; color: #1a237e;
    }
    .flow-circle.step-complete {
      background: #fff; color: #1a237e;
    }
    .flow-title { font-size: 16px; font-weight: 700; text-align: center; }
    .flow-desc { font-size: 12px; color: rgba(255,255,255,0.5); text-align: center; }
    .flow-arrow {
      font-size: 20px; color: #f5c842; font-weight: 900;
      margin-top: 20px; flex-shrink: 0;
    }
    /* 진행바 */
    .progress-section { display: flex; flex-direction: column; gap: 4px; }
    .progress-labels {
      display: flex; justify-content: space-between;
      font-size: 12px; color: rgba(255,255,255,0.4);
    }
    .progress-labels .gold { color: #f5c842; }
    .progress-track {
      height: 6px; border-radius: 3px;
      background: rgba(255,255,255,0.1);
      overflow: hidden;
    }
    .progress-fill {
      height: 100%; border-radius: 3px;
      background: linear-gradient(90deg, rgba(255,255,255,0.3), #f5c842);
      animation: progressAnim 1.6s ease forwards;
    }
    @keyframes progressAnim { from { width: 0; } to { width: 100%; } }
    /* 핵심 수치 */
    .stats-row {
      display: flex; gap: 10px;
    }
    .stat-item {
      flex: 1;
      background: rgba(255,255,255,0.06);
      border-radius: 8px;
      padding: 8px; text-align: center;
    }
    .stat-num { font-size: 20px; font-weight: 700; color: #f5c842; }
    .stat-label { font-size: 11px; color: rgba(255,255,255,0.5); }

    /* 리스트 */
    .solution-list {
      display: flex; flex-direction: column; gap: 12px;
    }
    .list-item {
      display: flex; align-items: center; gap: 16px;
    }
    .list-number-badge {
      width: 48px; height: 48px; border-radius: 50%;
      background: var(--color-secondary);
      color: #1a237e;
      font-size: 18px; font-weight: 900;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .list-text {
      font-size: 22px; font-weight: 700;
      line-height: 1.3;
    }
    .brand-bar {
      width: 100%; height: 90px;
      background: rgba(0,0,0,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 26px; font-weight: 700; color: var(--color-secondary);
    }
  </style>
</head>
<body>
  <div class="bg-deco"></div>
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
        <div class="progress-labels">
          <span>1세트</span>
          <span class="gold">완벽 &#10003;</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill"></div>
        </div>
      </div>
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-num">2&times;</div>
          <div class="stat-label">반복 횟수</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">3회</div>
          <div class="stat-label">조건&middot;변형 집중</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">18교</div>
          <div class="stat-label">기출문제 분석</div>
        </div>
      </div>
    </div>

    <div class="solution-list">
      <div class="list-item">
        <div class="list-number-badge">01</div>
        <div class="list-text">분당 중·고 18개교 기출문제 3년치 완벽 분석</div>
      </div>
      <div class="list-item">
        <div class="list-number-badge">02</div>
        <div class="list-text">학교별 난이도 차이 맞춤 문제 세트 제공</div>
      </div>
      <div class="list-item">
        <div class="list-number-badge">03</div>
        <div class="list-text">기출문제 &rarr; 변형문제 단계별 2세트 완주</div>
      </div>
      <div class="list-item">
        <div class="list-number-badge">04</div>
        <div class="list-text">조건&middot;수치 변형 문제 주 3회 집중 훈련</div>
      </div>
      <div class="list-item">
        <div class="list-number-badge">05</div>
        <div class="list-text">오답노트 작성 &rarr; 재테스트 &rarr; 완벽 이해까지</div>
      </div>
    </div>
  </div>
  <div class="brand-bar">올인원 수학학원</div>
</body>
</html>`;

// === CARD 8: 아이콘+설명+태그 추가 ===
data.cards[7].generated_html = `<!DOCTYPE html>
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
      position: absolute; top: -100px; left: -100px;
      width: 350px; height: 350px; border-radius: 50%;
      background: var(--color-secondary); opacity: 0.08; z-index: 0;
    }
    .deco-icon {
      position: absolute; top: 40px; right: 40px;
      width: 180px; height: 180px;
      opacity: 0.06; z-index: 0;
    }
    .deco-icon svg { width: 100%; height: 100%; color: var(--color-secondary); }
    .container {
      flex: 1; width: 100%;
      display: flex; flex-direction: column;
      padding: 56px 52px 24px;
      box-sizing: border-box;
      position: relative; z-index: 1;
      gap: 32px;
    }
    .header { display: flex; flex-direction: column; gap: 16px; }
    .headline {
      font-size: 64px; font-weight: 900;
      line-height: 1.15; margin: 0;
    }
    .headline em { font-style: normal; font-weight: 900; color: #f5c842; }
    .subtext {
      font-size: 24px; font-weight: 400;
      color: rgba(255,255,255,0.6); margin: 0;
    }

    /* 2x2 그리드 */
    .card-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 20px; flex: 1;
    }
    .grid-card {
      background: #fff;
      border-radius: 14px;
      padding: 28px 24px 24px;
      display: flex; flex-direction: column;
      gap: 12px;
    }
    .card-icon {
      width: 52px; height: 52px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 28px;
    }
    .card-title {
      font-size: 28px; font-weight: 700;
      color: #1a237e; margin: 0;
    }
    .card-desc {
      font-size: 19px; color: #666;
      line-height: 1.5; margin: 0;
      flex: 1;
    }
    .card-tags {
      display: flex; gap: 8px; flex-wrap: wrap;
    }
    .tag {
      font-size: 15px;
      background: #eef0ff; color: #3949ab;
      border-radius: 99px;
      padding: 5px 14px; font-weight: 600;
    }

    .brand-bar {
      width: 100%; height: 90px;
      background: rgba(0,0,0,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 26px; font-weight: 700; color: var(--color-secondary);
    }
  </style>
</head>
<body>
  <div class="deco-circle"></div>
  <div class="deco-icon">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
      <circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
    </svg>
  </div>

  <div class="container">
    <div class="header">
      <h1 class="headline">최근 학교 시험 트렌드<br><em>완벽 대응</em></h1>
      <p class="subtext">올인원에서 미리 준비하는 최신 출제 경향</p>
    </div>

    <div class="card-grid">
      <div class="grid-card">
        <div class="card-icon" style="background: #fff3e0;">&#128256;</div>
        <p class="card-title">조건 변형</p>
        <p class="card-desc">숫자&middot;조건을 바꿔도 풀 수 있는 본질 이해 훈련</p>
        <div class="card-tags">
          <span class="tag">수치 변형</span>
          <span class="tag">조건 교체</span>
        </div>
      </div>
      <div class="grid-card">
        <div class="card-icon" style="background: #e8f5e9;">&#9876;&#65039;</div>
        <p class="card-title">실전 훈련</p>
        <p class="card-desc">시험 시간 내 풀어내는 속도&middot;정확도 동시 강화</p>
        <div class="card-tags">
          <span class="tag">시간 압박</span>
          <span class="tag">실전 모의</span>
        </div>
      </div>
      <div class="grid-card">
        <div class="card-icon" style="background: #fce4ec;">&#127919;</div>
        <p class="card-title">고난도 문항</p>
        <p class="card-desc">고난도 킬러 유형 집중 분석 및 풀이법 체화</p>
        <div class="card-tags">
          <span class="tag">고난도</span>
          <span class="tag">유형 분석</span>
        </div>
      </div>
      <div class="grid-card">
        <div class="card-icon" style="background: #e8eaf6;">&#9989;</div>
        <p class="card-title">완벽 대비</p>
        <p class="card-desc">오답 &rarr; 재테스트 &rarr; 완벽 이해까지 반복 완주</p>
        <div class="card-tags">
          <span class="tag">오답 분석</span>
          <span class="tag">재테스트</span>
        </div>
      </div>
    </div>
  </div>
  <div class="brand-bar">올인원 수학학원</div>
</body>
</html>`;

writeFileSync(copyPath, JSON.stringify(data, null, 2), 'utf-8');
console.log('Card 6 (infographic) and Card 8 (icons+tags) updated');
