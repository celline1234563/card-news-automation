/**
 * 기존 copy.json을 읽어 로고를 반영하여 재렌더링하는 스크립트
 *
 * 사용법: node scripts/re-render.js "output폴더명" --academy toktok
 */
import 'dotenv/config';
import { readFile, mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// --- 로고 로드 ---
async function loadLogoDataUri(academyKey) {
  const logoPath = join(ROOT, 'config', 'logos', `${academyKey}.png`);
  if (!existsSync(logoPath)) return null;
  const buf = await readFile(logoPath);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

// --- 로고 주입 (renderer.js와 동일 로직) ---
function injectLogo(html, logoDataUri, academyName) {
  if (!logoDataUri) return html;

  const logoImg = `<img src="${logoDataUri}" style="height:40px; object-fit:contain; display:block;" />`;
  let replaced = false;

  if (academyName) {
    const brandClassRe = /(<(?:div|span|footer|p|section)[^>]*class="[^"]*(?:brand-bar|brand-name|brand-info|brand-label|academy)[^"]*"[^>]*>)[\s\S]*?(<\/(?:div|span|footer|p|section)>)/gi;
    if (brandClassRe.test(html)) {
      replaced = true;
      html = html.replace(brandClassRe, `$1${logoImg}$2`);
      html = html.replace(/(\.(?:brand-bar|brand-name|brand-info|brand-label|academy)\s*\{)([^}]*)\}/gi, (m, prefix, body) => {
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

    const nameOnlyRe = new RegExp(`(<(?:span|div|footer|p|section)[^>]*>)\\s*${academyName}\\s*(<\\/(?:span|div|footer|p|section)>)`, 'gs');
    if (!replaced && nameOnlyRe.test(html)) {
      replaced = true;
      html = html.replace(nameOnlyRe, `$1${logoImg}$2`);
    } else if (replaced) {
      html = html.replace(new RegExp(`<(?:span|div|footer|p|section)[^>]*>\\s*${academyName}\\s*</(?:span|div|footer|p|section)>`, 'gs'), '');
    }

    html = html.replace(new RegExp(`<(?:span|div|footer|p|section)[^>]*>[^<]*${academyName}[^<]*\\|[^<]*</(?:span|div|footer|p|section)>`, 'gs'), '');
  }

  if (!replaced) {
    const fallbackHtml = `
<div style="position:fixed; bottom:32px; left:50%; transform:translateX(-50%); z-index:9999; pointer-events:none; display:flex; align-items:center; justify-content:center;">
  <img src="${logoDataUri}" style="height:40px; object-fit:contain;" />
</div>`;
    html = html.replace('</body>', fallbackHtml + '\n</body>');
  }

  return html;
}

// --- CLI 파싱 ---
function parseArgs() {
  const args = process.argv.slice(2);
  let folderName = null;
  let academyKey = 'toktok';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--academy' && args[i + 1]) {
      academyKey = args[i + 1];
      i++;
    } else if (!args[i].startsWith('--')) {
      folderName = args[i];
    }
  }

  if (!folderName) {
    console.error('사용법: node scripts/re-render.js "output폴더명" --academy toktok');
    process.exit(1);
  }

  return { folderName, academyKey };
}

// --- 학원 설정 로드 ---
async function loadAcademyConfig(academyKey) {
  const configPath = join(ROOT, 'config', 'academies.json');
  const config = JSON.parse(await readFile(configPath, 'utf-8'));
  return config[academyKey];
}

// --- 메인 ---
async function main() {
  const { folderName, academyKey } = parseArgs();
  const academy = await loadAcademyConfig(academyKey);

  if (!academy) {
    console.error(`학원 키 "${academyKey}"를 찾을 수 없습니다.`);
    process.exit(1);
  }

  const outputDir = join(ROOT, 'output', folderName);
  const copyPath = join(outputDir, 'copy.json');

  if (!existsSync(copyPath)) {
    console.error(`copy.json을 찾을 수 없습니다: ${copyPath}`);
    process.exit(1);
  }

  const copyData = JSON.parse(await readFile(copyPath, 'utf-8'));
  const cards = copyData.cards;

  console.log(`📂 폴더: ${folderName}`);
  console.log(`🏫 학원: ${academy.name} (${academyKey})`);
  console.log(`📄 카드 수: ${cards.length}`);

  // 로고 로드
  const logoDataUri = await loadLogoDataUri(academyKey);
  if (logoDataUri) {
    console.log(`🏷️  로고 로드 완료`);
  } else {
    console.log(`⚠️  로고 파일 없음 - 텍스트로 대체`);
  }

  // Puppeteer 렌더링
  console.log('🖨️  Puppeteer 브라우저 시작...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (const card of cards) {
      let html = card.generated_html;
      if (!html) {
        console.log(`  ⏭ 카드 ${card.number}: generated_html 없음, 스킵`);
        continue;
      }

      // 배경 이미지 처리
      if (card.bg_image_url && html.includes('{{BG_IMAGE_URL}}')) {
        try {
          let imgBuffer;
          if (card.bg_image_url.startsWith('http')) {
            const res = await fetch(card.bg_image_url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            imgBuffer = Buffer.from(await res.arrayBuffer());
          } else if (existsSync(card.bg_image_url)) {
            imgBuffer = await readFile(card.bg_image_url);
          }
          if (imgBuffer) {
            const mimeType = card.bg_image_url.startsWith('http') ? 'image/jpeg' : 'image/png';
            const dataUri = `data:${mimeType};base64,${imgBuffer.toString('base64')}`;
            html = html.replaceAll('{{BG_IMAGE_URL}}', dataUri);
          }
        } catch (err) {
          console.log(`  ⚠️  카드 ${card.number}: 배경 이미지 로드 실패 (${err.message})`);
        }
      }

      // 학원명 치환
      html = html.replaceAll('{{ACADEMY_NAME}}', academy.name);
      html = html.replaceAll('{{academy_name}}', academy.name);

      // 로고 주입
      html = injectLogo(html, logoDataUri, academy.name);

      // 렌더링
      const page = await browser.newPage();
      await page.setViewport({ width: 1080, height: 1350 });
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.evaluate(() => document.fonts.ready);

      const filename = `card-${String(card.number).padStart(2, '0')}.png`;
      const filepath = join(outputDir, filename);
      await page.screenshot({ path: filepath, type: 'png' });
      await page.close();

      console.log(`  ✅ ${filename} 재렌더링 완료`);
    }
  } finally {
    await browser.close();
  }

  console.log('\n🎉 재렌더링 완료!');
}

main().catch(console.error);
