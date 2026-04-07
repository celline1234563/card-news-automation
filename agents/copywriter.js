import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Anthropic();

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
 * 기획안 카드 배열 → 카드별 원고(300~500자) 생성
 *
 * @param {Object[]} cards - 기획안 카드 배열
 * @param {string} topic - 주제
 * @param {Object} academyConfig - { name, region, grade, subject, ... }
 * @param {Object} [options]
 * @param {string} [options.keyword] - 메인 키워드
 * @param {string} [options.academyKey] - 학원 키 (보이스 가이드/링크 로드용)
 * @param {string} [options.researchSummary] - 리서치 요약
 * @returns {Promise<Object[]>} copies 배열 [{ card, text, hashtags }]
 */
export async function run(cards, topic, academyConfig, options = {}) {
  // 매 호출마다 파일 읽기 (핫리로드)
  const [systemTemplate, userTemplate, voiceGuide, linkData] = await Promise.all([
    readFile(join(__dirname, '..', 'prompts', 'copywriter-system.txt'), 'utf-8'),
    readFile(join(__dirname, '..', 'prompts', 'copywriter-user.txt'), 'utf-8'),
    options.academyKey
      ? safeReadFile(join(__dirname, '..', 'config', 'brand', `${options.academyKey}-voice.md`))
      : Promise.resolve(''),
    options.academyKey
      ? safeReadFile(join(__dirname, '..', 'data', 'links', `${options.academyKey}.md`))
      : Promise.resolve(''),
  ]);

  console.log('  📝 원고 생성 요청 중...');
  if (voiceGuide) console.log(`  🎤 보이스 가이드 로드: ${options.academyKey}`);

  // 카드 상세 텍스트 구성
  const cardsDetail = cards.map(card => {
    const lines = [`[카드 ${card.number}]`];
    lines.push(`타입: ${card.type}`);
    lines.push(`헤드라인: ${(card.headline || '').replace(/<\/?em>/g, '')}`);
    if (card.subtext) lines.push(`서브텍스트: ${card.subtext}`);
    if (card.content_brief) lines.push(`★ 기획 의도: ${card.content_brief}`);
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
    if (card.content_bullets && Array.isArray(card.content_bullets)) {
      lines.push(`콘텐츠 방향:`);
      card.content_bullets.forEach(b => lines.push(`  • ${b}`));
    }
    if (card.visual_asset) {
      lines.push(`시각자료: ${card.visual_asset}`);
    }
    return lines.join('\n');
  }).join('\n\n');

  // 시스템 프롬프트 치환
  const systemPrompt = systemTemplate
    .replace('{{VOICE_GUIDE}}', voiceGuide || '(보이스 가이드 없음 — 기본 톤 사용)')
    .replace('{{RESEARCH_SUMMARY}}', options.researchSummary || '(리서치 요약 없음)')
    .replace('{{LINK_DATA}}', linkData || '(링크 정보 없음)');

  // 유저 프롬프트 치환
  const grade = Array.isArray(academyConfig.grade) ? academyConfig.grade.join(', ') : (academyConfig.grade || '');
  const userMessage = userTemplate
    .replace('{{TOPIC}}', topic)
    .replace('{{KEYWORD}}', options.keyword || topic)
    .replace('{{ACADEMY_NAME}}', academyConfig.name)
    .replace('{{REGION}}', academyConfig.region || '')
    .replace('{{GRADE}}', grade)
    .replace('{{SUBJECT}}', academyConfig.subject || '')
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
