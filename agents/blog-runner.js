import Anthropic from '@anthropic-ai/sdk';
import { readFile, mkdir, appendFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Anthropic();
const MAX_RETRY = 2;
const PASS_SCORE = 7;

// ── 로그 ──

async function log(message) {
  const logDir = join(__dirname, '..', 'logs');
  await mkdir(logDir, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  const logPath = join(logDir, `${today}.log`);
  const timestamp = new Date().toISOString();
  await appendFile(logPath, `[${timestamp}] [blog-runner] ${message}\n`);
  console.log(`  ${message}`);
}

// ── JSON 파싱 헬퍼 ──

function parseJSON(text) {
  let str = text.trim();
  const fence = str.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) str = fence[1].trim();
  return JSON.parse(str);
}

// ── 소스 파일 로드 ──

async function loadSourceFiles(academyKey) {
  const casesPath = join(__dirname, '..', 'data', 'cases', `${academyKey}.md`);
  const linksPath = join(__dirname, '..', 'data', 'links', `${academyKey}.md`);

  const [cases, links] = await Promise.all([
    readFile(casesPath, 'utf-8').catch(() => '(우수 사례 파일 없음)'),
    readFile(linksPath, 'utf-8').catch(() => '(추천글 링크 파일 없음)'),
  ]);

  return { cases, links };
}

// ── STAGE 1: 드래프터 ──

async function draft(topic, academyConfig, cards, comments, cases, links) {
  const systemPrompt = await readFile(
    join(__dirname, '..', 'prompts', 'blog-drafter-system.txt'),
    'utf-8'
  );

  const cardSummary = cards
    .map(c => `카드${c.number}[${c.type}]: ${(c.headline || '').replace(/<\/?em>/g, '')}`)
    .join('\n');

  const userMessage = [
    `주제: ${topic}`,
    `학원명: ${academyConfig.name}`,
    `학원 대상: ${academyConfig.grade?.join(', ') || '학생'}`,
    `학원 과목: ${academyConfig.subject || ''}`,
    `학원 지역: ${academyConfig.region || ''}`,
    `학원 무드: ${academyConfig.mood?.join(', ') || ''}`,
    '',
    '## 카드뉴스 기획안 (소스 자료)',
    cardSummary,
    '',
    comments.length > 0 ? `## 담당자 추가 자료\n${comments.join('\n')}` : '',
    '',
    '## 우수 성과 사례 (활용 가능)',
    cases,
    '',
    '## 추천글 링크 (마무리 섹션에서 선택 사용)',
    links,
    '',
    '위 자료를 바탕으로 블로그 글 전체를 JSON으로 작성해주세요.',
  ].filter(Boolean).join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock) throw new Error('drafter: 응답 텍스트 없음');
  return parseJSON(textBlock.text);
}

// ── STAGE 2: 크리틱 ──

async function critique(sections) {
  const systemPrompt = await readFile(
    join(__dirname, '..', 'prompts', 'blog-critic-system.txt'),
    'utf-8'
  );

  const sectionText = Object.entries(sections)
    .map(([key, value]) => {
      const content = Array.isArray(value) ? value.join('\n') : value;
      return `### ${key}\n${content}`;
    })
    .join('\n\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    system: systemPrompt,
    messages: [{ role: 'user', content: `아래 블로그 초안을 섹션별로 채점해주세요.\n\n${sectionText}` }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock) throw new Error('critic: 응답 텍스트 없음');
  return parseJSON(textBlock.text);
}

// ── STAGE 3: 리라이터 ──

async function rewrite(sections, scoreResult, topic, academyConfig, cases, links) {
  const systemPrompt = await readFile(
    join(__dirname, '..', 'prompts', 'blog-drafter-system.txt'),
    'utf-8'
  );

  const failingSections = scoreResult.failingSections || [];
  const feedbackLines = failingSections.map(key => {
    const s = scoreResult.scores[key];
    return `- ${key}: ${s.score}점 → ${s.feedback}`;
  });

  const currentContent = failingSections.map(key => {
    const value = sections[key];
    const content = Array.isArray(value) ? value.join('\n') : value;
    return `### ${key} (현재 초안)\n${content}`;
  }).join('\n\n');

  const userMessage = [
    `주제: ${topic}`,
    `학원명: ${academyConfig.name}`,
    '',
    '## 재작성 대상 섹션 및 피드백',
    ...feedbackLines,
    '',
    currentContent,
    '',
    '## 우수 성과 사례',
    cases,
    '',
    '## 추천글 링크',
    links,
    '',
    `재작성이 필요한 섹션(${failingSections.join(', ')})만 JSON으로 반환해주세요.`,
    '형식: { "sections": { "섹션키": "내용" } }',
  ].join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 5000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock) throw new Error('rewriter: 응답 텍스트 없음');
  const result = parseJSON(textBlock.text);
  return result.sections || result;
}

// ── 메인: 블로그 파이프라인 ──

/**
 * @param {string} topic - 기사 주제
 * @param {string} academyKey - 학원 키 (ollinone/jinhak/toktok)
 * @param {Object} academyConfig - 학원 설정
 * @param {Array}  cards - researcher.js가 생성한 카드 배열
 * @param {string[]} comments - 노션 댓글 (소스 자료)
 * @returns {{ sections: Object, scores: Object, flagged: boolean }}
 */
export async function runBlog(topic, academyKey, academyConfig, cards, comments = []) {
  await log(`📝 블로그 작성 시작: ${topic}`);

  const { cases, links } = await loadSourceFiles(academyKey);

  // STAGE 1: 초안
  await log('  [1/3] 초안 작성 중...');
  let draftResult = await draft(topic, academyConfig, cards, comments, cases, links);
  let sections = draftResult.sections;

  let bestSections = { ...sections };
  let bestScores = null;
  let flagged = false;

  for (let attempt = 1; attempt <= MAX_RETRY + 1; attempt++) {
    // STAGE 2: 채점
    await log(`  [채점 ${attempt}회차]`);
    const scoreResult = await critique(sections);

    // 점수 로그
    const scoreLines = Object.entries(scoreResult.scores)
      .map(([k, v]) => `${k}:${v.score}`)
      .join(' / ');
    await log(`  점수: ${scoreLines}`);

    // 최고점 갱신
    if (!bestScores) {
      bestScores = scoreResult;
      bestSections = { ...sections };
    } else {
      const avgBest = Object.values(bestScores.scores).reduce((s, v) => s + v.score, 0);
      const avgCurr = Object.values(scoreResult.scores).reduce((s, v) => s + v.score, 0);
      if (avgCurr > avgBest) {
        bestScores = scoreResult;
        bestSections = { ...sections };
      }
    }

    if (scoreResult.allPass) {
      await log('  ✅ 전 섹션 통과!');
      return { sections: bestSections, scores: bestScores.scores, flagged: false };
    }

    if (attempt > MAX_RETRY) break;

    // STAGE 3: 미달 섹션 재작성
    const failing = scoreResult.failingSections || [];
    await log(`  ⚠️  미달 섹션: ${failing.join(', ')} → 재작성`);
    const revised = await rewrite(sections, scoreResult, topic, academyConfig, cases, links);
    sections = { ...sections, ...revised };
  }

  // 최대 재시도 소진
  flagged = true;
  const failList = Object.entries(bestScores.scores)
    .filter(([, v]) => v.score < PASS_SCORE)
    .map(([k, v]) => `${k}(${v.score}점)`)
    .join(', ');
  await log(`  ⚠️  최대 재시도 소진. 플래그 표시. 미달: ${failList}`);

  return { sections: bestSections, scores: bestScores.scores, flagged, failList };
}
