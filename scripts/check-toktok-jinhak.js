import 'dotenv/config';
import { getByStatus } from '../agents/notion-connector.js';

for (const academy of ['toktok', 'jinhak']) {
  console.log(`\n══ ${academy} ══`);
  try {
    const pages = await getByStatus('기획착수');
    const filtered = pages.filter(p => p.academyKey === academy);
    if (filtered.length === 0) {
      console.log('  (기획착수 페이지 없음)');
    } else {
      for (const p of filtered) {
        console.log(`  📄 ${p.title}`);
        console.log(`     상태: ${p.statuses.join(', ')}`);
        console.log(`     키워드: ${p.keyword || '(없음)'}`);
        console.log(`     수정일: ${p.statusChangedAt}`);
      }
    }
  } catch (e) {
    console.log(`  에러: ${e.message}`);
  }
}
