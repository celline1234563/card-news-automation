#!/usr/bin/env node
import 'dotenv/config';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { google } from 'googleapis';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR = join(__dirname, '..', 'config');

async function main() {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || join(CONFIG_DIR, 'google-service-account.json');
  const key = JSON.parse(await readFile(keyPath, 'utf-8'));
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const drive = google.drive({ version: 'v3', auth });

  // 우리가 만든 폴더 ID 수집
  const ownFolders = JSON.parse(await readFile(join(CONFIG_DIR, 'drive-folders.json'), 'utf-8'));
  const ownIds = new Set();
  for (const v of Object.values(ownFolders)) {
    if (typeof v === 'object' && v.root) {
      ownIds.add(v.root);
      if (v.categories) Object.values(v.categories).forEach(id => ownIds.add(id));
    }
  }

  // 공유된 폴더 조회
  const res = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.folder'",
    fields: 'files(id, name, owners, shared, parents)',
    pageSize: 200,
  });

  const files = res.data.files || [];
  const external = files.filter(f => !ownIds.has(f.id));

  console.log(`=== 접근 가능한 폴더 (우리 폴더 ${ownIds.size}개 제외) ===\n`);

  if (external.length === 0) {
    console.log('(없음) — 공유된 폴더가 감지되지 않습니다.');
    console.log('\n전체 접근 가능 폴더:');
    for (const f of files) {
      console.log(`  ${f.id} | ${f.name} | owner: ${f.owners?.map(o => o.emailAddress).join(',')}`);
    }
  } else {
    for (const f of external) {
      console.log(`  ${f.id} | ${f.name} | owner: ${f.owners?.map(o => o.emailAddress).join(',')}`);
    }
  }

  // 공유된 폴더 안의 이미지 수 확인
  console.log('\n=== 폴더별 이미지 파일 수 ===\n');
  for (const f of external) {
    const imgRes = await drive.files.list({
      q: `'${f.id}' in parents and mimeType contains 'image/'`,
      fields: 'files(id)',
      pageSize: 1000,
    });
    const count = imgRes.data.files?.length || 0;

    const allRes = await drive.files.list({
      q: `'${f.id}' in parents`,
      fields: 'files(id, mimeType)',
      pageSize: 1000,
    });
    const total = allRes.data.files?.length || 0;
    const subfolders = (allRes.data.files || []).filter(f => f.mimeType === 'application/vnd.google-apps.folder').length;

    console.log(`  ${f.name}: 이미지 ${count}장, 전체 ${total}개, 하위폴더 ${subfolders}개`);
  }
}

main().catch(err => {
  console.error('에러:', err.message);
  process.exit(1);
});
