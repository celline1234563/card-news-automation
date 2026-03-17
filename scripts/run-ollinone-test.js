import 'dotenv/config';
import { getByStatus, getPageContent } from '../agents/notion-connector.js';
import { runPipeline } from '../index.js';

// 1. 페이지 찾기
const pages = await getByStatus('기획착수');
const target = pages.find(p => p.title.includes('이화여대 의대'));

if (!target) {
  console.log('❌ 페이지를 찾을 수 없습니다');
  process.exit(1);
}

console.log(`📄 페이지: ${target.title}`);
console.log(`   ID: ${target.id}`);
console.log(`   상태: ${target.statuses.join(', ')}`);
console.log('');

// 2. 페이지 본문 확인
const content = await getPageContent(target.id);
console.log('── 페이지 본문 ──');
console.log(content.fullText || '(본문 없음)');
console.log('');
if (content.planningContent) {
  console.log('── 기획 내용 ──');
  console.log(content.planningContent);
  console.log('');
}

// 3. 파이프라인 실행
console.log('🚀 파이프라인 시작...\n');
try {
  const result = await runPipeline('이화여대 의대 합격 후기', 'ollinone', {
    skipResearch: false,
  });

  // 4. 노션에 결과 업로드
  const notion = await import('../agents/notion-connector.js');
  const configLoader = await import('../agents/config-loader.js');
  const { academy } = await configLoader.loadConfig('ollinone');

  await notion.appendFilePaths(
    target.id,
    result.pngPaths,
    target.title,
    academy.name,
    academy.drive_folder_id,
    result.htmlSources
  );
  console.log(`✅ PNG ${result.pngPaths.length}장 노션 업로드 완료`);

  await notion.setStatus(target.id, '디자인 1차');
  console.log('✅ 상태 → 디자인 1차');

} catch (err) {
  console.error('❌ 파이프라인 에러:', err.message);
  console.error(err.stack);
}
