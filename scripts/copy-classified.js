#!/usr/bin/env node
/**
 * 이미 분류된 JSON 결과를 읽어서 Drive 폴더로 복사(addParents)만 실행
 */
import 'dotenv/config';
import { readFile, readdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { google } from 'googleapis';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR = join(__dirname, '..', 'config');
const CLASSIFY_DIR = join(__dirname, '..', 'temp', 'classify');

async function main() {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || join(CONFIG_DIR, 'google-service-account.json');
  const key = JSON.parse(await readFile(keyPath, 'utf-8'));
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  const drive = google.drive({ version: 'v3', auth });

  const driveFolders = JSON.parse(await readFile(join(CONFIG_DIR, 'drive-folders.json'), 'utf-8'));

  const files = (await readdir(CLASSIFY_DIR)).filter(f => f.endsWith('-classify.json'));

  let totalCopied = 0;
  let totalSkipped = 0;

  for (const f of files) {
    const academyKey = f.replace('-classify.json', '');
    const data = JSON.parse(await readFile(join(CLASSIFY_DIR, f), 'utf-8'));
    const targets = driveFolders[academyKey]?.categories;

    if (!targets) {
      console.log(`⚠️ ${academyKey}: 대상 폴더 없음 — 스킵`);
      continue;
    }

    const usable = data.filter(r => r.category !== '스킵' && r.confidence >= 0.6);
    console.log(`\n📂 ${academyKey}: ${usable.length}장 복사 시작`);

    let copied = 0;
    let skipped = 0;

    for (const r of usable) {
      const targetFolderId = targets[r.category];
      if (!targetFolderId) {
        skipped++;
        continue;
      }

      try {
        // 바로가기 생성 (shortcut) — 용량 안 씀, 원본 유지
        await drive.files.create({
          requestBody: {
            name: r.name,
            mimeType: 'application/vnd.google-apps.shortcut',
            shortcutDetails: { targetId: r.id },
            parents: [targetFolderId],
          },
          fields: 'id',
        });
        copied++;
        if (copied % 20 === 0) console.log(`  진행: ${copied}/${usable.length}장...`);
      } catch (err) {
        skipped++;
        console.log(`  ⚠️ ${r.name}: ${err.message.substring(0, 80)}`);
      }
    }

    console.log(`✅ ${academyKey}: ${copied}장 복사, ${skipped}장 스킵`);
    totalCopied += copied;
    totalSkipped += skipped;
  }

  console.log(`\n${'═'.repeat(40)}`);
  console.log(`전체: ${totalCopied}장 복사, ${totalSkipped}장 스킵`);
}

main().catch(err => {
  console.error('에러:', err.message);
  process.exit(1);
});
