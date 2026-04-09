import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { deepResearch } from './deep-researcher.js';
import { planCards } from './card-planner.js';
import { polishVisuals } from './visual-strategist.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 주제 리서치 + 카드 10장 기획 (3-에이전트 파이프라인)
 *
 * 기존 research() 함수와 동일한 시그니처/반환값을 유지합니다.
 * 내부적으로 3개 에이전트를 순차 호출:
 *   1. deep-researcher: 웹 리서치 + 케이스 데이터 분석
 *   2. card-planner: 10장 카드 구조 기획
 *   3. visual-strategist: 헤드라인/디자인브리프 다듬기
 *
 * @param {string} topic - 카드뉴스 주제
 * @param {string} academyName - 학원 이름
 * @param {Object} [options]
 * @param {string} [options.keyword] - 메인 키워드
 * @param {string[]} [options.comments] - 담당자 재료 댓글
 * @param {string} [options.pageContent] - 기획자 작성 기획 문서
 * @param {string[]} [options.revisionInstructions] - @수정 지시
 * @param {string} [options.academyKey] - 학원 키
 * @param {string[]} [options.contentTypes] - 콘텐츠 타입
 * @param {string} [options.region] - 학원 지역
 */
export async function research(topic, academyName, options = {}) {
  console.log('');
  console.log(`  ═══ 3-에이전트 기획 파이프라인 시작 ═══`);
  console.log(`  주제: ${topic}`);
  console.log(`  학원: ${academyName}`);
  const startTime = Date.now();

  // Stage 1: 깊은 리서치
  const researchResult = await deepResearch(topic, academyName, options);

  // Stage 2: 카드 기획
  const planResult = await planCards(topic, academyName, researchResult, options);

  // Stage 3: 비주얼/카피 다듬기
  const finalResult = await polishVisuals(planResult, options);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  ═══ 기획 파이프라인 완료 (${elapsed}초) ═══`);
  console.log('');

  // 디버깅용: 기획 데이터 + 리서치 데이터 임시 저장
  try {
    const debugPath = join(__dirname, '..', 'temp', 'last-research.json');
    await writeFile(debugPath, JSON.stringify({
      _meta: { elapsed_seconds: parseFloat(elapsed), timestamp: new Date().toISOString() },
      research: researchResult,
      plan: finalResult,
    }, null, 2), 'utf-8');
    console.log(`  💾 기획 데이터 저장: temp/last-research.json`);
  } catch { /* ignore */ }

  return finalResult;
}
