import 'dotenv/config';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as notion from './notion-connector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── 설정 로드 ──

let academiesCache = null;
async function loadAcademies() {
  if (academiesCache) return academiesCache;
  const raw = await readFile(join(__dirname, '..', 'config', 'academies.json'), 'utf-8');
  academiesCache = JSON.parse(raw);
  return academiesCache;
}

let quotasCache = null;
async function loadQuotas() {
  if (quotasCache) return quotasCache;
  const raw = await readFile(join(__dirname, '..', 'config', 'monthly-quota.json'), 'utf-8');
  quotasCache = JSON.parse(raw).quotas;
  return quotasCache;
}

// ── 등급 판별 ──

const GRADE_PATTERNS = [
  { keywords: ['중1', '중2', '중3', '중학'], grade: '중등' },
  { keywords: ['고1', '고2', '고3', '수능', '내신', '고등'], grade: '고등' },
  { keywords: ['초1', '초2', '초3', '초4', '초5', '초6', '초등'], grade: '초등' },
];

export function detectGrade(title, academyConfig) {
  for (const { keywords, grade } of GRADE_PATTERNS) {
    for (const kw of keywords) {
      if (title.includes(kw)) return grade;
    }
  }
  // 키워드 없으면 학원 기본 grade 첫번째 값
  if (academyConfig?.grade?.length > 0) {
    return academyConfig.grade[0];
  }
  return '전체';
}

// ── 쿼터 키 생성 ──

function quotaKey(academyKey, grade) {
  return `${academyKey}-${grade}`;
}

// ── 상태 진행 순서 (뒤로 갈수록 완료에 가까움) ──

const STATUS_ORDER = [
  '기획 착수', '기획 컨펌', '제작 요청',
  '디자인 1차', '디자인 수정', '디자인 수정 완료', '게시완료',
];

function mostAdvancedStatus(statuses) {
  let maxIdx = -1;
  for (const s of statuses) {
    const idx = STATUS_ORDER.indexOf(s);
    if (idx > maxIdx) maxIdx = idx;
  }
  return maxIdx >= 0 ? STATUS_ORDER[maxIdx] : null;
}

// ── ① 완성 카드 집계 (기간 지정) ──

export async function countCompleted(since) {
  const academies = await loadAcademies();

  const completedStatuses = ['디자인 1차', '디자인 수정 완료', '게시완료'];
  const allPages = [];

  for (const status of completedStatuses) {
    const pages = await notion.getByStatus(status);
    allPages.push(...pages);
  }

  const seen = new Set();
  const counts = {};

  for (const page of allPages) {
    if (seen.has(page.id)) continue;
    seen.add(page.id);

    const editedAt = new Date(page.statusChangedAt);
    if (editedAt < since) continue;

    if (!page.academyKey) continue;

    const academy = academies[page.academyKey];
    const grade = detectGrade(page.title, academy);
    const key = quotaKey(page.academyKey, grade);

    counts[key] = (counts[key] || 0) + 1;
  }

  return counts;
}

// ── ② 댓글 없는 "기획 컨펌" 페이지 ──

export async function findPagesWithoutComments() {
  const pages = await notion.getByStatus('기획 컨펌');
  const results = [];

  for (const page of pages) {
    // 이미 다음 단계로 진행된 페이지는 제외
    if (mostAdvancedStatus(page.statuses || []) !== '기획 컨펌') continue;

    const comments = await notion.getComments(page.id);
    if (comments.length === 0) {
      const daysSince = Math.floor(
        (Date.now() - new Date(page.statusChangedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      results.push({
        id: page.id,
        title: page.title,
        academyKey: page.academyKey,
        daysSinceCreated: daysSince,
      });
    }
  }

  return results;
}

// ── ③ 대기 작업 현황 ──

// 등록된 학원 + 실제 주제가 있는 페이지만 필터
function filterRegistered(pages) {
  return pages.filter(p => p.academyKey && notion.extractTopic(p.title).trim().length > 0);
}

export async function getPendingWork() {
  const [planning, design, review] = await Promise.all([
    notion.getByStatus('기획 착수'),
    notion.getByStatus('제작 요청'),
    notion.getByStatus('기획 컨펌'),
  ]);

  const realPlanning = filterRegistered(planning);
  const realDesign = filterRegistered(design);
  const realReview = filterRegistered(review);

  const now = Date.now();
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

  const delayed = realReview.filter(
    p => now - new Date(p.statusChangedAt).getTime() > THREE_DAYS
  );

  return {
    planning: realPlanning.map(p => ({ id: p.id, title: p.title })),
    design: realDesign.map(p => ({ id: p.id, title: p.title })),
    review: delayed.map(p => ({
      id: p.id,
      title: p.title,
      days: Math.floor((now - new Date(p.statusChangedAt).getTime()) / (1000 * 60 * 60 * 24)),
    })),
  };
}

// ── 메시지 포맷 ──

// "전체"면 해당 학원 모든 등급 합산, 아니면 특정 등급만
function countForQuota(quota, counts) {
  if (quota.grade === '전체') {
    let total = 0;
    for (const [key, val] of Object.entries(counts)) {
      if (key.startsWith(quota.academyKey + '-')) total += val;
    }
    return total;
  }
  return counts[quotaKey(quota.academyKey, quota.grade)] || 0;
}

function formatProgressEmoji(pct) {
  if (pct >= 80) return '\u2705';
  if (pct >= 50) return '\u26A0\uFE0F';
  return '\uD83D\uDD34';
}

export async function buildReportText() {
  const quotas = await loadQuotas();
  const academies = await loadAcademies();
  const noComments = await findPagesWithoutComments();
  const pending = await getPendingWork();

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const thisMonthCounts = await countCompleted(thisMonthStart);

  // 월초 (1~5일)에는 지난달 실적도 함께 표시
  const isEarlyMonth = now.getDate() <= 5;
  const lastMonthCounts = isEarlyMonth ? await countCompleted(lastMonthStart) : null;

  const monthLabel = `${now.getMonth() + 1}월`;
  const lastMonthLabel = `${now.getMonth() || 12}월`;

  const lines = [];

  lines.push(`\uD83D\uDCCA \uCE74\uB4DC\uB274\uC2A4 \uC77C\uC77C \uB9AC\uD3EC\uD2B8 (${today})`);
  lines.push('');
  lines.push(`\u2501\u2501\u2501 ${monthLabel} \uCFFC\uD130 \uD604\uD669 \u2501\u2501\u2501`);

  for (const q of quotas) {
    const academy = academies[q.academyKey];
    const prefix = academy?.notion_prefix || q.academyKey;
    const done = countForQuota(q, thisMonthCounts);
    const pct = Math.round((done / q.monthly) * 100);
    const emoji = formatProgressEmoji(pct);
    lines.push(`${prefix} ${q.grade}: ${done}/${q.monthly} (${pct}%) ${emoji}`);
  }

  if (isEarlyMonth && lastMonthCounts) {
    lines.push('');
    lines.push(`\u2501\u2501\u2501 ${lastMonthLabel} \uC2E4\uC801 \u2501\u2501\u2501`);
    for (const q of quotas) {
      const academy = academies[q.academyKey];
      const prefix = academy?.notion_prefix || q.academyKey;
      const totalSinceLast = countForQuota(q, lastMonthCounts);
      const thisMonth = countForQuota(q, thisMonthCounts);
      const lastOnly = totalSinceLast - thisMonth;
      const pct = Math.round((lastOnly / q.monthly) * 100);
      const emoji = formatProgressEmoji(pct);
      lines.push(`${prefix} ${q.grade}: ${lastOnly}/${q.monthly} (${pct}%) ${emoji}`);
    }
  }

  if (noComments.length > 0) {
    lines.push('');
    lines.push('\u2501\u2501\u2501 \uB313\uAE00 \uD544\uC694 \u2501\u2501\u2501');
    for (const page of noComments) {
      lines.push(`\u2022 ${page.title} (${page.daysSinceCreated}\uC77C\uC9F8 \uB300\uAE30)`);
    }
  }

  const hasPending = pending.planning.length > 0 || pending.design.length > 0 || pending.review.length > 0;
  if (hasPending) {
    lines.push('');
    lines.push('\u2501\u2501\u2501 \uB300\uAE30 \uC791\uC5C5 \u2501\u2501\u2501');
    if (pending.planning.length > 0) {
      lines.push(`\uAE30\uD68D \uD544\uC694: ${pending.planning.length}\uAC74`);
    }
    if (pending.design.length > 0) {
      lines.push(`\uB514\uC790\uC778 \uD544\uC694: ${pending.design.length}\uAC74`);
    }
    if (pending.review.length > 0) {
      lines.push(`\uAC80\uD1A0 \uC9C0\uC5F0: ${pending.review.length}\uAC74 (3\uC77C+)`);
    }
  }

  if (noComments.length === 0 && !hasPending) {
    lines.push('');
    lines.push('\u2501\u2501\u2501 \uC0C1\uD0DC \u2501\u2501\u2501');
    lines.push('\uBAA8\uB4E0 \uC791\uC5C5\uC774 \uC815\uC0C1 \uC9C4\uD589 \uC911\uC785\uB2C8\uB2E4.');
  }

  return lines.join('\n');
}

// ── Google Chat 웹훅 전송 ──

async function sendToGChat(text) {
  const webhookUrl = process.env.GCHAT_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log('[daily-reporter] GCHAT_WEBHOOK_URL 미설정 — 콘솔 출력만');
    console.log(text);
    return { sent: false, reason: 'no_webhook_url' };
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`Google Chat 전송 실패: ${response.status} ${response.statusText}`);
  }

  return { sent: true };
}

// ── 전체 리포트 생성 + 전송 ──

export async function sendDailyReport() {
  const text = await buildReportText();
  return await sendToGChat(text);
}
