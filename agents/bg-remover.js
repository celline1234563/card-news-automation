import { readFile, writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join, basename, extname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMP_DIR = join(__dirname, '..', 'temp');

const REMOVEBG_API = 'https://api.remove.bg/v1.0/removebg';

/**
 * 로컬 이미지 파일 → 누끼 PNG
 * @param {string} imagePath - 원본 이미지 경로
 * @param {object} [options] - 추가 옵션
 * @param {string} [options.outputPath] - 출력 경로 (미지정 시 자동 생성)
 * @param {string} [options.size] - 'auto' | 'preview' | 'full' | '4k' (기본: auto)
 * @returns {string} 저장된 누끼 PNG 경로
 */
export async function removeBackground(imagePath, options = {}) {
  const apiKey = process.env.REMOVEBG_API_KEY;
  if (!apiKey) {
    throw new Error('REMOVEBG_API_KEY가 .env에 설정되지 않았습니다.');
  }

  const imageBuffer = await readFile(imagePath);
  const fileName = basename(imagePath, extname(imagePath));

  const formData = new FormData();
  formData.append('image_file', new Blob([imageBuffer]), basename(imagePath));
  formData.append('size', options.size || 'auto');

  const response = await fetch(REMOVEBG_API, {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`remove.bg API 실패 (${response.status}): ${errorBody}`);
  }

  await mkdir(TEMP_DIR, { recursive: true });
  const outputPath = options.outputPath || join(TEMP_DIR, `${fileName}-nobg.png`);

  const resultBuffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, resultBuffer);

  return outputPath;
}

/**
 * URL 이미지 → 누끼 PNG (Drive 이미지 등)
 * @param {string} imageUrl - 이미지 URL
 * @param {string} outputName - 출력 파일명 (확장자 제외)
 * @param {object} [options] - 추가 옵션
 * @returns {string} 저장된 누끼 PNG 경로
 */
export async function removeBackgroundFromUrl(imageUrl, outputName, options = {}) {
  const apiKey = process.env.REMOVEBG_API_KEY;
  if (!apiKey) {
    throw new Error('REMOVEBG_API_KEY가 .env에 설정되지 않았습니다.');
  }

  const formData = new FormData();
  formData.append('image_url', imageUrl);
  formData.append('size', options.size || 'auto');

  const response = await fetch(REMOVEBG_API, {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`remove.bg API 실패 (${response.status}): ${errorBody}`);
  }

  await mkdir(TEMP_DIR, { recursive: true });
  const outputPath = options.outputPath || join(TEMP_DIR, `${outputName}-nobg.png`);

  const resultBuffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, resultBuffer);

  return outputPath;
}

/**
 * 카드 배열에서 누끼가 필요한 이미지 처리
 * image_category가 '선생님사진', '학생사진', '인물' 등이면 자동 누끼
 * @param {object[]} cards - 카드 배열
 * @returns {object[]} cutout_image_url이 업데이트된 카드 배열
 */
const CUTOUT_CATEGORIES = new Set(['선생님사진', '학생사진', '인물', '원장님사진']);

export async function processAllCutouts(cards) {
  const apiKey = process.env.REMOVEBG_API_KEY;
  if (!apiKey) {
    console.log('  ⏭️  REMOVEBG_API_KEY 미설정 → 누끼 처리 스킵');
    return cards;
  }

  console.log('  ✂️  누끼 처리 시작...');
  let processed = 0;
  let skipped = 0;

  for (const card of cards) {
    const paddedNum = String(card.number).padStart(2, '0');

    // image_url(Drive 실사진)이 있고, 인물 카테고리인 경우만
    if (!card.image_url || !CUTOUT_CATEGORIES.has(card.image_category)) {
      skipped++;
      continue;
    }

    try {
      console.log(`  ✂️  카드 ${paddedNum}: "${card.image_category}" 누끼 처리 중...`);
      const cutoutPath = await removeBackgroundFromUrl(
        card.image_url,
        `card-${paddedNum}-cutout`,
      );
      card.cutout_image_url = cutoutPath;
      processed++;
      console.log(`  ✅ 카드 ${paddedNum}: 누끼 완료 → ${cutoutPath}`);
    } catch (err) {
      console.log(`  ⚠️  카드 ${paddedNum}: 누끼 실패 (${err.message}) → 원본 사용`);
      skipped++;
    }
  }

  console.log(`  ✂️  누끼 완료: ${processed}장 처리, ${skipped}장 스킵`);
  return cards;
}
