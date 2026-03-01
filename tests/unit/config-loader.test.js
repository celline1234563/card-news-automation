import { describe, it, expect } from 'vitest';
import { loadAcademyConfig, loadTokens, generateCSSVariables, generateTokenCSSVariables, loadConfig } from '../../agents/config-loader.js';

describe('config-loader', () => {
  describe('loadAcademyConfig', () => {
    it('올인원 설정을 정상 로드한다', async () => {
      const config = await loadAcademyConfig('ollinone');
      expect(config.name).toBe('올인원 수학학원');
      expect(config.theme.primary).toBe('#202487');
      expect(config.mood).toContain('스마트한');
    });

    it('진학 설정을 정상 로드한다', async () => {
      const config = await loadAcademyConfig('jinhak');
      expect(config.name).toBe('진학학원');
      expect(config.theme.primary).toBe('#081459');
    });

    it('없는 학원 ID는 에러를 던진다', async () => {
      await expect(loadAcademyConfig('nonexistent')).rejects.toThrow('찾을 수 없습니다');
    });
  });

  describe('loadTokens', () => {
    it('올인원 토큰을 정상 로드한다', async () => {
      const tokens = await loadTokens('ollinone');
      expect(tokens).not.toBeNull();
      expect(tokens.academy).toBe('ollinone');
      expect(tokens.color.primary).toBe('#202487');
      expect(tokens.typography.size.display).toBe(72);
      expect(tokens.spacing.canvas.width).toBe(1080);
      expect(tokens.spacing.canvas.height).toBe(1350);
    });

    it('없는 학원 토큰은 null을 반환한다', async () => {
      const tokens = await loadTokens('nonexistent');
      expect(tokens).toBeNull();
    });
  });

  describe('generateCSSVariables', () => {
    it('테마 객체에서 CSS 변수 블록을 생성한다', () => {
      const theme = {
        primary: '#202487',
        secondary: '#fff3c8',
        background: '#F8F8FF',
        text: '#1A1A2E',
        highlight: '#fff3c8',
        accent: '#202487',
      };
      const css = generateCSSVariables(theme);
      expect(css).toContain(':root');
      expect(css).toContain('--color-primary: #202487');
      expect(css).toContain('--color-secondary: #fff3c8');
    });
  });

  describe('generateTokenCSSVariables', () => {
    it('토큰에서 확장 CSS 변수를 생성한다', async () => {
      const tokens = await loadTokens('ollinone');
      const css = generateTokenCSSVariables(tokens);
      expect(css).toContain(':root');
      expect(css).toContain('--color-primary');
      expect(css).toContain('--surface-card');
      expect(css).toContain('--text-heading');
      expect(css).toContain('--font-size-display: 72px');
      expect(css).toContain('--space-lg: 24px');
      expect(css).toContain('--shadow-subtle');
      expect(css).toContain('--radius-md: 16px');
    });

    it('null 토큰은 빈 문자열을 반환한다', () => {
      const css = generateTokenCSSVariables(null);
      expect(css).toBe('');
    });
  });

  describe('loadConfig', () => {
    it('학원 설정과 CSS 변수를 한번에 로드한다', async () => {
      const { academy, cssVariables } = await loadConfig('ollinone');
      expect(academy.name).toBe('올인원 수학학원');
      expect(cssVariables).toContain('--color-primary');
    });
  });
});
