import { injectCard, loadTemplate } from '../templates/inject.js';

/**
 * 카드 type + layout_hint → 최적 템플릿 선택 매핑
 */
const TYPE_TEMPLATE_MAP = {
  hook:    ['cover-bold', 'cover-basic', 'cover-photo'],
  empathy: ['basic-speech', 'cover-basic', 'basic-info'],
  problem: ['basic-speech', 'cover-basic', 'basic-info'],
  data:    ['basic-stat', 'basic-step-number', 'basic-list'],
  info:    ['basic-step-number', 'basic-list', 'basic-info'],
  detail:  ['basic-compare', 'basic-info', 'cover-photo'],
  compare: ['basic-compare', 'basic-list'],
  solution:['basic-step-number', 'basic-list', 'basic-info'],
  example: ['basic-info', 'basic-list', 'basic-speech'],
  review:  ['basic-speech', 'cover-photo', 'basic-info'],
  summary: ['basic-list', 'basic-info', 'basic-step-number'],
  cta:     ['basic-cta', 'cover-bold'],
};

/**
 * 특수 조건 우선순위 체크 — 데이터 기반으로 최적 템플릿 결정
 * @returns {{ name: string, forced: boolean } | null}
 *   forced=true: 데이터 형식상 이 템플릿만 가능 (중복 허용)
 *   forced=false: 선호하지만 대체 가능
 */
function getSpecialOverride(card) {
  // stat이 있으면 stat 템플릿 강제
  if (card.stat) return { name: 'basic-stat', forced: true };
  // before/after 데이터가 있으면 compare 강제
  if (card.before_items || card.after_items || card.before_title) return { name: 'basic-compare', forced: true };
  // quote 데이터가 있으면 speech 강제
  if (card.quote_main) return { name: 'basic-speech', forced: true };
  // cta 데이터가 있으면 cta 강제
  if (card.cta_text) return { name: 'basic-cta', forced: true };
  // steps 배열이 있으면 step-number 강제
  if (card.steps && Array.isArray(card.steps) && card.steps.length > 0) return { name: 'basic-step-number', forced: true };
  // items 배열 체크 — 객체(icon/title/desc)면 info 강제, 문자열이면 list 강제
  if (card.items && Array.isArray(card.items) && card.items.length > 0) {
    if (typeof card.items[0] === 'object') return { name: 'basic-info', forced: true };
    return { name: 'basic-list', forced: true };
  }
  // bg_image_url이 있고 hook이면 photo 선호 (대체 가능)
  if (card.bg_image_url && card.type === 'hook') return { name: 'cover-photo', forced: false };
  return null;
}

/**
 * 카드 데이터 → 최적 템플릿 선택 + 플레이스홀더 주입
 *
 * @param {Object} card - 카드 데이터 (researcher.js 출력)
 * @param {Object} academyConfig - { name, theme }
 * @param {string[]} usedTemplates - 이미 사용한 템플릿 목록
 * @returns {Promise<{ html: string, templateUsed: string }>}
 */
export async function select(card, academyConfig, usedTemplates = []) {
  const type = card.type || 'info';
  const candidates = TYPE_TEMPLATE_MAP[type] || TYPE_TEMPLATE_MAP.info;

  // 0. 비교 데이터 자동 파싱 (템플릿 선택 전에 실행)
  if (!card.before_items && !card.after_items && (card.layout_hint === 'compare' || card.layout_hint === 'two-column')) {
    parseCompareFromText(card);
  }

  // 1. 특수 조건 체크
  const override = getSpecialOverride(card);

  // 2. 템플릿 선택
  let templateName = null;

  if (override) {
    if (override.forced) {
      // 데이터 형식 강제 — 중복이어도 이 템플릿 사용
      templateName = override.name;
    } else if (!usedTemplates.includes(override.name)) {
      templateName = override.name;
    }
  }

  if (!templateName) {
    // 후보군에서 사용하지 않은 첫 번째 선택
    for (const candidate of candidates) {
      if (!usedTemplates.includes(candidate)) {
        templateName = candidate;
        break;
      }
    }
  }

  // 3. 모든 후보가 사용됐으면 첫 번째 후보 사용 (중복 허용)
  if (!templateName) {
    templateName = (override && override.name) || candidates[0];
  }

  // 4. 템플릿 로드
  const htmlTemplate = await loadTemplate(templateName);

  // 5. 카드 데이터를 플레이스홀더 형식으로 변환
  const cardData = mapCardToPlaceholders(card);

  // 6. 주입
  const html = injectCard(htmlTemplate, cardData, academyConfig);

  console.log(`  카드 ${String(card.number).padStart(2, '0')}: ${templateName} 템플릿 적용`);

  return { html, templateUsed: templateName };
}

/**
 * subtext에 비교 데이터가 텍스트로 포함된 경우 구조화
 * 예: "일반 학원:\n❌ 항목1\n올인원:\n✅ 항목2"
 */
function parseCompareFromText(card) {
  const text = card.subtext || card.body || '';
  // 비교 패턴 감지: "A:\n항목\nB:\n항목" 형식
  const comparePattern = /(.+?):\s*\n([\s\S]*?)\n\n?(.+?):\s*\n([\s\S]*?)$/;
  const match = text.match(comparePattern);
  if (!match) return;

  const [, title1, items1, title2, items2] = match;
  const parseItems = (str) => str.split('\n').filter(l => l.trim()).map(l => l.replace(/^[❌✅⊗◉●○✓✗☑☐►▸]\s*/, '').trim()).filter(Boolean).join('<br>');

  card.before_title = title1.trim();
  card.before_items = parseItems(items1);
  card.after_title = title2.trim();
  card.after_items = parseItems(items2);
  // subtext를 헤드라인 아래 설명으로 사용할 첫 줄 추출
  const firstLine = text.split('\n')[0];
  if (firstLine && !firstLine.includes(':')) {
    card.subtext = firstLine;
  } else {
    card.subtext = '';
  }
}

/**
 * researcher.js 카드 구조 → 템플릿 플레이스홀더 매핑
 */
function mapCardToPlaceholders(card) {
  const data = {
    headline: card.headline || '',
    subtext: card.subtext || '',
    body: card.body || '',
    stat: card.stat || '',
    stat_label: card.stat_label || '',
    cta_text: card.cta_text || '',
    cta_sub: card.cta_sub || '',
    image_url: card.image_url || '',
    bg_image_url: card.bg_image_url || '',
    tag: card.tag || '',
    quote_main: card.quote_main || '',
    quote_sub: card.quote_sub || '',
    sender: card.sender || '',
    before_title: card.before_title || '',
    before_items: card.before_items || '',
    after_title: card.after_title || '',
    after_items: card.after_items || '',
    number: card.number,
    emphasis_style: card.emphasis_style || 'highlight',
  };

  // items 배열 → item_1~item_6
  if (card.items && Array.isArray(card.items)) {
    card.items.forEach((item, i) => {
      data[`item_${i + 1}`] = typeof item === 'string' ? item : (item.text || item.title || '');
      if (typeof item === 'object') {
        data[`item_title_${i + 1}`] = item.title || '';
        data[`item_desc_${i + 1}`] = item.desc || item.description || '';
        data[`icon_${i + 1}`] = item.icon || '';
      }
    });
  }

  // steps 배열 → step_title_1~4, step_desc_1~4
  if (card.steps && Array.isArray(card.steps)) {
    card.steps.forEach((step, i) => {
      data[`step_title_${i + 1}`] = typeof step === 'string' ? step : (step.title || '');
      data[`step_desc_${i + 1}`] = typeof step === 'object' ? (step.desc || step.description || '') : '';
    });
  }

  // 이미 flat한 step_title_N, item_title_N 필드가 있는 경우 직접 사용
  for (let i = 1; i <= 6; i++) {
    if (card[`item_${i}`]) data[`item_${i}`] = card[`item_${i}`];
    if (card[`item_title_${i}`]) data[`item_title_${i}`] = card[`item_title_${i}`];
    if (card[`item_desc_${i}`]) data[`item_desc_${i}`] = card[`item_desc_${i}`];
    if (card[`icon_${i}`]) data[`icon_${i}`] = card[`icon_${i}`];
  }
  for (let i = 1; i <= 4; i++) {
    if (card[`step_title_${i}`]) data[`step_title_${i}`] = card[`step_title_${i}`];
    if (card[`step_desc_${i}`]) data[`step_desc_${i}`] = card[`step_desc_${i}`];
  }

  return data;
}

/**
 * 전체 카드 배열 처리
 */
export async function selectAll(cards, academyConfig) {
  const usedTemplates = [];
  const results = [];

  console.log('\n📐 템플릿 선택 시작...');

  for (const card of cards) {
    const result = await select(card, academyConfig, usedTemplates);
    usedTemplates.push(result.templateUsed);
    card.generated_html = result.html;
    card.layout_used = result.templateUsed;
    results.push(result);
  }

  console.log(`✅ 템플릿 선택 완료: ${results.length}장\n`);
  return results;
}
