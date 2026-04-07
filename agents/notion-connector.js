import 'dotenv/config';
import { Client } from '@notionhq/client';
import { readFile, stat } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DATASOURCE_ID = process.env.NOTION_DATASOURCE_ID;

// ── API 재시도 래퍼 ──

/**
 * API 호출 재시도 (429/500 대응)
 */
async function withRetry(fn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.status || err?.code;
      const isRetryable = status === 429 || status === 500 || status === 502 || status === 503;

      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }

      const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
      console.log(`  ⏳ Notion API ${status} — ${delay / 1000}초 후 재시도 (${attempt}/${maxRetries})`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// ── academies.json prefix 매핑 ──

let prefixMap = null;
async function loadPrefixMap() {
  if (prefixMap) return prefixMap;
  const raw = await readFile(join(__dirname, '..', 'config', 'academies.json'), 'utf-8');
  const academies = JSON.parse(raw);
  prefixMap = {};
  for (const [key, config] of Object.entries(academies)) {
    if (config.notion_prefix) {
      prefixMap[config.notion_prefix] = key;
    }
  }
  return prefixMap;
}

// ── ⑧ extractAcademyKey ──

export async function extractAcademyKey(title) {
  const map = await loadPrefixMap();
  // [톡톡2-3] 처럼 붙어쓴 경우도 매칭: 대괄호 안 텍스트에서 알려진 prefix로 시작하는지 확인
  const bracketMatch = title.match(/^\[([^\]]+)\]/);
  if (!bracketMatch) return null;
  const inside = bracketMatch[1];
  for (const [prefix, key] of Object.entries(map)) {
    if (inside.startsWith(prefix)) return key;
  }
  return null;
}

export function extractTopic(title) {
  const match = title.match(/^\[[^\]]+\]\s*(.+)/);
  return match ? match[1].trim() : title;
}

// ── ① getByStatus ──

export async function getByStatus(statusValue) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const response = await withRetry(() => notion.dataSources.query({
    data_source_id: DATASOURCE_ID,
    filter: {
      and: [
        { property: '상태', multi_select: { contains: statusValue } },
        { timestamp: 'last_edited_time', last_edited_time: { on_or_after: since } },
      ],
    },
    sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
  }));

  const pages = [];
  for (const page of response.results) {
    const props = page.properties;
    const titleProp = Object.values(props).find(p => p.type === 'title');
    const title = titleProp?.title?.map(t => t.plain_text).join('') || '';
    const keyword = props['메인 키워드']?.rich_text?.map(t => t.plain_text).join('') || '';
    const academyKey = await extractAcademyKey(title);
    const statuses = (props['상태']?.multi_select || []).map(s => s.name);
    const contentTypes = (props['콘텐츠 타입']?.multi_select || []).map(s => s.name);

    pages.push({
      id: page.id,
      title,
      academyKey,
      keyword,
      statuses,
      contentTypes,
      statusChangedAt: page.last_edited_time,
    });
  }
  return pages;
}

// ── ② getComments ──

export async function getComments(pageId) {
  const response = await withRetry(() => notion.comments.list({ block_id: pageId }));
  const comments = [];
  for (const comment of response.results) {
    const text = comment.rich_text?.map(t => t.plain_text).join('') || '';
    if (text.startsWith('🤖 Claude 기획안')) continue;
    if (!text.trim()) continue;
    comments.push({ text, createdAt: comment.created_time });
  }
  return comments;
}

// ── ③ getRevisionInstructions ──

export async function getRevisionInstructions(pageId, afterTime) {
  const response = await withRetry(() => notion.comments.list({ block_id: pageId }));
  const instructions = [];
  for (const comment of response.results) {
    const text = comment.rich_text?.map(t => t.plain_text).join('') || '';
    if (!text.startsWith('@수정')) continue;
    if (afterTime && comment.created_time <= afterTime) continue;
    const instruction = text.replace(/^@수정\s*/, '').trim();
    if (instruction) instructions.push(instruction);
  }
  return instructions;
}

// ── ③-b getPhotoAssignments ──

/**
 * 노션 댓글에서 @사진 지정 파싱
 * 형식: @사진 카드3 파일명.png  또는  @사진 카드3 수업사진/파일명.png
 * 여러 줄로 여러 카드 지정 가능
 * @returns {Map<number, string>} cardNumber → fileName
 */
export async function getPhotoAssignments(pageId) {
  const response = await withRetry(() => notion.comments.list({ block_id: pageId }));
  const assignments = new Map();

  for (const comment of response.results) {
    const text = comment.rich_text?.map(t => t.plain_text).join('') || '';
    if (!text.includes('@사진')) continue;

    // 각 줄을 개별 처리
    const lines = text.split('\n');
    for (const line of lines) {
      // @사진 카드3 파일명.png  또는  @사진 3 파일명.png
      const match = line.match(/@사진\s+카드?(\d+)\s+(.+)/);
      if (match) {
        const cardNum = parseInt(match[1]);
        const fileName = match[2].trim();
        assignments.set(cardNum, fileName);
      }
    }
  }

  return assignments;
}

// ── ④ getPageContent ──

export async function getPageContent(pageId) {
  const blocks = await withRetry(() => notion.blocks.children.list({ block_id: pageId, page_size: 100 }));

  const allLines = [];
  let inPlanning = false;
  const planningLines = [];

  for (const block of blocks.results) {
    const richText = block[block.type]?.rich_text;
    if (!richText) continue;
    const text = richText.map(t => t.plain_text).join('');
    if (!text) continue;

    allLines.push(text);

    if (text.includes('작업기획서')) {
      inPlanning = true;
      continue;
    }
    if (text.includes('아이디어 정리')) {
      inPlanning = true;
      continue;
    }
    if (inPlanning && block.type === 'heading_2') {
      inPlanning = false;
    }
    if (inPlanning) {
      planningLines.push(text);
    }
  }

  return {
    fullText: allLines.join('\n'),
    planningContent: planningLines.length > 0 ? planningLines.join('\n') : null,
  };
}

// ── 키워드 하이라이팅 헬퍼 ──

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildHighlightedText(text, keyword) {
  if (!keyword || !text) {
    return [{ type: 'text', text: { content: text || '' } }];
  }
  const parts = text.split(new RegExp(`(${escapeRegex(keyword)})`, 'gi'));
  return parts.filter(p => p).map(part => ({
    type: 'text',
    text: { content: part },
    ...(part.toLowerCase() === keyword.toLowerCase()
      ? { annotations: { bold: true, color: 'orange' } }
      : {}),
  }));
}

// ── ⑤ writePlanAndCopy ──

export async function writePlanAndCopy(pageId, cards, copies, keyword = '', criticResult = null) {
  // 기존 AI 섹션 삭제
  try {
    const existing = await withRetry(() => notion.blocks.children.list({ block_id: pageId, page_size: 100 }));
    let inAISection = false;
    for (const block of existing.results) {
      const text = block[block.type]?.rich_text?.map(t => t.plain_text).join('') || '';
      if (text.includes('Claude 기획안') || text.includes('📝 원고') || text.includes('📁 생성된 파일')) {
        inAISection = true;
      }
      if (inAISection) {
        await withRetry(() => notion.blocks.delete({ block_id: block.id }));
      }
    }
  } catch {
    // 삭제 실패해도 계속
  }

  const children = [];

  // ── 기획안 섹션 ──
  children.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: '🤖 Claude 기획안' } }],
    },
  });
  children.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [{
        type: 'text',
        text: { content: '(자동 생성 — 수정하려면 댓글에 @수정으로 요청)' },
        annotations: { italic: true, color: 'gray' },
      }],
    },
  });

  for (const card of cards) {
    const lines = [];
    lines.push(`카드 ${card.number} [${card.type}]`);
    lines.push(`헤드라인: ${(card.headline || '').replace(/<\/?em>/g, '')}`);
    if (card.subtext) lines.push(`서브텍스트: ${card.subtext}`);
    if (card.layout_hint) lines.push(`레이아웃힌트: ${card.layout_hint}`);
    if (card.stat) lines.push(`통계: ${card.stat} ${card.stat_label || ''}`);
    if (card.quote_main) lines.push(`인용: "${card.quote_main}"`);
    if (card.cta_text) lines.push(`CTA: ${card.cta_text}`);
    if (card.items && Array.isArray(card.items)) {
      const itemTexts = card.items.map(item =>
        typeof item === 'string' ? item : (item.title || item.text || '')
      );
      lines.push(`항목: ${itemTexts.join(' / ')}`);
    }
    if (card.steps && Array.isArray(card.steps)) {
      const stepTexts = card.steps.map(s =>
        typeof s === 'string' ? s : (s.title || '')
      );
      lines.push(`단계: ${stepTexts.join(' → ')}`);
    }
    if (card.content_bullets && Array.isArray(card.content_bullets)) {
      lines.push(`콘텐츠:`);
      card.content_bullets.forEach(b => lines.push(`  • ${b}`));
    }
    if (card.visual_asset) {
      lines.push(`시각자료: ${card.visual_asset}`);
    }

    children.push({
      object: 'block',
      type: 'callout',
      callout: {
        icon: { type: 'emoji', emoji: card.number === 1 ? '🎯' : card.type === 'cta' ? '📢' : '📄' },
        rich_text: [{ type: 'text', text: { content: lines.join('\n') } }],
      },
    });
  }

  children.push({ object: 'block', type: 'divider', divider: {} });

  // ── 승인 안내 callout ──
  children.push({
    object: 'block',
    type: 'callout',
    callout: {
      icon: { type: 'emoji', emoji: '✅' },
      rich_text: [{
        type: 'text',
        text: { content: '기획안 확인 후 상태를 "제작 요청"으로 변경하면 디자인이 자동으로 시작됩니다.\n수정이 필요하면 댓글에 "@수정 [수정 내용]"으로 요청해주세요.' },
      }],
    },
  });

  // ── 원고 섹션 ──
  if (copies && copies.length > 0) {
    const typeEmoji = {
      hook: '🎯', problem: '❗', data: '📊', insight: '💡',
      solution: '✅', example: '📝', summary: '📋', cta: '📢',
    };

    children.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '📝 원고' } }],
      },
    });

    // 품질 점수 요약 (copy-critic 결과가 있을 때)
    if (criticResult) {
      const avgScore = criticResult.overall_score || '—';
      const avgLen = Math.round(copies.reduce((sum, c) => sum + (c.text?.length || 0), 0) / copies.length);
      const failCount = criticResult.rewrite_needed?.length || 0;
      children.push({
        object: 'block',
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: failCount === 0 ? '✅' : '📊' },
          rich_text: [{
            type: 'text',
            text: { content: `원고 품질: 평균 ${avgScore}/10점 | 키워드: "${keyword || '—'}" | 평균 ${avgLen}자${failCount > 0 ? ` | 수정됨: 카드 ${criticResult.rewrite_needed.join(',')}` : ''}` },
          }],
        },
      });
    } else {
      children.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            type: 'text',
            text: { content: `(카드별 300~500자 본문${keyword ? ` — 키워드: "${keyword}"` : ''})` },
            annotations: { italic: true, color: 'gray' },
          }],
        },
      });
    }

    for (const copy of copies) {
      const matchingCard = cards.find(c => c.number === copy.card);
      const cardType = matchingCard?.type || 'unknown';
      const emoji = typeEmoji[cardType] || '📄';
      const headline = (matchingCard?.headline || '').replace(/<\/?em>/g, '');
      const charCount = copy.text?.length || 0;

      // 카드별 점수 (critic 결과가 있을 때)
      const cardScore = criticResult?.card_scores?.find(cs => cs.card === copy.card);
      const scoreText = cardScore ? ` ${cardScore.total}점` : '';

      // toggle 블록: 카드번호 + [타입] + 헤드라인 + (글자수)
      const toggleChildren = [];

      // 본문 (키워드 하이라이팅)
      toggleChildren.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: buildHighlightedText(copy.text || '', keyword),
        },
      });

      // 해시태그
      if (copy.hashtags && copy.hashtags.length > 0) {
        toggleChildren.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{
              type: 'text',
              text: { content: copy.hashtags.join(' ') },
              annotations: { color: 'blue' },
            }],
          },
        });
      }

      children.push({
        object: 'block',
        type: 'toggle',
        toggle: {
          rich_text: [
            { type: 'text', text: { content: `${emoji} 카드 ${copy.card}` }, annotations: { bold: true } },
            { type: 'text', text: { content: ` [${cardType}]` }, annotations: { color: 'gray' } },
            { type: 'text', text: { content: ` ${headline}` }, annotations: { italic: true } },
            { type: 'text', text: { content: ` (${charCount}자${scoreText})` }, annotations: { color: 'gray' } },
          ],
          children: toggleChildren,
        },
      });
    }

    children.push({ object: 'block', type: 'divider', divider: {} });
  }

  await withRetry(() => notion.blocks.children.append({ block_id: pageId, children }));
}

// ── ⑥ appendFilePaths ──

export async function appendFilePaths(pageId, pngPaths, pageTitle, academyName, driveFolderId, htmlSources) {
  // 기존 📁 섹션 삭제
  try {
    const existing = await withRetry(() => notion.blocks.children.list({ block_id: pageId, page_size: 100 }));
    let inFileSection = false;
    for (const block of existing.results) {
      const text = block[block.type]?.rich_text?.map(t => t.plain_text).join('') || '';
      if (text.includes('📁 생성된 파일')) {
        inFileSection = true;
      }
      if (inFileSection) {
        await withRetry(() => notion.blocks.delete({ block_id: block.id }));
      }
    }
  } catch {}

  // PNG 파일 존재 여부 사전 체크
  for (const pngPath of pngPaths) {
    try {
      await stat(pngPath);
    } catch {
      throw new Error(`PNG 파일이 존재하지 않습니다: ${pngPath}`);
    }
  }

  // Notion 직접 이미지 업로드
  const uploadedFileIds = [];
  console.log(`  📤 노션 이미지 업로드 시작 (${pngPaths.length}장)...`);
  for (const pngPath of pngPaths) {
    try {
      const fileName = pngPath.split(/[\\/]/).pop();
      const fileStats = await stat(pngPath);
      const fileBuffer = await readFile(pngPath);

      // Step 1: 업로드 세션 생성
      const upload = await withRetry(() => notion.fileUploads.create({
        mode: 'single_part',
        filename: fileName,
        content_type: 'image/png',
        content_length: fileStats.size,
      }));

      // Step 2: multipart로 파일 전송
      const boundary = '----NotionUpload' + Date.now() + Math.random().toString(36).slice(2);
      const body = Buffer.concat([
        Buffer.from(`--${boundary}\r\n`),
        Buffer.from(`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`),
        Buffer.from('Content-Type: image/png\r\n\r\n'),
        fileBuffer,
        Buffer.from(`\r\n--${boundary}--\r\n`),
      ]);

      const res = await fetch(`https://api.notion.com/v1/file_uploads/${upload.id}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body,
      });

      if (res.ok) {
        uploadedFileIds.push(upload.id);
        console.log(`  ✅ ${fileName} 업로드 완료`);
      } else {
        const err = await res.json();
        console.log(`  ⚠️ ${fileName} 실패: ${err.message}`);
      }
    } catch (e) {
      console.log(`  ⚠️ 업로드 실패: ${e.message}`);
    }
  }

  const children = [];
  children.push({ object: 'block', type: 'divider', divider: {} });
  children.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: '📁 생성된 파일' } }],
    },
  });

  if (uploadedFileIds.length > 0) {
    // 노션 이미지 블록으로 embed
    for (const fileId of uploadedFileIds) {
      children.push({
        object: 'block',
        type: 'image',
        image: {
          type: 'file_upload',
          file_upload: { id: fileId },
        },
      });
    }
  } else {
    throw new Error(`노션 이미지 업로드 전부 실패 — PNG ${pngPaths.length}장 중 0장 성공. 파일 경로/API 키를 확인하세요.`);
  }

  // Drive 업로드 (백업용, 실패해도 무시)
  let htmlFiles = [];
  if (academyName && driveFolderId) {
    try {
      const { uploadPNGs, uploadHTMLs } = await import('./drive-uploader.js');
      const uploadResult = await uploadPNGs(pngPaths, academyName, pageTitle, driveFolderId);
      if (htmlSources && htmlSources.length > 0 && uploadResult.folderId) {
        htmlFiles = await uploadHTMLs(htmlSources, uploadResult.folderId);
      }
    } catch (e) {
      // Drive 백업 실패는 무시 — 노션 업로드가 메인
    }
  }

  // Figma 편집 섹션
  const figmaFileKey = process.env.FIGMA_FILE_KEY;
  if (figmaFileKey) {
    children.push({ object: 'block', type: 'divider', divider: {} });
    children.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '🎨 Figma에서 편집' } }],
      },
    });

    const figmaUrl = `https://www.figma.com/design/${figmaFileKey}`;
    children.push({
      object: 'block',
      type: 'bookmark',
      bookmark: { url: figmaUrl },
    });

    children.push({
      object: 'block',
      type: 'callout',
      callout: {
        icon: { type: 'emoji', emoji: '💡' },
        rich_text: [{
          type: 'text',
          text: { content: '편집 방법: Figma 열기 → 💬 댓글에서 카드 HTML 복사 → html.to.design 플러그인 Editor 탭 → 붙여넣기 → Create' },
        }],
      },
    });

    if (htmlFiles.length > 0) {
      children.push({
        object: 'block',
        type: 'toggle',
        toggle: {
          rich_text: [{ type: 'text', text: { content: '📋 HTML 소스 파일 (Drive 백업)' } }],
          children: htmlFiles.map(file => ({
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{
                type: 'text',
                text: { content: file.fileName, link: { url: file.webViewLink } },
                annotations: { color: 'blue' },
              }],
            },
          })),
        },
      });
    }
  }

  await withRetry(() => notion.blocks.children.append({ block_id: pageId, children }));

  // Figma 댓글 알림
  if (htmlFiles.length > 0 && figmaFileKey) {
    try {
      const { notifyFigma } = await import('./figma-uploader.js');
      await notifyFigma({
        pageTitle,
        academyName,
        driveFiles,
        htmlFiles,
        htmlSources: htmlSources || [],
      });
    } catch (e) {
      console.log(`  ⚠️ Figma 알림 실패: ${e.message}`);
    }
  }
}

// ── ⑦ setStatus ──

export async function setStatus(pageId, statusValue) {
  await withRetry(() => notion.pages.update({
    page_id: pageId,
    properties: {
      '상태': { multi_select: [{ name: statusValue }] },
    },
  }));
}

// ── ⑨ markRevisionComplete ──

/**
 * 수정 처리 완료 댓글 작성
 */
export async function markRevisionComplete(pageId, instructions) {
  const summary = instructions.length > 0
    ? instructions.map((inst, i) => `${i + 1}. ${inst.substring(0, 50)}`).join('\n')
    : '수정 요청 없음';

  await withRetry(() => notion.comments.create({
    parent: { page_id: pageId },
    rich_text: [{
      type: 'text',
      text: { content: `🤖 수정 처리 완료\n\n처리된 수정 사항:\n${summary}\n\n새 디자인이 첨부되었습니다.` },
    }],
  }));
}

// ── ⑩ postRevisionDiff ──

/**
 * 수정 전후 diff 댓글 기록
 */
export async function postRevisionDiff(pageId, oldCards, newCards) {
  const diffs = [];

  for (const newCard of newCards) {
    const oldCard = oldCards.find(c => c.number === newCard.number);
    if (!oldCard) {
      diffs.push(`카드 ${newCard.number}: 새로 추가됨`);
      continue;
    }

    const changes = [];
    if (oldCard.headline !== newCard.headline) {
      changes.push(`헤드라인: "${(oldCard.headline || '').replace(/<\/?em>/g, '')}" → "${(newCard.headline || '').replace(/<\/?em>/g, '')}"`);
    }
    if (oldCard.subtext !== newCard.subtext) {
      changes.push(`서브텍스트 변경됨`);
    }
    if (oldCard.type !== newCard.type) {
      changes.push(`타입: ${oldCard.type} → ${newCard.type}`);
    }

    if (changes.length > 0) {
      diffs.push(`카드 ${newCard.number}: ${changes.join(', ')}`);
    }
  }

  if (diffs.length === 0) {
    diffs.push('변경 사항 없음');
  }

  await withRetry(() => notion.comments.create({
    parent: { page_id: pageId },
    rich_text: [{
      type: 'text',
      text: { content: `🤖 수정 전후 비교\n\n${diffs.join('\n')}` },
    }],
  }));
}

// ── ⑪ postErrorComment ──

/**
 * 블로그 글 + 점수표를 노션 페이지에 작성
 */
export async function writeBlog(pageId, sections, scores, flagged = false, failList = '') {
  // 기존 블로그 섹션 삭제
  try {
    const existing = await withRetry(() => notion.blocks.children.list({ block_id: pageId, page_size: 100 }));
    let inBlogSection = false;
    for (const block of existing.results) {
      const text = block[block.type]?.rich_text?.map(t => t.plain_text).join('') || '';
      if (text.includes('📰 블로그 초안')) inBlogSection = true;
      if (inBlogSection) {
        await withRetry(() => notion.blocks.delete({ block_id: block.id }));
      }
    }
  } catch {
    // 삭제 실패해도 계속
  }

  const sectionLabels = {
    problem:   '섹션1 — 문제',
    empathy:   '섹션2 — 공감',
    solution:  '섹션3 — 해결',
    proposal1: '섹션4 — 제안 1',
    proposal2: '섹션5 — 제안 2',
    narrowing: '섹션6 — 좁히기',
    closing:   '마무리',
    thumbnail: '썸네일',
  };

  const children = [];

  // 헤더
  children.push({
    object: 'block', type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: '📰 블로그 초안' } }] },
  });

  if (flagged) {
    children.push({
      object: 'block', type: 'callout',
      callout: {
        icon: { type: 'emoji', emoji: '⚠️' },
        rich_text: [{ type: 'text', text: { content: `일부 섹션 점수 미달 (검토 필요): ${failList}` }, annotations: { color: 'red' } }],
      },
    });
  }

  // 점수표
  const scoreLines = Object.entries(scores)
    .map(([k, v]) => `${sectionLabels[k] || k}: ${v.score}/10점`)
    .join('\n');
  children.push({
    object: 'block', type: 'callout',
    callout: {
      icon: { type: 'emoji', emoji: '📊' },
      rich_text: [{ type: 'text', text: { content: `섹션별 점수\n${scoreLines}` } }],
    },
  });

  children.push({ object: 'block', type: 'divider', divider: {} });

  // 썸네일 (맨 위)
  if (sections.thumbnail) {
    const thumbContent = Array.isArray(sections.thumbnail)
      ? sections.thumbnail.map(t => `• ${t}`).join('\n')
      : sections.thumbnail;
    children.push({
      object: 'block', type: 'callout',
      callout: {
        icon: { type: 'emoji', emoji: '🖼️' },
        rich_text: [{ type: 'text', text: { content: `썸네일\n${thumbContent}` }, annotations: { bold: true } }],
      },
    });
  }

  // 섹션별 블록 (thumbnail, closing 제외)
  const order = ['problem', 'empathy', 'solution', 'proposal1', 'proposal2', 'narrowing'];
  for (const key of order) {
    const content = sections[key];
    if (!content) continue;
    const score = scores[key];
    const label = sectionLabels[key] || key;
    const flagEmoji = score && score.score < 7 ? '⚠️' : '✅';

    children.push({
      object: 'block', type: 'heading_3',
      heading_3: { rich_text: [{ type: 'text', text: { content: `${flagEmoji} ${label} (${score?.score ?? '?'}/10)` } }] },
    });

    // 2000자 제한 분할
    const chunks = [];
    for (let i = 0; i < content.length; i += 1900) chunks.push(content.slice(i, i + 1900));
    for (const chunk of chunks) {
      children.push({
        object: 'block', type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: chunk } }] },
      });
    }
  }

  // 마무리
  if (sections.closing) {
    const score = scores.closing;
    const flagEmoji = score && score.score < 7 ? '⚠️' : '✅';
    children.push({
      object: 'block', type: 'heading_3',
      heading_3: { rich_text: [{ type: 'text', text: { content: `${flagEmoji} 마무리 (${score?.score ?? '?'}/10)` } }] },
    });
    const chunks = [];
    for (let i = 0; i < sections.closing.length; i += 1900) chunks.push(sections.closing.slice(i, i + 1900));
    for (const chunk of chunks) {
      children.push({
        object: 'block', type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: chunk } }] },
      });
    }
  }

  // 50개씩 나눠서 append (Notion API 제한)
  for (let i = 0; i < children.length; i += 50) {
    await withRetry(() => notion.blocks.children.append({
      block_id: pageId,
      children: children.slice(i, i + 50),
    }));
  }
}

/**
 * 에러 발생 시 댓글로 알림
 */
export async function postErrorComment(pageId, errorMessage) {
  try {
    // 이미 에러 댓글이 있으면 중복으로 달지 않음
    const existing = await withRetry(() => notion.comments.list({ block_id: pageId }));
    const hasError = existing.results.some(c => {
      const text = c.rich_text?.map(t => t.plain_text).join('') || '';
      return text.includes('⚠️ 자동화 처리 중 오류 발생');
    });
    if (hasError) return;

    await withRetry(() => notion.comments.create({
      parent: { page_id: pageId },
      rich_text: [{
        type: 'text',
        text: { content: `⚠️ 자동화 처리 중 오류 발생\n\n${errorMessage}\n\n재시도가 필요하면 상태를 다시 설정해주세요.` },
      }],
    }));
  } catch {
    // 에러 댓글 실패는 무시
  }
}
