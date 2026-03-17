/**
 * 진학중등3-4 카드 08 — 실사진 임베딩
 * - 전교1등최다배출.png를 base64 data URI로 변환
 * - 카드 08 HTML에 상단 55% 사진 + 하단 45% 텍스트 레이아웃 직접 삽입
 * - 전체 PNG 재렌더링 + 노션 재업로드
 */
import 'dotenv/config';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import { loadConfig } from '../agents/config-loader.js';
import { renderCards } from '../agents/renderer.js';
import { getByStatus, appendFilePaths, setStatus } from '../agents/notion-connector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const ACADEMY_KEY = 'jinhak';
const OUTPUT_DIR = join(ROOT, 'output', '진학학원--진학중등3-4--종합반-전환-이벤트-2026-03-12');
const PHOTO_PATH = 'C:\\Users\\mynote\\Downloads\\전교1등최다배출.png';

// ── Step 1: 사진을 base64 data URI로 변환 ──
console.log('═══ Step 1: 사진 → base64 data URI 변환 ═══');
const photoBuffer = await readFile(PHOTO_PATH);
const base64Photo = photoBuffer.toString('base64');
const dataUri = `data:image/png;base64,${base64Photo}`;
console.log(`  사진 로드 완료: ${(photoBuffer.length / 1024).toFixed(1)}KB → base64 ${(base64Photo.length / 1024).toFixed(1)}KB\n`);

// ── Step 2: copy.json 로드 ──
console.log('═══ Step 2: copy.json 로드 ═══');
const copyRaw = await readFile(join(OUTPUT_DIR, 'copy.json'), 'utf-8');
const copyData = JSON.parse(copyRaw);
console.log(`  카드 ${copyData.cards.length}장 로드\n`);

// ── Step 3: 학원 설정 로드 ──
console.log('═══ Step 3: 학원 설정 로드 ═══');
const { academy, cssVariables } = await loadConfig(ACADEMY_KEY);
console.log(`  ${academy.name} 설정 로드 완료\n`);

// ── Step 4: 카드 08 HTML 생성 (사진 임베딩) ──
console.log('═══ Step 4: 카드 08 HTML 생성 (사진 임베딩) ═══');
const card8 = copyData.cards.find(c => c.number === 8);
if (!card8) {
  console.error('  카드 08을 찾을 수 없습니다!');
  process.exit(1);
}

const newHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
  <title>진학학원 카드뉴스 8/10</title>
  <style>
    :root {
      --color-primary: #081459;
      --color-secondary: #ff871e;
      --color-background: #F5F6FA;
      --color-text: #1A1A2E;
      --color-highlight: #FFE0C0;
      --color-accent: #ff871e;
      --surface-card: #FFFFFF;
      --text-heading: #1A1A2E;
      --text-body: #333344;
      --text-muted: #6B7280;
      --text-inverse: #FFFFFF;
      --font-main: 'Noto Sans KR', sans-serif;
      --font-size-h1: 56px;
      --font-size-h2: 30px;
      --font-size-h3: 32px;
      --font-size-body: 26px;
      --font-size-body-small: 22px;
      --font-size-caption: 18px;
      --font-weight-regular: 400;
      --font-weight-bold: 700;
      --font-weight-black: 900;
      --line-height-tight: 1.15;
      --line-height-normal: 1.3;
      --canvas-width: 1080px;
      --canvas-height: 1350px;
      --safe-area: 60px;
      --space-sm: 8px;
      --space-md: 16px;
      --space-lg: 24px;
      --space-xl: 32px;
      --space-2xl: 48px;
      --shadow-subtle: 0 2px 8px rgba(8, 20, 89, 0.08);
      --radius-md: 16px;
      --radius-full: 50%;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      width: var(--canvas-width);
      height: var(--canvas-height);
      margin: 0;
      font-family: var(--font-main);
      word-break: keep-all;
      display: flex;
      flex-direction: column;
      background-color: var(--color-background);
      color: var(--color-text);
    }

    /* Header bar */
    .header {
      width: 100%;
      height: 60px;
      background-color: var(--color-primary);
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 var(--safe-area);
      color: var(--text-inverse);
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-body-small);
      flex-shrink: 0;
    }

    /* Photo section: top ~55% of the card (minus header/footer = ~55% of 1230px) */
    .photo-section {
      width: 100%;
      height: 680px;
      flex-shrink: 0;
    }

    .photo-section img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
    }

    /* Text content section: bottom ~45% */
    .content-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: var(--space-xl) var(--safe-area);
      background-color: var(--surface-card);
    }

    .headline {
      font-size: var(--font-size-h1);
      font-weight: var(--font-weight-black);
      line-height: var(--line-height-tight);
      color: var(--text-heading);
      margin-bottom: var(--space-sm);
    }

    .headline em {
      background: linear-gradient(to top, var(--color-highlight) 30%, transparent 30%);
      font-style: normal;
      padding: 0;
      display: inline;
      box-decoration-break: clone;
      -webkit-box-decoration-break: clone;
      color: var(--color-text);
      font-weight: var(--font-weight-black);
    }

    .subtext {
      font-size: var(--font-size-body);
      line-height: var(--line-height-normal);
      color: var(--text-body);
      margin-bottom: var(--space-xl);
    }

    /* Stats grid: 2x2 */
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-md);
      width: 100%;
    }

    .stat-card {
      display: flex;
      align-items: center;
      padding: var(--space-lg);
      background-color: var(--color-background);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-subtle);
      gap: var(--space-lg);
    }

    .stat-icon {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-full);
      background-color: var(--color-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 26px;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-title {
      font-size: var(--font-size-h3);
      font-weight: var(--font-weight-bold);
      color: var(--text-heading);
      line-height: var(--line-height-tight);
    }

    .stat-desc {
      font-size: var(--font-size-body-small);
      color: var(--text-body);
      line-height: var(--line-height-normal);
    }

    /* Footer bar */
    .footer {
      width: 100%;
      height: 60px;
      background-color: var(--color-primary);
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 var(--safe-area);
      color: var(--text-inverse);
      font-size: var(--font-size-body-small);
      flex-shrink: 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <span>진학학원</span>
    <span>8 / 10</span>
  </div>

  <div class="photo-section">
    <img src="${dataUri}" alt="8년 연속 매 시험 전교1등 30명 이상 배출 — 진학학원 명예의 전당">
  </div>

  <div class="content-section">
    <h1 class="headline">실제 <em>성과</em> 사례</h1>
    <p class="subtext">2025년 진학학원 종합반 실적 기준</p>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🥇</div>
        <div class="stat-info">
          <div class="stat-title">전교 1등</div>
          <div class="stat-desc">중등부 63명 배출</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💯</div>
        <div class="stat-info">
          <div class="stat-title">올백 달성</div>
          <div class="stat-desc">전과목 100점 44명</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-info">
          <div class="stat-title">서울대</div>
          <div class="stat-desc">2026 수시 5명 지원</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-info">
          <div class="stat-title">성적 향상</div>
          <div class="stat-desc">종합반 전환 후 급상승</div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    <span>진학학원</span>
    <span>관악/금천 초중고 수학전문</span>
  </div>
</body>
</html>`;

card8.generated_html = newHtml;
card8.layout_used = 'photo-stats-grid';
console.log(`  카드 08 HTML 생성 완료 (사진 base64 임베딩 포함)\n`);

// ── Step 5: copy.json 저장 ──
console.log('═══ Step 5: copy.json 저장 ═══');
await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('  저장 완료\n');

// ── Step 6: 전체 PNG 재렌더링 ──
// 카드 08은 base64 이미지가 크므로 (11MB+) 별도로 렌더링 (긴 타임아웃)
console.log('═══ Step 6: 전체 PNG 재렌더링 ═══');
console.log(`  출력 폴더: ${OUTPUT_DIR}`);
await mkdir(OUTPUT_DIR, { recursive: true });

// 6a: 카드 08을 제외한 나머지 9장은 기본 렌더러로
const otherCards = copyData.cards.filter(c => c.number !== 8);
const card8Only = copyData.cards.filter(c => c.number === 8);

console.log('  --- 카드 08 제외 9장 렌더링 ---');
const { htmlSources: otherHtmlSources } = await renderCards(otherCards, cssVariables, academy.name, OUTPUT_DIR);

// 6b: 카드 08 별도 렌더링 (120초 타임아웃)
console.log('  --- 카드 08 별도 렌더링 (대용량 이미지, 120초 타임아웃) ---');
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350 });
  await page.setContent(card8.generated_html, { waitUntil: 'load', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  const card08Path = join(OUTPUT_DIR, 'card-08.png');
  await page.screenshot({ path: card08Path, type: 'png' });
  await page.close();
  console.log('  ✅ card-08.png 저장 완료');
} finally {
  await browser.close();
}

// copy.json을 renderCards가 덮어쓰므로 (otherCards만 포함) 다시 전체 저장
await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('  ✅ copy.json 재저장 완료 (전체 10장)');

// htmlSources 합성 (노션 업로드용)
const htmlSources = [];
for (const card of copyData.cards) {
  if (card.number === 8) {
    htmlSources.push(card.generated_html);
  } else {
    const idx = otherCards.findIndex(c => c.number === card.number);
    htmlSources.push(idx >= 0 ? otherHtmlSources[idx] : (card.generated_html || ''));
  }
}
console.log('');

// ── Step 7: 노션 업로드 ──
console.log('═══ Step 7: 노션 재업로드 ═══');

const searchStatuses = ['디자인 1차', '제작 요청', '기획 컨펌', '원고작업', '기획컨펌대기', '디자인완료'];
let targetPage = null;

for (const status of searchStatuses) {
  try {
    const pages = await getByStatus(status);
    const found = pages.find(p =>
      p.title.includes('진학중등3-4') ||
      p.title.includes('진학 중등3-4')
    );
    if (found) {
      targetPage = found;
      console.log(`  페이지 발견: "${found.title}" (상태: ${status})`);
      break;
    }
  } catch (err) {
    console.log(`  상태 "${status}" 검색 실패: ${err.message}`);
  }
}

if (!targetPage) {
  console.log('  노션 페이지를 찾을 수 없음 — 업로드 스킵');
  console.log('  PNG는 로컬에 저장되어 있습니다.');
} else {
  const pngPaths = copyData.cards.map((_, i) =>
    join(OUTPUT_DIR, `card-${String(i + 1).padStart(2, '0')}.png`)
  );
  await appendFilePaths(
    targetPage.id,
    pngPaths,
    targetPage.title,
    academy.name,
    academy.drive_folder_id,
    htmlSources
  );
  console.log(`  PNG ${pngPaths.length}장 노션 업로드 완료`);

  await setStatus(targetPage.id, '디자인 1차');
  console.log('  상태 -> 디자인 1차');
}

console.log('\n═══ 완료! 카드 08 실사진 임베딩 성공 ═══');
