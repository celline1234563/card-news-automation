import 'dotenv/config';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getByStatus, getComments, getPageContent, writePlanAndCopy, setStatus } from '../agents/notion-connector.js';
import { research } from '../agents/researcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Step 1: 페이지 찾기 ──
console.log('═══ Step 1: 톡톡 3-2 페이지 찾기 ═══');
const pages = await getByStatus('기획착수');
const target = pages.find(p => p.title.includes('톡톡3-2'));

if (!target) {
  console.log('❌ 톡톡 3-2 페이지를 찾을 수 없습니다');
  process.exit(1);
}
console.log(`  📄 ${target.title}`);
console.log(`  ID: ${target.id}\n`);

// ── Step 2: 댓글 + 본문 수집 ──
console.log('═══ Step 2: 노션 댓글/본문 수집 ═══');
const comments = await getComments(target.id);
const pageContent = await getPageContent(target.id);
console.log(`  댓글 ${comments.length}개`);
if (comments.length > 0) {
  console.log(`  내용: ${comments.map(c => c.text.substring(0, 100)).join(' / ')}`);
}
if (pageContent.planningContent) {
  console.log(`  기획문서: ${pageContent.planningContent.substring(0, 200)}...`);
}
console.log('');

// ── Step 3: 기획 생성 (케이스 데이터 자동 참고) ──
console.log('═══ Step 3: 기획 생성 (케이스 데이터 자동 참고) ═══');
const topic = '국제학교 합격생들에게 꼭 있는 필수 요소 - 루틴랩';
const copyData = await research(topic, '톡톡 잉글리쉬', {
  academyKey: 'toktok',
  keyword: target.keyword || '',
  comments: comments.map(c => c.text),
  pageContent: pageContent.planningContent,
});
console.log(`  ✅ 카드 ${copyData.cards.length}장 기획 완료\n`);

// ── Step 4: 노션 기획안 작성 ──
console.log('═══ Step 4: 노션 기획안 작성 ═══');
await writePlanAndCopy(target.id, copyData.cards, copyData.copies || []);
await setStatus(target.id, '기획 컨펌');
console.log('  ✅ 노션 업데이트 완료 (상태 → 기획 컨펌)\n');

// ── 결과 출력 ──
console.log('═══ 기획 결과 미리보기 ═══');
for (const card of copyData.cards) {
  const hl = (card.headline || '').replace(/<\/?em>/g, '');
  console.log(`  카드 ${String(card.number).padStart(2, '0')} [${card.type}] ${hl}`);
}
console.log('\n═══ 완료! ═══');
