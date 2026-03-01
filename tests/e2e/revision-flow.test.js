import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockResearchResponse, createTestCards } from '../mocks/api-mocks.js';

/**
 * 수정요청 → 재기획 E2E 테스트
 */

vi.mock('../../agents/notion-connector.js', () => ({
  getByStatus: vi.fn().mockResolvedValue([]),
  getComments: vi.fn().mockResolvedValue([]),
  getRevisionInstructions: vi.fn().mockResolvedValue([]),
  getPageContent: vi.fn().mockResolvedValue({
    fullText: `카드 1 [hook]\n헤드라인: 기존 헤드라인\n서브텍스트: 기존 서브`,
    planningContent: null,
  }),
  writePlanAndCopy: vi.fn().mockResolvedValue(undefined),
  setStatus: vi.fn().mockResolvedValue(undefined),
  appendFilePaths: vi.fn().mockResolvedValue(undefined),
  markRevisionComplete: vi.fn().mockResolvedValue(undefined),
  postRevisionDiff: vi.fn().mockResolvedValue(undefined),
  postErrorComment: vi.fn().mockResolvedValue(undefined),
  extractTopic: vi.fn().mockImplementation(title => {
    const match = title.match(/^\[[^\]]+\]\s*(.+)/);
    return match ? match[1].trim() : title;
  }),
}));

vi.mock('../../agents/researcher.js', () => ({
  research: vi.fn().mockResolvedValue(mockResearchResponse()),
}));

vi.mock('../../agents/config-loader.js', () => ({
  loadConfig: vi.fn().mockResolvedValue({
    academy: {
      name: '올인원 수학학원',
      theme: { primary: '#202487' },
      mood: ['스마트한'],
      drive_folder_id: 'folder-123',
    },
    cssVariables: ':root { --color-primary: #202487; }',
  }),
}));

vi.mock('../../index.js', () => ({
  runPipeline: vi.fn().mockResolvedValue({
    cards: createTestCards(10),
    outputDir: '/tmp/output',
    pngPaths: Array(10).fill('/tmp/card.png'),
    htmlSources: Array(10).fill('<html></html>'),
  }),
}));

describe('Revision Flow E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('수정 요청을 감지하고 재기획한다', async () => {
    const notion = await import('../../agents/notion-connector.js');
    const { research } = await import('../../agents/researcher.js');
    const { runPipeline } = await import('../../index.js');

    // 디자인 수정 페이지
    notion.getByStatus.mockImplementation(async (status) => {
      if (status === '디자인 수정') {
        return [{
          id: 'page-rev-001',
          title: '[올인원] 수정 대상 주제',
          academyKey: 'ollinone',
          keyword: '수학',
          statusChangedAt: '2026-02-01T00:00:00.000Z',
        }];
      }
      return [];
    });

    // @수정 댓글
    notion.getRevisionInstructions.mockResolvedValue([
      '1번 카드 헤드라인을 더 자극적으로 변경해주세요',
    ]);

    const { runOnce } = await import('../../poller.js');
    await runOnce();

    // 수정 지시가 researcher에 전달되었는지 확인
    expect(research).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        revisionInstructions: ['1번 카드 헤드라인을 더 자극적으로 변경해주세요'],
      }),
    );

    // diff 댓글 기록
    expect(notion.postRevisionDiff).toHaveBeenCalledWith(
      'page-rev-001',
      expect.any(Array),
      expect.any(Array),
    );

    // 파이프라인 실행
    expect(runPipeline).toHaveBeenCalled();

    // 수정 완료 처리
    expect(notion.markRevisionComplete).toHaveBeenCalledWith(
      'page-rev-001',
      expect.any(Array),
    );

    // 상태 변경
    expect(notion.setStatus).toHaveBeenCalledWith('page-rev-001', '디자인 수정 완료');
  });

  it('@수정 댓글이 없으면 스킵한다', async () => {
    const notion = await import('../../agents/notion-connector.js');
    const { research } = await import('../../agents/researcher.js');

    notion.getByStatus.mockImplementation(async (status) => {
      if (status === '디자인 수정') {
        return [{
          id: 'page-rev-002',
          title: '[올인원] 댓글 없는 수정',
          academyKey: 'ollinone',
          keyword: '',
          statusChangedAt: '2026-02-01T00:00:00.000Z',
        }];
      }
      return [];
    });

    notion.getRevisionInstructions.mockResolvedValue([]);

    const { runOnce } = await import('../../poller.js');
    await runOnce();

    expect(research).not.toHaveBeenCalled();
  });
});
