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
    card.content_brief ? `★ 기획 의도 (반드시 따르세요): ${card.content_brief}` : null,
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
    card.deco_icons ? `장식 아이콘: ${JSON.stringify(card.deco_icons)} (배경 장식용 Lucide 아이콘, 120~200px, opacity 0.08~0.15)` : null,
    card.design_brief ? `디자인 브리프: ${card.design_brief}` : null,
    card.visual_asset ? `시각 자료 스펙: ${card.visual_asset}\n→ 위 스펙대로 표/차트/시각자료를 HTML/CSS로 정확히 구현하세요. 항목·수치·배치를 그대로 반영하세요.` : null,
    card.content_bullets ? `콘텐츠 방향:\n${card.content_bullets.map(b => `  • ${b}`).join('\n')}` : null,
  ].filter(Boolean).join('\n');
  template = template.replace('{{CARD_FIELDS}}', fields);

  // {{BG_INSTRUCTION}}
  let bgInstruction;
  if (card.cutout_image_url) {
    // 누끼 이미지가 있는 경우 (인물 컷아웃)
    bgInstruction = `누끼 이미지(배경 제거된 인물): ${card.cutout_image_url}
→ 인물 컷아웃을 카드 한쪽에 배치하세요 (우측 또는 하단)
→ 배경은 단색 (var(--color-primary) 다크 또는 var(--color-background) 라이트)
→ 텍스트는 인물 반대편에 배치
→ 리얼클래스 스타일 참고: 다크 배경 + 인물 컷아웃 + 포인트 텍스트
→ 인물 이미지에 overflow: hidden 적용, 이미지가 텍스트 영역 침범 금지`;
  } else if (card.bg_image_url) {
    bgInstruction = `배경 이미지 URL: ${card.bg_image_url}
★ 절대 규칙: 이미지 위에 텍스트 오버레이 금지! 반투명 오버레이도 금지!
→ 이미지 영역과 텍스트 영역을 물리적으로 분리하세요.
→ 방법 1: 상단 60% 이미지 영역 + 하단 40% 텍스트 영역 (단색 배경)
→ 방법 2: 좌측 50% 이미지 + 우측 50% 텍스트 (단색 배경)
→ 방법 3: 하단 40% 이미지 + 상단 60% 텍스트
→ 이미지 컨테이너: overflow:hidden; 으로 영역 고정
→ 텍스트 영역 배경: var(--color-background) 또는 #FFFFFF`;
  } else {
    bgInstruction = `배경 이미지: 없음
→ 아래 배경 전략 중 하나를 선택하세요:
→ 전략 A (다크): var(--color-primary) 풀배경 + 흰색 텍스트 — 임팩트 강함
→ 전략 B (라이트): var(--color-background) 또는 #FFFFFF + 다크 텍스트 — 깔끔
→ 전략 C (컬러 블록): 상단 var(--color-primary) + 하단 #FFFFFF 영역 분할
→ ❌ 금지: 그라데이션 남발, 여러 색 혼합, 무지개 배색`;
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
