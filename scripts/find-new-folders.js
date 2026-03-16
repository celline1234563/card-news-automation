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
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  return google.drive({ version: 'v3', auth });
}

async function main() {
  const drive = await getDrive();
  const config = JSON.parse(await readFile(CONFIG_PATH, 'utf-8'));
  const targetNames = ['후기사진', '자습사진'];
  let updated = false;

  for (const [key, val] of Object.entries(config)) {
    if (key === 'description' || !val.root) continue;

    console.log(`\n📂 ${key} (root: ${val.root}):`);

    // 루트 폴더 안의 하위 폴더 조회
    const res = await drive.files.list({
      q: `'${val.root}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
    });

    const folders = res.data.files || [];
    console.log(`  하위 폴더: ${folders.map(f => f.name).join(', ')}`);

    for (const name of targetNames) {
      const match = folders.find(f => f.name === name);
      if (match) {
        if (!val.categories[name]) {
          val.categories[name] = match.id;
          updated = true;
          console.log(`  ✅ ${name} → ${match.id}`);
        } else {
          console.log(`  ⏭ ${name} — 이미 등록됨`);
        }
      } else {
        console.log(`  ❌ ${name} — 폴더 없음`);
      }
    }
  }

  if (updated) {
    await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8');
    console.log('\n✅ drive-folders.json 업데이트 완료');
  } else {
    console.log('\n변경 사항 없음');
  }
}

main().catch(e => {
  console.error('❌ 실패:', e.message);
  process.exit(1);
});
