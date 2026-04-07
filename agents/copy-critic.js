import Anthropic from '@anthropic-ai/sdk';
import { readFile, mkdir, appendFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Anthropic();
const MAX_RETRY = parseInt(process.env.MAX_COPY_RETRY || '2');
const PASS_SCORE = parseInt(process.env.COPY_PASS_SCORE || '7');

async function logToFile(message) {
  const logDir = join(__dirname, '..', 'logs');
  await mkdir(logDir, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  const logPath = join(logDir, `${today}.log`);
  const timestamp = new Date().toISOString();
  await appendFile(logPath, `[${timestamp}] [copy-critic] ${message}\n`);
}

async function safeReadFile(filePath) {
  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return '';
  }
}

/**
 * 원고 10장 일괄 채점
 */
async function scoreCopies(copies, cards, academyConfig, options = {}) {
  const systemPrompt = await readFile(
    join(__dirname, '..', 'prompts', 'copy-critic-system.txt'), 'utf-8'
  );

  const voiceGuide = options.academyKey
    ? await safeReadFile(join(__dirname, '..', 'config', 'brand', `${options.academyKey}-voice.md`))
    : '';

  // 카드 기획안 + 원고를 합쳐서 전달
  const cardsWithCopy = cards.map(card => {
    const copy = copies.find(c => c.card === card.number);
    const lines = [];
    lines.push(`[카드 ${card.number}]`);
    lines.push(`타입: ${card.type}`);
    lines.push(`헤드라인: ${(card.headline || '').replace(/<\/?em>/g, '')}`);
    if (card.subtext) lines.push(`서브텍스트: ${card.subtext}`);
    lines.push('---원고---');
    lines.push(copy ? copy.text : '(원고 없음)');
    if (copy?.hashtags) lines.push(`해시태그: ${copy.hashtags.join(' ')}`);
    lines.push(`글자수: ${copy ? copy.text.length : 0}자`);
    return lines.join('\n');
  }).join('\n\n');

  const userMessage = `아래 카드뉴스 10장의 원고를 채점해주세요.

학원: ${academyConfig.name}
메인키워드: ${options.keyword || ''}
통과 점수: ${PASS_SCORE}점/10점

${voiceGuide ? `## 보이스 가이드\n${voiceGuide}\n` : ''}
## 카드별 기획안 + 원고

${cardsWithCopy}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock) throw new Error('copy-critic: 응답에서 텍스트를 찾을 수 없음');

  let jsonStr = textBlock.text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  return JSON.parse(jsonStr);
}

/**
 * Stage: 원고 검수 + 미달 카드 교체
 *
 * @param {Object[]} copies - copywriter 결과 [{ card, text, hashtags }]
 * @param {Object[]} cards - 기획안 카드 배열
 * @param {Object} academyConfig - 학원 설정
 * @param {Object} [options]
 * @param {string} [options.keyword] - 메인 키워드
 * @param {string} [options.academyKey] - 학원 키
 * @returns {Promise<{ copies: Object[], criticResult: Object }>}
 */
export async function critiqueCopies(copies, cards, academyConfig, options = {}) {
  console.log('  📋 원고 검수 시작...');

  let currentCopies = [...copies];
  let lastResult = null;
  let attempt = 0;

  while (attempt < MAX_RETRY) {
    attempt++;

    // rate limit 방지: 재시도 시 대기
    if (attempt > 1) await new Promise(r => setTimeout(r, 10000 * attempt));

    try {
      const result = await scoreCopies(currentCopies, cards, academyConfig, options);
      lastResult = result;

      // 점수 로그
      const scoreLog = result.card_scores
        .map(cs => `카드${cs.card}:${cs.total}`)
        .join(' ');
      console.log(`  [${attempt}/${MAX_RETRY}] ${scoreLog} | 평균: ${result.overall_score}`);

      const failedCards = result.rewrite_needed || [];

      if (failedCards.length === 0) {
        console.log(`  ✅ 원고 전체 통과! (평균 ${result.overall_score}점)`);
        await logToFile(`PASS: 평균 ${result.overall_score}점 (${attempt}회차)`);
        return { copies: currentCopies, criticResult: result };
      }

      console.log(`  ⚠️ 미달 카드: ${failedCards.join(', ')}`);

      // 미달 카드의 개선안으로 교체
      for (const cardNum of failedCards) {
        const scoreEntry = result.card_scores.find(cs => cs.card === cardNum);
        if (scoreEntry?.improved_text) {
          const idx = currentCopies.findIndex(c => c.card === cardNum);
          if (idx !== -1) {
            currentCopies[idx] = {
              ...currentCopies[idx],
              text: scoreEntry.improved_text,
              hashtags: scoreEntry.improved_hashtags || currentCopies[idx].hashtags,
            };
            console.log(`  📝 카드 ${cardNum} 교체 (${scoreEntry.total}→개선안)`);
          }
        }
      }

      await logToFile(`RETRY: ${attempt}회차 미달 카드 ${failedCards.join(',')} 교체`);

    } catch (err) {
      console.warn(`  ⚠️ 검수 실패 (${attempt}회차): ${err.message}`);
      await logToFile(`ERROR: ${attempt}회차 검수 실패 - ${err.message}`);
    }
  }

  // 재시도 소진: 현재 버전 강제 사용
  console.log(`  ⚠️ ${MAX_RETRY}회 소진. 현재 버전 강제 사용 (평균 ${lastResult?.overall_score || '?'}점)`);
  await logToFile(`FORCE: ${MAX_RETRY}회 소진. 평균 ${lastResult?.overall_score || '?'}점`);

  return { copies: currentCopies, criticResult: lastResult };
}
