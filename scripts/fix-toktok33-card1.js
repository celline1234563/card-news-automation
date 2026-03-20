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

console.log('═══ 톡톡 3-3 카드 1 디자인 수정 ═══\n');

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

// ── 카드 1 HTML 재작성 ──
const card1 = copyData.cards.find(c => c.number === 1);
console.log(`  카드 1 원본 타입: ${card1.type}, layout: ${card1.layout_hint}`);

card1.generated_html = `<!DOCTYPE html>
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
      width: 1080px;
      height: 1350px;
      font-family: 'Noto Sans KR', sans-serif;
      word-break: keep-all;
      color: var(--color-text);
      background-color: #F5F5F5;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    /* ── 큰 장식 아이콘 (오른쪽 상단) ── */
    .deco-icon {
      position: absolute;
      top: 80px;
      right: 60px;
      color: var(--color-primary);
      opacity: 0.15;
      transform: rotate(15deg);
      z-index: 0;
    }

    /* ── 메인 콘텐츠 (좌측 정렬, 세로 중앙) ── */
    .content-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 80px 80px 40px;
      position: relative;
      z-index: 1;
    }

    .subtext {
      font-size: 28px;
      font-weight: 700;
      color: #888;
      margin-bottom: 24px;
      letter-spacing: -0.5px;
    }

    .headline {
      font-size: 72px;
      font-weight: 900;
      line-height: 1.25;
      color: var(--color-text);
      max-width: 750px;
    }

    .headline em {
      font-style: normal;
      font-weight: 900;
      background: linear-gradient(to top, var(--color-highlight) 35%, transparent 35%);
      padding: 2px 6px;
      display: inline;
      box-decoration-break: clone;
      -webkit-box-decoration-break: clone;
    }

    /* ── 하단 넘기기 힌트 ── */
    .swipe-hint {
      padding: 0 80px 48px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--color-primary);
      font-size: 22px;
      font-weight: 700;
      opacity: 0.7;
    }

    /* ── 로고 영역 ── */
    .card-sign {
      padding: 0 80px 48px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
    }

    .card-sign img {
      height: 44px;
      object-fit: contain;
      opacity: 0.35;
    }
  </style>
</head>
<body>
  <!-- 큰 장식 아이콘 -->
  <i data-lucide="target" class="deco-icon" style="width:320px; height:320px;"></i>

  <div class="content-area">
    <p class="subtext">조건 있는 최상위권 공략법</p>
    <h1 class="headline">
      챌린지 수업,<br>효과 확실하죠.<br><em>BUT 조건이<br>있습니다</em>
    </h1>
  </div>

  <div class="swipe-hint">
    밀어서 확인하기 <i data-lucide="chevrons-right" style="width:24px; height:24px;"></i>
  </div>

  <div class="card-sign">
    <img src="${logoDataUri}" alt="톡톡 잉글리쉬" />
  </div>

  <script>lucide.createIcons();</script>
</body>
</html>`;

console.log('  카드 1 HTML 재작성 완료\n');

// ── copy.json 저장 ──
await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');

// ── PNG 렌더링 ──
console.log('── PNG 렌더링 ──');
const { htmlSources } = await renderCards(copyData.cards, cssVariables, academy.name, OUTPUT_DIR, ACADEMY_KEY);
console.log('');

// ── 노션 업로드 ──
console.log('── 노션 업로드 ──');
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
