# 카드뉴스 자동화 시스템 — CLAUDE.md v3.0
> Claude Code가 세션 시작 시 자동으로 읽는 파일입니다.

---

## 프로젝트 한 줄 요약
원장님 회의 메모(큰기획) → 노션 등록 → Claude 작은기획 자동생성 → 기획자 노션 컨펌 → Gemini 디자인 → PNG 10장 자동 완성

---

## AI 역할 분담 (절대 원칙)

| AI | 담당 |
|----|------|
| Claude (Anthropic) | 리서치, 작은기획, 후킹평가, 구조검토, HTML품질검토 |
| Gemini (Google AI Studio) | HTML/CSS 디자인 생성, 배경이미지(Imagen) |
| Puppeteer | HTML → 1080×1350 PNG |
| Notion API | 상태관리, 기획안작성, PNG첨부, 컨펌감지 |
| Google Drive | 학원 실사진 저장소 |

---

## 전체 파이프라인

```
[노션] 기획착수 상태 카드
  ↓ poller.js 30초마다 감지
STAGE 0  config-loader.js     → 학원 브랜드 설정 로드
STAGE 1  researcher.js        → [Claude] 웹리서치 + 카드 10장 작은기획
                                → 노션에 기획안 작성 → 상태: 기획컨펌대기
  ↓ [기획자가 노션에서 승인 체크박스 체크]
STAGE 2  hook-critic.js       → [Claude] 1번 카드 7점 채점, 미달 시 재작성
STAGE 2.5 image-picker.js     → [Drive] 실사진 매칭
STAGE 3  structure-reviewer.js → [Claude] 10장 흐름 검토
STAGE 4  gemini-imager.js     → [Gemini] 배경이미지 생성
STAGE 5  gemini-designer.js   → [Gemini] HTML/CSS 디자인 생성
STAGE 5.5 design-validator.js → [Claude] HTML 품질 검토
STAGE 6  renderer.js          → [Puppeteer] PNG 10장
                                → 노션에 PNG 첨부 → 상태: 디자인완료
```

---

## 디렉토리 구조

```
card-news-automation/
├── index.js
├── poller.js                      ← 노션 폴링 데몬
├── package.json / .env / CLAUDE.md
├── config/
│   ├── academies.json             ← 학원별 브랜드 설정
│   ├── gemini.js
│   └── google-service-account.json
├── agents/
│   ├── config-loader.js
│   ├── notion-connector.js        ← 노션 API
│   ├── researcher.js
│   ├── hook-critic.js
│   ├── image-picker.js
│   ├── structure-reviewer.js
│   ├── gemini-imager.js
│   ├── gemini-designer.js
│   ├── design-validator.js
│   └── renderer.js
├── prompts/
│   ├── researcher-system.txt
│   ├── hook-expert-system.txt
│   ├── structure-agent.txt
│   ├── design-validator-system.txt
│   └── gemini-designer-system.txt ← 팀원이 디자인 튜닝하는 파일
└── output/ / logs/
```

---

## 학원 설정 (academies.json — 확정값)

```json
{
  "ollinone": {
    "name": "올인원 수학학원", "notion_prefix": "올인원",
    "theme": { "primary": "#202487", "secondary": "#fff3c8", "background": "#F8F8FF",
               "text": "#1A1A2E", "highlight": "#fff3c8", "accent": "#202487" },
    "mood": ["스마트한", "심플한", "진중한"],
    "grade": ["중학생", "고등학생"], "region": "분당 수내", "subject": "수학",
    "target_middle": ["백현중","정자중","내정중","수내중","샛별중","양영중","서현중","판교중"],
    "target_high": ["수내고","서현고","분당중앙고","늘푸른고","한솔고","분당고","영덕여고","대진고","운중고","야탑고"]
  },
  "jinhak": {
    "name": "진학학원", "notion_prefix": "진학",
    "theme": { "primary": "#081459", "secondary": "#ff871e", "background": "#F5F6FA",
               "text": "#1A1A2E", "highlight": "#FFE0C0", "accent": "#ff871e" },
    "mood": ["맞춤", "대담한", "유능한"],
    "grade": ["초등", "중등"], "region": "관악구, 금천구", "subject": "수학",
    "target_elementary": ["시흥초","백산초","금나래초","금천초","동광초","탑동초","문백초","안천초"],
    "target_middle": ["시흥중","문일중","동일중","한울중","가산중","난우중"]
  },
  "toktok": {
    "name": "톡톡 잉글리쉬", "notion_prefix": "톡톡",
    "theme": { "primary": "#FF6B2B", "secondary": "#FFFFFF", "background": "#FFF8F5",
               "text": "#1A1A1A", "highlight": "#FFD4B8", "accent": "#E55A1B" },
    "mood": ["깔끔한", "스마트한", "똑부러지는"],
    "grade": ["초등"], "subject": "영어",
    "speciality": ["국제학교", "특목고", "화상영어", "미국교과서"]
  }
}
```

---

## 노션 DB 속성

| 속성 | 타입 | 역할 |
|------|------|------|
| 제목 | 제목 | `[학원명 월-번호] 내용` |
| 상태 | 선택 | 기획착수→기획컨펌대기→원고작업→디자인완료→게시완료 |
| 승인 | 체크박스 | 체크 시 디자인 자동 시작 |
| 수정요청 | 텍스트 | 내용 작성 시 Claude 재기획 트리거 |
| PNG첨부 | 파일 | 완료 후 자동 첨부 |

## notion-connector.js 함수 목록

```javascript
getByStatus(status)           // 상태별 페이지 조회
getConfirmed()                // 승인=true 페이지 조회
getRevisions()                // 수정요청 텍스트 있는 페이지 조회
writePlan(pageId, cards)      // 기획안 + 체크박스 노션에 작성
setStatus(pageId, status)     // 상태 업데이트
attachPNGs(pageId, paths)     // PNG 파일 첨부
clearRevision(pageId)         // 수정요청 텍스트 초기화
uncheck(pageId)               // 승인 체크박스 해제
extractAcademyKey(title)      // "[진학 2-4]..." → "jinhak"
```

## poller.js 핵심 로직

```javascript
setInterval(async () => {
  // ① 기획착수 → 작은기획 생성
  const toplan = await notion.getByStatus("기획착수");
  for (const page of toplan) {
    const academyKey = notion.extractAcademyKey(page.title);
    const academyConfig = configLoader.load(academyKey);
    const cards = await researcher.run(page.content, academyConfig);
    await notion.writePlan(page.id, cards);
    await notion.setStatus(page.id, "기획컨펌대기");
  }

  // ② 승인 감지 → 디자인 파이프라인
  const confirmed = await notion.getConfirmed();
  for (const page of confirmed) {
    await notion.setStatus(page.id, "원고작업");
    const pngs = await runDesignPipeline(page);
    await notion.attachPNGs(page.id, pngs);
    await notion.setStatus(page.id, "디자인완료");
  }

  // ③ 수정요청 감지 → 재기획
  const revisions = await notion.getRevisions();
  for (const page of revisions) {
    const cards = await researcher.revise(page.content, page.revisionText);
    await notion.writePlan(page.id, cards);
    await notion.clearRevision(page.id);
    await notion.uncheck(page.id);
  }
}, 30000);
```

---

## 카드 JSON 구조

```json
{
  "topic": "중3에 시작해야 하는 이유",
  "research_summary": "수집된 팩트/수치 요약",
  "cards": [
    {
      "number": 1, "type": "hook", "layout_hint": "big-quote",
      "headline": "중3 3월, <em>이미 늦었습니다</em>",
      "subtext": "지금 시작하지 않으면 고등이 무너집니다",
      "emphasis_style": "highlight",
      "icon": "alert-circle", "image_category": null,
      "image_url": null, "bg_image_url": null,
      "generated_html": null, "layout_used": null
    },
    {
      "number": 4, "type": "data", "layout_hint": "stat-highlight",
      "headline": "중3 2학기부터 시작한 학생의 결과",
      "stat": "73%", "stat_label": "가 고1 첫 시험에서 성적 급락",
      "emphasis_style": "color", "icon": "bar-chart-2",
      "image_category": "수업사진",
      "image_url": null, "bg_image_url": null,
      "generated_html": null, "layout_used": null
    }
  ]
}
```

---

## 후킹 점수 루브릭 (7점 만점)

| 항목 | 배점 | 기준 |
|------|------|------|
| 궁금증 유발 | 2점 | 스크롤 멈추게 |
| 타겟 공감 | 2점 | "내 얘기다" |
| 구체성 | 1점 | 숫자/데이터 |
| 언어 감각 | 1점 | 리듬감, 간결함 |
| 클릭 충동 | 1점 | 다음 장 궁금 |

7점 이상 → PASS / 미만 → 재작성 최대 3회 / 초과 → 최고점 강제 사용 + 로그

---

## Gemini 디자인 절대 규칙

```
1. 한국어 입력 → 한국어 그대로 출력 (번역 절대 금지)
2. Noto Sans KR Google Fonts 반드시 로드
3. word-break: keep-all 모든 텍스트에 적용
4. overflow: hidden 금지 / 텍스트 절대 잘리면 안 됨
5. CSS 변수만 사용 (#hex 직접 출력 금지)
6. usedLayouts 배열 확인 → 중복 레이아웃 사용 금지
7. 헤드라인 16자 초과 시 자동 줄바꿈

컬러 규칙:
- 강조 텍스트 → var(--color-primary)만
- 배경 포인트 → var(--color-secondary)만
- 숫자/stat   → var(--color-accent)만
- secondary + accent 동시 사용 금지
```

---

## .env 구조

```
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AIza...
GOOGLE_SERVICE_ACCOUNT_PATH=./config/google-service-account.json
GOOGLE_SHEET_NAME=이미지_메타데이터
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=...
DEFAULT_ACADEMY=jinhak
MAX_HOOK_RETRY=3
MAX_DESIGN_RETRY=2
HOOK_PASS_SCORE=7
POLLER_INTERVAL=30000
```

---

## 개발 현황

- [x] Phase 1: 기본 파이프라인
- [x] Phase 2: 컬러 시스템
- [x] Phase 3: Gemini 이미지 생성
- [x] Phase 4: Gemini HTML 디자인 프롬프트 튜닝
- [x] Phase 5: 품질 에이전트
- [x] Phase 6: 노션 연동
- [x] Phase 7: 구글 드라이브 연동
- [ ] Phase 8: 통합 테스트

_v3.0 | 2025-02-21_
