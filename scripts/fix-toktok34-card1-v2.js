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

console.log('═══ 톡톡 3-4 카드 1 — 이미지 위치 + 폰트 수정 ═══\n');

const copyData = JSON.parse(await readFile(join(OUTPUT_DIR, 'copy.json'), 'utf-8'));
const { academy, cssVariables } = await loadConfig(ACADEMY_KEY);

const logoPath = join(ROOT, 'config', 'logos', `${ACADEMY_KEY}.png`);
let logoDataUri = '';
if (existsSync(logoPath)) {
  const buf = await readFile(logoPath);
  logoDataUri = `data:image/png;base64,${buf.toString('base64')}`;
}

// 이미지 base64 로드
const imgPath = join(ROOT, 'temp', 'bg-01-students.png');
const imgBuf = await readFile(imgPath);
const imgDataUri = `data:image/png;base64,${imgBuf.toString('base64')}`;
console.log('  이미지 + 로고 로드 완료');

const card1 = copyData.cards.find(c => c.number === 1);

// 톡톡3-3 카드1 폰트 참고:
// - subtext: 28px, 700, #888
// - headline: 72px, 900, 하이라이트
// - swipe hint: 22px
// 변경점: background-position을 top으로 → 얼굴 보이게
// 이미지 영역 높이 640px로 늘려서 더 많이 보이게

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
    }

    /* ── 상단 이미지: 높이 늘리고 position top으로 얼굴 보이게 ── */
    .image-area {
      width: 1080px; height: 640px;
      background-image: url('${imgDataUri}');
      background-size: cover;
      background-position: center top;
      position: relative;
    }
    .image-area::after {
      content: '';
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 140px;
      background: linear-gradient(transparent, #F5F5F5);
    }

    /* ── 하단 텍스트: 3-3 카드1 폰트 스타일 매칭 ── */
    .text-area {
      flex: 1;
      padding: 20px 80px 0;
      display: flex; flex-direction: column;
      justify-content: center;
    }

    .subtext {
      font-size: 28px; font-weight: 700;
      color: #888; margin-bottom: 24px;
      letter-spacing: -0.5px;
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

    .swipe-hint {
      padding: 12px 80px 20px;
      display: flex; align-items: center; gap: 8px;
      color: var(--color-primary); font-size: 22px; font-weight: 700; opacity: 0.7;
    }

    .card-sign {
      padding: 0 80px 40px;
      display: flex; align-items: center;
    }
    .card-sign img { height: 44px; object-fit: contain; opacity: 0.35; }
</style></head>
<body>
  <div class="image-area"></div>

  <div class="text-area">
    <p class="subtext">초등학생 절반이 이 시기를 놓치고 있습니다</p>
    <h1 class="headline"><em>50%</em>가 놓치는<br>골든타임</h1>
  </div>

  <div class="swipe-hint">
    밀어서 확인하기 <i data-lucide="chevrons-right" style="width:24px;height:24px;"></i>
  </div>

  <div class="card-sign">
    <img src="${logoDataUri}" alt="톡톡 잉글리쉬" />
  </div>
  <script>lucide.createIcons();</script>
</body></html>`;

console.log('  카드 1 HTML 수정 완료');

await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');

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
