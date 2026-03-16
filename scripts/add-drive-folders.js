import 'dotenv/config';
import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONFIG_PATH = join(__dirname, '..', 'config', 'drive-folders.json');

async function getDrive() {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || join(__dirname, '..', 'config', 'google-service-account.json');
  const key = JSON.parse(await readFile(keyPath, 'utf-8'));

  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return google.drive({ version: 'v3', auth });
}

async function createFolder(drive, name, parentId) {
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  });
  return res.data.id;
}

async function main() {
  const newFolders = ['후기사진', '자습사진'];

  const drive = await getDrive();
  const config = JSON.parse(await readFile(CONFIG_PATH, 'utf-8'));

  for (const [key, val] of Object.entries(config)) {
    if (key === 'description' || !val.root) continue;

    console.log(`\n📂 ${key}:`);

    for (const folderName of newFolders) {
      if (val.categories[folderName]) {
        console.log(`  ⏭ ${folderName} — 이미 존재 (${val.categories[folderName]})`);
        continue;
      }

      const folderId = await createFolder(drive, folderName, val.root);
      val.categories[folderName] = folderId;
      console.log(`  ✅ ${folderName} → ${folderId}`);
    }
  }

  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  console.log('\n✅ drive-folders.json 업데이트 완료');
}

main().catch(e => {
  console.error('❌ 실패:', e.message);
  process.exit(1);
});
