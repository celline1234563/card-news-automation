import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Anthropic();

async function safeReadFile(filePath) {
  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return '';
  }
}

/**
 * Stage 3: 비주얼 전략 + 카피 다듬기
 *
 * card-planner가 만든 기획안의 헤드라인/design_brief를 다듬습니다.
 * content_brief, stat, items 등 구조 필드는 건드리지 않습니다.
 *
 * @param {Object} planResult - card-planner 출력 { topic, research_summary, cards[] }
 * @param {Object} options
 * @returns {Promise<Object>} 다듬어진 { topic, research_summary, cards[] }
 */
export async function polishVisuals(planResult, options = {}) {
  const [systemTemplate, voiceGuide] = await Promise.all([
    readFile(join(__dirname, '..', 'prompts', 'visual-strategist-system.txt'), 'utf-8'),
    options.academyKey
      ? safeReadFile(join(__dirname, '..', 'config', 'brand', `${options.academyKey}-voice.md`))
      : Promise.resolve(''),
  ]);

  console.log('  🎨 [3/3] 카피/비주얼 다듬기 시작...');

  const systemPrompt = systemTemplate
    .replace('{{VOICE_GUIDE}}', voiceGuide || '(보이스 가이드 없음)');

  const userMessage = `아래 카드뉴스 10장 기획안의 헤드라인과 design_brief를 다듬어주세요.
content_brief, stat, items 등 구조 필드는 절대 변경하지 마세요.

${JSON.stringify(planResult, null, 2)}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock) {
    console.warn('  ⚠️ [3/3] 다듬기 실패 — 원본 유지');
    return planResult;
  }

  let jsonStr = textBlock.text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  let result;
  try {
    result = JSON.parse(jsonStr);
  } catch (e) {
    console.warn(`  ⚠️ [3/3] JSON 파싱 실패 — 원본 유지: ${e.message}`);
    return planResult;
  }

  // 구조 필드가 변경됐는지 검증 (safety check)
  const protectedFields = ['content_brief', 'stat', 'stat_label', 'items', 'steps', 'quote_main', 'quote_sub', 'cta_text', 'cta_sub', 'before_title', 'after_title', 'before_items', 'after_items'];

  for (const card of result.cards || []) {
    const original = planResult.cards.find(c => c.number === card.number);
    if (!original) continue;

    for (const field of protectedFields) {
      if (original[field] !== undefined) {
        card[field] = original[field]; // 강제 복원
      }
    }
  }

  // 기본 필드 보장
  result.cards = (result.cards || []).map(card => ({
    ...card,
    image_url: card.image_url || null,
    bg_image_url: card.bg_image_url || null,
    generated_html: card.generated_html || null,
    layout_used: card.layout_used || null,
  }));

  console.log(`  ✅ [3/3] 카피/비주얼 다듬기 완료`);
  return result;
}
