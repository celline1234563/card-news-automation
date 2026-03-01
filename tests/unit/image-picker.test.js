import { describe, it, expect } from 'vitest';
import { scoreCandidates } from '../../agents/image-picker.js';

describe('image-picker', () => {
  describe('scoreCandidates', () => {
    const candidates = [
      { id: 'f1', name: '수업사진-01.jpg', description: '수학 수업 중 학생들', createdTime: new Date().toISOString() },
      { id: 'f2', name: 'random-photo.jpg', description: '', createdTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'f3', name: '수학-학원-외관.jpg', description: '학원 건물 외관 사진', createdTime: new Date().toISOString() },
    ];

    const card = {
      number: 1,
      type: 'hook',
      headline: '수학 수업의 비밀',
      image_category: '수업사진',
    };

    it('키워드 매칭으로 점수를 매긴다', () => {
      const scored = scoreCandidates(candidates, card, new Set());
      expect(scored.length).toBe(3);
      // 수업사진이 파일명에 포함된 f1이 가장 높은 점수
      expect(scored[0].id).toBe('f1');
    });

    it('이미 사용된 이미지를 제외한다', () => {
      const usedImages = new Set(['f1']);
      const scored = scoreCandidates(candidates, card, usedImages);
      expect(scored.find(f => f.id === 'f1')).toBeUndefined();
      expect(scored.length).toBe(2);
    });

    it('모든 이미지가 사용된 경우 빈 배열 반환', () => {
      const usedImages = new Set(['f1', 'f2', 'f3']);
      const scored = scoreCandidates(candidates, card, usedImages);
      expect(scored).toHaveLength(0);
    });

    it('최신 이미지에 가산점을 준다', () => {
      const scored = scoreCandidates(candidates, card, new Set());
      const f1 = scored.find(f => f.id === 'f1');
      const f2 = scored.find(f => f.id === 'f2');
      // f1은 최신(30일 이내) + 키워드 매칭으로 더 높은 점수
      expect(f1.score).toBeGreaterThan(f2.score);
    });

    it('빈 후보 배열은 빈 결과 반환', () => {
      const scored = scoreCandidates([], card, new Set());
      expect(scored).toHaveLength(0);
    });
  });
});
