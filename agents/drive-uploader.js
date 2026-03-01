import { google } from 'googleapis';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname as pathDirname, join, basename } from 'path';
import { createReadStream } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathDirname(__filename);

let driveClient = null;

async function getDrive() {
  if (driveClient) return driveClient;
  const credsPath = join(__dirname, '..', 'config', 'google-service-account.json');
  const creds = JSON.parse(await readFile(credsPath, 'utf-8'));
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
}

async function getOrCreateFolder(drive, folderName, parentId) {
  const query = parentId
    ? `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const res = await drive.files.list({
    q: query,
    fields: 'files(id,name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  if (res.data.files.length > 0) return res.data.files[0].id;

  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) fileMetadata.parents = [parentId];

  const folder = await drive.files.create({
    resource: fileMetadata,
    fields: 'id',
    supportsAllDrives: true,
  });
  return folder.data.id;
}

/**
 * PNG 파일들을 Google Drive에 업로드
 * @param {string[]} pngPaths - 로컬 PNG 파일 경로 배열
 * @param {string} academyName - 학원명 (폴더 이름)
 * @param {string} pageTitle - 노션 페이지 제목 (하위 폴더명으로 사용)
 * @param {string} [parentFolderId] - academies.json의 drive_folder_id
 * @returns {Promise<Object[]>} [{ fileName, driveUrl, webViewLink }]
 */
export async function uploadPNGs(pngPaths, academyName, pageTitle, parentFolderId) {
  const drive = await getDrive();

  // 학원 폴더
  const academyFolderId = await getOrCreateFolder(
    drive,
    academyName,
    parentFolderId || undefined,
  );

  // 페이지 제목으로 하위 폴더 생성
  const subFolderName = pageTitle || new Date().toISOString().slice(0, 10);
  const subFolderId = await getOrCreateFolder(drive, subFolderName, academyFolderId);

  const results = [];

  for (const pngPath of pngPaths) {
    const fileName = basename(pngPath);

    const res = await drive.files.create({
      resource: {
        name: fileName,
        parents: [subFolderId],
      },
      media: {
        mimeType: 'image/png',
        body: createReadStream(pngPath),
      },
      fields: 'id,webViewLink,webContentLink',
      supportsAllDrives: true,
    });

    // 공개 읽기 권한 설정 (Notion에서 이미지 표시용)
    await drive.permissions.create({
      fileId: res.data.id,
      resource: { role: 'reader', type: 'anyone' },
      supportsAllDrives: true,
    });

    const directUrl = `https://drive.google.com/uc?export=view&id=${res.data.id}`;

    results.push({
      fileName,
      fileId: res.data.id,
      driveUrl: directUrl,
      webViewLink: res.data.webViewLink,
    });

    console.log(`  📤 ${fileName} 업로드 완료`);
  }

  console.log(`  ✅ Drive 업로드 완료: ${results.length}장 → ${academyName}/${subFolderName}`);
  return { files: results, folderId: subFolderId };
}

/**
 * HTML 소스를 Drive에 업로드
 * @param {string[]} htmlSources - HTML 문자열 배열
 * @param {string} folderId - 이미 생성된 하위 폴더 ID
 * @returns {Promise<Object[]>} [{ fileName, webViewLink }]
 */
export async function uploadHTMLs(htmlSources, folderId) {
  if (!htmlSources || htmlSources.length === 0) return [];

  const drive = await getDrive();
  const results = [];

  for (let i = 0; i < htmlSources.length; i++) {
    const fileName = `card-${String(i + 1).padStart(2, '0')}.html`;
    const { Readable } = await import('stream');

    const res = await drive.files.create({
      resource: {
        name: fileName,
        parents: [folderId],
      },
      media: {
        mimeType: 'text/html',
        body: Readable.from(htmlSources[i]),
      },
      fields: 'id,webViewLink',
      supportsAllDrives: true,
    });

    await drive.permissions.create({
      fileId: res.data.id,
      resource: { role: 'reader', type: 'anyone' },
      supportsAllDrives: true,
    });

    results.push({
      fileName,
      fileId: res.data.id,
      webViewLink: res.data.webViewLink,
    });
  }

  console.log(`  📤 HTML ${results.length}개 업로드 완료`);
  return results;
}
