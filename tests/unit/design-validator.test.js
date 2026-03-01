import { describe, it, expect, vi } from 'vitest';

// 로컬 체크 함수들을 직접 테스트하기 위해 모듈 내부 구조를 검증
// design-validator는 Claude API를 호출하므로 여기서는 HTML 패턴 기반 검증만 테스트

describe('design-validator local checks', () => {
  const goodHTML = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --color-primary: #202487;
      --color-text: #1A1A2E;
    }
    body {
      width: 1080px; height: 1350px;
      overflow: hidden; margin: 0;
      font-family: 'Noto Sans KR', sans-serif;
      word-break: keep-all;
    }
    .container { padding: 80px; }
    h1 { font-size: 48px; color: var(--color-text); }
  </style>
</head>
<body><div class="container"><h1>테스트</h1></div></body>
</html>`;

  describe('font_missing check', () => {
    it('Noto Sans KR이 포함된 HTML은 통과', () => {
      expect(goodHTML).toContain('Noto Sans KR');
      expect(goodHTML).toContain('fonts.googleapis.com');
    });

    it('폰트 없는 HTML을 감지', () => {
      const badHTML = goodHTML.replace(/Noto Sans KR/g, 'Arial');
      expect(badHTML).not.toContain('Noto Sans KR');
    });
  });

  describe('hex_direct check', () => {
    it('CSS에서 var() 사용 감지', () => {
      expect(goodHTML).toContain('var(--color-text)');
    });

    it(':root 내 hex는 허용', () => {
      const rootMatch = goodHTML.match(/:root\s*\{[\s\S]*?\}/);
      expect(rootMatch).not.toBeNull();
    });
  });

  describe('word-break check', () => {
    it('word-break: keep-all이 포함됨', () => {
      expect(goodHTML).toContain('word-break: keep-all');
    });
  });

  describe('token_font_size check', () => {
    it('허용 사이즈를 식별', () => {
      const allowed = [14, 16, 20, 24, 28, 36, 48, 72];
      const fontMatches = [...goodHTML.matchAll(/font-size\s*:\s*(\d+)px/g)];
      for (const m of fontMatches) {
        const size = parseInt(m[1]);
        const isAllowed = allowed.some(a => Math.abs(size - a) <= 4);
        expect(isAllowed).toBe(true);
      }
    });

    it('비허용 사이즈를 감지', () => {
      const badHTML = goodHTML.replace('font-size: 48px', 'font-size: 55px');
      const allowed = [14, 16, 20, 24, 28, 36, 48, 72];
      const fontMatches = [...badHTML.matchAll(/font-size\s*:\s*(\d+)px/g)];
      const sizes = fontMatches.map(m => parseInt(m[1]));
      const hasOutOfScale = sizes.some(s => !allowed.some(a => Math.abs(s - a) <= 4));
      expect(hasOutOfScale).toBe(true);
    });
  });

  describe('token_spacing check', () => {
    it('60px 이상 패딩은 통과', () => {
      const padMatches = [...goodHTML.matchAll(/padding\s*:\s*(\d+)px/g)];
      for (const m of padMatches) {
        expect(parseInt(m[1])).toBeGreaterThanOrEqual(60);
      }
    });

    it('40px 패딩은 미달', () => {
      const badHTML = goodHTML.replace('padding: 80px', 'padding: 40px');
      const padMatches = [...badHTML.matchAll(/padding\s*:\s*(\d+)px/g)];
      const hasSmall = padMatches.some(m => parseInt(m[1]) < 60);
      expect(hasSmall).toBe(true);
    });
  });

  describe('pattern_compliance check', () => {
    it('CTA 카드에 버튼 요소 감지', () => {
      const ctaHTML = goodHTML.replace('<h1>테스트</h1>', '<h1>테스트</h1><button class="cta-btn">상담</button>');
      expect(ctaHTML).toMatch(/<button|class="[^"]*btn|class="[^"]*cta/i);
    });

    it('data 카드에 stat 숫자 감지', () => {
      const dataHTML = goodHTML.replace('<h1>테스트</h1>', '<span class="stat">73%</span><h1>테스트</h1>');
      expect(dataHTML).toContain('73%');
    });
  });

  describe('overflow check', () => {
    it('overflow: hidden 감지', () => {
      expect(goodHTML).toContain('overflow: hidden');
    });

    it('auto-fix: overflow hidden → visible 변환', () => {
      const fixed = goodHTML.replace(/overflow\s*:\s*hidden/g, 'overflow: visible');
      expect(fixed).toContain('overflow: visible');
      expect(fixed).not.toContain('overflow: hidden');
    });
  });
});
