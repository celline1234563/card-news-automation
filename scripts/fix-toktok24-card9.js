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
const OUTPUT_DIR = join(ROOT, 'output', '톡톡 잉글리쉬--톡톡2-4--경기초-엄마들이-찾는-영어는-다르다-2026-03-18');

console.log('═══ 톡톡 2-4 카드 9 구조 수정 ═══\n');

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

// ── 카드 9 HTML 재작성 ──
const card9 = copyData.cards.find(c => c.number === 9);
console.log(`  카드 9 원본 타입: ${card9.type}, layout: ${card9.layout_hint}`);

// 사용자 제안 구조 적용: .card > .card-content + .card-sign
card9.generated_html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
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
      overflow: hidden;
      font-family: 'Noto Sans KR', sans-serif;
      word-break: keep-all;
      color: var(--color-text);
      background-color: var(--color-background);
    }

    /* ── 이미지 영역 ── */
    .image-area {
      width: 1080px;
      height: 580px;
      background-image: url('{{BG_IMAGE_URL}}');
      background-size: cover;
      background-position: center;
      position: relative;
    }
    .image-area::after {
      content: '';
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 80px;
      background: linear-gradient(transparent, var(--color-background));
    }

    /* ── 카드 (콘텐츠+로고) ── */
    section.card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 770px; /* 1350 - 580 */
      padding: 40px 60px 36px;
    }

    .card-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
    }

    .headline {
      font-size: 52px;
      font-weight: 900;
      line-height: 1.2;
      margin-bottom: 12px;
    }

    .headline em {
      font-style: normal;
      font-weight: 900;
      color: var(--color-primary);
    }

    .subtext {
      font-size: 26px;
      color: #555;
      margin-bottom: 28px;
    }

    .feature-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 28px;
      font-weight: 700;
      line-height: 1.35;
    }

    .feature-icon {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
    }

    /* ── 로고 영역 (인플로우) ── */
    .card-sign {
      margin-top: 32px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      flex-shrink: 0;
    }

    .card-sign img {
      height: 48px;
      object-fit: contain;
      opacity: 0.4;
    }
  </style>
</head>
<body>
  <div class="image-area"></div>

  <section class="card">
    <div class="card-content">
      <h1 class="headline">경기초 엄마들의 <em>현명한 선택</em></h1>
      <p class="subtext">우리 아이 미래를 위한 투자</p>
      <div class="feature-list">
        <div class="feature-item">
          <span class="feature-icon">♡</span>
          <span>바뀐 교육과정에 맞춘 체계적 커리큘럼</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">♡</span>
          <span>화상영어와 미국교과서 정품 프로그램</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">♡</span>
          <span>특목고·국제학교 진학 완벽 준비</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">♡</span>
          <span>개별 맞춤 학습으로 확실한 실력 향상</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">♡</span>
          <span>경기초 학부모들이 인정한 신뢰도</span>
        </div>
      </div>
    </div>

    <div class="card-sign">
      <img src="${logoDataUri}" alt="톡톡 잉글리쉬" />
    </div>
  </section>
</body>
</html>`;

console.log('  ✅ 카드 9 HTML 재작성 완료\n');

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
      p.title.includes('톡톡2-4') || p.title.includes('톡톡 2-4')
    );
    if (found) { targetPage = found; break; }
  } catch (err) { /* skip */ }
}

if (targetPage) {
  const pngPaths = copyData.cards.map((_, i) =>
    join(OUTPUT_DIR, `card-${String(i + 1).padStart(2, '0')}.png`)
  );
  await appendFilePaths(targetPage.id, pngPaths, targetPage.title, academy.name, academy.drive_folder_id, htmlSources);
  console.log(`  ✅ PNG ${pngPaths.length}장 노션 업로드 완료`);
} else {
  console.log('  ⚠️ 톡톡 2-4 노션 페이지를 찾을 수 없음');
}

await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('\n═══ 완료! ═══');
