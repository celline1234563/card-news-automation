import { describe, it, expect } from 'vitest';
import { extractAcademyKey, extractTopic } from '../../agents/notion-connector.js';

describe('notion-connector', () => {
  describe('extractAcademyKey', () => {
    it('올인원 접두어를 올바르게 매핑한다', async () => {
      const key = await extractAcademyKey('[올인원] 중3에 시작해야 하는 이유');
      expect(key).toBe('ollinone');
    });

    it('진학 접두어를 올바르게 매핑한다', async () => {
      const key = await extractAcademyKey('[진학] 초등 영어 학원 선택');
      expect(key).toBe('jinhak');
    });

    it('톡톡 접두어를 올바르게 매핑한다', async () => {
      const key = await extractAcademyKey('[톡톡] 국제학교 준비');
      expect(key).toBe('toktok');
    });

    it('접두어 없는 제목은 null 반환', async () => {
      const key = await extractAcademyKey('접두어 없는 제목');
      expect(key).toBeNull();
    });

    it('알 수 없는 접두어는 null 반환', async () => {
      const key = await extractAcademyKey('[모름] 알 수 없는 학원');
      expect(key).toBeNull();
    });
  });

  describe('extractTopic', () => {
    it('접두어를 제거하고 주제만 추출한다', () => {
      const topic = extractTopic('[올인원] 중3에 시작해야 하는 이유');
      expect(topic).toBe('중3에 시작해야 하는 이유');
    });

    it('접두어 없는 제목은 그대로 반환한다', () => {
      const topic = extractTopic('접두어 없는 주제');
      expect(topic).toBe('접두어 없는 주제');
    });

    it('공백을 trim 한다', () => {
      const topic = extractTopic('[진학]   앞뒤 공백 있는 주제  ');
      expect(topic).toBe('앞뒤 공백 있는 주제');
    });
  });
});
