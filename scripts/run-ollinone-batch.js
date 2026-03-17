import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { loadConfig } from '../agents/config-loader.js';
import { research } from '../agents/researcher.js';
import { run as runCopywriter } from '../agents/copywriter.js';
import { runPipeline } from '../index.js';
import * as notion from '../agents/notion-connector.js';
import { runBlog } from '../agents/blog-runner.js';
import { parseCardsFromContent } from '../agents/card-parser.js';

// ── 제작 요청 처리 ──
async function handleDesignRequests() {
  const pages = await notion.getByStatus('제작 요청');
  const ollinone = pages.filter(p => p.academyKey === 'ollinone');
  console.log(`\n📋 제작 요청: ${ollinone.length}건\n`);

  for (const page of ollinone) {
    try {
      console.log(`🎨 제작 시작: ${page.title}`);
      const { academy } = await loadConfig(page.academyKey);
      const topic = notion.extractTopic(page.title);

      const pageContent = await notion.getPageContent(page.id);
      const cards = parseCardsFromContent(pageContent.fullText);

      if (cards.length === 0) {
        console.log(`  ⚠️ 기획안 파싱 실패 — 새로 리서치`);
        const result = await runPipeline(topic, page.academyKey);
        await notion.appendFilePaths(page.id, result.pngPaths, page.title, academy.name, academy.drive_folder_id, result.htmlSources);
        await notion.setStatus(page.id, '디자인 1차');
        console.log(`  ✅ 제작 완료 (리서치 포함): ${page.title}`);
        continue;
      }

      const comments = await notion.getComments(page.id);
      const photoAssignments = await notion.getPhotoAssignments(page.id);

      const [result, blogResult] = await Promise.all([
        runPipeline(topic, page.academyKey, { copyData: { cards }, skipResearch: true, photoAssignments }),
        runBlog(topic, page.academyKey, academy, cards, comments.map(c => c.text), page.keyword || ''),
      ]);

      const copies = await runCopywriter(cards, topic, academy, {
        keyword: page.keyword,
      });

      await notion.writePlanAndCopy(page.id, cards, copies);
      await notion.writeBlog(page.id, blogResult.sections, blogResult.scores, blogResult.flagged, blogResult.failList);
      await notion.appendFilePaths(page.id, result.pngPaths, page.title, academy.name, academy.drive_folder_id, result.htmlSources);
      await notion.setStatus(page.id, '디자인 1차');
      console.log(`\n✅ 제작 완료: ${page.title}\n`);

    } catch (e) {
      console.error(`\n❌ 제작 실패: ${page.title} — ${e.message}\n`);
      await notion.postErrorComment(page.id, `제작 실패: ${e.message}`);
    }
  }
}

// ── 디자인 수정 처리 ──
async function handleDesignRevisions() {
  const pages = await notion.getByStatus('디자인 수정');
  const ollinone = pages.filter(p => p.academyKey === 'ollinone');
  console.log(`\n📋 디자인 수정: ${ollinone.length}건\n`);

  for (const page of ollinone) {
    try {
      const instructions = await notion.getRevisionInstructions(page.id, page.statusChangedAt);
      if (instructions.length === 0) {
        console.log(`  ⚠️ @수정 댓글 없음 — 스킵: ${page.title}`);
        continue;
      }

      console.log(`✏️ 디자인 수정 시작: ${page.title}`);
      console.log(`  지시: ${instructions[0].substring(0, 100)}`);

      const { academy } = await loadConfig(page.academyKey);
      const topic = notion.extractTopic(page.title);

      const pageContent = await notion.getPageContent(page.id);
      const oldCards = parseCardsFromContent(pageContent.fullText);

      const copyData = await research(topic, academy.name, {
        keyword: page.keyword,
        revisionInstructions: instructions,
        academyKey: page.academyKey,
        contentTypes: page.contentTypes,
      });

      await notion.postRevisionDiff(page.id, oldCards, copyData.cards);

      const result = await runPipeline(topic, page.academyKey, {
        copyData,
        skipResearch: true,
      });

      await notion.appendFilePaths(page.id, result.pngPaths, page.title, academy.name, academy.drive_folder_id, result.htmlSources);
      await notion.markRevisionComplete(page.id, instructions);
      await notion.setStatus(page.id, '디자인 수정 완료');
      console.log(`\n✅ 수정 완료: ${page.title}\n`);

    } catch (e) {
      console.error(`\n❌ 수정 실패: ${page.title} — ${e.message}\n`);
      await notion.postErrorComment(page.id, `수정 실패: ${e.message}`);
    }
  }
}

// ── 실행 ──
console.log('═══════════════════════════════════════════');
console.log('  올인원 일괄 처리 (제작 요청 + 디자인 수정)');
console.log('═══════════════════════════════════════════');

await handleDesignRequests();
await handleDesignRevisions();

console.log('\n🏁 모든 작업 완료');
