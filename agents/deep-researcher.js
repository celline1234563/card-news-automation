import Anthropic from '@anthropic-ai/sdk';
import { readFile, readdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Anthropic();

/**
 * 학원별 케이스 데이터(MD 파일) 자동 로드
 */
async function loadCaseData(academyKey) {
  const casesDir = join(__dirname, '..', 'data', 'cases', academyKey);
  try {
    const files = await readdir(casesDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    if (mdFiles.length === 0) return null;

    const contents = [];
    for (const file of mdFiles) {
      const text = await readFile(join(casesDir, file), 'utf-8');
      contents.push(`### ${file.replace('.md', '')}\n${text}`);
    }
    return contents.join('\n\n---\n\n');
  } catch {
    return null;
  }
}

/**
 * Stage 1: 깊은 리서치
 *
 * web_search 8~10회로 주제를 심층 조사하고,
 * 케이스 데이터에서 활용 가능한 수치/사례를 추출합니다.
 *
 * @param {string} topic - 주제
 * @param {string} academyName - 학원명
 * @param {Object} options
 * @returns {Promise<Object>} 리서치 결과 JSON
 */
export async function deepResearch(topic, academyName, options = {}) {
  const systemPromptRaw = await readFile(
    join(__dirname, '..', 'prompts', 'deep-researcher-system.txt'), 'utf-8'
  );

  const region = options.region || '';
  const systemPrompt = systemPromptRaw.replace(/\{\{REGION\}\}/g, region);

  console.log('  🔬 [1/3] 깊은 리서치 시작...');

  // 유저 메시지 구성
  const parts = [];
  parts.push(`주제: "${topic}"`);
  parts.push(`학원명: ${academyName}`);
  parts.push(`지역: ${region}`);

  if (options.keyword) parts.push(`메인키워드: ${options.keyword}`);

  if (options.contentTypes?.length > 0) {
    parts.push(`콘텐츠 타입: ${options.contentTypes.join(', ')}`);
  }

  if (options.pageContent) {
    parts.push(`\n기획자 작성 기획 문서:\n${options.pageContent}`);
  }

  if (options.comments?.length > 0) {
    parts.push(`\n담당자 재료 댓글:\n${options.comments.join('\n')}`);
  }

  // 케이스 데이터 로드
  if (options.academyKey) {
    const caseData = await loadCaseData(options.academyKey);
    if (caseData) {
      parts.push(`\n학원 프로그램·사례·실적 자료:\n${caseData}`);
      console.log(`  📚 케이스 데이터 로드: ${options.academyKey}`);
    }
  }

  parts.push('\nweb_search로 3축 리서치(팩트/학부모반응/경쟁콘텐츠) 수행 후 JSON으로 반환해주세요.');

  const userMessage = parts.join('\n');

  let response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    system: systemPrompt,
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 10 }],
    messages: [{ role: 'user', content: userMessage }],
  });

  // pause_turn 루프
  const messages = [{ role: 'user', content: userMessage }];
  let searchCount = 0;
  while (response.stop_reason === 'pause_turn') {
    searchCount++;
    console.log(`  🔍 웹 검색 ${searchCount}회차...`);
    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: [{ type: 'text', text: '검색 결과를 바탕으로 계속 진행해주세요.' }] });

    response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: systemPrompt,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 10 }],
      messages,
    });
  }

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock) throw new Error('deep-researcher: 응답에서 텍스트를 찾을 수 없습니다.');

  let jsonStr = textBlock.text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  const result = JSON.parse(jsonStr);
  console.log(`  ✅ [1/3] 리서치 완료 (검색 ${searchCount}회, 팩트 ${result.web_findings?.length || 0}건)`);
  return result;
}
