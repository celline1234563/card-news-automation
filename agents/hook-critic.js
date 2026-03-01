import Anthropic from '@anthropic-ai/sdk';
import { readFile, mkdir, appendFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Anthropic();
const MAX_RETRY = parseInt(process.env.MAX_HOOK_RETRY || '3');
const PASS_SCORE = parseInt(process.env.HOOK_PASS_SCORE || '7');

async function logToFile(message) {
  const logDir = join(__dirname, '..', 'logs');
  await mkdir(logDir, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  const logPath = join(logDir, `${today}.log`);
  const timestamp = new Date().toISOString();
  await appendFile(logPath, `[${timestamp}] [hook-critic] ${message}\n`);
}

/**
 * 1번 카드(후킹) 채점
 */
async function scoreHook(card, academyConfig) {
  const systemPromptPath = join(__dirname, '..', 'prompts', 'hook-expert-system.txt');
  const systemPrompt = await readFile(systemPromptPath, 'utf-8');

  const userMessage = `아래 카드뉴스 1번 카드(후킹)를 채점해주세요.

학원: ${academyConfig.name}
학원 대상: ${academyConfig.grade?.join(', ') || '초중등'}
학원 과목: ${academyConfig.subject || '수학'}
학원 지역: ${academyConfig.region || ''}

헤드라인: ${card.headline}
서브텍스트: ${card.subtext}
강조 스타일: ${card.emphasis_style}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock) throw new Error('hook-critic: 응답에서 텍스트를 찾을 수 없음');

  let jsonStr = textBlock.text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  return JSON.parse(jsonStr);
}

/**
 * Stage 2: 후킹 카드 채점 + 재작성 루프
 *
 * @param {Object} card - cards[0] (1번 카드)
 * @param {Object} academyConfig - 학원 설정
 * @returns {Object} 최종 승인된 1번 카드
 */
export async function critiqueHook(card, academyConfig) {
  console.log('  🎯 1번 카드 후킹 채점 시작...');

  let bestCard = { ...card };
  let bestScore = 0;
  let attempt = 0;

  while (attempt < MAX_RETRY) {
    attempt++;
    const currentCard = attempt === 1 ? card : bestCard;

    // rate limit 방지: 재시도 시 대기 (지수 백오프)
    if (attempt > 1) await new Promise(r => setTimeout(r, 10000 * attempt));

    try {
      const result = await scoreHook(currentCard, academyConfig);
      const total = result.total;

      console.log(`  [${attempt}/${MAX_RETRY}] 점수: ${total}/7 (궁금증:${result.scores.curiosity} 공감:${result.scores.empathy} 구체성:${result.scores.specificity} 언어:${result.scores.language} 클릭:${result.scores.click_urge})`);

      // 최고점 업데이트
      if (total > bestScore) {
        bestScore = total;
        bestCard = { ...currentCard };
        if (result.improved_headline && total < PASS_SCORE) {
          // 다음 라운드를 위해 개선안 준비
          bestCard._next_headline = result.improved_headline;
          bestCard._next_subtext = result.improved_subtext;
        }
      }

      // 통과
      if (total >= PASS_SCORE) {
        console.log(`  ✅ 후킹 통과! (${total}점)`);
        await logToFile(`PASS: ${total}점 (${attempt}회차) headline="${currentCard.headline}"`);
        return currentCard;
      }

      // 미달 — 개선안으로 교체
      if (result.improved_headline) {
        console.log(`  📝 피드백: ${result.feedback}`);
        bestCard = {
          ...currentCard,
          headline: result.improved_headline,
          subtext: result.improved_subtext || currentCard.subtext,
        };
        // _next 필드 정리
        delete bestCard._next_headline;
        delete bestCard._next_subtext;
      }

    } catch (err) {
      console.warn(`  ⚠️  채점 실패 (${attempt}회차): ${err.message}`);
      await logToFile(`ERROR: ${attempt}회차 채점 실패 - ${err.message}`);
    }
  }

  // 3회 초과: 최고점 버전 강제 사용
  console.log(`  ⚠️  ${MAX_RETRY}회 초과. 최고점(${bestScore}점) 버전 강제 사용`);
  await logToFile(`FORCE: ${bestScore}점 (${MAX_RETRY}회 소진) headline="${bestCard.headline}"`);

  return bestCard;
}
