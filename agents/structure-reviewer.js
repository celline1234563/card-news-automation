import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Anthropic();

/**
 * 카드 배열을 읽기 쉬운 텍스트로 변환
 */
function cardsToText(cards) {
  return cards.map(c => {
    let text = `[카드 ${c.number}] type=${c.type}\n`;
    text += `  헤드라인: ${c.headline}\n`;
    text += `  서브텍스트: ${c.subtext || '없음'}\n`;
    if (c.stat) text += `  통계: ${c.stat} (${c.stat_label})\n`;
    if (c.items) text += `  항목: ${JSON.stringify(c.items)}\n`;
    if (c.steps) text += `  단계: ${JSON.stringify(c.steps)}\n`;
    if (c.quote_main) text += `  인용: "${c.quote_main}"\n`;
    if (c.before_title) text += `  비교: ${c.before_title} vs ${c.after_title}\n`;
    if (c.cta_text) text += `  CTA: ${c.cta_text}\n`;
    return text;
  }).join('\n');
}

/**
 * 구조 검토 실행
 */
async function reviewStructure(cards, academyConfig) {
  const systemPromptPath = join(__dirname, '..', 'prompts', 'structure-agent.txt');
  const systemPrompt = await readFile(systemPromptPath, 'utf-8');

  const userMessage = `아래 카드뉴스 10장 시리즈를 검토해주세요.

학원: ${academyConfig.name}
대상: ${academyConfig.grade?.join(', ') || '초중등'}
과목: ${academyConfig.subject || '수학'}

${cardsToText(cards)}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock) throw new Error('structure-reviewer: 응답 없음');

  let jsonStr = textBlock.text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  return JSON.parse(jsonStr);
}

/**
 * 문제 카드 재작성
 */
async function rewriteCard(card, feedback, academyConfig) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    system: `당신은 한국 학원 마케팅 카드뉴스 카피라이터입니다.
주어진 피드백을 반영하여 카드를 재작성해주세요.
원래 카드의 type, number, emphasis_style은 유지하세요.
반드시 JSON만 반환하세요.`,
    messages: [{
      role: 'user',
      content: `아래 카드를 피드백에 맞게 재작성해주세요.

학원: ${academyConfig.name}

현재 카드:
${JSON.stringify(card, null, 2)}

피드백: ${feedback}

재작성된 카드를 JSON으로 반환하세요. 기존 필드를 모두 유지하되 내용만 개선하세요.`
    }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  let jsonStr = textBlock.text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  return JSON.parse(jsonStr);
}

/**
 * Stage 3: 구조 검토 + 문제 카드 재작성
 *
 * @param {Object[]} cards - 카드 10장 배열
 * @param {Object} academyConfig - 학원 설정
 * @returns {Object[]} 검토/수정된 카드 배열
 */
export async function reviewAndFix(cards, academyConfig) {
  console.log('  🔍 구조 검토 시작...');

  let review;
  try {
    review = await reviewStructure(cards, academyConfig);
  } catch (err) {
    console.warn(`  ⚠️  구조 검토 실패: ${err.message}. 그대로 진행합니다.`);
    return cards;
  }

  console.log(`  구조 점수: ${review.structure_score}/10`);
  console.log(`  독자유지 점수: ${review.retention_score}/10`);
  console.log(`  전체 피드백: ${review.overall_feedback}`);

  if (review.issues?.length > 0) {
    for (const issue of review.issues) {
      const tag = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
      console.log(`  ${tag} 카드 ${issue.card_number}: ${issue.problem}`);
    }
  }

  // rewrite_needed가 비어있으면 그대로 통과
  const toRewrite = review.rewrite_needed || [];
  if (toRewrite.length === 0) {
    console.log('  ✅ 구조 검토 통과! 수정 필요 없음');
    return cards;
  }

  console.log(`  📝 재작성 대상: 카드 ${toRewrite.join(', ')}`);

  // 문제 카드만 재작성
  const updatedCards = [...cards];
  for (const cardNum of toRewrite) {
    const idx = updatedCards.findIndex(c => c.number === cardNum);
    if (idx === -1) continue;

    const issue = review.issues?.find(i => i.card_number === cardNum);
    if (!issue) continue;

    try {
      const rewritten = await rewriteCard(updatedCards[idx], issue.suggestion, academyConfig);
      // 기존 필드 유지하면서 내용만 업데이트
      updatedCards[idx] = {
        ...updatedCards[idx],
        ...rewritten,
        number: cardNum, // number 보존
        type: updatedCards[idx].type, // type 보존
        generated_html: null, // 재생성 필요
        layout_used: null,
      };
      console.log(`  ✅ 카드 ${cardNum} 재작성 완료`);
    } catch (err) {
      console.warn(`  ⚠️  카드 ${cardNum} 재작성 실패: ${err.message}. 원본 유지`);
    }
  }

  console.log('  ✅ 구조 검토 + 재작성 완료');
  return updatedCards;
}
