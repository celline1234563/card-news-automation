import 'dotenv/config';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { appendFilePaths } from '../agents/notion-connector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const PAGE_ID = '3116efb1-2186-80bf-85ad-ced5ec73b179';
const OUTPUT_DIR = join(ROOT, 'output', '진학학원-우리학교-내신--옆-학교보다-어렵다----인근-고등학교-2026-03-20');

console.log('=== 노션 업로드: 진학 고등3-3 ===');

const pngPaths = [];
for (let i = 1; i <= 10; i++) {
  pngPaths.push(join(OUTPUT_DIR, `card-${String(i).padStart(2, '0')}.png`));
}

await appendFilePaths(PAGE_ID, pngPaths, '[진학 고등3-3] 우리학교 내신, 옆 학교보다 어렵다?', '진학학원', null, null);

console.log('\n10장 PNG 업로드 완료');
console.log('노션에서 확인하세요.');
