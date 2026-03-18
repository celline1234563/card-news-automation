import puppeteer from 'puppeteer';
import { mkdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { injectCard, loadTemplate } from '../templates/inject.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ollinoneTheme = {
  name: '올인원 수학학원',
  theme: {
    primary: '#202487',
    secondary: '#fff3c8',
    background: '#F8F8FF',
    text: '#1A1A2E',
    highlight: '#fff3c8',
    accent: '#202487',
  },
};

const jinhakTheme = {
  name: '진학학원',
  theme: {
    primary: '#081459',
    secondary: '#ff871e',
    background: '#F5F6FA',
    text: '#1A1A2E',
    highlight: '#FFE0C0',
    accent: '#ff871e',
  },
};

const testCards = {
  'cover-bold': {
    number: 1, type: 'hook',
    tag: 'EDUCATION',
    headline: '중3 3월, <em>이미 늦었습니다</em>',
    subtext: '지금 시작하지 않으면 고등학교가 무너집니다. 대부분의 학부모가 모르는 수학 선행의 골든타임.',
    emphasis_style: 'highlight',
  },
  'cover-basic': {
    number: 1, type: 'hook',
    tag: 'MATH INSIGHT',
    headline: '수학 성적이 <em>갑자기 떨어지는</em> 진짜 이유',
    subtext: '초등 때 잘하던 아이가 중학교에서 무너지는 구조적 원인을 분석합니다.',
    emphasis_style: 'color',
  },
  'basic-stat': {
    number: 3, type: 'data',
    tag: 'DATA',
    headline: '중3 2학기부터 시작한 학생의 결과',
    stat: '73%',
    stat_label: '가 고1 첫 시험에서 성적 급락을 경험',
    body: '선행학습 없이 고등학교에 입학한 학생 10명 중 7명이 첫 중간고사에서 큰 폭의 성적 하락을 경험합니다.',
    emphasis_style: 'highlight',
  },
  'basic-list': {
    number: 4, type: 'solution',
    tag: 'SOLUTION',
    headline: '올인원이 <em>다른 4가지</em> 이유',
    item_title_1: '1:1 맞춤 커리큘럼',
    item_desc_1: '학생 수준에 맞는 개별화된 학습 로드맵',
    item_title_2: '매일 오답노트 관리',
    item_desc_2: '틀린 문제를 완벽히 소화할 때까지 반복',
    item_title_3: '주간 성적 리포트',
    item_desc_3: '학부모에게 매주 학습 현황 공유',
    item_title_4: '내신+수능 동시 대비',
    item_desc_4: '두 마리 토끼를 잡는 체계적 커리큘럼',
    subtext: '체계적인 시스템으로 수학 실력을 확실하게 올려드립니다',
    emphasis_style: 'highlight',
  },
  'basic-info': {
    number: 5, type: 'info',
    tag: 'PROGRAM',
    headline: '올인원 <em>핵심 프로그램</em>',
    body: '체계적인 4단계 학습 시스템으로 수학 실력을 완성합니다',
    icon_1: '📊', item_title_1: '진단 테스트', item_desc_1: '현재 실력을 정확히 파악하는 맞춤 진단',
    icon_2: '📝', item_title_2: '맞춤 커리큘럼', item_desc_2: '학생별 취약점 집중 보완 계획',
    icon_3: '🔄', item_title_3: '반복 훈련', item_desc_3: '오답 제로까지 완벽한 복습 시스템',
    icon_4: '📈', item_title_4: '성과 관리', item_desc_4: '주간 리포트와 월간 상담으로 관리',
    emphasis_style: 'highlight',
  },
  'basic-compare': {
    number: 6, type: 'compare',
    tag: 'COMPARE',
    headline: '<em>혼자 공부</em> vs 올인원 수학',
    subtext: '같은 시간, 다른 결과',
    before_title: '혼자 공부할 때',
    before_items: '• 어디서부터 해야할지 모름\n• 틀린 문제 그냥 넘어감\n• 진도만 나가고 실력 제자리',
    after_title: '올인원과 함께',
    after_items: '• 정확한 진단 후 맞춤 시작\n• 오답 완전 정복 시스템\n• 매주 체감되는 성적 향상',
    emphasis_style: 'highlight',
  },
  'basic-speech': {
    number: 7, type: 'testimonial',
    tag: 'REAL REVIEW',
    headline: '학부모 <em>생생 후기</em>',
    quote_main: '아이가 수학을 포기하려 했는데, 올인원에서 3개월 만에 30점이 올랐어요. 선생님이 매일 오답노트를 체크해주시니까 아이도 자신감이 생겼나봐요.',
    quote_sub: '처음엔 반신반의했는데, 이제는 스스로 공부하겠다고 학원 가자고 해요.',
    sender: '김',
    subtext: '백현중 2학년 학부모',
    emphasis_style: 'highlight',
  },
  'basic-step-number': {
    number: 8, type: 'process',
    tag: 'STEP BY STEP',
    headline: '올인원 <em>학습 프로세스</em>',
    step_title_1: '실력 진단', step_desc_1: '정확한 현재 수준 파악',
    step_title_2: '맞춤 설계', step_desc_2: '개별 커리큘럼 수립',
    step_title_3: '집중 훈련', step_desc_3: '매일 오답 관리 + 반복',
    step_title_4: '성과 확인', step_desc_4: '주간 리포트 + 월간 상담',
    subtext: '체계적인 4단계로 수학 실력을 완성합니다',
    emphasis_style: 'color',
  },
  'basic-cta': {
    number: 10, type: 'cta',
    headline: '지금 바로 <em>무료 상담</em> 받아보세요',
    subtext: '우리 아이 수학 실력, 정확한 진단부터 시작합니다.',
    cta_text: '3월 한정 무료 진단 테스트',
    cta_sub: '전화 상담 · 방문 상담 · 카카오톡 상담',
    emphasis_style: 'highlight',
  },
};

async function renderAll() {
  const outputDir = join(__dirname, '..', 'output', 'template-test');
  await mkdir(outputDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const configs = [
    { key: 'ollinone', config: ollinoneTheme },
    { key: 'jinhak', config: jinhakTheme },
  ];

  for (const { key, config } of configs) {
    const academyDir = join(outputDir, key);
    await mkdir(academyDir, { recursive: true });

    for (const [templateName, cardData] of Object.entries(testCards)) {
      try {
        const template = await loadTemplate(templateName);
        const html = injectCard(template, cardData, config);

        const page = await browser.newPage();
        await page.setViewport({ width: 1080, height: 1350 });
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.evaluate(() => document.fonts.ready);

        const filename = `${templateName}.png`;
        await page.screenshot({ path: join(academyDir, filename), type: 'png' });
        await page.close();

        console.log(`✅ ${key}/${filename}`);
      } catch (err) {
        console.error(`❌ ${key}/${templateName}: ${err.message}`);
      }
    }
  }

  await browser.close();
  console.log(`\n📁 결과: ${outputDir}`);
}

renderAll().catch(err => {
  console.error('❌ 렌더링 실패:', err.message);
  process.exit(1);
});
