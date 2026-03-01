# 카드뉴스 자동화 — 장애 대응 가이드

_v1.0 | 2026-02-27_

---

## 1. Gemini API 429 (Rate Limit)

**증상**: `Error: 429 Too Many Requests`

**원인**: Gemini API 분당/일별 호출 한도 초과

**해결**:
1. `index.js`에 rate limit 대기 시간 조정 (기본 60초)
2. `.env`에서 `POLLER_INTERVAL=60000`으로 늘리기
3. Google AI Studio에서 할당량 확인: https://aistudio.google.com/
4. 심각한 경우 프로젝트 변경 또는 유료 플랜 전환

---

## 2. Gemini API 500/503 (서버 에러)

**증상**: `Error: 500 Internal Server Error` 또는 `503 Service Unavailable`

**원인**: Google 서버 일시적 장애

**해결**:
1. 자동 재시도 (최대 3회, 지수 백오프) — `notion-connector.js`의 `withRetry()` 참고
2. 5분 후 재시도
3. Google Cloud Status 확인: https://status.cloud.google.com/

---

## 3. Notion API Rate Limit (429)

**증상**: `Error: 429 rate_limited`

**원인**: Notion API 초당 3회 제한 초과

**해결**:
1. `withRetry()` 래퍼가 자동 재시도 (지수 백오프)
2. 동시 처리 페이지 수가 많으면 `POLLER_INTERVAL` 늘리기
3. 불필요한 API 호출 줄이기 (블록 삭제 최적화 등)

---

## 4. Notion SDK v5 호환성 문제

**증상**: `databases.query is not a function`

**원인**: Notion SDK v5에서 `databases.query()` 제거됨

**해결**:
- `dataSources.query({ data_source_id })` 사용 (이미 적용됨)
- `NOTION_DATASOURCE_ID` 환경 변수 확인

---

## 5. Puppeteer 렌더링 실패

**증상**: `Error: Failed to launch browser` 또는 빈 PNG

**원인**: Chromium 미설치, 메모리 부족, 또는 headless 모드 문제

**해결**:
1. Chromium 재설치:
   ```bash
   npx puppeteer browsers install chrome
   ```
2. 메모리 확인 (`free -m` 또는 Activity Monitor)
3. 서버에서 실행 시 `--no-sandbox` 플래그 필요할 수 있음
4. renderer.js에서 launch 옵션 확인

---

## 6. 텍스트 오버플로 / 잘림

**증상**: PNG에서 텍스트가 카드 밖으로 나가거나 잘림

**원인**: font-size 과대, padding 부족, overflow:hidden

**해결**:
1. `design-validator.js`가 자동 감지 및 수정 시도
2. 수동 확인: `output/` 폴더의 HTML 파일 브라우저에서 열기
3. `gemini-designer-system.txt`에서 font-size 상한 조정
4. 헤드라인 30자 초과 여부 확인 (researcher-system.txt 규칙)

---

## 7. 한글 깨짐 / 폰트 미로드

**증상**: PNG에서 □□□ 또는 기본 폰트로 표시

**원인**: Google Fonts CDN 로드 실패 또는 font-family 미지정

**해결**:
1. `design-validator.js`의 `font_missing` 체크가 자동 수정
2. 오프라인 환경이면 로컬 폰트 설치 필요
3. renderer.js에서 네트워크 타임아웃 확인
4. HTML에 `<link href="fonts.googleapis.com...">` 존재 확인

---

## 8. Claude API 에러

**증상**: `Error: 529 Overloaded` 또는 `Error: 500`

**원인**: Anthropic API 서버 과부하 또는 일시 장애

**해결**:
1. 5분 후 자동 재시도
2. Anthropic Status 확인: https://status.anthropic.com/
3. 모델 변경: `claude-sonnet-4-20250514` → 다른 모델

---

## 9. Google Drive 업로드 실패

**증상**: `Error: insufficient permissions` 또는 `403 Forbidden`

**원인**: 서비스 계정 권한 부족 또는 폴더 공유 설정 누락

**해결**:
1. 서비스 계정 이메일에 Drive 폴더 "편집자" 공유 확인
2. `config/google-service-account.json` 유효성 확인
3. Drive API 활성화 확인 (Google Cloud Console)
4. `drive-folders.json`의 폴더 ID 확인

---

## 10. 이미지 매칭 실패

**증상**: 모든 카드에서 이미지 매칭 스킵

**원인**: Drive 폴더 비어있음, 폴더 ID 미설정, Sheets 연동 실패

**해결**:
1. `config/drive-folders.json`에 올바른 폴더 ID 입력
2. 해당 폴더에 이미지 파일 업로드
3. 이미지 매칭은 선택사항 — 없어도 파이프라인 정상 동작
4. `GOOGLE_SHEET_ID` 환경 변수 확인

---

## 11. 노션 기획안 파싱 실패

**증상**: `⚠️ 기획안 파싱 실패 — 새로 리서치`

**원인**: 노션에서 기획안 형식이 변경되었거나 비어있음

**해결**:
1. 노션 페이지에 `🤖 Claude 기획안` 섹션이 있는지 확인
2. callout 블록 형식: `카드 1 [hook]\n헤드라인: ...`
3. 수동 편집 시 형식 유지 필요
4. 파싱 실패 시 자동으로 리서치부터 재실행

---

## 12. QA 점수 미달 반복

**증상**: 카드가 계속 재생성되지만 점수가 안 오름

**원인**: Gemini 프롬프트 한계, 브랜드 토큰과 프롬프트 불일치

**해결**:
1. `MAX_DESIGN_RETRY=2` 이후 자동 중단 (무한루프 방지)
2. `output/qa-report.json`에서 구체적 미달 사유 확인
3. `prompts/gemini-designer-system.txt` 프롬프트 튜닝
4. `config/patterns/catalog.json` 패턴 추가/수정

---

## 빠른 진단 명령어

```bash
# 로그 실시간 확인
tail -f logs/$(date +%Y-%m-%d).log

# 최근 에러만 필터
grep "❌" logs/$(date +%Y-%m-%d).log

# 환경 변수 확인
node -e "require('dotenv').config(); console.log('Anthropic:', !!process.env.ANTHROPIC_API_KEY); console.log('Gemini:', !!process.env.GOOGLE_AI_API_KEY); console.log('Notion:', !!process.env.NOTION_API_KEY);"

# 단위 테스트
npm test

# 학원 설정 확인
node -e "import('./agents/config-loader.js').then(m => m.loadConfig('ollinone')).then(c => console.log(c.academy.name))"
```
