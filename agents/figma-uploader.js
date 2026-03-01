import 'dotenv/config';

const FIGMA_API = 'https://api.figma.com/v1';

function getHeaders() {
  return {
    'X-Figma-Token': process.env.FIGMA_TOKEN,
    'Content-Type': 'application/json',
  };
}

async function postComment(fileKey, message) {
  const resp = await fetch(`${FIGMA_API}/files/${fileKey}/comments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ message }),
  });

  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(`Figma comment failed: ${resp.status} — ${JSON.stringify(err)}`);
  }

  return resp.json();
}

/**
 * 카드뉴스 제작 완료 후 Figma에 알림 + 카드별 HTML 댓글 게시
 *
 * @param {Object} options
 * @param {string} options.pageTitle - 노션 페이지 제목
 * @param {string} options.academyName - 학원명
 * @param {Object[]} options.driveFiles - Drive PNG [{fileName, driveUrl, webViewLink}]
 * @param {Object[]} [options.htmlFiles] - Drive HTML [{fileName, webViewLink}]
 * @param {string[]} [options.htmlSources] - 카드별 HTML 소스 (전체 코드)
 * @returns {Promise<Object>} { commentIds: string[] }
 */
export async function notifyFigma({
  pageTitle,
  academyName,
  driveFiles = [],
  htmlFiles = [],
  htmlSources = [],
}) {
  const fileKey = process.env.FIGMA_FILE_KEY;
  if (!fileKey || !process.env.FIGMA_TOKEN) {
    console.log('  ⚠️ Figma 토큰/파일키 미설정 — 스킵');
    return { commentIds: [] };
  }

  const commentIds = [];

  // ── 1. 메인 알림 댓글 ──
  let mainMsg = `📌 카드뉴스 제작 완료\n`;
  mainMsg += `학원: ${academyName}\n`;
  mainMsg += `제목: ${pageTitle}\n`;
  mainMsg += `카드 수: ${driveFiles.length}장\n\n`;
  mainMsg += `── 작업 방법 ──\n`;
  mainMsg += `1. 아래 카드별 댓글에서 HTML 코드 전체 복사\n`;
  mainMsg += `2. Figma에서 html.to.design 플러그인 실행\n`;
  mainMsg += `3. Editor 탭 → HTML 붙여넣기 → Create\n`;
  mainMsg += `4. 생성된 레이어를 자유롭게 편집\n`;

  if (driveFiles.length > 0) {
    mainMsg += `\n── 이미지 (참고용) ──\n`;
    for (const file of driveFiles) {
      mainMsg += `${file.fileName}: ${file.webViewLink || file.driveUrl}\n`;
    }
  }

  const mainComment = await postComment(fileKey, mainMsg);
  commentIds.push(mainComment.id);
  console.log(`  💬 Figma 메인 댓글 게시`);

  // ── 2. 카드별 HTML 댓글 (전체 코드 포함) ──
  if (htmlSources.length > 0) {
    for (let i = 0; i < htmlSources.length; i++) {
      const cardNum = String(i + 1).padStart(2, '0');
      const html = htmlSources[i];

      // Figma 댓글 길이 제한 (~10KB 안전): HTML이 너무 길면 잘라냄
      const maxLen = 8000;
      const trimmed = html.length > maxLen
        ? html.substring(0, maxLen) + '\n\n... (전체 코드는 Drive HTML 파일 참조)'
        : html;

      let msg = `📋 card-${cardNum} HTML\n`;
      msg += `html.to.design Editor 탭에 아래 코드를 붙여넣으세요.\n`;
      msg += `────────────────\n`;
      msg += trimmed;

      try {
        const comment = await postComment(fileKey, msg);
        commentIds.push(comment.id);
      } catch (e) {
        console.log(`  ⚠️ card-${cardNum} HTML 댓글 실패: ${e.message}`);
      }
    }
    console.log(`  💬 카드 HTML 댓글 ${htmlSources.length}개 게시`);
  }

  console.log(`  ✅ Figma 알림 완료: 댓글 ${commentIds.length}개`);
  return { commentIds };
}
