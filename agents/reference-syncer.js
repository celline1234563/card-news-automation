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
 * 이미지 파일을 base64로 로드
 */
async function loadImageAsRef(filePath) {
  const buffer = await readFile(filePath);
  const base64 = buffer.toString('base64');
  const ext = filePath.split('.').pop().toLowerCase();
  const mimeMap = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
  return { base64, mimeType: mimeMap[ext] || 'image/png' };
}

/**
 * 학원 prefix → 번호 매칭 파일 찾기 (올인원1.png, 진학3.png 등)
 */
function findNumberedRef(images, academyKey, cardNumber) {
  // 학원명 한글 매핑
  const prefixMap = {
    ollinone: '올인원',
    jinhak: '진학',
    toktok: '톡톡',
  };
  const prefix = prefixMap[academyKey];
  if (!prefix) return null;
  return images.find(name => name === `${prefix}${cardNumber}.png` || name === `${prefix}${cardNumber}.jpg`);
}

/**
 * 특정 학원·카드에 매칭되는 레퍼런스 이미지 다중 반환
 *
 * 매칭 우선순위:
 *   1) 카드 번호 매칭 (올인원1.png → 카드1, 진학3.png → 카드3)
 *   2) "{cardType}-" prefix 매칭 (hook-01.png)
 *   3) 파일명에 cardType 키워드 포함
 *
 * @param {string} academyKey - 학원 키
 * @param {string} cardType - 카드 타입
 * @param {number} [cardNumber] - 카드 번호 (1~10)
 * @returns {{ base64: string, mimeType: string }[] } 레퍼런스 배열 (최대 3장)
 */
export async function findReferences(academyKey, cardType, cardNumber) {
  const results = [];
  const maxRefs = 3;

  // 카드 타입별 한글 키워드 매핑
  const typeKeywords = {
    hook: ['hook', '후킹', '썸네일', '표지', '인트로', 'cover', 'thumbnail'],
    problem: ['problem', '문제', '공감', 'empathy'],
    data: ['data', '데이터', '통계', 'stat'],
    insight: ['insight', '인사이트', '원인'],
    solution: ['solution', '솔루션', '해결', '방법'],
    example: ['example', '사례', '비교', 'compare'],
    summary: ['summary', '요약', '정리'],
    cta: ['cta', '상담', '문의', '연락'],
  };

  const allAcademies = ['ollinone', 'jinhak', 'toktok'];
  const usedFiles = new Set();

  // 1순위: 같은 학원의 같은 카드 번호 (올인원3.png → 카드3)
  if (cardNumber) {
    const dir = join(REFS_DIR, academyKey);
    try {
      const entries = await readdir(dir);
      const images = entries.filter(name => /\.(png|jpg|jpeg|webp)$/i.test(name));
      const numbered = findNumberedRef(images, academyKey, cardNumber);
      if (numbered) {
        const ref = await loadImageAsRef(join(dir, numbered));
        results.push(ref);
        usedFiles.add(`${academyKey}/${numbered}`);
      }
    } catch { /* dir not found */ }
  }

  // 2순위: 다른 학원의 같은 카드 번호 (크로스 레퍼런스)
  if (cardNumber && results.length < maxRefs) {
    for (const otherAcademy of allAcademies) {
      if (otherAcademy === academyKey || results.length >= maxRefs) continue;
      const dir = join(REFS_DIR, otherAcademy);
      try {
        const entries = await readdir(dir);
        const images = entries.filter(name => /\.(png|jpg|jpeg|webp)$/i.test(name));
        const numbered = findNumberedRef(images, otherAcademy, cardNumber);
        if (numbered && !usedFiles.has(`${otherAcademy}/${numbered}`)) {
          const ref = await loadImageAsRef(join(dir, numbered));
          results.push(ref);
          usedFiles.add(`${otherAcademy}/${numbered}`);
        }
      } catch { /* skip */ }
    }
  }

  // 3순위: 같은 학원의 타입 매칭 (hook-01.png 등)
  if (results.length < maxRefs) {
    const dir = join(REFS_DIR, academyKey);
    try {
      const entries = await readdir(dir);
      const images = entries.filter(name => /\.(png|jpg|jpeg|webp)$/i.test(name));

      // prefix 매칭
      let match = images.find(name =>
        name.toLowerCase().startsWith(`${cardType}-`) && !usedFiles.has(`${academyKey}/${name}`)
      );

      // 키워드 매칭
      if (!match) {
        const keywords = typeKeywords[cardType] || [cardType];
        match = images.find(name => {
          if (usedFiles.has(`${academyKey}/${name}`)) return false;
          const lower = name.toLowerCase();
          return keywords.some(kw => lower.includes(kw));
        });
      }

      if (match) {
        const ref = await loadImageAsRef(join(dir, match));
        results.push(ref);
        usedFiles.add(`${academyKey}/${match}`);
      }
    } catch { /* skip */ }
  }

  return results;
}

/**
 * 하위 호환: 단일 레퍼런스 반환 (기존 코드 호환)
 */
export async function findReference(academyKey, cardType, cardNumber) {
  const refs = await findReferences(academyKey, cardType, cardNumber);
  return refs.length > 0 ? refs[0] : null;
}
