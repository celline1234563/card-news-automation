import 'dotenv/config';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { loadConfig } from '../agents/config-loader.js';
import { renderCards } from '../agents/renderer.js';
import { getByStatus, appendFilePaths } from '../agents/notion-connector.js';
import { findImageByName } from '../agents/image-picker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const ACADEMY_KEY = 'toktok';
const OUTPUT_DIR = join(ROOT, 'output', '톡톡 잉글리쉬--톡톡3-2--해외-및-국제학교-합격생들에게-꼭-있는-필수-요소--루틴랩-2026-03-12');

console.log('═══ 톡톡 3-2 카드 6, 8, 10 수정 ═══\n');

const copyData = JSON.parse(await readFile(join(OUTPUT_DIR, 'copy.json'), 'utf-8'));
const { academy, cssVariables } = await loadConfig(ACADEMY_KEY);

// 로고 data URI
const logoPath = join(ROOT, 'config', 'logos', `${ACADEMY_KEY}.png`);
const logoBuf = await readFile(logoPath);
const logoDataUri = `data:image/png;base64,${logoBuf.toString('base64')}`;
console.log('  로고 로드 완료');

// 대회수상 이미지 URL
const result = await findImageByName('대회수상', ACADEMY_KEY);
const contestImageUrl = result?.url || '';
console.log(`  대회수상 이미지: ${contestImageUrl ? 'OK' : '없음'}`);

// 공통 CSS 변수
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
    body {
      width: 1080px; height: 1350px; overflow: hidden;
      font-family: 'Noto Sans KR', sans-serif;
      word-break: keep-all; color: var(--color-text);
      background-color: var(--color-background);
    }
    section.card {
      display: flex; flex-direction: column;
      justify-content: space-between;
      padding: 48px 60px 36px;
    }
    .card-content { flex: 1; display: flex; flex-direction: column; }
    .card-sign {
      margin-top: 24px; display: flex; align-items: center;
      flex-shrink: 0;
    }
    .card-sign img { height: 44px; object-fit: contain; opacity: 0.4; }
    .card-number {
      position: absolute; top: 40px; right: 50px;
      font-size: 18px; font-weight: 700; color: var(--color-primary); opacity: 0.6;
    }`;

// ══════════════════════════════════════════
// 카드 6: 체크리스트 (블러 배경 제거, 인플로우 로고)
// ══════════════════════════════════════════
console.log('\n── 카드 6 재작성 ──');
const card6 = copyData.cards.find(c => c.number === 6);
card6.generated_html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    ${cssVars}

    .top-bar {
      width: 100%; height: 8px; background: var(--color-primary); flex-shrink: 0;
    }
    section.card { height: calc(1350px - 8px); position: relative; }

    .headline {
      font-size: 48px; font-weight: 900; line-height: 1.25; margin-bottom: 12px;
    }
    .headline em {
      font-style: normal; font-weight: 900;
      background: var(--color-highlight); padding: 2px 8px;
    }
    .subtext {
      font-size: 24px; color: #666; margin-bottom: 36px;
    }
    .checklist {
      display: flex; flex-direction: column; gap: 28px; flex: 1;
    }
    .check-item {
      display: flex; align-items: center; gap: 16px;
      font-size: 30px; font-weight: 700; line-height: 1.4;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }
    .check-icon {
      flex-shrink: 0; width: 40px; height: 40px; border-radius: 50%;
      background: var(--color-primary);
    }
  </style>
</head>
<body>
  <div class="top-bar"></div>
  <section class="card">
    <span class="card-number">6 / 10</span>
    <div class="card-content">
      <h1 class="headline"><em>톡톡 잉글리쉬만의 루틴랩 시스템</em>이 만드는 차이</h1>
      <p class="subtext">하루 30분으로 국제학교 입학 실력 완성</p>
      <div class="checklist">
        <div class="check-item"><span class="check-icon"></span><span>원서 리딩으로 토론 실력 향상</span></div>
        <div class="check-item"><span class="check-icon"></span><span>에세이 쓰기로 논리적 표현력 강화</span></div>
        <div class="check-item"><span class="check-icon"></span><span>뉴스 챌린지로 배경지식 확장</span></div>
        <div class="check-item"><span class="check-icon"></span><span>매일 영어 사고 루틴 형성</span></div>
        <div class="check-item" style="border-bottom:none;"><span class="check-icon"></span><span>1:1 피드백으로 실수 즉시 교정</span></div>
      </div>
    </div>
    <div class="card-sign"><img src="${logoDataUri}" alt="톡톡 잉글리쉬" /></div>
  </section>
</body>
</html>`;
console.log('  ✅ 카드 6 완료');

// ══════════════════════════════════════════
// 카드 8: 대회수상 사진 + 2x2 그리드 (사진 높이 축소)
// ══════════════════════════════════════════
console.log('\n── 카드 8 재작성 ──');
const card8 = copyData.cards.find(c => c.number === 8);
card8.generated_html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    ${cssVars}

    .image-area {
      width: 1080px; height: 380px; overflow: hidden; position: relative; flex-shrink: 0;
    }
    .image-area img {
      width: 100%; height: 100%; object-fit: cover;
    }
    .image-area::after {
      content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 60px;
      background: linear-gradient(transparent, var(--color-background));
    }
    section.card { height: calc(1350px - 380px); position: relative; }

    .headline {
      font-size: 48px; font-weight: 900; line-height: 1.2; margin-bottom: 8px;
    }
    .headline em {
      font-style: normal; font-weight: 900;
      background: var(--color-highlight); padding: 2px 8px;
    }
    .subtext {
      font-size: 22px; color: #666; margin-bottom: 28px;
    }
    .grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 20px; flex: 1;
    }
    .grid-item {
      background: white; border-radius: 16px; padding: 28px;
      border: 2px solid var(--color-primary); border-left: 5px solid var(--color-primary);
      display: flex; flex-direction: column; justify-content: center;
    }
    .grid-icon { font-size: 36px; margin-bottom: 8px; }
    .grid-title { font-size: 28px; font-weight: 900; margin-bottom: 6px; }
    .grid-desc { font-size: 20px; color: #555; line-height: 1.4; }
  </style>
</head>
<body>
  <div class="image-area">
    <img src="{{BG_IMAGE_URL}}" alt="대회수상" />
  </div>
  <section class="card">
    <span class="card-number">8 / 10</span>
    <div class="card-content">
      <h1 class="headline">톡톡 <em>루틴랩</em> 성과</h1>
      <p class="subtext">매일 30분이 만든 놀라운 결과</p>
      <div class="grid">
        <div class="grid-item">
          <span class="grid-icon">🏆</span>
          <div class="grid-title">대회 수상</div>
          <div class="grid-desc">영어말하기대회 31명 전원수상</div>
        </div>
        <div class="grid-item">
          <span class="grid-icon">🌏</span>
          <div class="grid-title">해외 진출</div>
          <div class="grid-desc">캐나다 교육청 이중졸업장 취득</div>
        </div>
        <div class="grid-item">
          <span class="grid-icon">📚</span>
          <div class="grid-title">실력 향상</div>
          <div class="grid-desc">4주 만에 말하기 자신감 UP</div>
        </div>
        <div class="grid-item">
          <span class="grid-icon">⭐</span>
          <div class="grid-title">습관 형성</div>
          <div class="grid-desc">자기주도 영어 루틴 완성</div>
        </div>
      </div>
    </div>
    <div class="card-sign"><img src="${logoDataUri}" alt="톡톡 잉글리쉬" /></div>
  </section>
</body>
</html>`;
// bg_image_url 유지 (renderer가 {{BG_IMAGE_URL}} 치환)
card8.bg_image_url = contestImageUrl;
console.log('  ✅ 카드 8 완료');

// ══════════════════════════════════════════
// 카드 10: CTA ("톡톡 잉글리쉬" 헤드라인 복원)
// ══════════════════════════════════════════
console.log('\n── 카드 10 재작성 ──');
const card10 = copyData.cards.find(c => c.number === 10);
card10.generated_html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    ${cssVars}
    body { background-color: var(--color-primary); }

    section.card {
      height: 1350px; position: relative;
      display: flex; flex-direction: column;
      justify-content: space-between;
      padding: 80px 60px 36px;
    }
    .card-content {
      flex: 1; display: flex; flex-direction: column;
      justify-content: center; align-items: center;
      text-align: center;
    }
    .headline {
      font-size: 72px; font-weight: 900; line-height: 1.25;
      color: white; margin-bottom: 24px;
    }
    .headline em {
      font-style: normal; font-weight: 900;
      color: var(--color-text);
    }
    .subtext {
      font-size: 28px; color: rgba(255,255,255,0.85); margin-bottom: 48px;
      line-height: 1.5;
    }
    .cta-btn {
      display: inline-flex; align-items: center; gap: 12px;
      background: white; color: var(--color-primary);
      font-size: 32px; font-weight: 900;
      padding: 24px 56px; border-radius: 60px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      margin-bottom: 20px;
    }
    .cta-sub {
      font-size: 22px; color: rgba(255,255,255,0.7);
    }
    .card-number {
      color: rgba(255,255,255,0.5);
    }
    .card-sign img { opacity: 0.5; filter: brightness(10); }
  </style>
</head>
<body>
  <section class="card">
    <span class="card-number">10 / 10</span>
    <div class="card-content">
      <h1 class="headline"><em>톡톡 잉글리쉬</em>에서 시작하세요</h1>
      <p class="subtext">해외 진출의 첫 걸음<br>루틴랩 무료 체험 신청하세요</p>
      <div class="cta-btn">무료 체험 신청하기 👆</div>
      <div class="cta-sub">카카오 오픈채팅 / 전화 상담 가능</div>
    </div>
    <div class="card-sign" style="justify-content:center;">
      <img src="${logoDataUri}" alt="톡톡 잉글리쉬" />
    </div>
  </section>
</body>
</html>`;
console.log('  ✅ 카드 10 완료');

// ── 저장 + 렌더링 + 업로드 ──
await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');

console.log('\n── PNG 렌더링 ──');
const { htmlSources } = await renderCards(copyData.cards, cssVariables, academy.name, OUTPUT_DIR, ACADEMY_KEY);

console.log('\n── 노션 업로드 ──');
const searchStatuses = ['디자인 수정', '디자인 1차', '제작 요청', '기획 컨펌', '기획컨펌대기', '원고작업'];
let targetPage = null;
for (const status of searchStatuses) {
  try {
    const pages = await getByStatus(status);
    const found = pages.find(p => p.title.includes('톡톡3-2') || p.title.includes('톡톡 3-2'));
    if (found) { targetPage = found; break; }
  } catch { /* skip */ }
}

if (targetPage) {
  const pngPaths = copyData.cards.map((_, i) =>
    join(OUTPUT_DIR, `card-${String(i + 1).padStart(2, '0')}.png`)
  );
  await appendFilePaths(targetPage.id, pngPaths, targetPage.title, academy.name, academy.drive_folder_id, htmlSources);
  console.log(`  ✅ PNG ${pngPaths.length}장 노션 업로드 완료`);
} else {
  console.log('  ⚠️ 노션 페이지 못 찾음');
}

await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('\n═══ 완료! ═══');
