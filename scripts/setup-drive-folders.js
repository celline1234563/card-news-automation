#!/usr/bin/env node
/**
 * Google Drive 이미지 폴더 계층 자동 생성
 *
 * 사용법: node scripts/setup-drive-folders.js [academyKey]
 *
 * 생성 구조:
 *   카드뉴스_이미지/
 *   ├── 올인원/
 *   │   ├── 수업사진/
 *   │   ├── 학생사진/
 *   │   ├── 학원외관/
 *   │   └── 상담사진/
 *   ├── 진학/
 *   └── 톡톡/
 */

import 'dotenv/config';
import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONFIG_DIR = join(__dirname, '..', 'config');

const CATEGORIES = ['수업사진', '학생사진', '학원외관', '상담사진'];

const SHARE_TO = [
  'marketingdiet.sp@gmail.com',
  'celline.ceo@marketingdiet.online',
  'ellen.cm@marketingdiet.online',
];

async function getAuth() {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || join(CONFIG_DIR, 'google-service-account.json');
  const key = JSON.parse(await readFile(keyPath, 'utf-8'));
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
}

async function createFolder(drive, name, parentId) {
  const response = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : [],
    },
    fields: 'id, name',
  });
  return response.data;
}

async function shareFolder(drive, folderId, label) {
  // 링크 공유 (누구나 읽기)
  await drive.permissions.create({
    fileId: folderId,
    requestBody: { type: 'anyone', role: 'reader' },
  });
  console.log(`  🔗 ${label} 링크 공유 활성화`);

  // 개인 계정에 writer 권한
  for (const email of SHARE_TO) {
    try {
      await drive.permissions.create({
        fileId: folderId,
        requestBody: { type: 'user', role: 'writer', emailAddress: email },
        sendNotificationEmail: false,
      });
      console.log(`  👤 ${label} → ${email}`);
    } catch (err) {
      console.log(`  ⚠️ ${label} → ${email}: ${err.message}`);
    }
  }
}

async function main() {
  const targetAcademy = process.argv[2]; // optional filter

  const auth = await getAuth();
  const drive = google.drive({ version: 'v3', auth });

  const academiesRaw = await readFile(join(CONFIG_DIR, 'academies.json'), 'utf-8');
  const academies = JSON.parse(academiesRaw);

  const driveFoldersPath = join(CONFIG_DIR, 'drive-folders.json');
  const driveFolders = JSON.parse(await readFile(driveFoldersPath, 'utf-8'));

  // 루트 폴더 생성
  console.log('📁 루트 폴더 생성: 카드뉴스_이미지');
  const rootFolder = await createFolder(drive, '카드뉴스_이미지');
  console.log(`  ID: ${rootFolder.id}`);
  await shareFolder(drive, rootFolder.id, '카드뉴스_이미지');

  for (const [key, config] of Object.entries(academies)) {
    if (targetAcademy && key !== targetAcademy) continue;

    const academyName = config.notion_prefix || config.name;
    console.log(`\n📁 학원 폴더: ${academyName}`);
    const academyFolder = await createFolder(drive, academyName, rootFolder.id);
    console.log(`  ID: ${academyFolder.id}`);
    await shareFolder(drive, academyFolder.id, academyName);

    if (!driveFolders[key]) {
      driveFolders[key] = { root: '', categories: {} };
    }
    driveFolders[key].root = academyFolder.id;

    for (const category of CATEGORIES) {
      const catFolder = await createFolder(drive, category, academyFolder.id);
      driveFolders[key].categories[category] = catFolder.id;
      console.log(`  📂 ${category}: ${catFolder.id}`);
      await shareFolder(drive, catFolder.id, `${academyName}/${category}`);
    }
  }

  // drive-folders.json 업데이트
  await writeFile(driveFoldersPath, JSON.stringify(driveFolders, null, 2));
  console.log('\n✅ drive-folders.json 업데이트 완료');
}

main().catch(err => {
  console.error('❌ 에러:', err.message);
  process.exit(1);
});
