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
const OUTPUT_DIR = join(ROOT, 'output', '톡톡 잉글리쉬--톡톡3-2--해외-및-국제학교-합격생들에게-꼭-있는-필수-요소--루틴랩-2026-03-12');

console.log('═══ 톡톡 3-2 카드 2,4,7,10 수정 (2차) ═══\n');

const copyData = JSON.parse(await readFile(join(OUTPUT_DIR, 'copy.json'), 'utf-8'));
const { academy, cssVariables } = await loadConfig(ACADEMY_KEY);

// 로고 data URI
const logoPath = join(ROOT, 'config', 'logos', `${ACADEMY_KEY}.png`);
const logoBuf = await readFile(logoPath);
const logoDataUri = `data:image/png;base64,${logoBuf.toString('base64')}`;

// bg 이미지 data URI helper
async function toDataUri(path) {
  const buf = await readFile(path);
  const mime = path.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

// ══════════════════════════════════════════
// 카드 2: 이미지 축소 + 콘텐츠 카드사인 구조
// ══════════════════════════════════════════
console.log('── 카드 2 재작성 (이미지 축소 + 콘텐츠 영역 확보) ──');
const card2 = copyData.cards.find(c => c.number === 2);
const bgUri = card2.bg_image_url ? await toDataUri(card2.bg_image_url) : '';

card2.generated_html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --color-primary: #FF6B2B; --color-background: #FFF8F5;
      --color-text: #1A1A1A; --color-highlight: #FFD4B8;
    }
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      width:1080px; height:1350px; overflow:hidden;
      font-family:'Noto Sans KR',sans-serif; word-break:keep-all;
      background: var(--color-background);
    }
    .image-area {
      width:1080px; height:420px; overflow:hidden; position:relative;
    }
    .image-area img { width:100%; height:100%; object-fit:cover; }
    .image-area::after {
      content:''; position:absolute; bottom:0; left:0; right:0; height:80px;
      background:linear-gradient(transparent, var(--color-background));
    }
    section.card {
      display:flex; flex-direction:column; justify-content:space-between;
      height:930px; padding:32px 60px 36px; position:relative;
    }
    .card-content { flex:1; display:flex; flex-direction:column; justify-content:flex-start; }
    .card-number {
      position:absolute; top:16px; right:50px;
      font-size:18px; font-weight:700; color:var(--color-primary); opacity:0.6;
    }
    .headline {
      font-size:44px; font-weight:900; line-height:1.25; margin-bottom:20px;
    }
    .headline em { font-style:normal; color:var(--color-primary); }
    .bubble-main {
      background:var(--color-primary); color:white; border-radius:20px;
      padding:28px 32px; font-size:28px; font-weight:700; line-height:1.45;
      margin-bottom:20px; position:relative;
    }
    .bubble-main::after {
      content:''; position:absolute; bottom:-12px; left:40px;
      border:12px solid transparent; border-top-color:var(--color-primary);
    }
    .bubble-sub {
      background:white; border:2px solid #eee; border-radius:20px;
      padding:20px 28px; font-size:24px; font-weight:700; line-height:1.4;
      align-self:flex-end; margin-bottom:24px;
    }
    .persona {
      display:flex; align-items:center; gap:12px; margin-bottom:8px;
    }
    .persona-badge {
      background:var(--color-primary); color:white; font-size:16px;
      font-weight:900; padding:6px 14px; border-radius:20px;
    }
    .persona-label { font-size:18px; font-weight:700; }
    .persona-desc { font-size:20px; color:#888; }
    .card-sign { margin-top:20px; display:flex; align-items:center; flex-shrink:0; }
    .card-sign img { height:44px; object-fit:contain; opacity:0.4; }
  </style>
</head>
<body>
  <div class="image-area">
    <img src="${bgUri}" alt="" />
  </div>
  <section class="card">
    <span class="card-number">2 / 10</span>
    <div class="card-content">
      <h1 class="headline">우리 아이, <em>이런 고민</em> 있나요?</h1>
      <div class="bubble-main">영어 시험은 잘 보는데 외국인 앞에서는 말 한마디 못해요...</div>
      <div class="bubble-sub">이런 걱정, 톡톡에서 해결됩니다</div>
      <div class="persona">
        <span class="persona-badge">학부모</span>
        <span class="persona-label">학부모</span>
      </div>
      <div class="persona-desc">영어 성적은 좋은데 실제 말하기는 어려워해요</div>
    </div>
    <div class="card-sign"><img src="${logoDataUri}" alt="톡톡 잉글리쉬" /></div>
  </section>
</body>
</html>`;
console.log('  ✅ 카드 2 완료');

// ══════════════════════════════════════════
// 카드 4: 40% 색상 → 노란색 (#FFE066)
// ══════════════════════════════════════════
console.log('── 카드 4: 40% 색상 노란색으로 변경 ──');
const card4 = copyData.cards.find(c => c.number === 4);
if (card4.generated_html) {
  // stat의 color: var(--color-accent) → #FFE066
  card4.generated_html = card4.generated_html.replace(
    /\.stat\s*\{([^}]*?)color\s*:\s*var\(--color-accent\)/g,
    '.stat {$1color: #FFE066'
  );
  // 혹시 다른 패턴이면 직접 주입
  if (!card4.generated_html.includes('#FFE066')) {
    card4.generated_html = card4.generated_html.replace(
      /\.stat\s*\{/g,
      '.stat { color: #FFE066 !important;'
    );
  }
  console.log('  ✅ 카드 4 완료');
}

// ══════════════════════════════════════════
// 카드 7: 하단 이미지 선명하게 + 가장자리만 블러 (비네트)
// ══════════════════════════════════════════
console.log('── 카드 7: 하단 이미지 선명 + 가장자리 비네트 ──');
const card7 = copyData.cards.find(c => c.number === 7);
if (card7.generated_html) {
  // 기존 블러 배경 div 제거
  card7.generated_html = card7.generated_html.replace(
    /<div style="position:absolute; bottom:0;[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi,
    ''
  );

  // 새로운 선명 이미지 + 가장자리 비네트로 교체
  const vignetteBg = `
<div style="position:absolute; bottom:0; left:0; width:1080px; height:450px; overflow:hidden; z-index:0;">
  <img src="{{BG_IMAGE_URL_7}}" style="width:100%; height:100%; object-fit:cover; transform:scale(1.02);" />
  <div style="position:absolute; top:0; left:0; width:100%; height:100%;
    background: radial-gradient(ellipse 70% 60% at center, transparent 40%, rgba(255,248,245,0.85) 100%);
  "></div>
  <div style="position:absolute; top:0; left:0; width:100%; height:60px;
    background: linear-gradient(to bottom, var(--color-background, #FFF8F5), transparent);
  "></div>
</div>`;

  card7.generated_html = card7.generated_html.replace('</body>', vignetteBg + '\n</body>');
  console.log('  ✅ 카드 7 완료');
}

// ══════════════════════════════════════════
// 카드 10: 로고 가시성 수정 (오렌지 배경에서 흰색 로고)
// ══════════════════════════════════════════
console.log('── 카드 10: 로고 가시성 수정 ──');
const card10 = copyData.cards.find(c => c.number === 10);
if (card10.generated_html) {
  // card-sign img 스타일 수정: 밝기 과다 → 원본+opacity높임
  card10.generated_html = card10.generated_html.replace(
    /\.card-sign img\s*\{[^}]*\}/,
    '.card-sign img { opacity: 0.7; filter: brightness(0) invert(1); height: 48px; object-fit: contain; }'
  );
  console.log('  ✅ 카드 10 완료');
}

// ── 저장 + 렌더링 ──
await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');

// 카드 7의 이미지 URL 치환을 위해 renderer 전에 처리
// findImageByName으로 이미지 URL 가져오기
import { findImageByName } from '../agents/image-picker.js';
const img7 = await findImageByName('IMG_20251119_111052', ACADEMY_KEY);
if (img7 && card7.generated_html) {
  try {
    const res = await fetch(img7.url);
    const buf = Buffer.from(await res.arrayBuffer());
    const mime = 'image/jpeg';
    const dataUri = `data:${mime};base64,${buf.toString('base64')}`;
    card7.generated_html = card7.generated_html.replaceAll('{{BG_IMAGE_URL_7}}', dataUri);
    console.log('  ✅ 카드 7 이미지 주입 완료');
  } catch (err) {
    console.log(`  ⚠️ 카드 7 이미지 로드 실패: ${err.message}`);
  }
}

await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');

console.log('\n── PNG 렌더링 ──');
const { htmlSources } = await renderCards(copyData.cards, cssVariables, academy.name, OUTPUT_DIR, ACADEMY_KEY);

// ── 노션 업로드 ──
console.log('\n── 노션 업로드 ──');
const statuses = ['디자인 수정', '디자인 1차', '제작 요청', '기획 컨펌', '기획컨펌대기'];
let targetPage = null;
for (const s of statuses) {
  try {
    const pages = await getByStatus(s);
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
