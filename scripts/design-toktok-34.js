import 'dotenv/config';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { loadConfig } from '../agents/config-loader.js';
import { renderCards } from '../agents/renderer.js';
import { getByStatus, appendFilePaths } from '../agents/notion-connector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const ACADEMY_KEY = 'toktok';
const OUTPUT_DIR = join(ROOT, 'output', '톡톡 잉글리쉬--톡톡3-4--50%가-골든타임-놓치는-시기-2026-03-20');

console.log('═══ 톡톡 3-4 전체 디자인 생성 ═══\n');

// ── 출력 폴더 생성 ──
if (!existsSync(OUTPUT_DIR)) await mkdir(OUTPUT_DIR, { recursive: true });

// ── 설정 로드 ──
const { academy, cssVariables } = await loadConfig(ACADEMY_KEY);
console.log(`  ${academy.name} 설정 완료`);

// ── 로고 data URI 준비 ──
const logoPath = join(ROOT, 'config', 'logos', `${ACADEMY_KEY}.png`);
let logoDataUri = '';
if (existsSync(logoPath)) {
  const buf = await readFile(logoPath);
  logoDataUri = `data:image/png;base64,${buf.toString('base64')}`;
  console.log('  로고 로드 완료');
}

// ── CSS 공통 변수 블록 ──
const cssVars = `
    :root {
      --color-primary: #FF6B2B;
      --color-secondary: #FFFFFF;
      --color-background: #FFF8F5;
      --color-text: #1A1A1A;
      --color-highlight: #FFD4B8;
      --color-accent: #E55A1B;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
`;

const bodyBase = `
      width: 1080px; height: 1350px;
      font-family: 'Noto Sans KR', sans-serif;
      word-break: keep-all;
`;

const logoBlock = `
  <div class="card-sign">
    <img src="${logoDataUri}" alt="톡톡 잉글리쉬" />
  </div>`;

const logoStyle = `
    .card-sign {
      padding: 32px 72px 48px;
      display: flex; align-items: center; justify-content: center;
    }
    .card-sign img { height: 44px; object-fit: contain; opacity: 0.35; }
`;

// ═══════════════════════════════════════
// 10장 카드 데이터 + HTML 생성
// ═══════════════════════════════════════
const copyData = {
  topic: "50%가 골든타임 놓치는 시기",
  research_summary: "초등 4학년에 학습부진 46.9% 시작. 10세 전후 뇌 발달 골든타임. 영어+사고력 통합 교육의 중요성.",
  cards: []
};

// ── 카드 1: hook ──
copyData.cards.push({
  number: 1, type: "hook", layout_hint: "big-quote",
  headline: "<em>50%</em>가 놓치는 골든타임",
  subtext: "초등학생 절반이 이 시기를 놓치고 있습니다\n우리 아이는 괜찮을까요?",
  emphasis_style: "highlight", icon: "alarm-clock",
  image_category: null, image_url: null, bg_image_url: null,
  generated_html: `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<script src="https://unpkg.com/lucide@latest"></script>
<style>${cssVars}
    body { ${bodyBase}
      color: var(--color-text); background-color: #F5F5F5;
      display: flex; flex-direction: column; position: relative;
    }
    .deco-icon {
      position: absolute; top: 60px; right: 50px;
      color: var(--color-primary); opacity: 0.12;
      transform: rotate(-10deg);
    }
    .content {
      flex: 1; display: flex; flex-direction: column;
      justify-content: center; padding: 80px 80px 40px;
      position: relative; z-index: 1;
    }
    .subtext { font-size: 28px; font-weight: 700; color: #888; margin-bottom: 24px; }
    .headline {
      font-size: 76px; font-weight: 900; line-height: 1.2;
      max-width: 800px;
    }
    .headline em {
      font-style: normal; font-weight: 900;
      background: linear-gradient(to top, var(--color-highlight) 35%, transparent 35%);
      padding: 2px 6px; display: inline;
      box-decoration-break: clone; -webkit-box-decoration-break: clone;
    }
    .swipe-hint {
      padding: 0 80px 32px;
      display: flex; align-items: center; gap: 8px;
      color: var(--color-primary); font-size: 22px; font-weight: 700; opacity: 0.7;
    }
    ${logoStyle}
</style></head>
<body>
  <i data-lucide="alarm-clock" class="deco-icon" style="width:300px;height:300px;"></i>
  <div class="content">
    <p class="subtext">초등학생 절반이 이 시기를 놓치고 있습니다</p>
    <h1 class="headline"><em>50%</em>가 놓치는<br>골든타임</h1>
  </div>
  <div class="swipe-hint">밀어서 확인하기 <i data-lucide="chevrons-right" style="width:24px;height:24px;"></i></div>
  ${logoBlock}
  <script>lucide.createIcons();</script>
</body></html>`,
  layout_used: "big-quote"
});

// ── 카드 2: problem ──
copyData.cards.push({
  number: 2, type: "problem", layout_hint: "big-quote",
  headline: "학부모들이 <em>가장 많이</em> 하는 말",
  subtext: "4학년까지는 괜찮았는데 5학년 되니까 갑자기...",
  emphasis_style: "color", icon: "message-circle",
  image_category: null, image_url: null, bg_image_url: null,
  generated_html: `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<script src="https://unpkg.com/lucide@latest"></script>
<style>${cssVars}
    body { ${bodyBase}
      color: var(--color-text); background-color: var(--color-background);
      display: flex; flex-direction: column;
    }
    .content {
      flex: 1; padding: 80px 72px 40px;
      display: flex; flex-direction: column; justify-content: center;
    }
    .headline {
      font-size: 68px; font-weight: 900; line-height: 1.2; margin-bottom: 20px;
    }
    .headline em { font-style: normal; font-weight: 900; color: var(--color-primary); }
    .subtext {
      font-size: 30px; font-weight: 700; color: #666; margin-bottom: 56px; line-height: 1.5;
    }
    .quote-bubble {
      background: white; border-radius: 20px; padding: 36px 40px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.06);
      display: flex; align-items: flex-start; gap: 16px;
    }
    .quote-bubble .icon { flex-shrink: 0; width: 40px; height: 40px; color: var(--color-primary); margin-top: 4px; }
    .quote-bubble p { font-size: 32px; font-weight: 700; line-height: 1.45; color: var(--color-text); }
    ${logoStyle}
</style></head>
<body>
  <div class="content">
    <h1 class="headline">학부모들이<br><em>가장 많이</em> 하는 말</h1>
    <p class="subtext">무슨 일이 일어난 걸까요?</p>
    <div class="quote-bubble">
      <i data-lucide="message-circle" class="icon"></i>
      <p>"4학년까지는 다 잘했는데<br>5학년 되니까 성적이 자꾸..."</p>
    </div>
  </div>
  ${logoBlock}
  <script>lucide.createIcons();</script>
</body></html>`,
  layout_used: "big-quote"
});

// ── 카드 3: problem (icon-grid) ──
copyData.cards.push({
  number: 3, type: "problem", layout_hint: "icon-grid",
  headline: "<em>4학년</em>부터 달라지는 것들",
  subtext: "준비 없이 맞이하는 학습 좌절감",
  emphasis_style: "color", icon: "alert-triangle",
  image_category: null, image_url: null, bg_image_url: null,
  generated_html: `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<script src="https://unpkg.com/lucide@latest"></script>
<style>${cssVars}
    body { ${bodyBase}
      color: var(--color-text); background-color: var(--color-background);
      display: flex; flex-direction: column;
    }
    .content {
      flex: 1; padding: 80px 72px 40px;
      display: flex; flex-direction: column; justify-content: center; align-items: center;
      text-align: center;
    }
    .headline { font-size: 68px; font-weight: 900; line-height: 1.2; margin-bottom: 16px; }
    .headline em { font-style: normal; font-weight: 900; color: var(--color-primary); }
    .subtext { font-size: 28px; font-weight: 700; color: #888; margin-bottom: 56px; }
    .grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
      width: 100%; max-width: 880px;
    }
    .grid-item {
      background: white; border-radius: 20px; padding: 36px 28px;
      display: flex; flex-direction: column; align-items: center;
      text-align: center; box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .grid-icon {
      width: 56px; height: 56px; border-radius: 16px;
      background: var(--color-primary);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 20px;
    }
    .grid-icon i { width: 30px; height: 30px; color: white; }
    .grid-title { font-size: 32px; font-weight: 900; margin-bottom: 8px; }
    ${logoStyle}
</style></head>
<body>
  <div class="content">
    <h1 class="headline"><em>4학년</em>부터 달라지는 것들</h1>
    <p class="subtext">준비 없이 맞이하는 학습 좌절감</p>
    <div class="grid">
      <div class="grid-item">
        <div class="grid-icon"><i data-lucide="layers"></i></div>
        <p class="grid-title">과목 수 증가</p>
      </div>
      <div class="grid-item">
        <div class="grid-icon"><i data-lucide="book-open"></i></div>
        <p class="grid-title">수업량 폭증</p>
      </div>
      <div class="grid-item">
        <div class="grid-icon"><i data-lucide="trending-down"></i></div>
        <p class="grid-title">학습부진 시작</p>
      </div>
      <div class="grid-item">
        <div class="grid-icon"><i data-lucide="brain"></i></div>
        <p class="grid-title">사고력 완성기</p>
      </div>
    </div>
  </div>
  ${logoBlock}
  <script>lucide.createIcons();</script>
</body></html>`,
  layout_used: "icon-grid"
});

// ── 카드 4: data (stat-highlight) ──
copyData.cards.push({
  number: 4, type: "data", layout_hint: "stat-highlight",
  headline: "학습부진이 <em>시작되는</em> 시기",
  subtext: "한국교육과정평가원 조사",
  stat: "46.9%", stat_label: "초등 4학년에 학습부진 시작",
  emphasis_style: "color", icon: "bar-chart-2",
  image_category: null, image_url: null, bg_image_url: null,
  generated_html: `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<style>${cssVars}
    body { ${bodyBase}
      color: var(--color-text); background-color: #F5F5F5;
      display: flex; flex-direction: column;
    }
    .content {
      flex: 1; padding: 80px 72px 40px;
      display: flex; flex-direction: column; justify-content: center;
    }
    .source { font-size: 22px; font-weight: 700; color: #aaa; margin-bottom: 20px; letter-spacing: 1px; }
    .headline { font-size: 56px; font-weight: 900; line-height: 1.2; margin-bottom: 64px; }
    .headline em { font-style: normal; font-weight: 900; color: var(--color-primary); }
    .stat-box {
      background: white; border-radius: 24px; padding: 48px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06); text-align: center;
    }
    .stat-number {
      font-size: 120px; font-weight: 900; color: var(--color-accent);
      line-height: 1;  margin-bottom: 16px;
    }
    .stat-label { font-size: 32px; font-weight: 700; color: #555; }
    ${logoStyle}
</style></head>
<body>
  <div class="content">
    <p class="source">한국교육과정평가원</p>
    <h1 class="headline">학습부진이<br><em>시작되는</em> 시기</h1>
    <div class="stat-box">
      <p class="stat-number">46.9%</p>
      <p class="stat-label">초등 4학년에 학습부진 시작</p>
    </div>
  </div>
  ${logoBlock}
</body></html>`,
  layout_used: "stat-highlight"
});

// ── 카드 5: insight (step) ──
copyData.cards.push({
  number: 5, type: "insight", layout_hint: "step",
  headline: "골든타임을 <em>놓치는</em> 이유",
  subtext: "잘못된 방법을 사용합니다",
  emphasis_style: "color", icon: "alert-circle",
  image_category: null, image_url: null, bg_image_url: null,
  generated_html: `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<script src="https://unpkg.com/lucide@latest"></script>
<style>${cssVars}
    body { ${bodyBase}
      color: var(--color-text); background-color: var(--color-background);
      display: flex; flex-direction: column;
    }
    .content {
      flex: 1; padding: 80px 72px 40px;
      display: flex; flex-direction: column; justify-content: center;
    }
    .headline { font-size: 64px; font-weight: 900; line-height: 1.2; margin-bottom: 16px; }
    .headline em { font-style: normal; font-weight: 900; color: var(--color-primary); }
    .subtext { font-size: 28px; font-weight: 700; color: #888; margin-bottom: 56px; }
    .steps { display: flex; flex-direction: column; gap: 20px; }
    .step {
      display: flex; align-items: center; gap: 20px;
      background: white; border-radius: 16px; padding: 28px 32px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    }
    .step-num {
      width: 48px; height: 48px; border-radius: 50%;
      background: var(--color-primary); color: white;
      font-size: 24px; font-weight: 900;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .step-text { font-size: 30px; font-weight: 700; }
    .step-arrow {
      text-align: center; color: var(--color-primary);
      font-size: 28px; font-weight: 900; padding: 4px 0;
    }
    ${logoStyle}
</style></head>
<body>
  <div class="content">
    <h1 class="headline">골든타임을<br><em>놓치는</em> 이유</h1>
    <p class="subtext">잘못된 방법을 사용합니다</p>
    <div class="steps">
      <div class="step"><span class="step-num">1</span><span class="step-text">뇌 발달 시기를 무시</span></div>
      <div class="step-arrow">↓</div>
      <div class="step"><span class="step-num">2</span><span class="step-text">단순 암기 위주 학습</span></div>
      <div class="step-arrow">↓</div>
      <div class="step"><span class="step-num">3</span><span class="step-text">무리한 선행 중심</span></div>
      <div class="step-arrow">↓</div>
      <div class="step"><span class="step-num">4</span><span class="step-text">습관 형성에 무관심</span></div>
    </div>
  </div>
  ${logoBlock}
  <script>lucide.createIcons();</script>
</body></html>`,
  layout_used: "step"
});

// ── 카드 6: solution (list) ──
copyData.cards.push({
  number: 6, type: "solution", layout_hint: "list",
  headline: "골든타임을 <em>잡는 방법</em>",
  subtext: "올바른 학습법으로 지금 시작하세요",
  emphasis_style: "color", icon: "check-circle",
  image_category: null, image_url: null, bg_image_url: null,
  generated_html: `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<script src="https://unpkg.com/lucide@latest"></script>
<style>${cssVars}
    body { ${bodyBase}
      color: white; background-color: var(--color-primary);
      display: flex; flex-direction: column; padding: 60px;
    }
    .content {
      flex: 1; display: flex; flex-direction: column; justify-content: center;
    }
    .headline { font-size: 64px; font-weight: 900; line-height: 1.2; margin-bottom: 12px; }
    .headline em { font-style: normal; font-weight: 900;
      background: linear-gradient(to top, var(--color-highlight) 35%, transparent 35%);
      padding: 2px 6px; display: inline;
      box-decoration-break: clone; -webkit-box-decoration-break: clone;
      color: white;
    }
    .subtext { font-size: 28px; font-weight: 700; color: rgba(255,255,255,0.8); margin-bottom: 48px; }
    .list { display: flex; flex-direction: column; gap: 18px; }
    .list-item {
      display: flex; align-items: center; gap: 18px;
      background: rgba(255,255,255,0.95); border-radius: 16px; padding: 24px 28px;
      color: var(--color-text); box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }
    .list-item i { width: 32px; height: 32px; color: var(--color-primary); flex-shrink: 0; }
    .list-item span { font-size: 28px; font-weight: 700; line-height: 1.35; }
    .card-sign {
      margin-top: 32px;
      display: flex; align-items: center; justify-content: center;
    }
    .card-sign img { height: 44px; object-fit: contain; opacity: 0.5; }
</style></head>
<body>
  <div class="content">
    <h1 class="headline">골든타임을<br><em>잡는 방법</em></h1>
    <p class="subtext">올바른 학습법으로 지금 시작하세요</p>
    <div class="list">
      <div class="list-item"><i data-lucide="book-open"></i><span>영어+사고력을 함께 키우는 통합 커리큘럼</span></div>
      <div class="list-item"><i data-lucide="glasses"></i><span>원서 리딩으로 논리적 사고 훈련</span></div>
      <div class="list-item"><i data-lucide="mic"></i><span>토론·발표로 표현력 완성</span></div>
      <div class="list-item"><i data-lucide="user-check"></i><span>1:1 피드백으로 개별 맞춤 관리</span></div>
      <div class="list-item"><i data-lucide="repeat"></i><span>루틴랩으로 자기주도 습관 형성</span></div>
    </div>
  </div>
  ${logoBlock.replace('opacity: 0.35', 'opacity: 0.5')}
  <script>lucide.createIcons();</script>
</body></html>`,
  layout_used: "list"
});

// ── 카드 7: solution (compare) ──
copyData.cards.push({
  number: 7, type: "solution", layout_hint: "compare",
  headline: "같은 시간,<br><em>다른 결과</em>",
  subtext: "톡톡만의 차별화된 영어+사고력 교육",
  emphasis_style: "color", icon: "git-compare",
  image_category: null, image_url: null, bg_image_url: null,
  generated_html: `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<script src="https://unpkg.com/lucide@latest"></script>
<style>${cssVars}
    body { ${bodyBase}
      color: var(--color-text); background-color: #F5F5F5;
      display: flex; flex-direction: column;
    }
    .header { padding: 60px 60px 36px; text-align: center; }
    .subtext { font-size: 26px; font-weight: 700; color: #888; margin-bottom: 16px; }
    .headline { font-size: 72px; font-weight: 900; line-height: 1.15; }
    .headline em { font-style: normal; font-weight: 900; color: var(--color-primary); }
    .compare {
      flex: 1; display: flex; margin: 0 48px; gap: 0;
      border-radius: 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .col { flex: 1; padding: 48px 32px; display: flex; flex-direction: column; }
    .col.before { background: white; border-radius: 24px 0 0 24px; }
    .col.after { background: var(--color-text); color: white; border-radius: 0 24px 24px 0; }
    .col-title {
      font-size: 40px; font-weight: 900; text-align: center;
      margin-bottom: 40px; padding-bottom: 20px;
      border-bottom: 3px solid var(--color-highlight);
    }
    .col.after .col-title { border-bottom-color: var(--color-primary); color: var(--color-primary); }
    .items { list-style: none; flex: 1; display: flex; flex-direction: column; justify-content: space-evenly; }
    .items li {
      display: flex; align-items: center; gap: 14px;
      font-size: 30px; font-weight: 700; line-height: 1.35;
    }
    .items li i { width: 32px; height: 32px; flex-shrink: 0; }
    .col.before .items li i { color: #ccc; }
    .col.after .items li i { color: var(--color-primary); }
    ${logoStyle}
</style></head>
<body>
  <div class="header">
    <p class="subtext">톡톡만의 차별화된 영어+사고력 교육</p>
    <h1 class="headline">같은 시간, <em>다른 결과</em></h1>
  </div>
  <div class="compare">
    <div class="col before">
      <div class="col-title">일반 학원</div>
      <ul class="items">
        <li><i data-lucide="x-circle"></i><span>단순 암기 반복</span></li>
        <li><i data-lucide="x-circle"></i><span>문법 위주 수업</span></li>
        <li><i data-lucide="x-circle"></i><span>일방적 강의</span></li>
        <li><i data-lucide="x-circle"></i><span>성적표만 전달</span></li>
      </ul>
    </div>
    <div class="col after">
      <div class="col-title">톡톡 잉글리쉬</div>
      <ul class="items">
        <li><i data-lucide="check-circle"></i><span>사고력 기반 통합 교육</span></li>
        <li><i data-lucide="check-circle"></i><span>원서·토론·에세이</span></li>
        <li><i data-lucide="check-circle"></i><span>IB 기반 양방향 수업</span></li>
        <li><i data-lucide="check-circle"></i><span>성장 데이터 관리</span></li>
      </ul>
    </div>
  </div>
  ${logoBlock}
  <script>lucide.createIcons();</script>
</body></html>`,
  layout_used: "compare"
});

// ── 카드 8: example (icon-grid) ──
copyData.cards.push({
  number: 8, type: "example", layout_hint: "icon-grid",
  headline: "<em>31명 전원</em> 수상의 비밀",
  subtext: "2025 영어말하기대회 수상률 100%",
  emphasis_style: "color", icon: "trophy",
  image_category: null, image_url: null, bg_image_url: null,
  generated_html: `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<script src="https://unpkg.com/lucide@latest"></script>
<style>${cssVars}
    body { ${bodyBase}
      color: var(--color-text); background-color: var(--color-background);
      display: flex; flex-direction: column;
    }
    .content {
      flex: 1; padding: 80px 72px 40px;
      display: flex; flex-direction: column; justify-content: center;
      align-items: center; text-align: center;
    }
    .badge {
      background: var(--color-primary); color: white;
      padding: 10px 28px; border-radius: 40px;
      font-size: 22px; font-weight: 700; margin-bottom: 28px;
    }
    .headline { font-size: 68px; font-weight: 900; line-height: 1.2; margin-bottom: 16px; }
    .headline em { font-style: normal; font-weight: 900; color: var(--color-primary); }
    .subtext { font-size: 28px; font-weight: 700; color: #888; margin-bottom: 56px; }
    .grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
      width: 100%; max-width: 880px;
    }
    .grid-item {
      background: white; border-radius: 20px; padding: 36px 28px;
      display: flex; flex-direction: column; align-items: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .grid-icon {
      width: 56px; height: 56px; border-radius: 16px;
      background: var(--color-primary);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 20px;
    }
    .grid-icon i { width: 30px; height: 30px; color: white; }
    .grid-title { font-size: 32px; font-weight: 900; }
    ${logoStyle}
</style></head>
<body>
  <div class="content">
    <div class="badge">2025 영어말하기대회</div>
    <h1 class="headline"><em>31명 전원</em><br>수상의 비밀</h1>
    <p class="subtext">이것이 톡톡의 실력입니다</p>
    <div class="grid">
      <div class="grid-item">
        <div class="grid-icon"><i data-lucide="trophy"></i></div>
        <p class="grid-title">100% 수상</p>
      </div>
      <div class="grid-item">
        <div class="grid-icon"><i data-lucide="graduation-cap"></i></div>
        <p class="grid-title">IB 수업</p>
      </div>
      <div class="grid-item">
        <div class="grid-icon"><i data-lucide="shield-check"></i></div>
        <p class="grid-title">실력 검증</p>
      </div>
      <div class="grid-item">
        <div class="grid-icon"><i data-lucide="sparkles"></i></div>
        <p class="grid-title">자신감</p>
      </div>
    </div>
  </div>
  ${logoBlock}
  <script>lucide.createIcons();</script>
</body></html>`,
  layout_used: "icon-grid"
});

// ── 카드 9: summary (list) ──
copyData.cards.push({
  number: 9, type: "summary", layout_hint: "list",
  headline: "골든타임 <em>핵심 정리</em>",
  subtext: "지금이 마지막 기회입니다",
  emphasis_style: "color", icon: "clipboard-list",
  image_category: null, image_url: null, bg_image_url: null,
  generated_html: `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<script src="https://unpkg.com/lucide@latest"></script>
<style>${cssVars}
    body { ${bodyBase}
      color: var(--color-text); background-color: #F5F5F5;
      display: flex; flex-direction: column;
    }
    .content {
      flex: 1; padding: 80px 72px 40px;
      display: flex; flex-direction: column; justify-content: center;
    }
    .headline { font-size: 64px; font-weight: 900; line-height: 1.2; margin-bottom: 12px; }
    .headline em { font-style: normal; font-weight: 900; color: var(--color-primary); }
    .subtext { font-size: 28px; font-weight: 700; color: #888; margin-bottom: 48px; }
    .summary-list { display: flex; flex-direction: column; gap: 16px; }
    .summary-item {
      display: flex; align-items: center; gap: 20px;
      background: white; border-radius: 16px; padding: 24px 28px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    }
    .item-num {
      width: 44px; height: 44px; border-radius: 50%;
      background: var(--color-primary); color: white;
      font-size: 22px; font-weight: 900;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .item-text { font-size: 28px; font-weight: 700; line-height: 1.35; }
    ${logoStyle}
</style></head>
<body>
  <div class="content">
    <h1 class="headline">골든타임<br><em>핵심 정리</em></h1>
    <p class="subtext">지금이 마지막 기회입니다</p>
    <div class="summary-list">
      <div class="summary-item"><span class="item-num">1</span><span class="item-text">4학년부터 학습부진 46.9% 시작</span></div>
      <div class="summary-item"><span class="item-num">2</span><span class="item-text">10세 뇌발달 골든타임 활용 필수</span></div>
      <div class="summary-item"><span class="item-num">3</span><span class="item-text">영어+사고력 통합 교육이 답</span></div>
      <div class="summary-item"><span class="item-num">4</span><span class="item-text">루틴랩으로 자기주도 습관 완성</span></div>
      <div class="summary-item"><span class="item-num">5</span><span class="item-text">검증된 수상 실적의 톡톡 시스템</span></div>
    </div>
  </div>
  ${logoBlock}
  <script>lucide.createIcons();</script>
</body></html>`,
  layout_used: "list"
});

// ── 카드 10: cta ──
copyData.cards.push({
  number: 10, type: "cta", layout_hint: "minimal",
  headline: "톡톡 잉글리쉬에서 <em>시작하세요</em>",
  subtext: "골든타임은 지금입니다",
  emphasis_style: "color", icon: "phone",
  image_category: null, image_url: null, bg_image_url: null,
  generated_html: `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<script src="https://unpkg.com/lucide@latest"></script>
<style>${cssVars}
    body { ${bodyBase}
      color: white; background-color: var(--color-primary);
      display: flex; flex-direction: column;
      justify-content: center; align-items: center;
      text-align: center; padding: 80px;
    }
    .logo-area { margin-bottom: 48px; }
    .logo-area img { height: 72px; object-fit: contain; }
    .headline { font-size: 64px; font-weight: 900; line-height: 1.25; margin-bottom: 20px; }
    .headline em {
      font-style: normal; font-weight: 900;
      background: linear-gradient(to top, var(--color-highlight) 35%, transparent 35%);
      padding: 2px 6px; display: inline;
      box-decoration-break: clone; -webkit-box-decoration-break: clone;
    }
    .subtext { font-size: 32px; font-weight: 700; color: rgba(255,255,255,0.85); margin-bottom: 56px; }
    .cta-btn {
      display: inline-flex; align-items: center; gap: 12px;
      background: white; color: var(--color-primary);
      padding: 24px 56px; border-radius: 60px;
      font-size: 32px; font-weight: 900;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
    }
    .cta-btn i { width: 32px; height: 32px; }
    .bottom-text {
      margin-top: 48px; font-size: 24px; font-weight: 700;
      color: rgba(255,255,255,0.7);
    }
</style></head>
<body>
  <div class="logo-area">
    <img src="${logoDataUri}" alt="톡톡 잉글리쉬" style="opacity:0.9;" />
  </div>
  <h1 class="headline">톡톡 잉글리쉬에서<br><em>시작하세요</em></h1>
  <p class="subtext">골든타임은 지금입니다</p>
  <div class="cta-btn">
    <i data-lucide="phone"></i>
    <span>무료 상담 신청하기</span>
  </div>
  <p class="bottom-text">무료 상담으로 우리 아이 진단부터 시작하세요</p>
  <script>lucide.createIcons();</script>
</body></html>`,
  layout_used: "minimal"
});

console.log(`  카드 ${copyData.cards.length}장 HTML 생성 완료\n`);

// ── copy.json 저장 ──
await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('  copy.json 저장 완료\n');

// ── PNG 렌더링 ──
console.log('── PNG 렌더링 ──');
const { htmlSources } = await renderCards(copyData.cards, cssVariables, academy.name, OUTPUT_DIR, ACADEMY_KEY);

// ── 노션 업로드 ──
console.log('\n── 노션 업로드 ──');
const NOTION_PAGE_ID = '31b6efb1-2186-80ae-b8e3-de33381cb9fb';
const pngPaths = copyData.cards.map((_, i) =>
  join(OUTPUT_DIR, `card-${String(i + 1).padStart(2, '0')}.png`)
);
await appendFilePaths(NOTION_PAGE_ID, pngPaths, '[톡톡3-4] 50%가 골든타임 놓치는 시기', academy.name, academy.drive_folder_id, htmlSources);
console.log(`  PNG ${pngPaths.length}장 노션 업로드 완료`);

await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('\n═══ 완료! ═══');
