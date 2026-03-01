import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROMPTS_DIR = join(__dirname, '..', 'prompts');
const CONFIG_DIR = join(__dirname, '..', 'config');

/**
 * 파일을 안전하게 읽기 (없으면 빈 문자열)
 */
async function safeReadFile(filePath) {
  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return '';
  }
}

/**
 * 시스템 프롬프트 조립
 * Phase 0~3 산출물 파일을 읽어 플레이스홀더 치환
 */
export async function buildSystemPrompt(academyKey, academyConfig, options = {}) {
  let template = await readFile(join(PROMPTS_DIR, 'gemini-designer-system.txt'), 'utf-8');

  // {{BRAND_STRATEGY}} — 브랜드 전략서 요약 (전체 전달 시 토큰 낭비이므로 핵심만)
  const strategy = await safeReadFile(join(CONFIG_DIR, 'brand', `${academyKey}-strategy.md`));
  const strategySection = strategy
    ? `\n## 브랜드 전략 요약\n무드: ${academyConfig.mood?.join(', ') || ''}\n지역: ${academyConfig.region || ''}\n과목: ${academyConfig.subject || ''}\n대상: ${academyConfig.grade?.join(', ') || ''}\n`
    : '';
  template = template.replace('{{BRAND_STRATEGY}}', strategySection);

  // {{VOICE_GUIDE}} — 보이스 가이드 핵심 규칙만 추출
  const voice = await safeReadFile(join(CONFIG_DIR, 'brand', `${academyKey}-voice.md`));
  const voiceSection = voice
    ? '\n## 보이스 규칙\n- 카드뉴스 본문에 이모지 금지\n- 헤드라인 30자 이내, <em> 태그 1~2개만\n- 과장·공격 표현 금지, 구체 수치 우선\n'
    : '';
  template = template.replace('{{VOICE_GUIDE}}', voiceSection);

  // {{DESIGN_TOKENS}} — 토큰 중 Gemini에 필요한 부분만
  const tokensRaw = await safeReadFile(join(CONFIG_DIR, 'tokens', `${academyKey}-tokens.json`));
  let tokensSection = '';
  if (tokensRaw) {
    try {
      const tokens = JSON.parse(tokensRaw);
      tokensSection = `\n## 디자인 토큰\n- 타이포: display=${tokens.typography.size.display}px, h1=${tokens.typography.size.h1}px, h2=${tokens.typography.size.h2}px, body=${tokens.typography.size.body}px\n- safe-area: ${tokens.spacing.canvas.safe_area}px\n- shadow: subtle=${tokens.effects.shadow.subtle}\n- radius: sm=${tokens.effects.radius.sm}px, md=${tokens.effects.radius.md}px\n`;
    } catch { /* ignore parse errors */ }
  }
  template = template.replace('{{DESIGN_TOKENS}}', tokensSection);

  // {{PATTERN_CATALOG}} — 패턴 카탈로그 요약
  const catalogRaw = await safeReadFile(join(CONFIG_DIR, 'patterns', 'catalog.json'));
  let catalogSection = '';
  if (catalogRaw) {
    try {
      const catalog = JSON.parse(catalogRaw);
      const gridNames = Object.keys(catalog.grids || {}).join(', ');
      catalogSection = `\n## 사용 가능 그리드\n${gridNames}\n`;
    } catch { /* ignore */ }
  }
  template = template.replace('{{PATTERN_CATALOG}}', catalogSection);

  // {{EMOTION_TARGET}} — 감정곡선 (카드별 유저 프롬프트에서 구체적으로 전달하므로 시스템엔 개요만)
  const emotionRaw = await safeReadFile(join(CONFIG_DIR, 'brand', 'emotion-curve.json'));
  let emotionSection = '';
  if (emotionRaw) {
    try {
      const emotion = JSON.parse(emotionRaw);
      emotionSection = '\n## 감정곡선 개요\n각 카드는 정해진 감정 목표가 있습니다. 유저 프롬프트의 감정 목표를 참고하여 비주얼 톤을 조절하세요.\n';
    } catch { /* ignore */ }
  }
  template = template.replace('{{EMOTION_TARGET}}', emotionSection);

  // {{SERIES_DNA}} — 시리즈 DNA (Phase 5에서 동적 주입, 여기선 빈 문자열)
  const seriesDNA = options.seriesDNA || '';
  template = template.replace('{{SERIES_DNA}}', seriesDNA);

  return template;
}

/**
 * 카드별 유저 프롬프트 조립
 */
export async function buildCardPrompt(card, cssVariables, academyConfig, usedLayouts, options = {}) {
  let template = await readFile(join(PROMPTS_DIR, 'gemini-card-user.txt'), 'utf-8');

  // {{CSS_VARIABLES}}
  template = template.replace('{{CSS_VARIABLES}}', cssVariables);

  // {{ACADEMY_NAME}}
  template = template.replace('{{ACADEMY_NAME}}', academyConfig.name || '');

  // {{CARD_FIELDS}}
  const fields = [
    `카드 번호: ${card.number} / 10`,
    `카드 타입: ${card.type}`,
    `레이아웃 힌트: ${card.layout_hint || '자유'}`,
    `헤드라인: ${card.headline || ''}`,
    `서브텍스트: ${card.subtext || ''}`,
    card.body ? `본문: ${card.body}` : null,
    card.stat ? `핵심 숫자: ${card.stat}` : null,
    card.stat_label ? `숫자 설명: ${card.stat_label}` : null,
    `강조 스타일: ${card.emphasis_style || 'highlight'}`,
    card.icon ? `아이콘: ${card.icon}` : null,
    card.quote_main ? `인용문: "${card.quote_main}"` : null,
    card.quote_sub ? `인용 응답: "${card.quote_sub}"` : null,
    card.cta_text ? `CTA 버튼: ${card.cta_text}` : null,
    card.cta_sub ? `CTA 설명: ${card.cta_sub}` : null,
    card.items ? `항목: ${JSON.stringify(card.items)}` : null,
    card.steps ? `단계: ${JSON.stringify(card.steps)}` : null,
    card.before_title ? `비교 좌측: ${card.before_title}` : null,
    card.after_title ? `비교 우측: ${card.after_title}` : null,
    card.before_items ? `좌측 항목: ${card.before_items}` : null,
    card.after_items ? `우측 항목: ${card.after_items}` : null,
  ].filter(Boolean).join('\n');
  template = template.replace('{{CARD_FIELDS}}', fields);

  // {{BG_INSTRUCTION}}
  let bgInstruction;
  if (card.bg_image_url) {
    bgInstruction = `배경 이미지 URL: ${card.bg_image_url}\n→ background-image: url('${card.bg_image_url}')로 사용하고, 텍스트 가독성을 위해 반투명 오버레이를 추가하세요.`;
  } else {
    bgInstruction = `배경 이미지: 없음\n→ CSS 그라디언트로 아름다운 배경을 만드세요. 브랜드 컬러(var(--color-primary), var(--color-secondary))를 활용하세요.`;
  }
  template = template.replace('{{BG_INSTRUCTION}}', bgInstruction);

  // {{EMOTION_INFO}} — 감정곡선에서 해당 카드 정보 추출
  let emotionInfo = '없음';
  try {
    const emotionRaw = await safeReadFile(join(CONFIG_DIR, 'brand', 'emotion-curve.json'));
    if (emotionRaw) {
      const emotion = JSON.parse(emotionRaw);
      const cardCurve = emotion.curve.find(c => c.card === card.number);
      if (cardCurve) {
        emotionInfo = `감정: ${cardCurve.emotion} (강도 ${cardCurve.intensity}/10) — ${cardCurve.description}`;
      }
    }
  } catch { /* ignore */ }
  template = template.replace('{{EMOTION_INFO}}', emotionInfo);

  // {{LAYOUT_HISTORY}}
  const layoutHistory = usedLayouts.length > 0
    ? `이미 사용한 레이아웃: [${usedLayouts.join(', ')}]\n→ 반드시 위와 다른 레이아웃을 사용하세요.`
    : '아직 사용한 레이아웃이 없습니다. 자유롭게 디자인하세요.';
  template = template.replace('{{LAYOUT_HISTORY}}', layoutHistory);

  return template;
}
