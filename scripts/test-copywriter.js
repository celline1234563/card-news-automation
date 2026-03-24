import 'dotenv/config';
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { run } from '../agents/copywriter.js';
import { loadConfig } from '../agents/config-loader.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const outputDir = process.argv[2] || join(root, 'output', '진학학원-금천-수학학원에서-영어까지--종합반으로-전-과목-잡는--2026-03-23');

const copyJson = JSON.parse(await readFile(join(outputDir, 'copy.json'), 'utf-8'));
const { academy } = await loadConfig('jinhak');

const copies = await run(
  copyJson.cards,
  '금천 수학학원에서 영어까지, 종합반으로 전 과목 잡는 법',
  academy,
  { keyword: '금천 종합학원' }
);

await writeFile(join(outputDir, 'copies.json'), JSON.stringify(copies, null, 2), 'utf-8');
console.log('\n=== 원고 결과 ===');
for (const c of copies) {
  console.log(`\n[카드 ${c.card}] (${c.text.length}자)`);
  console.log(c.text);
  if (c.hashtags?.length) console.log(c.hashtags.join(' '));
}
