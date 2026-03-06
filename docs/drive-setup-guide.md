# Google Drive 이미지 분류 시스템 — 직원 설정 가이드

## 1. 개요

학원 사진을 Google Drive에서 자동 분류하는 시스템입니다.
Gemini Vision AI가 각 사진을 분석해서 카테고리별 폴더로 정리합니다.

```
[marketingdiet.sp Drive 사진] → Gemini 분류 → [카드뉴스_이미지 폴더]
                                                ├── 올인원/수업사진/
                                                ├── 올인원/학생사진/
                                                ├── 올인원/학원외관/
                                                ├── 올인원/상담사진/
                                                ├── 진학/...
                                                └── 톡톡/...
```

---

## 2. 사전 준비

### 2-1. 필수 환경변수 (.env)

```bash
# Google AI (Gemini Vision 분류에 사용)
GOOGLE_AI_API_KEY=AIza...

# Google 서비스 계정 (Drive API 접근)
GOOGLE_SERVICE_ACCOUNT_PATH=./config/google-service-account.json
```

### 2-2. 서비스 계정 이메일

```
cardnews@gen-lang-client-0098960386.iam.gserviceaccount.com
```

이 이메일로 사진 폴더를 **공유(뷰어 권한)**해야 스크립트가 접근할 수 있습니다.

### 2-3. Node.js 패키지

```bash
npm install googleapis @google/genai dotenv
```

---

## 3. Drive 폴더 공유 방법

1. `drive.google.com` 접속 (marketingdiet.sp 계정)
2. 학원 사진이 있는 폴더 우클릭 → **공유**
3. 위 서비스 계정 이메일 입력 → **뷰어** 권한
4. 공유 완료

> 학원별 루트 폴더만 공유하면 하위 폴더는 자동 포함됩니다.

---

## 4. 소스 폴더 설정

`scripts/classify-drive-images.js` 내 `SOURCE_FOLDERS` 객체에 소스 폴더 ID를 설정합니다.

```javascript
const SOURCE_FOLDERS = {
  ollinone: {
    name: '올인원',
    rootId: '1LNn5nGySif-75xHaovINNQ8pNhXatJyr',  // Drive 폴더 ID
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
```

**Drive 폴더 ID 찾는 법:**
- Drive에서 폴더 열기
- URL에서 `folders/` 뒤의 문자열이 ID
- 예: `drive.google.com/drive/folders/1LNn5nGySif-75xHaovINNQ8pNhXatJyr`

---

## 5. 대상 폴더 설정

분류된 사진이 복사될 폴더는 `config/drive-folders.json`에 정의되어 있습니다.

```json
{
  "ollinone": {
    "root": "폴더ID",
    "categories": {
      "수업사진": "폴더ID",
      "학생사진": "폴더ID",
      "학원외관": "폴더ID",
      "상담사진": "폴더ID",
      "레퍼런스": "폴더ID"
    }
  }
}
```

새 학원을 추가하려면:
1. `config/academies.json`에 학원 정보 추가
2. `node scripts/setup-drive-folders.js 학원키` 실행 → 폴더 자동 생성
3. 3개 이메일에 공유: `node scripts/share-drive-folders.js`

---

## 6. 스크립트 사용법

### 6-1. 공유된 폴더 스캔 (확인용)

```bash
node scripts/scan-shared-folders.js
```

서비스 계정이 접근 가능한 모든 폴더와 이미지 수를 보여줍니다.

### 6-2. 자동 분류 (dry-run)

```bash
# 전체 학원
node scripts/classify-drive-images.js

# 특정 학원만
node scripts/classify-drive-images.js --academy ollinone
```

dry-run은 분류만 하고 복사하지 않습니다. 결과는 `temp/classify/학원키-classify.json`에 저장됩니다.

### 6-3. 결과 확인

JSON 파일을 열어서 분류 결과를 검토합니다:

```json
{
  "id": "파일ID",
  "name": "DSC02759.JPG",
  "path": "2관교실/DSC02759.JPG",
  "category": "수업사진",        // AI가 판단한 카테고리
  "reason": "교실 내부 사진",    // 분류 이유
  "confidence": 0.9,             // 신뢰도 (0.6 미만은 복사 스킵)
  "tags": ["교실", "칠판"]       // 메타 태그
}
```

### 6-4. 실제 복사 실행

```bash
node scripts/classify-drive-images.js --execute
node scripts/classify-drive-images.js --execute --academy jinhak
```

- confidence 0.6 이상만 복사됩니다
- "스킵" 카테고리는 복사하지 않습니다
- 원본 파일은 삭제되지 않습니다 (복사만)

---

## 7. 분류 카테고리 기준

| 카테고리 | 분류 기준 | 카드뉴스 용도 |
|---------|----------|-------------|
| 수업사진 | 수업 장면, 강의, 공부하는 학생, 판서, 교재 풀이 | 교육 분위기 전달 |
| 학생사진 | 학생 개인/단체, 프로필, 우수자, 시상식 | 후기/성과 카드 |
| 학원외관 | 건물, 간판, 로비, 복도, 빈 교실 인테리어 | 학원 소개/CTA 카드 |
| 상담사진 | 상담 장면, 학부모 미팅, 1:1 대화 | 상담 유도 카드 |
| 스킵 | 스크린샷, 문서, 시험지, 카톡, 텍스트 위주, 흐림 | 사용 안 함 |

---

## 8. 새 사진 추가 시

1. Drive에 사진 업로드 (기존 공유 폴더 안이면 자동 감지)
2. `classify-drive-images.js` 다시 실행
3. 이미 분류된 파일은 중복 복사되지 않음 (TODO: 구현 예정)

---

## 9. 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| "썸네일 없음" | Drive가 아직 처리 중 | 잠시 후 재시도 |
| "다운로드 실패" | 공유 안 됨 | 서비스 계정에 폴더 공유 확인 |
| Rate limit 대기 | Gemini 무료 15 RPM | 자동 대기, 정상 동작 |
| 분류 정확도 낮음 | 사진 품질/해상도 문제 | confidence 0.6 미만은 자동 스킵 |

---

## 10. 관련 파일

```
scripts/
  classify-drive-images.js  ← 메인 분류 스크립트
  scan-shared-folders.js    ← 폴더 스캔 확인
  setup-drive-folders.js    ← 대상 폴더 생성
  share-drive-folders.js    ← 폴더 공유 설정
config/
  drive-folders.json        ← 대상 폴더 ID 매핑
  google-service-account.json ← 서비스 계정 키
agents/
  image-picker.js           ← 카드뉴스 생성 시 이미지 매칭
```
