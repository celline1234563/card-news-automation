import { readFileSync, writeFileSync } from 'fs';

const copyPath = 'output/올인원-고등3-3-내신1등급-재디자인-2026-03-23/copy.json';
const data = JSON.parse(readFileSync(copyPath, 'utf-8'));

// === 1. 전체 카드 하이라이트 제거 ===
for (const card of data.cards) {
  if (!card.generated_html) continue;
  let html = card.generated_html;

  // em 태그의 하이라이트 배경 CSS 제거 (linear-gradient 방식)
  // em을 일반 볼드 텍스트로 변환
  html = html.replace(
    /\.headline\s+em\s*\{[^}]*\}/g,
    '.headline em { font-style: normal; font-weight: 900; display: inline; }'
  );
  html = html.replace(
    /\.highlight-em\s*\{[^}]*\}/g,
    '.highlight-em { font-style: normal; font-weight: 900; display: inline; }'
  );
  // 일반 em 스타일도 제거
  html = html.replace(
    /\bem\s*\{[^}]*linear-gradient[^}]*\}/g,
    'em { font-style: normal; font-weight: 900; display: inline; }'
  );

  card.generated_html = html;
}
console.log('All highlights removed from 10 cards');

// === 2. 카드 2 완전 리디자인 ===
data.cards[1].generated_html = `<!DOCTYPE html>
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
      --color-accent: #202487;
      --font-main: 'Noto Sans KR', sans-serif;
    }
    body {
      width: 1080px; height: 1350px; margin: 0;
      font-family: var(--font-main);
      word-break: keep-all;
      background: #1a1a5e;
      color: #fff;
      display: flex; flex-direction: column;
      overflow: visible;
    }
    .container {
      flex: 1; padding: 56px 60px 40px;
      display: flex; flex-direction: column;
      gap: 28px;
      box-sizing: border-box;
    }

    /* 상단 카테고리 */
    .category {
      display: flex; align-items: center; gap: 8px;
      font-size: 18px; color: rgba(255,255,255,0.7);
    }
    .category-dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: #f5c842;
    }

    /* 헤드라인 */
    .headline {
      font-size: 52px; font-weight: 900;
      line-height: 1.25; margin: 0;
      color: #fff;
    }
    .headline em {
      font-style: normal; font-weight: 900;
      color: #f5c842;
    }
    .subtext {
      font-size: 22px; font-weight: 400;
      color: rgba(255,255,255,0.6); margin: 0;
    }

    /* 비교 카드 영역 */
    .compare-section { display: flex; flex-direction: column; gap: 12px; }
    .compare-header {
      display: flex; justify-content: space-between;
      align-items: center; padding: 0 8px;
    }
    .compare-label { font-size: 18px; color: rgba(255,255,255,0.5); }
    .compare-badge {
      font-size: 16px; font-weight: 700;
      color: #f5c842;
      display: flex; align-items: center; gap: 4px;
    }
    .compare-cards {
      display: flex; gap: 20px; align-items: stretch;
    }

    /* 개별 비교 카드 */
    .score-card {
      flex: 1; border-radius: 16px;
      padding: 32px 28px;
      display: flex; flex-direction: column;
      align-items: center; gap: 8px;
    }
    .score-card.before {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
    }
    .score-card.after {
      background: linear-gradient(135deg, rgba(100,60,180,0.4) 0%, rgba(180,60,120,0.3) 100%);
      border: 1px solid rgba(180,100,200,0.3);
    }
    .year-label {
      font-size: 18px; font-weight: 400;
      color: rgba(255,255,255,0.6);
    }
    .score {
      font-size: 72px; font-weight: 900;
      color: #fff; line-height: 1;
    }
    .score-desc {
      font-size: 18px; color: rgba(255,255,255,0.5);
    }
    .score-tag {
      display: inline-block;
      padding: 6px 16px; border-radius: 20px;
      font-size: 16px; font-weight: 700;
      margin-top: 8px;
    }
    .tag-pass {
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.6);
    }
    .tag-warning {
      background: rgba(245,200,66,0.2);
      color: #f5c842;
    }
    .arrow-between {
      display: flex; align-items: center;
      font-size: 28px; color: rgba(255,255,255,0.3);
      padding: 0 4px; align-self: center;
    }

    /* 커트라인 배지 */
    .cutline-badge {
      align-self: center;
      background: #f5c842; color: #1a1a5e;
      font-size: 20px; font-weight: 900;
      padding: 10px 28px; border-radius: 24px;
    }

    /* 하단 수치 2개 */
    .stats-row {
      display: flex; gap: 16px;
    }
    .stat-card {
      flex: 1;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 24px; text-align: center;
    }
    .stat-num {
      font-size: 44px; font-weight: 900;
      color: #f5c842; line-height: 1.1;
    }
    .stat-num .arrow-down { color: #f5c842; }
    .stat-label {
      font-size: 16px; color: rgba(255,255,255,0.5);
      margin-top: 8px; line-height: 1.4;
    }

    /* 인용구 */
    .quote-box {
      border-left: 4px solid #f5c842;
      padding: 20px 24px;
      background: rgba(255,255,255,0.04);
      border-radius: 0 8px 8px 0;
    }
    .quote-box p {
      font-size: 22px; font-weight: 700;
      line-height: 1.5; margin: 0;
      color: rgba(255,255,255,0.9);
    }
    .quote-box p strong {
      color: #fff; font-weight: 900;
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
  <div class="container">
    <div class="category">
      <div class="category-dot"></div>
      내신 시스템 변화 분석
    </div>

    <h1 class="headline">같은 점수,<br><em>다른 등급</em> — 무슨 일이<br>생긴 걸까?</h1>
    <p class="subtext">일반고 내신 1등급 취득 기준의 변화</p>

    <div class="compare-section">
      <div class="compare-header">
        <span class="compare-label">3년 전</span>
        <span class="compare-badge">&#9650; 기준 상승</span>
        <span class="compare-label">지금</span>
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
        <div class="stat-num"><span class="arrow-down">&darr;</span> 38%</div>
        <div class="stat-label">1등급 배출<br>3년간 감소율</div>
      </div>
    </div>

    <div class="quote-box">
      <p>상위권 학생도 <strong>이유를 모른 채 등급이 떨어집니다.</strong><br>내신 시스템이 바뀌었기 때문입니다.</p>
    </div>
  </div>

  <div class="brand-bar">올인원 수학학원</div>
</body>
</html>`;

writeFileSync(copyPath, JSON.stringify(data, null, 2), 'utf-8');
console.log('Card 2 redesigned + all highlights removed');
