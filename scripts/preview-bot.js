#!/usr/bin/env node
/**
 * 설정 변경 미리보기 봇
 *
 * 브랜드 설정(strategy/voice/tokens/prompts) 변경 시
 * 고정 샘플 카드로 BEFORE/AFTER 미리보기를 생성하고
 * Google Chat으로 알림을 보냅니다.
 *
 * 사용법:
 *   node scripts/preview-bot.js --academy jinhak
 *   node scripts/preview-bot.js --academy ollinone --after-only
 */

import 'dotenv/config';
import { execSync } from 'child_process';
import { mkdir, writeFile, readFile, cp, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// ── 학원별 고정 샘플 카드 ──

const SAMPLE_CARDS = {
  ollinone: {
    number: 1,
    type: 'hook',
    layout_hint: 'big-quote',
    headline: '중3 3월, <em>이미 늦었습니다</em>',
    subtext: '지금 시작하지 않으면 고등 수학이 무너집니다',
    emphasis_style: 'highlight',
    icon: 'alert-circle',
    image_category: null,
    image_url: null,
    bg_image_url: null,
    generated_html: null,
    layout_used: null,
  },
  jinhak: {
    number: 1,
    type: 'hook',
    layout_hint: 'big-quote',
    headline: '학원을 옮겨도 <em>성적이 안 오르는</em> 이유',
    subtext: '방법이 틀렸기 때문입니다. 빈 곳만 채우면 수학은 다시 올라갑니다.',
    emphasis_style: 'highlight',
    icon: 'target',
    image_category: null,
    image_url: null,
    bg_image_url: null,
    generated_html: null,
    layout_used: null,
  },
  toktok: {
    number: 1,
    type: 'hook',
    layout_hint: 'big-quote',
    headline: '미국 교과서로 배우면 <em>진짜 영어</em>가 됩니다',
    subtext: '국제학교 수준의 커리큘럼, 초등부터 시작하세요',
    emphasis_style: 'highlight',
    icon: 'globe',
    image_category: null,
    image_url: null,
    bg_image_url: null,
    generated_html: null,
    layout_used: null,
  },
};

// ── 인자 파싱 ──

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { academy: null, afterOnly: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--academy' && args[i + 1]) {
      opts.academy = args[++i];
    }
    if (args[i] === '--after-only') {
      opts.afterOnly = true;
    }
  }

  return opts;
}

// ── git diff로 변경된 학원 감지 ──

function detectChangedAcademies() {
  try {
    const diff = execSync('git diff HEAD~1 --name-only', { cwd: ROOT, encoding: 'utf-8' });
    const files = diff.trim().split('\n').filter(Boolean);

    const academies = new Set();
    const changedFiles = [];

    for (const file of files) {
      if (file.startsWith('config/brand/') || file.startsWith('config/tokens/') || file.startsWith('prompts/')) {
        changedFiles.push(file);

        // 학원 키 추출
        const match = file.match(/(ollinone|jinhak|toktok)/);
        if (match) {
          academies.add(match[1]);
        } else if (file.startsWith('prompts/') || file.includes('emotion-curve') || file.includes('academies.json')) {
          // 공용 파일 → 모든 학원
          academies.add('ollinone');
          academies.add('jinhak');
          academies.add('toktok');
        }
      }
    }

    return { academies: [...academies], changedFiles };
  } catch {
    return { academies: [], changedFiles: [] };
  }
}

// ── 설정 백업/복원 (BEFORE 생성용) ──

async function backupConfig() {
  const backupDir = join(ROOT, '.preview-backup');
  await mkdir(backupDir, { recursive: true });

  const dirs = ['config/brand', 'config/tokens', 'prompts'];
  for (const dir of dirs) {
    const src = join(ROOT, dir);
    const dst = join(backupDir, dir);
    if (existsSync(src)) {
      await mkdir(dirname(dst), { recursive: true });
      await cp(src, dst, { recursive: true });
    }
  }
  return backupDir;
}

async function restoreOldConfig() {
  // git checkout HEAD~1의 설정 파일들을 임시로 복원
  const dirs = ['config/brand', 'config/tokens', 'prompts'];
  for (const dir of dirs) {
    try {
      execSync(`git checkout HEAD~1 -- ${dir}`, { cwd: ROOT, encoding: 'utf-8' });
    } catch {
      // 파일이 없었을 수 있음
    }
  }
}

async function restoreCurrentConfig(backupDir) {
  const dirs = ['config/brand', 'config/tokens', 'prompts'];
  for (const dir of dirs) {
    const src = join(backupDir, dir);
    const dst = join(ROOT, dir);
    if (existsSync(src)) {
      await cp(src, dst, { recursive: true });
    }
  }
  // 백업 정리
  await rm(backupDir, { recursive: true, force: true });
}

// ── 카드 미리보기 생성 ──

async function generatePreview(academyKey, outputDir) {
  // 동적 import (config가 바뀔 수 있으므로)
  const { loadConfig } = await import('../agents/config-loader.js');
  const { designCard } = await import('../agents/gemini-designer.js');

  const { academy, cssVariables } = await loadConfig(academyKey);
  const card = { ...SAMPLE_CARDS[academyKey] };

  console.log(`  🎨 ${academy.name} 미리보기 디자인 생성 중...`);

  const html = await designCard(card, cssVariables, academy, [], {
    academyKey,
  });
  card.generated_html = html;

  // Puppeteer 렌더링
  const puppeteer = (await import('puppeteer')).default;
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  await mkdir(outputDir, { recursive: true });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350 });
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 });

  // 폰트 로딩 대기
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 1000));

  const pngPath = join(outputDir, 'preview.png');
  await page.screenshot({ path: pngPath, type: 'png' });
  await browser.close();

  console.log(`  ✅ 미리보기 저장: ${pngPath}`);
  return pngPath;
}

// ── Drive 업로드 ──

async function uploadToPreviewFolder(pngPaths, academyName) {
  try {
    const { uploadPNGs } = await import('../agents/drive-uploader.js');
    const parentId = '1lzvB4ZoZGv40fy5xachV8kiEJNvdFpzn'; // 공유 드라이브
    const folderName = `미리보기-${new Date().toISOString().slice(0, 10)}`;

    const result = await uploadPNGs(pngPaths, academyName, folderName, parentId);
    return result;
  } catch (e) {
    console.log(`  ⚠️ Drive 업로드 실패: ${e.message}`);
    return null;
  }
}

// ── Google Chat 알림 ──

async function sendGChat(message) {
  const webhookUrl = process.env.GCHAT_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('[preview-bot] GCHAT_WEBHOOK_URL 미설정 — 콘솔 출력만');
    console.log(message);
    return;
  }

  await fetch(webhookUrl.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ text: message }),
  });
}

function buildMessage(academyName, changedFiles, beforeUrl, afterUrl, commitInfo) {
  let msg = `🔄 *카드뉴스 설정 변경 미리보기*\n\n`;
  msg += `*학원:* ${academyName}\n`;

  if (commitInfo) {
    msg += `*커밋:* ${commitInfo}\n`;
  }

  if (changedFiles.length > 0) {
    msg += `*변경 파일:*\n`;
    for (const f of changedFiles) {
      msg += `  • ${f}\n`;
    }
  }

  msg += `\n`;

  if (beforeUrl) {
    msg += `📸 *BEFORE:* ${beforeUrl}\n`;
  }
  msg += `📸 *AFTER:* ${afterUrl}\n`;
  msg += `\n_자동 생성된 미리보기입니다. 실제 카드뉴스와 다를 수 있습니다._`;

  return msg;
}

// ── 메인 ──

async function main() {
  const opts = parseArgs();
  const { academies: detectedAcademies, changedFiles } = detectChangedAcademies();

  const targetAcademies = opts.academy
    ? [opts.academy]
    : detectedAcademies.length > 0
      ? detectedAcademies
      : ['jinhak']; // 기본값

  // 커밋 정보
  let commitInfo = '';
  try {
    commitInfo = execSync('git log -1 --format="%h (%an) %s"', { cwd: ROOT, encoding: 'utf-8' }).trim();
  } catch {}

  // academies.json 로드 (학원 이름)
  const academiesConfig = JSON.parse(await readFile(join(ROOT, 'config', 'academies.json'), 'utf-8'));

  for (const academyKey of targetAcademies) {
    if (!SAMPLE_CARDS[academyKey]) {
      console.log(`⚠️ ${academyKey}: 샘플 카드 없음, 스킵`);
      continue;
    }

    const academyName = academiesConfig[academyKey]?.name || academyKey;
    const relevantFiles = changedFiles.filter(f =>
      f.includes(academyKey) || f.startsWith('prompts/') || f.includes('emotion-curve') || f.includes('academies.json')
    );

    console.log(`\n🔄 ${academyName} 미리보기 생성 시작...\n`);

    let beforeUrl = null;
    let afterUrl = null;
    const allPngs = [];

    // ── BEFORE 생성 (이전 설정) ──
    if (!opts.afterOnly) {
      try {
        console.log('── BEFORE (이전 설정) ──');
        const backupDir = await backupConfig();
        await restoreOldConfig();

        // config-loader 캐시 초기화를 위해 새 프로세스처럼 동작
        const beforeDir = join(ROOT, 'output', `preview-before-${academyKey}`);
        const beforePng = await generatePreview(academyKey, beforeDir);
        allPngs.push(beforePng);

        await restoreCurrentConfig(backupDir);
        console.log('');
      } catch (e) {
        console.log(`  ⚠️ BEFORE 생성 실패 (첫 커밋일 수 있음): ${e.message}`);
        // 첫 커밋이면 before가 없을 수 있음
      }
    }

    // ── AFTER 생성 (현재 설정) ──
    console.log('── AFTER (현재 설정) ──');
    const afterDir = join(ROOT, 'output', `preview-after-${academyKey}`);
    const afterPng = await generatePreview(academyKey, afterDir);
    allPngs.push(afterPng);

    // ── Drive 업로드 ──
    const driveResult = await uploadToPreviewFolder(allPngs, academyName);

    if (driveResult?.files) {
      if (driveResult.files.length === 2) {
        beforeUrl = driveResult.files[0].driveUrl;
        afterUrl = driveResult.files[1].driveUrl;
      } else if (driveResult.files.length === 1) {
        afterUrl = driveResult.files[0].driveUrl;
      }
    }

    // 로컬 경로 폴백
    if (!afterUrl) {
      afterUrl = afterPng;
    }

    // ── Google Chat 전송 ──
    const message = buildMessage(academyName, relevantFiles, beforeUrl, afterUrl, commitInfo);
    await sendGChat(message);

    console.log(`\n✅ ${academyName} 미리보기 완료!\n`);
  }
}

main().catch(err => {
  console.error('❌ preview-bot 에러:', err.message);
  process.exit(1);
});
