import 'dotenv/config';
import { readFile, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { renderCards } from '../agents/renderer.js';
import { appendFilePaths } from '../agents/notion-connector.js';
import { loadConfig } from '../agents/config-loader.js';

// ── 설정 ──
const ACADEMY_KEY = 'ollinone';
const PAGE_ID = '3066efb1-2186-808e-a5a6-c77e2ffd977c';
const OUTPUT_DIR = resolve('output/올인원 수학학원-이화여대-의대-합격-후기-2026-03-12');
const COPY_PATH = join(OUTPUT_DIR, 'copy.json');

async function main() {
  console.log('=== em 텍스트 가시성 수정 스크립트 ===\n');

  // 1. copy.json 읽기
  console.log('1. copy.json 읽는 중...');
  const raw = await readFile(COPY_PATH, 'utf-8');
  const data = JSON.parse(raw);
  const cards = data.cards;
  console.log(`   ${cards.length}장 카드 로드 완료\n`);

  // 2. 카드 1, 9, 10 — em 텍스트 가시성 수정
  //    문제: 다크 배경(--color-primary)에서 em 텍스트 색상이 var(--color-primary)로 설정되어
  //          배경과 동일한 색상으로 보이지 않음
  //    해결: em 텍스트를 var(--color-text) (#1A1A2E) 로 변경하여 밝은 하이라이트 배경 위에서 잘 보이게 함

  const emFixCards = [1, 9, 10];
  for (const cardNum of emFixCards) {
    const card = cards.find(c => c.number === cardNum);
    if (!card || !card.generated_html) {
      console.log(`   카드 ${cardNum}: generated_html 없음, 건너뜀`);
      continue;
    }

    let html = card.generated_html;
    let fixed = false;

    // 패턴 1: .headline em { ... color: var(--color-primary); ... }
    // 카드 1의 패턴
    html = html.replace(
      /\.headline\s+em\s*\{([^}]*?)color:\s*var\(--color-primary\)/g,
      (match, before) => {
        fixed = true;
        return `.headline em {${before}color: var(--color-text)`;
      }
    );

    // 패턴 2: 전역 em { ... color: var(--color-primary); ... } (카드 9, 10)
    html = html.replace(
      /(\n\s*em\s*\{[^}]*?)color:\s*var\(--color-primary\)/g,
      (match, before) => {
        fixed = true;
        return `${before}color: var(--color-text)`;
      }
    );

    // 패턴 3: .headline em 안의 color: var(--color-primary) (카드 10의 .headline em)
    // 이미 패턴 1에서 처리됨

    if (fixed) {
      card.generated_html = html;
      console.log(`   카드 ${String(cardNum).padStart(2, '0')}: em 텍스트 색상 수정 완료 (var(--color-primary) → var(--color-text))`);
    } else {
      console.log(`   카드 ${String(cardNum).padStart(2, '0')}: 수정 대상 패턴을 찾지 못함`);
    }
  }

  // 3. 카드 5 — 오버플로우 수정
  //    문제: body overflow: hidden + 4개 step-item이 들어가면서 "멘탈 관리" 항목이 잘림
  //    해결: body overflow를 visible로, 컨테이너/step 패딩 축소, 폰트 크기 조정
  console.log('');
  const card5 = cards.find(c => c.number === 5);
  if (card5 && card5.generated_html) {
    let html = card5.generated_html;
    let fixed5 = false;

    // overflow: hidden → overflow: visible
    html = html.replace(
      /body\s*\{([^}]*?)overflow:\s*hidden/g,
      (match, before) => {
        fixed5 = true;
        return `body {${before}overflow: visible`;
      }
    );

    // .container 내부 overflow: hidden 제거
    html = html.replace(
      /\.container\s*\{([^}]*?)overflow:\s*hidden[^}]*/g,
      (match) => {
        fixed5 = true;
        return match.replace('overflow: hidden', 'overflow: visible');
      }
    );

    // subtext 하단 마진 축소 (space-3xl → space-xl)
    html = html.replace(
      /\.subtext\s*\{([^}]*?)margin-bottom:\s*var\(--space-3xl\)/g,
      (match, before) => {
        fixed5 = true;
        return `.subtext {${before}margin-bottom: var(--space-xl)`;
      }
    );

    // 아이콘 컨테이너 하단 마진 축소
    html = html.replace(
      /\.icon-container\s*\{([^}]*?)margin-bottom:\s*var\(--space-lg\)/g,
      (match, before) => {
        fixed5 = true;
        return `.icon-container {${before}margin-bottom: var(--space-md)`;
      }
    );

    // headline 폰트 크기 축소 (64px → 52px)
    html = html.replace(
      /\.headline\s*\{([^}]*?)font-size:\s*64px/g,
      (match, before) => {
        fixed5 = true;
        return `.headline {${before}font-size: 52px`;
      }
    );

    // step-item 패딩 축소
    html = html.replace(
      /\.step-item\s*\{([^}]*?)padding:\s*var\(--space-xl\)/g,
      (match, before) => {
        fixed5 = true;
        return `.step-item {${before}padding: var(--space-lg)`;
      }
    );

    // subtext의 margin-bottom에 var(--space-4xl) 이 있으면 줄이기
    html = html.replace(
      /\.subtext\s*\{([^}]*?)margin-bottom:\s*var\(--space-4xl\)/g,
      (match, before) => {
        fixed5 = true;
        return `.subtext {${before}margin-bottom: var(--space-xl)`;
      }
    );

    if (fixed5) {
      card5.generated_html = html;
      console.log('   카드 05: 오버플로우 수정 완료 (overflow: visible, 패딩/마진 축소)');
    } else {
      console.log('   카드 05: 수정 대상 패턴을 찾지 못함');
    }
  }

  // 4. 수정된 copy.json 저장
  console.log('\n2. copy.json 저장 중...');
  await writeFile(COPY_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log('   copy.json 저장 완료\n');

  // 5. 학원 설정 로드 + 렌더링
  console.log('3. 학원 설정 로드 + PNG 렌더링...');
  const { academy, cssVariables } = await loadConfig(ACADEMY_KEY);
  const { htmlSources } = await renderCards(cards, cssVariables, academy.name, OUTPUT_DIR);
  console.log('   PNG 렌더링 완료\n');

  // 6. 노션 업로드
  console.log('4. 노션에 PNG 업로드 중...');
  const pngPaths = cards.map(c =>
    join(OUTPUT_DIR, `card-${String(c.number).padStart(2, '0')}.png`)
  );
  await appendFilePaths(
    PAGE_ID,
    pngPaths,
    '이화여대 의대 합격 후기',
    academy.name,
    academy.drive_folder_id || null,
    htmlSources
  );
  console.log('   노션 업로드 완료\n');

  console.log('=== 완료 ===');
}

main().catch(err => {
  console.error('오류 발생:', err);
  process.exit(1);
});
