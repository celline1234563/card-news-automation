import 'dotenv/config';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFile, writeFile } from 'fs/promises';
import { loadConfig } from '../agents/config-loader.js';
import { renderCards } from '../agents/renderer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const ACADEMY_KEY = 'toktok';
const OUTPUT_DIR = join(ROOT, 'output', '톡톡 잉글리쉬--톡톡2-4--경기초-엄마들이-찾는-영어는-다르다-2026-03-18');

console.log('═══ 톡톡 2-4 재렌더링 (로고 하단 여백 수정) ═══');

// copy.json 로드
const copyData = JSON.parse(await readFile(join(OUTPUT_DIR, 'copy.json'), 'utf-8'));
console.log(`  카드 ${copyData.cards.length}장 로드 완료`);

// 학원 설정 로드
const { academy, cssVariables } = await loadConfig(ACADEMY_KEY);
console.log(`  ${academy.name} 설정 로드 완료`);

// PNG 렌더링 (하단 여백 확보된 로고 로직 적용)
console.log(`\n▶ PNG 렌더링 (로고 하단 여백 확보)`);
console.log(`  출력 폴더: ${OUTPUT_DIR}`);
await renderCards(copyData.cards, cssVariables, academy.name, OUTPUT_DIR, ACADEMY_KEY);

// copy.json 저장
await writeFile(join(OUTPUT_DIR, 'copy.json'), JSON.stringify(copyData, null, 2), 'utf-8');

console.log('\n═══ 완료! ═══');
