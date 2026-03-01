# 카드뉴스 디자인 품질 로드맵
> 전략 없이 코드를 짜면 품질이 낮다. 전략 문서 → 토큰 → 프롬프트 → 파이프라인 순서로 쌓는다.

**시작 학원**: 올인원 수학학원 (ollinone)
**목표**: 인스타그램 카드뉴스 10장이 "전문 에디터가 만든 것처럼" 보이는 수준
**원칙**: 각 Phase 산출물이 다음 Phase의 입력이 된다. 건너뛰기 금지.

---

## 의존성 그래프

```
Phase 0 ─── Phase 1 ─── Phase 2 ─── Phase 3 ─── Phase 4 ─── Phase 5
  브랜드전략    보이스+감정    디자인토큰    패턴카탈로그    프롬프트재설계   시리즈일관성
                                                              │
                                                              ├── Phase 6 (QA)
                                                              ├── Phase 7 (노션)
                                                              ├── Phase 8 (Drive)
                                                              └── Phase 9 (E2E)
```

Phase 0~5는 순차 의존. Phase 6~9는 Phase 5 완료 후 병렬 가능.

---

## Phase 0: 브랜드 전략서 (올인원)

### 목표
올인원 수학학원의 브랜드 아이덴티티를 한 문서로 정리한다.
이 문서가 이후 모든 디자인·카피 판단의 기준이 된다.

### 산출물
- `config/brand/ollinone-strategy.md` — 브랜드 전략서

### 실행 단계

1. **학원 정체성 정의**
   - 핵심 가치 (왜 이 학원이어야 하는가)
   - 경쟁 포지셔닝 (분당 수내 학원가 내 차별점)
   - 타겟 페르소나 3종 (학부모 2 + 학생 1)
     - 각 페르소나: 이름, 나이, 자녀 학년, 핵심 고민, 정보 수집 채널

2. **비주얼 원칙**
   - 무드 키워드 3개 확정 (현재: 스마트한, 심플한, 진중한)
   - 금지 키워드 (절대 쓰지 않을 톤: 예. 유치한, 화려한, 캐주얼)
   - 레퍼런스 방향 (JJ 기술형 에디토리얼 + 매거진형 클린)
   - 컬러 의도:
     - `#202487` (primary) → 신뢰, 전문성
     - `#fff3c8` (secondary) → 따뜻한 강조, 부모 안심
     - 사용 비율 가이드: primary 70%, neutral 20%, secondary 10%

3. **콘텐츠 방향**
   - 주력 콘텐츠 카테고리 (입시정보, 학습법, 성과, 학원소식)
   - 카테고리별 톤 차이 (입시정보=긴장감, 학습법=실용적, 성과=자부심)
   - 게시 빈도·요일 가이드라인

### 완료 기준
- [ ] 페르소나 3종이 구체적 이름·상황으로 작성됨
- [ ] 비주얼 무드와 금지 키워드가 명확히 분리됨
- [ ] 컬러 사용 비율이 숫자로 정의됨
- [ ] 원장님 또는 기획자 검토 완료

### 의존성
없음 (첫 Phase)

---

## Phase 1: 에디토리얼 보이스 + 감정곡선

### 목표
10장짜리 카드뉴스의 "읽히는 흐름"을 설계한다.
각 장이 어떤 감정을 유발해야 하는지 정의한다.

### 산출물
- `config/brand/ollinone-voice.md` — 보이스 가이드
- `config/brand/emotion-curve.json` — 감정곡선 템플릿

### 실행 단계

1. **보이스 가이드 작성**
   - 말투 원칙: "~입니다" vs "~해요" vs "~한다" (상황별)
   - 헤드라인 공식 3종 (숫자형, 질문형, 충격형)
   - 금지 표현 리스트 (진부한 클리셰, 과장 표현)
   - 이모지 사용 규칙 (카드뉴스 내 금지 / 캡션에서만 허용 등)

2. **감정곡선 설계**
   - 10장 표준 감정 흐름:
     ```
     1(충격) → 2(공감) → 3(불안심화) → 4(데이터충격)
     → 5(전환점) → 6(해결책) → 7(구체방법) → 8(증거)
     → 9(요약) → 10(행동촉구)
     ```
   - 각 장의 감정 강도 (1~10 스케일)
   - 카드 type ↔ 감정 매핑 테이블

3. **researcher.js 연동 설계**
   - `emotion-curve.json` 을 researcher 프롬프트에 주입하는 방식 정의
   - 카드별 `emotion_target` 필드 추가 설계

### 완료 기준
- [ ] 보이스 가이드에 DO/DON'T 예시가 각 5개 이상
- [ ] 감정곡선이 JSON으로 파싱 가능
- [ ] 카드 type과 감정 매핑이 1:1 (또는 1:N)로 정의됨
- [ ] 기존 hook-expert-system.txt와 충돌 없음

### 의존성
Phase 0 (브랜드 전략서의 톤·페르소나 참조)

---

## Phase 2: 디자인 토큰 시스템

### 목표
색상·타이포·간격·그림자 등 모든 시각 요소를 토큰으로 추출한다.
현재 `academies.json`의 6색 체계를 확장하고, 시맨틱 토큰을 정의한다.

### 산출물
- `config/tokens/ollinone-tokens.json` — 디자인 토큰 전체
- `config/tokens/token-schema.json` — 토큰 JSON 스키마 (검증용)
- `templates/_variables.css` 업데이트 — CSS 변수 확장

### 실행 단계

1. **색상 토큰 확장**
   - 기존 6색 유지 + 시맨틱 레이어 추가:
     ```json
     {
       "color": {
         "brand": { "primary": "#202487", "secondary": "#fff3c8" },
         "surface": { "card": "#FFFFFF", "overlay-dark": "rgba(26,26,46,0.7)", "overlay-light": "rgba(255,255,255,0.85)" },
         "text": { "heading": "#1A1A2E", "body": "#333333", "muted": "#666666", "inverse": "#FFFFFF" },
         "semantic": { "success": "#22C55E", "warning": "#F59E0B", "danger": "#EF4444" },
         "chart": ["#202487", "#4A4CC9", "#7B7DE6", "#fff3c8"]
       }
     }
     ```

2. **타이포그래피 토큰**
   - 폰트 패밀리: Noto Sans KR (변경 불가)
   - 사이즈 스케일: display(72px), h1(48px), h2(36px), h3(28px), body(22px), caption(18px), small(14px)
   - 웨이트: regular(400), bold(700), black(900)
   - 줄높이: tight(1.2), normal(1.5), relaxed(1.8)
   - 자간: tight(-0.02em), normal(0), wide(0.05em)

3. **간격 토큰**
   - 캔버스: 1080×1350 고정
   - 안전영역(safe-area): 상하좌우 60px
   - 간격 스케일: 4, 8, 12, 16, 24, 32, 48, 64, 96px
   - 카드별 콘텐츠 영역: 960×1230 (60px 패딩 적용 후)

4. **이펙트 토큰**
   - 그림자: subtle, medium, strong, glow
   - 라운딩: none(0), sm(8px), md(16px), lg(24px), full(50%)
   - 오버레이: dark-50, dark-70, light-80, light-90

5. **토큰 → CSS 변수 변환기**
   - `config-loader.js` 수정: `ollinone-tokens.json` → `:root` 블록 자동 생성
   - 기존 6색 CSS 변수 하위호환 유지

### 완료 기준
- [ ] 토큰 JSON이 스키마 검증 통과
- [ ] `_variables.css`에 모든 토큰이 CSS 변수로 반영
- [ ] 기존 HTML 템플릿이 깨지지 않음 (하위호환)
- [ ] config-loader.js가 토큰 파일 로드 가능

### 의존성
Phase 0 (컬러 의도·비율), Phase 1 (타이포 위계가 보이스 강도와 매핑)

---

## Phase 3: 패턴 카탈로그 + 레퍼런스 수집

### 목표
카드 type별로 "이렇게 생겨야 한다"는 시각 패턴을 정의한다.
레퍼런스 이미지를 수집하고 패턴과 매핑한다.

### 산출물
- `config/patterns/catalog.json` — 패턴 카탈로그 (type별 레이아웃 규칙)
- `config/references/ollinone/` — 레퍼런스 이미지 디렉토리
- `config/patterns/layout-rules.md` — 사람이 읽는 레이아웃 규칙 문서

### 실행 단계

1. **레퍼런스 수집** (사용자 작업)
   - 인스타그램/핀터레스트에서 "이런 느낌" 이미지 20~30장 수집
   - `config/references/ollinone/` 에 저장
   - 파일명 규칙: `{type}-{번호}.png` (예: `hook-01.png`, `data-03.png`)

2. **패턴 카탈로그 작성**
   - 각 카드 type별 레이아웃 변형 3~5개 정의:
     ```json
     {
       "hook": {
         "layouts": [
           {
             "name": "big-quote-center",
             "description": "화면 중앙 큰 텍스트 + 배경 그라데이션",
             "grid": "single-center",
             "text_align": "center",
             "headline_size": "display",
             "bg_treatment": "gradient-primary",
             "reference_images": ["hook-01.png", "hook-02.png"]
           }
         ],
         "rules": {
           "max_text_lines": 3,
           "require_emphasis": true,
           "bg_required": true
         }
       }
     }
     ```

3. **레이아웃 그리드 시스템**
   - 기본 그리드 6종 정의:
     - `single-center`: 중앙 집중형
     - `top-image-bottom-text`: 상단 이미지 + 하단 텍스트
     - `left-bar-right-text`: 좌측 컬러바 + 우측 본문
     - `stat-highlight`: 중앙 큰 숫자 + 보조 텍스트
     - `split-compare`: 좌우 비교 (before/after)
     - `card-list`: 아이템 리스트 (2~4개)

4. **기존 템플릿과 매핑**
   - 현재 `templates/` 12종 ↔ 패턴 카탈로그 대응표 작성
   - Gemini 생성 경로에서도 동일 패턴 참조 가능하도록 설계

### 완료 기준
- [ ] 레퍼런스 이미지 최소 15장 수집됨
- [ ] 8개 카드 type × 최소 3개 레이아웃 변형 정의됨
- [ ] 그리드 시스템이 1080×1350 safe-area 기준으로 px값 포함
- [ ] catalog.json이 유효한 JSON

### 의존성
Phase 2 (토큰이 레이아웃 간격·사이즈의 기준)

---

## Phase 4: Gemini 프롬프트 재설계

### 목표
`gemini-designer.js`의 인라인 프롬프트(114줄)를 외부 파일로 분리하고,
Phase 0~3 산출물을 주입하는 구조로 재설계한다.

### 산출물
- `prompts/gemini-designer-system.txt` — 외부화된 시스템 프롬프트
- `prompts/gemini-card-user.txt` — 카드별 유저 프롬프트 템플릿
- `agents/gemini-designer.js` 리팩터 — 프롬프트 로딩 + 토큰/패턴 주입
- `agents/prompt-builder.js` (신규) — 프롬프트 조립 유틸리티

### 실행 단계

1. **시스템 프롬프트 외부화**
   - `gemini-designer.js` 15~114줄의 인라인 프롬프트 →  `prompts/gemini-designer-system.txt`
   - 플레이스홀더 도입:
     ```
     {{BRAND_STRATEGY}}    ← Phase 0 전략서 요약
     {{VOICE_GUIDE}}       ← Phase 1 보이스 핵심 규칙
     {{DESIGN_TOKENS}}     ← Phase 2 토큰 (CSS 변수 블록)
     {{PATTERN_CATALOG}}   ← Phase 3 해당 type의 패턴 규칙
     {{EMOTION_TARGET}}    ← Phase 1 이 카드의 감정 목표
     ```

2. **프롬프트 빌더 모듈**
   - `agents/prompt-builder.js`:
     ```javascript
     export function buildSystemPrompt(academyKey) { ... }
     export function buildCardPrompt(card, academyConfig, usedLayouts) { ... }
     ```
   - 토큰 파일, 패턴 카탈로그, 브랜드 전략서를 읽어 프롬프트에 삽입
   - 토큰 중 Gemini에 필요한 부분만 추출 (전체 전달 시 토큰 낭비)

3. **유저 프롬프트 개선**
   - 현재: 카드 데이터를 텍스트로 나열
   - 개선: 구조화된 섹션 (### 카드 정보, ### 디자인 규칙, ### 참고 패턴)
   - 해당 카드 type의 패턴 카탈로그에서 레이아웃 후보 3개 제시
   - `usedLayouts` 기반 "이 레이아웃은 사용 금지" 명시

4. **gemini-designer.js 리팩터**
   - 인라인 프롬프트 제거
   - `prompt-builder.js`에서 조립된 프롬프트 사용
   - 에러 핸들링 강화: Gemini 응답에서 HTML 추출 실패 시 재시도 로직

5. **A/B 비교 테스트**
   - 동일 주제로 기존 프롬프트 vs 새 프롬프트 결과 비교
   - `output/ab-test/` 에 결과 저장

### 완료 기준
- [ ] 인라인 프롬프트 0줄 (gemini-designer.js에 프롬프트 텍스트 없음)
- [ ] 프롬프트 파일이 Phase 0~3 산출물을 참조
- [ ] 기존 파이프라인 (`node index.js "주제"`) 정상 동작
- [ ] A/B 테스트 결과 새 프롬프트가 시각적으로 우수 (주관 판단 OK)

### 의존성
Phase 0, 1, 2, 3 (모든 전략 문서 완성 필수)

---

## Phase 5: 시리즈 일관성 (3-레이어)

### 목표
10장 카드가 "같은 시리즈"로 보이게 하는 일관성 시스템을 구축한다.
개별 카드가 아무리 예뻐도, 10장을 나란히 놓았을 때 통일감이 없으면 실패.

### 산출물
- `agents/series-harmonizer.js` (신규) — 시리즈 일관성 에이전트
- `config/patterns/series-rules.json` — 시리즈 규칙
- `prompts/series-harmonizer-system.txt` — 하모나이저 프롬프트

### 실행 단계

1. **3-레이어 일관성 정의**

   **Layer 1: 구조 일관성**
   - 헤더 영역 위치 고정 (상단 60~120px)
   - 학원 로고/워터마크 위치 고정 (우하단 or 좌하단)
   - 페이지 번호 스타일 통일 (예: "03/10")
   - 콘텐츠 시작점 Y좌표 범위 제한

   **Layer 2: 컬러 일관성**
   - 10장 전체 컬러 팔레트 사전 확정 (카드별이 아닌 시리즈별)
   - primary 사용 빈도: 1,4,10번 카드에 집중
   - secondary 사용 빈도: 2,5,8번 카드에 포인트
   - 배경색 변화 규칙: 최대 3종 (white, light-gray, primary-dark)

   **Layer 3: 리듬 일관성**
   - 텍스트 밀도 패턴: 적-중-중-적-많-중-중-많-적-적
   - 이미지 유무 패턴: O-X-X-O-X-X-X-O-X-O
   - 레이아웃 반복 금지 (연속 2장 동일 그리드 불가)

2. **시리즈 하모나이저 구현**
   - 1번 카드 디자인 완료 후, "시리즈 DNA" 추출:
     - 사용된 컬러 조합
     - 헤더/푸터 스타일
     - 텍스트 정렬 패턴
     - 장식 요소 스타일
   - 2~10번 카드 생성 시 DNA를 Gemini 프롬프트에 주입
   - 완성 후 전체 10장 일관성 점수 산출

3. **파이프라인 통합**
   - `index.js`의 Stage 5 (gemini-designer) 앞뒤로 하모나이저 삽입:
     ```
     Stage 5a: 1번 카드 디자인 → DNA 추출
     Stage 5b: DNA + 나머지 카드 디자인
     Stage 5c: 전체 일관성 검토 → 미달 카드 재생성
     ```

### 완료 기준
- [ ] 10장 나란히 놓았을 때 "같은 시리즈" 인상 (주관 테스트)
- [ ] 헤더/푸터/번호 위치가 10장 모두 동일
- [ ] 연속 2장 동일 그리드 없음
- [ ] 시리즈 일관성 점수 7/10 이상

### 의존성
Phase 4 (재설계된 프롬프트가 시리즈 DNA를 주입받을 수 있어야 함)

---

## Phase 6: QA 파이프라인

### 목표
디자인 결과물을 자동으로 검증하는 다단계 QA 시스템을 구축한다.
현재 `design-validator.js`를 확장한다.

### 산출물
- `agents/design-validator.js` 확장 — 검증 항목 추가
- `prompts/design-validator-system.txt` 확장 — 검증 루브릭
- `agents/visual-qa.js` (신규) — 렌더링 후 PNG 품질 검증
- `config/qa/checklist.json` — QA 체크리스트

### 실행 단계

1. **HTML 레벨 QA 확장** (design-validator.js)
   - 기존 3항목 (텍스트오버플로, 한글폰트, CSS변수) 유지
   - 추가 항목:
     - 토큰 준수: 폰트사이즈가 토큰 스케일 내인지
     - 간격 준수: padding/margin이 토큰 스케일 내인지
     - 패턴 준수: layout이 catalog.json 정의와 일치하는지
     - 시리즈 일관성: 헤더/푸터 위치 일치 여부

2. **PNG 레벨 QA** (visual-qa.js)
   - Puppeteer 렌더링 후 PNG를 Claude Vision으로 검증:
     - 텍스트 가독성 (배경 대비 충분한지)
     - 텍스트 잘림 (overflow hidden으로 잘린 부분 있는지)
     - 이미지 깨짐 (빈 영역, 깨진 이미지 없는지)
     - 전체 미감 점수 (1~10)
   - 미달 카드 자동 재생성 (최대 2회)

3. **QA 리포트 생성**
   - 10장 QA 결과를 JSON으로 저장:
     ```json
     {
       "series_id": "올인원-2026-02-24",
       "overall_score": 8.2,
       "cards": [
         { "number": 1, "html_score": 9, "visual_score": 8, "issues": [] },
         { "number": 3, "html_score": 6, "visual_score": 7, "issues": ["font-size-too-small"] }
       ],
       "regenerated": [3]
     }
     ```
   - `output/{시리즈}/qa-report.json` 에 저장

### 완료 기준
- [ ] HTML QA 항목 7개 이상 자동 검증
- [ ] PNG QA로 텍스트 잘림 감지율 90% 이상
- [ ] QA 리포트가 모든 시리즈에 자동 생성
- [ ] 미달 카드 자동 재생성 동작

### 의존성
Phase 5 (시리즈 일관성 규칙이 QA 기준에 포함)

---

## Phase 7: 노션 통합

### 목표
전체 파이프라인을 노션 기반으로 운영할 수 있게 한다.
기획자가 노션에서 기획 확인·수정·승인하는 워크플로우 완성.

### 산출물
- `agents/notion-connector.js` 확장 — 기획안 작성·수정 기능
- `poller.js` 확장 — 수정요청 감지, 재기획 루프
- 노션 DB 템플릿 문서 — 속성 설정 가이드

### 실행 단계

1. **기획안 작성 기능**
   - `notion.writePlan(pageId, cards)`:
     - 카드 10장을 노션 블록으로 변환
     - 각 카드: 번호 + type + 헤드라인 + 서브텍스트
     - 구분선으로 카드 사이 분리
     - 하단에 "승인" 체크박스 안내 문구

2. **수정요청 처리**
   - `수정요청` 필드에 텍스트 입력 감지
   - researcher.revise() 호출 → 수정된 기획안 재작성
   - 수정 전/후 diff를 댓글로 기록

3. **상태 전이 자동화**
   ```
   기획착수 → (researcher) → 기획컨펌대기
   기획컨펌대기 + 승인체크 → 원고작업
   원고작업 → (design pipeline) → 디자인완료
   디자인완료 + PNG → 게시대기
   ```

4. **PNG 첨부**
   - `notion.attachPNGs(pageId, paths)`:
     - 10장 PNG를 노션 파일 블록으로 업로드
     - 카드 번호 순서대로 정렬

### 완료 기준
- [ ] 기획안이 노션 페이지에 깔끔하게 렌더링
- [ ] 승인 체크 → 자동 디자인 시작 (30초 이내 감지)
- [ ] 수정요청 → 재기획 → 재작성 루프 동작
- [ ] PNG 10장이 노션에 순서대로 첨부

### 의존성
Phase 5 (완성된 디자인 파이프라인 필요), 기존 notion-connector.js 기반

---

## Phase 8: Google Drive + image-picker

### 목표
학원 실사진을 Google Drive에서 자동으로 매칭하는 시스템 구축.
현재 `image-picker.js`는 CLAUDE.md에만 언급, 코드 미구현.

### 산출물
- `agents/image-picker.js` (신규 구현) — Drive 이미지 매칭
- Google Drive 폴더 구조 가이드
- `config/drive-folders.json` — 학원별 Drive 폴더 ID

### 실행 단계

1. **Drive 폴더 구조 설계**
   ```
   카드뉴스_에셋/
   ├── ollinone/
   │   ├── 수업사진/
   │   ├── 학원전경/
   │   ├── 학생사진/
   │   └── 성과자료/
   ├── jinhak/
   └── toktok/
   ```

2. **이미지 메타데이터 시트**
   - Google Sheets에 이미지 메타데이터 관리:
     - 파일ID, 파일명, 카테고리, 태그, 최근사용일, 사용횟수
   - `GOOGLE_SHEET_NAME=이미지_메타데이터` (.env 이미 존재)

3. **image-picker.js 구현**
   - 카드의 `image_category` 필드 기반 매칭
   - 매칭 로직:
     1. category로 폴더 필터
     2. 태그 유사도 스코어링
     3. 최근 사용 이미지 제외 (중복 방지)
     4. 상위 3개 후보 → 랜덤 선택
   - 결과: `card.image_url` 에 Drive 다운로드 URL 세팅

4. **파이프라인 통합**
   - Stage 2.5 (hook-critic 후, structure-reviewer 전)에 삽입
   - 이미지 없는 카드는 건너뜀 (bg_image만 Gemini Imagen으로)

### 완료 기준
- [ ] Drive에서 카테고리별 이미지 검색 동작
- [ ] 중복 사용 방지 로직 동작
- [ ] 파이프라인에서 image_category → image_url 자동 매핑
- [ ] 이미지 없는 카드 graceful skip

### 의존성
Phase 5 (디자인 파이프라인이 이미지 URL을 처리할 수 있어야), google-service-account.json

---

## Phase 9: E2E 테스트 + SOP

### 목표
전체 파이프라인의 안정성을 검증하고, 운영 매뉴얼을 작성한다.

### 산출물
- `tests/e2e.test.js` — E2E 테스트
- `tests/unit/` — 주요 에이전트 단위 테스트
- `docs/SOP.md` — 운영 표준 절차서
- `docs/TROUBLESHOOTING.md` — 장애 대응 가이드

### 실행 단계

1. **단위 테스트**
   - `config-loader.js`: 토큰 로드 + CSS 변수 생성
   - `prompt-builder.js`: 플레이스홀더 치환
   - `series-harmonizer.js`: DNA 추출 + 일관성 점수
   - `design-validator.js`: HTML QA 체크
   - `notion-connector.js`: API 호출 mock 테스트

2. **E2E 테스트**
   - 시나리오 1: CLI 모드 전체 파이프라인 (올인원, 테스트 주제)
   - 시나리오 2: 노션 폴링 → 기획 → 승인 → 디자인 → PNG
   - 시나리오 3: 수정요청 → 재기획 → 재디자인
   - 각 시나리오: API mock 모드 + 실제 API 모드

3. **SOP 작성**
   - 일상 운영:
     - 새 콘텐츠 등록 방법
     - 기획 확인·수정 프로세스
     - 디자인 결과 확인·재생성 방법
   - 새 학원 온보딩:
     - academies.json 추가
     - 브랜드 전략서 작성 (Phase 0 템플릿)
     - Drive 폴더 생성
     - 노션 DB 설정

4. **트러블슈팅 가이드**
   - Gemini API 오류 (429, 500)
   - 노션 API 오류 (rate limit, 권한)
   - Puppeteer 렌더링 실패
   - 텍스트 오버플로 반복 발생
   - 한글 깨짐 (폰트 로드 실패)

### 완료 기준
- [ ] 단위 테스트 커버리지 주요 모듈 80% 이상
- [ ] E2E 시나리오 3종 통과
- [ ] SOP로 비개발자가 새 콘텐츠 등록 가능
- [ ] 트러블슈팅 가이드에 최소 10개 시나리오

### 의존성
Phase 6, 7, 8 (모든 기능 완성 후)

---

## 실행 우선순위 요약

| Phase | 이름 | 예상 작업량 | 핵심 산출물 |
|-------|------|------------|------------|
| **0** | 브랜드 전략서 | 문서 1개 | `ollinone-strategy.md` |
| **1** | 보이스+감정곡선 | 문서 1 + JSON 1 | `ollinone-voice.md`, `emotion-curve.json` |
| **2** | 디자인 토큰 | JSON 2 + CSS 1 | `ollinone-tokens.json`, `_variables.css` |
| **3** | 패턴 카탈로그 | JSON 1 + 이미지 수집 | `catalog.json`, 레퍼런스 이미지 |
| **4** | 프롬프트 재설계 | JS 2 + TXT 2 | `prompt-builder.js`, 외부 프롬프트 |
| **5** | 시리즈 일관성 | JS 1 + JSON 1 | `series-harmonizer.js` |
| **6** | QA 파이프라인 | JS 1 확장 + JS 1 신규 | `visual-qa.js`, `qa-report.json` |
| **7** | 노션 통합 | JS 2 확장 | `notion-connector.js`, `poller.js` |
| **8** | Drive 연동 | JS 1 신규 + JSON 1 | `image-picker.js` |
| **9** | E2E + SOP | 테스트 + 문서 | `e2e.test.js`, `SOP.md` |

---

## 진행 상태 추적

- [ ] Phase 0 — 브랜드 전략서
- [ ] Phase 1 — 에디토리얼 보이스 + 감정곡선
- [ ] Phase 2 — 디자인 토큰 시스템
- [ ] Phase 3 — 패턴 카탈로그 + 레퍼런스 수집
- [ ] Phase 4 — Gemini 프롬프트 재설계
- [ ] Phase 5 — 시리즈 일관성
- [ ] Phase 6 — QA 파이프라인
- [ ] Phase 7 — 노션 통합
- [ ] Phase 8 — Drive + image-picker
- [ ] Phase 9 — E2E 테스트 + SOP

_v1.0 | 2026-02-26_
