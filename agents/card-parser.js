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

    // 기본 필드
    const headline = block.match(/헤드라인:\s*(.+)/);
    if (headline) card.headline = headline[1].trim();

    const subtext = block.match(/서브텍스트:\s*([\s\S]*?)(?=\n(?:레이아웃|통계|인용|CTA|항목|단계|사진|기획|콘텐츠|시각|강조|감정|디자인|포컬|장식|비교|좌항|우항|인용응답|발신|CTA설명|카드 \d)|\n*$)/);
    if (subtext) card.subtext = subtext[1].trim();

    const layoutHint = block.match(/레이아웃힌트:\s*(.+)/);
    if (layoutHint) card.layout_hint = layoutHint[1].trim();

    // 통계
    const stat = block.match(/통계:\s*(\S+)\s*(.*)/);
    if (stat) {
      card.stat = stat[1].trim();
      card.stat_label = stat[2]?.trim() || '';
    }

    // 인용
    const quote = block.match(/인용:\s*"(.+?)"/);
    if (quote) card.quote_main = quote[1];

    const quoteSub = block.match(/인용응답:\s*"(.+?)"/);
    if (quoteSub) card.quote_sub = quoteSub[1];

    const sender = block.match(/발신자:\s*(.+)/);
    if (sender) card.sender = sender[1].trim();

    // CTA
    const cta = block.match(/CTA:\s*(.+)/);
    if (cta) card.cta_text = cta[1].trim();

    const ctaSub = block.match(/CTA설명:\s*(.+)/);
    if (ctaSub) card.cta_sub = ctaSub[1].trim();

    // 항목
    const items = block.match(/항목:\s*(.+)/);
    if (items) {
      card.items = items[1].split(/\s*\/\s*/);
    }

    // 단계
    const steps = block.match(/단계:\s*(.+)/);
    if (steps) {
      card.steps = steps[1].split(/\s*→\s*/).map(s => ({ title: s.trim() }));
    }

    // 비교 (compare 카드)
    const beforeTitle = block.match(/비교좌:\s*(.+)/);
    if (beforeTitle) card.before_title = beforeTitle[1].trim();

    const afterTitle = block.match(/비교우:\s*(.+)/);
    if (afterTitle) card.after_title = afterTitle[1].trim();

    const beforeItems = block.match(/좌항목:\s*(.+)/);
    if (beforeItems) card.before_items = beforeItems[1].trim();

    const afterItems = block.match(/우항목:\s*(.+)/);
    if (afterItems) card.after_items = afterItems[1].trim();

    // ★ 사진/비주얼 필드 (이전에 누락되었던 핵심 필드들)
    const imageCategory = block.match(/사진카테고리:\s*(.+)/);
    if (imageCategory) card.image_category = imageCategory[1].trim();

    const visualAsset = block.match(/시각자료:\s*(.+)/);
    if (visualAsset) card.visual_asset = visualAsset[1].trim();

    // 기획/디자인 필드
    const contentBrief = block.match(/기획의도:\s*(.+)/);
    if (contentBrief) card.content_brief = contentBrief[1].trim();

    const emphasisStyle = block.match(/강조스타일:\s*(.+)/);
    if (emphasisStyle) card.emphasis_style = emphasisStyle[1].trim();

    const emotion = block.match(/감정:\s*(.+)/);
    if (emotion) card.emotion = emotion[1].trim();

    const designBrief = block.match(/디자인브리프:\s*(.+)/);
    if (designBrief) card.design_brief = designBrief[1].trim();

    const focalPoint = block.match(/포컬포인트:\s*(.+)/);
    if (focalPoint) card.focal_point = focalPoint[1].trim();

    const decoIcons = block.match(/장식아이콘:\s*(.+)/);
    if (decoIcons) card.deco_icons = decoIcons[1].split(/\s*,\s*/);

    // content_bullets (여러 줄)
    const bulletsMatch = block.match(/콘텐츠:\n((?:\s*•\s*.+\n?)+)/);
    if (bulletsMatch) {
      card.content_bullets = bulletsMatch[1]
        .split('\n')
        .map(l => l.replace(/^\s*•\s*/, '').trim())
        .filter(Boolean);
    }

    cards.push(card);
  }

  return cards;
}
