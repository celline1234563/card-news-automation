import 'dotenv/config';
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const OUTPUT_DIR = join(ROOT, 'output', '진학학원--진학-고등-3-1--2026-03-11');

// ── 로고 로드 ──
console.log('═══ 로고 로드 ═══');
const logoBuf = await readFile(join(ROOT, 'config', 'logos', 'jinhak.png'));
const logoDataUri = `data:image/png;base64,${logoBuf.toString('base64')}`;
console.log('  ✅ jinhak.png 로고 로드 완료\n');

// ── copy.json 로드 ──
console.log('═══ copy.json 로드 ═══');
const raw = await readFile(join(OUTPUT_DIR, 'copy.json'), 'utf-8');
const copyData = JSON.parse(raw);
console.log(`  카드 ${copyData.cards.length}장 로드 완료\n`);

// ── 카드 2 HTML 작성 ──
console.log('═══ 카드 2 리디자인 ═══');

const card2Html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
<style>
:root {
  --navy: #0B1340;
  --orange: #FF6B00;
  --white: #FFFFFF;
  --light-bg: #F5F6FA;
  --text-dark: #1A1A2E;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1080px;
  height: 1350px;
  background: var(--light-bg);
  font-family: 'Noto Sans KR', sans-serif;
  color: var(--text-dark);
  position: relative;
  overflow: hidden;
  word-break: keep-all;
  line-height: 1.45;
}

/* ══ 상단 네이비 헤더 블록 ══ */
.header-block {
  position: relative;
  width: 100%;
  height: 430px;
  background: var(--navy);
  padding: 48px 72px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}

/* 배경 원형 장식 */
.header-ring {
  position: absolute;
  border-radius: 50%;
  border: 3px solid rgba(255, 107, 0, 0.18);
  pointer-events: none;
}
.hr-1 { width: 480px; height: 480px; top: -120px; right: -100px; }
.hr-2 { width: 300px; height: 300px; bottom: -80px; right: 160px; }
.hr-3 { width: 180px; height: 180px; top: 60px; left: -40px; border-color: rgba(255,255,255,0.06); }

/* 주황 필 배지 */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--orange);
  color: var(--white);
  font-size: 28px;
  font-weight: 700;
  padding: 10px 28px;
  border-radius: 28px;
  margin-bottom: 32px;
  width: fit-content;
  z-index: 2;
}
.badge-dot {
  width: 12px; height: 12px;
  background: var(--white);
  border-radius: 50%;
}

/* 헤드라인 */
.headline {
  font-size: 100px;
  font-weight: 900;
  line-height: 1.15;
  color: var(--white);
  margin-bottom: 20px;
  z-index: 2;
}
.headline .accent {
  color: var(--orange);
}

/* 서브카피 */
.header-sub {
  font-size: 36px;
  font-weight: 400;
  color: var(--white);
  opacity: 0.55;
  z-index: 2;
}

/* ══ 체크리스트 영역 ══ */
.checklist-area {
  padding: 28px 72px 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 26px;
  font-weight: 900;
  color: var(--orange);
  letter-spacing: 3px;
  margin-bottom: 20px;
}
.section-title svg {
  width: 28px; height: 28px;
  fill: var(--orange);
}

/* 리스트 아이템 */
.list-items {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.list-item {
  background: var(--white);
  border-left: 5px solid var(--orange);
  border-radius: 0 14px 14px 0;
  padding: 20px 32px;
  display: flex;
  align-items: center;
  gap: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

/* 번호 배지 */
.num-badge {
  min-width: 56px; height: 56px;
  background: var(--orange);
  color: var(--white);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 900;
}

.item-content {
  flex: 1;
}
.item-title {
  font-size: 46px;
  font-weight: 900;
  color: var(--text-dark);
  margin-bottom: 4px;
  line-height: 1.25;
}
.item-desc {
  font-size: 28px;
  font-weight: 400;
  color: var(--text-dark);
  opacity: 0.55;
  line-height: 1.35;
}

/* 아이템 간 화살표 커넥터 */
.arrow-connector {
  display: flex;
  justify-content: center;
  padding: 4px 0;
}
.arrow-circle {
  width: 38px; height: 38px;
  background: #4A4A5A;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.arrow-circle svg {
  width: 20px; height: 20px;
  fill: none;
  stroke: var(--white);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* ══ 하단 바 ══ */
.bottom-bar {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 100px;
  background: var(--navy);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 72px;
}

/* 하단 좌측: 로고 자리 */
.bottom-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255,255,255,0.9);
  padding: 6px 12px;
  border-radius: 6px;
}
.bottom-logo img {
  height: 44px;
  object-fit: contain;
}

/* 하단 우측: CTA 버튼 */
.cta-btn {
  background: var(--orange);
  color: var(--white);
  font-size: 32px;
  font-weight: 700;
  padding: 16px 44px;
  border-radius: 40px;
  letter-spacing: 1px;
}
</style>
</head>
<body>

  <!-- ── 상단 네이비 헤더 ── -->
  <div class="header-block">
    <div class="header-ring hr-1"></div>
    <div class="header-ring hr-2"></div>
    <div class="header-ring hr-3"></div>

    <div class="badge">
      <span class="badge-dot"></span>
      고1 첫 학기부터 시작해야
    </div>
    <h1 class="headline"><span class="accent">놓치기</span> 쉬운<br>포인트 4가지</h1>
    <p class="header-sub">지금 모르면 생기부가 무너진다</p>
  </div>

  <!-- ── 체크리스트 ── -->
  <div class="checklist-area">
    <div class="section-title">
      <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
      CHECK LIST
    </div>

    <div class="list-items">
      <!-- 01 -->
      <div class="list-item">
        <div class="num-badge">01</div>
        <div class="item-content">
          <div class="item-title">진로 미설정</div>
          <div class="item-desc">방향 없이 쌓인 활동은 입시에서 통하지 않는다</div>
        </div>
      </div>

      <div class="arrow-connector">
        <div class="arrow-circle">
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        </div>
      </div>

      <!-- 02 -->
      <div class="list-item">
        <div class="num-badge">02</div>
        <div class="item-content">
          <div class="item-title">수업 소극성</div>
          <div class="item-desc">발표·질문 없으면 교사 기록에 남지 않는다</div>
        </div>
      </div>

      <div class="arrow-connector">
        <div class="arrow-circle">
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        </div>
      </div>

      <!-- 03 -->
      <div class="list-item">
        <div class="num-badge">03</div>
        <div class="item-content">
          <div class="item-title">기록 누락</div>
          <div class="item-desc">활동 후 즉시 기록 안 하면 소재가 사라진다</div>
        </div>
      </div>

      <div class="arrow-connector">
        <div class="arrow-circle">
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        </div>
      </div>

      <!-- 04 -->
      <div class="list-item">
        <div class="num-badge">04</div>
        <div class="item-content">
          <div class="item-title">소통 부족</div>
          <div class="item-desc">담임·교과 선생님과의 관계가 생기부를 좌우한다</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ── 하단 바 ── -->
  <div class="bottom-bar">
    <div class="bottom-logo">
      <img src="${logoDataUri}" />
    </div>
    <div class="cta-btn">진학 컨설팅</div>
  </div>

</body>
</html>`;

// copy.json 카드 2 업데이트
copyData.cards[1].generated_html = card2Html;
await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('  ✅ copy.json 카드 2 업데이트 완료\n');

// ── Puppeteer 렌더링 (카드 2만) ──
console.log('═══ PNG 렌더링 ═══');
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1350 });
await page.setContent(card2Html, { waitUntil: 'load', timeout: 120000 });
await page.evaluate(() => document.fonts.ready);

const outPath = join(OUTPUT_DIR, 'card-02.png');
await page.screenshot({ path: outPath, type: 'png' });
await page.close();
await browser.close();

console.log(`  ✅ card-02.png 저장 완료`);
console.log(`  📁 ${outPath}\n`);

console.log('═══ 완료! ═══');
console.log('카드 2 리디자인 내역:');
console.log('  • 상단: 네이비 헤더 블록 + 원형 링 장식');
console.log('  • 헤드라인 113px / 항목 제목 51px / 서브 30px (1080 스케일)');
console.log('  • 4항목 주황 좌측 보더 체크리스트 + 화살표 커넥터');
console.log('  • 하단: 로고 누끼(좌) + CTA 버튼(우)');
console.log('  • "진학학원" 텍스트 완전 제거 → 로고 이미지만 사용');
