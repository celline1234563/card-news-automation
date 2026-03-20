import 'dotenv/config';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { loadConfig } from '../agents/config-loader.js';
import { renderCards } from '../agents/renderer.js';
import { getByStatus, appendFilePaths } from '../agents/notion-connector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const ACADEMY_KEY = 'toktok';
const OUTPUT_DIR = join(ROOT, 'output', '톡톡 잉글리쉬--톡톡3-3--정규vs챌린지-2026-03-19');

console.log('═══ 톡톡 3-3 카드 2,3,6,7 디자인 수정 ═══\n');

// ── 데이터 로드 ──
const copyData = JSON.parse(await readFile(join(OUTPUT_DIR, 'copy.json'), 'utf-8'));
const { academy, cssVariables } = await loadConfig(ACADEMY_KEY);
console.log(`  카드 ${copyData.cards.length}장 로드, ${academy.name} 설정 완료`);

// ── 로고 data URI 준비 ──
const logoPath = join(ROOT, 'config', 'logos', `${ACADEMY_KEY}.png`);
let logoDataUri = '';
if (existsSync(logoPath)) {
  const buf = await readFile(logoPath);
  logoDataUri = `data:image/png;base64,${buf.toString('base64')}`;
  console.log('  로고 로드 완료');
}

// ═══════════════════════════════════════
// 카드 2: 배열 재배치 — 헤드라인 + 서브 불릿 + 인용 2개
// ═══════════════════════════════════════
const card2 = copyData.cards.find(c => c.number === 2);
console.log(`\n  [카드2] 원본: ${card2.type}, ${card2.layout_hint}`);

card2.generated_html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    :root {
      --color-primary: #FF6B2B;
      --color-secondary: #FFFFFF;
      --color-background: #FFF8F5;
      --color-text: #1A1A1A;
      --color-highlight: #FFD4B8;
      --color-accent: #E55A1B;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px; height: 1350px;
      font-family: 'Noto Sans KR', sans-serif;
      word-break: keep-all;
      color: var(--color-text);
      background-color: var(--color-background);
      display: flex; flex-direction: column;
    }

    .content {
      flex: 1;
      padding: 80px 72px 40px;
      display: flex; flex-direction: column;
      justify-content: center;
    }

    .headline {
      font-size: 72px;
      font-weight: 900;
      line-height: 1.2;
      margin-bottom: 36px;
    }
    .headline em {
      font-style: normal; font-weight: 900;
      color: var(--color-primary);
    }

    .sub-points {
      display: flex; flex-direction: column; gap: 14px;
      margin-bottom: 56px;
      padding-left: 8px;
    }
    .sub-point {
      font-size: 30px; font-weight: 700;
      color: #555;
      display: flex; align-items: center; gap: 12px;
      line-height: 1.4;
    }
    .sub-point .dash {
      color: var(--color-primary);
      font-weight: 900;
      font-size: 28px;
      flex-shrink: 0;
    }

    .quotes {
      display: flex; flex-direction: column; gap: 20px;
    }
    .quote-bubble {
      background: var(--color-secondary);
      border-radius: 20px;
      padding: 28px 36px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      display: flex; align-items: flex-start; gap: 16px;
    }
    .quote-bubble .icon {
      flex-shrink: 0;
      width: 36px; height: 36px;
      color: var(--color-primary);
      margin-top: 2px;
    }
    .quote-bubble p {
      font-size: 30px; font-weight: 700;
      line-height: 1.4;
      color: var(--color-text);
    }

    .card-sign {
      padding: 32px 72px 48px;
      display: flex; align-items: center;
    }
    .card-sign img {
      height: 44px; object-fit: contain; opacity: 0.35;
    }
  </style>
</head>
<body>
  <div class="content">
    <h1 class="headline">챌린지 수업,<br><em>먼저 인정합니다</em></h1>

    <div class="sub-points">
      <div class="sub-point">
        <span class="dash">—</span>
        <span>아이들의 사고를 확장시키고</span>
      </div>
      <div class="sub-point">
        <span class="dash">—</span>
        <span>실전 감각 끌어올리기 가장 좋은 수업</span>
      </div>
    </div>

    <div class="quotes">
      <div class="quote-bubble">
        <i data-lucide="message-circle" class="icon"></i>
        <p>"챌린지로 시작한 게 잘한 걸까요?<br>정규는 너무 부담스러워서..."</p>
      </div>
      <div class="quote-bubble">
        <i data-lucide="message-circle" class="icon"></i>
        <p>"챌린지만 들으면 되지 않을까?"</p>
      </div>
    </div>
  </div>

  <div class="card-sign">
    <img src="${logoDataUri}" alt="톡톡 잉글리쉬" />
  </div>
  <script>lucide.createIcons();</script>
</body>
</html>`;
console.log('  [카드2] HTML 재작성 완료');

// ═══════════════════════════════════════
// 카드 3: "같은 챌린지" 오렌지 색상 + 배경 아이콘 삭제 + 섹션 정렬
// ═══════════════════════════════════════
const card3 = copyData.cards.find(c => c.number === 3);
console.log(`\n  [카드3] 원본: ${card3.type}, ${card3.layout_hint}`);

card3.generated_html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    :root {
      --color-primary: #FF6B2B;
      --color-secondary: #FFFFFF;
      --color-background: #FFF8F5;
      --color-text: #1A1A1A;
      --color-highlight: #FFD4B8;
      --color-accent: #E55A1B;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px; height: 1350px;
      font-family: 'Noto Sans KR', sans-serif;
      word-break: keep-all;
      color: var(--color-text);
      background-color: var(--color-background);
      display: flex; flex-direction: column;
    }

    .content {
      flex: 1;
      padding: 80px 72px 40px;
      display: flex; flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    .headline {
      font-size: 72px;
      font-weight: 900;
      line-height: 1.2;
      margin-bottom: 16px;
    }
    .headline em {
      font-style: normal; font-weight: 900;
      color: var(--color-primary);
    }

    .subtext {
      font-size: 30px; font-weight: 700;
      color: #666; margin-bottom: 64px;
    }

    .items-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      width: 100%;
      max-width: 880px;
    }

    .item-card {
      background: var(--color-secondary);
      border-radius: 20px;
      padding: 32px 28px;
      display: flex; flex-direction: column;
      align-items: center;
      text-align: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }

    .item-icon {
      width: 52px; height: 52px;
      border-radius: 14px;
      background: var(--color-primary);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 20px;
    }
    .item-icon i {
      width: 28px; height: 28px;
      color: white;
    }

    .item-title {
      font-size: 32px; font-weight: 900;
      margin-bottom: 8px;
      color: var(--color-text);
    }
    .item-desc {
      font-size: 24px; font-weight: 700;
      color: #888;
    }

    .card-sign {
      padding: 32px 72px 48px;
      display: flex; align-items: center; justify-content: center;
    }
    .card-sign img {
      height: 44px; object-fit: contain; opacity: 0.35;
    }
  </style>
</head>
<body>
  <div class="content">
    <h1 class="headline">그런데 <em>같은 챌린지</em>인데</h1>
    <p class="subtext">왜 아이마다 성장 속도가 다를까요?</p>

    <div class="items-grid">
      <div class="item-card">
        <div class="item-icon"><i data-lucide="file-text"></i></div>
        <p class="item-title">관리 깊이</p>
        <p class="item-desc">챌린지는 객관식만</p>
      </div>
      <div class="item-card">
        <div class="item-icon"><i data-lucide="clock"></i></div>
        <p class="item-title">수업 방식</p>
        <p class="item-desc">정규는 실시간 참여</p>
      </div>
      <div class="item-card">
        <div class="item-icon"><i data-lucide="bar-chart-2"></i></div>
        <p class="item-title">평가 범위</p>
        <p class="item-desc">서술형의 결정적 차이</p>
      </div>
      <div class="item-card">
        <div class="item-icon"><i data-lucide="target"></i></div>
        <p class="item-title">학습 목적</p>
        <p class="item-desc">습관 vs 성적 경쟁</p>
      </div>
    </div>
  </div>

  <div class="card-sign">
    <img src="${logoDataUri}" alt="톡톡 잉글리쉬" />
  </div>
  <script>lucide.createIcons();</script>
</body>
</html>`;
console.log('  [카드3] HTML 재작성 완료');

// ═══════════════════════════════════════
// 카드 6: "챌린지 VS 정규" 폰트 색상 변경 + 배경 대비 개선
// ═══════════════════════════════════════
const card6 = copyData.cards.find(c => c.number === 6);
console.log(`\n  [카드6] 원본: ${card6.type}, ${card6.layout_hint}`);

card6.generated_html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    :root {
      --color-primary: #FF6B2B;
      --color-secondary: #FFFFFF;
      --color-background: #FFF8F5;
      --color-text: #1A1A1A;
      --color-highlight: #FFD4B8;
      --color-accent: #E55A1B;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px; height: 1350px;
      font-family: 'Noto Sans KR', sans-serif;
      word-break: keep-all;
      color: var(--color-text);
      background-color: #F5F5F5;
      display: flex; flex-direction: column;
    }

    .header {
      padding: 60px 60px 36px;
      text-align: center;
    }
    .subtext {
      font-size: 26px; font-weight: 700;
      color: #888; margin-bottom: 16px;
    }
    .headline {
      font-size: 80px; font-weight: 900;
      line-height: 1.15;
    }
    .headline .vs {
      color: var(--color-text);
      font-size: 64px;
    }
    .headline .challenge-text {
      color: var(--color-primary);
    }
    .headline .regular-text {
      color: var(--color-accent);
    }

    .compare-section {
      flex: 1;
      display: flex;
      margin: 0 48px;
      gap: 0;
      border-radius: 24px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }

    .column {
      flex: 1;
      padding: 48px 32px;
      display: flex; flex-direction: column;
    }
    .column.challenge {
      background: var(--color-secondary);
      border-radius: 24px 0 0 24px;
    }
    .column.regular {
      background: var(--color-text);
      color: white;
      border-radius: 0 24px 24px 0;
    }

    .column-title {
      font-size: 48px; font-weight: 900;
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid var(--color-highlight);
    }
    .column.regular .column-title {
      border-bottom-color: var(--color-primary);
      color: var(--color-primary);
    }

    .feature-list {
      list-style: none;
      flex: 1;
      display: flex; flex-direction: column;
      justify-content: space-evenly;
    }
    .feature-item {
      display: flex; align-items: center;
      gap: 14px;
      font-size: 28px; font-weight: 700;
      line-height: 1.35;
    }
    .feature-item i {
      width: 32px; height: 32px;
      flex-shrink: 0;
    }
    .column.challenge .feature-item i { color: var(--color-primary); }
    .column.regular .feature-item i { color: var(--color-primary); }

    .card-sign {
      padding: 32px 60px 48px;
      display: flex; align-items: center; justify-content: center;
    }
    .card-sign img {
      height: 44px; object-fit: contain; opacity: 0.35;
    }
  </style>
</head>
<body>
  <div class="header">
    <p class="subtext">학습 vs 활용, 수업 깊이가 다릅니다</p>
    <h1 class="headline">
      <span class="challenge-text">챌린지</span>
      <span class="vs">vs</span>
      <span class="regular-text">정규</span>, 핵심 차이
    </h1>
  </div>

  <div class="compare-section">
    <div class="column challenge">
      <div class="column-title">챌린지</div>
      <ul class="feature-list">
        <li class="feature-item"><i data-lucide="check-circle"></i><span>실시간 수업 참여 + 기본 관리</span></li>
        <li class="feature-item"><i data-lucide="check-circle"></i><span>객관식 + 주관식 평가</span></li>
        <li class="feature-item"><i data-lucide="check-circle"></i><span>과제 피드백 (1회)</span></li>
        <li class="feature-item"><i data-lucide="check-circle"></i><span>정기 평가 (분기별)</span></li>
        <li class="feature-item"><i data-lucide="check-circle"></i><span>기본 토론으로 표현력 강화</span></li>
      </ul>
    </div>
    <div class="column regular">
      <div class="column-title">정규</div>
      <ul class="feature-list">
        <li class="feature-item"><i data-lucide="check-circle"></i><span>실시간 수업 참여 + 체계적 관리</span></li>
        <li class="feature-item"><i data-lucide="check-circle"></i><span>객관식 + 주관식 + 서술형 + 에세이</span></li>
        <li class="feature-item"><i data-lucide="check-circle"></i><span>과제 피드백과 수정 완료까지</span></li>
        <li class="feature-item"><i data-lucide="check-circle"></i><span>월별 평가로 성장 데이터 자동 생성</span></li>
        <li class="feature-item"><i data-lucide="check-circle"></i><span>IB 기반 토론으로 사고력까지</span></li>
      </ul>
    </div>
  </div>

  <div class="card-sign">
    <img src="${logoDataUri}" alt="톡톡 잉글리쉬" />
  </div>
  <script>lucide.createIcons();</script>
</body>
</html>`;
console.log('  [카드6] HTML 재작성 완료');

// ═══════════════════════════════════════
// 카드 7: 줄바꿈 + 박스 내 폰트 크기 증가
// ═══════════════════════════════════════
const card7 = copyData.cards.find(c => c.number === 7);
console.log(`\n  [카드7] 원본: ${card7.type}, ${card7.layout_hint}`);

card7.generated_html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    :root {
      --color-primary: #FF6B2B;
      --color-secondary: #FFFFFF;
      --color-background: #FFF8F5;
      --color-text: #1A1A1A;
      --color-highlight: #FFD4B8;
      --color-accent: #E55A1B;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px; height: 1350px;
      font-family: 'Noto Sans KR', sans-serif;
      word-break: keep-all;
      color: white;
      background-color: var(--color-primary);
      display: flex; flex-direction: column;
      padding: 60px;
    }

    .header {
      text-align: center;
      margin-bottom: 48px;
    }
    .headline {
      font-size: 88px; font-weight: 900;
      line-height: 1.15;
      color: white;
      margin-bottom: 16px;
      text-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .headline em {
      font-style: normal; font-weight: 900;
      background: linear-gradient(to top, var(--color-highlight) 35%, transparent 35%);
      padding: 2px 6px;
      display: inline;
      box-decoration-break: clone;
      -webkit-box-decoration-break: clone;
    }
    .subtext {
      font-size: 30px; font-weight: 700;
      color: rgba(255,255,255,0.85);
    }

    .comparison {
      flex: 1;
      display: flex;
      gap: 28px;
    }

    .col {
      flex: 1;
      background: white;
      border-radius: 24px;
      padding: 40px 32px;
      color: var(--color-text);
      display: flex; flex-direction: column;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    }

    .col-title {
      font-size: 36px; font-weight: 900;
      text-align: center;
      padding-bottom: 20px;
      margin-bottom: 28px;
      border-bottom: 3px solid var(--color-highlight);
    }
    .col.regular .col-title {
      border-bottom-color: var(--color-accent);
    }

    .col-list {
      list-style: none;
      flex: 1;
      display: flex; flex-direction: column;
      justify-content: space-evenly;
    }
    .col-list li {
      display: flex; align-items: center;
      gap: 14px;
      font-size: 32px; font-weight: 700;
      line-height: 1.35;
    }
    .col-list li i {
      width: 32px; height: 32px;
      flex-shrink: 0;
      color: var(--color-primary);
    }
    .col.regular .col-list li i {
      color: var(--color-accent);
    }

    .quote-section {
      background: rgba(255,255,255,0.95);
      border-radius: 20px;
      padding: 28px 36px;
      margin-top: 36px;
      text-align: center;
      color: var(--color-text);
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .quote-section p {
      font-size: 28px; font-weight: 700;
      line-height: 1.4;
    }

    .card-sign {
      margin-top: 32px;
      display: flex; align-items: center; justify-content: center;
    }
    .card-sign img {
      height: 44px; object-fit: contain; opacity: 0.5;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="headline">기초 없이<br><em>응용만</em> 하면</h1>
    <p class="subtext">실력은 늘지 않습니다</p>
  </div>

  <div class="comparison">
    <div class="col challenge">
      <h3 class="col-title">챌린지 수업</h3>
      <ul class="col-list">
        <li><i data-lucide="check-circle"></i><span>가볍게 운영</span></li>
        <li><i data-lucide="check-circle"></i><span>객관식 중심</span></li>
        <li><i data-lucide="check-circle"></i><span>학습 부담 ↓</span></li>
        <li><i data-lucide="check-circle"></i><span>기본 개념 점검</span></li>
      </ul>
    </div>
    <div class="col regular">
      <h3 class="col-title">정규 수업</h3>
      <ul class="col-list">
        <li><i data-lucide="trophy"></i><span>실시간 참여</span></li>
        <li><i data-lucide="trophy"></i><span>서술형까지 포함</span></li>
        <li><i data-lucide="trophy"></i><span>체계적 관리</span></li>
        <li><i data-lucide="trophy"></i><span>성적을 만드는 구조</span></li>
      </ul>
    </div>
  </div>

  <div class="quote-section">
    <p>기초 사고체계 없이는 고차원적 사고로 진입할 수 없다.</p>
  </div>

  <div class="card-sign">
    <img src="${logoDataUri}" alt="톡톡 잉글리쉬" />
  </div>
  <script>lucide.createIcons();</script>
</body>
</html>`;
console.log('  [카드7] HTML 재작성 완료');

// ── copy.json 저장 ──
await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('\n  copy.json 저장 완료');

// ── PNG 렌더링 ──
console.log('\n── PNG 렌더링 ──');
const { htmlSources } = await renderCards(copyData.cards, cssVariables, academy.name, OUTPUT_DIR, ACADEMY_KEY);

// ── 노션 업로드 ──
console.log('\n── 노션 업로드 ──');
const searchStatuses = ['디자인 수정', '디자인 1차', '제작 요청', '기획 컨펌', '기획컨펌대기', '원고작업'];
let targetPage = null;

for (const status of searchStatuses) {
  try {
    const pages = await getByStatus(status);
    const found = pages.find(p =>
      p.title.includes('톡톡3-3') || p.title.includes('톡톡 3-3')
    );
    if (found) { targetPage = found; break; }
  } catch (err) { /* skip */ }
}

if (targetPage) {
  const pngPaths = copyData.cards.map((_, i) =>
    join(OUTPUT_DIR, `card-${String(i + 1).padStart(2, '0')}.png`)
  );
  await appendFilePaths(targetPage.id, pngPaths, targetPage.title, academy.name, academy.drive_folder_id, htmlSources);
  console.log(`  PNG ${pngPaths.length}장 노션 업로드 완료`);
} else {
  console.log('  톡톡 3-3 노션 페이지를 찾을 수 없음');
}

await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('\n═══ 완료! ═══');
