#!/usr/bin/env node
import { readFile, readdir } from 'fs/promises';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, '..', 'temp', 'classify');

const files = (await readdir(DIR)).filter(f => f.endsWith('-classify.json'));

for (const f of files) {
  const name = basename(f, '-classify.json');
  const data = JSON.parse(await readFile(join(DIR, f), 'utf-8'));

  const stats = {};
  for (const r of data) {
    stats[r.category] = (stats[r.category] || 0) + 1;
  }

  const usable = data.filter(r => r.category !== '스킵' && r.confidence >= 0.6).length;

  console.log(`=== ${name}: 총 ${data.length}장 ===`);
  for (const [k, v] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}장`);
  }
  console.log(`  → 복사 대상 (confidence>=0.6, 스킵 제외): ${usable}장`);
  console.log('');
}
