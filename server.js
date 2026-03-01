import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { readdir, readFile, stat } from 'fs/promises';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = parseInt(process.env.SERVER_PORT || '3456');
const OUTPUT_DIR = join(__dirname, 'output');

// Figma 플러그인에서 접근 가능하도록 CORS 허용
app.use(cors());

/**
 * GET /api/batches — 최근 배치 목록
 */
app.get('/api/batches', async (req, res) => {
  try {
    const entries = await readdir(OUTPUT_DIR);
    const batches = [];

    for (const name of entries) {
      const fullPath = join(OUTPUT_DIR, name);
      const s = await stat(fullPath);
      if (!s.isDirectory()) continue;

      // copy.json이 있는 디렉토리만 (완성된 배치)
      try {
        await stat(join(fullPath, 'copy.json'));
      } catch {
        continue;
      }

      batches.push({
        id: name,
        name,
        createdAt: s.mtime.toISOString(),
      });
    }

    // 최신순 정렬
    batches.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json(batches);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/batches/:id — 배치 카드 목록 + 메타데이터
 */
app.get('/api/batches/:id', async (req, res) => {
  try {
    const batchDir = join(OUTPUT_DIR, req.params.id);
    const copyJson = JSON.parse(await readFile(join(batchDir, 'copy.json'), 'utf-8'));

    const cards = [];
    for (const card of copyJson.cards) {
      const num = String(card.number).padStart(2, '0');
      const pngPath = join(batchDir, `card-${num}.png`);

      let hasPng = false;
      try {
        await stat(pngPath);
        hasPng = true;
      } catch {}

      cards.push({
        number: card.number,
        type: card.type,
        headline: (card.headline || '').replace(/<\/?em[^>]*>/g, ''),
        pngUrl: hasPng ? `/api/batches/${req.params.id}/card-${num}.png` : null,
        htmlUrl: `/api/batches/${req.params.id}/card-${num}.html`,
      });
    }

    res.json({ id: req.params.id, name: req.params.id, cards });
  } catch (e) {
    res.status(404).json({ error: `배치 없음: ${req.params.id}` });
  }
});

/**
 * GET /api/batches/:id/figma-spec — Figma 플러그인용 카드 구조 데이터
 * 카드 JSON + 테마 컬러 → 플러그인이 네이티브 Figma 노드 생성
 */
app.get('/api/batches/:id/figma-spec', async (req, res) => {
  try {
    const batchDir = join(OUTPUT_DIR, req.params.id);
    const copyJson = JSON.parse(await readFile(join(batchDir, 'copy.json'), 'utf-8'));

    // 배치 이름에서 학원명 추출
    const batchName = req.params.id;
    let academyName = batchName.split('-')[0] || '';
    let theme = null;

    // academies.json에서 테마 찾기
    try {
      const academies = JSON.parse(await readFile(join(__dirname, 'config', 'academies.json'), 'utf-8'));
      for (const [key, config] of Object.entries(academies)) {
        if (batchName.includes(config.name)) {
          academyName = config.name;
          theme = config.theme;
          break;
        }
      }
      // 못 찾으면 첫번째 학원 테마 사용
      if (!theme) {
        const first = Object.values(academies)[0];
        theme = first.theme;
        if (!academyName) academyName = first.name;
      }
    } catch {
      theme = {
        primary: '#2563EB', secondary: '#10B981', background: '#F0F4FF',
        text: '#1A1A2E', highlight: '#FEF08A', accent: '#EF4444',
      };
    }

    // 카드별 헤드라인에서 <em> 파싱
    const cards = copyJson.cards.map(card => {
      const emParts = [];
      let cleanHeadline = card.headline || '';

      // <em>...</em> 추출
      const emRegex = /<em[^>]*>(.*?)<\/em>/g;
      let match;
      while ((match = emRegex.exec(card.headline || '')) !== null) {
        emParts.push(match[1]);
      }
      cleanHeadline = cleanHeadline.replace(/<\/?em[^>]*>/g, '');

      return {
        number: card.number,
        type: card.type,
        headline: cleanHeadline,
        emParts,
        emphasis_style: card.emphasis_style || 'highlight',
        subtext: card.subtext || '',
        layout_hint: card.layout_hint || '',
        stat: card.stat || null,
        stat_label: card.stat_label || null,
        cta_text: card.cta_text || null,
        quote_main: card.quote_main || null,
        items: card.items || null,
        steps: card.steps || null,
        generated_html: card.generated_html || null,
      };
    });

    res.json({
      batchName,
      academyName,
      theme,
      cardCount: cards.length,
      cards,
    });
  } catch (e) {
    res.status(404).json({ error: `배치 없음: ${req.params.id} — ${e.message}` });
  }
});

/**
 * GET /api/batches/:id/card-XX.png — PNG 파일 직접 서빙
 */
app.get('/api/batches/:id/:filename', async (req, res) => {
  const filePath = join(OUTPUT_DIR, req.params.id, req.params.filename);
  try {
    await stat(filePath);
    if (req.params.filename.endsWith('.png')) {
      res.type('image/png');
    } else if (req.params.filename.endsWith('.html')) {
      res.type('text/html');
    }
    res.sendFile(resolve(filePath));
  } catch {
    res.status(404).json({ error: 'File not found' });
  }
});

/**
 * GET /api/latest — 가장 최근 배치 자동 반환
 */
app.get('/api/latest', async (req, res) => {
  try {
    const entries = await readdir(OUTPUT_DIR);
    let latest = null;
    let latestTime = 0;

    for (const name of entries) {
      const fullPath = join(OUTPUT_DIR, name);
      const s = await stat(fullPath);
      if (!s.isDirectory()) continue;
      try {
        await stat(join(fullPath, 'copy.json'));
      } catch {
        continue;
      }
      if (s.mtimeMs > latestTime) {
        latestTime = s.mtimeMs;
        latest = name;
      }
    }

    if (!latest) {
      return res.status(404).json({ error: '배치 없음' });
    }

    // 해당 배치 데이터 반환
    const batchDir = join(OUTPUT_DIR, latest);
    const copyJson = JSON.parse(await readFile(join(batchDir, 'copy.json'), 'utf-8'));

    const cards = [];
    for (const card of copyJson.cards) {
      const num = String(card.number).padStart(2, '0');
      cards.push({
        number: card.number,
        type: card.type,
        headline: (card.headline || '').replace(/<\/?em[^>]*>/g, ''),
        pngUrl: `http://localhost:${PORT}/api/batches/${latest}/card-${num}.png`,
      });
    }

    res.json({ id: latest, name: latest, cards });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`📡 카드뉴스 API 서버: http://localhost:${PORT}`);
  console.log(`   최신 배치: GET /api/latest`);
  console.log(`   배치 목록: GET /api/batches`);
});
