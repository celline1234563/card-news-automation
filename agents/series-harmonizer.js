import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { designCard } from './gemini-designer.js';
import { buildSystemPrompt } from './prompt-builder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Anthropic();
const MAX_DESIGN_RETRY = parseInt(process.env.MAX_DESIGN_RETRY || '2');

/**
 * 카드 1 HTML에서 시리즈 DNA 추출 (regex 파싱)
 * DNA: 컬러 팔레트, 폰트 사이즈 체계, 패딩 규칙, 헤더/푸터 구조
 */
export async function extractSeriesDNA(html) {
  const dna = {
    colors: [],
    fontSizes: [],
    paddings: [],
    hasHeader: false,
    hasFooter: false,
    headerStyle: '',
    footerStyle: '',
    emphasisStyle: '',
    bgTreatment: '',
  };

  // CSS 변수 사용 추출
  const varMatches = html.matchAll(/var\(--([^)]+)\)/g);
  const usedVars = new Set();
  for (const m of varMatches) usedVars.add(m[1]);
  dna.colors = [...usedVars].filter(v => v.startsWith('color-'));

  // 폰트 사이즈 추출
  const fontMatches = html.matchAll(/font-size\s*:\s*(\d+)px/g);
  for (const m of fontMatches) dna.fontSizes.push(parseInt(m[1]));
  dna.fontSizes = [...new Set(dna.fontSizes)].sort((a, b) => b - a);

  // 패딩 추출
  const padMatches = html.matchAll(/padding\s*:\s*([^;]+)/g);
  for (const m of padMatches) dna.paddings.push(m[1].trim());

  // 헤더/푸터 존재 여부 (간단한 휴리스틱)
  dna.hasHeader = /class="[^"]*header/i.test(html) || /학원|로고|시리즈/i.test(html.substring(0, 500));
  dna.hasFooter = /class="[^"]*footer/i.test(html) || /\d+\s*\/\s*10/.test(html);

  // em 태그 스타일
  const emMatch = html.match(/em\s*\{([^}]+)\}/);
  if (emMatch) dna.emphasisStyle = emMatch[1].trim();

  // 배경 처리
  if (html.includes('background-image')) dna.bgTreatment = 'image';
  else if (html.includes('linear-gradient')) dna.bgTreatment = 'gradient';
  else dna.bgTreatment = 'solid';

  return dna;
}

/**
 * DNA를 Gemini 프롬프트용 텍스트로 변환
 */
export function formatDNAForPrompt(dna) {
  const lines = ['\n## 시리즈 DNA (카드 1 기준 — 반드시 따르세요)'];

  if (dna.colors.length > 0) {
    lines.push(`- 사용 CSS 변수: ${dna.colors.map(c => `var(--${c})`).join(', ')}`);
  }
  if (dna.fontSizes.length > 0) {
    lines.push(`- 폰트 사이즈 체계: ${dna.fontSizes.join('px, ')}px`);
  }
  if (dna.emphasisStyle) {
    lines.push(`- em 강조 스타일: ${dna.emphasisStyle}`);
  }
  if (dna.hasHeader) {
    lines.push(`- 헤더 있음: 동일한 위치·스타일로 헤더를 유지하세요`);
  }
  if (dna.hasFooter) {
    lines.push(`- 푸터 있음: 동일한 위치·스타일로 푸터를 유지하세요`);
  }
  lines.push(`- 배경 처리: ${dna.bgTreatment}`);
  lines.push('- 위 DNA와 일관된 스타일로 디자인하세요. 컬러·폰트·간격 체계를 벗어나지 마세요.');

  return lines.join('\n');
}

/**
 * Claude로 10장 일관성 점수 평가
 */
export async function scoreConsistency(cards) {
  const systemPromptPath = join(__dirname, '..', 'prompts', 'series-harmonizer-system.txt');
  const systemPrompt = await readFile(systemPromptPath, 'utf-8');

  // 각 카드의 HTML 핵심 부분만 추출 (토큰 절약)
  const htmlSummaries = cards.map(card => {
    const html = card.generated_html || '';
    // <style> 블록 + body 첫 500자만 추출
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);
    const style = styleMatch ? styleMatch[1].substring(0, 800) : '';
    const body = bodyMatch ? bodyMatch[1].substring(0, 500) : '';
    return `=== 카드 ${card.number} (${card.type}) ===\n<style>${style}</style>\n<body>${body}...</body>`;
  }).join('\n\n');

  const userMessage = `아래 10장의 카드뉴스 HTML을 시리즈 일관성 관점에서 평가해주세요.\n\n${htmlSummaries}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock) throw new Error('series-harmonizer: 응답 없음');

  let jsonStr = textBlock.text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  return JSON.parse(jsonStr);
}

/**
 * 전체 오케스트레이터: 카드 1 디자인 → DNA 추출 → 2~10 디자인 → 일관성 평가 → 미달 재생성
 */
export async function harmonizeAndDesign(cards, cssVariables, academyConfig, options = {}) {
  console.log('  🎵 시리즈 하모나이저 시작...');

  const academyKey = options.academyKey || 'ollinone';
  const usedLayouts = [];

  // Stage 5a: 카드 1 디자인
  console.log('  🎵 Stage 5a: 카드 1 디자인 (DNA 기준 카드)');
  const card1 = cards[0];
  const systemPrompt = await buildSystemPrompt(academyKey, academyConfig, options);

  const html1 = await designCard(card1, cssVariables, academyConfig, usedLayouts, {
    ...options,
    academyKey,
    systemPrompt,
  });
  card1.generated_html = html1;
  const layout1 = card1.layout_hint || 'card-01';
  card1.layout_used = layout1;
  usedLayouts.push(layout1);
  console.log(`  ✅ 카드 01: DNA 기준 카드 완료`);

  // Stage 5b: DNA 추출 → 카드 2~10 디자인
  console.log('  🎵 Stage 5b: DNA 추출 + 카드 2~10 디자인');
  const dna = await extractSeriesDNA(html1);
  const seriesDNA = formatDNAForPrompt(dna);
  const systemPromptWithDNA = await buildSystemPrompt(academyKey, academyConfig, { ...options, seriesDNA });

  for (let i = 1; i < cards.length; i++) {
    const card = cards[i];
    const paddedNum = String(card.number).padStart(2, '0');
    console.log(`  🖌️  카드 ${paddedNum}: DNA 기반 디자인 중...`);

    const html = await designCard(card, cssVariables, academyConfig, usedLayouts, {
      ...options,
      academyKey,
      systemPrompt: systemPromptWithDNA,
    });
    card.generated_html = html;
    const layoutLabel = card.layout_hint || `card-${paddedNum}`;
    card.layout_used = layoutLabel;
    usedLayouts.push(layoutLabel);

    console.log(`  ✅ 카드 ${paddedNum}: 디자인 완료`);
  }

  // Stage 5c: 전체 일관성 평가
  console.log('  🎵 Stage 5c: 시리즈 일관성 평가');
  try {
    const score = await scoreConsistency(cards);
    console.log(`  📊 일관성 점수: ${score.total_score}/10`);

    if (score.total_score < 7 && score.problem_cards && score.problem_cards.length > 0) {
      console.log(`  ⚠️ 미달 카드: [${score.problem_cards.join(', ')}] — 재생성 시도`);

      for (let retry = 0; retry < MAX_DESIGN_RETRY; retry++) {
        for (const cardNum of score.problem_cards) {
          const card = cards.find(c => c.number === cardNum);
          if (!card) continue;

          console.log(`  🔄 카드 ${cardNum} 재생성 (시도 ${retry + 1}/${MAX_DESIGN_RETRY})`);
          const newHtml = await designCard(card, cssVariables, academyConfig, usedLayouts, {
            ...options,
            academyKey,
            systemPrompt: systemPromptWithDNA,
          });
          card.generated_html = newHtml;
        }

        // 재평가
        const newScore = await scoreConsistency(cards);
        console.log(`  📊 재평가 점수: ${newScore.total_score}/10`);
        if (newScore.total_score >= 7) break;
      }
    }
  } catch (err) {
    console.log(`  ⚠️ 일관성 평가 스킵: ${err.message}`);
  }

  console.log(`  🎵 시리즈 하모나이저 완료 (${cards.length}장)`);
  return cards;
}
