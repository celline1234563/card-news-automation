import puppeteer from 'puppeteer';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 학원 로고를 base64 data URI로 로드
 */
async function loadLogoDataUri(academyKey) {
  const logoPath = join(__dirname, '..', 'config', 'logos', `${academyKey}.png`);
  if (!existsSync(logoPath)) return null;
  const buf = await readFile(logoPath);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

/**
 * HTML에 로고 오버레이를 주입 (</body> 앞에 삽입)
 */
function injectLogo(html, logoDataUri, academyName) {
  if (!logoDataUri) return html;

  const logoImg = `<img src="${logoDataUri}" style="height:40px; object-fit:contain; display:block;" />`;
  let replaced = false;

  if (academyName) {
    // 1) brand 관련 클래스가 있는 태그: 텍스트를 로고로 교체 (원래 위치 유지)
    const brandClassRe = /(<(?:div|span|footer|p|section)[^>]*class="[^"]*(?:brand-bar|brand-name|brand-info|brand-label|academy)[^"]*"[^>]*>)[\s\S]*?(<\/(?:div|span|footer|p|section)>)/gi;
    if (brandClassRe.test(html)) {
      replaced = true;
      html = html.replace(brandClassRe, `$1${logoImg}$2`);
      // brand 클래스 스타일에서 배경색/폰트 제거하고 로고에 맞게 조정
      html = html.replace(/(\.(?:brand-bar|brand-name|brand-info|brand-label|academy)\s*\{)([^}]*)\}/gi, (m, prefix, body) => {
        // 배경색/텍스트 관련 속성 제거, 패딩/정렬만 유지
        const cleaned = body
          .replace(/background-color\s*:[^;]+;?/gi, '')
          .replace(/background\s*:[^;]+;?/gi, '')
          .replace(/color\s*:[^;]+;?/gi, '')
          .replace(/font-size\s*:[^;]+;?/gi, '')
          .replace(/font-weight\s*:[^;]+;?/gi, '')
          .replace(/letter-spacing\s*:[^;]+;?/gi, '');
        return `${prefix}${cleaned} display:flex; align-items:center; justify-content:center;}`;
      });
    }

    // 2) brand 클래스 없이 학원명 텍스트"만" 들어있는 태그: 로고로 교체
    const nameOnlyRe = new RegExp(`(<(?:span|div|footer|p|section)[^>]*>)\\s*${academyName}\\s*(<\\/(?:span|div|footer|p|section)>)`, 'gs');
    if (!replaced && nameOnlyRe.test(html)) {
      replaced = true;
      html = html.replace(nameOnlyRe, `$1${logoImg}$2`);
    } else {
      // brand 클래스로 이미 교체했으면, 학원명"만" 들어있는 나머지 태그는 제거
      html = html.replace(new RegExp(`<(?:span|div|footer|p|section)[^>]*>\\s*${academyName}\\s*</(?:span|div|footer|p|section)>`, 'gs'), '');
    }

    // 3) "학원명 | N/10" 패턴은 제거 (번호 표시 불필요)
    html = html.replace(new RegExp(`<(?:span|div|footer|p|section)[^>]*>[^<]*${academyName}[^<]*\\|[^<]*</(?:span|div|footer|p|section)>`, 'gs'), '');

    // 4) 로고 img 바로 옆에 남은 학원명 텍스트만 제거 (헤드라인 등 콘텐츠 텍스트는 보존)
    html = html.replace(new RegExp(`(${logoImg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\s*${academyName}`, 'g'), '$1');
    html = html.replace(new RegExp(`${academyName}\\s*(${logoImg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'g'), '$1');
  }

  // 5) 기존 brand/로고/footer 영역 모두 제거 (Gemini가 생성한 모든 로고/학원명 요소)
  html = html.replace(/<(?:div|span|footer|p|section)[^>]*class="[^"]*(?:brand|logo|watermark|academy|footer)[^"]*"[^>]*>[\s\S]*?<\/(?:div|span|footer|p|section)>/gi, '');
  // footer 태그 자체도 제거 (class 없이 <footer>로만 된 경우)
  html = html.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');

  // 6) 중앙 하단 로고 워터마크 — 항상 1개만 삽입 (누끼 스타일)
  const watermarkHtml = `
<div style="position:fixed; bottom:32px; left:50%; transform:translateX(-50%); z-index:9999; pointer-events:none;">
  <img src="${logoDataUri}" style="height:60px; object-fit:contain; opacity:0.35;" />
</div>`;
  html = html.replace('</body>', watermarkHtml + '\n</body>');

  return html;
}

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
  font-size: 64px;
  font-weight: 900;
  line-height: 1.35;
  text-align: center;
  margin-bottom: 40px;
  word-break: keep-all;
  max-width: 900px;
}

.subtext {
  font-size: 34px;
  font-weight: 400;
  line-height: 1.5;
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
  font-size: 140px;
  font-weight: 900;
  color: var(--color-accent);
  line-height: 1.1;
}

.stat-label {
  font-size: 30px;
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
  font-size: 30px;
  font-weight: 700;
  padding: 20px 56px;
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
export async function renderCards(cards, cssVariables, academyName, outputDir, academyKey) {
  await mkdir(outputDir, { recursive: true });

  // 로고 로드
  const logoDataUri = academyKey ? await loadLogoDataUri(academyKey) : null;
  if (logoDataUri) {
    console.log(`  🏷️  ${academyName} 로고 로드 완료`);
  }

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
          let imgBuffer;
          if (card.bg_image_url.startsWith('http')) {
            // Drive URL 등 원격 이미지 → fetch로 다운로드
            const res = await fetch(card.bg_image_url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            imgBuffer = Buffer.from(await res.arrayBuffer());
          } else {
            // 로컬 파일 (Imagen 생성 이미지)
            imgBuffer = await readFile(card.bg_image_url);
          }
          const mimeType = card.bg_image_url.startsWith('http') ? 'image/jpeg' : 'image/png';
          const dataUri = `data:${mimeType};base64,${imgBuffer.toString('base64')}`;
          html = html.replaceAll('{{BG_IMAGE_URL}}', dataUri);
        } catch (err) {
          console.log(`  ⚠️  카드 ${String(card.number).padStart(2, '0')}: 배경 이미지 로드 실패 (${err.message}), 무시`);
        }
      }

      // {{ACADEMY_NAME}} 등 남은 플레이스홀더 치환
      html = html.replaceAll('{{ACADEMY_NAME}}', academyName);
      html = html.replaceAll('{{academy_name}}', academyName);
      html = html.replaceAll('{<<ACADEMY_NAME}', academyName);
      html = html.replaceAll('<<ACADEMY_NAME>>', academyName);

      // 로고 주입 (기존 학원명 텍스트 제거 + 로고 삽입)
      html = injectLogo(html, logoDataUri, academyName);

      htmlSources.push(html);

      console.log(`  📄 카드 ${String(card.number).padStart(2, '0')}: ${source} HTML 사용`);
      const page = await browser.newPage();

      await page.setViewport({ width: 1080, height: 1350 });
      await page.setContent(html, { waitUntil: 'load', timeout: 120000 });

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
