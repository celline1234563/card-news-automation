#!/usr/bin/env node
/**
 * 오답노트 폴더 → 올인원 교재사진 폴더로 이미지 복사
 */
import 'dotenv/config';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { google } from 'googleapis';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR = join(__dirname, '..', 'config');

const SOURCE_FOLDER_ID = '1zpwvMhhZa59KV_BqcQBtb9hZh7LUPcV7';
const TARGET_FOLDER_ID = '10d8b59diPIi4IgSCr5vpgwaP1GYQWQIB'; // 올인원 교재사진

async function main() {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || join(CONFIG_DIR, 'google-service-account.json');
  const key = JSON.parse(await readFile(keyPath, 'utf-8'));
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  const drive = google.drive({ version: 'v3', auth });

  // 1. 소스 폴더의 모든 파일 목록 조회 (페이지네이션 포함)
  console.log('📂 소스 폴더(오답노트) 파일 목록 조회 중...\n');
  let allFiles = [];
  let pageToken = null;

  do {
    const res = await drive.files.list({
      q: `'${SOURCE_FOLDER_ID}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType)',
      pageSize: 1000,
      pageToken,
    });
    allFiles = allFiles.concat(res.data.files || []);
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  console.log(`총 ${allFiles.length}개 파일 발견\n`);

  // 이미지 파일만 필터
  const imageFiles = allFiles.filter(f => f.mimeType.startsWith('image/'));
  const nonImageFiles = allFiles.filter(f => !f.mimeType.startsWith('image/'));

  console.log(`이미지: ${imageFiles.length}개, 기타: ${nonImageFiles.length}개`);
  if (nonImageFiles.length > 0) {
    console.log('기타 파일:', nonImageFiles.map(f => `${f.name} (${f.mimeType})`).join(', '));
  }

  // 2. 대상 폴더에 이미 있는 파일 확인
  console.log('\n📂 대상 폴더(교재사진) 기존 파일 확인 중...');
  let existingFiles = [];
  pageToken = null;

  do {
    const res = await drive.files.list({
      q: `'${TARGET_FOLDER_ID}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name)',
      pageSize: 1000,
      pageToken,
    });
    existingFiles = existingFiles.concat(res.data.files || []);
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  const existingNames = new Set(existingFiles.map(f => f.name));
  console.log(`기존 파일: ${existingFiles.length}개\n`);

  // 3. 복사 실행
  const toCopy = imageFiles.filter(f => !existingNames.has(f.name));
  const skipped = imageFiles.filter(f => existingNames.has(f.name));

  console.log(`복사 대상: ${toCopy.length}개, 이미 존재(스킵): ${skipped.length}개\n`);

  if (skipped.length > 0) {
    console.log('스킵 파일:', skipped.map(f => f.name).join(', '));
    console.log('');
  }

  let copied = 0;
  let failed = 0;

  for (const file of toCopy) {
    try {
      await drive.files.copy({
        fileId: file.id,
        requestBody: {
          name: file.name,
          parents: [TARGET_FOLDER_ID],
        },
        fields: 'id, name',
      });
      copied++;
      console.log(`  ✅ ${file.name}`);
    } catch (err) {
      failed++;
      console.log(`  ❌ ${file.name}: ${err.message.substring(0, 100)}`);
    }
  }

  console.log(`\n${'═'.repeat(40)}`);
  console.log(`완료: ${copied}개 복사, ${skipped.length}개 스킵(이미존재), ${failed}개 실패`);
}

main().catch(err => {
  console.error('에러:', err.message);
  process.exit(1);
});
