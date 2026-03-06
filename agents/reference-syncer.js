import { readFile, writeFile, mkdir, readdir, stat } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getClients } from './image-picker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REFS_DIR = join(__dirname, '..', 'config', 'references');

/**
 * drive-folders.json에서 레퍼런스 폴더 ID 추출
 */
async function loadReferenceFolderIds() {
  const raw = await readFile(
    join(__dirname, '..', 'config', 'drive-folders.json'), 'utf-8'
  );
  const folders = JSON.parse(raw);
  const result = {};
  for (const [academy, config] of Object.entries(folders)) {
    if (typeof config === 'object' && config.categories?.['레퍼런스']) {
      result[academy] = config.categories['레퍼런스'];
    }
  }
  return result;
}

/**
 * Drive 폴더에서 이미지 파일 목록 조회
 */
async function listDriveImages(drive, folderId) {
  const response = await drive.files.list({
    q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
    fields: 'files(id, name, mimeType, modifiedTime)',
    orderBy: 'name',
    pageSize: 100,
  });
  return response.data.files || [];
}

/**
 * Drive 파일 1개를 로컬에 다운로드
 */
async function downloadFile(drive, fileId, destPath) {
  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );
  await writeFile(destPath, Buffer.from(response.data));
}

/**
 * 전체 학원의 레퍼런스 이미지를 Drive에서 로컬로 동기화
 * 수정일 비교하여 변경분만 다운로드
 */
export async function syncAllReferences() {
  const refFolders = await loadReferenceFolderIds();
  const academies = Object.entries(refFolders).filter(([, id]) => id);

  if (academies.length === 0) {
    console.log('  📎 레퍼런스 폴더 설정 없음 — 스킵');
    return;
  }

  const { drive } = await getClients();

  for (const [academy, folderId] of academies) {
    const localDir = join(REFS_DIR, academy);
    await mkdir(localDir, { recursive: true });

    const driveFiles = await listDriveImages(drive, folderId);
    if (driveFiles.length === 0) {
      console.log(`  📎 ${academy}: Drive 레퍼런스 0개 — 스킵`);
      continue;
    }

    // 로컬 파일 mtime 맵 구성
    const localFiles = {};
    try {
      const entries = await readdir(localDir);
      for (const name of entries) {
        if (/\.(png|jpg|jpeg|webp)$/i.test(name)) {
          const s = await stat(join(localDir, name));
          localFiles[name] = s.mtimeMs;
        }
      }
    } catch { /* 디렉토리 없으면 무시 */ }

    let downloaded = 0;
    for (const file of driveFiles) {
      const localPath = join(localDir, file.name);
      const driveModified = new Date(file.modifiedTime).getTime();

      // 로컬 파일이 이미 최신이면 스킵
      if (localFiles[file.name] && localFiles[file.name] >= driveModified) {
        continue;
      }

      await downloadFile(drive, file.id, localPath);
      downloaded++;
    }

    console.log(`  📎 ${academy}: ${downloaded}개 다운로드 (총 ${driveFiles.length}개 레퍼런스)`);
  }
}

/**
 * 특정 학원·카드타입에 매칭되는 레퍼런스 이미지 1장 반환
 * @param {string} academyKey - 학원 키 (ollinone, jinhak, toktok)
 * @param {string} cardType - 카드 타입 (hook, problem, data, insight, solution, example, summary, cta)
 * @returns {{ base64: string, mimeType: string } | null}
 */
export async function findReference(academyKey, cardType) {
  const dir = join(REFS_DIR, academyKey);

  try {
    const entries = await readdir(dir);
    // hook-01.png, hook-02.png 형식 매칭
    const matches = entries
      .filter(name => name.startsWith(`${cardType}-`) && /\.(png|jpg|jpeg|webp)$/i.test(name))
      .sort();

    if (matches.length === 0) return null;

    const fileName = matches[0];
    const buffer = await readFile(join(dir, fileName));
    const base64 = buffer.toString('base64');

    const ext = fileName.split('.').pop().toLowerCase();
    const mimeMap = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };

    return { base64, mimeType: mimeMap[ext] || 'image/png' };
  } catch {
    return null;
  }
}
