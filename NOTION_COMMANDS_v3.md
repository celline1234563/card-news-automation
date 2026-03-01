# 노션 연동 명령어 — Phase 6 v3
> Claude Code에 아래 내용을 그대로 붙여넣으세요.
> 멈추지 말고 끝까지 실행해.

---

## 확정 스펙 전체

### 워크플로우
```
① 기획 착수 → 기획 컨펌
   트리거: 상태 "기획 착수"
   입력: 제목 + 메인키워드 + 댓글 재료
   출력: 노션 본문에 기획안 10장 작성
         (헤드라인 + 서브텍스트 + 카드 구성 힌트)
   완료: 상태 → "기획 컨펌"

② 제작 요청 → 디자인 1차
   트리거: 상태 "제작 요청"
   입력: 기획안 (본문에서 읽기) + 학원 브랜드
   출력 A: PNG 10장 생성 → 파일 경로 본문 첨부
   출력 B: 원고 10개 (카드별 300~500자) → 본문에 작성
   완료: 상태 → "디자인 1차"

③ 디자인 수정 → 디자인 수정 완료
   트리거: 상태 "디자인 수정" + "@수정"으로 시작하는 댓글
   입력: @수정 댓글 내용
   출력: PNG 덮어쓰기 + 원고 수정 필요시 수정
   완료: 상태 → "디자인 수정 완료"
```

### 노션 본문 출력 형식
```
## 🤖 Claude 기획안
(자동 생성 — 수정하려면 댓글에 @수정으로 요청)

🎯 카드 1 [hook]
   헤드라인: 왜 우리 아이는 성적이 그대로일까?
   서브텍스트: 성적이 빠르게 성장하는 학생들의 공통점
   레이아웃힌트: cover-bold

📄 카드 2 [problem]
   헤드라인: 같은 반, 같은 수업인데 왜 성적이 다를까
   서브텍스트: 수업 속도 불균형이 만드는 성취도 정체
   항목: 수업 속도 불균형 / 수업 집중도 저하 / 학업 성취도 정체
   레이아웃힌트: basic-list

... (10장)

───────────────

## 📝 원고
(카드별 300~500자 본문 — 메인키워드 중심)

### 카드 1 원고
[300~500자 본문 텍스트]
메인키워드: 월반 시스템, 성적 성장

### 카드 2 원고
[300~500자 본문 텍스트]
...

───────────────

## 📁 생성된 파일
- /output/ollinone/월반시스템/card-01.png
- /output/ollinone/월반시스템/card-02.png
...
```

### 원고 작성 규칙
```
- 카드별 독립적인 300~500자 본문
- 메인키워드를 자연스럽게 2~3회 포함
- 기획안의 헤드라인/서브텍스트와 연결되는 흐름
- 학부모/학생이 공감할 수 있는 구어체
- 마지막 문장은 다음 카드로 이어지는 브릿지
- 해시태그 3~5개 카드 끝에 추가
```

### 기획서 읽기 규칙 (실제 기획자 문서 기반)
```
노션 페이지 본문에 기획자가 쓴 내용이 있으면:
- "작업기획서" 섹션 우선 읽기
- 카드별 제목 + 불릿 구조 파악
- 이미지 첨부 있으면 [이미지 있음] 메모
- "아이디어 정리" 섹션도 참고자료로 활용

형식 예:
  "1 : 왜 우리 아이는 성적이 그대로일까?"
  불릿: 성적이 빠르게 성장하는 학생 / 이유는 단 하나 / 실력에 맞게 배우기 때문

→ 이 구조 그대로 기획안의 카드 뼈대로 사용
→ AI가 살 붙이고 헤드라인/서브텍스트/원고 생성
```

---

## STEP 1 — 패키지 설치

```
npm install @notionhq/client
```

---

## STEP 2 — notion-connector.js 구현

```
agents/notion-connector.js 구현해줘.

함수 목록:

① getByStatus(statusValue)
   필터:
   - 제작포맷 multi_select에 "카드뉴스" 포함
   - last_edited_time 30일 이내
   - 상태 multi_select에 statusValue 포함
   반환: [{ id, title, academyKey, keyword, statusChangedAt }]

② getComments(pageId)
   - 시간순 전체 조회
   - "🤖 Claude 기획안"으로 시작하는 댓글 제외
   반환: [{ text, createdAt }]

③ getRevisionInstructions(pageId, afterTime)
   - afterTime 이후 댓글 중 "@수정"으로 시작하는 것만
   반환: 텍스트 배열

④ getPageContent(pageId)
   - 페이지 본문 전체 텍스트 추출
   - "작업기획서" 섹션 있으면 해당 내용 파싱
   반환: { fullText, planningContent }

⑤ writePlanAndCopy(pageId, cards, copies)
   - 본문에 두 섹션 작성:
     ## 🤖 Claude 기획안 (cards 데이터)
     ## 📝 원고 (copies 데이터)
   - 기존 두 섹션 있으면 교체, 없으면 상단에 추가

⑥ appendFilePaths(pageId, pngPaths)
   - ## 📁 생성된 파일 섹션 추가/교체

⑦ setStatus(pageId, statusValue)
   - 상태 multi_select 업데이트

⑧ extractAcademyKey(title)
   - 올인원 → ollinone
   - 진학 → jinhak
   - 톡톡 → toktok
   - 미등록 → null
```

---

## STEP 3 — copywriter.js 신규 구현

```
agents/copywriter.js 를 새로 만들어줘.

역할: 기획안 10장을 받아 카드별 원고(300~500자) 생성

함수: async run(cards, topic, academyConfig, options = {})
  cards: 기획안 배열 (헤드라인, 서브텍스트, 항목 포함)
  topic: 페이지 제목
  academyConfig: 학원 브랜드 정보
  options.keyword: 메인키워드

Claude API 호출 (기존 claude-client.js 사용):

시스템 프롬프트:
  당신은 학원 SNS 콘텐츠 전문 작가입니다.
  카드뉴스의 각 카드에 들어갈 본문 원고를 작성합니다.

  원고 작성 규칙:
  1. 카드별 300~500자 (공백 포함)
  2. 메인키워드를 카드당 2~3회 자연스럽게 포함
  3. 학부모가 공감하는 구어체 (딱딱한 문어체 금지)
  4. 카드 헤드라인과 자연스럽게 연결
  5. 마지막 문장은 다음 카드로 이어지는 브릿지
  6. 카드 끝에 관련 해시태그 3~5개

유저 프롬프트:
  주제: [topic]
  메인키워드: [keyword]
  학원: [academyConfig.name]
  
  아래 기획안을 바탕으로 카드별 원고를 작성해줘.
  
  [카드 1]
  헤드라인: [headline]
  서브텍스트: [subtext]
  항목: [items]
  
  [카드 2]
  ...
  
  JSON 형식으로 반환:
  { copies: [ { card: 1, text: "원고내용", hashtags: ["#태그1", "#태그2"] }, ... ] }

반환: copies 배열
```

---

## STEP 4 — researcher.js 업그레이드

```
agents/researcher.js 수정:

run() 시그니처 변경:
  기존: run(topic, academyConfig)
  변경: run(topic, academyConfig, options = {})
  options: { keyword, comments, pageContent, revisionInstructions }

프롬프트에 추가:

pageContent 있으면:
"아래는 기획자가 작성한 기획 문서입니다. 이 구조를 기반으로 기획안을 작성하세요:
[pageContent]"

comments 있으면:
"아래는 담당자가 댓글로 남긴 재료입니다. 반드시 반영하세요:
[댓글 합본]"

keyword 있으면:
"메인키워드: [keyword] — 원고에 자연스럽게 포함"

revisionInstructions 있으면:
"수정 지시: [지시내용] — 기존 기획안에서 이 부분만 수정해서 다시 작성"
```

---

## STEP 5 — poller.js 구현

```
poller.js 구현:

const INTERVAL = parseInt(process.env.POLLER_INTERVAL) || 30000;
let isProcessing = false;

async function poll() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    // ① 기획 착수
    const planning = await notion.getByStatus("기획 착수");
    for (const page of planning) {
      try {
        if (!page.academyKey) { log("⏭ 미등록 스킵:", page.title); continue; }
        log("📋 기획 착수:", page.title);
        const academyConfig = configLoader.load(page.academyKey);
        const comments = await notion.getComments(page.id);
        const pageContent = await notion.getPageContent(page.id);
        const cards = await researcher.run(page.title, academyConfig, {
          keyword: page.keyword,
          comments: comments.map(c => c.text),
          pageContent: pageContent.planningContent
        });
        // 기획 단계에서는 기획안만 작성 (원고는 제작 요청 때)
        await notion.writePlanAndCopy(page.id, cards, null);
        await notion.setStatus(page.id, "기획 컨펌");
        log("✅ 기획 완료:", page.title);
      } catch (e) { log("❌ 기획 실패:", page.title, e.message); }
    }

    // ② 제작 요청
    const production = await notion.getByStatus("제작 요청");
    for (const page of production) {
      try {
        if (!page.academyKey) continue;
        log("🎨 제작 요청:", page.title);
        const academyConfig = configLoader.load(page.academyKey);
        // 본문에서 기획안 읽기
        const pageContent = await notion.getPageContent(page.id);
        const cards = parseCardsFromContent(pageContent.fullText);
        // PNG 생성
        const pngs = await runDesignPipeline(cards, academyConfig, page.title);
        // 원고 생성
        const copies = await copywriter.run(cards, page.title, academyConfig, {
          keyword: page.keyword
        });
        // 본문 업데이트
        await notion.writePlanAndCopy(page.id, cards, copies);
        await notion.appendFilePaths(page.id, pngs);
        await notion.setStatus(page.id, "디자인 1차");
        log("✅ 제작 완료:", page.title);
      } catch (e) { log("❌ 제작 실패:", page.title, e.message); }
    }

    // ③ 디자인 수정
    const revisions = await notion.getByStatus("디자인 수정");
    for (const page of revisions) {
      try {
        if (!page.academyKey) continue;
        const instructions = await notion.getRevisionInstructions(
          page.id, page.statusChangedAt
        );
        if (!instructions.length) {
          log("⚠️ @수정 댓글 없음 — 스킵:", page.title);
          continue;
        }
        log("✏️ 디자인 수정:", page.title, "지시:", instructions[0].slice(0,30));
        const academyConfig = configLoader.load(page.academyKey);
        const pageContent = await notion.getPageContent(page.id);
        const cards = parseCardsFromContent(pageContent.fullText);
        const pngs = await runDesignPipeline(cards, academyConfig, page.title, {
          revisionInstructions: instructions
        });
        await notion.appendFilePaths(page.id, pngs);
        await notion.setStatus(page.id, "디자인 수정 완료");
        log("✅ 수정 완료:", page.title);
      } catch (e) { log("❌ 수정 실패:", page.title, e.message); }
    }

  } finally { isProcessing = false; }
}

// parseCardsFromContent: 본문 텍스트에서 🎯/📄 카드 파싱
function parseCardsFromContent(text) { ... }

// runOnce: 테스트용
async function runOnce() { await poll(); }

module.exports = { runOnce };
if (require.main === module) {
  log("🔄 폴러 시작");
  poll();
  setInterval(poll, INTERVAL);
}
```

---

## STEP 6 — 프롬프트 파일 분리 (직원 수정용)

```
직원들이 Claude Code 없이 프롬프트를 수정할 수 있도록
프롬프트를 별도 텍스트 파일로 분리해줘.

아래 파일들을 생성하고 각 agent에서 읽어서 사용하도록 수정:

prompts/
├── researcher-system.txt      ← 기획안 생성 시스템 프롬프트
├── researcher-user.txt        ← 기획안 유저 프롬프트 템플릿
├── copywriter-system.txt      ← 원고 생성 시스템 프롬프트
├── copywriter-user.txt        ← 원고 유저 프롬프트 템플릿
└── PROMPTS_README.md          ← 직원용 수정 가이드

PROMPTS_README.md 내용:
  # 프롬프트 수정 가이드
  
  ## 원고 톤 바꾸고 싶을 때
  copywriter-system.txt 열어서 수정
  예: "구어체" → "격식체"
  
  ## 원고 글자수 바꾸고 싶을 때
  copywriter-system.txt에서
  "300~500자" 부분을 원하는 글자수로 변경
  
  ## 기획안 카드 구성 바꾸고 싶을 때
  researcher-system.txt 열어서 수정
  예: 카드 순서, 각 카드 역할 등
  
  ## 수정 후 적용
  poller.js를 재시작하면 자동으로 새 프롬프트 적용
  (파일 저장만 하면 됨 — 코드 수정 불필요)

각 agent에서:
  const systemPrompt = fs.readFileSync('./prompts/researcher-system.txt', 'utf8');
  // 매 호출마다 파일 읽기 (핫리로드 효과)
```

---

## STEP 7 — 테스트

```
테스트 순서대로 실행:

1. API 연결
node -e "
  require('dotenv').config();
  const notion = require('./agents/notion-connector');
  notion.getByStatus('기획 착수').then(p => {
    console.log('기획 착수:', p.length, '건');
    p.forEach(x => console.log('-', x.title, x.academyKey || '미등록'));
  });
"

2. 페이지 본문 읽기
node -e "
  require('dotenv').config();
  const notion = require('./agents/notion-connector');
  notion.getByStatus('기획 착수').then(async pages => {
    if (!pages.length) return console.log('없음');
    const content = await notion.getPageContent(pages[0].id);
    console.log('본문 길이:', content.fullText.length, '자');
    console.log('기획 섹션:', content.planningContent?.slice(0,100));
  });
"

3. copywriter 단독 테스트
node -e "
  require('dotenv').config();
  const copywriter = require('./agents/copywriter');
  const testCards = [
    { card: 1, type: 'hook', headline: '왜 우리 아이는 성적이 그대로일까?', subtext: '실력에 맞게 배우기 때문입니다' }
  ];
  copywriter.run(testCards, '월반 시스템', { name: '올인원수학학원' }, { keyword: '월반' })
    .then(copies => console.log(copies[0].text.length, '자\n', copies[0].text.slice(0,100)));
"

4. 폴러 1회 실행
node -e "
  require('dotenv').config();
  const { runOnce } = require('./poller');
  runOnce().then(() => { console.log('완료'); process.exit(0); });
"
```
