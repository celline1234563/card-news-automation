import 'dotenv/config';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { loadConfig } from '../agents/config-loader.js';
import { renderCards } from '../agents/renderer.js';
import { appendFilePaths } from '../agents/notion-connector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const ACADEMY_KEY = 'toktok';
const OUTPUT_DIR = join(ROOT, 'output', '톡톡 잉글리쉬--톡톡3-4--50%가-골든타임-놓치는-시기-2026-03-20');

console.log('═══ 톡톡 3-4 카드 1,2,4,8,9 디자인 수정 ═══\n');

const copyData = JSON.parse(await readFile(join(OUTPUT_DIR, 'copy.json'), 'utf-8'));
const { academy, cssVariables } = await loadConfig(ACADEMY_KEY);
console.log(`  카드 ${copyData.cards.length}장 로드 완료`);

const logoPath = join(ROOT, 'config', 'logos', `${ACADEMY_KEY}.png`);
let logoDataUri = '';
if (existsSync(logoPath)) {
  const buf = await readFile(logoPath);
  logoDataUri = `data:image/png;base64,${buf.toString('base64')}`;
  console.log('  로고 로드 완료');
}

// ═══════════════════════════════════════
// 카드 1: 톡톡3-3 카드1 레퍼런스 스타일로 리디자인
// (target 아이콘 → alarm-clock, 좌측정렬, 밝은배경, 하이라이트)
// ═══════════════════════════════════════
const card1 = copyData.cards.find(c => c.number === 1);
console.log(`\n  [카드1] 리디자인 — 레퍼런스 스타일 적용`);

card1.generated_html = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<script src="https://unpkg.com/lucide@latest"></script>
<style>
    :root {
      --color-primary: #FF6B2B;
      --color-highlight: #FFD4B8;
      --color-text: #1A1A1A;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px; height: 1350px;
      font-family: 'Noto Sans KR', sans-serif;
      word-break: keep-all;
      color: var(--color-text);
      background-color: #F5F5F5;
      display: flex; flex-direction: column;
      position: relative;
    }

    .deco-icon {
      position: absolute; top: 60px; right: 40px;
      color: var(--color-primary); opacity: 0.15;
      transform: rotate(12deg);
    }

    .content {
      flex: 1; display: flex; flex-direction: column;
      justify-content: center;
      padding: 80px 80px 40px;
      position: relative; z-index: 1;
    }

    .subtext {
      font-size: 28px; font-weight: 700;
      color: #888; margin-bottom: 28px;
    }

    .headline {
      font-size: 72px; font-weight: 900;
      line-height: 1.25; max-width: 750px;
    }

    .headline em {
      font-style: normal; font-weight: 900;
      background: linear-gradient(to top, var(--color-highlight) 35%, transparent 35%);
      padding: 2px 6px; display: inline;
      box-decoration-break: clone; -webkit-box-decoration-break: clone;
    }

    .sub-desc {
      margin-top: 32px;
      font-size: 30px; font-weight: 700;
      color: #666; line-height: 1.5;
    }

    .swipe-hint {
      padding: 0 80px 32px;
      display: flex; align-items: center; gap: 8px;
      color: var(--color-primary); font-size: 22px; font-weight: 700; opacity: 0.7;
    }

    .card-sign {
      padding: 0 80px 48px;
      display: flex; align-items: center;
    }
    .card-sign img { height: 44px; object-fit: contain; opacity: 0.35; }
</style></head>
<body>
  <i data-lucide="alarm-clock" class="deco-icon" style="width:320px;height:320px;"></i>

  <div class="content">
    <p class="subtext">우리 아이는 괜찮을까요?</p>
    <h1 class="headline"><em>50%</em>가 놓치는<br>골든타임</h1>
    <p class="sub-desc">초등학생 절반이<br>이 시기를 놓치고 있습니다</p>
  </div>

  <div class="swipe-hint">
    밀어서 확인하기 <i data-lucide="chevrons-right" style="width:24px;height:24px;"></i>
  </div>

  <div class="card-sign">
    <img src="${logoDataUri}" alt="톡톡 잉글리쉬" />
  </div>
  <script>lucide.createIcons();</script>
</body></html>`;
console.log('  [카드1] 완료');

// ═══════════════════════════════════════
// 카드 2: 전체 폰트 크기 증가
// ═══════════════════════════════════════
const card2 = copyData.cards.find(c => c.number === 2);
console.log(`\n  [카드2] 폰트 크기 증가`);

card2.generated_html = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<script src="https://unpkg.com/lucide@latest"></script>
<style>
    :root {
      --color-primary: #FF6B2B;
      --color-background: #FFF8F5;
      --color-text: #1A1A1A;
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
      flex: 1; padding: 80px 72px 40px;
      display: flex; flex-direction: column; justify-content: center;
    }

    .headline {
      font-size: 76px; font-weight: 900; line-height: 1.2; margin-bottom: 24px;
    }
    .headline em { font-style: normal; font-weight: 900; color: var(--color-primary); }

    .subtext {
      font-size: 34px; font-weight: 700; color: #555; margin-bottom: 56px; line-height: 1.5;
    }

    .quote-bubble {
      background: white; border-radius: 20px; padding: 40px 44px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.06);
      display: flex; align-items: flex-start; gap: 20px;
    }
    .quote-bubble .icon { flex-shrink: 0; width: 44px; height: 44px; color: var(--color-primary); margin-top: 4px; }
    .quote-bubble p { font-size: 36px; font-weight: 700; line-height: 1.45; color: var(--color-text); }

    .card-sign {
      padding: 32px 72px 48px;
      display: flex; align-items: center; justify-content: center;
    }
    .card-sign img { height: 44px; object-fit: contain; opacity: 0.35; }
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

  <div class="card-sign">
    <img src="${logoDataUri}" alt="톡톡 잉글리쉬" />
  </div>
  <script>lucide.createIcons();</script>
</body></html>`;
console.log('  [카드2] 완료');

// ═══════════════════════════════════════
// 카드 4: 46.9% 색상 변경 (더 진한 색 + 배경 대비)
// ═══════════════════════════════════════
const card4 = copyData.cards.find(c => c.number === 4);
console.log(`\n  [카드4] 통계 숫자 색상 변경`);

card4.generated_html = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<style>
    :root {
      --color-primary: #FF6B2B;
      --color-accent: #E55A1B;
      --color-text: #1A1A1A;
      --color-highlight: #FFD4B8;
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

    .content {
      flex: 1; padding: 80px 72px 40px;
      display: flex; flex-direction: column; justify-content: center;
    }

    .source { font-size: 24px; font-weight: 700; color: #aaa; margin-bottom: 20px; letter-spacing: 1px; }

    .headline { font-size: 60px; font-weight: 900; line-height: 1.2; margin-bottom: 64px; }
    .headline em { font-style: normal; font-weight: 900; color: var(--color-primary); }

    .stat-box {
      background: var(--color-text); border-radius: 24px; padding: 56px;
      text-align: center;
    }
    .stat-number {
      font-size: 130px; font-weight: 900; color: var(--color-primary);
      line-height: 1; margin-bottom: 20px;
    }
    .stat-label { font-size: 34px; font-weight: 700; color: rgba(255,255,255,0.85); }

    .card-sign {
      padding: 32px 72px 48px;
      display: flex; align-items: center; justify-content: center;
    }
    .card-sign img { height: 44px; object-fit: contain; opacity: 0.35; }
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

  <div class="card-sign">
    <img src="${logoDataUri}" alt="톡톡 잉글리쉬" />
  </div>
</body></html>`;
console.log('  [카드4] 완료');

// ═══════════════════════════════════════
// 카드 8: 헤드라인 색상 변경 (배경과 구분)
// ═══════════════════════════════════════
const card8 = copyData.cards.find(c => c.number === 8);
console.log(`\n  [카드8] 헤드라인 색상 변경`);

card8.generated_html = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<script src="https://unpkg.com/lucide@latest"></script>
<style>
    :root {
      --color-primary: #FF6B2B;
      --color-text: #1A1A1A;
      --color-background: #FFF8F5;
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
      flex: 1; padding: 80px 72px 40px;
      display: flex; flex-direction: column; justify-content: center;
      align-items: center; text-align: center;
    }

    .badge {
      background: var(--color-primary); color: white;
      padding: 12px 32px; border-radius: 40px;
      font-size: 24px; font-weight: 700; margin-bottom: 32px;
    }

    .headline { font-size: 72px; font-weight: 900; line-height: 1.2; margin-bottom: 16px; }
    .headline em {
      font-style: normal; font-weight: 900;
      color: var(--color-text);
      background: linear-gradient(to top, #FFD4B8 35%, transparent 35%);
      padding: 2px 6px; display: inline;
      box-decoration-break: clone; -webkit-box-decoration-break: clone;
    }

    .subtext { font-size: 30px; font-weight: 700; color: #888; margin-bottom: 56px; }

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

    .card-sign {
      padding: 32px 72px 48px;
      display: flex; align-items: center; justify-content: center;
    }
    .card-sign img { height: 44px; object-fit: contain; opacity: 0.35; }
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

  <div class="card-sign">
    <img src="${logoDataUri}" alt="톡톡 잉글리쉬" />
  </div>
  <script>lucide.createIcons();</script>
</body></html>`;
console.log('  [카드8] 완료');

// ═══════════════════════════════════════
// 카드 9: 헤드라인 색상 변경 (배경과 구분)
// ═══════════════════════════════════════
const card9 = copyData.cards.find(c => c.number === 9);
console.log(`\n  [카드9] 헤드라인 색상 변경`);

card9.generated_html = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<script src="https://unpkg.com/lucide@latest"></script>
<style>
    :root {
      --color-primary: #FF6B2B;
      --color-text: #1A1A1A;
      --color-highlight: #FFD4B8;
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

    .content {
      flex: 1; padding: 80px 72px 40px;
      display: flex; flex-direction: column; justify-content: center;
    }

    .headline { font-size: 68px; font-weight: 900; line-height: 1.2; margin-bottom: 12px; }
    .headline em {
      font-style: normal; font-weight: 900;
      color: var(--color-text);
      background: linear-gradient(to top, var(--color-highlight) 35%, transparent 35%);
      padding: 2px 6px; display: inline;
      box-decoration-break: clone; -webkit-box-decoration-break: clone;
    }

    .subtext { font-size: 28px; font-weight: 700; color: #888; margin-bottom: 48px; }

    .summary-list { display: flex; flex-direction: column; gap: 16px; }
    .summary-item {
      display: flex; align-items: center; gap: 20px;
      background: white; border-radius: 16px; padding: 26px 28px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    }
    .item-num {
      width: 44px; height: 44px; border-radius: 50%;
      background: var(--color-primary); color: white;
      font-size: 22px; font-weight: 900;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .item-text { font-size: 30px; font-weight: 700; line-height: 1.35; }

    .card-sign {
      padding: 32px 72px 48px;
      display: flex; align-items: center; justify-content: center;
    }
    .card-sign img { height: 44px; object-fit: contain; opacity: 0.35; }
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

  <div class="card-sign">
    <img src="${logoDataUri}" alt="톡톡 잉글리쉬" />
  </div>
  <script>lucide.createIcons();</script>
</body></html>`;
console.log('  [카드9] 완료');

// ── 저장 + 렌더링 + 업로드 ──
await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('\n  copy.json 저장 완료');

console.log('\n── PNG 렌더링 ──');
const { htmlSources } = await renderCards(copyData.cards, cssVariables, academy.name, OUTPUT_DIR, ACADEMY_KEY);

console.log('\n── 노션 업로드 ──');
const NOTION_PAGE_ID = '31b6efb1-2186-80ae-b8e3-de33381cb9fb';
const pngPaths = copyData.cards.map((_, i) =>
  join(OUTPUT_DIR, `card-${String(i + 1).padStart(2, '0')}.png`)
);
await appendFilePaths(NOTION_PAGE_ID, pngPaths, '[톡톡3-4] 50%가 골든타임 놓치는 시기', academy.name, academy.drive_folder_id, htmlSources);
console.log(`  PNG ${pngPaths.length}장 노션 업로드 완료`);

await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('\n═══ 완료! ═══');
