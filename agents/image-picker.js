import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let _drive = null;
let _sheets = null;

/**
 * Google API 인증 (서비스 계정)
 */
export async function getClients() {
  if (_drive && _sheets) return { drive: _drive, sheets: _sheets };

  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || join(__dirname, '..', 'config', 'google-service-account.json');
  const key = JSON.parse(await readFile(keyPath, 'utf-8'));

  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });

  _drive = google.drive({ version: 'v3', auth });
  _sheets = google.sheets({ version: 'v4', auth });

  return { drive: _drive, sheets: _sheets };
}

/**
 * Drive 폴더 설정 로드
 */
async function loadDriveFolders() {
  const raw = await readFile(join(__dirname, '..', 'config', 'drive-folders.json'), 'utf-8');
  return JSON.parse(raw);
}

/**
 * Sheets 메타데이터에서 사용 이력 조회
 */
async function getUsedImages(academyKey) {
  const sheetName = process.env.GOOGLE_SHEET_NAME || '이미지_메타데이터';
  try {
    const { sheets } = await getClients();
    // 시트 ID는 별도 환경변수로 관리
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) return new Set();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:C`,
    });

    const rows = response.data.values || [];
    const used = new Set();
    for (const row of rows) {
      if (row[0] === academyKey) {
        used.add(row[1]); // fileId
      }
    }
    return used;
  } catch {
    return new Set();
  }
}

/**
 * 사용 이력 기록
 */
async function recordUsedImage(academyKey, fileId, category) {
  try {
    const { sheets } = await getClients();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) return;

    const sheetName = process.env.GOOGLE_SHEET_NAME || '이미지_메타데이터';
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:D`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[academyKey, fileId, category, new Date().toISOString()]],
      },
    });
  } catch {
    // 기록 실패는 무시
  }
}

/**
 * Drive 폴더에서 이미지 후보 조회 (바로가기 shortcut도 포함)
 */
async function listImagesInFolder(folderId) {
  if (!folderId) return [];

  try {
    const { drive } = await getClients();

    // 1) 직접 이미지 파일
    const imageRes = await drive.files.list({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: 'files(id, name, mimeType, createdTime, description)',
      orderBy: 'createdTime desc',
      pageSize: 50,
    });
    const images = imageRes.data.files || [];

    // 2) 바로가기(shortcut) → 원본이 이미지인 것만
    const shortcutRes = await drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.shortcut' and trashed = false`,
      fields: 'files(id, name, shortcutDetails)',
      pageSize: 100,
    });
    const shortcuts = shortcutRes.data.files || [];

    for (const sc of shortcuts) {
      const targetId = sc.shortcutDetails?.targetId;
      if (!targetId) continue;
      try {
        const meta = await drive.files.get({
          fileId: targetId,
          fields: 'id, name, mimeType, createdTime, description',
        });
        if (meta.data.mimeType?.startsWith('image/')) {
          images.push(meta.data);
        }
      } catch {
        // 원본 삭제된 바로가기 무시
      }
    }

    return images;
  } catch {
    return [];
  }
}

/**
 * 후보 이미지에 유사도 점수 매기기
 */
export function scoreCandidates(candidates, card, usedImages) {
  return candidates
    .filter(file => !usedImages.has(file.id))
    .map(file => {
      let score = 0;
      const name = (file.name || '').toLowerCase();
      const desc = (file.description || '').toLowerCase();

      // 파일명/설명에 카드 키워드 포함 시 가산
      const keywords = [
        card.type,
        card.image_category,
        ...(card.headline || '').replace(/<\/?em>/g, '').split(/\s+/),
      ].filter(Boolean).map(k => k.toLowerCase());

      for (const kw of keywords) {
        if (name.includes(kw)) score += 2;
        if (desc.includes(kw)) score += 1;
      }

      // 최신 이미지 약간 가산
      if (file.createdTime) {
        const age = Date.now() - new Date(file.createdTime).getTime();
        const daysOld = age / (1000 * 60 * 60 * 24);
        if (daysOld < 30) score += 1;
      }

      return { ...file, score };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * 단일 카드 이미지 매칭
 */
export async function pickImage(card, academyKey) {
  if (!card.image_category) return null;

  const folders = await loadDriveFolders();
  const academyFolders = folders[academyKey];
  if (!academyFolders) return null;

  const folderId = academyFolders.categories?.[card.image_category];
  if (!folderId) return null;

  const candidates = await listImagesInFolder(folderId);
  if (candidates.length === 0) return null;

  const usedImages = await getUsedImages(academyKey);
  const scored = scoreCandidates(candidates, card, usedImages);

  if (scored.length === 0) return null;

  // Top 3에서 랜덤 선택
  const top3 = scored.slice(0, 3);
  const selected = top3[Math.floor(Math.random() * top3.length)];

  // 사용 기록
  await recordUsedImage(academyKey, selected.id, card.image_category);

  // Drive 직접 URL 생성
  return `https://drive.google.com/uc?export=view&id=${selected.id}`;
}

/**
 * 누끼(배경 제거) 대상 카테고리 — 이 카테고리는 image_url로 설정 → bg-remover에서 처리
 * 나머지 카테고리(수업사진, 학원외관 등)는 bg_image_url로 설정 → 영역 분리 레이아웃으로 사용
 */
const CUTOUT_CATEGORIES = new Set(['선생님사진', '학생사진', '인물', '원장님사진', '상담사진']);

/**
 * 카드 타입 기반 image_category 자동 할당
 * researcher가 image_category를 null로 남긴 카드에 기본값 부여
 */
const TYPE_DEFAULT_CATEGORY = {
  problem: '학생사진',
  empathy: '학생사진',
  example: '수업사진',
  solution: '수업사진',
  cta: '학원외관',
};

/**
 * visual_asset 텍스트에서 사진 카테고리 키워드를 감지
 * "학원 소그룹 수업 실사진" → "수업사진"
 * "상담 장면 사진" → "상담사진"
 */
const VISUAL_ASSET_CATEGORY_MAP = [
  { keywords: ['수업', '강의', '소그룹', '문제 풀이', '화이트보드'], category: '수업사진' },
  { keywords: ['학생', '학생들'], category: '학생사진' },
  { keywords: ['외관', '건물', '입구', '간판'], category: '학원외관' },
  { keywords: ['상담', '면담', '학부모'], category: '상담사진' },
  { keywords: ['선생님', '강사', '원장'], category: '선생님사진' },
  { keywords: ['교재', '교과서', '문제집'], category: '교재사진' },
  { keywords: ['설명회', '입학설명', '간담회'], category: '설명회사진' },
  { keywords: ['후기', '리뷰', '카톡', '카카오톡'], category: '후기사진' },
  { keywords: ['자습', '자기주도', '독서실'], category: '자습사진' },
];

function extractCategoryFromVisualAsset(visualAsset) {
  if (!visualAsset || typeof visualAsset !== 'string') return null;

  const lower = visualAsset.toLowerCase();

  // "실사진", "사진", "photo" 키워드가 있는 경우만 사진 매칭 시도
  if (!lower.includes('사진') && !lower.includes('photo') && !lower.includes('실사')) return null;

  for (const { keywords, category } of VISUAL_ASSET_CATEGORY_MAP) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category;
    }
  }
  return null;
}

function autoAssignCategory(cards, academyKey) {
  let assigned = 0;
  let fromVisualAsset = 0;

  for (const card of cards) {
    if (card.image_category) continue;

    // 1순위: visual_asset에서 사진 카테고리 추출
    const vaCategory = extractCategoryFromVisualAsset(card.visual_asset);
    if (vaCategory) {
      card.image_category = vaCategory;
      card._auto_assigned_category = true;
      assigned++;
      fromVisualAsset++;
      continue;
    }

    // 2순위: 카드 타입 기반 기본값
    const defaultCat = TYPE_DEFAULT_CATEGORY[card.type];
    if (defaultCat) {
      card.image_category = defaultCat;
      card._auto_assigned_category = true;
      assigned++;
    }
  }

  if (assigned > 0) {
    console.log(`  📸 image_category 자동 할당: ${assigned}장 (visual_asset 기반 ${fromVisualAsset}장)`);
  }
}

/**
 * 파일명으로 Drive 전체 카테고리 폴더에서 이미지 검색
 * @param {string} fileName - 검색할 파일명 (부분 매칭)
 * @param {string} academyKey - 학원 키
 * @returns {{ url: string, category: string } | null}
 */
export async function findImageByName(fileName, academyKey) {
  const folders = await loadDriveFolders();
  const academyFolders = folders[academyKey];
  if (!academyFolders?.categories) return null;

  const searchName = fileName.toLowerCase().replace(/\.(png|jpg|jpeg|webp)$/i, '');

  for (const [category, folderId] of Object.entries(academyFolders.categories)) {
    if (category === '레퍼런스') continue;

    const images = await listImagesInFolder(folderId);
    for (const file of images) {
      const name = (file.name || '').toLowerCase().replace(/\.(png|jpg|jpeg|webp)$/i, '');
      if (name === searchName || name.includes(searchName) || searchName.includes(name)) {
        const url = `https://drive.google.com/uc?export=view&id=${file.id}`;
        await recordUsedImage(academyKey, file.id, category);
        return { url, category };
      }
    }
  }

  return null;
}

/**
 * 전체 카드 이미지 매칭
 * @param {Object[]} cards - 카드 배열
 * @param {string} academyKey - 학원 키
 * @param {Map<number, string>} [assignments] - 수동 지정 (카드번호 → 파일명)
 */
export async function pickAllImages(cards, academyKey, assignments = new Map()) {
  console.log('  📸 이미지 매칭 시작...');
  if (assignments.size > 0) {
    console.log(`  📌 수동 지정: ${[...assignments.entries()].map(([k, v]) => `카드${k}→${v}`).join(', ')}`);
  }

  // image_category가 비어있는 카드에 타입 기반 기본값 자동 할당
  autoAssignCategory(cards, academyKey);

  let matchCount = 0;
  let skipCount = 0;
  let manualCount = 0;

  for (const card of cards) {
    // 수동 지정된 카드 처리
    if (assignments.has(card.number)) {
      const fileName = assignments.get(card.number);
      const result = await findImageByName(fileName, academyKey);
      if (result) {
        if (CUTOUT_CATEGORIES.has(result.category)) {
          card.image_url = result.url;
        } else {
          card.bg_image_url = result.url;
        }
        manualCount++;
        console.log(`  📌 카드 ${String(card.number).padStart(2, '0')}: "${fileName}" → ${result.category} (수동 지정)`);
        continue;
      } else {
        console.log(`  ⚠️ 카드 ${String(card.number).padStart(2, '0')}: "${fileName}" 찾을 수 없음 → 자동 매칭으로 전환`);
      }
    }

    // 자동 매칭
    if (!card.image_category) {
      skipCount++;
      continue;
    }

    const url = await pickImage(card, academyKey);
    if (url) {
      if (CUTOUT_CATEGORIES.has(card.image_category)) {
        card.image_url = url;
      } else {
        card.bg_image_url = url;
      }
      matchCount++;
      console.log(`  ✅ 카드 ${String(card.number).padStart(2, '0')}: ${card.image_category} → 매칭 완료 (${CUTOUT_CATEGORIES.has(card.image_category) ? '누끼용' : '배경용'})`);
    } else {
      // 자동 할당된 카테고리인데 매칭 실패 → 원복 (Imagen에서 불필요한 생성 방지)
      if (card._auto_assigned_category) {
        card.image_category = null;
        delete card._auto_assigned_category;
      }
      skipCount++;
      console.log(`  ⏭ 카드 ${String(card.number).padStart(2, '0')}: ${card.image_category || '자동할당 실패'} → 이미지 없음 (스킵)`);
    }
  }

  console.log(`  📸 이미지 매칭 완료: ${manualCount}장 수동, ${matchCount}장 자동, ${skipCount}장 스킵`);
  return cards;
}
