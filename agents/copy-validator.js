import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

/**
 * 디자인(HTML 텍스트)과 원고(copy text)가 기획(content_brief)과 일치하는지 검증
 *
 * @param {Object[]} cards - 기획 카드 배열 (content_brief, headline, subtext 포함)
 * @param {Object[]} copies - 원고 배열 [{ card, text }]
 * @returns {Promise<{ score: number, issues: string[], passed: boolean }>}
 */
export async function validateConsistency(cards, copies) {
  if (!copies || copies.length === 0) {
    console.log('  ⚠️ 원고가 없어 일치도 검증 스킵');
    return { score: 0, issues: ['원고 없음'], passed: false };
  }

  const pairs = cards.map(card => {
    const copy = copies.find(c => c.card === card.number);
    return {
      card: card.number,
      type: card.type,
      headline: (card.headline || '').replace(/<\/?em>/g, ''),
      subtext: card.subtext || '',
      content_brief: card.content_brief || '',
      copy_text: copy?.text || '(원고 없음)',
    };
  });

  const prompt = `당신은 카드뉴스 품질 검증 전문가입니다.

각 카드의 "기획 의도(content_brief)"를 기준으로, 디자인 텍스트(headline/subtext)와 원고(copy_text)가 기획과 일치하는지 검증하세요.

## 검증 기준
1. **메시지 일치**: 기획의 핵심 메시지가 디자인과 원고에 모두 반영됐는가?
2. **데이터 일치**: 기획에 언급된 수치/사례가 디자인과 원고에 동일하게 사용됐는가?
3. **톤 일치**: 기획의 서술 방향(톤)을 디자인과 원고가 따르고 있는가?
4. **금지 사항 준수**: 기획의 금지 사항을 위반하지 않았는가?

## 카드 데이터
${pairs.map(p => `
[카드 ${p.card}] (${p.type})
기획 의도: ${p.content_brief}
디자인 헤드라인: ${p.headline}
디자인 서브텍스트: ${p.subtext}
원고: ${p.copy_text}
`).join('\n---\n')}

아래 JSON으로만 반환:
{
  "overall_score": 1~10,
  "cards": [
    { "card": 1, "score": 1~10, "match": true/false, "issue": "문제가 있으면 한 줄 설명, 없으면 null" }
  ],
  "summary": "전체 요약 한 줄"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content.find(b => b.type === 'text')?.text || '';
  let jsonStr = text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  try {
    const result = JSON.parse(jsonStr);
    const issues = result.cards
      .filter(c => c.issue)
      .map(c => `카드 ${c.card}: ${c.issue}`);

    const passed = result.overall_score >= 7;

    console.log(`  📊 기획-디자인-원고 일치도: ${result.overall_score}/10`);
    if (issues.length > 0) {
      issues.forEach(i => console.log(`  🟡 ${i}`));
    } else {
      console.log('  ✅ 전체 일치!');
    }
    console.log(`  📋 ${result.summary}`);

    return { score: result.overall_score, issues, passed };
  } catch (e) {
    console.log(`  ⚠️ 검증 JSON 파싱 실패: ${e.message}`);
    return { score: 0, issues: ['파싱 실패'], passed: false };
  }
}
