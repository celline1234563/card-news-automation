// ═══════════════════════════════════════════════
//  카드뉴스 Import — HTML→Figma 레이어 변환
// ═══════════════════════════════════════════════

figma.showUI(__html__, { width: 480, height: 560 });

// ── 색상 변환: UI에서 받은 rgba 객체 → Figma RGB (0-1) ──
function toFigmaColor(rgba) {
  if (!rgba) return { r: 0, g: 0, b: 0 };
  return {
    r: (rgba.r || 0) / 255,
    g: (rgba.g || 0) / 255,
    b: (rgba.b || 0) / 255,
  };
}

function makeFill(rgba) {
  if (!rgba || rgba.a === 0) return null;
  var paint = { type: 'SOLID', color: toFigmaColor(rgba) };
  if (rgba.a !== undefined && rgba.a < 1) paint.opacity = rgba.a;
  return paint;
}

// ── hex → Figma RGB (폴백용) ──
function hexToFigmaColor(hex) {
  hex = String(hex || '#000000').replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  if (hex.length !== 6) hex = '000000';
  return {
    r: parseInt(hex.slice(0,2), 16) / 255,
    g: parseInt(hex.slice(2,4), 16) / 255,
    b: parseInt(hex.slice(4,6), 16) / 255,
  };
}

function hexFill(hex, opacity) {
  var p = { type: 'SOLID', color: hexToFigmaColor(hex) };
  if (opacity !== undefined) p.opacity = opacity;
  return p;
}

// ── 폰트 로드 ──
var fontLoaded = {};

async function loadFonts() {
  var families = [
    { family: 'Noto Sans KR', styles: ['Regular','Medium','Bold','ExtraBold','Black'] },
    { family: 'Inter', styles: ['Regular','Bold'] }
  ];
  for (var f = 0; f < families.length; f++) {
    for (var s = 0; s < families[f].styles.length; s++) {
      var key = families[f].family + '-' + families[f].styles[s];
      try {
        await figma.loadFontAsync({ family: families[f].family, style: families[f].styles[s] });
        fontLoaded[key] = true;
      } catch(e) {
        fontLoaded[key] = false;
      }
    }
  }
}

function weightToStyle(w) {
  var n = typeof w === 'string' ? parseInt(w) : w;
  if (isNaN(n)) n = 400;
  if (n >= 900) return 'Black';
  if (n >= 800) return 'ExtraBold';
  if (n >= 700) return 'Bold';
  if (n >= 500) return 'Medium';
  return 'Regular';
}

function getFont(style) {
  if (fontLoaded['Noto Sans KR-' + style]) return { family: 'Noto Sans KR', style: style };
  if (style === 'Black' || style === 'ExtraBold') {
    if (fontLoaded['Noto Sans KR-Bold']) return { family: 'Noto Sans KR', style: 'Bold' };
    if (fontLoaded['Inter-Bold']) return { family: 'Inter', style: 'Bold' };
  }
  if (style === 'Bold' || style === 'Medium') {
    if (fontLoaded['Noto Sans KR-Bold']) return { family: 'Noto Sans KR', style: 'Bold' };
    if (fontLoaded['Inter-Bold']) return { family: 'Inter', style: 'Bold' };
  }
  if (fontLoaded['Noto Sans KR-Regular']) return { family: 'Noto Sans KR', style: 'Regular' };
  if (fontLoaded['Inter-Regular']) return { family: 'Inter', style: 'Regular' };
  return { family: 'Inter', style: 'Regular' };
}

// ── dropShadow 효과 생성 ──
function makeShadowEffect(shadow) {
  if (!shadow || !shadow.color) return null;
  return {
    type: 'DROP_SHADOW',
    visible: true,
    blendMode: 'NORMAL',
    color: {
      r: (shadow.color.r || 0) / 255,
      g: (shadow.color.g || 0) / 255,
      b: (shadow.color.b || 0) / 255,
      a: shadow.color.a !== undefined ? shadow.color.a : 0.25,
    },
    offset: { x: shadow.x || 0, y: shadow.y || 0 },
    radius: shadow.blur || 0,
    spread: shadow.spread || 0,
  };
}

// ═══════════════════════════════════════
//  HTML 파싱 결과 → Figma 노드 변환
// ═══════════════════════════════════════

function buildCardFromHtml(parsed, cardNumber, cardType) {
  var CARD_W = 1080;
  var CARD_H = 1350;

  var stats = { shapes: 0, ellipses: 0, texts: 0, strokes: 0, shadows: 0 };

  // 루트 프레임
  var frame = figma.createFrame();
  frame.name = 'card-' + String(cardNumber).padStart(2, '0') + ' [' + (cardType || '') + ']';
  frame.resize(CARD_W, CARD_H);
  frame.clipsContent = true;

  // body 배경색
  if (parsed.bodyFill) {
    var bodyPaint = makeFill(parsed.bodyFill);
    if (bodyPaint) frame.fills = [bodyPaint];
  } else {
    frame.fills = [hexFill('#F8F8FF')];
  }

  var nodes = parsed.nodes || [];

  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    try {
      if (n.type === 'shape') {
        createShapeNode(frame, n, stats);
      } else if (n.type === 'text') {
        createTextNode(frame, n, stats);
      }
    } catch(e) {
      // 개별 노드 실패 시 건너뜀
    }
  }

  // 통계 로그
  console.log('[card-' + String(cardNumber).padStart(2,'0') + '] '
    + 'shapes:' + stats.shapes
    + ' ellipses:' + stats.ellipses
    + ' texts:' + stats.texts
    + ' strokes:' + stats.strokes
    + ' shadows:' + stats.shadows
    + ' total:' + (stats.shapes + stats.ellipses + stats.texts));

  return frame;
}

// ── 도형 노드 생성 ──
function createShapeNode(parent, n, stats) {
  var node;

  if (n.isCircle) {
    // border-radius: 50% → ELLIPSE
    node = figma.createEllipse();
    node.name = n.name || 'ellipse';
    stats.ellipses++;
  } else {
    // 일반 RECTANGLE
    node = figma.createRectangle();
    node.name = n.name || 'rect';
    // cornerRadius 적용
    var cr = n.cornerRadius || [0,0,0,0];
    if (cr[0] === cr[1] && cr[1] === cr[2] && cr[2] === cr[3]) {
      node.cornerRadius = cr[0];
    } else {
      node.topLeftRadius = cr[0];
      node.topRightRadius = cr[1];
      node.bottomRightRadius = cr[2];
      node.bottomLeftRadius = cr[3];
    }
    stats.shapes++;
  }

  node.resize(Math.max(n.w, 1), Math.max(n.h, 1));
  node.x = n.x || 0;
  node.y = n.y || 0;

  // fill
  if (n.fill) {
    var paint = makeFill(n.fill);
    if (paint) node.fills = [paint];
  } else {
    node.fills = [];
  }

  // opacity (CSS opacity는 fill opacity와 별개)
  if (n.opacity !== undefined && n.opacity < 1) {
    node.opacity = n.opacity;
  }

  // stroke (border)
  if (n.stroke && n.stroke.width > 0) {
    var sPaint = makeFill(n.stroke.color);
    if (sPaint) {
      node.strokes = [sPaint];
      node.strokeWeight = n.stroke.width;
      node.strokeAlign = 'INSIDE';
      stats.strokes++;
    }
  }

  // shadow
  if (n.shadow) {
    var effect = makeShadowEffect(n.shadow);
    if (effect) {
      node.effects = [effect];
      stats.shadows++;
    }
  }

  parent.appendChild(node);
  return node;
}

// ── 텍스트 노드 생성 ──
function createTextNode(parentFrame, n, stats) {
  // 텍스트에 배경이 있으면 (CTA 버튼 등) 감싸는 프레임 생성
  var container = null;
  if (n.bgFill) {
    container = figma.createFrame();
    container.name = (n.name || 'text-bg');
    container.resize(Math.max(n.w, 1), Math.max(n.h, 1));
    container.x = n.x || 0;
    container.y = n.y || 0;

    var bgPaint = makeFill(n.bgFill);
    if (bgPaint) container.fills = [bgPaint];

    var cr = n.cornerRadius || [0,0,0,0];
    if (cr[0] === cr[1] && cr[1] === cr[2] && cr[2] === cr[3]) {
      container.cornerRadius = cr[0];
    } else {
      container.topLeftRadius = cr[0];
      container.topRightRadius = cr[1];
      container.bottomRightRadius = cr[2];
      container.bottomLeftRadius = cr[3];
    }

    container.clipsContent = true;

    // shadow on container
    if (n.shadow) {
      var effect = makeShadowEffect(n.shadow);
      if (effect) {
        container.effects = [effect];
        stats.shadows++;
      }
    }

    // Auto Layout for centering text
    container.layoutMode = 'VERTICAL';
    container.primaryAxisAlignItems = 'CENTER';
    container.counterAxisAlignItems = 'CENTER';
    container.primaryAxisSizingMode = 'FIXED';
    container.counterAxisSizingMode = 'FIXED';

    parentFrame.appendChild(container);
    stats.shapes++;
  }

  // 텍스트 노드
  var text = String(n.text || ' ');
  var fontSize = Math.round(n.fontSize || 16);
  var fontStyle = weightToStyle(n.fontWeight);
  var font = getFont(fontStyle);

  var textNode = figma.createText();
  textNode.name = n.name || 'text';

  try { textNode.fontName = font; } catch(e) {
    try { textNode.fontName = { family: 'Inter', style: 'Regular' }; } catch(e2) {}
  }

  textNode.characters = text;
  textNode.fontSize = fontSize;

  // 텍스트 색상
  if (n.color) {
    var cp = makeFill(n.color);
    if (cp) textNode.fills = [cp];
  }

  // 정렬
  var alignMap = { 'left': 'LEFT', 'center': 'CENTER', 'right': 'RIGHT', 'justify': 'JUSTIFIED' };
  textNode.textAlignHorizontal = alignMap[n.textAlign] || 'CENTER';

  // 줄간격
  var lh = n.lineHeight || 1.45;
  textNode.lineHeight = { unit: 'PERCENT', value: Math.round(lh * 100) };

  // 텍스트 자동 높이
  textNode.textAutoResize = 'HEIGHT';
  var textWidth = container ? Math.max(n.w - 20, 50) : Math.max(n.w, 50);
  textNode.resize(textWidth, fontSize + 10);

  // opacity
  if (n.opacity !== undefined && n.opacity < 1 && !container) {
    textNode.opacity = n.opacity;
  }

  // em 범위 스타일 적용 (인라인 강조)
  if (n.ranges && n.ranges.length > 0) {
    for (var r = 0; r < n.ranges.length; r++) {
      var range = n.ranges[r];
      var start = range.start;
      var end = range.end;
      if (start < 0 || end > text.length || start >= end) continue;

      try {
        // 볼드
        if (range.fontWeight) {
          var rStyle = weightToStyle(range.fontWeight);
          var rFont = getFont(rStyle);
          textNode.setRangeFontName(start, end, rFont);
        }
        // 색상 변경
        if (range.color) {
          var rFill = makeFill(range.color);
          if (rFill) textNode.setRangeFills(start, end, [rFill]);
        }
        // 밑줄
        if (range.underline) {
          textNode.setRangeTextDecoration(start, end, 'UNDERLINE');
        }
      } catch(e) {
        // range 스타일 실패 무시
      }
    }
  }

  // 위치 설정
  if (container) {
    // 컨테이너 안에 중앙 배치
    container.appendChild(textNode);
  } else {
    textNode.x = n.x || 0;
    textNode.y = n.y || 0;
    parentFrame.appendChild(textNode);
  }

  stats.texts++;
  return textNode;
}

// ═══════════════════════════════════════
//  폴백: JSON spec → 기본 레이어 (HTML 없을 때)
// ═══════════════════════════════════════

function buildCardFallback(card, theme, academyName) {
  var CARD_W = 1080, CARD_H = 1350, PAD = 80;
  var CONTENT_W = CARD_W - PAD * 2;

  var frame = figma.createFrame();
  frame.name = 'card-' + String(card.number || 0).padStart(2,'0') + ' [' + (card.type || '') + ']';
  frame.resize(CARD_W, CARD_H);
  frame.fills = [hexFill(theme.background || '#F8F8FF')];
  frame.clipsContent = true;
  frame.layoutMode = 'VERTICAL';
  frame.primaryAxisSizingMode = 'FIXED';
  frame.counterAxisSizingMode = 'FIXED';
  frame.primaryAxisAlignItems = 'CENTER';
  frame.counterAxisAlignItems = 'CENTER';
  frame.paddingTop = PAD; frame.paddingBottom = PAD;
  frame.paddingLeft = PAD; frame.paddingRight = PAD;
  frame.itemSpacing = 32;

  // 헤드라인
  var headText = String(card.headline || '').replace('{{ACADEMY_NAME}}', academyName || '');
  if (headText) {
    var hl = figma.createText();
    hl.name = 'headline';
    try { hl.fontName = getFont('Bold'); } catch(e) {}
    hl.characters = headText;
    hl.fontSize = 44;
    hl.fills = [hexFill(theme.text || '#1A1A2E')];
    hl.textAlignHorizontal = 'CENTER';
    hl.textAutoResize = 'HEIGHT';
    hl.resize(CONTENT_W, 50);
    frame.appendChild(hl);
  }

  // 서브텍스트
  if (card.subtext) {
    var st = figma.createText();
    st.name = 'subtext';
    try { st.fontName = getFont('Regular'); } catch(e) {}
    st.characters = String(card.subtext);
    st.fontSize = 28;
    st.fills = [hexFill(theme.text || '#1A1A2E')];
    st.opacity = 0.75;
    st.textAlignHorizontal = 'CENTER';
    st.textAutoResize = 'HEIGHT';
    st.resize(CONTENT_W, 30);
    frame.appendChild(st);
  }

  console.log('[card-' + String(card.number).padStart(2,'0') + '] fallback (no HTML)');
  return frame;
}

// ═══════════════════════════════════════
//  메시지 핸들러
// ═══════════════════════════════════════

figma.ui.onmessage = async function(msg) {
  if (msg.type === 'import-cards') {
    try {
      var spec = msg.spec;
      var parsedCards = msg.parsedCards || [];

      if (!spec || !spec.cards || spec.cards.length === 0) {
        figma.ui.postMessage({ type: 'error', message: '카드 데이터 없음' });
        return;
      }

      figma.ui.postMessage({ type: 'status', text: '폰트 로딩 중...' });
      await loadFonts();

      var theme = spec.theme || { primary:'#202487', background:'#F8F8FF', text:'#1A1A2E' };
      var academyName = spec.academyName || '';

      var page = figma.createPage();
      page.name = spec.batchName || '카드뉴스';
      figma.currentPage = page;

      var GAP = 40;
      var frames = [];
      var htmlCount = 0;
      var fallbackCount = 0;

      for (var i = 0; i < spec.cards.length; i++) {
        figma.ui.postMessage({ type: 'progress', current: i + 1, total: spec.cards.length });

        var card = spec.cards[i];
        var parsed = parsedCards[i];
        var f;

        try {
          if (parsed && parsed.nodes && parsed.nodes.length > 0) {
            f = buildCardFromHtml(parsed, card.number || (i+1), card.type);
            htmlCount++;
          } else {
            f = buildCardFallback(card, theme, academyName);
            fallbackCount++;
          }

          f.x = i * (CARD_W + GAP);
          f.y = 0;
          frames.push(f);
        } catch(e) {
          console.log('[card-' + (i+1) + '] ERROR: ' + String(e));
        }
      }

      var CARD_W = 1080;
      if (frames.length > 0) {
        figma.viewport.scrollAndZoomIntoView(frames);
      }

      var summary = frames.length + '장 Import (HTML:' + htmlCount + ' fallback:' + fallbackCount + ')';
      console.log('=== IMPORT COMPLETE: ' + summary + ' ===');
      figma.ui.postMessage({ type: 'import-done', count: frames.length });
      figma.notify(summary);

    } catch(e) {
      console.log('IMPORT ERROR: ' + String(e));
      figma.ui.postMessage({ type: 'error', message: String(e) });
      figma.notify('오류: ' + String(e), { error: true });
    }
  }

  if (msg.type === 'close') {
    figma.closePlugin();
  }
};
