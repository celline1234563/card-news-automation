import 'dotenv/config';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { GoogleGenAI } from '@google/genai';
import { loadConfig } from '../agents/config-loader.js';
import { renderCards } from '../agents/renderer.js';
import { appendFilePaths } from '../agents/notion-connector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const ACADEMY_KEY = 'toktok';
const OUTPUT_DIR = join(ROOT, 'output', '톡톡 잉글리쉬--톡톡3-4--50%가-골든타임-놓치는-시기-2026-03-20');
const TEMP_DIR = join(ROOT, 'temp');

console.log('═══ 톡톡 3-4 카드 1 — 초등학생 이미지 생성 + 적용 ═══\n');

const copyData = JSON.parse(await readFile(join(OUTPUT_DIR, 'copy.json'), 'utf-8'));
const { academy, cssVariables } = await loadConfig(ACADEMY_KEY);

const logoPath = join(ROOT, 'config', 'logos', `${ACADEMY_KEY}.png`);
let logoDataUri = '';
if (existsSync(logoPath)) {
  const buf = await readFile(logoPath);
  logoDataUri = `data:image/png;base64,${buf.toString('base64')}`;
  console.log('  로고 로드 완료');
}

// ── 1. Gemini Imagen으로 초등학생 이미지 생성 ──
console.log('\n── Imagen 이미지 생성 ──');
await mkdir(TEMP_DIR, { recursive: true });

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
const imgPrompt = `Korean elementary school students studying together in a bright, modern classroom.
Warm and inviting atmosphere. Clean, minimal background.
Soft natural lighting from windows. Students are focused and engaged.
No text, no letters, no watermarks.
Muted warm color tones with subtle orange accents.
Professional editorial photography style. Shallow depth of field.
Portrait orientation (3:4 ratio).`;

console.log('  이미지 생성 중...');
const response = await ai.models.generateImages({
  model: 'imagen-4.0-generate-001',
  prompt: imgPrompt,
  config: { numberOfImages: 1, aspectRatio: '3:4' },
});

if (!response.generatedImages || response.generatedImages.length === 0) {
  console.error('  이미지 생성 실패!');
  process.exit(1);
}

const imgBytes = response.generatedImages[0].image.imageBytes;
const imgBuffer = Buffer.from(imgBytes, 'base64');
const imgPath = join(TEMP_DIR, 'bg-01-students.png');
await writeFile(imgPath, imgBuffer);
console.log(`  이미지 저장: ${imgPath}`);

// base64 data URI로 변환
const imgDataUri = `data:image/png;base64,${imgBytes}`;

// ── 2. 카드 1 HTML 재작성 (이미지 포함) ──
console.log('\n── 카드 1 HTML 재작성 ──');
const card1 = copyData.cards.find(c => c.number === 1);
card1.bg_image_url = imgPath;

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

    /* ── 상단 이미지 영역 ── */
    .image-area {
      width: 1080px; height: 580px;
      background-image: url('${imgDataUri}');
      background-size: cover;
      background-position: center 30%;
      position: relative;
    }
    .image-area::after {
      content: '';
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 120px;
      background: linear-gradient(transparent, #F5F5F5);
    }

    /* ── 하단 텍스트 영역 ── */
    .text-area {
      flex: 1;
      padding: 32px 80px 40px;
      display: flex; flex-direction: column;
      justify-content: center;
    }

    .subtext {
      font-size: 28px; font-weight: 700;
      color: #888; margin-bottom: 24px;
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
      margin-top: 28px;
      font-size: 30px; font-weight: 700;
      color: #666; line-height: 1.5;
    }

    .swipe-hint {
      padding: 0 80px 24px;
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

console.log('  카드 1 HTML 완료');

// ── 저장 + 렌더링 + 업로드 ──
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
