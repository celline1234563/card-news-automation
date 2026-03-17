import 'dotenv/config';
import { getComments, getRevisionInstructions, getPageContent } from '../agents/notion-connector.js';

const pageId = '3066efb1-2186-808e-a5a6-c77e2ffd977c';

console.log('── 댓글 확인 ──');
const comments = await getComments(pageId);
for (const c of comments) {
  console.log(`  [${c.createdAt}] ${c.text.substring(0, 200)}`);
}

console.log('\n── 수정요청 확인 ──');
const revisions = await getRevisionInstructions(pageId);
if (revisions.length > 0) {
  for (const r of revisions) {
    console.log(`  @수정: ${r}`);
  }
} else {
  console.log('  (수정요청 없음)');
}

console.log('\n── 페이지 본문 확인 ──');
const content = await getPageContent(pageId);
if (content.planningContent) {
  console.log(content.planningContent.substring(0, 500));
} else {
  console.log('(기획 내용 없음)');
}
