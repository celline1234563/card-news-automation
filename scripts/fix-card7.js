import 'dotenv/config';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const pageId = '3116efb1-2186-80c2-a9a9-dc2e5cd120f0';

const blocks = await notion.blocks.children.list({ block_id: pageId, page_size: 100 });

for (const block of blocks.results) {
  if (block.type === 'callout') {
    const text = block.callout?.rich_text?.map(t => t.plain_text).join('') || '';
    if (text.includes('카드 7')) {
      console.log('카드 7 블록 발견:', block.id);

      const newText = [
        '카드 7 [solution]',
        '헤드라인: 진학학원의 차별점',
        '서브텍스트: 벼락치기 vs 체계적 관리의 차이',
        '레이아웃힌트: two-column',
        '항목: 일반 학원: 시험 직전 몰아치기 vs 진학학원: 4주 전 단계별 로드맵 / 일반 학원: 획일적 수업 vs 진학학원: 성적별 맞춤 반 편성 / 일반 학원: 문제만 풀기 vs 진학학원: 교과서 기반 개념 완성 + 기출 분석 / 일반 학원: 시험 끝나면 끝 vs 진학학원: 오답 분석 → 다음 시험 연결 관리',
      ].join('\n');

      await notion.blocks.update({
        block_id: block.id,
        callout: {
          icon: { type: 'emoji', emoji: '📄' },
          rich_text: [{ type: 'text', text: { content: newText } }],
        },
      });
      console.log('✅ 카드 7 수정 완료');
      break;
    }
  }
}
