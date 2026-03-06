#!/usr/bin/env node
/**
 * Google Drive 사진 자동 분류 스크립트
 *
 * 사용법:
 *   node scripts/classify-drive-images.js              # 전체 스캔 (dry-run)
 *   node scripts/classify-drive-images.js --execute     # 실제 복사 실행
 *   node scripts/classify-drive-images.js --academy ollinone  # 특정 학원만
 *
 * 동작:
 *   1. 소스 폴더 재귀 스캔 → 이미지 파일 수집
 *   2. Gemini Vision으로 각 이미지 분석 → 카테고리 분류
 *   3. 분류 결과를 JSON + 시트에 기록
 *   4. --execute 시 대상 폴더로 복사
 *
 * 설정: config/drive-sources.json에 소스 폴더 매핑
 */

import 'dotenv/config';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { google } from 'googleapis';
import { GoogleGenAI } from '@google/genai';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR = join(__dirname, '..', 'config');
const OUTPUT_DIR = join(__dirname, '..', 'temp', 'classify');

// ── 설정 ──

const CATEGORIES = ['수업사진', '학생사진', '학원외관', '상담사진', '스킵'];

const SOURCE_FOLDERS = {
  ollinone: {
    name: '올인원',
    rootId: '1LNn5nGySif-75xHaovINNQ8pNhXatJyr',
  },
  jinhak: {
    name: '진학',
    rootId: '1LAZIDm1gZsfKnXX4KHs4x4q9MFkgf25J',
  },
  toktok: {
    name: '톡톡',
    rootId: '1KfPqQnedp4lmln69UGtPfbLkL3iqlAu5',
  },
};

// ── Google API 초기화 ──

let _drive = null;
let _ai = null;

async function getDrive() {
  if (_drive) return _drive;
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || join(CONFIG_DIR, 'google-service-account.json');
  const key = JSON.parse(await readFile(keyPath, 'utf-8'));
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  _drive = google.drive({ version: 'v3', auth });
  return _drive;
}

function getAI() {
  if (_ai) return _ai;
  _ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
  return _ai;
}

// ── Drive 재귀 스캔 ──

async function listAllImages(drive, folderId, path = '', depth = 0) {
  if (depth > 5) return []; // 깊이 제한

  const images = [];
  let pageToken = null;

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, size, createdTime)',
      pageSize: 200,
      pageToken,
    });

    for (const file of res.data.files || []) {
      const filePath = path ? `${path}/${file.name}` : file.name;

      if (file.mimeType === 'application/vnd.google-apps.folder') {
        const subImages = await listAllImages(drive, file.id, filePath, depth + 1);
        images.push(...subImages);
      } else if (file.mimeType?.startsWith('image/')) {
        images.push({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          size: parseInt(file.size || '0'),
          path: filePath,
          createdTime: file.createdTime,
        });
      }
    }

    pageToken = res.data.nextPageToken;
  } while (pageToken);

  return images;
}

// ── Gemini Vision 분류 ──

async function classifyImage(drive, ai, image) {
  // HEIC/DNG 등 비표준 포맷은 Drive 썸네일(JPEG)로 변환
  let imageBytes;
  let mimeType = image.mimeType;

  // 항상 Drive 썸네일(JPEG) 사용 — HEIC/대용량 모두 해결
  try {
    const meta = await drive.files.get({
      fileId: image.id,
      fields: 'thumbnailLink',
    });
    const thumbUrl = meta.data.thumbnailLink;
    if (!thumbUrl) {
      return { category: '스킵', reason: '썸네일 없음', confidence: 0 };
    }
    // 고해상도 썸네일 요청 (분류용이라 800px이면 충분)
    const hiResUrl = thumbUrl.replace(/=s\d+/, '=s800');
    const thumbRes = await fetch(hiResUrl);
    if (!thumbRes.ok) {
      return { category: '스킵', reason: `썸네일 실패: ${thumbRes.status}`, confidence: 0 };
    }
    imageBytes = Buffer.from(await thumbRes.arrayBuffer()).toString('base64');
    mimeType = 'image/jpeg';
  } catch (err) {
    return { category: '스킵', reason: `다운로드 실패: ${err.message}`, confidence: 0 };
  }

  const prompt = `이 이미지를 분석하고 아래 카테고리 중 하나로 분류해주세요.

카테고리:
- 수업사진: 학원 교실에서 수업하는 장면, 선생님 강의, 학생들이 공부하는 모습, 칠판/화이트보드 판서, 교재 풀이
- 학생사진: 학생 개인/단체 사진, 프로필 사진, 우수자 사진, 시상식
- 학원외관: 학원 건물 외관, 간판, 로비, 복도, 교실 인테리어 (사람 없는)
- 상담사진: 상담 장면, 학부모 미팅, 1:1 대화
- 스킵: 카드뉴스에 사용 부적합 (스크린샷, 문서, 시험지, 카톡 캡처, 텍스트 위주, 로고, 너무 흐림/어두움)

반드시 아래 JSON 형식으로만 응답하세요:
{"category": "카테고리명", "reason": "분류 이유 한 줄", "confidence": 0.0~1.0, "tags": ["태그1", "태그2"]}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { inlineData: { data: imageBytes, mimeType } },
        { text: prompt },
      ],
    });

    const text = response.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { category: '스킵', reason: 'AI 응답 파싱 실패', confidence: 0 };

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    return { category: '스킵', reason: `AI 분류 실패: ${err.message}`, confidence: 0 };
  }
}

// ── 복사 실행 ──

async function copyToTarget(drive, fileId, targetFolderId) {
  const res = await drive.files.copy({
    fileId,
    requestBody: { parents: [targetFolderId] },
    fields: 'id',
  });
  return res.data.id;
}

// ── 메인 ──

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  const academyFilter = args.find((_, i, a) => a[i - 1] === '--academy');

  const drive = await getDrive();
  const ai = getAI();

  // 대상 폴더 로드
  const driveFolders = JSON.parse(await readFile(join(CONFIG_DIR, 'drive-folders.json'), 'utf-8'));

  await mkdir(OUTPUT_DIR, { recursive: true });

  const allResults = [];

  for (const [academyKey, source] of Object.entries(SOURCE_FOLDERS)) {
    if (academyFilter && academyKey !== academyFilter) continue;

    console.log(`\n${'═'.repeat(50)}`);
    console.log(`  📂 ${source.name} 스캔 시작 (${academyKey})`);
    console.log(`${'═'.repeat(50)}\n`);

    // 1. 재귀 스캔
    console.log('  🔍 이미지 파일 수집 중...');
    const images = await listAllImages(drive, source.rootId);
    console.log(`  📊 총 ${images.length}장 발견\n`);

    if (images.length === 0) continue;

    // 해상도 너무 작은 것 필터 (10KB 미만)
    const validImages = images.filter(img => img.size > 10240);
    console.log(`  📊 유효 이미지: ${validImages.length}장 (10KB 미만 ${images.length - validImages.length}장 제외)\n`);

    // 2. Gemini Vision 분류
    let classified = 0;
    const results = [];

    for (const image of validImages) {
      classified++;
      process.stdout.write(`  🤖 [${classified}/${validImages.length}] ${image.name.substring(0, 40)}...`);

      const result = await classifyImage(drive, ai, image);
      results.push({
        ...image,
        ...result,
        academyKey,
      });

      console.log(` → ${result.category} (${(result.confidence * 100).toFixed(0)}%)`);

      // Rate limit 방지 (Gemini 무료 15 RPM)
      if (classified % 14 === 0) {
        console.log('  ⏳ Rate limit 대기 (60초)...');
        await new Promise(r => setTimeout(r, 61000));
      }
    }

    // 3. 결과 저장
    const outputPath = join(OUTPUT_DIR, `${academyKey}-classify.json`);
    await writeFile(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n  💾 분류 결과 저장: ${outputPath}`);

    // 4. 통계
    const stats = {};
    for (const r of results) {
      stats[r.category] = (stats[r.category] || 0) + 1;
    }
    console.log('\n  📊 분류 결과:');
    for (const [cat, count] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
      console.log(`     ${cat}: ${count}장`);
    }

    // 5. 복사 실행
    if (execute) {
      const targets = driveFolders[academyKey]?.categories;
      if (!targets) {
        console.log(`\n  ⚠️ ${academyKey} 대상 폴더 없음 — 스킵`);
        continue;
      }

      console.log('\n  📤 복사 시작...');
      let copied = 0;
      let skipped = 0;

      for (const r of results) {
        if (r.category === '스킵' || r.confidence < 0.6) {
          skipped++;
          continue;
        }

        const targetFolderId = targets[r.category];
        if (!targetFolderId) {
          skipped++;
          continue;
        }

        try {
          await copyToTarget(drive, r.id, targetFolderId);
          copied++;
          if (copied % 10 === 0) console.log(`     복사 진행: ${copied}장...`);
        } catch (err) {
          console.log(`     ⚠️ 복사 실패 ${r.name}: ${err.message}`);
          skipped++;
        }
      }

      console.log(`  ✅ 복사 완료: ${copied}장 복사, ${skipped}장 스킵`);
    }

    allResults.push(...results);
  }

  // 전체 통계
  console.log(`\n${'═'.repeat(50)}`);
  console.log('  📊 전체 분류 결과');
  console.log(`${'═'.repeat(50)}`);

  const totalStats = {};
  for (const r of allResults) {
    const key = `${r.academyKey}/${r.category}`;
    totalStats[key] = (totalStats[key] || 0) + 1;
  }
  for (const [key, count] of Object.entries(totalStats).sort()) {
    console.log(`  ${key}: ${count}장`);
  }

  if (!execute) {
    console.log('\n  ℹ️  이것은 dry-run입니다. 실제 복사하려면 --execute 옵션을 추가하세요.');
    console.log('     결과 파일을 검토한 후 실행하세요.');
  }
}

main().catch(err => {
  console.error('❌ 에러:', err.message);
  process.exit(1);
});
