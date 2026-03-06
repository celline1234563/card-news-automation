#!/usr/bin/env node
/**
 * 서비스 계정 소유 Drive 폴더를 개인 계정에 소유자 권한으로 공유
 */

import 'dotenv/config';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONFIG_DIR = join(__dirname, '..', 'config');

const SHARE_TO = [
  'marketingdiet.sp@gmail.com',
  'celline.ceo@marketingdiet.online',
  'ellen.cm@marketingdiet.online',
];

async function main() {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || join(CONFIG_DIR, 'google-service-account.json');
  const key = JSON.parse(await readFile(keyPath, 'utf-8'));
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  const drive = google.drive({ version: 'v3', auth });

  const foldersRaw = await readFile(join(CONFIG_DIR, 'drive-folders.json'), 'utf-8');
  const folders = JSON.parse(foldersRaw);

  // 모든 폴더 ID 수집
  const allFolderIds = [];
  for (const [academy, config] of Object.entries(folders)) {
    if (typeof config !== 'object' || !config.root) continue;
    allFolderIds.push({ id: config.root, label: `${academy}/root` });
    if (config.categories) {
      for (const [cat, folderId] of Object.entries(config.categories)) {
        allFolderIds.push({ id: folderId, label: `${academy}/${cat}` });
      }
    }
  }

  console.log(`\n총 ${allFolderIds.length}개 폴더 x ${SHARE_TO.length}개 계정 = ${allFolderIds.length * SHARE_TO.length}건 공유\n`);

  let success = 0;
  let fail = 0;

  for (const folder of allFolderIds) {
    for (const email of SHARE_TO) {
      try {
        await drive.permissions.create({
          fileId: folder.id,
          requestBody: {
            type: 'user',
            role: 'writer',  // service account는 owner 이전 불가 → writer로 설정
            emailAddress: email,
          },
          sendNotificationEmail: false,
        });
        success++;
        console.log(`  ✅ ${folder.label} → ${email}`);
      } catch (err) {
        fail++;
        console.log(`  ❌ ${folder.label} → ${email}: ${err.message}`);
      }
    }
  }

  console.log(`\n완료: ${success}건 성공, ${fail}건 실패`);
  console.log('\n⚠️  서비스 계정은 owner 이전이 불가해서 writer(편집자) 권한으로 공유했습니다.');
  console.log('폴더 접근 후 본인이 직접 소유권 이전하거나, 새 폴더를 만들어 ID를 교체하세요.');
}

main().catch(err => {
  console.error('❌ 에러:', err.message);
  process.exit(1);
});
