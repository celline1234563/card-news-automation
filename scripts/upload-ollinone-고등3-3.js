import 'dotenv/config';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getByStatus, appendFilePaths, setStatus } from '../agents/notion-connector.js';
import { loadConfig } from '../agents/config-loader.js';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const ACADEMY_KEY = 'ollinone';
const OUTPUT_DIR = join(ROOT, 'output', '올인원 수학학원-내신1등급-재디자인-2026-03-18');

// ── Step 1: 노션에서 고등3-3 페이지 찾기 ──
console.log('═══ Step 1: 노션에서 올인원 고등3-3 페이지 찾기 ═══');

const searchStatuses = ['디자인 수정', '디자인 1차', '제작 요청', '기획 컨펌', '기획컨펌대기', '원고작업', '디자인완료'];
let targetPage = null;

for (const status of searchStatuses) {
  console.log(`  검색 중: 상태="${status}"`);
  try {
    const pages = await getByStatus(status);
    const found = pages.find(p =>
      (p.title.includes('올인원') || p.title.includes('올인원')) &&
      (p.title.includes('고등3-3') || p.title.includes('고등 3-3'))
    );
    if (found) {
      targetPage = found;
      console.log(`  발견! 상태="${status}"`);
      break;
    }
  } catch (err) {
    console.log(`  상태 "${status}" 검색 실패: ${err.message}`);
  }
}

if (!targetPage) {
  console.error('올인원 고등3-3 페이지를 찾을 수 없습니다.');
  process.exit(1);
}

console.log(`  페이지: ${targetPage.title}`);
console.log(`  ID: ${targetPage.id}\n`);

// ── Step 2: 학원 설정 로드 ──
const { academy } = await loadConfig(ACADEMY_KEY);

// ── Step 3: PNG 업로드 ──
console.log('═══ Step 2: PNG 노션 업로드 ═══');

const copyData = JSON.parse(await readFile(join(OUTPUT_DIR, 'copy.json'), 'utf-8'));
const pngPaths = copyData.cards.map((_, i) =>
  join(OUTPUT_DIR, `card-${String(i + 1).padStart(2, '0')}.png`)
);

// htmlSources 로드 (없으면 빈 배열)
let htmlSources = [];
try {
  htmlSources = copyData.cards.map(c => c.generated_html || '');
} catch { }

await appendFilePaths(
  targetPage.id,
  pngPaths,
  targetPage.title,
  academy.name,
  academy.drive_folder_id,
  htmlSources
);
console.log(`  PNG ${pngPaths.length}장 노션 업로드 완료`);

await setStatus(targetPage.id, '디자인 1차');
console.log('  상태 -> 디자인 1차');

console.log('\n═══ 완료! ═══');
