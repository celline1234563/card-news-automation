import { GoogleGenAI } from '@google/genai';
import { writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMP_DIR = join(__dirname, '..', 'temp');

let _ai = null;
function getClient() {
  if (!_ai) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY가 .env에 설정되지 않았습니다.');
    }
    _ai = new GoogleGenAI({ apiKey });
  }
  return _ai;
}

/**
 * 카드 정보로 이미지 생성 프롬프트 구성
 */
function buildImagePrompt(card, academyConfig) {
  const mood = card.type === 'hook' ? '임팩트 있는, 시선을 사로잡는'
    : card.type === 'cta' ? '따뜻하고 신뢰감 있는, 행동을 유도하는'
    : card.type === 'data' ? '깔끔하고 전문적인, 데이터 시각화에 적합한'
    : card.type === 'problem' ? '공감을 자아내는, 학부모의 고민을 담은'
    : card.type === 'solution' ? '밝고 희망적인, 해결의 느낌'
    : '미니멀하고 따뜻한';

  return `한국 학원 인스타그램 카드뉴스 배경 이미지.
주제: ${card.headline?.replace(/<[^>]+>/g, '') || '교육'}
카테고리: ${card.image_category || '교육'}
무드: ${mood}
스타일: 미니멀, 따뜻한 조명, 부드러운 색감
중요: 텍스트 가독성을 위해 중앙 영역은 밝고 흐릿하게 처리. 텍스트나 글자는 절대 포함하지 마세요.
색감: ${academyConfig.theme.primary} 계열 톤
세로형 구도 (3:4 비율)`;
}

/**
 * 단일 카드의 배경 이미지 생성
 * @param {object} card - 카드 객체
 * @param {object} academyConfig - 학원 설정
 * @returns {string|null} 저장된 이미지 경로 또는 null
 */
export async function generateCardImage(card, academyConfig) {
  // image_category가 null이면 스킵
  if (!card.image_category) {
    return null;
  }

  await mkdir(TEMP_DIR, { recursive: true });

  const prompt = buildImagePrompt(card, academyConfig);
  const paddedNum = String(card.number).padStart(2, '0');
  const outputPath = join(TEMP_DIR, `bg-${paddedNum}.png`);

  try {
    const response = await getClient().models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '3:4',
      },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      console.warn(`  ⚠️  카드 ${paddedNum}: Imagen 응답에 이미지 없음. 스킵합니다.`);
      return null;
    }

    const imgBytes = response.generatedImages[0].image.imageBytes;
    const buffer = Buffer.from(imgBytes, 'base64');
    await writeFile(outputPath, buffer);

    return outputPath;
  } catch (err) {
    console.error(`  ⚠️  카드 ${paddedNum} 이미지 생성 실패: ${err.message}`);
    return null;
  }
}

/**
 * 전체 카드 배열에 대해 배경 이미지 생성
 * @param {object[]} cards - 카드 배열
 * @param {object} academyConfig - 학원 설정
 * @returns {object[]} bg_image_url이 업데이트된 카드 배열
 */
export async function generateAllImages(cards, academyConfig) {
  console.log('  🎨 Imagen 배경 이미지 생성 시작...');

  let generated = 0;
  let skipped = 0;

  for (const card of cards) {
    const paddedNum = String(card.number).padStart(2, '0');

    if (!card.image_category) {
      console.log(`  ⏭️  카드 ${paddedNum}: image_category 없음 → 스킵`);
      skipped++;
      continue;
    }

    console.log(`  🖼️  카드 ${paddedNum}: "${card.image_category}" 이미지 생성 중...`);
    const imagePath = await generateCardImage(card, academyConfig);

    if (imagePath) {
      card.bg_image_url = imagePath;
      generated++;
      console.log(`  ✅ 카드 ${paddedNum}: ${imagePath}`);
    } else {
      skipped++;
    }
  }

  console.log(`  🎨 이미지 생성 완료: ${generated}장 생성, ${skipped}장 스킵`);
  return cards;
}
