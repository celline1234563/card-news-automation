import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONFIG_PATH = join(__dirname, '..', 'config', 'academies.json');
const TOKENS_DIR = join(__dirname, '..', 'config', 'tokens');

/**
 * 학원 설정 로드
 */
export async function loadAcademyConfig(academyId) {
  const raw = await readFile(CONFIG_PATH, 'utf-8');
  const academies = JSON.parse(raw);
  const academy = academies[academyId];

  if (!academy) {
    throw new Error(`학원 ID "${academyId}"를 찾을 수 없습니다. academies.json을 확인하세요.`);
  }

  return academy;
}

/**
 * 디자인 토큰 로드
 */
export async function loadTokens(academyId) {
  const tokenPath = join(TOKENS_DIR, `${academyId}-tokens.json`);
  try {
    const raw = await readFile(tokenPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * 테마 객체 → CSS 변수 블록 생성 (기존 6색 호환)
 */
export function generateCSSVariables(theme) {
  return `:root {
  --color-primary: ${theme.primary};
  --color-secondary: ${theme.secondary};
  --color-background: ${theme.background};
  --color-text: ${theme.text};
  --color-highlight: ${theme.highlight};
  --color-accent: ${theme.accent};
}`;
}

/**
 * 토큰 기반 확장 CSS 변수 블록 생성
 */
export function generateTokenCSSVariables(tokens) {
  if (!tokens) return '';

  const lines = [':root {'];

  // 기본 색상
  lines.push(`  --color-primary: ${tokens.color.primary};`);
  lines.push(`  --color-secondary: ${tokens.color.secondary};`);
  lines.push(`  --color-background: ${tokens.color.background};`);
  lines.push(`  --color-text: ${tokens.color.text};`);
  lines.push(`  --color-highlight: ${tokens.color.highlight};`);
  lines.push(`  --color-accent: ${tokens.color.accent};`);

  // Surface (overlay 변수는 제외 — 이미지 위 텍스트 오버레이 금지 정책)
  if (tokens.color.surface) {
    for (const [key, val] of Object.entries(tokens.color.surface)) {
      if (key.startsWith('overlay')) continue; // overlay 변수 제외
      lines.push(`  --surface-${key.replace(/_/g, '-')}: ${val};`);
    }
  }

  // Text variants
  if (tokens.color.text_variants) {
    for (const [key, val] of Object.entries(tokens.color.text_variants)) {
      lines.push(`  --text-${key}: ${val};`);
    }
  }

  // Semantic
  if (tokens.color.semantic) {
    for (const [key, val] of Object.entries(tokens.color.semantic)) {
      lines.push(`  --color-${key}: ${val};`);
    }
  }

  // Typography
  if (tokens.typography) {
    lines.push(`  --font-main: ${tokens.typography.font_family};`);
    for (const [key, val] of Object.entries(tokens.typography.size)) {
      lines.push(`  --font-size-${key.replace(/_/g, '-')}: ${val}px;`);
    }
    for (const [key, val] of Object.entries(tokens.typography.weight)) {
      lines.push(`  --font-weight-${key}: ${val};`);
    }
    for (const [key, val] of Object.entries(tokens.typography.line_height)) {
      lines.push(`  --line-height-${key}: ${val};`);
    }
  }

  // Spacing
  if (tokens.spacing) {
    lines.push(`  --canvas-width: ${tokens.spacing.canvas.width}px;`);
    lines.push(`  --canvas-height: ${tokens.spacing.canvas.height}px;`);
    lines.push(`  --safe-area: ${tokens.spacing.canvas.safe_area}px;`);
    for (const [key, val] of Object.entries(tokens.spacing.scale)) {
      lines.push(`  --space-${key}: ${val}px;`);
    }
  }

  // Effects
  if (tokens.effects) {
    for (const [key, val] of Object.entries(tokens.effects.shadow)) {
      lines.push(`  --shadow-${key}: ${val};`);
    }
    for (const [key, val] of Object.entries(tokens.effects.radius)) {
      const cssVal = typeof val === 'number' ? `${val}px` : val;
      lines.push(`  --radius-${key}: ${cssVal};`);
    }
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * 학원 설정 + CSS 변수 한번에 로드
 */
export async function loadConfig(academyId) {
  const academy = await loadAcademyConfig(academyId);
  const tokens = await loadTokens(academyId);

  // 토큰이 있으면 토큰 기반 CSS, 없으면 기존 테마 기반 CSS
  const cssVariables = tokens
    ? generateTokenCSSVariables(tokens)
    : generateCSSVariables(academy.theme);

  return { academy, cssVariables, tokens };
}
