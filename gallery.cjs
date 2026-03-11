const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3300;
const OUTPUT_DIR = path.join(__dirname, 'output');

function getProjects() {
  return fs.readdirSync(OUTPUT_DIR)
    .filter(d => fs.statSync(path.join(OUTPUT_DIR, d)).isDirectory())
    .sort((a, b) => {
      const sa = fs.statSync(path.join(OUTPUT_DIR, a)).mtimeMs;
      const sb = fs.statSync(path.join(OUTPUT_DIR, b)).mtimeMs;
      return sb - sa;
    });
}

function getImages(project) {
  const dir = path.join(OUTPUT_DIR, project);
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.png'))
    .sort();
}

function renderIndex(projects) {
  const items = projects.map(p => {
    const imgs = getImages(p);
    const thumb = imgs[0] ? `/img/${encodeURIComponent(p)}/${encodeURIComponent(imgs[0])}` : '';
    return `
      <a href="/view/${encodeURIComponent(p)}" class="card">
        ${thumb ? `<img src="${thumb}" alt="thumbnail">` : '<div class="no-img">No images</div>'}
        <div class="label">${p}</div>
      </a>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>카드뉴스 갤러리</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Noto Sans KR',sans-serif; background:#f5f5f5; padding:20px; }
  h1 { text-align:center; margin-bottom:24px; color:#333; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:16px; max-width:1200px; margin:0 auto; }
  .card { background:#fff; border-radius:12px; overflow:hidden; text-decoration:none; color:#333;
          box-shadow:0 2px 8px rgba(0,0,0,0.1); transition:transform .2s; }
  .card:hover { transform:translateY(-4px); box-shadow:0 4px 16px rgba(0,0,0,0.15); }
  .card img { width:100%; aspect-ratio:1080/1350; object-fit:cover; }
  .no-img { width:100%; aspect-ratio:1080/1350; background:#eee; display:flex; align-items:center; justify-content:center; color:#999; }
  .label { padding:12px; font-size:14px; font-weight:600; word-break:keep-all; }
  .count { text-align:center; color:#888; margin-bottom:16px; }
</style>
</head>
<body>
  <h1>카드뉴스 갤러리</h1>
  <p class="count">${projects.length}개 프로젝트</p>
  <div class="grid">${items}</div>
</body></html>`;
}

function renderProject(project) {
  const imgs = getImages(project);
  const cards = imgs.map((img, i) => `
    <div class="slide">
      <img src="/img/${encodeURIComponent(project)}/${encodeURIComponent(img)}" alt="card ${i + 1}">
      <div class="num">${i + 1} / ${imgs.length}</div>
    </div>`).join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${project}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Noto Sans KR',sans-serif; background:#1a1a1a; color:#fff; }
  .header { padding:16px 20px; display:flex; align-items:center; gap:12px; background:#222; }
  .header a { color:#aaa; text-decoration:none; font-size:14px; }
  .header a:hover { color:#fff; }
  .header h2 { font-size:16px; font-weight:600; word-break:keep-all; }
  .gallery { display:flex; flex-direction:column; align-items:center; gap:12px; padding:20px; max-width:540px; margin:0 auto; }
  .slide { position:relative; width:100%; }
  .slide img { width:100%; border-radius:8px; }
  .num { position:absolute; bottom:8px; right:12px; background:rgba(0,0,0,0.6); padding:4px 10px;
         border-radius:12px; font-size:12px; }
</style>
</head>
<body>
  <div class="header">
    <a href="/">← 목록</a>
    <h2>${project}</h2>
  </div>
  <div class="gallery">${cards}</div>
</body></html>`;
}

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url);

  if (url === '/' || url === '') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderIndex(getProjects()));
    return;
  }

  if (url.startsWith('/view/')) {
    const project = url.slice(6);
    const dir = path.join(OUTPUT_DIR, project);
    if (fs.existsSync(dir)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderProject(project));
    } else {
      res.writeHead(404); res.end('Not found');
    }
    return;
  }

  if (url.startsWith('/img/')) {
    const rest = url.slice(5);
    const slashIdx = rest.indexOf('/');
    if (slashIdx > 0) {
      const project = rest.slice(0, slashIdx);
      const file = rest.slice(slashIdx + 1);
      const filePath = path.join(OUTPUT_DIR, project, file);
      if (fs.existsSync(filePath) && file.endsWith('.png')) {
        res.writeHead(200, { 'Content-Type': 'image/png' });
        fs.createReadStream(filePath).pipe(res);
        return;
      }
    }
    res.writeHead(404); res.end('Not found');
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`카드뉴스 갤러리 서버 시작: http://localhost:${PORT}`);
});
