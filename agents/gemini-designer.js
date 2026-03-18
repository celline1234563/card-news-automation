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

  // 레퍼런스 이미지가 있으면 multimodal contents로 변환
  let contents;
  const refs = options.referenceImages || (options.referenceImage ? [options.referenceImage] : []);
  if (refs.length > 0) {
    const parts = [];
    for (let i = 0; i < refs.length; i++) {
      parts.push({ inlineData: { data: refs[i].base64, mimeType: refs[i].mimeType } });
    }
    const refCount = refs.length;
    parts.push({
      text: `[위 ${refCount}장은 실제 운영 중인 카드뉴스 레퍼런스입니다.]

★★★ 핵심 지시: 위 레퍼런스와 동일한 수준의 퀄리티를 만드세요 ★★★
- 타이포그래피: 레퍼런스처럼 헤드라인을 화면의 50~60%를 차지하도록 초대형으로
- 컬러 블로킹: 레퍼런스처럼 과감한 단색 풀배경 + 대비되는 텍스트 색상
- 레이아웃: 레퍼런스처럼 콘텐츠가 화면을 꽉 채우고, 빈 공간이 거의 없게
- 비주얼 밀도: 레퍼런스처럼 장식 요소(기하학 도형, 큰 아이콘 배지)로 화면을 풍성하게
- 브랜드 바: 레퍼런스처럼 하단에 학원명/로고 영역 확실히 배치
- 대비: 레퍼런스처럼 제목과 부제의 크기 차이가 극단적으로 크게

절대 "밋밋한 단색 배경 + 작은 글씨 + 큰 여백" 디자인을 만들지 마세요.
레퍼런스 수준에 못 미치면 실패입니다.

${userPrompt}`,
    });
    contents = parts;
  } else {
    contents = userPrompt;
  }

  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await getClient().models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      console.log(`  ⚠️ 카드 ${card.number}: Gemini 응답이 비어있음 (시도 ${attempt}/${maxRetries})`);
      if (attempt === maxRetries) {
        throw new Error(`Gemini 응답이 비어있습니다 (카드 ${card.number}). 안전 필터에 의해 차단되었을 수 있습니다.`);
      }
      await new Promise(r => setTimeout(r, 5000));
      continue;
    }

    try {
      return extractHTML(responseText);
    } catch (e) {
      console.log(`  ⚠️ 카드 ${card.number}: HTML 추출 실패 (시도 ${attempt}/${maxRetries})`);
      if (attempt === maxRetries) throw e;
      await new Promise(r => setTimeout(r, 5000));
    }
  }
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
