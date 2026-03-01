import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockResearchResponse, mockGeminiHTMLResponse, createTestCards } from '../mocks/api-mocks.js';

/**
 * CLI 전체 파이프라인 E2E 테스트 (mock)
 *
 * 실제 API 호출 없이 파이프라인 흐름 검증
 * - 설정 로드 → 리서치 → 후킹 → 구조 → 이미지 → 디자인 → 검증 → 렌더
 */

// 모듈 mock
vi.mock('../../agents/researcher.js', () => ({
  research: vi.fn().mockResolvedValue(mockResearchResponse()),
}));

vi.mock('../../agents/hook-critic.js', () => ({
  critiqueHook: vi.fn().mockImplementation(async (card) => card),
}));

vi.mock('../../agents/structure-reviewer.js', () => ({
  reviewAndFix: vi.fn().mockImplementation(async (cards) => cards),
}));

vi.mock('../../agents/gemini-imager.js', () => ({
  generateAllImages: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../agents/series-harmonizer.js', () => ({
  harmonizeAndDesign: vi.fn().mockImplementation(async (cards) => {
    cards.forEach((card, i) => {
      card.generated_html = mockGeminiHTMLResponse(i + 1).text.match(/```html\s*([\s\S]*?)```/)[1];
      card.layout_used = `layout-${i + 1}`;
    });
    return cards;
  }),
}));

vi.mock('../../agents/design-validator.js', () => ({
  validateAll: vi.fn().mockImplementation(async (cards) => cards),
}));

vi.mock('../../agents/renderer.js', () => ({
  renderCards: vi.fn().mockResolvedValue({ htmlSources: Array(10).fill('<html></html>') }),
}));

vi.mock('../../agents/visual-qa.js', () => ({
  qaAndRegenerate: vi.fn().mockResolvedValue({ cards: [], qaReport: [], failedCards: [] }),
}));

vi.mock('../../agents/image-picker.js', () => ({
  pickAllImages: vi.fn().mockImplementation(async (cards) => cards),
}));

describe('CLI Pipeline E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('전체 파이프라인이 올바른 순서로 실행된다', async () => {
    const { runPipeline } = await import('../../index.js');
    const { research } = await import('../../agents/researcher.js');
    const { critiqueHook } = await import('../../agents/hook-critic.js');
    const { reviewAndFix } = await import('../../agents/structure-reviewer.js');
    const { generateAllImages } = await import('../../agents/gemini-imager.js');
    const { harmonizeAndDesign } = await import('../../agents/series-harmonizer.js');
    const { validateAll } = await import('../../agents/design-validator.js');
    const { renderCards } = await import('../../agents/renderer.js');

    const result = await runPipeline('테스트 주제', 'ollinone');

    // 모든 스테이지가 호출되었는지 확인
    expect(research).toHaveBeenCalledOnce();
    expect(critiqueHook).toHaveBeenCalledOnce();
    expect(reviewAndFix).toHaveBeenCalledOnce();
    expect(generateAllImages).toHaveBeenCalledOnce();
    expect(harmonizeAndDesign).toHaveBeenCalledOnce();
    expect(validateAll).toHaveBeenCalledOnce();
    expect(renderCards).toHaveBeenCalledOnce();

    // 결과 구조 확인
    expect(result.cards).toHaveLength(10);
    expect(result.outputDir).toBeDefined();
    expect(result.pngPaths).toHaveLength(10);
  });

  it('skipResearch 옵션이 동작한다', async () => {
    const { runPipeline } = await import('../../index.js');
    const { research } = await import('../../agents/researcher.js');

    const testCards = createTestCards(10);
    await runPipeline('테스트', 'ollinone', {
      copyData: { cards: testCards },
      skipResearch: true,
    });

    expect(research).not.toHaveBeenCalled();
  });
});
