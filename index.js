import 'dotenv/config';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { loadConfig } from './agents/config-loader.js';
import { research } from './agents/researcher.js';
import { critiqueHook } from './agents/hook-critic.js';
import { reviewAndFix } from './agents/structure-reviewer.js';
import { generateAllImages } from './agents/gemini-imager.js';
import { selectAll } from './agents/template-selector.js';
import { validateAll } from './agents/design-validator.js';
import { renderCards } from './agents/renderer.js';
import { harmonizeAndDesign } from './agents/series-harmonizer.js';
import { qaAndRegenerate } from './agents/visual-qa.js';
import { pickAllImages } from './agents/image-picker.js';
import { syncAllReferences } from './agents/reference-syncer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CLI 인자 파싱
function parseArgs() {
  const args = process.argv.slice(2);
  let topic = null;
  let academyId = process.env.DEFAULT_ACADEMY || 'jinhak';
  let notionPage = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--academy' && args[i + 1]) {
      academyId = args[i + 1];
      i++;
    } else if (args[i] === '--notion-page' && args[i + 1]) {
      notionPage = args[i + 1];
      i++;
    } else if (!args[i].startsWith('--')) {
      topic = args[i];
    }
  }

  // --notion-page가 있으면 topic으로도 사용
  if (!topic && notionPage) {
    topic = notionPage;
  }

  if (!topic) {
    console.error('사용법: node index.js "주제" [--academy 학원ID] [--notion-page "페이지제목"]');
    process.exit(1);
  }

  return { topic, academyId, notionPage };
}

/**
 * 전체 파이프라인 실행 (CLI + poller 공용)
 *
 * @param {string} topic - 카드뉴스 주제
 * @param {string} academyId - 학원 키 (e.g. "jinhak")
 * @param {Object} [options] - 추가 옵션
 * @param {Object} [options.copyData] - 이미 생성된 카피 데이터 (승인 후 디자인만 실행 시)
 * @param {boolean} [options.skipResearch] - 리서치 스킵 여부
 * @returns {{ cards: Object[], outputDir: string, pngPaths: string[] }}
 */
export async function runPipeline(topic, academyId, options = {}) {
  const startTime = Date.now();

  console.log('═══════════════════════════════════════════');
  console.log('  카드뉴스 자동 생성 시스템 v3.0');
  console.log('═══════════════════════════════════════════');
  console.log(`  주제: ${topic}`);
  console.log(`  학원: ${academyId}`);
  console.log('');

  // ── Stage 0: 설정 로드 + 레퍼런스 동기화 ──
  console.log('▶ Stage 0: 학원 설정 로드 + 레퍼런스 동기화');
  const { academy, cssVariables } = await loadConfig(academyId);
  try {
    await syncAllReferences();
  } catch (err) {
    console.log(`  ⚠️ 레퍼런스 동기화 스킵: ${err.message}`);
  }
  console.log(`  ✅ ${academy.name} 설정 로드 완료\n`);

  let copyData = options.copyData || null;

  if (!options.skipResearch) {
    // ── Stage 1: 리서치 + 카피 생성 ──
    console.log('▶ Stage 1: 리서치 + 카피 생성');
    copyData = await research(topic, academy.name, { academyKey: academyId });
    console.log(`  리서치 요약: ${copyData.research_summary?.substring(0, 100)}...\n`);

    // rate limit 방지
    console.log('  ⏳ API rate limit 대기 (60초)...');
    await new Promise(r => setTimeout(r, 60000));
  }

  if (!copyData || !copyData.cards) {
    throw new Error('카피 데이터가 없습니다');
  }

  // ── Stage 2: 후킹 카드 채점 ──
  console.log('▶ Stage 2: 후킹 카드 채점');
  copyData.cards[0] = await critiqueHook(copyData.cards[0], academy);
  console.log('');

  // rate limit 방지
  await new Promise(r => setTimeout(r, 10000));

  // ── Stage 2.5: 실사진 매칭 (Drive) ──
  console.log('▶ Stage 2.5: 실사진 매칭');
  try {
    await pickAllImages(copyData.cards, academyId, options.photoAssignments || new Map());
  } catch (err) {
    console.log(`  ⚠️ 이미지 매칭 스킵: ${err.message}`);
  }
  console.log('');

  // ── Stage 3: 구조 검토 ──
  console.log('▶ Stage 3: 구조 검토');
  copyData.cards = await reviewAndFix(copyData.cards, academy);
  console.log('');

  // ── Stage 4: Imagen 배경 이미지 생성 ──
  console.log('▶ Stage 4: Imagen 배경 이미지 생성');
  await generateAllImages(copyData.cards, academy);
  console.log('');

  // ── Stage 5: 시리즈 하모나이저 (DNA 기반 디자인) ──
  console.log('▶ Stage 5: 시리즈 하모나이저 + HTML 디자인');
  await harmonizeAndDesign(copyData.cards, cssVariables, academy, { academyKey: academyId });
  console.log('');

  // ── Stage 5.5: HTML 품질 검증 ──
  console.log('▶ Stage 5.5: HTML 품질 검증');
  await validateAll(copyData.cards);
  console.log('');

  // ── Stage 6: HTML → PNG 렌더링 ──
  const today = new Date().toISOString().slice(0, 10);
  const safeTopic = topic.replace(/[^가-힣a-zA-Z0-9]/g, '-').substring(0, 30);
  const outputDir = join(__dirname, 'output', `${academy.name}-${safeTopic}-${today}`);

  console.log(`▶ Stage 6: PNG 렌더링`);
  console.log(`  출력 폴더: ${outputDir}`);
  const { htmlSources } = await renderCards(copyData.cards, cssVariables, academy.name, outputDir, academyId);

  // PNG 경로 목록 생성
  const pngPaths = copyData.cards.map((_, i) =>
    join(outputDir, `card-${String(i + 1).padStart(2, '0')}.png`)
  );

  // ── Stage 7: PNG 비주얼 QA ──
  console.log('');
  console.log('▶ Stage 7: PNG 비주얼 QA');
  try {
    const qaResult = await qaAndRegenerate(copyData.cards, cssVariables, academy, outputDir, { academyKey: academyId });

    // 재생성된 카드가 있으면 다시 렌더링
    const regenerated = copyData.cards.filter(c => c._regenerated);
    if (regenerated.length > 0) {
      console.log(`  🔄 ${regenerated.length}장 재렌더링...`);
      await renderCards(copyData.cards, cssVariables, academy.name, outputDir, academyId);
      regenerated.forEach(c => delete c._regenerated);
    }
  } catch (err) {
    console.log(`  ⚠️ QA 스킵: ${err.message}`);
  }
  console.log('');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('═══════════════════════════════════════════');
  console.log(`  ✅ 완료! 카드 ${copyData.cards.length}장 생성 (${elapsed}초)`);
  console.log(`  📁 ${outputDir}`);
  console.log('═══════════════════════════════════════════');

  return { cards: copyData.cards, outputDir, pngPaths, htmlSources };
}

// CLI 모드로 실행될 때만 main() 호출
import { resolve } from 'path';

const thisFile = fileURLToPath(import.meta.url);
const mainFile = process.argv[1] ? resolve(process.argv[1]) : '';

if (thisFile === mainFile) {
  const { topic, academyId, notionPage } = parseArgs();
  runPipeline(topic, academyId)
    .then(async (result) => {
      if (notionPage) {
        await uploadToNotion(notionPage, academyId, result);
      }
    })
    .catch(err => {
      console.error('\n❌ 에러 발생:', err.message);
      process.exit(1);
    });
}

/**
 * 파이프라인 완료 후 노션 페이지에 결과물 업로드
 */
async function uploadToNotion(notionPageTitle, academyId, result) {
  try {
    const notion = await import('./agents/notion-connector.js');
    const configLoader = await import('./agents/config-loader.js');

    console.log('');
    console.log('▶ Stage 8: 노션 업로드');

    // 노션에서 페이지 찾기 — 모든 상태에서 제목으로 검색
    const statuses = ['기획착수', '기획 착수', '기획컨펌대기', '기획 컨펌', '원고작업', '제작 요청'];
    let targetPage = null;

    for (const status of statuses) {
      const pages = await notion.getByStatus(status);
      targetPage = pages.find(p => p.title.includes(notionPageTitle.replace(/[\[\]]/g, '')));
      if (targetPage) break;
    }

    if (!targetPage) {
      console.log(`  ⚠️ 노션 페이지를 찾을 수 없음: ${notionPageTitle}`);
      return;
    }

    console.log(`  📄 페이지 발견: ${targetPage.title}`);

    const { academy } = await configLoader.loadConfig(academyId);
    await notion.appendFilePaths(
      targetPage.id,
      result.pngPaths,
      targetPage.title,
      academy.name,
      academy.drive_folder_id,
      result.htmlSources
    );
    console.log(`  ✅ PNG ${result.pngPaths.length}장 노션에 업로드 완료`);

    await notion.setStatus(targetPage.id, '디자인 1차');
    console.log(`  ✅ 상태 → 디자인 1차`);

  } catch (err) {
    console.log(`  ❌ 노션 업로드 실패: ${err.message}`);
  }
}
