import { readFileSync, writeFileSync } from 'fs';

const copyPath = 'output/올인원-고등3-3-내신1등급-재디자인-2026-03-23/copy.json';
const data = JSON.parse(readFileSync(copyPath, 'utf-8'));

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
      background: #f5f6fa; color: #1A1A2E;
      display: flex; flex-direction: column; overflow: visible;
    }
    .container {
      flex: 1; padding: 48px 44px 16px;
      display: flex; flex-direction: column; gap: 16px;
      box-sizing: border-box;
    }
    .headline { font-size: 48px; font-weight: 900; line-height: 1.2; margin: 0; }
    .headline em { font-style: normal; color: #202487; }
    .subtext { font-size: 20px; color: #6B7280; margin: 0; }

    /* 인포그래픽 - 네이비 배경 강조 */
    .infographic {
      background: #1a237e; color: #fff;
      border-radius: 16px;
      margin: 0 14px 12px; padding: 16px 14px 14px;
      display: flex; flex-direction: column; gap: 14px;
    }
    .info-label {
      font-size: 13px; color: rgba(255,255,255,0.5);
      letter-spacing: 0.05em; text-align: center; font-weight: 700;
    }
    .flow-row {
      display: flex; align-items: flex-start;
      justify-content: center; gap: 6px;
    }
    .flow-step {
      display: flex; flex-direction: column;
      align-items: center; gap: 4px; width: 150px;
    }
    .flow-circle {
      width: 44px; height: 44px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700;
    }
    .fc-default {
      background: rgba(255,255,255,0.12);
      border: 1.5px solid rgba(255,255,255,0.25); color: #fff;
    }
    .fc-accent { background: #f5c842; color: #1a237e; }
    .fc-complete { background: #fff; color: #1a237e; }
    .flow-title { font-size: 13px; font-weight: 700; text-align: center; color: #fff; }
    .flow-desc { font-size: 10px; color: rgba(255,255,255,0.5); text-align: center; }
    .flow-arrow { font-size: 12px; color: #f5c842; font-weight: 900; margin-top: 14px; }

    .progress-section { display: flex; flex-direction: column; gap: 3px; }
    .progress-labels {
      display: flex; justify-content: space-between;
      font-size: 10px; color: rgba(255,255,255,0.4);
    }
    .progress-labels .gold { color: #f5c842; }
    .progress-track {
      height: 5px; border-radius: 3px;
      background: rgba(255,255,255,0.1); overflow: hidden;
    }
    .progress-fill {
      height: 100%; border-radius: 3px;
      background: linear-gradient(90deg, rgba(255,255,255,0.25), #f5c842);
      animation: prog 1.6s ease forwards;
    }
    @keyframes prog { from { width: 0; } to { width: 100%; } }

    .stats-row { display: flex; gap: 8px; }
    .stat-item {
      flex: 1; background: rgba(255,255,255,0.08);
      border-radius: 8px; padding: 8px 6px; text-align: center;
    }
    .stat-num { font-size: 16px; font-weight: 700; color: #f5c842; }
    .stat-label { font-size: 10px; color: rgba(255,255,255,0.5); }

    /* 하단 2열 그리드 */
    .keyword-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 8px; margin: 0 14px 14px;
    }
    .kw-card {
      background: #fff; border-radius: 12px;
      padding: 14px 14px; border: 1px solid #e8eaf6;
      display: flex; align-items: flex-start; gap: 10px;
    }
    .kw-card.full { grid-column: span 2; }
    .kw-num {
      width: 24px; height: 24px; border-radius: 50%;
      background: #1a237e; color: #fff;
      font-size: 11px; font-weight: 900;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; margin-top: 2px;
    }
    .kw-text { display: flex; flex-direction: column; gap: 2px; }
    .kw-title { font-size: 17px; font-weight: 700; color: #1A1A2E; }
    .kw-sub { font-size: 13px; color: #6B7280; }

    .brand-bar {
      width: 100%; height: 80px; background: #202487;
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
          <div class="flow-circle fc-default">1세트</div>
          <div class="flow-title">1세트 기출</div>
          <div class="flow-desc">기출문제 풀기</div>
        </div>
        <div class="flow-arrow">&#9654;</div>
        <div class="flow-step">
          <div class="flow-circle fc-default">오답</div>
          <div class="flow-title">오답 노트</div>
          <div class="flow-desc">틀린 문제 분석</div>
        </div>
        <div class="flow-arrow">&#9654;</div>
        <div class="flow-step">
          <div class="flow-circle fc-accent">2세트</div>
          <div class="flow-title">2세트 변형</div>
          <div class="flow-desc">변형문제 재도전</div>
        </div>
        <div class="flow-arrow">&#9654;</div>
        <div class="flow-step">
          <div class="flow-circle fc-complete">&#10003;</div>
          <div class="flow-title">완벽 &#10003;</div>
          <div class="flow-desc">완벽 이해</div>
        </div>
      </div>
      <div class="progress-section">
        <div class="progress-labels"><span>1세트</span><span class="gold">완벽 &#10003;</span></div>
        <div class="progress-track"><div class="progress-fill"></div></div>
      </div>
      <div class="stats-row">
        <div class="stat-item"><div class="stat-num">2&times;</div><div class="stat-label">반복 횟수</div></div>
        <div class="stat-item"><div class="stat-num">주 3회</div><div class="stat-label">변형 집중 훈련</div></div>
        <div class="stat-item"><div class="stat-num">18교</div><div class="stat-label">기출문제 분석</div></div>
      </div>
    </div>

    <div class="keyword-grid">
      <div class="kw-card">
        <div class="kw-num">01</div>
        <div class="kw-text">
          <div class="kw-title">18개교 기출 3년치 분석</div>
          <div class="kw-sub">분당 중&middot;고 완벽 커버</div>
        </div>
      </div>
      <div class="kw-card">
        <div class="kw-num">02</div>
        <div class="kw-text">
          <div class="kw-title">학교별 맞춤 문제</div>
          <div class="kw-sub">난이도 차이 대응</div>
        </div>
      </div>
      <div class="kw-card">
        <div class="kw-num">03</div>
        <div class="kw-text">
          <div class="kw-title">2세트 단계별 완주</div>
          <div class="kw-sub">기출 &rarr; 변형 루틴</div>
        </div>
      </div>
      <div class="kw-card">
        <div class="kw-num">04</div>
        <div class="kw-text">
          <div class="kw-title">주 3회 변형 훈련</div>
          <div class="kw-sub">조건&middot;수치 집중</div>
        </div>
      </div>
      <div class="kw-card full">
        <div class="kw-num">05</div>
        <div class="kw-text">
          <div class="kw-title">오답 &rarr; 재테스트 &rarr; 완벽</div>
          <div class="kw-sub">완벽 이해까지 반복 완주</div>
        </div>
      </div>
    </div>
  </div>
  <div class="brand-bar">올인원 수학학원</div>
</body>
</html>`;

writeFileSync(copyPath, JSON.stringify(data, null, 2), 'utf-8');
console.log('Card 6 redesigned');
