/**
 * Mock 팩토리 — Claude, Gemini, Notion, Drive 응답 Mock
 */

// ── Claude Mock ──

export function mockClaudeResponse(content) {
  return {
    content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content) }],
  };
}

export function mockHookCritiqueResponse(total = 7, pass = true) {
  return mockClaudeResponse({
    scores: { curiosity: 2, empathy: 2, specificity: 1, language: 1, click_urge: 1 },
    total,
    pass,
    feedback: pass ? '' : '개선 필요',
    improved_headline: pass ? '' : '개선된 <em>헤드라인</em>',
    improved_subtext: pass ? '' : '개선된 서브텍스트',
  });
}

export function mockValidatorResponse(pass = true, issues = []) {
  return mockClaudeResponse({ pass, issues, feedback: pass ? '' : '수정 필요' });
}

export function mockConsistencyResponse(score = 8) {
  return mockClaudeResponse({
    total_score: score,
    criteria: {
      color_consistency: { score: 3, max: 3, note: '' },
      header_footer: { score: 2, max: 2, note: '' },
      typography: { score: 1, max: 2, note: '' },
      spacing: { score: 1, max: 1, note: '' },
      layout_rhythm: { score: 1, max: 1, note: '' },
      visual_flow: { score: 0, max: 1, note: '' },
    },
    problem_cards: [],
    suggestions: [],
  });
}

export function mockResearchResponse() {
  return {
    topic: '테스트 주제',
    research_summary: '테스트 리서치 요약',
    cards: Array.from({ length: 10 }, (_, i) => ({
      number: i + 1,
      type: ['hook', 'problem', 'problem', 'data', 'insight', 'solution', 'solution', 'example', 'summary', 'cta'][i],
      headline: `테스트 헤드라인 ${i + 1}`,
      subtext: `테스트 서브텍스트 ${i + 1}`,
      emphasis_style: 'highlight',
      layout_hint: 'center-text',
      icon: 'check-circle',
      image_category: i === 0 ? '수업사진' : null,
    })),
  };
}

// ── Gemini Mock ──

export function mockGeminiHTMLResponse(cardNumber = 1) {
  return {
    text: `\`\`\`html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --color-primary: #202487;
      --color-secondary: #fff3c8;
      --color-background: #F8F8FF;
      --color-text: #1A1A2E;
      --color-highlight: #fff3c8;
      --color-accent: #202487;
    }
    body {
      width: 1080px;
      height: 1350px;
      overflow: hidden;
      margin: 0;
      font-family: 'Noto Sans KR', sans-serif;
      word-break: keep-all;
      background: var(--color-background);
    }
    .container { padding: 80px; }
    h1 { font-size: 48px; color: var(--color-text); }
    em { background: var(--color-highlight); font-style: normal; padding: 2px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>테스트 <em>헤드라인</em> ${cardNumber}</h1>
    <p>테스트 서브텍스트</p>
  </div>
</body>
</html>
\`\`\``,
  };
}

// ── Notion Mock ──

export function mockNotionPage(id = 'page-123', title = '[올인원] 테스트 주제', status = '기획 착수') {
  return {
    id,
    title,
    academyKey: 'ollinone',
    keyword: '테스트',
    statusChangedAt: new Date().toISOString(),
  };
}

export function mockNotionPages(status, count = 1) {
  return Array.from({ length: count }, (_, i) =>
    mockNotionPage(`page-${i}`, `[올인원] 테스트 주제 ${i}`, status)
  );
}

// ── Drive Mock ──

export function mockDriveFiles(count = 3) {
  return Array.from({ length: count }, (_, i) => ({
    id: `file-${i}`,
    name: `image-${i}.jpg`,
    mimeType: 'image/jpeg',
    createdTime: new Date().toISOString(),
    description: '수업 사진',
  }));
}

// ── Test Cards ──

export function createTestCards(count = 10) {
  const types = ['hook', 'problem', 'problem', 'data', 'insight', 'solution', 'solution', 'example', 'summary', 'cta'];
  return Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    type: types[i] || 'problem',
    headline: `테스트 헤드라인 ${i + 1}`,
    subtext: `테스트 서브텍스트 ${i + 1}`,
    emphasis_style: 'highlight',
    layout_hint: 'center-text',
    icon: 'check-circle',
    image_category: null,
    ...(i === 3 ? { stat: '73%', stat_label: '성적 향상' } : {}),
    ...(i === 9 ? { cta_text: '무료 상담', cta_sub: '카카오톡' } : {}),
  }));
}
