import 'dotenv/config';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const OUTPUT_DIR = join(ROOT, 'output', '진학학원-우리학교-내신--옆-학교보다-어렵다----인근-고등학교-2026-03-20');

await mkdir(OUTPUT_DIR, { recursive: true });
console.log(`출력 폴더: ${OUTPUT_DIR}\n`);

// ── 로고 로드 ──
console.log('═══ 로고 로드 ═══');
const logoBuf = await readFile(join(ROOT, 'config', 'logos', 'jinhak.png'));
const logoDataUri = `data:image/png;base64,${logoBuf.toString('base64')}`;
console.log('  로고 로드 완료\n');

// ── 배경 이미지 로드 ──
console.log('═══ 배경 이미지 로드 ═══');
const bgBuf = await readFile(join(ROOT, 'temp', 'bg-school-geumcheon.png'));
const bgDataUri = `data:image/png;base64,${bgBuf.toString('base64')}`;
console.log('  배경 이미지 로드 완료\n');

// ── copy.json 로드 ──
const copyPath = join(OUTPUT_DIR, 'copy.json');
const copyData = JSON.parse(await readFile(copyPath, 'utf-8'));

// ── 공통 스타일 ──
const commonHead = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<style>
:root {
  --navy: #0B1340;
  --card-bg: #151B4A;
  --orange: #FF6B00;
  --white: #FFFFFF;
  --light-bg: #F5F6FA;
  --dim: rgba(255,255,255,0.5);
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1080px; height: 1350px;
  font-family: 'Noto Sans KR', sans-serif;
  color: var(--white);
  overflow: hidden; word-break: keep-all;
  position: relative; line-height: 1.45;
}
.bg-ring { position: absolute; border-radius: 50%; pointer-events: none; }
.top-logo { position: absolute; top: 40px; left: 64px; z-index: 10; background: rgba(255,255,255,0.95); padding: 8px 16px; border-radius: 8px; }
.top-logo img { height: 40px; object-fit: contain; }
.bottom-bar { position: absolute; bottom: 0; left: 0; width: 100%; height: 88px; background: rgba(11,19,64,0.95); display: flex; align-items: center; justify-content: space-between; padding: 0 48px; z-index: 20; }
.bottom-bar .bar-logo { background: rgba(255,255,255,0.95); padding: 6px 14px; border-radius: 6px; }
.bottom-bar .bar-logo img { height: 32px; object-fit: contain; }
.bottom-bar .bar-cta { background: var(--orange); color: var(--white); font-size: 22px; font-weight: 700; padding: 10px 28px; border-radius: 24px; }
`;

const commonRings = `
<div class="bg-ring" style="width:500px;height:500px;top:-120px;right:-120px;border:3px solid rgba(255,107,0,0.14);"></div>
<div class="bg-ring" style="width:350px;height:350px;bottom:150px;left:-100px;border:2px solid rgba(255,107,0,0.1);"></div>`;

const topLogo = `<div class="top-logo"><img src="${logoDataUri}" /></div>`;

// ════════════════════════════════════════════
// 카드 1 — Hook: warning tag + big headline + emphasis box + CTA arrow
// ════════════════════════════════════════════
const card1Html = `${commonHead}
body { background: var(--navy); }
.bg-photo { position: absolute; top: 0; left: 0; width: 100%; height: 640px; z-index: 0; }
.bg-photo img { width: 100%; height: 100%; object-fit: cover; object-position: center 40%; }
.bg-photo::after { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 280px; background: linear-gradient(to bottom, transparent 0%, var(--navy) 100%); }
.bg-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 640px; background: rgba(11,19,64,0.35); z-index: 1; }
.content { position: relative; display: flex; flex-direction: column; justify-content: flex-end; height: 100%; padding: 0 72px 160px; z-index: 5; }
.warning-tag { display: inline-block; background: var(--orange); color: var(--white); font-size: 28px; font-weight: 700; padding: 10px 28px; border-radius: 6px; margin-bottom: 32px; width: fit-content; letter-spacing: 1px; }
.headline { font-size: 82px; font-weight: 900; line-height: 1.2; margin-bottom: 24px; text-shadow: 0 4px 20px rgba(0,0,0,0.3); }
.headline .accent { color: var(--orange); }
.sub-copy { font-size: 30px; font-weight: 400; opacity: 0.65; margin-bottom: 48px; line-height: 1.6; }
.emphasis-box { border-left: 6px solid var(--orange); padding: 24px 32px; font-size: 34px; font-weight: 700; line-height: 1.7; background: rgba(255,107,0,0.07); border-radius: 0 10px 10px 0; max-width: 720px; }
.cta-circle { position: absolute; bottom: 56px; right: 64px; width: 100px; height: 100px; border-radius: 50%; background: var(--orange); display: flex; align-items: center; justify-content: center; z-index: 10; box-shadow: 0 6px 28px rgba(255,107,0,0.45); }
.cta-circle svg { width: 36px; height: 36px; fill: none; stroke: var(--white); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.bottom-logo-sm { position: absolute; bottom: 36px; left: 64px; z-index: 10; background: rgba(255,255,255,0.9); padding: 6px 12px; border-radius: 6px; }
.bottom-logo-sm img { height: 32px; object-fit: contain; }
</style>
</head>
<body>
<div class="bg-photo"><img src="${bgDataUri}" /></div>
<div class="bg-overlay"></div>
${commonRings}
${topLogo}
<div class="content">
  <div class="warning-tag">학교별 내신 비교</div>
  <h1 class="headline">우리 학교만<br><span class="accent">내신 어려운</span><br>거 아니야?</h1>
  <p class="sub-copy">옆 학교는 1등급 쉽게 나온다던데<br>우리 학교는 왜 이렇게 힘든 거지?</p>
  <div class="emphasis-box">같은 등급이라도<br>학교마다 난이도가 다릅니다</div>
</div>
<div class="cta-circle"><svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
<div class="bottom-logo-sm"><img src="${logoDataUri}" /></div>
</body></html>`;

// ── 렌더링 ──
console.log('═══ 카드 1 렌더링 ═══');
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350 });
  await page.setContent(card1Html, { waitUntil: 'load', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);

  const filepath = join(OUTPUT_DIR, 'card-01.png');
  await page.screenshot({ path: filepath, type: 'png' });
  await page.close();
  console.log('  ✅ card-01.png 저장 완료');

  // copy.json 업데이트
  copyData.cards[0].generated_html = card1Html;
  await writeFile(copyPath, JSON.stringify(copyData, null, 2), 'utf-8');
  console.log('  ✅ copy.json 업데이트 완료');
} finally {
  await browser.close();
}

console.log('\n═══ 완료 ═══');
