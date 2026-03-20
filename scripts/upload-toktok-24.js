import 'dotenv/config';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';
import { loadConfig } from '../agents/config-loader.js';
import { getByStatus, appendFilePaths } from '../agents/notion-connector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const ACADEMY_KEY = 'toktok';
const OUTPUT_DIR = join(ROOT, 'output', '톡톡 잉글리쉬--톡톡2-4--경기초-엄마들이-찾는-영어는-다르다-2026-03-18');

console.log('═══ 톡톡 2-4 노션 업로드 (로고 수정본) ═══');

// 학원 설정 로드
const { academy } = await loadConfig(ACADEMY_KEY);

// 톡톡 2-4 페이지 찾기
const searchStatuses = ['디자인 수정', '디자인 1차', '제작 요청', '기획 컨펌', '기획컨펌대기', '원고작업'];
let targetPage = null;

for (const status of searchStatuses) {
  try {
    const pages = await getByStatus(status);
    const found = pages.find(p =>
      p.title.includes('톡톡2-4') ||
      p.title.includes('톡톡 2-4')
    );
    if (found) {
      targetPage = found;
      console.log(`  페이지 발견: "${found.title}" (상태: ${status})`);
      break;
    }
  } catch (err) {
    // skip
  }
}

if (!targetPage) {
  console.error('톡톡 2-4 페이지를 찾을 수 없습니다.');
  process.exit(1);
}

// copy.json에서 HTML 소스 로드
const copyData = JSON.parse(await readFile(join(OUTPUT_DIR, 'copy.json'), 'utf-8'));
const htmlSources = copyData.cards.map(c => c.generated_html || '');

// PNG 경로
const pngPaths = copyData.cards.map((_, i) =>
  join(OUTPUT_DIR, `card-${String(i + 1).padStart(2, '0')}.png`)
);

// 노션 업로드
console.log(`  PNG ${pngPaths.length}장 업로드 중...`);
await appendFilePaths(
  targetPage.id,
  pngPaths,
  targetPage.title,
  academy.name,
  academy.drive_folder_id,
  htmlSources
);
console.log(`  업로드 완료!`);

console.log('\n═══ 완료! 노션에서 확인하세요 ═══');
