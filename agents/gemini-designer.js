import { GoogleGenAI } from '@google/genai';
import { buildSystemPrompt, buildCardPrompt } from './prompt-builder.js';

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
 * Gemini 응답에서 HTML 코드블록 추출
 */
function extractHTML(responseText) {
  const match = responseText.match(/```html\s*([\s\S]*?)```/);
  if (!match) {
    throw new Error('Gemini 응답에서 ```html 코드블록을 찾을 수 없습니다.');
  }
  return match[1].trim();
}

/**
 * 단일 카드의 HTML 디자인 생성
 * @param {object} card - 카드 객체
 * @param {string} cssVariables - CSS 변수 블록
 * @param {object} academyConfig - 학원 설정
 * @param {string[]} usedLayouts - 이미 사용한 레이아웃 목록
 * @param {object} [options] - 추가 옵션
 * @param {string} [options.academyKey] - 학원 키
 * @param {string} [options.seriesDNA] - 시리즈 DNA 텍스트
 * @param {string} [options.systemPrompt] - 미리 빌드된 시스템 프롬프트
 * @returns {string} 완성된 HTML 문자열
 */
export async function designCard(card, cssVariables, academyConfig, usedLayouts = [], options = {}) {
  // Gemini에게는 배경 이미지가 있다는 사실만 알려주고, 플레이스홀더 사용 지시
  const cardForPrompt = { ...card };
  if (card.bg_image_url) {
    cardForPrompt.bg_image_url = '{{BG_IMAGE_URL}}';
  }

  const academyKey = options.academyKey || 'ollinone';

  // 시스템 프롬프트: 미리 빌드된 것이 있으면 재사용 (10장에 동일한 시스템 프롬프트 사용)
  const systemPrompt = options.systemPrompt || await buildSystemPrompt(academyKey, academyConfig, options);
  const userPrompt = await buildCardPrompt(cardForPrompt, cssVariables, academyConfig, usedLayouts, options);

  const response = await getClient().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
    },
  });

  const html = extractHTML(response.text);
  return html;
}

/**
 * 전체 카드 배열에 대해 HTML 디자인 생성
 * @param {object[]} cards - 카드 배열
 * @param {string} cssVariables - CSS 변수 블록
 * @param {object} academyConfig - 학원 설정
 * @param {object} [options] - 추가 옵션
 * @returns {object[]} generated_html, layout_used가 업데이트된 카드 배열
 */
export async function designAllCards(cards, cssVariables, academyConfig, options = {}) {
  console.log('  🎨 Gemini HTML 디자인 생성 시작...');

  const academyKey = options.academyKey || 'ollinone';

  // 시스템 프롬프트 한 번만 빌드
  const systemPrompt = await buildSystemPrompt(academyKey, academyConfig, options);

  const usedLayouts = [];

  for (const card of cards) {
    const paddedNum = String(card.number).padStart(2, '0');
    console.log(`  🖌️  카드 ${paddedNum}: 디자인 생성 중...`);

    const html = await designCard(card, cssVariables, academyConfig, usedLayouts, {
      ...options,
      academyKey,
      systemPrompt,
    });
    card.generated_html = html;

    // 사용한 레이아웃 기록
    const layoutLabel = card.layout_hint || `card-${paddedNum}`;
    card.layout_used = layoutLabel;
    usedLayouts.push(layoutLabel);

    console.log(`  ✅ 카드 ${paddedNum}: 디자인 완료 (레이아웃: ${layoutLabel})`);
  }

  console.log(`  🎨 전체 ${cards.length}장 디자인 생성 완료`);
  return cards;
}
