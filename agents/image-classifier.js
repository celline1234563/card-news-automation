import { GoogleGenAI } from '@google/genai';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let _drive = null;

/**
 * Google Drive 인증 (읽기+쓰기)
 */
async function getDrive() {
  if (_drive) return _drive;

  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || join(__dirname, '..', 'config', 'google-service-account.json');
  const key = JSON.parse(await readFile(keyPath, 'utf-8'));

  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  _drive = google.drive({ version: 'v3', auth });
  return _drive;
}

/**
 * Gemini Vision 클라이언트
 */
let _ai = null;
function getAI() {
  if (!_ai) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_AI_API_KEY가 .env에 설정되지 않았습니다.');
    _ai = new GoogleGenAI({ apiKey });
  }
  return _ai;
}

/**
 * Drive 폴더 설정 로드
 */
async function loadDriveFolders() {
  const raw = await readFile(join(__dirname, '..', 'config', 'drive-folders.json'), 'utf-8');
  return JSON.parse(raw);
}

/**
 * 루트 폴더에서 미분류 이미지 조회
 */
async function getUnclassifiedImages(rootFolderId) {
  const drive = await getDrive();

  const res = await drive.files.list({
    q: `'${rootFolderId}' in parents and mimeType contains 'image/' and trashed = false`,
    fields: 'files(id, name, mimeType, thumbnailLink)',
    pageSize: 20,
  });

  return res.data.files || [];
}

/**
 * Drive 이미지를 base64로 다운로드
 */
async function downloadImageBase64(fileId) {
  const drive = await getDrive();

  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' },
  );

  return Buffer.from(res.data).toString('base64');
}

/**
 * Gemini Vision으로 이미지 카테고리 분류
 */
async function classifyImage(base64Data, mimeType, categories) {
  const ai = getAI();

  const categoryList = categories.filter(c => c !== '레퍼런스').join(', ');

  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: base64Data,
            },
          },
          {
            text: `이 이미지를 다음 카테고리 중 하나로 분류해주세요.

카테고리: ${categoryList}

규칙:
- 학원 교실에서 수업하는 장면 → 수업사진
- 선생님이 단독으로 나오는 사진 → 선생님사진
- 학생이 단독 또는 여럿이 나오는 사진 → 학생사진
- 학원 건물 외부 또는 간판 → 학원외관
- 상담 장면 (학부모, 선생님 대화) → 상담사진
- 교재, 문제집, 프린트물 → 교재사진
- 설명회, 입시설명회, 학부모 모임 → 설명회사진

반드시 카테고리 이름만 한 단어로 답하세요. 다른 설명 없이.`,
          },
        ],
      },
    ],
  });

  const text = result.text?.trim() || '';

  // 응답이 유효한 카테고리인지 확인
  if (categories.includes(text)) {
    return text;
  }

  // 부분 매칭 시도
  for (const cat of categories) {
    if (cat === '레퍼런스') continue;
    if (text.includes(cat)) return cat;
  }

  return null;
}

/**
 * 파일을 다른 폴더로 이동 (부모 폴더 변경)
 */
async function moveFile(fileId, fromFolderId, toFolderId) {
  const drive = await getDrive();

  await drive.files.update({
    fileId,
    addParents: toFolderId,
    removeParents: fromFolderId,
    supportsAllDrives: true,
    fields: 'id, parents',
  });
}

/**
 * 특정 학원의 루트 폴더 → 카테고리 폴더 자동 분류
 */
async function classifyForAcademy(academyKey, academyFolders) {
  const rootId = academyFolders.root;
  if (!rootId) return { classified: 0, failed: 0 };

  const categories = Object.keys(academyFolders.categories || {});
  if (categories.length === 0) return { classified: 0, failed: 0 };

  const images = await getUnclassifiedImages(rootId);
  if (images.length === 0) return { classified: 0, failed: 0 };

  console.log(`  📂 ${academyKey}: 미분류 이미지 ${images.length}장 발견`);

  let classified = 0;
  let failed = 0;

  for (const file of images) {
    try {
      const base64 = await downloadImageBase64(file.id);
      const category = await classifyImage(base64, file.mimeType, categories);

      if (!category) {
        console.log(`  ⚠️ ${file.name} → 분류 실패 (카테고리 판별 불가)`);
        failed++;
        continue;
      }

      const targetFolderId = academyFolders.categories[category];
      if (!targetFolderId) {
        console.log(`  ⚠️ ${file.name} → "${category}" 폴더 ID 없음`);
        failed++;
        continue;
      }

      await moveFile(file.id, rootId, targetFolderId);
      classified++;
      console.log(`  ✅ ${file.name} → ${category}`);
    } catch (e) {
      console.log(`  ❌ ${file.name} 처리 실패: ${e.message}`);
      failed++;
    }
  }

  return { classified, failed };
}

/**
 * 모든 학원 루트 폴더 스캔 & 자동 분류
 */
export async function classifyAll() {
  const folders = await loadDriveFolders();
  let totalClassified = 0;
  let totalFailed = 0;

  for (const [key, val] of Object.entries(folders)) {
    if (key === 'description') continue;
    if (!val.root) continue;

    const result = await classifyForAcademy(key, val);
    totalClassified += result.classified;
    totalFailed += result.failed;
  }

  if (totalClassified > 0 || totalFailed > 0) {
    console.log(`  📸 이미지 분류 완료: ${totalClassified}장 분류, ${totalFailed}장 실패`);
  }

  return { classified: totalClassified, failed: totalFailed };
}
