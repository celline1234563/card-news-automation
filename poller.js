import 'dotenv/config';
import { mkdir, appendFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { loadConfig } from './agents/config-loader.js';
import { research } from './agents/researcher.js';
import { run as runCopywriter } from './agents/copywriter.js';
import { runPipeline } from './index.js';
import * as notion from './agents/notion-connector.js';
import { parseCardsFromContent } from './agents/card-parser.js';
import { sendDailyReport } from './agents/daily-reporter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INTERVAL = parseInt(process.env.POLLER_INTERVAL || '30000');
let isProcessing = false;
let lastReportDate = null;

async function log(message) {
  const logDir = join(__dirname, 'logs');
  await mkdir(logDir, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  const logPath = join(logDir, `${today}.log`);
  const timestamp = new Date().toISOString();
  await appendFile(logPath, `[${timestamp}] [poller] ${message}\n`);
  console.log(`  ${message}`);
}

// ── ① 기획 착수 ──

async function handlePlanRequests() {
  const pages = await notion.getByStatus('기획 착수');
  if (pages.length === 0) return;

  for (const page of pages) {
    try {
      if (!page.academyKey) {
        await log(`⏭ 미등록 스킵: ${page.title}`);
        continue;
      }

      const topic = notion.extractTopic(page.title);
      if (!topic || topic.match(/^\(\d+\)$/) || topic.trim().length < 2) {
        await log(`⏭ 빈 주제 스킵: ${page.title}`);
        continue;
      }

      await log(`📋 기획 착수: ${page.title}`);
      const { academy } = await loadConfig(page.academyKey);

      const comments = await notion.getComments(page.id);
      const pageContent = await notion.getPageContent(page.id);

      const copyData = await research(topic, academy.name, {
        keyword: page.keyword,
        comments: comments.map(c => c.text),
        pageContent: pageContent.planningContent,
      });
      await log(`  ✅ 카드 ${copyData.cards.length}장 기획 완료`);

      await notion.writePlanAndCopy(page.id, copyData.cards, null);
      await notion.setStatus(page.id, '기획 컨펌');
      await log(`✅ 기획 완료: ${page.title}`);

    } catch (e) {
      await log(`❌ 기획 실패: ${page.title} — ${e.message}`);
      await notion.postErrorComment(page.id, `기획 실패: ${e.message}`);
    }
  }
}

// ── ② 제작 요청 ──

async function handleDesignRequests() {
  const pages = await notion.getByStatus('제작 요청');
  if (pages.length === 0) return;

  for (const page of pages) {
    try {
      if (!page.academyKey) {
        await log(`⏭ 미등록 스킵: ${page.title}`);
        continue;
      }

      await log(`🎨 제작 요청: ${page.title}`);
      const { academy } = await loadConfig(page.academyKey);
      const topic = notion.extractTopic(page.title);

      const pageContent = await notion.getPageContent(page.id);
      const cards = parseCardsFromContent(pageContent.fullText);

      if (cards.length === 0) {
        await log(`⚠️ 기획안 파싱 실패 — 새로 리서치: ${page.title}`);
        const result = await runPipeline(topic, page.academyKey);
        await notion.appendFilePaths(page.id, result.pngPaths, page.title, academy.name, academy.drive_folder_id, result.htmlSources);
        await notion.setStatus(page.id, '디자인 1차');
        await log(`✅ 제작 완료 (리서치 포함): ${page.title}`);
        continue;
      }

      const result = await runPipeline(topic, page.academyKey, {
        copyData: { cards },
        skipResearch: true,
      });

      const copies = await runCopywriter(cards, topic, academy, {
        keyword: page.keyword,
      });

      await notion.writePlanAndCopy(page.id, cards, copies);
      await notion.appendFilePaths(page.id, result.pngPaths, page.title, academy.name, academy.drive_folder_id, result.htmlSources);
      await notion.setStatus(page.id, '디자인 1차');
      await log(`✅ 제작 완료: ${page.title} (${result.pngPaths.length}장)`);

    } catch (e) {
      await log(`❌ 제작 실패: ${page.title} — ${e.message}`);
      await notion.postErrorComment(page.id, `제작 실패: ${e.message}`);
    }
  }
}

// ── ③ 디자인 수정 ──

async function handleDesignRevisions() {
  const pages = await notion.getByStatus('디자인 수정');
  if (pages.length === 0) return;

  for (const page of pages) {
    try {
      if (!page.academyKey) {
        await log(`⏭ 미등록 스킵: ${page.title}`);
        continue;
      }

      const instructions = await notion.getRevisionInstructions(page.id, page.statusChangedAt);
      if (instructions.length === 0) {
        await log(`⚠️ @수정 댓글 없음 — 스킵: ${page.title}`);
        continue;
      }

      await log(`✏️ 디자인 수정: ${page.title}`);
      await log(`  지시: ${instructions[0].substring(0, 60)}`);

      const { academy } = await loadConfig(page.academyKey);
      const topic = notion.extractTopic(page.title);

      // 기존 기획안 읽기 (diff용)
      const pageContent = await notion.getPageContent(page.id);
      const oldCards = parseCardsFromContent(pageContent.fullText);

      // 수정 지시 포함 재기획
      const copyData = await research(topic, academy.name, {
        keyword: page.keyword,
        revisionInstructions: instructions,
      });

      // diff 댓글 기록
      await notion.postRevisionDiff(page.id, oldCards, copyData.cards);

      // 디자인 파이프라인 재실행
      const result = await runPipeline(topic, page.academyKey, {
        copyData,
        skipResearch: true,
      });

      await notion.appendFilePaths(page.id, result.pngPaths, page.title, academy.name, academy.drive_folder_id, result.htmlSources);
      await notion.markRevisionComplete(page.id, instructions);
      await notion.setStatus(page.id, '디자인 수정 완료');
      await log(`✅ 수정 완료: ${page.title}`);

    } catch (e) {
      await log(`❌ 수정 실패: ${page.title} — ${e.message}`);
      await notion.postErrorComment(page.id, `수정 실패: ${e.message}`);
    }
  }
}

// ── ④ 일일 리포트 (매일 오전 9시 1회) ──

async function checkDailyReport() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const hour = now.getHours();

  if (hour >= 9 && lastReportDate !== today) {
    try {
      await sendDailyReport();
      lastReportDate = today;
      await log('📊 일일 리포트 전송 완료');
    } catch (e) {
      await log(`❌ 일일 리포트 실패: ${e.message}`);
    }
  }
}

// ── 운영 시간 체크 (월~금 9~15시 KST) ──

function isWorkingHours() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const day = now.getDay(); // 0=일, 6=토
  const hour = now.getHours();
  return day >= 1 && day <= 5 && hour >= 9 && hour < 15;
}

// ── 메인 루프 ──

async function poll() {
  if (isProcessing) return;

  // 리포트는 운영 시간 관계없이 체크 (9시 되면 전송)
  await checkDailyReport();

  if (!isWorkingHours()) return;

  isProcessing = true;
  try {
    await handlePlanRequests();
    await handleDesignRequests();
    await handleDesignRevisions();
  } catch (err) {
    await log(`❌ 폴링 에러: ${err.message}`);
  } finally {
    isProcessing = false;
  }
}

export async function runOnce() {
  await poll();
}

// 데몬 모드
const thisFile = fileURLToPath(import.meta.url);
const mainFile = process.argv[1] ? resolve(process.argv[1]) : '';

if (thisFile === mainFile) {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  🔄 폴러 시작 — 콘텐츠 캘린더 연동 v3');
  console.log('═══════════════════════════════════════════');
  console.log(`  필터: 카드뉴스 + 최근 30일 + 등록 학원`);
  console.log(`  감지: 기획 착수 / 제작 요청 / 디자인 수정`);
  console.log(`  운영: 월~금 09:00~15:00 KST`);
  console.log(`  리포트: 매일 09:00 KST`);
  console.log(`  간격: ${INTERVAL / 1000}초`);
  console.log('');

  poll();
  setInterval(poll, INTERVAL);
}
