import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Anthropic();
const MAX_RETRY = parseInt(process.env.MAX_DESIGN_RETRY || '2');

/**
 * QA 체크리스트 로드
 */
async function loadChecklist() {
  try {
    const raw = await readFile(join(__dirname, '..', 'config', 'qa', 'checklist.json'), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * HTML 코드 품질 검토 (Claude API)
 */
async function validateHTML(html, card) {
  const systemPromptPath = join(__dirname, '..', 'prompts', 'design-validator-system.txt');
  const systemPrompt = await readFile(systemPromptPath, 'utf-8');

  const htmlSnippet = html.length > 8000 ? html.substring(0, 8000) + '\n... (truncated)' : html;

  const userMessage = `아래 카드뉴스 HTML을 검토해주세요.

카드 번호: ${card.number}
카드 타입: ${card.type}
헤드라인: ${card.headline}

\`\`\`html
${htmlSnippet}
\`\`\``;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock) throw new Error('design-validator: 응답 없음');

  let jsonStr = textBlock.text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  return JSON.parse(jsonStr);
}

/**
 * 로컬 체크: 이미지 위 텍스트 오버레이 감지
 */
function checkImageTextSeparation(html, card) {
  // 1번 카드(표지)는 단색/그라디언트 배경 허용
  if (card.number === 1) return null;

  const issues = [];

  // background-image가 있는 요소에 직접 텍스트가 있는 패턴 감지
  // rgba 오버레이 + background-image 조합도 금지
  const hasBgImage = /background-image\s*:\s*url/i.test(html);
  const hasOverlay = /rgba\s*\([^)]+\)\s*,\s*url|url[^;]*\)\s*[^;]*rgba/i.test(html);

  if (hasBgImage && hasOverlay) {
    issues.push({
      check: 'image_text_separation',
      description: '배경 이미지 위에 오버레이+텍스트 감지 — 이미지와 텍스트 영역을 물리적으로 분리해야 합니다',
      line_hint: 'background-image + rgba overlay',
    });
  }

  // background: url(...) 뒤에 텍스트 요소가 직접 배치된 패턴
  if (hasBgImage) {
    // body에 background-image가 직접 있으면 거의 확실히 오버레이
    if (/body\s*\{[^}]*background-image\s*:\s*url/i.test(html)) {
      issues.push({
        check: 'image_text_separation',
        description: 'body에 배경 이미지가 직접 적용됨 — 이미지와 텍스트 영역을 분리하세요',
        line_hint: 'body { background-image: url(...) }',
      });
    }
  }

  return issues.length > 0 ? issues : null;
}

/**
 * 로컬 체크: 컬러 2가지 제한
 */
function checkColorLimit(html) {
  const issues = [];

  // CSS 변수 사용 추출
  const varMatches = [...html.matchAll(/var\(--color-([^)]+)\)/g)];
  const usedColorVars = new Set(varMatches.map(m => m[1]));

  // secondary와 accent를 동시에 사용하면 위반
  if (usedColorVars.has('secondary') && usedColorVars.has('accent')) {
    issues.push({
      check: 'color_limit',
      description: 'var(--color-secondary)와 var(--color-accent) 동시 사용 — 컬러 2가지 제한 위반',
      line_hint: '--color-secondary + --color-accent',
    });
  }

  // hex 직접 사용 체크 (허용: #FFFFFF, #ffffff, #fff, #111111, #000000, #000)
  const hexMatches = [...html.matchAll(/#([0-9a-fA-F]{3,8})\b/g)];
  const allowedHex = new Set(['ffffff', 'fff', '111111', '000000', '000', '111', 'FFFFFF', 'FFF']);
  for (const m of hexMatches) {
    const hex = m[1].toLowerCase();
    // :root 정의 안의 hex는 허용
    if (allowedHex.has(hex)) continue;
    // :root { } 블록 안에 있는지 체크 (간단한 휴리스틱)
    const idx = m.index;
    const before = html.substring(Math.max(0, idx - 200), idx);
    if (/:root\s*\{/.test(before) && !before.includes('}')) continue;
    issues.push({
      check: 'color_limit',
      description: `#${m[1]} hex 직접 사용 — var(--color-xxx) 변수를 사용하세요`,
      line_hint: m[0],
    });
  }

  return issues.length > 0 ? issues : null;
}

/**
 * 로컬 체크: 여백 검증 (강화)
 */
function checkSpacing(html, checklist) {
  const minPadding = checklist?.checks?.token_spacing?.min_padding || 40;
  const issues = [];

  // padding 값 추출 (em 태그 내부 padding은 제외)
  const padMatches = html.matchAll(/padding\s*:\s*(\d+)px/g);
  for (const m of padMatches) {
    const pad = parseInt(m[1]);
    if (pad < minPadding && pad > 0) {
      // em 태그 CSS 블록 안의 padding은 하이라이트용이므로 제외 (500자 lookback)
      const before = html.substring(Math.max(0, m.index - 500), m.index);
      if (/\bem\b[^{]*\{[^}]*$/.test(before)) continue;
      issues.push({
        check: 'spacing',
        description: `padding ${pad}px가 최소 여백(${minPadding}px) 미만 — 여백이 부족하면 구린 디자인`,
        line_hint: m[0],
      });
    }
  }

  // margin 값도 체크 (외곽 여백)
  const marginMatches = html.matchAll(/margin\s*:\s*(\d+)px/g);
  for (const m of marginMatches) {
    const margin = parseInt(m[1]);
    if (margin < 20 && margin > 0) {
      issues.push({
        check: 'spacing',
        description: `margin ${margin}px가 너무 작음`,
        line_hint: m[0],
      });
    }
  }

  return issues.length > 0 ? issues : null;
}

/**
 * 로컬 체크: 토큰 폰트 사이즈 검증
 */
function checkTokenFontSize(html, checklist) {
  if (!checklist?.checks?.token_font_size) return null;
  const config = checklist.checks.token_font_size;
  const issues = [];

  const fontMatches = html.matchAll(/font-size\s*:\s*(\d+)px/g);
  for (const m of fontMatches) {
    const size = parseInt(m[1]);
    const isAllowed = config.allowed_sizes.some(
      allowed => Math.abs(size - allowed) <= (config.tolerance || 0)
    );
    if (!isAllowed) {
      issues.push({
        check: 'token_font_size',
        description: `${size}px가 토큰 스케일에 없음 (허용: ${config.allowed_sizes.join(', ')}px)`,
        line_hint: m[0],
      });
    }
  }

  return issues.length > 0 ? issues : null;
}

/**
 * 로컬 체크: 카드 타입에 맞는 패턴 사용 여부
 */
function checkPatternCompliance(html, card) {
  const issues = [];

  // CTA 카드는 버튼 요소가 있어야 함
  if (card.type === 'cta' && !/<button|class="[^"]*btn|class="[^"]*cta/i.test(html)) {
    issues.push({
      check: 'brand_consistency',
      description: 'CTA 카드에 버튼 요소가 없음',
      line_hint: 'button or .cta element missing',
    });
  }

  // data 카드는 큰 숫자가 있어야 함
  if (card.type === 'data' && card.stat) {
    const statRegex = new RegExp(card.stat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!statRegex.test(html)) {
      issues.push({
        check: 'brand_consistency',
        description: `data 카드에 stat 숫자(${card.stat})가 HTML에 없음`,
        line_hint: `expected: ${card.stat}`,
      });
    }
  }

  // hook 카드는 큰 font-size가 있어야 함
  if (card.type === 'hook') {
    const fontSizes = [...html.matchAll(/font-size\s*:\s*(\d+)px/g)].map(m => parseInt(m[1]));
    const maxSize = Math.max(0, ...fontSizes);
    if (maxSize < 36) {
      issues.push({
        check: 'brand_consistency',
        description: `hook 카드 최대 폰트 사이즈가 ${maxSize}px — 최소 36px 이상이어야 임팩트`,
        line_hint: `max font-size: ${maxSize}px`,
      });
    }
  }

  return issues.length > 0 ? issues : null;
}

/**
 * 로컬 체크: em 하이라이트 스타일 검증
 * - padding이 과도하면 글자와 하이라이트가 분리됨
 * - display: inline이 아니면 너비가 텍스트와 안 맞음
 * - width가 명시되면 텍스트 길이와 안 맞음
 */
function checkEmHighlight(html) {
  const issues = [];

  // em 관련 CSS 블록 찾기 (em { ... }, .headline em { ... } 등)
  const emRuleMatches = [...html.matchAll(/([^{}]*em)\s*\{([^}]+)\}/g)];
  for (const m of emRuleMatches) {
    const selector = m[1].trim();
    const styles = m[2];

    // em 셀렉터인지 확인 (em, .headline em, h1 em 등)
    if (!/\bem\b/.test(selector)) continue;

    // padding 과도 체크 (10px 이상이면 문제)
    const paddingMatch = styles.match(/padding\s*:\s*(\d+)px/);
    if (paddingMatch && parseInt(paddingMatch[1]) > 10) {
      issues.push({
        check: 'em_highlight',
        description: `em 태그 padding ${paddingMatch[1]}px — 하이라이트 분리 버그 (2px 6px로 교정)`,
        line_hint: m[0].substring(0, 60),
      });
    }

    // display: block 체크
    if (/display\s*:\s*block/.test(styles)) {
      issues.push({
        check: 'em_highlight',
        description: 'em 태그 display: block — 하이라이트 너비가 전체로 확장됨 (inline으로 교정)',
        line_hint: 'display: block',
      });
    }

    // 명시적 width 체크
    if (/\bwidth\s*:\s*\d+/.test(styles)) {
      issues.push({
        check: 'em_highlight',
        description: 'em 태그에 명시적 width — 텍스트 길이와 안 맞음 (제거)',
        line_hint: 'width on em',
      });
    }
  }

  // 별도 div/span으로 하이라이트 블록 흉내내기 감지
  const fakeHighlight = html.match(/<(?:div|span)[^>]*style="[^"]*background[^"]*var\(--color-highlight\)[^"]*"[^>]*>\s*<\/(?:div|span)>/gi);
  if (fakeHighlight) {
    issues.push({
      check: 'em_highlight',
      description: '빈 div/span으로 하이라이트 블록 흉내 — 삭제 필요',
      line_hint: fakeHighlight[0].substring(0, 60),
    });
  }

  return issues.length > 0 ? issues : null;
}

/**
 * 로컬 체크: 폰트 로드 확인
 */
function checkFontLoading(html) {
  const issues = [];

  if (!html.includes('fonts.googleapis.com') && !html.includes('Noto Sans KR')) {
    issues.push({
      check: 'text_overflow',
      description: 'Noto Sans KR 폰트가 로드되지 않음',
      line_hint: '<link> tag missing',
    });
  }

  if (!html.includes('word-break')) {
    issues.push({
      check: 'text_overflow',
      description: 'word-break: keep-all 누락 — 한글 단어가 중간에서 잘릴 수 있음',
      line_hint: 'word-break missing',
    });
  }

  return issues.length > 0 ? issues : null;
}

/**
 * em 하이라이트 CSS 강제 교정 (항상 실행)
 * - padding 과도 → 2px 6px
 * - display: block → inline
 * - 명시적 width 제거 → 텍스트 길이에 자동 맞춤
 * - box-decoration-break 보장
 */
function fixEmHighlightAlways(html) {
  let fixed = html;

  // em 관련 CSS 룰 찾아서 교정
  fixed = fixed.replace(/([\w\s.*#\->:,]+\bem\b[^{]*)\{([^}]+)\}/g, (match, selector, styles) => {
    // em 셀렉터가 맞는지 확인
    if (!/\bem\b/.test(selector)) return match;

    let corrected = styles;

    // padding 교정: 어떤 형태든 2px 6px으로 통일
    corrected = corrected.replace(/padding\s*:[^;]+;?/g, 'padding: 2px 6px;');

    // display 교정 → inline (block, inline-block 등 모두)
    if (/display\s*:/.test(corrected)) {
      corrected = corrected.replace(/display\s*:[^;]+;?/g, 'display: inline;');
    } else {
      corrected += '\n      display: inline;';
    }

    // 명시적 width/max-width 제거
    corrected = corrected.replace(/\b(max-)?width\s*:[^;]+;?\s*/g, '');

    // box-decoration-break 보장 (줄바꿈 시 하이라이트 유지)
    if (!corrected.includes('box-decoration-break')) {
      corrected += '\n      box-decoration-break: clone;\n      -webkit-box-decoration-break: clone;';
    }

    return `${selector}{${corrected}}`;
  });

  // 빈 하이라이트 div/span 블록 제거
  fixed = fixed.replace(/<(?:div|span)[^>]*style="[^"]*background[^"]*(?:highlight|#FFE030|#fff3c8|yellow)[^"]*"[^>]*>\s*<\/(?:div|span)>/gi, '');

  // 다크 배경에서 em 하이라이트 텍스트 색상 → 흰색 강제
  // body 배경이 다크(primary, text, 짙은 색)이면 em color를 #FFFFFF로
  const isDark = /body\s*\{[^}]*background[^}]*(?:var\(--color-primary\)|var\(--color-text\)|#[0-3][0-9a-fA-F]{5}|#[0-2][0-9a-fA-F]{2})/s.test(fixed);
  if (isDark) {
    fixed = fixed.replace(/([\w\s.*#\->:,]*\bem\b[^{]*)\{([^}]+)\}/g, (match, selector, styles) => {
      if (!/\bem\b/.test(selector)) return match;
      // color 속성을 흰색으로 교체 또는 추가
      let corrected = styles;
      if (/color\s*:/.test(corrected)) {
        corrected = corrected.replace(/color\s*:[^;]+;?/g, 'color: #FFFFFF;');
      } else {
        corrected += '\n      color: #FFFFFF;';
      }
      return `${selector}{${corrected}}`;
    });
  }

  return fixed;
}

/**
 * HTML 자동 수정 (패턴 기반)
 */
function autoFix(html, issues) {
  let fixed = html;

  for (const issue of issues) {
    switch (issue.check) {
      case 'text_overflow':
        if (issue.description.includes('폰트가 로드되지 않음')) {
          if (!fixed.includes('fonts.googleapis.com')) {
            fixed = fixed.replace('<style>',
              '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">\n<style>');
          }
        }
        if (issue.description.includes('word-break')) {
          if (!fixed.includes('word-break: keep-all')) {
            fixed = fixed.replace('body {', 'body {\n  word-break: keep-all;');
          }
        }
        fixed = fixed.replace(/overflow\s*:\s*hidden/g, 'overflow: visible');
        break;

      case 'spacing':
        // padding이 너무 작은 것은 수치만 교체 (em 블록 제외)
        fixed = fixed.replace(/padding\s*:\s*([12]\d?)px/g, (match, p, offset) => {
          const val = parseInt(p);
          // em 태그 CSS 블록 안이면 건드리지 않음 (500자 lookback)
          const before = fixed.substring(Math.max(0, offset - 500), offset);
          if (/\bem\b[^{]*\{[^}]*$/.test(before)) return match;
          // padding: 2px 6px는 em 하이라이트 표준값이므로 건드리지 않음
          const afterStr = fixed.substring(offset, offset + 30);
          if (/padding\s*:\s*2px\s+6px/.test(match + afterStr)) return match;
          return val < 40 ? `padding: 60px` : match;
        });
        break;

      case 'em_highlight':
        // em 태그 CSS 강제 교정: padding, display, width
        fixed = fixed.replace(/([^{}]*\bem\b[^{]*)\{([^}]+)\}/g, (match, selector, styles) => {
          if (!/\bem\b/.test(selector)) return match;
          let corrected = styles;
          // padding 교정 (10px 초과 → 2px 6px)
          corrected = corrected.replace(/padding\s*:\s*\d+px[^;]*/g, 'padding: 2px 6px');
          // display 교정 → inline
          corrected = corrected.replace(/display\s*:\s*block/g, 'display: inline');
          // 명시적 width 제거
          corrected = corrected.replace(/\bwidth\s*:\s*\d+[^;]*;?\s*/g, '');
          // box-decoration-break 보장
          if (!corrected.includes('box-decoration-break')) {
            corrected += '\n      box-decoration-break: clone;\n      -webkit-box-decoration-break: clone;';
          }
          return `${selector}{${corrected}}`;
        });
        // 빈 하이라이트 div/span 제거
        fixed = fixed.replace(/<(?:div|span)[^>]*style="[^"]*background[^"]*var\(--color-highlight\)[^"]*"[^>]*>\s*<\/(?:div|span)>/gi, '');
        break;
    }
  }

  return fixed;
}

/**
 * Stage 5.5: 단일 카드 HTML 검증
 */
export async function validateCard(html, card) {
  if (!html) return { pass: true, feedback: '', html, issues: [] };

  const allIssues = [];
  const checklist = await loadChecklist();

  // === 로컬 체크 (API 호출 불필요) ===

  // 1. 이미지-텍스트 분리
  const separationIssues = checkImageTextSeparation(html, card);
  if (separationIssues) allIssues.push(...separationIssues);

  // 2. 컬러 제한
  const colorIssues = checkColorLimit(html);
  if (colorIssues) allIssues.push(...colorIssues);

  // 3. 여백
  const spacingIssues = checkSpacing(html, checklist);
  if (spacingIssues) allIssues.push(...spacingIssues);

  // 4. 폰트 사이즈
  const fontSizeIssues = checkTokenFontSize(html, checklist);
  if (fontSizeIssues) allIssues.push(...fontSizeIssues);

  // 5. 패턴 준수 (브랜드 일관성)
  const patternIssues = checkPatternCompliance(html, card);
  if (patternIssues) allIssues.push(...patternIssues);

  // 6. 폰트 로드
  const fontIssues = checkFontLoading(html);
  if (fontIssues) allIssues.push(...fontIssues);

  // 7. em 하이라이트 스타일
  const emIssues = checkEmHighlight(html);
  if (emIssues) allIssues.push(...emIssues);

  // ★ em 하이라이트 교정은 항상 무조건 실행 (검증 결과와 무관)
  let workingHtml = fixEmHighlightAlways(html);

  // === Claude API 체크 (3줄 테스트, 텍스트 오버플로, 전체 품질) ===
  try {
    const result = await validateHTML(workingHtml, card);

    if (result.issues) {
      allIssues.push(...result.issues);
    }

    // 실패 판정: 핵심 체크 위반 시 fail
    const hasFail = allIssues.some(i =>
      i.check === 'text_overflow' ||
      i.check === 'image_text_separation' ||
      i.check === 'spacing'
    );

    // 3줄 테스트 2개 이상 위반 시도 fail
    const lineCountFails = allIssues.filter(i => i.check === 'text_line_count').length;

    if (!hasFail && lineCountFails < 2 && result.pass) {
      return { pass: true, feedback: '', html: workingHtml, issues: allIssues };
    }

    const fixedHtml = autoFix(workingHtml, allIssues);
    return {
      pass: false,
      feedback: result.feedback || allIssues.map(i => i.description).join('; '),
      html: fixedHtml,
      issues: allIssues,
    };
  } catch (err) {
    // API 검증 실패해도 로컬 체크 결과는 반환
    const hasFail = allIssues.some(i =>
      i.check === 'text_overflow' ||
      i.check === 'image_text_separation' ||
      i.check === 'spacing'
    );
    return {
      pass: !hasFail,
      feedback: allIssues.length > 0
        ? allIssues.map(i => i.description).join('; ')
        : `검증 스킵: ${err.message}`,
      html: allIssues.length > 0 ? autoFix(workingHtml, allIssues) : workingHtml,
      issues: allIssues,
    };
  }
}

/**
 * Stage 5.5: 전체 카드 HTML 검증
 */
export async function validateAll(cards) {
  console.log('  🔎 HTML 품질 검증 시작 (7개 디자인 규칙 체크)...');

  let passCount = 0;
  let fixCount = 0;
  let skipCount = 0;
  let warnCount = 0;

  for (const card of cards) {
    if (!card.generated_html) {
      skipCount++;
      continue;
    }

    const result = await validateCard(card.generated_html, card);

    if (result.pass) {
      passCount++;
      if (result.issues && result.issues.length > 0) {
        warnCount += result.issues.length;
      }
    } else {
      fixCount++;
      card.generated_html = result.html;
      console.log(`  🔧 카드 ${String(card.number).padStart(2, '0')}: 자동 수정 (${result.feedback.substring(0, 80)})`);
    }
  }

  console.log(`  ✅ HTML 검증 완료: ${passCount}장 통과, ${fixCount}장 수정, ${skipCount}장 스킵, ${warnCount}건 경고`);
  return cards;
}
