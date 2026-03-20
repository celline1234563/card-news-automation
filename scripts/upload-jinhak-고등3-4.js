import 'dotenv/config';
import { Client } from '@notionhq/client';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { appendFilePaths } from '../agents/notion-connector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const PAGE_ID = '3116efb1-2186-8039-b0ff-dfa38c758f6b';
const OUTPUT_DIR = join(ROOT, 'output', '진학학원--진학고등3-4--내신-1등급-유지비결-2026-03-19');

console.log('═══ 노션 업로드: 진학고등3-4 ═══');

const pngPaths = [];
for (let i = 1; i <= 10; i++) {
  pngPaths.push(join(OUTPUT_DIR, `card-${String(i).padStart(2, '0')}.png`));
}

await appendFilePaths(PAGE_ID, pngPaths, '[진학고등3-4] 내신 1등급 유지비결', '진학학원', null, null);

console.log('\n✅ 10장 PNG 업로드 완료');
console.log('📋 노션에서 확인하세요.');
