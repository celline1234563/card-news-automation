/**
 * 카드 파싱 모듈 — poller.js에서 추출
 * 🎯/📄 callout 텍스트에서 카드 데이터 복원
 */

/**
 * "카드 1 [hook]\n헤드라인: ...\n서브텍스트: ..." → { number, type, headline, ... }
 */
export function parseCardsFromContent(fullText) {
  const cards = [];
  const cardBlocks = fullText.split(/(?=카드 \d+ \[)/);

  for (const block of cardBlocks) {
    const headerMatch = block.match(/^카드 (\d+) \[(\w+)\]/);
    if (!headerMatch) continue;

    const card = {
      number: parseInt(headerMatch[1]),
      type: headerMatch[2],
    };

    const headline = block.match(/헤드라인:\s*(.+)/);
    if (headline) card.headline = headline[1].trim();

    const subtext = block.match(/서브텍스트:\s*(.+)/);
    if (subtext) card.subtext = subtext[1].trim();

    const layoutHint = block.match(/레이아웃힌트:\s*(.+)/);
    if (layoutHint) card.layout_hint = layoutHint[1].trim();

    const stat = block.match(/통계:\s*(\S+)\s*(.*)/);
    if (stat) {
      card.stat = stat[1].trim();
      card.stat_label = stat[2]?.trim() || '';
    }

    const quote = block.match(/인용:\s*"(.+?)"/);
    if (quote) card.quote_main = quote[1];

    const cta = block.match(/CTA:\s*(.+)/);
    if (cta) card.cta_text = cta[1].trim();

    const items = block.match(/항목:\s*(.+)/);
    if (items) {
      card.items = items[1].split(/\s*\/\s*/);
    }

    const steps = block.match(/단계:\s*(.+)/);
    if (steps) {
      card.steps = steps[1].split(/\s*→\s*/).map(s => ({ title: s.trim() }));
    }

    cards.push(card);
  }

  return cards;
}
