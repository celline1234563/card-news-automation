import 'dotenv/config';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from '../agents/config-loader.js';
import { research } from '../agents/researcher.js';
import { critiqueHook } from '../agents/hook-critic.js';
import { reviewAndFix } from '../agents/structure-reviewer.js';
import { generateAllImages } from '../agents/gemini-imager.js';
import { harmonizeAndDesign } from '../agents/series-harmonizer.js';
import { validateAll } from '../agents/design-validator.js';
import { renderCards } from '../agents/renderer.js';
import { qaAndRegenerate } from '../agents/visual-qa.js';
import { pickAllImages } from '../agents/image-picker.js';
import { writePlanAndCopy, appendFilePaths, setStatus, getComments } from '../agents/notion-connector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const PAGE_ID = '3066efb1-2186-808e-a5a6-c77e2ffd977c';

// ── Step 1: 노션 댓글에서 실제 인터뷰 내용 수집 ──
console.log('═══ Step 1: 노션 인터뷰 내용 수집 ═══');
const comments = await getComments(PAGE_ID);
const interviewText = comments.map(c => c.text).join('\n');
console.log(`  📝 댓글 ${comments.length}개 수집 완료`);
console.log(`  내용: ${interviewText.substring(0, 200)}...\n`);

// ── Step 2: 학원 설정 로드 ──
console.log('═══ Step 2: 학원 설정 로드 ═══');
const { academy, cssVariables } = await loadConfig('ollinone');
console.log(`  ✅ ${academy.name}\n`);

// ── Step 3: 실제 인터뷰 내용 기반 리서치 + 카피 생성 ──
console.log('═══ Step 3: 인터뷰 기반 기획 생성 ═══');
const topicWithContext = `이화여대 의대 합격 후기 — 아래는 실제 합격생 인터뷰 원문입니다. 이 내용을 반드시 반영하여 기획해주세요:\n\n${interviewText}`;
const copyData = await research(topicWithContext, academy.name);
console.log(`  ✅ 카드 ${copyData.cards.length}장 카피 생성\n`);

// ── Step 3.5: 노션에 기획안 작성 ──
console.log('═══ Step 3.5: 노션 기획안 작성 ═══');
await writePlanAndCopy(PAGE_ID, copyData.cards, copyData.copies || []);
console.log('  ✅ 노션 기획안 업데이트 완료\n');

// rate limit 대기
console.log('  ⏳ API rate limit 대기 (60초)...');
await new Promise(r => setTimeout(r, 60000));

// ── Step 4: 후킹 채점 ──
console.log('═══ Step 4: 후킹 채점 ═══');
copyData.cards[0] = await critiqueHook(copyData.cards[0], academy);
await new Promise(r => setTimeout(r, 10000));
console.log('');

// ── Step 5: 실사진 매칭 ──
console.log('═══ Step 5: 실사진 매칭 ═══');
try {
  await pickAllImages(copyData.cards, 'ollinone');
} catch (err) {
  console.log(`  ⚠️ 이미지 매칭 스킵: ${err.message}`);
}
console.log('');

// ── Step 6: 구조 검토 ──
console.log('═══ Step 6: 구조 검토 ═══');
copyData.cards = await reviewAndFix(copyData.cards, academy);
console.log('');

// ── Step 7: 배경 이미지 생성 ──
console.log('═══ Step 7: 배경 이미지 생성 ═══');
await generateAllImages(copyData.cards, academy);
console.log('');

// ── Step 8: 레퍼런스 기반 디자인 ──
console.log('═══ Step 8: 레퍼런스 기반 디자인 ═══');
await harmonizeAndDesign(copyData.cards, cssVariables, academy, { academyKey: 'ollinone' });
console.log('');

// ── Step 9: HTML 품질 검증 ──
console.log('═══ Step 9: HTML 품질 검증 ═══');
await validateAll(copyData.cards);
console.log('');

// ── Step 10: PNG 렌더링 ──
const today = new Date().toISOString().slice(0, 10);
const outputDir = join(ROOT, 'output', `올인원 수학학원-이화여대-의대-합격-후기-${today}`);
console.log('═══ Step 10: PNG 렌더링 ═══');
const { htmlSources } = await renderCards(copyData.cards, cssVariables, academy.name, outputDir);
console.log('');

// ── Step 11: 비주얼 QA ──
console.log('═══ Step 11: 비주얼 QA ═══');
try {
  await qaAndRegenerate(copyData.cards, cssVariables, academy, outputDir, { academyKey: 'ollinone' });
  const regenerated = copyData.cards.filter(c => c._regenerated);
  if (regenerated.length > 0) {
    console.log(`  🔄 ${regenerated.length}장 재렌더링...`);
    await renderCards(copyData.cards, cssVariables, academy.name, outputDir);
    regenerated.forEach(c => delete c._regenerated);
  }
} catch (err) {
  console.log(`  ⚠️ QA 스킵: ${err.message}`);
}
console.log('');

// ── Step 12: 노션 업로드 ──
console.log('═══ Step 12: 노션 업로드 ═══');
const pngPaths = copyData.cards.map((_, i) =>
  join(outputDir, `card-${String(i + 1).padStart(2, '0')}.png`)
);
await appendFilePaths(PAGE_ID, pngPaths, '[올인원 고등 3-6] 이화여대 의대 합격 후기', academy.name, academy.drive_folder_id, htmlSources);
console.log(`  ✅ PNG ${pngPaths.length}장 노션 업로드 완료`);

await setStatus(PAGE_ID, '디자인 1차');
console.log('  ✅ 상태 → 디자인 1차');

console.log('\n═══ 전체 완료! ═══');
