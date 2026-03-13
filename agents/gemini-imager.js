import { GoogleGenAI } from '@google/genai';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMP_DIR = join(__dirname, '..', 'temp');
const IMAGER_PROMPT_PATH = join(__dirname, '..', 'prompts', 'imager-system.txt');

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
 * imager-system.txt 파싱: 카드 타입별 무드 맵 + 공통 설정 추출
 */
let _imagerConfig = null;
async function loadImagerConfig() {
  if (_imagerConfig) return _imagerConfig;

  let raw;
  try {
    raw = await readFile(IMAGER_PROMPT_PATH, 'utf-8');
  } catch {
    // 파일 없으면 기본값 사용
    _imagerConfig = { moodMap: {}, style: '미니멀, 따뜻한 조명, 부드러운 색감', constraint: '텍스트 가독성을 위해 중앙 영역은 밝고 흐릿하게 처리. 텍스트나 글자는 절대 포함하지 마세요.' };
    return _imagerConfig;
  }

  // 카드 타입별 무드 테이블 파싱
  const moodMap = {};
  const tableLines = raw.match(/\| (\w+) \| (.+?) \|/g) || [];
  for (const line of tableLines) {
    const match = line.match(/\| (\w+) \| (.+?) \|/);
    if (match && match[1] !== 'type') {
      moodMap[match[1]] = match[2].trim();
    }
  }

  // 공통 스타일 추출
  const styleMatch = raw.match(/기본 스타일:\s*(.+)/);
  const style = styleMatch ? styleMatch[1].trim() : '미니멀, 따뜻한 조명, 부드러운 색감';

  // 금지/필수 사항 추출
  const constraintMatch = raw.match(/필수:\s*(.+)/);
  const forbidMatch = raw.match(/금지:\s*(.+)/);
  const constraint = [
    constraintMatch ? constraintMatch[1].trim() : '',
    forbidMatch ? forbidMatch[1].trim() : '',
  ].filter(Boolean).join('. ');

  _imagerConfig = { moodMap, style, constraint };
  return _imagerConfig;
}

/**
 * 카드 정보로 이미지 생성 프롬프트 구성
 */
async function buildImagePrompt(card, academyConfig) {
  const config = await loadImagerConfig();
  const mood = config.moodMap[card.type] || '미니멀하고 따뜻한';

  return `한국 학원 인스타그램 카드뉴스용 사진.
피사체: ${card.image_category || '교육 관련 오브젝트'}
무드: ${mood}
스타일: ${config.style}. 피사체 하나에 집중. 깨끗한 배경.
색감: ${academyConfig.theme.primary} 계열 톤, 채도 낮은 차분한 색감
중요: ${config.constraint}. 피사체가 중앙에 명확하게.
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

  const prompt = await buildImagePrompt(card, academyConfig);
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

    // Drive 실사진이 이미 매칭된 카드는 Imagen 생성 스킵
    if (card.bg_image_url || card.image_url) {
      console.log(`  ⏭️  카드 ${paddedNum}: Drive 실사진 이미 매칭됨 → Imagen 스킵`);
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
