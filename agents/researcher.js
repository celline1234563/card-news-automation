import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Anthropic();

/**
 * 주제 리서치 + 카드 10장 카피 생성 (Claude API + web_search)
 *
 * @param {string} topic - 카드뉴스 주제
 * @param {string} academyName - 학원 이름
 * @param {Object} [options]
 * @param {string} [options.keyword] - 메인 키워드
 * @param {string[]} [options.comments] - 담당자 재료 댓글
 * @param {string} [options.pageContent] - 기획자 작성 기획 문서
 * @param {string[]} [options.revisionInstructions] - @수정 지시
 */
export async function research(topic, academyName, options = {}) {
  // 매 호출마다 파일 읽기 (핫리로드)
  const systemPromptPath = join(__dirname, '..', 'prompts', 'researcher-system.txt');
  let systemPrompt = await readFile(systemPromptPath, 'utf-8');
  systemPrompt = systemPrompt.replace('{{ACADEMY_NAME}}', academyName);

  console.log('  📝 Claude에게 카피 생성 요청 중...');

  // 사용자 메시지 구성
  const parts = [];
  parts.push(`주제: "${topic}"`);
  parts.push(`학원명: ${academyName}`);

  if (options.keyword) {
    parts.push(`\n메인키워드: ${options.keyword} — 원고에 자연스럽게 포함`);
  }

  if (options.pageContent) {
    parts.push(`\n아래는 기획자가 작성한 기획 문서입니다. 이 구조를 기반으로 기획안을 작성하세요:`);
    parts.push(options.pageContent);
  }

  if (options.comments && options.comments.length > 0) {
    parts.push(`\n아래는 담당자가 댓글로 남긴 재료입니다. 반드시 반영하세요:`);
    parts.push(options.comments.join('\n'));
  }

  if (options.revisionInstructions && options.revisionInstructions.length > 0) {
    parts.push(`\n수정 지시: ${options.revisionInstructions.join('\n')} — 기존 기획안에서 이 부분만 수정해서 다시 작성`);
  }

  parts.push('\nweb_search로 리서치 후 카드 10장 카피를 JSON으로 작성해주세요.');

  const userMessage = parts.join('\n');

  let response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    system: systemPrompt,
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
    messages: [{ role: 'user', content: userMessage }],
  });

  // pause_turn 루프
  const messages = [{ role: 'user', content: userMessage }];
  while (response.stop_reason === 'pause_turn') {
    console.log('  🔍 웹 검색 진행 중...');
    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: [{ type: 'text', text: '검색 결과를 바탕으로 계속 진행해주세요.' }] });

    response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      system: systemPrompt,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
      messages,
    });
  }

  const textBlock = response.content.find(block => block.type === 'text');
  if (!textBlock) {
    throw new Error('Claude 응답에서 텍스트를 찾을 수 없습니다.');
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
    console.error('  ⚠️  JSON 파싱 실패. 원본 텍스트:');
    console.error(jsonStr.substring(0, 500));
    throw new Error(`JSON 파싱 실패: ${e.message}`);
  }

  if (!result.cards || result.cards.length < 10) {
    console.warn(`  ⚠️  카드 ${result.cards?.length || 0}장 생성됨 (10장 미만). 그대로 진행합니다.`);
  }

  result.cards = (result.cards || []).map(card => ({
    ...card,
    image_url: card.image_url || null,
    bg_image_url: card.bg_image_url || null,
    generated_html: card.generated_html || null,
    layout_used: card.layout_used || null,
  }));

  console.log(`  ✅ 카드 ${result.cards.length}장 카피 생성 완료`);
  return result;
}
