/**
 * 올인원 수학학원 기존 copy.json을 수정된 템플릿으로 재적용 + 재렌더링
 *
 * 사용법: node scripts/retemplate-ollinone.js [폴더명]
 *   폴더명 생략 시 모든 올인원 수학학원 폴더 대상
 */
import 'dotenv/config';
import { readFile, writeFile, readdir, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import { selectAll } from '../agents/template-selector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

async function loadLogoDataUri(academyKey) {
  const logoPath = join(ROOT, 'config', 'logos', `${academyKey}.png`);
  if (!existsSync(logoPath)) return null;
  const buf = await readFile(logoPath);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

function injectLogo(html, logoDataUri, academyName) {
  if (!logoDataUri) return html;
  if (academyName) {
    html = html.replace(new RegExp(`<(?:span|div|footer)[^>]*>\\s*${academyName}\\s*</(?:span|div|footer)>`, 'gs'), '');
    html = html.replace(/<div[^>]*class="[^"]*(?:brand-bar|brand-name|brand-info|academy)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  }
  // 중앙 하단 로고 워터마크 (투명도 40%)
  const logoHtml = `
<div style="position:fixed; bottom:32px; left:50%; transform:translateX(-50%); z-index:9999; pointer-events:none; opacity:0.4;">
  <img src="${logoDataUri}" style="height:80px; object-fit:contain;" />
</div>`;
  return html.replace('</body>', logoHtml + '\n</body>');
}

async function main() {
  const academyKey = 'ollinone';
  const configPath = join(ROOT, 'config', 'academies.json');
  const academies = JSON.parse(await readFile(configPath, 'utf-8'));
  const academy = academies[academyKey];

  if (!academy) {
    console.error('올인원 수학학원 설정을 찾을 수 없습니다.');
    process.exit(1);
  }

  const academyConfig = { name: academy.name, theme: academy.theme };
  const logoDataUri = await loadLogoDataUri(academyKey);

  // 대상 폴더 결정
  const outputDir = join(ROOT, 'output');
  const targetFolder = process.argv[2];
  let folders;

  if (targetFolder) {
    folders = [targetFolder];
  } else {
    const allDirs = await readdir(outputDir);
    folders = allDirs.filter(d => d.startsWith('올인원 수학학원'));
  }

  console.log(`\n🏫 올인원 수학학원 템플릿 재적용 시작`);
  console.log(`📂 대상 폴더: ${folders.length}개\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (const folder of folders) {
      const folderPath = join(outputDir, folder);
      const copyPath = join(folderPath, 'copy.json');

      if (!existsSync(copyPath)) {
        console.log(`  ⏭ ${folder}: copy.json 없음, 스킵`);
        continue;
      }

      console.log(`\n=== ${folder} ===`);

      const copyData = JSON.parse(await readFile(copyPath, 'utf-8'));
      const cards = copyData.cards;

      // 1. 템플릿 재적용 (새 HTML 생성)
      await selectAll(cards, academyConfig);

      // 2. copy.json 업데이트
      await writeFile(copyPath, JSON.stringify(copyData, null, 2), 'utf-8');
      console.log(`  📝 copy.json 업데이트 완료`);

      // 3. PNG 재렌더링
      for (const card of cards) {
        let html = card.generated_html;
        if (!html) {
          console.log(`  ⏭ 카드 ${card.number}: generated_html 없음`);
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
              const dataUri = `data:image/png;base64,${imgBuffer.toString('base64')}`;
              html = html.replaceAll('{{BG_IMAGE_URL}}', dataUri);
            }
          } catch (err) {
            console.log(`  ⚠️  카드 ${card.number}: 배경 이미지 로드 실패`);
          }
        }

        html = html.replaceAll('{{ACADEMY_NAME}}', academy.name);
        html = html.replaceAll('{{academy_name}}', academy.name);
        html = injectLogo(html, logoDataUri, academy.name);

        const page = await browser.newPage();
        await page.setViewport({ width: 1080, height: 1350 });
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.evaluate(() => document.fonts.ready);

        const filename = `card-${String(card.number).padStart(2, '0')}.png`;
        const filepath = join(folderPath, filename);
        await page.screenshot({ path: filepath, type: 'png' });
        await page.close();

        console.log(`  ✅ ${filename} (${card.layout_used})`);
      }
    }
  } finally {
    await browser.close();
  }

  console.log('\n🎉 전체 재렌더링 완료!');
}

main().catch(console.error);
