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
 * Stage 2: 카드 10장 구조 기획
 *
 * 리서치 결과를 받아서 10장 카드의 콘텐츠 구조를 설계합니다.
 * web_search 없이 순수 텍스트 생성만 수행합니다.
 *
 * @param {string} topic - 주제
 * @param {string} academyName - 학원명
 * @param {Object} researchResult - deep-researcher 출력
 * @param {Object} options
 * @returns {Promise<Object>} { topic, research_summary, cards[] }
 */
export async function planCards(topic, academyName, researchResult, options = {}) {
  const [systemTemplate, voiceGuide, brandStrategy] = await Promise.all([
    readFile(join(__dirname, '..', 'prompts', 'card-planner-system.txt'), 'utf-8'),
    options.academyKey
      ? safeReadFile(join(__dirname, '..', 'config', 'brand', `${options.academyKey}-voice.md`))
      : Promise.resolve(''),
    options.academyKey
      ? safeReadFile(join(__dirname, '..', 'config', 'brand', `${options.academyKey}-strategy.md`))
      : Promise.resolve(''),
  ]);

  console.log('  📋 [2/3] 카드 기획 시작...');

  const systemPrompt = systemTemplate
    .replace('{{ACADEMY_NAME}}', academyName)
    .replace('{{VOICE_GUIDE}}', voiceGuide || '(보이스 가이드 없음)')
    .replace('{{BRAND_STRATEGY}}', brandStrategy || '(브랜드 전략서 없음)');

  // 유저 메시지: 리서치 결과 + 주제 정보
  const parts = [];
  parts.push(`주제: "${topic}"`);
  parts.push(`학원명: ${academyName}`);
  if (options.keyword) parts.push(`메인키워드: ${options.keyword}`);

  if (options.contentTypes?.length > 0) {
    parts.push(`콘텐츠 타입: ${options.contentTypes.join(', ')}`);
  }

  if (options.revisionInstructions?.length > 0) {
    parts.push(`\n★ 수정 지시 (반드시 반영):\n${options.revisionInstructions.join('\n')}`);
  }

  parts.push(`\n## 리서치 결과 (이 데이터를 기반으로 기획하세요)\n${JSON.stringify(researchResult, null, 2)}`);
  parts.push('\n위 리서치 결과를 기반으로 카드 10장 기획안을 JSON으로 작성해주세요.');

  const userMessage = parts.join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock) throw new Error('card-planner: 응답에서 텍스트를 찾을 수 없습니다.');

  let jsonStr = textBlock.text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  const result = JSON.parse(jsonStr);

  // 기본 필드 보장
  result.cards = (result.cards || []).map(card => ({
    ...card,
    image_url: card.image_url || null,
    bg_image_url: card.bg_image_url || null,
    generated_html: card.generated_html || null,
    layout_used: card.layout_used || null,
  }));

  console.log(`  ✅ [2/3] 카드 ${result.cards.length}장 기획 완료`);
  return result;
}
