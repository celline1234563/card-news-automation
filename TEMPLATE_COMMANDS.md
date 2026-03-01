# 카드뉴스 HTML 템플릿 시스템 — Claude Code 명령어
> 이 파일을 Claude Code에 그대로 붙여넣으면 됩니다.
> Gemini 자유생성 → 우리가 만든 HTML 템플릿 + Gemini 텍스트 주입 방식으로 전환

---

## 배경 설명 (Claude Code에 먼저 읽혀줄 것)

기존 방식의 문제: Gemini에게 "알아서 HTML 만들어줘" → 매번 품질 복불복
새 방식: 우리가 HTML 템플릿 파일 제작 → Gemini는 카드 내용에 맞는 템플릿 선택 + 플레이스홀더에 텍스트/컬러만 주입 → 품질 항상 일정

---

## STEP 1 — 폴더 구조 및 공통 시스템 생성

```
templates/ 폴더를 만들고 아래 파일들을 생성해줘.

1. templates/_variables.css
   카드뉴스 공통 CSS 변수 파일.
   아래 변수들 정의:
   :root {
     --color-primary
     --color-secondary
     --color-background
     --color-text
     --color-highlight
     --color-accent
     --color-white: #FFFFFF
     --color-black: #111111
     --canvas-width: 1080px
     --canvas-height: 1350px
     --font-main: 'Noto Sans KR', sans-serif
     --border-radius: 16px
     --padding-card: 80px
   }

2. templates/_base.html
   모든 템플릿의 기본 HTML 구조 주석 파일.
   실제 HTML이 아니라 각 템플릿이 공통으로 포함해야 할 항목 명세:
   - Noto Sans KR Google Fonts 로드
   - _variables.css 인라인 포함
   - body: width 1080px, height 1350px, overflow visible, word-break keep-all
   - 한국어 텍스트 줄바꿈 규칙
   - CSS 변수 주입 방식 (JS로 var(--xxx) 대체)

3. templates/inject.js
   플레이스홀더 교체 유틸:
   - {{headline}}, {{subtext}}, {{body}}, {{stat}}, {{stat_label}}
   - {{item_1}}~{{item_6}}, {{cta_text}}, {{cta_sub}}
   - {{image_url}}, {{bg_image_url}}
   - CSS 변수: --color-primary, --color-secondary 등을 academyConfig로 교체
   함수: injectCard(htmlTemplate, cardData, academyConfig) → 완성된 HTML 반환
```

---

## STEP 2 — 우선순위 템플릿 10종 제작

```
templates/ 폴더에 아래 HTML 파일들을 순서대로 만들어줘.
각 파일은 독립 실행 가능한 완전한 HTML이어야 하고,
텍스트는 반드시 플레이스홀더({{headline}} 등)로 처리해야 함.

공통 절대 규칙 (모든 템플릿에 적용):
- 캔버스: width 1080px, height 1350px 고정
- Noto Sans KR Google Fonts 필수 로드
- word-break: keep-all (한국어 단어 중간 잘림 방지)
- line-height: 1.45 이상
- overflow: visible (텍스트 잘림 절대 금지)
- 모든 컬러는 var(--color-xxx) CSS 변수만 사용
- 헤드라인 폰트 크기: 최대 72px, 최소 36px
- 여백: 상하좌우 최소 60px
- 실제 렌더링 후 텍스트가 영역 밖으로 나가면 font-size 자동 축소

─────────────────────────────────────────────────────

[T01] cover-bold.html — 후킹 표지 (강렬형)
용도: 카드 1번 후킹, 성과 발표, 강한 임팩트
원본 참고: [표지] 타이트강조형(화려) 스타일
디자인 명세:
  - 배경: var(--color-primary) 풀 컬러
  - 중앙 상단 1/3: 장식용 도형 or 빈 이미지 영역 ({{bg_image_url}} 있으면 표시)
  - 중앙: 헤드라인 {{headline}} — 흰색, 굵은 고딕, 최대 72px, 2줄 이내
  - 헤드라인 안에 <em> 태그 있으면 var(--color-highlight) 배경으로 강조
  - 하단: {{subtext}} — 흰색, 24px
  - 우측 하단: 학원명 {{academy_name}} 작게 표시
  - 포인트: 타이틀 주변에 var(--color-secondary) 컬러 기하 도형 장식
플레이스홀더: {{headline}}, {{subtext}}, {{bg_image_url}}, {{academy_name}}

─────────────────────────────────────────────────────

[T02] cover-basic.html — 기본 표지 (정제형)
용도: 카드 1번 (차분한 스타일), 설명형 표지
원본 참고: [표지] 타이틀강조형(기본) 스타일
디자인 명세:
  - 배경: var(--color-background) 연한 배경
  - 좌상단: 학원 브랜드 바 (var(--color-primary), 8px 높이)
  - 상단 30%: 카테고리 태그 {{tag}} (var(--color-primary) 배경, 흰 텍스트, 둥근 모서리)
  - 중앙: {{headline}} — var(--color-text), 굵게, 54px
  - 헤드라인 아래: 구분선 (var(--color-primary), 4px, 80px 길이)
  - 하단: {{subtext}} — 회색, 22px
  - 우측 하단: {{academy_name}}
플레이스홀더: {{headline}}, {{subtext}}, {{tag}}, {{academy_name}}

─────────────────────────────────────────────────────

[T03] cover-photo.html — 사진 배경 표지
용도: 카드 1번 (사진 있을 때), 인물 강조, 다큐형
원본 참고: [표지] 사진배경, [기본] 다큐형 스타일
디자인 명세:
  - {{bg_image_url}} 있으면: 사진 풀블리드 배경 + 검정 오버레이 0.55 투명도
  - {{bg_image_url} 없으면: var(--color-primary) 풀 배경
  - 비네팅 효과: radial-gradient로 가장자리 어둡게
  - 하단 40%: 텍스트 영역 (반투명 검정 레이어)
  - {{headline}}: 흰색, 54px, 굵게, 하단 배치
  - {{subtext}}: 흰색 70%, 22px
  - 포인트: var(--color-accent) 컬러 라인 강조
플레이스홀더: {{headline}}, {{subtext}}, {{bg_image_url}}, {{academy_name}}

─────────────────────────────────────────────────────

[T04] basic-list.html — 체크리스트형
용도: 카드 6~7번 정보, 핵심 포인트 3~5개 나열
원본 참고: [기본] 리스트(체크박스) 스타일
디자인 명세:
  - 배경: var(--color-background)
  - 상단 바: var(--color-primary) 풀 너비 바 + 카드 번호 {{card_number}}
  - 상단: {{headline}} — var(--color-text), 36px, 굵게
  - 중앙 리스트 영역 (3~5개 아이템):
    각 아이템: 체크 아이콘 (✓ var(--color-primary)) + {{item_1}}~{{item_5}}
    아이템 배경: 흰색 카드, border-radius 12px, 좌측 var(--color-primary) 4px 바
    아이템 간격: 20px
  - 하단: {{subtext}} — 회색 캡션
플레이스홀더: {{headline}}, {{subtext}}, {{item_1}}~{{item_5}}, {{card_number}}

─────────────────────────────────────────────────────

[T05] basic-step-number.html — 단계형 숫자
용도: 카드 4~5번 정보, 순서 있는 3~4단계 설명
원본 참고: [기본] 단계형(스텝,숫자) 스타일
디자인 명세:
  - 배경: 흰색
  - 상단: {{headline}} — var(--color-primary), 38px, 굵게
  - 스텝 영역 (3~4개):
    각 스텝: 왼쪽 번호 원형 (var(--color-primary) 배경, 흰 숫자, 56px)
             + 오른쪽 제목 {{step_title_N}} 24px 굵게 + 설명 {{step_desc_N}} 20px 회색
    스텝 사이: 세로 선 (var(--color-primary) 30% 투명도, 2px)
  - 하단: {{subtext}} 캡션
플레이스홀더: {{headline}}, {{subtext}},
  {{step_title_1}}~{{step_title_4}}, {{step_desc_1}}~{{step_desc_4}}

─────────────────────────────────────────────────────

[T06] basic-stat.html — 통계 강조형 (데이터 카드)
용도: 카드 4~5번 데이터, 숫자/통계 강조
원본 참고: [기본] 그래프형 + 단계형(색상) 스타일
디자인 명세:
  - 배경: var(--color-primary) 진한 배경
  - 중앙 주인공: {{stat}} — var(--color-accent) 또는 흰색, 최대 120px, 초대형
  - stat 아래: {{stat_label}} — 흰색, 24px
  - 상단: {{headline}} — 흰색, 32px
  - 하단: {{subtext}} — 흰색 70%, 20px
  - 장식: 반투명 원형 도형들로 배경에 깊이감
플레이스홀더: {{headline}}, {{stat}}, {{stat_label}}, {{subtext}}

─────────────────────────────────────────────────────

[T07] basic-speech.html — 말풍선/후기형
용도: 카드 8~9번 신뢰, 실제 학부모·학생 후기
원본 참고: [기본] 말풍선, [기본] 카카오톡/후기 스타일
디자인 명세:
  - 배경: var(--color-background) 연한 배경
  - 상단: {{headline}} — 작은 제목, 회색
  - 중앙: 말풍선 UI
    큰 말풍선 1개: var(--color-primary) 배경, 흰 텍스트 {{quote_main}}
                   꼬리 방향: 좌하단
    작은 말풍선 1개 (선택): 흰색 배경, var(--color-text) {{quote_sub}}
                            꼬리 방향: 우하단
  - 발신자 표시: {{sender}} — 이니셜 원형 아바타
  - 하단: {{subtext}} 캡션 (출처 or 학교명)
플레이스홀더: {{headline}}, {{quote_main}}, {{quote_sub}}, {{sender}}, {{subtext}}

─────────────────────────────────────────────────────

[T08] basic-compare.html — 비포/애프터 비교형
용도: 카드 7~8번 비교, 전후 변화, 우리 vs 일반
원본 참고: [표지] 비교, [기본] 비포애프터 스타일
디자인 명세:
  - 배경: 흰색
  - 상단: {{headline}} — var(--color-primary), 32px
  - 중앙: 좌우 2분할
    좌측 (BEFORE): 회색/연한 배경, "BEFORE" 레이블, {{before_title}}, {{before_items}} 리스트
    우측 (AFTER): var(--color-primary) 배경, 흰색 텍스트, "AFTER" 레이블, {{after_title}}, {{after_items}} 리스트
    중앙 분리선: VS 또는 화살표 아이콘
  - 하단: {{subtext}}
플레이스홀더: {{headline}}, {{before_title}}, {{before_items}},
  {{after_title}}, {{after_items}}, {{subtext}}

─────────────────────────────────────────────────────

[T09] basic-cta.html — CTA 행동 유도형
용도: 카드 10번 마지막 CTA, 상담 신청 유도
원본 참고: [기본] 버튼형 스타일
디자인 명세:
  - 배경: var(--color-primary) 풀 배경
  - 상단: {{headline}} — 흰색, 38px, 굵게, 중앙 정렬
  - 중앙: {{subtext}} — 흰색 80%, 22px
  - 버튼 영역:
    메인 버튼: var(--color-secondary) 배경, var(--color-text) 굵은 텍스트 {{cta_text}}
              box-shadow 드롭쉐도우, border-radius 50px
              버튼 옆에 손가락 클릭 이모지 👆
  - 하단: {{cta_sub}} — 흰색, 작게 (예: 카카오 오픈채팅 / 전화 상담)
  - 학원 로고 영역: {{academy_name}}, 흰색 텍스트
플레이스홀더: {{headline}}, {{subtext}}, {{cta_text}}, {{cta_sub}}, {{academy_name}}

─────────────────────────────────────────────────────

[T10] basic-info.html — 도형 정보 박스형
용도: 카드 5~7번 핵심 정보, 3~4개 박스 나열
원본 참고: [기본] 요소강조(도형) 스타일
디자인 명세:
  - 배경: var(--color-background)
  - 상단: {{headline}} — var(--color-text), 34px, 굵게
  - 중앙 그리드: 2×2 또는 2×1+1 박스 레이아웃
    각 박스: 흰색 배경, border-radius 16px, 상단 var(--color-primary) 4px 바
             아이콘 (Lucide SVG {{icon_N}}) + {{item_title_N}} + {{item_desc_N}}
  - 하단: {{subtext}} 캡션
플레이스홀더: {{headline}}, {{subtext}},
  {{item_title_1}}~{{item_title_4}}, {{item_desc_1}}~{{item_desc_4}}, {{icon_1}}~{{icon_4}}
```

---

## STEP 3 — 템플릿 선택 로직 (gemini-designer.js 대체)

```
agents/template-selector.js 를 새로 만들어줘.

역할: Gemini가 자유 HTML을 생성하는 대신,
      Claude가 카드 내용 보고 어떤 템플릿을 쓸지 결정 + 플레이스홀더 채움

입력:
  card: {
    number, type, layout_hint,
    headline, subtext, body,
    stat, stat_label,
    items: [],
    quote_main, quote_sub,
    before_items, after_items,
    cta_text, cta_sub,
    image_url, bg_image_url,
    icon
  }
  academyConfig: { name, theme }
  usedTemplates: []  // 이미 사용한 템플릿 목록 (중복 방지)

처리 로직:
  1. card.type + card.layout_hint + usedTemplates로 최적 템플릿 선택
     - type=hook → T01 or T02 or T03 (bg_image_url 있으면 T03 우선)
     - type=empathy → T07(말풍선) or T02
     - type=data → T06(stat 있으면) or T04
     - type=info → T10 or T04 or T05
     - type=compare → T08
     - type=cta → T09
     - usedTemplates에 있으면 다음 옵션으로
  2. templates/ 폴더에서 HTML 파일 읽기
  3. inject.js의 injectCard()로 플레이스홀더 교체
  4. CSS 변수를 academyConfig.theme 값으로 교체
  5. 완성된 HTML 반환

출력: { html: string, templateUsed: string }
```

---

## STEP 4 — 파이프라인 연결 (index.js 수정)

```
index.js의 Stage 5 (gemini-designer.js 호출 부분)를
template-selector.js 호출로 교체해줘.

변경 전:
  const designed = await geminiDesigner.run(card, cssVars, academyConfig, usedLayouts)

변경 후:
  const designed = await templateSelector.select(card, academyConfig, usedTemplates)
  usedTemplates.push(designed.templateUsed)

Gemini는 이미지 생성(Stage 4, gemini-imager.js)에만 계속 사용.
HTML 디자인은 템플릿 시스템으로 완전 전환.
```

---

## STEP 5 — 테스트

```
템플릿 시스템 전체 테스트 해줘.

1. 단일 템플릿 확인:
   node -e "
     const fs = require('fs');
     const inject = require('./templates/inject.js');
     const html = fs.readFileSync('./templates/cover-bold.html', 'utf8');
     const result = inject.injectCard(html, {
       headline: '중3 3월, <em>이미 늦었습니다</em>',
       subtext: '지금 시작하지 않으면 고등이 무너집니다',
       academy_name: '진학학원'
     }, {
       theme: {
         primary: '#081459', secondary: '#ff871e',
         background: '#F5F6FA', text: '#1A1A2E',
         highlight: '#FFE0C0', accent: '#ff871e'
       }
     });
     fs.writeFileSync('./output/test-cover-bold.html', result);
     console.log('Done');
   "

2. Puppeteer로 PNG 변환:
   node -e "
     const puppeteer = require('puppeteer');
     const fs = require('fs');
     (async () => {
       const browser = await puppeteer.launch();
       const page = await browser.newPage();
       await page.setViewport({ width: 1080, height: 1350 });
       const html = fs.readFileSync('./output/test-cover-bold.html', 'utf8');
       await page.setContent(html, { waitUntil: 'networkidle0' });
       await page.screenshot({ path: './output/test-cover-bold.png', fullPage: false });
       await browser.close();
       console.log('PNG 저장 완료');
     })();
   "

3. output/test-cover-bold.png 확인 후 품질 체크:
   □ 한글 깨짐 없음
   □ 컬러 진학학원 #081459 적용됨
   □ 텍스트 잘림 없음
   □ 1080×1350 크기 정확

4. 전체 파이프라인 테스트:
   node index.js "중3에 시작해야 하는 이유" --academy jinhak
   → 10장 PNG 생성 확인
   → 10장이 각각 다른 템플릿인지 확인
```

---

## STEP 6 — 추가 템플릿 (여유 있을 때)

```
아래 템플릿들도 추가 제작해줘.

[T11] basic-arrow.html — 화살표 플로우형
  [기본] 화살표 스타일
  3~4단계를 화살표로 연결, 흐름 강조

[T12] basic-graph.html — 막대그래프형
  [기본] 그래프형 스타일
  CSS로 구현한 막대그래프 (Canvas 없이)
  {{bar_1_value}}~{{bar_4_value}}, {{bar_1_label}}~{{bar_4_label}}

[T13] basic-mindmap.html — 마인드맵형
  [기본] 마인드맵 스타일
  중앙 주제 + 4개 가지
  SVG로 연결선 그리기

[T14] cover-person.html — 인물 강조형
  [표지] 인물강조 스타일
  인물 사진 중앙 배치 + 하단 텍스트

[T15] basic-docustyle.html — 다큐형
  [기본] 다큐형 스타일
  어두운 배경 + 명조체(serif) + 골드 포인트
  진정성·무게감 전달
```

---

## 템플릿-카드타입 매핑표 (researcher.js가 참고할 것)

```
researcher.js에서 작은기획 생성 시 아래 매핑을 layout_hint에 반영:

카드 위치 | 카드 type   | 우선 템플릿   | 대안 템플릿
---------|------------|--------------|-------------
카드 1   | hook       | T01(cover-bold) | T02, T03
카드 2   | empathy    | T07(speech)  | T02
카드 3   | empathy    | T10(info)    | T04
카드 4   | data       | T06(stat)    | T05
카드 5   | info       | T05(step)    | T04
카드 6   | info       | T04(list)    | T10
카드 7   | detail     | T08(compare) | T10
카드 8   | detail     | T03(photo)   | T07
카드 9   | review     | T07(speech)  | T03
카드 10  | cta        | T09(cta)     | T01

규칙:
- 같은 템플릿을 연속 2장 이상 사용 금지
- stat 있는 카드는 T06 우선
- image_url 있는 카드는 T03 또는 T02 우선
- before_items/after_items 있으면 T08 강제
```
