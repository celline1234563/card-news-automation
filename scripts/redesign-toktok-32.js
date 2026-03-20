import 'dotenv/config';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { loadConfig } from '../agents/config-loader.js';
import { renderCards } from '../agents/renderer.js';
import { findImageByName, getClients } from '../agents/image-picker.js';
import { getByStatus, appendFilePaths } from '../agents/notion-connector.js';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const TEMP_DIR = join(ROOT, 'temp');

const ACADEMY_KEY = 'toktok';
const OUTPUT_DIR = join(ROOT, 'output', '톡톡 잉글리쉬--톡톡3-2--해외-및-국제학교-합격생들에게-꼭-있는-필수-요소--루틴랩-2026-03-12');

console.log('═══ 톡톡 3-2 종합 수정 ═══\n');

// ── Step 1: 데이터 로드 ──
console.log('── Step 1: 데이터 로드 ──');
const copyData = JSON.parse(await readFile(join(OUTPUT_DIR, 'copy.json'), 'utf-8'));
const { academy, cssVariables } = await loadConfig(ACADEMY_KEY);
console.log(`  카드 ${copyData.cards.length}장, ${academy.name} 설정 로드 완료\n`);

// ── Step 2: Drive 이미지 검색 ──
console.log('── Step 2: Drive 이미지 검색 ──');

const driveImages = {};
const imageNames = ['톡톡_수업사진0', 'IMG_20251119_111052', '대회수상'];

for (const name of imageNames) {
  const result = await findImageByName(name, ACADEMY_KEY);
  if (result) {
    driveImages[name] = result;
    console.log(`  ✅ "${name}" → ${result.category} (${result.url.slice(0, 60)}...)`);
  } else {
    console.log(`  ⚠️ "${name}" 찾을 수 없음`);
  }
}
console.log('');

// ── Helper: URL/파일 → base64 data URI ──
async function toDataUri(urlOrPath) {
  let buffer;
  let mime = 'image/jpeg';
  if (urlOrPath.startsWith('http')) {
    const res = await fetch(urlOrPath);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    buffer = Buffer.from(await res.arrayBuffer());
    mime = res.headers.get('content-type') || 'image/jpeg';
  } else {
    buffer = await readFile(urlOrPath);
    mime = urlOrPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
  }
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

// ── Step 3: 카드 2 — Imagen 이미지 생성 + 삽입 ──
console.log('── Step 3: 카드 2 — Imagen 이미지 생성 ──');
const card2 = copyData.cards.find(c => c.number === 2);
await mkdir(TEMP_DIR, { recursive: true });

try {
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: `한국 초등학생 한 명이 교실 책상에 앉아 자신감 없는 표정으로 영어 교과서를 바라보고 있는 모습.
걱정스럽고 불안한 표정. 따뜻한 자연광 조명. 얕은 피사계 심도.
배경은 흐릿한 교실. 색감은 차분하고 채도 낮은 톤.
텍스트나 글자는 절대 포함하지 마세요.
세로형 구도 (3:4 비율)`,
    config: { numberOfImages: 1, aspectRatio: '3:4' },
  });

  if (response.generatedImages?.length > 0) {
    const imgPath = join(TEMP_DIR, 'bg-02-unconfident.png');
    const buffer = Buffer.from(response.generatedImages[0].image.imageBytes, 'base64');
    await writeFile(imgPath, buffer);
    card2.bg_image_url = imgPath;
    console.log(`  ✅ 이미지 생성 완료: ${imgPath}`);
  } else {
    console.log('  ⚠️ Imagen 이미지 생성 실패');
  }
} catch (err) {
  console.log(`  ⚠️ Imagen 오류: ${err.message}`);
}

// 카드 2 HTML 수정: 상단에 배경 이미지 삽입
if (card2.bg_image_url && card2.generated_html) {
  const bgDataUri = await toDataUri(card2.bg_image_url);
  let html = card2.generated_html;

  // body 바로 뒤에 배경 이미지 섹션 삽입
  const imageSection = `
<div style="width:1080px; height:540px; overflow:hidden; position:relative;">
  <img src="${bgDataUri}" style="width:100%; height:100%; object-fit:cover; filter:brightness(0.85);" />
</div>`;

  // 기존 이미지/배경 제거하고 상단에 새 이미지 삽입
  // body 시작 직후에 삽입
  html = html.replace(/(<body[^>]*>)/i, `$1\n${imageSection}`);

  card2.generated_html = html;
  console.log('  ✅ 카드 2 HTML에 이미지 삽입 완료');
}
console.log('');

// ── Step 4: 카드 6 — 수업사진 하단 배경 흐리게 ──
console.log('── Step 4: 카드 6 — 수업사진 하단 배경 ──');
const card6 = copyData.cards.find(c => c.number === 6);

if (driveImages['톡톡_수업사진0'] && card6.generated_html) {
  const bgDataUri = await toDataUri(driveImages['톡톡_수업사진0'].url);
  let html = card6.generated_html;

  const blurredBg = `
<div style="position:absolute; bottom:0; left:0; width:1080px; height:450px; overflow:hidden; z-index:0;">
  <img src="${bgDataUri}" style="width:100%; height:100%; object-fit:cover; filter:blur(4px) brightness(0.7); transform:scale(1.05);" />
  <div style="position:absolute; top:0; left:0; width:100%; height:100%; background:linear-gradient(to bottom, var(--color-background, #FFF8F5) 0%, transparent 30%);"></div>
</div>`;

  // body의 첫 번째 자식 div에 position:relative 보장 후 하단에 삽입
  html = html.replace('</body>', blurredBg + '\n</body>');

  card6.generated_html = html;
  console.log('  ✅ 카드 6 하단 블러 배경 삽입 완료');
} else {
  console.log('  ⚠️ 카드 6 수업사진 없음, 스킵');
}
console.log('');

// ── Step 5: 카드 7 — 사진 하단 흐리게 삽입 ──
console.log('── Step 5: 카드 7 — 사진 하단 배경 ──');
const card7 = copyData.cards.find(c => c.number === 7);

if (driveImages['IMG_20251119_111052'] && card7.generated_html) {
  const bgDataUri = await toDataUri(driveImages['IMG_20251119_111052'].url);
  let html = card7.generated_html;

  const blurredBg = `
<div style="position:absolute; bottom:0; left:0; width:1080px; height:450px; overflow:hidden; z-index:0;">
  <img src="${bgDataUri}" style="width:100%; height:100%; object-fit:cover; filter:blur(4px) brightness(0.7); transform:scale(1.05);" />
  <div style="position:absolute; top:0; left:0; width:100%; height:100%; background:linear-gradient(to bottom, rgba(255,255,255,0.95) 0%, transparent 35%);"></div>
</div>`;

  html = html.replace('</body>', blurredBg + '\n</body>');

  card7.generated_html = html;
  console.log('  ✅ 카드 7 하단 블러 배경 삽입 완료');
} else {
  console.log('  ⚠️ 카드 7 사진 없음, 스킵');
}
console.log('');

// ── Step 6: 카드 8 — 대회수상 사진으로 교체 ──
console.log('── Step 6: 카드 8 — 대회수상 사진 교체 ──');
const card8 = copyData.cards.find(c => c.number === 8);

if (driveImages['대회수상'] && card8.generated_html) {
  const bgDataUri = await toDataUri(driveImages['대회수상'].url);
  let html = card8.generated_html;

  // 기존 bg_image_url 교체
  card8.bg_image_url = driveImages['대회수상'].url;
  card8.image_url = driveImages['대회수상'].url;

  // HTML에 상단 배경 이미지 삽입 (타이틀 위에)
  const imageSection = `
<div style="width:1080px; height:500px; overflow:hidden; position:relative;">
  <img src="${bgDataUri}" style="width:100%; height:100%; object-fit:cover;" />
  <div style="position:absolute; bottom:0; left:0; width:100%; height:120px; background:linear-gradient(transparent, var(--color-background, #FFF8F5));"></div>
</div>`;

  html = html.replace(/(<body[^>]*>)/i, `$1\n${imageSection}`);

  card8.generated_html = html;
  console.log('  ✅ 카드 8 대회수상 사진 삽입 완료');
} else {
  console.log('  ⚠️ 카드 8 대회수상 사진 없음, 스킵');
}
console.log('');

// ── Step 7: 전체 카드 "톡톡 잉글리쉬" 텍스트 → 로고 대체 정리 ──
console.log('── Step 7: "톡톡 잉글리쉬" 텍스트 정리 ──');
let textCleanCount = 0;
for (const card of copyData.cards) {
  if (!card.generated_html) continue;
  let html = card.generated_html;
  const before = html;

  // "톡톡 잉글리쉬" 텍스트가 단독으로 있는 태그 제거 (로고가 대신 들어가므로)
  // 패턴: <tag ...>톡톡 잉글리쉬</tag> 또는 <tag ...> 톡톡 잉글리쉬 </tag>
  html = html.replace(/<(span|div|p|footer|section)[^>]*>\s*톡톡\s*잉글리쉬\s*<\/\1>/gi, '');

  // "톡톡 잉글리쉬" 텍스트가 다른 내용과 함께 있는 경우 텍스트만 제거
  // (예: "톡톡 잉글리쉬 | 6/10" → "| 6/10")
  html = html.replace(/톡톡\s*잉글리쉬\s*\|?\s*/g, '');

  // 남은 단독 "톡톡 잉글리쉬" 텍스트 제거
  html = html.replace(/톡톡\s*잉글리쉬/g, '');

  if (html !== before) {
    card.generated_html = html;
    textCleanCount++;
  }
}
console.log(`  ✅ ${textCleanCount}장 카드에서 텍스트 정리 완료\n`);

// ── Step 8: copy.json 저장 ──
await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('── Step 8: copy.json 저장 완료 ──\n');

// ── Step 9: PNG 렌더링 ──
console.log('── Step 9: PNG 렌더링 ──');
console.log(`  출력 폴더: ${OUTPUT_DIR}`);
const { htmlSources } = await renderCards(copyData.cards, cssVariables, academy.name, OUTPUT_DIR, ACADEMY_KEY);
console.log('');

// ── Step 10: 노션 업로드 ──
console.log('── Step 10: 노션 업로드 ──');

const searchStatuses = ['디자인 수정', '디자인 1차', '제작 요청', '기획 컨펌', '기획컨펌대기', '원고작업'];
let targetPage = null;

for (const status of searchStatuses) {
  try {
    const pages = await getByStatus(status);
    const found = pages.find(p =>
      p.title.includes('톡톡3-2') ||
      p.title.includes('톡톡 3-2')
    );
    if (found) {
      targetPage = found;
      console.log(`  페이지 발견: "${found.title}" (상태: ${status})`);
      break;
    }
  } catch (err) { /* skip */ }
}

if (targetPage) {
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
  console.log(`  ✅ PNG ${pngPaths.length}장 노션 업로드 완료`);
} else {
  console.log('  ⚠️ 톡톡 3-2 노션 페이지를 찾을 수 없습니다');
}

await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('\n═══ 완료! ═══');
