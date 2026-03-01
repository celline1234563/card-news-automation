import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockNotionPages, mockResearchResponse, mockGeminiHTMLResponse, createTestCards } from '../mocks/api-mocks.js';

/**
 * 노션 폴링 E2E 테스트 — 기획 착수 → 기획 컨펌 흐름
 */

vi.mock('../../agents/notion-connector.js', () => ({
  getByStatus: vi.fn().mockResolvedValue([]),
  getComments: vi.fn().mockResolvedValue([]),
  getPageContent: vi.fn().mockResolvedValue({ fullText: '', planningContent: null }),
  writePlanAndCopy: vi.fn().mockResolvedValue(undefined),
  setStatus: vi.fn().mockResolvedValue(undefined),
  extractTopic: vi.fn().mockImplementation(title => {
    const match = title.match(/^\[[^\]]+\]\s*(.+)/);
    return match ? match[1].trim() : title;
  }),
  extractAcademyKey: vi.fn().mockResolvedValue('ollinone'),
  postErrorComment: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../agents/researcher.js', () => ({
  research: vi.fn().mockResolvedValue(mockResearchResponse()),
}));

vi.mock('../../agents/config-loader.js', () => ({
  loadConfig: vi.fn().mockResolvedValue({
    academy: { name: '올인원 수학학원', theme: { primary: '#202487' }, mood: ['스마트한'] },
    cssVariables: ':root { --color-primary: #202487; }',
  }),
}));

describe('Notion Polling — 기획 착수 흐름', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('기획 착수 페이지를 감지하고 기획안을 작성한다', async () => {
    const notion = await import('../../agents/notion-connector.js');
    const { research } = await import('../../agents/researcher.js');

    // 기획 착수 페이지 1개 Mock
    notion.getByStatus.mockImplementation(async (status) => {
      if (status === '기획 착수') {
        return [{
          id: 'page-001',
          title: '[올인원] 중3 수학 전략',
          academyKey: 'ollinone',
          keyword: '중3 수학',
          statusChangedAt: new Date().toISOString(),
        }];
      }
      return [];
    });

    // poller의 핸들러를 직접 테스트
    const { runOnce } = await import('../../poller.js');
    await runOnce();

    // research가 호출되었는지 확인
    expect(research).toHaveBeenCalled();

    // 기획안이 작성되었는지 확인
    expect(notion.writePlanAndCopy).toHaveBeenCalledWith(
      'page-001',
      expect.any(Array),
      null, // 기획 단계에서는 원고 없음
    );

    // 상태가 '기획 컨펌'으로 변경되었는지 확인
    expect(notion.setStatus).toHaveBeenCalledWith('page-001', '기획 컨펌');
  });

  it('미등록 학원은 스킵한다', async () => {
    const notion = await import('../../agents/notion-connector.js');
    const { research } = await import('../../agents/researcher.js');

    notion.getByStatus.mockImplementation(async (status) => {
      if (status === '기획 착수') {
        return [{
          id: 'page-002',
          title: '[미등록] 알 수 없는 학원',
          academyKey: null,
          keyword: '',
          statusChangedAt: new Date().toISOString(),
        }];
      }
      return [];
    });

    const { runOnce } = await import('../../poller.js');
    await runOnce();

    expect(research).not.toHaveBeenCalled();
    expect(notion.writePlanAndCopy).not.toHaveBeenCalled();
  });
});
