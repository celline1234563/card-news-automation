import puppeteer from 'puppeteer';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { join } from 'path';

/**
 * emphasis_style에 맞게 <em> 태그에 클래스 추가
 */
function applyEmphasisStyle(html, emphasisStyle) {
  if (!html) return '';
  return html.replace(/<em>/g, `<em class="${emphasisStyle || 'highlight'}">`);
}

/**
 * 카드 데이터 → HTML 문자열
 */
export function buildCardHTML(card, cssVariables, academyName) {
  const headline = applyEmphasisStyle(card.headline, card.emphasis_style);
  const subtext = card.subtext || '';
  const cardNumber = String(card.number).padStart(2, '0');

  // data 타입이면 stat 섹션 추가
  let statSection = '';
  if (card.type === 'data' && card.stat) {
    statSection = `
      <div class="stat-section">
        <span class="stat-number">${card.stat}</span>
        <span class="stat-label">${card.stat_label || ''}</span>
      </div>`;
  }

  // CTA 카드 학원명 치환
  const processedHeadline = headline.replace('{{ACADEMY_NAME}}', academyName);
  const processedSubtext = subtext.replace('{{ACADEMY_NAME}}', academyName);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<style>
${cssVariables}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  width: 1080px;
  height: 1350px;
  overflow: hidden;
  font-family: 'Noto Sans KR', sans-serif;
  background: var(--color-background);
  color: var(--color-text);
}

.card {
  width: 1080px;
  height: 1350px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 80px;
  position: relative;
}

.card-number {
  position: absolute;
  top: 40px;
  right: 50px;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
  opacity: 0.6;
}

.academy-name {
  position: absolute;
  top: 42px;
  left: 50px;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
}

.headline {
  font-size: 52px;
  font-weight: 900;
  line-height: 1.4;
  text-align: center;
  margin-bottom: 40px;
  word-break: keep-all;
  max-width: 900px;
}

.subtext {
  font-size: 28px;
  font-weight: 400;
  line-height: 1.6;
  text-align: center;
  color: var(--color-text);
  opacity: 0.75;
  max-width: 800px;
  word-break: keep-all;
}

.stat-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40px;
}

.stat-number {
  font-size: 120px;
  font-weight: 900;
  color: var(--color-accent);
  line-height: 1.1;
}

.stat-label {
  font-size: 26px;
  font-weight: 400;
  color: var(--color-text);
  opacity: 0.7;
  margin-top: 10px;
  text-align: center;
}

/* emphasis styles */
em.highlight {
  font-style: normal;
  background: var(--color-highlight);
  padding: 2px 8px;
}

em.color {
  font-style: normal;
  color: var(--color-primary);
  font-weight: 900;
}

em.underline {
  font-style: normal;
  border-bottom: 6px solid var(--color-accent);
  padding-bottom: 2px;
}

/* 데코 라인 */
.deco-line {
  width: 60px;
  height: 5px;
  background: var(--color-primary);
  border-radius: 3px;
  margin-bottom: 50px;
}

/* CTA 카드 스타일 */
.cta-badge {
  display: inline-block;
  background: var(--color-primary);
  color: white;
  font-size: 24px;
  font-weight: 700;
  padding: 16px 48px;
  border-radius: 50px;
  margin-top: 40px;
}
</style>
</head>
<body>
<div class="card">
  <span class="academy-name">${academyName}</span>
  <span class="card-number">${cardNumber} / 10</span>
  <div class="deco-line"></div>
  ${statSection}
  <h1 class="headline">${processedHeadline}</h1>
  <p class="subtext">${processedSubtext}</p>
  ${card.type === 'cta' ? '<div class="cta-badge">상담 문의하기</div>' : ''}
</div>
</body>
</html>`;
}

/**
 * Puppeteer로 카드 HTML → PNG 렌더링
 */
export async function renderCards(cards, cssVariables, academyName, outputDir) {
  await mkdir(outputDir, { recursive: true });

  console.log('  🖨️  Puppeteer 브라우저 시작...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const htmlSources = [];

  try {
    for (const card of cards) {
      // Gemini가 생성한 HTML이 있으면 우선 사용, 없으면 하드코딩 폴백
      let html = card.generated_html || buildCardHTML(card, cssVariables, academyName);
      const source = card.generated_html ? 'Gemini' : 'fallback';

      // {{BG_IMAGE_URL}} 플레이스홀더를 실제 data URI로 치환
      if (card.bg_image_url && html.includes('{{BG_IMAGE_URL}}')) {
        try {
          const imgBuffer = await readFile(card.bg_image_url);
          const dataUri = `data:image/png;base64,${imgBuffer.toString('base64')}`;
          html = html.replaceAll('{{BG_IMAGE_URL}}', dataUri);
        } catch {
          console.log(`  ⚠️  카드 ${String(card.number).padStart(2, '0')}: 배경 이미지 로드 실패, 무시`);
        }
      }

      htmlSources.push(html);

      console.log(`  📄 카드 ${String(card.number).padStart(2, '0')}: ${source} HTML 사용`);
      const page = await browser.newPage();

      await page.setViewport({ width: 1080, height: 1350 });
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Google Fonts 로딩 대기
      await page.evaluate(() => document.fonts.ready);

      const filename = `card-${String(card.number).padStart(2, '0')}.png`;
      const filepath = join(outputDir, filename);

      await page.screenshot({ path: filepath, type: 'png' });
      await page.close();

      console.log(`  ✅ ${filename} 저장 완료`);
    }
  } finally {
    await browser.close();
  }

  // copy.json 저장
  const copyPath = join(outputDir, 'copy.json');
  await writeFile(copyPath, JSON.stringify({ cards }, null, 2), 'utf-8');
  console.log('  ✅ copy.json 저장 완료');

  return { htmlSources };
}
