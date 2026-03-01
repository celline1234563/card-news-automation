import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Anthropic();

/**
 * 기획안 카드 배열 → 카드별 원고(300~500자) 생성
 *
 * @param {Object[]} cards - 기획안 카드 배열
 * @param {string} topic - 주제
 * @param {Object} academyConfig - { name, ... }
 * @param {Object} [options]
 * @param {string} [options.keyword] - 메인 키워드
 * @returns {Promise<Object[]>} copies 배열 [{ card, text, hashtags }]
 */
export async function run(cards, topic, academyConfig, options = {}) {
  // 매 호출마다 파일 읽기 (핫리로드)
  const systemPrompt = await readFile(join(__dirname, '..', 'prompts', 'copywriter-system.txt'), 'utf-8');
  const userTemplate = await readFile(join(__dirname, '..', 'prompts', 'copywriter-user.txt'), 'utf-8');

  console.log('  📝 원고 생성 요청 중...');

  // 카드 상세 텍스트 구성
  const cardsDetail = cards.map(card => {
    const lines = [`[카드 ${card.number}]`];
    lines.push(`타입: ${card.type}`);
    lines.push(`헤드라인: ${(card.headline || '').replace(/<\/?em>/g, '')}`);
    if (card.subtext) lines.push(`서브텍스트: ${card.subtext}`);
    if (card.stat) lines.push(`통계: ${card.stat} ${card.stat_label || ''}`);
    if (card.quote_main) lines.push(`인용: "${card.quote_main}"`);
    if (card.cta_text) lines.push(`CTA: ${card.cta_text}`);
    if (card.items && Array.isArray(card.items)) {
      const itemTexts = card.items.map(item =>
        typeof item === 'string' ? item : (item.title || item.text || '')
      );
      lines.push(`항목: ${itemTexts.join(' / ')}`);
    }
    if (card.steps && Array.isArray(card.steps)) {
      const stepTexts = card.steps.map(s =>
        typeof s === 'string' ? s : (s.title || '')
      );
      lines.push(`단계: ${stepTexts.join(' → ')}`);
    }
    return lines.join('\n');
  }).join('\n\n');

  // 템플릿 치환
  const userMessage = userTemplate
    .replace('{{TOPIC}}', topic)
    .replace('{{KEYWORD}}', options.keyword || topic)
    .replace('{{ACADEMY_NAME}}', academyConfig.name)
    .replace('{{CARDS_DETAIL}}', cardsDetail);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find(block => block.type === 'text');
  if (!textBlock) {
    throw new Error('원고 응답에서 텍스트를 찾을 수 없습니다.');
  }

  let jsonStr = textBlock.text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  let result;
  try {
    result = JSON.parse(jsonStr);
  } catch (e) {
    console.error('  ⚠️ 원고 JSON 파싱 실패:', jsonStr.substring(0, 300));
    throw new Error(`원고 JSON 파싱 실패: ${e.message}`);
  }

  const copies = result.copies || [];
  console.log(`  ✅ 원고 ${copies.length}개 생성 완료`);
  return copies;
}
