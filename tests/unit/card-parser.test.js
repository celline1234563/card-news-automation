import { describe, it, expect } from 'vitest';
import { parseCardsFromContent } from '../../agents/card-parser.js';

describe('card-parser', () => {
  describe('parseCardsFromContent', () => {
    it('기본 카드 블록을 파싱한다', () => {
      const text = `카드 1 [hook]
헤드라인: 중3 3월, 이미 늦었습니다
서브텍스트: 지금 시작하지 않으면

카드 2 [problem]
헤드라인: 왜 수학이 흔들릴까요
서브텍스트: 중2부터 시작되는 변화`;

      const cards = parseCardsFromContent(text);
      expect(cards).toHaveLength(2);
      expect(cards[0].number).toBe(1);
      expect(cards[0].type).toBe('hook');
      expect(cards[0].headline).toBe('중3 3월, 이미 늦었습니다');
      expect(cards[0].subtext).toBe('지금 시작하지 않으면');
      expect(cards[1].number).toBe(2);
      expect(cards[1].type).toBe('problem');
    });

    it('레이아웃힌트를 파싱한다', () => {
      const text = `카드 1 [hook]
헤드라인: 테스트
레이아웃힌트: big-quote`;

      const cards = parseCardsFromContent(text);
      expect(cards[0].layout_hint).toBe('big-quote');
    });

    it('통계 필드를 파싱한다', () => {
      const text = `카드 4 [data]
헤드라인: 통계 카드
통계: 73% 가 성적 급락`;

      const cards = parseCardsFromContent(text);
      expect(cards[0].stat).toBe('73%');
      expect(cards[0].stat_label).toBe('가 성적 급락');
    });

    it('인용문을 파싱한다', () => {
      const text = `카드 2 [problem]
헤드라인: 학부모 고민
인용: "중학교 때는 잘했는데"`;

      const cards = parseCardsFromContent(text);
      expect(cards[0].quote_main).toBe('중학교 때는 잘했는데');
    });

    it('CTA를 파싱한다', () => {
      const text = `카드 10 [cta]
헤드라인: 상담 신청
CTA: 무료 상담 신청하기`;

      const cards = parseCardsFromContent(text);
      expect(cards[0].cta_text).toBe('무료 상담 신청하기');
    });

    it('항목을 파싱한다', () => {
      const text = `카드 6 [solution]
헤드라인: 해결책
항목: 첫번째 / 두번째 / 세번째`;

      const cards = parseCardsFromContent(text);
      expect(cards[0].items).toEqual(['첫번째', '두번째', '세번째']);
    });

    it('단계를 파싱한다', () => {
      const text = `카드 5 [insight]
헤드라인: 원인 분석
단계: 진단 → 설계 → 실행 → 평가`;

      const cards = parseCardsFromContent(text);
      expect(cards[0].steps).toHaveLength(4);
      expect(cards[0].steps[0].title).toBe('진단');
      expect(cards[0].steps[2].title).toBe('실행');
    });

    it('빈 텍스트는 빈 배열을 반환한다', () => {
      const cards = parseCardsFromContent('');
      expect(cards).toEqual([]);
    });

    it('형식에 맞지 않는 텍스트는 무시한다', () => {
      const text = `이것은 카드가 아닙니다
그냥 텍스트입니다`;

      const cards = parseCardsFromContent(text);
      expect(cards).toEqual([]);
    });

    it('10장 전체를 파싱한다', () => {
      const lines = [];
      for (let i = 1; i <= 10; i++) {
        lines.push(`카드 ${i} [hook]\n헤드라인: 카드 ${i}\n서브텍스트: 설명 ${i}`);
      }
      const cards = parseCardsFromContent(lines.join('\n'));
      expect(cards).toHaveLength(10);
      expect(cards[9].number).toBe(10);
    });
  });
});
