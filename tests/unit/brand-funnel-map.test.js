import { describe, it, expect } from 'vitest';
import {
  monthWeeks, cafeKeywords, classifyKind, allowedTargets, heuristicLink, isFunnelMapDue, nextMonth,
} from '../../scripts/brand-funnel-map.js';

describe('monthWeeks', () => {
  it('3일 안 되는 첫 조각은 다음 주에 붙인다 (2026-11-01 일요일)', () => {
    const w = monthWeeks(2026, 11);
    expect(w[0]).toEqual({ start: '2026-11-01', end: '2026-11-08' });
    expect(w.at(-1)).toEqual({ start: '2026-11-23', end: '2026-11-30' });
    expect(w).toHaveLength(4);
  });
});

describe('cafeKeywords', () => {
  it('카페 글 제목과 조회수를 나눈다', () => {
    expect(cafeKeywords('카페: 채점지옥 (634) · 수학 개별진도 고민 (1,801)')).toEqual([
      { text: '채점지옥', count: 634 },
      { text: '수학 개별진도 고민', count: 1801 },
    ]);
    expect(cafeKeywords('자사 블로그 내신 분석')).toEqual([]);
  });
});

describe('classifyKind', () => {
  it('제목 접두어로 채널을 가른다', () => {
    expect(classifyKind('[에리브 릴스] x', [])).toBe('reel');
    expect(classifyKind('[에리브 웨비나] x', [])).toBe('webinar');
    expect(classifyKind('[에리브·학원운영] x', ['검수 대기'])).toBe('carousel');
    expect(classifyKind('에리브 퍼널 구조도 · 2026년 11월', [])).toBe(null);
  });
});

describe('연결 규칙', () => {
  const reel = { id: 'r', date: '2026-11-04', cafe: [{ text: '상담예약 읽씹', count: 627 }] };
  const mids = [
    { id: 'w-past', kind: 'webinar', date: '2026-11-01', cafe: [] },
    { id: 'w', kind: 'webinar', date: '2026-11-06', cafe: [] },
    { id: 'b', kind: 'blog', date: '2026-11-09', cafe: [{ text: '상담예약 읽씹', count: 627 }] },
  ];
  it('지난 웨비나로는 보내지 않는다', () => {
    expect(allowedTargets(reel, mids).map((m) => m.id)).toEqual(['w', 'b']);
  });
  it('같은 카페 글을 쓰는 블로그를 맞음으로 잡는다', () => {
    expect(heuristicLink(reel, allowedTargets(reel, mids))).toMatchObject({ targetId: 'b', fit: 'good' });
  });
});

describe('일정', () => {
  it('25일 10시부터 다음 달 것을 만든다', () => {
    expect(isFunnelMapDue(new Date(2026, 10, 25, 9))).toBe(false);
    expect(isFunnelMapDue(new Date(2026, 10, 25, 10))).toBe(true);
    expect(isFunnelMapDue(new Date(2026, 10, 28, 0))).toBe(true);
    expect(nextMonth(new Date(2026, 11, 25))).toEqual({ year: 2027, month: 1 });
  });
});
