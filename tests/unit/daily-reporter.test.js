import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectGrade } from '../../agents/daily-reporter.js';

describe('daily-reporter', () => {
  describe('detectGrade', () => {
    const ollinone = { grade: ['중학생', '고등학생'] };
    const jinhak = { grade: ['초등', '중등', '고등'] };
    const toktok = { grade: ['초등'] };

    it('중1~중3 키워드 → 중등', () => {
      expect(detectGrade('[올인원] 중3에 시작해야 하는 이유', ollinone)).toBe('중등');
      expect(detectGrade('[진학] 중1 수학 기초', jinhak)).toBe('중등');
      expect(detectGrade('[진학] 중2 내신 대비', jinhak)).toBe('중등');
    });

    it('중학 키워드 → 중등', () => {
      expect(detectGrade('[올인원] 중학 수학 로드맵', ollinone)).toBe('중등');
    });

    it('고1~고3 키워드 → 고등', () => {
      expect(detectGrade('[올인원] 고1 첫 시험 전략', ollinone)).toBe('고등');
      expect(detectGrade('[진학] 고2 수학 심화', jinhak)).toBe('고등');
      expect(detectGrade('[진학] 고3 마무리', jinhak)).toBe('고등');
    });

    it('수능/내신/고등 키워드 → 고등', () => {
      expect(detectGrade('[올인원] 수능 수학 전략', ollinone)).toBe('고등');
      expect(detectGrade('[올인원] 내신 완벽 대비', ollinone)).toBe('고등');
      expect(detectGrade('[진학] 고등 수학 입문', jinhak)).toBe('고등');
    });

    it('초1~초6, 초등 키워드 → 초등', () => {
      expect(detectGrade('[진학] 초3 수학 기초', jinhak)).toBe('초등');
      expect(detectGrade('[톡톡] 초등 영어 시작', toktok)).toBe('초등');
      expect(detectGrade('[진학] 초6 예비 중등', jinhak)).toBe('초등');
    });

    it('키워드 없으면 학원 기본 grade 첫번째 값', () => {
      expect(detectGrade('[올인원] 수학 학습 습관', ollinone)).toBe('중학생');
      expect(detectGrade('[진학] 겨울방학 특강', jinhak)).toBe('초등');
      expect(detectGrade('[톡톡] 영어 읽기 습관', toktok)).toBe('초등');
    });

    it('academy config 없으면 "전체"', () => {
      expect(detectGrade('[미등록] 알 수 없는 학원', null)).toBe('전체');
      expect(detectGrade('[미등록] 알 수 없는 학원', undefined)).toBe('전체');
    });

    it('먼저 매칭되는 등급이 우선 (중등 > 고등 순서)', () => {
      // "중3에서 고등 준비" → 중등이 먼저 매칭
      expect(detectGrade('[올인원] 중3에서 고등 준비', ollinone)).toBe('중등');
    });
  });
});
