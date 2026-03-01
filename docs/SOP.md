# 카드뉴스 자동화 — 운영 표준 절차서 (SOP)

_v1.0 | 2026-02-27_

---

## 1. 일상 운영

### 1-1. 폴러 시작

```bash
node poller.js
```

- 30초마다 노션 DB를 폴링
- 감지: 기획 착수 / 제작 요청 / 디자인 수정
- 로그: `logs/YYYY-MM-DD.log`

### 1-2. 단건 CLI 실행

```bash
node index.js "주제" --academy ollinone
```

- 노션 연동 없이 단독 실행
- 출력: `output/학원명-주제-날짜/`

---

## 2. 새 콘텐츠 등록

### Step 1: 노션 DB에 페이지 추가
1. 콘텐츠 리스트 DB에 새 페이지 생성
2. 제목: `[올인원] 중3에 시작해야 하는 이유` (접두어 필수)
3. 메인 키워드 입력 (선택)

### Step 2: 참고자료 전달
- 페이지 댓글에 통계, 원장님 메모, 참고 링크 등 작성
- Claude가 기획 시 자동으로 참조

### Step 3: 기획 시작
1. 상태를 **기획 착수**로 변경
2. 30초 내 Claude가 자동으로 10장 기획안 생성
3. 상태가 **기획 컨펌**으로 자동 변경

### Step 4: 기획안 검토
1. 노션에서 기획안 확인 (🤖 Claude 기획안 섹션)
2. 수정 필요 시: 댓글에 `@수정 [수정 내용]` 작성 → 상태를 **디자인 수정**으로 변경
3. 승인 시: 상태를 **제작 요청**으로 변경

### Step 5: 디자인 생성
1. **제작 요청** 감지 → 자동 파이프라인 실행
2. 소요 시간: 약 5~10분
3. 완료 시 **디자인 1차**로 자동 변경 + PNG 첨부

### Step 6: 디자인 수정 (필요 시)
1. 댓글에 `@수정 1번 카드 헤드라인을 더 자극적으로` 작성
2. 상태를 **디자인 수정**으로 변경
3. 자동 재기획 + 재디자인 → **디자인 수정 완료**

---

## 3. 새 학원 온보딩

### Step 1: academies.json 등록
```json
{
  "newacademy": {
    "name": "새 학원",
    "notion_prefix": "새학원",
    "theme": {
      "primary": "#...",
      "secondary": "#...",
      "background": "#...",
      "text": "#...",
      "highlight": "#...",
      "accent": "#..."
    },
    "mood": ["키워드1", "키워드2", "키워드3"],
    "grade": ["대상1", "대상2"],
    "region": "지역명",
    "subject": "과목"
  }
}
```

### Step 2: 브랜드 전략서 작성 (권장)
- `config/brand/newacademy-strategy.md` 생성
- ollinone-strategy.md 참고하여 작성

### Step 3: 디자인 토큰 생성 (권장)
- `config/tokens/newacademy-tokens.json` 생성
- ollinone-tokens.json 참고하여 컬러/타이포 커스터마이즈

### Step 4: Drive 폴더 생성
```bash
node scripts/setup-drive-folders.js newacademy
```

### Step 5: 테스트 실행
```bash
node index.js "테스트 주제" --academy newacademy
```

---

## 4. 주간 유지보수

| 작업 | 주기 | 방법 |
|------|------|------|
| 로그 확인 | 매일 | `logs/` 폴더 확인, 에러 패턴 파악 |
| 출력물 정리 | 주 1회 | `output/` 폴더에서 30일 이전 삭제 |
| temp 정리 | 주 1회 | `temp/` 폴더 비우기 |
| Drive 용량 확인 | 월 1회 | 학원별 폴더 용량 확인 |
| API 사용량 | 월 1회 | Anthropic/Google AI Studio 대시보드 확인 |

---

## 5. 환경 변수 체크리스트

```bash
# 필수
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AIza...
NOTION_API_KEY=ntn_...
NOTION_DATABASE_ID=...
NOTION_DATASOURCE_ID=...

# 선택
DEFAULT_ACADEMY=jinhak
MAX_HOOK_RETRY=3
MAX_DESIGN_RETRY=2
HOOK_PASS_SCORE=7
POLLER_INTERVAL=30000
GOOGLE_SERVICE_ACCOUNT_PATH=./config/google-service-account.json
GOOGLE_SHEET_ID=...
GOOGLE_SHEET_NAME=이미지_메타데이터
FIGMA_FILE_KEY=...
```
