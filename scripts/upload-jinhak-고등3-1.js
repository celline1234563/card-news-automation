import 'dotenv/config';
import { Client } from '@notionhq/client';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { appendFilePaths } from '../agents/notion-connector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATASOURCE_ID = process.env.NOTION_DATASOURCE_ID;
const OUTPUT_DIR = join(ROOT, 'output', '진학학원--진학-고등-3-1--2026-03-11');

// ── Step 1: 노션 페이지 검색 ──
console.log('═══ Step 1: 노션 페이지 검색 ═══');

const response = await notion.dataSources.query({
  data_source_id: DATASOURCE_ID,
  filter: {
    and: [
      { property: '상태', multi_select: { contains: '디자인완료' } },
    ],
  },
  sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
});

// "진학 고등 3-1" 또는 "진학-고등-3-1" 포함 페이지 찾기
let targetPage = null;
for (const page of response.results) {
  const props = page.properties;
  const titleProp = Object.values(props).find(p => p.type === 'title');
  const title = titleProp?.title?.map(t => t.plain_text).join('') || '';

  if (title.includes('진학') && title.includes('고등') && title.includes('3-1')) {
    targetPage = { id: page.id, title };
    break;
  }
}

if (!targetPage) {
  // 상태 무관하게 전체 검색
  console.log('  디자인완료 상태에서 못 찾음, 전체 검색...');
  const all = await notion.dataSources.query({
    data_source_id: DATASOURCE_ID,
    sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
  });

  for (const page of all.results) {
    const props = page.properties;
    const titleProp = Object.values(props).find(p => p.type === 'title');
    const title = titleProp?.title?.map(t => t.plain_text).join('') || '';

    if (title.includes('진학') && title.includes('고등') && title.includes('3-1')) {
      targetPage = { id: page.id, title };
      break;
    }
  }
}

if (!targetPage) {
  console.error('  ❌ "[진학 고등 3-1]" 페이지를 찾을 수 없습니다.');
  process.exit(1);
}

console.log(`  ✅ 페이지 찾음: "${targetPage.title}"`);
console.log(`  📋 Page ID: ${targetPage.id}\n`);

// ── Step 2: PNG 파일 경로 준비 ──
console.log('═══ Step 2: PNG 파일 준비 ═══');
const pngPaths = [];
for (let i = 1; i <= 10; i++) {
  const filename = `card-${String(i).padStart(2, '0')}.png`;
  pngPaths.push(join(OUTPUT_DIR, filename));
}
console.log(`  📁 ${pngPaths.length}장 PNG 준비 완료\n`);

// ── Step 3: 노션 업로드 ──
console.log('═══ Step 3: 노션 이미지 업로드 ═══');
await appendFilePaths(
  targetPage.id,
  pngPaths,
  targetPage.title,
  '진학학원',
  null,  // Drive 폴더 ID (옵션)
  null   // HTML 소스 (옵션)
);

console.log('\n═══ 완료! ═══');
console.log(`  ✅ 10장 PNG가 노션 페이지에 업로드되었습니다.`);
console.log(`  📋 "${targetPage.title}" 페이지에서 확인하세요.`);
