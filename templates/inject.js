import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * <em> 태그에 emphasis_style 클래스 추가
 */
function applyEmphasis(text, style) {
  if (!text) return '';
  return text.replace(/<em>/g, `<em class="${style || 'highlight'}">`);
}

/**
 * CSS 변수 블록의 값을 academyConfig.theme으로 교체
 */
function injectTheme(html, theme) {
  let result = html;
  const map = {
    '--color-primary': theme.primary,
    '--color-secondary': theme.secondary,
    '--color-background': theme.background,
    '--color-text': theme.text,
    '--color-highlight': theme.highlight,
    '--color-accent': theme.accent,
  };
  for (const [varName, value] of Object.entries(map)) {
    if (value) {
      // :root 블록 내부의 변수 선언 값 교체
      const regex = new RegExp(`(${varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*)([^;]+)`, 'g');
      result = result.replace(regex, `$1${value}`);
    }
  }
  return result;
}

/**
 * 플레이스홀더 교체
 */
function injectPlaceholders(html, data) {
  let result = html;

  // 기본 플레이스홀더
  const fields = [
    'headline', 'subtext', 'body', 'stat', 'stat_label',
    'cta_text', 'cta_sub', 'image_url', 'bg_image_url', 'bg_image_style',
    'academy_name', 'card_number', 'tag',
    'quote_main', 'quote_sub', 'sender',
    'before_title', 'before_items', 'after_title', 'after_items',
    'headline_sub',
  ];

  for (const field of fields) {
    const placeholder = `{{${field}}}`;
    const value = data[field] ?? '';
    result = result.replaceAll(placeholder, value);
  }

  // 번호 붙은 아이템들: item_1~item_6, step_title_1~4, step_desc_1~4, etc.
  for (let i = 1; i <= 6; i++) {
    result = result.replaceAll(`{{item_${i}}}`, data[`item_${i}`] ?? '');
    result = result.replaceAll(`{{item_title_${i}}}`, data[`item_title_${i}`] ?? '');
    result = result.replaceAll(`{{item_desc_${i}}}`, data[`item_desc_${i}`] ?? '');
    result = result.replaceAll(`{{icon_${i}}}`, data[`icon_${i}`] ?? '');
  }
  for (let i = 1; i <= 4; i++) {
    result = result.replaceAll(`{{step_title_${i}}}`, data[`step_title_${i}`] ?? '');
    result = result.replaceAll(`{{step_desc_${i}}}`, data[`step_desc_${i}`] ?? '');
    result = result.replaceAll(`{{bar_${i}_value}}`, data[`bar_${i}_value`] ?? '0');
    result = result.replaceAll(`{{bar_${i}_label}}`, data[`bar_${i}_label`] ?? '');
  }

  // 빈 플레이스홀더 정리 (남은 {{...}} 제거)
  result = result.replace(/\{\{[a-z_0-9]+\}\}/gi, '');

  return result;
}

/**
 * 메인 함수: 템플릿 HTML + 카드 데이터 + 학원 설정 → 완성된 HTML
 */
export function injectCard(htmlTemplate, cardData, academyConfig) {
  // 1. emphasis_style 적용
  const data = { ...cardData };
  if (data.headline) {
    data.headline = applyEmphasis(data.headline, data.emphasis_style);
  }

  // 2. bg_image_url → bg_image_style 변환
  if (data.bg_image_url) {
    data.bg_image_style = `background-image: url('${data.bg_image_url}');`;
  } else {
    data.bg_image_style = '';
  }

  // 3. 학원명 주입
  data.academy_name = data.academy_name || academyConfig?.name || '';

  // 4. 카드 번호 포맷
  if (data.number) {
    data.card_number = `${data.number} / 10`;
  }

  // 5. 플레이스홀더 교체
  let html = injectPlaceholders(htmlTemplate, data);

  // 6. bg_image_url 없으면 bg-area div 제거
  if (!data.bg_image_url) {
    html = html.replace(/<div class="bg-area"[^>]*><\/div>/g, '');
  }

  // 7. CSS 변수 값 교체
  if (academyConfig?.theme) {
    html = injectTheme(html, academyConfig.theme);
  }

  return html;
}

/**
 * 파일 경로에서 템플릿 읽기
 */
export async function loadTemplate(templateName) {
  const filePath = join(__dirname, `${templateName}.html`);
  return readFile(filePath, 'utf-8');
}
