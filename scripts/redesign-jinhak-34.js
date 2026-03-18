import 'dotenv/config';
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from '../agents/config-loader.js';
import { renderCards } from '../agents/renderer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const ACADEMY_KEY = 'jinhak';
const OUTPUT_DIR = join(ROOT, 'output', '진학학원--진학중등3-4--종합반-전환-이벤트-2026-03-12');

// ── Step 1: copy.json 로드 ──
console.log('═══ Step 1: copy.json 로드 ═══');
const raw = await readFile(join(OUTPUT_DIR, 'copy.json'), 'utf-8');
const copyData = JSON.parse(raw);
console.log(`  카드 ${copyData.cards.length}장 로드 완료\n`);

// ── Step 2: 학원 설정 로드 ──
console.log('═══ Step 2: 학원 설정 로드 ═══');
const { academy, cssVariables } = await loadConfig(ACADEMY_KEY);
console.log(`  ${academy.name} 설정 로드 완료\n`);

// ── Step 3: HTML 일괄 수정 ──
console.log('═══ Step 3: HTML 일괄 수정 ═══');

for (const card of copyData.cards) {
  if (!card.generated_html) continue;
  let html = card.generated_html;

  // ─── 3-1) 하이라이트 CSS 수정 ───
  // 기존 gradient 방식 → 직접 background + 고대비 텍스트
  // 패턴1: linear-gradient 방식
  html = html.replace(
    /em\.highlight\s*\{[^}]*background\s*:\s*linear-gradient\([^)]*\)[^}]*\}/gi,
    `em.highlight { background: #FFD700; color: #111111; font-style: normal; font-weight: 900; padding: 4px 12px; display: inline; box-decoration-break: clone; -webkit-box-decoration-break: clone; position: relative; z-index: 1; border-radius: 4px; }`
  );
  // 패턴2: 단순 background: var(--color-highlight) 방식
  html = html.replace(
    /em\.highlight\s*\{[^}]*background\s*:\s*var\(--color-highlight\)[^}]*\}/gi,
    `em.highlight { background: #FFD700; color: #111111; font-style: normal; font-weight: 900; padding: 4px 12px; display: inline; box-decoration-break: clone; -webkit-box-decoration-break: clone; position: relative; z-index: 1; border-radius: 4px; }`
  );

  // 어두운 배경(primary) 카드에서는 하이라이트 텍스트를 흰색으로
  // Card 1(hook), 4(data), 10(cta) → body background가 primary
  if (html.includes('background: var(--color-primary)') &&
      (card.type === 'hook' || card.type === 'data' || card.type === 'cta')) {
    html = html.replace(
      /em\.highlight\s*\{[^}]*\}/gi,
      `em.highlight { background: #FFD700; color: #111111; font-style: normal; font-weight: 900; padding: 4px 12px; display: inline; box-decoration-break: clone; -webkit-box-decoration-break: clone; position: relative; z-index: 1; border-radius: 4px; }`
    );
  }

  // ─── 3-2) 전화번호/상담 문의 삭제 ───
  // cta-sub (카카오 오픈채팅 / 전화 상담 가능) 제거
  html = html.replace(/<p[^>]*class="cta-sub"[^>]*>[^<]*<\/p>/gi, '');
  // 일반적인 전화번호 패턴 제거 (02-xxx-xxxx, 010-xxxx-xxxx 등)
  html = html.replace(/<[^>]*>\s*\d{2,3}[-.]?\d{3,4}[-.]?\d{4}\s*<\/[^>]*>/gi, '');
  // "상담 문의" + 전화번호 패턴
  html = html.replace(/<[^>]*>[^<]*(?:상담\s*문의|전화\s*상담|문의\s*전화)[^<]*\d{2,4}[-.]?\d{3,4}[-.]?\d{4}[^<]*<\/[^>]*>/gi, '');

  // ─── 3-3) 카드 1, 10: .academy 요소 완전 삭제 (워터마크만 남기기) ───
  // renderer.js가 .academy → 로고 교체 + 워터마크 추가하면 로고 2개가 됨
  // 따라서 카드 1, 10은 .academy 요소를 아예 제거하여 워터마크만 표시
  if (card.number === 1 || card.number === 10) {
    // .academy 클래스가 있는 요소 전체 제거
    html = html.replace(/<(?:span|div|footer|p)[^>]*class="[^"]*academy[^"]*"[^>]*>[\s\S]*?<\/(?:span|div|footer|p)>/gi, '');
    // .academy CSS 규칙도 제거
    html = html.replace(/\.academy\s*\{[^}]*\}/gi, '');
  }

  // ─── 3-4) 카드 7: 비교 레이아웃 여백 + VS 위치 조정 ───
  if (card.number === 7) {
    // compare 영역 하단 여백 확보 (워터마크 공간)
    html = html.replace(
      /\.compare\s*\{([^}]*)\}/i,
      '.compare { $1 margin-bottom: 80px; }'
    );
    // VS 배지: 두 컬럼 사이 gap 정중앙에 배치
    // content=936px, before=(916*0.425)=389px, gap중앙=389+10=399px → 72+399=471px → 471/1080=43.6%
    // 세로: 타이틀 영역 사이에 배치 (top: 22%)
    html = html.replace(
      /\.vs\s*\{[^}]*\}/i,
      `.vs { position: absolute; top: 22%; left: 43.5%; transform: translate(-50%, -50%); width: 56px; height: 56px; border-radius: 50%; background: var(--color-accent); color: var(--color-white); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900; box-shadow: 0 4px 16px rgba(0,0,0,0.15); z-index: 2; }`
    );
    // card 패딩 하단 확보
    html = html.replace(
      /\.card\s*\{([^}]*padding:\s*)60px\s+72px/i,
      '.card { $1 60px 72px 100px'
    );
  }

  // ─── 3-5) 나머지 카드: "진학학원" 텍스트에 academy 클래스 보장 ───
  if (card.number !== 1 && card.number !== 10) {
    html = html.replace(
      /(<(?:span|div)[^>]*>)\s*진학학원\s*(<\/(?:span|div)>)/gi,
      (match, open, close) => {
        if (open.includes('class=')) {
          if (!open.includes('academy')) {
            return open.replace(/class="/, 'class="academy ') + '진학학원' + close;
          }
          return match;
        }
        return open.replace(/>$/, ' class="academy">') + '진학학원' + close;
      }
    );
  }

  card.generated_html = html;
  console.log(`  카드 ${String(card.number).padStart(2, '0')}: HTML 수정 완료`);
}
console.log('');

// ── Step 4: copy.json 저장 ──
console.log('═══ Step 4: copy.json 저장 ═══');
await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');
console.log('  copy.json 저장 완료\n');

// ── Step 5: PNG 재렌더링 ──
console.log('═══ Step 5: PNG 재렌더링 ═══');
console.log(`  출력 폴더: ${OUTPUT_DIR}`);
await renderCards(copyData.cards, cssVariables, academy.name, OUTPUT_DIR, ACADEMY_KEY);
console.log('');

console.log('═══ 완료! ═══');
console.log('수정 내역:');
console.log('  1. 하이라이트: gradient → 직접 background(#FFD700) + 고대비 텍스트');
console.log('  2. 전화 상담 문의 텍스트 삭제');
console.log('  3. "진학학원" 텍스트 → 로고 이미지로 교체');
