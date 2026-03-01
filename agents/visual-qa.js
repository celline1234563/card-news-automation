import Anthropic from '@anthropic-ai/sdk';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { designCard } from './gemini-designer.js';
import { buildSystemPrompt } from './prompt-builder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Anthropic();
const MAX_DESIGN_RETRY = parseInt(process.env.MAX_DESIGN_RETRY || '2');

/**
 * Claude Vision으로 단일 PNG 검증
 */
export async function validatePNG(pngPath, card) {
  const imageData = await readFile(pngPath);
  const base64 = imageData.toString('base64');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/png', data: base64 },
        },
        {
          type: 'text',
          text: `이 인스타그램 카드뉴스 이미지를 평가해주세요.
카드 번호: ${card.number}, 타입: ${card.type}, 헤드라인: "${card.headline}"

반드시 JSON으로만 응답하세요:
{
  "readability": (1-10, 텍스트 가독성),
  "text_cutoff": (true/false, 텍스트가 잘리거나 화면 밖으로 나갔는가),
  "image_broken": (true/false, 이미지가 깨졌거나 비정상인가),
  "aesthetic": (1-10, 전체적인 미적 점수),
  "issues": ["구체적 문제 설명 (없으면 빈 배열)"]
}`,
        },
      ],
    }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock) throw new Error('visual-qa: 응답 없음');

  let jsonStr = textBlock.text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  return JSON.parse(jsonStr);
}

/**
 * 전체 PNG 검증
 */
export async function validateAllPNGs(cards, pngPaths) {
  console.log('  👁️ PNG 비주얼 QA 시작...');

  const results = [];
  const failedCards = [];

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const pngPath = pngPaths[i];
    const paddedNum = String(card.number).padStart(2, '0');

    try {
      const result = await validatePNG(pngPath, card);
      results.push({ card: card.number, ...result });

      const pass = result.readability >= 6
        && !result.text_cutoff
        && !result.image_broken
        && result.aesthetic >= 6;

      if (!pass) {
        failedCards.push(card.number);
        console.log(`  ❌ 카드 ${paddedNum}: 가독성=${result.readability}, 미적=${result.aesthetic}, 텍스트잘림=${result.text_cutoff}`);
      } else {
        console.log(`  ✅ 카드 ${paddedNum}: 가독성=${result.readability}, 미적=${result.aesthetic}`);
      }
    } catch (err) {
      console.log(`  ⚠️ 카드 ${paddedNum}: QA 스킵 (${err.message})`);
      results.push({ card: card.number, readability: 0, aesthetic: 0, text_cutoff: false, image_broken: false, issues: [`QA 실패: ${err.message}`] });
    }
  }

  console.log(`  👁️ PNG QA 완료: ${cards.length - failedCards.length}장 통과, ${failedCards.length}장 미달`);
  return { results, failedCards };
}

/**
 * QA + 미달 카드 재생성 오케스트레이터
 */
export async function qaAndRegenerate(cards, cssVariables, academyConfig, outputDir, options = {}) {
  const pngPaths = cards.map((_, i) =>
    join(outputDir, `card-${String(i + 1).padStart(2, '0')}.png`)
  );

  const { results, failedCards } = await validateAllPNGs(cards, pngPaths);

  // QA 리포트 저장
  const reportPath = join(outputDir, 'qa-report.json');
  await mkdir(outputDir, { recursive: true });
  await writeFile(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    total_cards: cards.length,
    passed: cards.length - failedCards.length,
    failed: failedCards.length,
    results,
  }, null, 2));
  console.log(`  📋 QA 리포트: ${reportPath}`);

  // 미달 카드 재생성
  if (failedCards.length > 0 && MAX_DESIGN_RETRY > 0) {
    console.log(`  🔄 미달 카드 재생성 시도 (최대 ${MAX_DESIGN_RETRY}회)...`);

    const academyKey = options.academyKey || 'ollinone';
    const systemPrompt = await buildSystemPrompt(academyKey, academyConfig, options);
    const usedLayouts = cards.map(c => c.layout_used || c.layout_hint || `card-${c.number}`);

    for (let retry = 0; retry < MAX_DESIGN_RETRY; retry++) {
      for (const cardNum of failedCards) {
        const card = cards.find(c => c.number === cardNum);
        if (!card) continue;

        console.log(`  🔄 카드 ${cardNum} 재디자인 (시도 ${retry + 1})`);
        try {
          const newHtml = await designCard(card, cssVariables, academyConfig, usedLayouts, {
            ...options,
            academyKey,
            systemPrompt,
          });
          card.generated_html = newHtml;
          card._regenerated = true;
        } catch (err) {
          console.log(`  ⚠️ 카드 ${cardNum} 재디자인 실패: ${err.message}`);
        }
      }
    }
  }

  return { cards, qaReport: results, failedCards };
}
