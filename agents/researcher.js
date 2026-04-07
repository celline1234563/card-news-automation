import Anthropic from '@anthropic-ai/sdk';
import { readFile, readdir, writeFile } from 'fs/promises';
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
 * 학원별 케이스 데이터(MD 파일) 자동 로드
 * data/cases/{academyKey}/ 폴더의 모든 .md 파일을 읽어서 주제와 관련된 것만 반환
 */
async function loadCaseData(academyKey, topic) {
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
 * 주제 리서치 + 카드 10장 카피 생성 (Claude API + web_search)
 *
 * @param {string} topic - 카드뉴스 주제
 * @param {string} academyName - 학원 이름
 * @param {Object} [options]
 * @param {string} [options.keyword] - 메인 키워드
 * @param {string[]} [options.comments] - 담당자 재료 댓글
 * @param {string} [options.pageContent] - 기획자 작성 기획 문서
 * @param {string[]} [options.revisionInstructions] - @수정 지시
 * @param {string} [options.academyKey] - 학원 키 (케이스 데이터 로드용)
 * @param {string[]} [options.contentTypes] - 콘텐츠 타입 (예: ["09-성적향상후기"])
 * @param {string} [options.region] - 학원 지역 (예: "관악구, 금천구")
 */
export async function research(topic, academyName, options = {}) {
  // 매 호출마다 파일 읽기 (핫리로드)
  const [systemPromptRaw, voiceGuide, brandStrategy] = await Promise.all([
    readFile(join(__dirname, '..', 'prompts', 'researcher-system.txt'), 'utf-8'),
    options.academyKey
      ? safeReadFile(join(__dirname, '..', 'config', 'brand', `${options.academyKey}-voice.md`))
      : Promise.resolve(''),
    options.academyKey
      ? safeReadFile(join(__dirname, '..', 'config', 'brand', `${options.academyKey}-strategy.md`))
      : Promise.resolve(''),
  ]);

  if (voiceGuide) console.log(`  🎤 보이스 가이드 로드: ${options.academyKey}`);
  if (brandStrategy) console.log(`  📋 브랜드 전략서 로드: ${options.academyKey}`);

  // 학원 지역 정보
  const region = options.region || '';

  let systemPrompt = systemPromptRaw
    .replace('{{ACADEMY_NAME}}', academyName)
    .replace(/\{\{REGION\}\}/g, region)
    .replace('{{VOICE_GUIDE}}', voiceGuide || '(보이스 가이드 없음 — 기본 톤 사용)')
    .replace('{{BRAND_STRATEGY}}', brandStrategy || '(브랜드 전략서 없음)');

  console.log('  📝 Claude에게 카피 생성 요청 중...');

  // 사용자 메시지 구성
  const parts = [];
  parts.push(`주제: "${topic}"`);
  parts.push(`학원명: ${academyName}`);

  if (options.keyword) {
    parts.push(`\n메인키워드: ${options.keyword} — 원고에 자연스럽게 포함`);
  }

  if (options.contentTypes && options.contentTypes.length > 0) {
    parts.push(`\n콘텐츠 타입: ${options.contentTypes.join(', ')}`);
    parts.push('이 콘텐츠 타입의 특성에 맞게 카드 구조와 톤을 조정하세요.');
    parts.push('예: 성적향상후기 → 실제 성과 데이터·수치 중심, 자부심/자신감 톤');
    parts.push('예: 입시정보 → 긴장감 톤, 시기별 전략 강조');
    parts.push('예: 학습법 → 실용적 톤, 구체적 실천법 제시');
    parts.push('예: 학원소식 → 신뢰감/활기 톤, 시스템·이벤트 소개');
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

  // 학원별 케이스 데이터 자동 로드
  if (options.academyKey) {
    const caseData = await loadCaseData(options.academyKey, topic);
    if (caseData) {
      parts.push(`\n아래는 이 학원의 프로그램·사례·소개 자료입니다. 주제와 관련된 내용을 적극 반영하세요:`);
      parts.push(caseData);
      console.log(`  📚 케이스 데이터 로드 완료 (${options.academyKey})`);
    }
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

  // 디버깅용: 기획 데이터 임시 저장
  try {
    const debugPath = join(__dirname, '..', 'temp', 'last-research.json');
    await writeFile(debugPath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`  💾 기획 데이터 저장: temp/last-research.json`);
  } catch { /* ignore */ }

  console.log(`  ✅ 카드 ${result.cards.length}장 카피 생성 완료`);
  return result;
}
