# Claude Code 단계별 명령어
> 각 Phase 시작할 때 아래 명령어를 Claude Code에 그대로 붙여넣으세요.
> 반드시 순서대로 진행하세요.

---

## Phase 4 — Gemini HTML 디자인 프롬프트 튜닝 (진행중)

```
prompts/gemini-designer-system.txt를 전면 개선해줘.

현재 문제:
- 카드마다 레이아웃이 비슷함
- 컬러가 카드마다 다르게 나옴
- 줄바꿈이 어색한 카드 있음

시스템 프롬프트에 반드시 포함할 절대 규칙:
1. 한국어 입력 → 한국어 그대로 출력 (번역 절대 금지)
2. Noto Sans KR Google Fonts 반드시 로드
   <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
3. word-break: keep-all 모든 텍스트에 적용
4. overflow: hidden 금지 / 텍스트 절대 잘리면 안 됨
5. CSS 변수만 사용 (#hex 직접 출력 절대 금지)
6. usedLayouts 배열 확인 → 중복 레이아웃 사용 금지
7. 헤드라인 16자 초과 시 자동 줄바꿈

컬러 규칙:
- 강조 텍스트 → var(--color-primary)만
- 배경 포인트 → var(--color-secondary)만
- 숫자/stat   → var(--color-accent)만
- secondary + accent 동시 사용 금지
- 10장 전체 컬러 패턴 일관 유지

카드 타입별 레이아웃 강제 지정:
- hook      → 텍스트 하단 1/3, 상단 이미지 풀블리드
- empathy   → 좌측 컬러 사이드바 + 우측 텍스트
- data      → 중앙 숫자 초대형(120px) + 하단 설명
- info      → 번호형 스텝 카드
- cta       → var(--color-primary) 풀배경 + 흰 텍스트 + 버튼

개선 후 테스트:
node index.js "초등 영어 학원 선택 기준" --academy jinhak
PNG 10장 확인 후 레이아웃 다양성, 컬러 일관성 체크
```

---

## Phase 5 — 품질 에이전트

```
CLAUDE.md를 읽고 아래 3개 파일을 구현해줘.

① agents/hook-critic.js
- 입력: cards[0] (1번 카드), academyConfig
- CLAUDE.md의 후킹 점수 루브릭으로 7점 만점 채점
- 7점 미만 → 피드백 포함 재작성 요청 (Claude API)
- 최대 3회 반복 / 초과 시 최고점 버전 강제 사용 + logs/ 기록
- 출력: 최종 승인된 1번 카드

② agents/structure-reviewer.js
- 입력: cards[] 전체
- 에이전트 2개가 검토:
  구조 에이전트: 1→10장 흐름 (후킹→공감→정보→CTA)
  독자유지율 에이전트: 각 카드 전환 시 다음 장 보고 싶은 요소
- 문제 카드 번호 지정 + 해당 카드만 재작성
- 출력: 전체 승인된 cards[]

③ agents/design-validator.js
- 입력: generated_html (문자열), card
- Claude API로 HTML 코드 리뷰:
  체크1: 텍스트가 1080×1350 영역 밖으로 나가는 곳 있는지
  체크2: 한글 폰트 로드 태그 있는지
  체크3: CSS 변수 사용했는지 (#hex 직접 사용 없는지)
- 문제 발견 시 → 수정 지시 문자열 반환
- 출력: { pass: boolean, feedback: string }
```

---

## Phase 6 — 노션 연동 (핵심)

```
CLAUDE.md의 노션 구조 섹션을 읽고 아래 2개 파일을 구현해줘.

① agents/notion-connector.js
@notionhq/client SDK 사용
.env에서 NOTION_API_KEY, NOTION_DATABASE_ID 읽기

구현할 함수 (CLAUDE.md 함수 목록 참고):
- getByStatus(status): 해당 상태 페이지 목록 조회
- getConfirmed(): 승인 체크박스=true AND 상태=기획컨펌대기
- getRevisions(): 수정요청 속성에 텍스트 있는 페이지
- writePlan(pageId, cards): 
    페이지에 아래 블록 자동 작성:
    ## 🤖 Claude 기획안
    카드별 번호, 헤드라인, 서브텍스트, 본문 내용
    ## ✅ 승인
    체크박스 (unchecked)
    ## ✏️ 수정 요청
    빈 텍스트 블록
- setStatus(pageId, status): 상태 속성 업데이트
- attachPNGs(pageId, filePaths): PNG 파일들을 페이지에 첨부
- clearRevision(pageId): 수정요청 텍스트 초기화
- uncheck(pageId): 승인 체크박스 해제
- extractAcademyKey(title): "[진학 2-4]..." → "jinhak" 반환
    academies.json의 notion_prefix로 매칭

② poller.js
CLAUDE.md의 poller.js 핵심 로직 섹션을 그대로 구현
setInterval 30000ms
에러 발생 시 해당 페이지 스킵 + 로그 기록 (전체 중단 금지)
시작 시 콘솔: "🔄 폴러 시작 — 30초마다 노션 체크"
감지 시 콘솔: "📋 기획착수 감지: [진학 2-4] 중3에 시작해야..."
```

---

## Phase 7 — 구글 드라이브 실사진 연동

```
CLAUDE.md를 읽고 agents/image-picker.js를 구현해줘.

googleapis SDK 사용
google-service-account.json으로 인증

동작:
1. academyConfig.drive_folder_id로 드라이브 폴더 접근
2. GOOGLE_SHEET_NAME 시트에서 이미지 메타데이터 읽기
   컬럼: 파일명 | 카테고리 | 태그 | 드라이브ID
3. card.image_category와 카테고리 매칭
4. card 내용에서 키워드 추출 → 태그 점수 계산
5. 최고점 이미지 선택 (동점이면 랜덤)
6. 드라이브 공유 URL 반환

image_category가 null → null 반환 (스킵)
드라이브 연결 실패 → null 반환 + 경고 로그 (전체 중단 금지)
```

---

## Phase 8 — 통합 테스트

```
전체 파이프라인 통합 테스트를 진행해줘.

테스트 시나리오 3개:

① 진학학원 테스트
node index.js "중3에 시작해야 하는 이유" --academy jinhak
체크: 컬러 #081459/#ff871e 적용됐는지

② 올인원 테스트  
node index.js "분당 수학 최상위권 만드는 법" --academy ollinone
체크: 컬러 #202487/#fff3c8 적용됐는지

③ 톡톡 테스트
node index.js "초등 영어 왜 지금 시작해야 하는가" --academy toktok
체크: 컬러 #FF6B2B 적용됐는지

각 테스트 후 확인 항목:
- PNG 10장 생성됐는지
- 한글 텍스트 깨짐 없는지
- 레이아웃 10장이 다른지
- 컬러가 학원별로 다른지
- 텍스트 잘림 없는지

문제 발견 시 원인 분석 + 수정 후 재테스트
```

---

## 디자인 재튜닝 (언제든 실행 가능)

```
gemini-designer-system.txt 프롬프트를 튜닝해줘.

현재 문제: [문제 설명]

참고할 레퍼런스 스타일:
- 텍스트 중심, 이미지는 배경으로만
- 카드별로 확연히 다른 레이아웃
- 학원 느낌: [스마트한/대담한/똑부러지는]

튜닝 후 테스트:
node index.js "테스트 주제" --academy [학원키]
결과 PNG 보고 피드백 반영
```

---

## 노션 폴러 실행 명령어

```bash
# 폴러 시작 (백그라운드)
node poller.js

# 수동 단건 실행 (테스트용)
node index.js "주제" --academy jinhak

# 특정 노션 페이지 수동 처리
node index.js --notion-page [페이지ID]
```

---

## 주의사항

- NOTION_API_KEY는 재발급 필요 (채팅에 노출됨)
- google-service-account.json은 절대 Git에 올리지 말 것 (.gitignore 확인)
- 학원 A의 이미지가 학원 B 카드에 들어가지 않도록 항상 academyKey 격리 확인
- Gemini 디자인 실패 시 기본 템플릿 폴백 — 절대 전체 파이프라인 중단 금지
