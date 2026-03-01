#!/usr/bin/env node
/**
 * 직원용 업무 가이드 CLI
 *
 * 사용법:
 *   npm run guide
 *   node scripts/employee-guide.js
 */

import { createInterface } from 'readline';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── 터미널 유틸 ──

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';
const BG_CYAN = '\x1b[46m\x1b[30m';
const BG_GREEN = '\x1b[42m\x1b[30m';

function header(text) {
  console.log(`\n${BG_CYAN} ${text} ${RESET}\n`);
}

function success(text) {
  console.log(`${GREEN}✓${RESET} ${text}`);
}

function info(text) {
  console.log(`${CYAN}ℹ${RESET} ${text}`);
}

function menuItem(num, text, desc) {
  console.log(`  ${BOLD}${YELLOW}${num}${RESET}  ${text}  ${DIM}${desc || ''}${RESET}`);
}

// ── 학원 정보 로드 ──

async function loadAcademies() {
  const raw = await readFile(join(ROOT, 'config', 'academies.json'), 'utf-8');
  return JSON.parse(raw);
}

// ── 학원 선택 ──

async function selectAcademy(academies) {
  header('카드뉴스 자동화 — 직원 업무 가이드');

  console.log('  담당 학원을 선택하세요:\n');

  const keys = Object.keys(academies);
  keys.forEach((key, i) => {
    const a = academies[key];
    const color = a.theme.primary;
    menuItem(i + 1, a.name, `${a.subject} · ${a.region || a.speciality?.join(', ') || ''}`);
  });

  console.log('');
  const choice = await ask(`  번호 입력 (1-${keys.length}): `);
  const idx = parseInt(choice) - 1;

  if (idx < 0 || idx >= keys.length) {
    console.log('\n  잘못된 번호입니다. 다시 실행해주세요.');
    rl.close();
    process.exit(1);
  }

  return keys[idx];
}

// ── 메인 메뉴 ──

async function mainMenu(academyKey, academies) {
  const academy = academies[academyKey];

  while (true) {
    header(`${academy.name} — 무엇을 하시겠습니까?`);

    menuItem(1, '브랜드 전략 수정', `${academyKey}-strategy.md — 타겟, 페르소나, 콘텐츠 방향`);
    menuItem(2, '말투·표현 수정', `${academyKey}-voice.md — 헤드라인 공식, DO/DON'T`);
    menuItem(3, '디자인 토큰 수정', `${academyKey}-tokens.json — 색상, 글씨 크기, 그림자`);
    menuItem(4, '감정 곡선 수정', `emotion-curve.json — 카드 10장 감정 흐름`);
    menuItem(5, '미리보기 생성', '현재 설정으로 샘플 카드 미리보기');
    menuItem(6, '변경사항 저장 & 반영', 'git 커밋 + 푸시 (자동 배포)');
    menuItem(0, '종료', '');

    console.log('');
    const choice = await ask('  번호 입력: ');

    switch (choice.trim()) {
      case '1': await editStrategy(academyKey); break;
      case '2': await editVoice(academyKey); break;
      case '3': await editTokens(academyKey); break;
      case '4': await editEmotionCurve(); break;
      case '5': await runPreview(academyKey); break;
      case '6': await commitAndPush(academyKey, academy.name); break;
      case '0':
        console.log('\n  수고하셨습니다!\n');
        rl.close();
        return;
      default:
        console.log('\n  잘못된 번호입니다.\n');
    }
  }
}

// ── 파일 편집 안내 ──

async function editStrategy(academyKey) {
  const filePath = `config/brand/${academyKey}-strategy.md`;
  const fullPath = join(ROOT, filePath);

  header('브랜드 전략 수정');

  console.log('  이 파일을 수정하면 AI가 기획하는 주제·톤·타겟이 바뀝니다.\n');
  console.log('  자주 수정하는 부분:');
  console.log(`  ${DIM}├${RESET} 페르소나 — 타겟 학부모 프로필`);
  console.log(`  ${DIM}├${RESET} 무드 키워드 — 디자인 분위기`);
  console.log(`  ${DIM}├${RESET} 콘텐츠 카테고리 — 주력 콘텐츠 비중`);
  console.log(`  ${DIM}└${RESET} 타겟 학교 — 학교명 추가/삭제\n`);

  info(`파일 위치: ${BOLD}${filePath}${RESET}`);

  await showFilePreview(fullPath, 30);
  await askOpenFile(fullPath);
}

async function editVoice(academyKey) {
  const filePath = `config/brand/${academyKey}-voice.md`;
  const fullPath = join(ROOT, filePath);

  header('말투·표현 가이드 수정');

  console.log('  이 파일을 수정하면 AI가 쓰는 헤드라인·카피의 말투가 바뀝니다.\n');
  console.log('  자주 수정하는 부분:');
  console.log(`  ${DIM}├${RESET} 헤드라인 공식 — 스타일과 예시`);
  console.log(`  ${DIM}├${RESET} DO/DON'T — 좋은 표현 / 나쁜 표현`);
  console.log(`  ${DIM}└${RESET} 금지 표현 — 계속 나오는 안 좋은 표현 추가\n`);

  info(`파일 위치: ${BOLD}${filePath}${RESET}`);
  console.log(`\n  ${MAGENTA}팁:${RESET} 결과물에서 "이건 별로다" 싶은 표현이 보이면`);
  console.log(`      DON'T 리스트에 바로 추가하세요.\n`);

  await showFilePreview(fullPath, 30);
  await askOpenFile(fullPath);
}

async function editTokens(academyKey) {
  const filePath = `config/tokens/${academyKey}-tokens.json`;
  const fullPath = join(ROOT, filePath);

  header('디자인 토큰 수정');

  console.log('  이 파일을 수정하면 카드뉴스의 색상·글씨 크기·그림자가 바뀝니다.\n');
  console.log('  자주 수정하는 부분:');
  console.log(`  ${DIM}├${RESET} typography.size — 글씨 크기 (h1=48, body=24 등)`);
  console.log(`  ${DIM}├${RESET} color.primary — 메인 색상 (academies.json도 같이!)`);
  console.log(`  ${DIM}├${RESET} effects.overlay — 오버레이 투명도`);
  console.log(`  ${DIM}└${RESET} effects.shadow — 그림자 강도\n`);

  info(`파일 위치: ${BOLD}${filePath}${RESET}`);
  console.log(`\n  ${YELLOW}주의:${RESET} 메인 컬러를 바꾸면 ${BOLD}config/academies.json${RESET}의`);
  console.log(`       theme 섹션도 같은 값으로 수정하세요.\n`);

  await showFilePreview(fullPath, 20);
  await askOpenFile(fullPath);
}

async function editEmotionCurve() {
  const filePath = 'config/brand/emotion-curve.json';
  const fullPath = join(ROOT, filePath);

  header('감정 곡선 수정');

  console.log('  카드 10장의 감정 흐름을 조절합니다. (모든 학원 공용)\n');
  console.log('  각 카드의:');
  console.log(`  ${DIM}├${RESET} emotion — 감정 목표 ("충격" → "호기심" 등)`);
  console.log(`  ${DIM}├${RESET} intensity — 강도 1~10 (높을수록 강렬)`);
  console.log(`  ${DIM}└${RESET} description — AI에게 주는 설명\n`);

  info(`파일 위치: ${BOLD}${filePath}${RESET}`);

  await showFilePreview(fullPath, 25);
  await askOpenFile(fullPath);
}

// ── 미리보기 실행 ──

async function runPreview(academyKey) {
  header('미리보기 생성');

  console.log(`  현재 설정으로 ${BOLD}${academyKey}${RESET} 샘플 카드를 생성합니다.`);
  console.log(`  ${DIM}(Gemini API + Puppeteer 사용, 약 30초 소요)${RESET}\n`);

  const confirm = await ask('  실행할까요? (y/n): ');
  if (confirm.trim().toLowerCase() !== 'y') return;

  console.log('');
  try {
    execSync(`node scripts/preview-bot.js --academy ${academyKey} --after-only`, {
      cwd: ROOT,
      stdio: 'inherit',
    });
  } catch {
    console.log(`\n  ${YELLOW}미리보기 생성 중 오류가 발생했습니다.${RESET}`);
    console.log(`  ${DIM}.env 파일의 GOOGLE_AI_API_KEY를 확인하세요.${RESET}\n`);
  }
}

// ── 커밋 & 푸시 ──

async function commitAndPush(academyKey, academyName) {
  header('변경사항 저장 & 반영');

  // git status 확인
  let status;
  try {
    status = execSync('git status --short', { cwd: ROOT, encoding: 'utf-8' }).trim();
  } catch {
    console.log('  git이 설치되어 있지 않거나 저장소가 아닙니다.\n');
    return;
  }

  if (!status) {
    console.log('  변경된 파일이 없습니다.\n');
    return;
  }

  console.log('  변경된 파일:\n');
  for (const line of status.split('\n')) {
    console.log(`    ${GREEN}${line}${RESET}`);
  }

  console.log('');
  const msg = await ask(`  변경 내용을 한 줄로 설명해주세요\n  (예: "헤드라인 공식 추가", "글씨 크기 조절")\n  > `);

  if (!msg.trim()) {
    console.log('\n  설명이 비어있어 취소합니다.\n');
    return;
  }

  const confirm = await ask(`\n  커밋하고 푸시할까요? (y/n): `);
  if (confirm.trim().toLowerCase() !== 'y') return;

  try {
    execSync('git add config/ prompts/', { cwd: ROOT, encoding: 'utf-8' });
    execSync(`git commit -m "${academyName} 설정 업데이트: ${msg.trim().replace(/"/g, '\\"')}"`, {
      cwd: ROOT,
      encoding: 'utf-8',
    });
    execSync('git push', { cwd: ROOT, stdio: 'inherit' });

    console.log('');
    success('푸시 완료! Railway가 자동 배포합니다.');
    success('설정 변경 미리보기가 곧 Google Chat에 도착합니다.\n');
  } catch (e) {
    console.log(`\n  ${YELLOW}푸시 실패: ${e.message}${RESET}`);
    console.log(`  ${DIM}네트워크 연결을 확인하거나 관리자에게 문의하세요.${RESET}\n`);
  }
}

// ── 유틸 ──

async function showFilePreview(fullPath, lines) {
  try {
    const content = await readFile(fullPath, 'utf-8');
    const preview = content.split('\n').slice(0, lines).join('\n');
    console.log(`${DIM}${'─'.repeat(60)}${RESET}`);
    console.log(`${DIM}${preview}${RESET}`);
    console.log(`${DIM}${'─'.repeat(60)}${RESET}`);
    if (content.split('\n').length > lines) {
      console.log(`${DIM}  ... (${content.split('\n').length - lines}줄 더 있음)${RESET}\n`);
    }
  } catch {
    console.log(`  ${YELLOW}파일을 읽을 수 없습니다.${RESET}\n`);
  }
}

async function askOpenFile(fullPath) {
  const answer = await ask('\n  이 파일을 에디터에서 열까요? (y/n): ');
  if (answer.trim().toLowerCase() === 'y') {
    try {
      // macOS: VS Code 또는 기본 에디터
      try {
        execSync(`code "${fullPath}"`, { stdio: 'ignore' });
        success('VS Code에서 열었습니다.\n');
      } catch {
        execSync(`open "${fullPath}"`, { stdio: 'ignore' });
        success('기본 에디터에서 열었습니다.\n');
      }
    } catch {
      info(`직접 열어주세요: ${fullPath}\n`);
    }
  }
  console.log('');
}

// ── 실행 ──

async function main() {
  const academies = await loadAcademies();
  const academyKey = await selectAcademy(academies);
  await mainMenu(academyKey, academies);
}

main().catch((err) => {
  console.error('오류:', err.message);
  rl.close();
  process.exit(1);
});
