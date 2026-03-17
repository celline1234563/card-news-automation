import 'dotenv/config';
import { getByStatus } from '../agents/notion-connector.js';

const statuses = ['기획착수', '기획컨펌대기', '원고작업', '제작 요청', '디자인 1차', '디자인완료'];

let found = false;
for (const status of statuses) {
  try {
    const pages = await getByStatus(status);
    const ollinone = pages.filter(p => p.academyKey === 'ollinone');
    if (ollinone.length > 0) {
      found = true;
      console.log(`\n[${status}] ${ollinone.length}건`);
      for (const p of ollinone) {
        console.log(`  - ${p.title}`);
        console.log(`    키워드: ${p.keyword || '(없음)'}`);
        console.log(`    상태: ${p.statuses.join(', ')}`);
        console.log(`    수정일: ${p.statusChangedAt}`);
      }
    }
  } catch (e) {
    console.log(`  ${status} 조회 실패: ${e.message}`);
  }
}

if (!found) {
  console.log('\n올인원 관련 페이지가 없습니다.');
}
console.log('\n-- 조회 완료 --');
