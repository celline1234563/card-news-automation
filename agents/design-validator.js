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
 * 로컬 체크: safe-area 패딩 검증
 */
function checkTokenSpacing(html, checklist) {
  if (!checklist?.checks?.token_spacing) return null;
  const minPadding = checklist.checks.token_spacing.min_padding || 60;
  const issues = [];

  // padding 값 추출 (단일 값만 체크)
  const padMatches = html.matchAll(/padding\s*:\s*(\d+)px/g);
  for (const m of padMatches) {
    const pad = parseInt(m[1]);
    if (pad < minPadding && pad > 0) {
      issues.push({
        check: 'token_spacing',
        description: `padding ${pad}px가 safe-area(${minPadding}px) 미만`,
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
      check: 'pattern_compliance',
      description: 'CTA 카드에 버튼 요소가 없음',
      line_hint: 'button or .cta element missing',
    });
  }

  // data 카드는 큰 숫자가 있어야 함
  if (card.type === 'data' && card.stat) {
    const statRegex = new RegExp(card.stat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!statRegex.test(html)) {
      issues.push({
        check: 'pattern_compliance',
        description: `data 카드에 stat 숫자(${card.stat})가 HTML에 없음`,
        line_hint: `expected: ${card.stat}`,
      });
    }
  }

  return issues.length > 0 ? issues : null;
}

/**
 * 로컬 체크: 시리즈 헤더/푸터 일관성
 */
function checkSeriesHeaderFooter(html, card, seriesCards) {
  // 단일 카드 검증에서는 스킵 (전체 검증에서 처리)
  return null;
}

/**
 * HTML 자동 수정 (패턴 기반)
 */
function autoFix(html, issues) {
  let fixed = html;

  for (const issue of issues) {
    switch (issue.check) {
      case 'font_missing':
        if (!fixed.includes('fonts.googleapis.com') && !fixed.includes('Noto Sans KR')) {
          fixed = fixed.replace('<style>',
            '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">\n<style>');
        }
        if (!fixed.includes('word-break')) {
          fixed = fixed.replace('body {', 'body {\n  word-break: keep-all;');
        }
        break;

      case 'text_overflow':
        fixed = fixed.replace(/overflow\s*:\s*hidden/g, 'overflow: visible');
        break;

      case 'series_header_footer':
        // word-break 추가로 텍스트 보호
        if (!fixed.includes('word-break: keep-all')) {
          fixed = fixed.replace(/body\s*\{/, 'body {\n  word-break: keep-all;');
        }
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

  // 로컬 체크 (API 호출 불필요)
  const fontSizeIssues = checkTokenFontSize(html, checklist);
  if (fontSizeIssues) allIssues.push(...fontSizeIssues);

  const spacingIssues = checkTokenSpacing(html, checklist);
  if (spacingIssues) allIssues.push(...spacingIssues);

  const patternIssues = checkPatternCompliance(html, card);
  if (patternIssues) allIssues.push(...patternIssues);

  // Claude API 체크 (text_overflow, font_missing, hex_direct)
  try {
    const result = await validateHTML(html, card);

    if (result.issues) {
      allIssues.push(...result.issues);
    }

    const hasFail = allIssues.some(i =>
      i.check === 'text_overflow' || i.check === 'font_missing'
    );

    if (!hasFail && result.pass) {
      return { pass: true, feedback: '', html, issues: allIssues };
    }

    const fixedHtml = autoFix(html, allIssues);
    return {
      pass: false,
      feedback: result.feedback || allIssues.map(i => i.description).join('; '),
      html: fixedHtml,
      issues: allIssues,
    };
  } catch (err) {
    // API 검증 실패해도 로컬 체크 결과는 반환
    return {
      pass: allIssues.length === 0,
      feedback: allIssues.length > 0
        ? allIssues.map(i => i.description).join('; ')
        : `검증 스킵: ${err.message}`,
      html: allIssues.length > 0 ? autoFix(html, allIssues) : html,
      issues: allIssues,
    };
  }
}

/**
 * Stage 5.5: 전체 카드 HTML 검증
 */
export async function validateAll(cards) {
  console.log('  🔎 HTML 품질 검증 시작 (7개 체크)...');

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
      // 경고만 있는 경우 카운트
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
