/**
 * 에리브 월간 퍼널 구조도 — 매월 25일, 다음 달 콘텐츠를 퍼널 순서로 정리해 노션 페이지로 만든다.
 *
 *   키워드·관심사(카페 원장님 말) → 노출(인스타·유튜브) → 회사 블로그·웨비나 → 진단서·챌린지
 *
 * 노출 칸(릴스·유튜브·캐러셀)마다 "어느 블로그·웨비나로 보낼지"를 붙이고,
 * 받을 곳이 없거나 주제가 어긋난 칸, 웨비나로 보내는 콘텐츠가 없는 주를 점검으로 남긴다.
 *
 *   node scripts/brand-funnel-map.js              다음 달 구조도 (이미 있으면 건너뜀)
 *   node scripts/brand-funnel-map.js 2026-11      그 달 구조도
 *   node scripts/brand-funnel-map.js 2026-11 --force   이미 있으면 내용을 새로 씀
 *   node scripts/brand-funnel-map.js 2026-11 --dry     노션에 쓰지 않고 결과만 출력
 *
 * 폴러가 매월 25일 10시(KST) 이후 한 번 부른다 — checkFunnelMap().
 * 페이지가 이미 있으면 다시 만들지 않으므로 재시작해도 중복 생성되지 않는다.
 *
 * 연결 판단은 Gemini 1회 호출. 실패하면 같은 카페 키워드·날짜 규칙으로 대신 잡는다.
 */
import 'dotenv/config';
import { Client } from '@notionhq/client';
import { GoogleGenAI } from '@google/genai';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATASOURCE_ID = process.env.NOTION_DATASOURCE_ID;
// 비우면 콘텐츠 캘린더 DB 의 행으로 만든다. 특정 페이지 안에 넣고 싶으면 그 페이지 ID 를 넣는다.
const PARENT_PAGE_ID = process.env.ERIB_FUNNEL_PARENT_PAGE_ID || '';
const MODEL = 'gemini-2.5-flash';

const RUN_DAY = 25;
const RUN_HOUR = 10;

// 블로그·웨비나 다음 칸 — 퍼널의 마지막 행동
const FINAL = { blog: '진단서', webinar: '챌린지' };

const KIND_LABEL = { reel: '릴스', youtube: '유튜브', carousel: '캐러셀', blog: '블로그', webinar: '웨비나' };
const EXPOSURE = new Set(['reel', 'youtube', 'carousel']);

// '[에리브' 로 시작하면 자사 자동화(발행·일일 기획)가 집어갈 수 있어 다른 접두어를 쓴다
export function funnelTitle(year, month) {
  return `에리브 퍼널 구조도 · ${year}년 ${month}월`;
}

// ── 날짜 ──

function kstNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
}

function iso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseISO(s) {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function daysBetween(a, b) {
  return Math.round((parseISO(b) - parseISO(a)) / 86400000);
}

function md(s) {
  const d = parseISO(s);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * 월~일 주 단위로 자르고 그 달 밖은 잘라낸다. 3일이 안 되는 첫·마지막 조각은 옆 주에 붙인다.
 * @returns {{ start: string, end: string }[]}
 */
export function monthWeeks(year, month) {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const weeks = [];
  let cur = first;
  while (cur <= last) {
    const toSunday = (7 - cur.getDay()) % 7;
    const end = addDays(cur, toSunday) > last ? last : addDays(cur, toSunday);
    weeks.push({ start: iso(cur), end: iso(end) });
    cur = addDays(end, 1);
  }
  const len = (w) => daysBetween(w.start, w.end) + 1;
  if (weeks.length > 1 && len(weeks[0]) < 3) {
    weeks[1].start = weeks[0].start;
    weeks.shift();
  }
  if (weeks.length > 1 && len(weeks.at(-1)) < 3) {
    weeks.at(-2).end = weeks.at(-1).end;
    weeks.pop();
  }
  return weeks;
}

// ── 노션 읽기 ──

async function withRetry(fn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.status || err?.code;
      const retryable = status === 429 || status === 500 || status === 502 || status === 503;
      if (!retryable || attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    }
  }
}

const plain = (rt) => (rt ?? []).map((x) => x.plain_text).join('');

export function classifyKind(title, statuses) {
  if (/^\[에리브\s*릴스\]/.test(title)) return 'reel';
  if (/^\[에리브\s*유튜브\]/.test(title)) return 'youtube';
  if (/^\[에리브\s*블로그\]/.test(title)) return 'blog';
  if (/^\[에리브\s*웨비나\]/.test(title)) return 'webinar';
  if (/^\[에리브·/.test(title)) return 'carousel';
  if (statuses.includes('릴스')) return 'reel';
  if (statuses.includes('유튜브')) return 'youtube';
  if (statuses.includes('블로그')) return 'blog';
  return null;
}

/** "카페: 채점지옥 (634) · 수학 개별진도 고민 (801)" → [{ text, count }] */
export function cafeKeywords(keyword) {
  const m = String(keyword || '').match(/^카페:\s*(.+)$/);
  if (!m) return [];
  return m[1].split(/\s+·\s+/).map((s) => {
    const c = s.match(/^(.*?)\s*\(([\d,]+)\)\s*$/);
    return c ? { text: c[1].trim(), count: Number(c[2].replace(/,/g, '')) } : { text: s.trim(), count: 0 };
  }).filter((k) => k.text);
}

async function fetchRows(fromISO, toISO) {
  const rows = [];
  let cursor;
  do {
    const r = await withRetry(() => notion.dataSources.query({
      data_source_id: DATASOURCE_ID,
      start_cursor: cursor,
      filter: {
        and: [
          { property: 'Name', title: { contains: '에리브' } },
          { property: '컨텐츠 발행일', date: { on_or_after: fromISO } },
          { property: '컨텐츠 발행일', date: { on_or_before: toISO } },
        ],
      },
    }));
    rows.push(...r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);

  return rows.map((p) => {
    const props = p.properties;
    const title = plain(props.Name?.title);
    const statuses = (props['상태']?.multi_select ?? []).map((x) => x.name);
    const keyword = plain(props['메인 키워드']?.rich_text);
    return {
      id: p.id,
      title,
      label: title.replace(/^\[[^\]]*\]\s*/, '').replace(/\s*\[[^\]]*\]\s*$/, '').trim(),
      date: props['컨텐츠 발행일']?.date?.start?.slice(0, 10),
      statuses,
      kind: classifyKind(title, statuses),
      keyword,
      cafe: cafeKeywords(keyword),
      note: plain(props['비고']?.rich_text),
    };
  }).filter((r) => r.kind && r.date && !r.statuses.includes('대체 완료'));
}

// ── 연결 판단 ──

/** 노출 칸이 보낼 수 있는 블로그·웨비나 — 웨비나는 그 날 이후 14일 안, 블로그는 앞뒤 14일 */
export function allowedTargets(item, mids) {
  return mids.filter((m) => {
    const gap = daysBetween(item.date, m.date);
    if (m.kind === 'webinar') return gap >= 0 && gap <= 14;
    return gap >= -14 && gap <= 14;
  });
}

/** Gemini 없이 잡는 규칙: 같은 카페 글 → 맞음 / 가까운 웨비나·블로그 → 약함 */
export function heuristicLink(item, allowed) {
  const mine = new Set(item.cafe.map((k) => k.text));
  const shared = allowed.find((m) => m.cafe.some((k) => mine.has(k.text)));
  if (shared) return { targetId: shared.id, fit: 'good', reason: '' };
  const near = [...allowed].sort((a, b) => Math.abs(daysBetween(item.date, a.date)) - Math.abs(daysBetween(item.date, b.date)))[0];
  if (near) return { targetId: near.id, fit: 'weak', reason: '주제 확인 필요 (자동 판단 실패)' };
  return { targetId: null, fit: 'none', reason: '앞뒤 2주 안에 블로그·웨비나 없음' };
}

async function askGeminiLinks(items, mids) {
  if (!process.env.GOOGLE_AI_API_KEY) throw new Error('GOOGLE_AI_API_KEY 없음');
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
  const line = (r) => `${r.id} | ${r.date} | ${KIND_LABEL[r.kind]} | ${r.label}${r.keyword ? ` | ${r.keyword}` : ''}`;
  const prompt = [
    '학원 원장님 대상 B2B 콘텐츠 퍼널이다: 키워드 → 노출(릴스·유튜브·캐러셀) → 회사 블로그·웨비나 → 진단서·챌린지.',
    '노출 콘텐츠 각각을 끝에서 어느 블로그 또는 웨비나로 보낼지 하나 고른다.',
    '',
    '규칙',
    '- 후보는 그 노출 콘텐츠의 allowed 목록 안에서만 고른다. 없으면 null.',
    '- fit "good" 은 그 블로그·웨비나가 노출 콘텐츠를 본 원장님의 바로 그 고민을 이어서 다룰 때만. 같은 큰 분야(운영·마케팅·강사)라는 것만으로는 good 이 아니다.',
    '- 주제가 어긋나지만 보낼 곳이 그나마 그것이면 "weak". 이어지는 게 전혀 없으면 target null, "none".',
    '- 같은 주(날짜 차이 7일 안) 블로그·웨비나를 먼저 본다. 둘 다 good 이면 날짜가 가까운 웨비나를 블로그보다 우선한다.',
    '- weak·none 이면 reason 에 이유를 한국어 20자 안으로. good 이면 빈 문자열.',
    '',
    '블로그·웨비나',
    ...mids.map(line),
    '',
    '노출 콘텐츠 (allowed = 고를 수 있는 블로그·웨비나 id)',
    ...items.map((it) => `${line(it)} | allowed: ${allowedTargets(it, mids).map((m) => m.id).join(', ') || '없음'}`),
    '',
    '응답 JSON: {"links":[{"id":"<노출 id>","target":"<블로그·웨비나 id 또는 null>","fit":"good|weak|none","reason":""}]}',
  ].join('\n');

  let r;
  // 503(과부하)·분당 429 는 잠깐 뒤 풀린다. 일일 한도는 기다려도 안 풀리니 바로 규칙으로 넘긴다
  for (let attempt = 1; ; attempt++) {
    try {
      r = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      break;
    } catch (err) {
      const msg = String(err?.message ?? '');
      const daily = /PerDay|per day|free_tier_requests/i.test(msg);
      const retryable = !daily && (/\b(429|500|502|503|504)\b/.test(msg) || /UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded/i.test(msg));
      if (!retryable || attempt === 5) throw err;
      await new Promise((res) => setTimeout(res, 10000 * attempt));
    }
  }
  const raw = (r.text ?? '').trim();
  const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw);
  return new Map((json.links ?? []).map((l) => [l.id, l]));
}

async function linkAll(items, mids) {
  let fromModel = new Map();
  let engine = 'gemini';
  try {
    fromModel = await askGeminiLinks(items, mids);
  } catch (e) {
    engine = 'rule';
    console.log(`  ⚠️ Gemini 연결 판단 실패 — 규칙으로 대신 잡음: ${e.message.split('\n')[0]}`);
  }
  const links = new Map();
  for (const it of items) {
    const allowed = allowedTargets(it, mids);
    const g = fromModel.get(it.id);
    const ok = g && ['good', 'weak', 'none'].includes(g.fit)
      && (g.target == null ? g.fit === 'none' : allowed.some((m) => m.id === g.target));
    links.set(it.id, ok
      ? { targetId: g.target ?? null, fit: g.fit, reason: String(g.reason ?? '').slice(0, 40) }
      : heuristicLink(it, allowed));
  }
  return { links, engine };
}

// ── 구조 만들기 ──

/** 노출 = 그 달 릴스·유튜브·캐러셀 / 받는 곳 = 그 달 블로그(전 주 포함)·웨비나(다음 달 2주까지) */
export function splitRows(rows, monthStart, monthEnd) {
  const exposure = rows.filter((r) => EXPOSURE.has(r.kind) && r.date >= monthStart && r.date <= monthEnd);
  const mids = rows.filter((r) => (r.kind === 'blog' && r.date >= iso(addDays(parseISO(monthStart), -7)) && r.date <= monthEnd)
    || (r.kind === 'webinar' && r.date >= monthStart && r.date <= iso(addDays(parseISO(monthEnd), 14))));
  return { exposure, mids };
}

export function buildMap({ year, month, rows, links }) {
  const weeks = monthWeeks(year, month).map((w) => ({ ...w, exposure: [], mids: [] }));
  const monthStart = weeks[0].start;
  const monthEnd = weeks.at(-1).end;
  const weekOf = (date) => {
    if (date < monthStart) return weeks[0];
    if (date > monthEnd) return weeks.at(-1);
    return weeks.find((w) => date >= w.start && date <= w.end);
  };
  const byId = new Map(rows.map((r) => [r.id, r]));

  const { exposure, mids } = splitRows(rows, monthStart, monthEnd);

  for (const r of exposure) weekOf(r.date).exposure.push({ ...r, link: links.get(r.id) });
  for (const m of mids) {
    // 다음 달 초 웨비나는 그 달 안에서 홍보할 때만 이 구조도에 넣는다
    if (m.date > monthEnd && ![...links.values()].some((l) => l.targetId === m.id)) continue;
    weekOf(m.date).mids.push(m);
  }
  for (const w of weeks) {
    w.exposure.sort((a, b) => a.date.localeCompare(b.date));
    w.mids.sort((a, b) => a.date.localeCompare(b.date));
    const seen = new Map();
    for (const r of [...w.exposure, ...w.mids]) {
      for (const k of r.cafe) if (!seen.has(k.text) || seen.get(k.text) < k.count) seen.set(k.text, k.count);
    }
    w.keywords = [...seen].map(([text, count]) => ({ text, count })).sort((a, b) => b.count - a.count);
  }

  // 점검
  const issues = [];
  const mainExposure = exposure.filter((r) => r.kind !== 'carousel');
  const skipping = mainExposure.filter((r) => /^CTA:/.test(r.note) && !/블로그|웨비나/.test(r.note));
  if (skipping.length) {
    issues.push(`노출 ${skipping.length}칸의 비고 CTA가 블로그·웨비나를 건너뛰고 바로 ${[...new Set(skipping.map((r) => r.note.replace(/^CTA:\s*/, '')))].join(' · ')}(으)로 가 있음`);
  }
  weeks.forEach((w, i) => {
    if (!w.mids.some((m) => m.kind === 'webinar')) issues.push(`${i + 1}주 (${md(w.start)}–${md(w.end)}) 웨비나 없음`);
    if (!w.mids.some((m) => m.kind === 'blog')) issues.push(`${i + 1}주 (${md(w.start)}–${md(w.end)}) 회사 블로그 없음`);
  });
  for (const m of mids.filter((x) => x.kind === 'webinar')) {
    const feeders = exposure.filter((r) => links.get(r.id)?.targetId === m.id && links.get(r.id)?.fit === 'good');
    const main = feeders.filter((r) => r.kind !== 'carousel');
    if (!feeders.length) issues.push(`웨비나 ${md(m.date)} "${m.label}"로 보내는 노출 콘텐츠 없음`);
    else if (!main.length) issues.push(`웨비나 ${md(m.date)} "${m.label}"로 보내는 릴스·유튜브 없음 (캐러셀 ${feeders.length}개만)`);
  }
  const orphans = mainExposure.filter((r) => links.get(r.id)?.fit === 'none');
  const weak = mainExposure.filter((r) => links.get(r.id)?.fit === 'weak');
  if (orphans.length) issues.push(`받을 블로그·웨비나가 없는 릴스·유튜브 ${orphans.length}칸: ${orphans.map((r) => md(r.date)).join(', ')}`);
  if (weak.length) issues.push(`받는 블로그·웨비나 주제가 약한 릴스·유튜브 ${weak.length}칸: ${weak.map((r) => md(r.date)).join(', ')}`);
  const looseCarousels = exposure.filter((r) => r.kind === 'carousel' && links.get(r.id)?.fit !== 'good');
  if (looseCarousels.length) issues.push(`주제가 이어지는 블로그·웨비나가 없는 캐러셀 ${looseCarousels.length}개 (구조도에서 뺌)`);

  return { weeks, byId, issues, counts: countKinds(exposure, mids) };
}

function countKinds(exposure, mids) {
  const c = {};
  for (const r of [...exposure, ...mids]) c[r.kind] = (c[r.kind] ?? 0) + 1;
  return c;
}

// ── 노션 블록 ──

const t = (content, ann = {}) => ({ type: 'text', text: { content }, annotations: ann });
const mention = (id) => ({ type: 'mention', mention: { page: { id } } });
const para = (rich) => ({ type: 'paragraph', paragraph: { rich_text: rich } });
const bullet = (rich, children) => ({ type: 'bulleted_list_item', bulleted_list_item: { rich_text: rich, ...(children ? { children } : {}) } });
const h2 = (s) => ({ type: 'heading_2', heading_2: { rich_text: [t(s)] } });

const FIT_TEXT = {
  good: ['맞음', 'green'],
  weak: ['약함', 'yellow'],
  none: ['받을 곳 없음', 'red'],
};

const short = (s, n = 18) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const mmd = (s) => s.replace(/["\[\]{}()<>|#;]/g, ' ').replace(/\s+/g, ' ').trim();

/** 한 달 전체를 노출 묶음 → 블로그·웨비나 → 진단서·챌린지 흐름으로 (Notion 이 mermaid 코드 블록을 그림으로 보여 준다) */
export function toMermaid(map) {
  const { weeks } = map;
  const lines = ['flowchart LR'];
  const allMids = weeks.flatMap((w) => w.mids);
  const midNode = new Map(allMids.map((m, i) => [m.id, `M${i}`]));
  const used = new Set();

  weeks.forEach((w, i) => {
    const n = i + 1;
    const shown = w.exposure.filter((r) => r.kind !== 'carousel' || r.link?.fit === 'good');
    const c = {};
    for (const r of shown) c[r.kind] = (c[r.kind] ?? 0) + 1;
    const mix = ['reel', 'youtube', 'carousel'].filter((k) => c[k]).map((k) => `${KIND_LABEL[k]} ${c[k]}`).join(' · ') || '없음';
    const kw = w.keywords[0] ? `${short(mmd(w.keywords[0].text), 14)}${w.keywords.length > 1 ? ` 외 ${w.keywords.length - 1}` : ''}` : '키워드 없음';
    lines.push(`  subgraph W${n}["${n}주 ${md(w.start)}–${md(w.end)}"]`);
    lines.push(`    K${n}["① ${kw}"] --> E${n}["② ${mix}"]`);
    lines.push('  end');

    const toMid = new Map();
    let orphan = 0;
    for (const r of shown) {
      const id = r.link?.targetId;
      if (id && midNode.has(id)) {
        const cur = toMid.get(id) ?? { n: 0, weak: 0 };
        cur.n += 1;
        if (r.link.fit === 'weak') cur.weak += 1;
        toMid.set(id, cur);
      } else orphan += 1;
    }
    for (const [id, v] of toMid) {
      used.add(id);
      const label = `${v.n}칸${v.weak ? ` 약함 ${v.weak}` : ''}`;
      lines.push(`  E${n} ${v.weak === v.n ? '-.' : '--'} "${label}" ${v.weak === v.n ? '.->' : '-->'} ${midNode.get(id)}`);
    }
    if (orphan) lines.push(`  E${n} -.-> X${n}["받을 곳 없음 ${orphan}칸"]:::bad`);
  });

  for (const m of allMids) {
    const node = midNode.get(m.id);
    lines.push(`  ${node}["③ ${KIND_LABEL[m.kind]} ${md(m.date)}<br/>${short(mmd(m.label))}"]:::${m.kind}`);
    lines.push(`  ${node} --> F_${m.kind}`);
    if (!used.has(m.id)) lines.push(`  ${node}:::bad`);
  }
  if (allMids.some((m) => m.kind === 'blog')) lines.push(`  F_blog(["④ ${FINAL.blog}"]):::final`);
  if (allMids.some((m) => m.kind === 'webinar')) lines.push(`  F_webinar(["④ ${FINAL.webinar}"]):::final`);
  lines.push('  classDef blog fill:#E6F4EA,stroke:#1E8E3E');
  lines.push('  classDef webinar fill:#E8EDFF,stroke:#3B5BFD');
  lines.push('  classDef final fill:#FFF0E5,stroke:#B4541B');
  lines.push('  classDef bad fill:#FDE7E7,stroke:#D92B2B');
  return lines.join('\n');
}

const cell = (...rich) => rich.flat();
const row = (cells) => ({ type: 'table_row', table_row: { cells } });
const table = (header, rows) => ({
  type: 'table',
  table: { table_width: header.length, has_column_header: true, has_row_header: false, children: [row(header.map((h) => [t(h, { bold: true })])), ...rows] },
});

function codeBlock(content, language) {
  const chunks = [];
  for (let i = 0; i < content.length; i += 1900) chunks.push(t(content.slice(i, i + 1900)));
  return { type: 'code', code: { language, rich_text: chunks } };
}

export function toBlocks(map, { engine, generatedAt }) {
  const { weeks, byId, issues, counts } = map;
  const countLine = ['reel', 'youtube', 'carousel', 'blog', 'webinar']
    .filter((k) => counts[k]).map((k) => `${KIND_LABEL[k]} ${counts[k]}`).join(' · ');

  const blocks = [
    {
      type: 'callout',
      callout: {
        icon: { type: 'emoji', emoji: '🧭' },
        color: 'gray_background',
        rich_text: [
          t('키워드·관심사 → 노출(인스타·유튜브) → 회사 블로그·웨비나 → 진단서·챌린지\n', { bold: true }),
          t(`${countLine}\n`),
          t('연결: '), t('맞음', { color: 'green' }), t(' · '), t('약함', { color: 'yellow' }), t(' · '), t('받을 곳 없음', { color: 'red' }),
          t(`\n${generatedAt} 자동 생성 · 연결 판단 ${engine === 'gemini' ? 'Gemini' : '규칙(같은 카페 글·가까운 날짜)'} — 사람이 한 번 확인해 주세요`, { color: 'gray' }),
        ],
      },
    },
    h2('한눈에 보기'),
    para([t('코드 블록이 그림으로 안 보이면 블록 오른쪽 위에서 "미리 보기"를 누르세요. 실선 = 맞음, 점선 = 약함·없음, 빨간 칸 = 들어오는 노출이 없거나 받을 곳이 없는 칸', { color: 'gray' })]),
    codeBlock(toMermaid(map), 'mermaid'),
    { type: 'divider', divider: {} },
  ];

  const allExposure = weeks.flatMap((x) => x.exposure);
  weeks.forEach((w, i) => {
    blocks.push(h2(`${i + 1}주 · ${md(w.start)} – ${md(w.end)}`));
    blocks.push(para([
      t('① 키워드  ', { bold: true }),
      ...(w.keywords.length
        ? w.keywords.flatMap((k, j) => [...(j ? [t('  ·  ', { color: 'gray' })] : []), t(k.text), t(k.count ? ` ${k.count.toLocaleString()}` : '', { color: 'gray' })])
        : [t('카페 키워드가 적힌 칸 없음', { color: 'gray' })]),
    ]));

    const shown = w.exposure.filter((r) => r.kind !== 'carousel' || r.link?.fit === 'good');
    if (shown.length) {
      blocks.push(table(['날짜', '② 노출', '→ ③ 보낼 곳', '연결'], shown.map((r) => {
        const [fitText, color] = FIT_TEXT[r.link?.fit ?? 'none'];
        const target = r.link?.targetId ? byId.get(r.link.targetId) : null;
        return row([
          cell(t(`${md(r.date)} ${KIND_LABEL[r.kind]}`)),
          cell(mention(r.id)),
          cell(target ? [t(`${KIND_LABEL[target.kind]} ${md(target.date)} `), mention(target.id)] : [t('-', { color: 'gray' })]),
          cell(t(fitText, { color, bold: true }), r.link?.reason ? t(`\n${r.link.reason}`, { color: 'gray' }) : []),
        ]);
      })));
    } else blocks.push(para([t('② 노출 콘텐츠 없음', { color: 'gray' })]));

    if (w.mids.length) {
      blocks.push(table(['날짜', '③ 블로그 · 웨비나', '들어오는 노출', '→ ④'], w.mids.map((m) => {
        const feeders = allExposure.filter((r) => r.link?.targetId === m.id).length;
        return row([
          cell(t(`${md(m.date)} ${KIND_LABEL[m.kind]}`)),
          cell(mention(m.id)),
          cell(t(`${feeders}칸`, { color: feeders ? 'default' : 'red' })),
          cell(t(FINAL[m.kind])),
        ]);
      })));
    } else blocks.push(para([t('③ 이번 주 블로그·웨비나 없음', { color: 'red' })]));
  });

  blocks.push({ type: 'divider', divider: {} });
  blocks.push(h2('점검'));
  if (!issues.length) blocks.push(para([t('걸린 것 없음')]));
  for (const s of issues) blocks.push(bullet([t(s)]));
  blocks.push(para([t(`④는 블로그 → ${FINAL.blog}, 웨비나 → ${FINAL.webinar} 로 둠. 바꾸려면 scripts/brand-funnel-map.js 의 FINAL.`, { color: 'gray' })]));
  return blocks;
}

// ── 노션 쓰기 ──

async function findExisting(title) {
  if (PARENT_PAGE_ID) {
    let cursor;
    do {
      const r = await withRetry(() => notion.blocks.children.list({ block_id: PARENT_PAGE_ID, start_cursor: cursor }));
      const hit = r.results.find((b) => b.type === 'child_page' && b.child_page.title === title);
      if (hit) return hit.id;
      cursor = r.has_more ? r.next_cursor : undefined;
    } while (cursor);
    return null;
  }
  const r = await withRetry(() => notion.dataSources.query({
    data_source_id: DATASOURCE_ID,
    filter: { property: 'Name', title: { equals: title } },
  }));
  return r.results[0]?.id ?? null;
}

async function createPage(title, year, month) {
  const page = PARENT_PAGE_ID
    ? await withRetry(() => notion.pages.create({
      parent: { page_id: PARENT_PAGE_ID },
      icon: { type: 'emoji', emoji: '🧭' },
      properties: { title: { title: [{ text: { content: title } }] } },
    }))
    : await withRetry(() => notion.pages.create({
      parent: { type: 'data_source_id', data_source_id: DATASOURCE_ID },
      icon: { type: 'emoji', emoji: '🧭' },
      properties: {
        Name: { title: [{ text: { content: title } }] },
        '컨텐츠 발행일': { date: { start: `${year}-${String(month).padStart(2, '0')}-01` } },
      },
    }));
  return page.id;
}

async function clearPage(pageId) {
  let cursor;
  const ids = [];
  do {
    const r = await withRetry(() => notion.blocks.children.list({ block_id: pageId, start_cursor: cursor }));
    ids.push(...r.results.map((b) => b.id));
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  for (const id of ids) await withRetry(() => notion.blocks.delete({ block_id: id }));
}

async function appendBlocks(pageId, blocks) {
  for (let i = 0; i < blocks.length; i += 90) {
    await withRetry(() => notion.blocks.children.append({ block_id: pageId, children: blocks.slice(i, i + 90) }));
  }
}

// ── 실행 ──

/**
 * @param {{ year: number, month: number, force?: boolean }} opts
 * @returns {Promise<{ pageId: string, url: string, created: boolean, skipped?: boolean }>}
 */
export async function runFunnelMap({ year, month, force = false, dry = false }) {
  const title = funnelTitle(year, month);
  const existing = await findExisting(title);
  if (existing && !force && !dry) {
    return { pageId: existing, url: `https://www.notion.so/${existing.replace(/-/g, '')}`, created: false, skipped: true };
  }

  const weeks = monthWeeks(year, month);
  const from = iso(addDays(parseISO(weeks[0].start), -14));
  const to = iso(addDays(parseISO(weeks.at(-1).end), 14));
  const rows = await fetchRows(from, to);

  const { exposure, mids } = splitRows(rows, weeks[0].start, weeks.at(-1).end);
  if (!exposure.length) throw new Error(`${year}년 ${month}월 노출 콘텐츠(릴스·유튜브·캐러셀)가 노션에 아직 없습니다`);

  const { links, engine } = await linkAll(exposure, mids);
  const map = buildMap({ year, month, rows, links });
  const blocks = toBlocks(map, { engine, generatedAt: iso(kstNow()) });

  if (dry) return { dry: true, map, blocks, engine };

  const pageId = existing ?? await createPage(title, year, month);
  if (existing) await clearPage(pageId);
  await appendBlocks(pageId, blocks);
  return { pageId, url: `https://www.notion.so/${pageId.replace(/-/g, '')}`, created: !existing, issues: map.issues };
}

/** 다음 달 (KST 기준) */
export function nextMonth(now = kstNow()) {
  const d = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/** 폴러용 — 25일 10시(KST) 이후 다음 달 페이지가 없으면 만든다 */
export function isFunnelMapDue(now = kstNow()) {
  return now.getDate() >= RUN_DAY && (now.getDate() > RUN_DAY || now.getHours() >= RUN_HOUR);
}

const thisFile = fileURLToPath(import.meta.url);
const mainFile = process.argv[1] ? resolve(process.argv[1]) : '';

if (thisFile === mainFile) {
  const arg = process.argv.slice(2).find((a) => /^\d{4}-\d{1,2}$/.test(a));
  const force = process.argv.includes('--force');
  const dry = process.argv.includes('--dry');
  const { year, month } = arg
    ? { year: Number(arg.split('-')[0]), month: Number(arg.split('-')[1]) }
    : nextMonth();
  try {
    const r = await runFunnelMap({ year, month, force, dry });
    if (r.dry) {
      console.log(`연결 판단: ${r.engine}`);
      r.map.weeks.forEach((w, i) => {
        console.log(`\n${i + 1}주 ${w.start}~${w.end}  키워드 ${w.keywords.map((k) => k.text).join(' / ')}`);
        for (const e of w.exposure) {
          const tg = e.link?.targetId ? r.map.byId.get(e.link.targetId) : null;
          console.log(`  ${e.date} ${KIND_LABEL[e.kind]} ${e.label.slice(0, 30)} → ${tg ? `${KIND_LABEL[tg.kind]} ${tg.date}` : '-'} [${e.link?.fit}] ${e.link?.reason ?? ''}`);
        }
        for (const m of w.mids) console.log(`  ③ ${m.date} ${KIND_LABEL[m.kind]} ${m.label.slice(0, 40)}`);
      });
      console.log('\n점검');
      for (const s of r.map.issues) console.log(`  · ${s}`);
      console.log(`\n블록 ${r.blocks.length}개`);
    } else if (r.skipped) console.log(`이미 있음 (덮어쓰려면 --force): ${r.url}`);
    else {
      console.log(`${r.created ? '만듦' : '새로 씀'}: ${funnelTitle(year, month)}\n${r.url}`);
      for (const s of r.issues ?? []) console.log(`  · ${s}`);
    }
  } catch (e) {
    console.error(`❌ ${e.message}`);
    process.exit(1);
  }
}
