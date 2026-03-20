import 'dotenv/config';
import { Client } from '@notionhq/client';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { appendFilePaths } from '../agents/notion-connector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const PAGE_ID = '3116efb1-2186-8057-951d-fdc2fe3d38f7';
const OUTPUT_DIR = join(ROOT, 'output', '진학학원--진학중등3-5--전과목클리닉확대-2026-03-19');

console.log('═══ 노션 업로드: 진학중등3-5 ═══');

const pngPaths = [];
for (let i = 1; i <= 10; i++) {
  pngPaths.push(join(OUTPUT_DIR, `card-${String(i).padStart(2, '0')}.png`));
}

await appendFilePaths(PAGE_ID, pngPaths, '[진학중등3-5] 전과목클리닉확대', '진학학원', null, null);

console.log('\n✅ 10장 PNG 업로드 완료');
console.log('📋 노션에서 확인하세요.');
