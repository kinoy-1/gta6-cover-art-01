// Vice Cover Studio — draws the cover art onto a canvas.
// Own artwork: a multi-panel poster in the spirit of GTA 6's covers (hero panel
// above two smaller panels, a retro sun, palm silhouettes, halftone dots and bold
// caption lettering), graded in sunset or neon. No Rockstar logo, artwork or font:
// the lettering is a system sans-serif, the sun and palms are drawn paths.

/** The three post sizes the app exports. */
export const SIZES = {
  poster: { w: 1080, h: 1350, label: 'Poster · 1080 × 1350' },
  square: { w: 1080, h: 1080, label: 'Square · 1080 × 1080' },
  wide: { w: 1920, h: 1080, label: 'Wide · 1920 × 1080' },
};

/** Colour grades: sky stops, sun colours, panel tint, title colours. */
export const GRADES = {
  sunset: {
    sky: ['#2b1055', '#7b1e6e', '#e84393', '#ff7a3d', '#ffc46b'],
    sun: ['#ffe66d', '#ff9a3d', '#ff2e88'],
    tint: 'rgba(255, 46, 136, 0.16)',
    scrim: 'rgba(20, 6, 36, 0.72)',
    titleFill: ['#ffffff', '#ffe9a8'],
    titleStroke: '#2b1055',
    titleShadow: '#ff2e88',
    accent: '#ffb35c',
  },
  neon: {
    sky: ['#0a0626', '#1b0f4b', '#7b1fa2', '#d63384', '#00e5ff'],
    sun: ['#a7f3ff', '#00e5ff', '#ff2e88'],
    tint: 'rgba(0, 229, 255, 0.14)',
    scrim: 'rgba(6, 8, 38, 0.72)',
    titleFill: ['#ffffff', '#b8f6ff'],
    titleStroke: '#0a0626',
    titleShadow: '#00e5ff',
    accent: '#ff2e88',
  },
  gold: {
    sky: ['#10222b', '#155e63', '#d9903f', '#ffb347', '#ffe9a8'],
    sun: ['#fff3c4', '#ffc46b', '#ff7a1a'],
    tint: 'rgba(255, 150, 40, 0.15)',
    scrim: 'rgba(12, 26, 24, 0.72)',
    titleFill: ['#ffffff', '#ffe9a8'],
    titleStroke: '#10222b',
    titleShadow: '#ff7a1a',
    accent: '#7fe3c0',
  },
  noir: {
    sky: ['#000000', '#1a1a1a', '#4a4a4a', '#9a9a9a', '#e8e8e8'],
    sun: ['#ffffff', '#d8d8d8', '#8a8a8a'],
    tint: 'rgba(255, 255, 255, 0.10)',
    scrim: 'rgba(0, 0, 0, 0.75)',
    titleFill: ['#ffffff', '#cfcfcf'],
    titleStroke: '#000000',
    titleShadow: '#555555',
    accent: '#ffffff',
  },
};

/**
 * Panel geometry for a size: hero panel, then the two lower panels, then the
 * title band the caption sits in. Wide lays the two small panels to the right.
 */
export function panelRects(sizeKey) {
  if (sizeKey === 'wide') {
    return {
      hero: { x: 48, y: 48, w: 1132, h: 732, slant: 30 },
      lower: [
        { x: 1216, y: 48, w: 656, h: 352, slant: 0 },
        { x: 1216, y: 432, w: 656, h: 348, slant: 0 },
      ],
      title: { x: 48, y: 812, w: 1824, h: 224 },
    };
  }
  if (sizeKey === 'square') {
    return {
      hero: { x: 40, y: 40, w: 1000, h: 520, slant: 26 },
      lower: [
        { x: 40, y: 592, w: 488, h: 208, slant: 0 },
        { x: 552, y: 592, w: 488, h: 208, slant: 0 },
      ],
      title: { x: 40, y: 826, w: 1000, h: 216 },
    };
  }
  return {
    hero: { x: 48, y: 48, w: 984, h: 700, slant: 30 },
    lower: [
      { x: 48, y: 780, w: 478, h: 280, slant: 0 },
      { x: 554, y: 780, w: 478, h: 280, slant: 0 },
    ],
    title: { x: 48, y: 1092, w: 984, h: 218 },
  };
}

/** A panel's outline: a rectangle whose bottom edge slants down to the right. */
function panelPath(ctx, r) {
  ctx.beginPath();
  ctx.moveTo(r.x, r.y);
  ctx.lineTo(r.x + r.w, r.y);
  ctx.lineTo(r.x + r.w, r.y + r.h - r.slant);
  ctx.lineTo(r.x, r.y + r.h);
  ctx.closePath();
}

/** Draws one photo into a panel, cover-fit, with zoom and pan offsets. */
function drawPhotoPanel(ctx, rect, photo, zoom, ox, oy, grade) {
  ctx.save();
  panelPath(ctx, rect);
  ctx.clip();
  ctx.fillStyle = '#241233';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  if (photo) {
    const iw = photo.naturalWidth || photo.width;
    const ih = photo.naturalHeight || photo.height;
    const base = Math.max(rect.w / iw, rect.h / ih) * zoom;
    const pw = iw * base;
    const ph = ih * base;
    const dx = rect.x + (rect.w - pw) / 2 + ox * (pw - rect.w) * 0.5;
    const dy = rect.y + (rect.h - ph) / 2 + oy * (ph - rect.h) * 0.5;
    if (grade === 'noir') ctx.filter = 'grayscale(1) contrast(1.18)';
    ctx.drawImage(photo, dx, dy, pw, ph);
    ctx.filter = 'none';
  }
  // Grade wash + a dark foot so the panel reads as one poster, not three photos.
  const wash = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  wash.addColorStop(0, 'rgba(0,0,0,0)');
  wash.addColorStop(1, grade === 'noir' ? 'rgba(0,0,0,0.35)' : 'rgba(43,16,85,0.30)');
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = GRADES[grade].tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  // White frame + soft drop shadow.
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  panelPath(ctx, rect);
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.restore();
}

/** A retro sun: a disc cut by horizontal gaps, low in the sky. */
function drawRetroSun(ctx, cx, cy, r, grade) {
  const g = GRADES[grade];
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const grad = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  grad.addColorStop(0, g.sun[0]);
  grad.addColorStop(0.55, g.sun[1]);
  grad.addColorStop(1, g.sun[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = g.sky[0];
  let y = cy + r * 0.08;
  let gap = 4;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, gap);
    y += gap + r * 0.16;
    gap += 3;
  }
  ctx.restore();
}

/** One palm silhouette, drawn from bezier fronds — no borrowed artwork. */
function drawPalm(ctx, x, y, s, flip, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -s : s, s);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  // Trunk, leaning gently.
  ctx.beginPath();
  ctx.moveTo(-7, 0);
  ctx.quadraticCurveTo(-2, -70, 14, -128);
  ctx.quadraticCurveTo(20, -134, 16, -126);
  ctx.quadraticCurveTo(6, -66, 9, 0);
  ctx.closePath();
  ctx.fill();
  // Fronds fanning from the crown.
  const fronds = [
    [-95, -150, -70, -185, -20, -168],
    [-70, -170, -30, -205, 18, -180],
    [-25, -185, 5, -215, 45, -190],
    [25, -175, 70, -200, 105, -165],
    [45, -155, 95, -165, 125, -130],
    [55, -140, 100, -130, 118, -100],
    [-55, -140, -95, -130, -118, -100],
  ];
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  for (const [x1, y1, x2, y2, x3, y3] of fronds) {
    ctx.beginPath();
    ctx.moveTo(14, -128);
    ctx.quadraticCurveTo(x1, y1, x2, y2);
    ctx.quadraticCurveTo(x3, y3, x2 + 14, y2 + 12);
    ctx.quadraticCurveTo(x1 + 18, y1 + 14, 14, -128);
    ctx.fill();
  }
  // Coconuts.
  ctx.beginPath(); ctx.arc(8, -122, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(22, -118, 6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/** Halftone dots fading down the sky, denser toward the horizon. */
function drawHalftone(ctx, w, h, color) {
  ctx.save();
  ctx.fillStyle = color;
  const step = 26;
  for (let y = step / 2; y < h * 0.42; y += step) {
    const t = y / (h * 0.42);
    const r = 1 + t * 3.4;
    for (let x = step / 2 + (Math.round(y / step) % 2) * step / 2; x < w; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** A 12-point starburst badge with centred text. */
function drawBadge(ctx, cx, cy, r, text, grade) {
  const g = GRADES[grade];
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.12);
  ctx.beginPath();
  for (let i = 0; i < 24; i++) {
    const rad = i % 2 === 0 ? r : r * 0.78;
    const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(a) * rad;
    const py = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = g.accent;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.stroke();
  ctx.fillStyle = g.titleStroke;
  ctx.font = `900 ${Math.round(r * 0.24)}px "Arial Black", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), 0, 1);
  ctx.restore();
}

/** The caption: huge bold lettering with outline, shadow and a subtitle pill. */
function drawCaption(ctx, band, state, grade) {
  const g = GRADES[grade];
  const title = (state.title || 'VICE SUNSET').trim().toUpperCase();
  const cx = band.x + band.w / 2;
  const cy = band.y + band.h * 0.42;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.018);
  let size = Math.min(band.h * 0.52, band.w / Math.max(title.length, 1) * 1.15);
  const setFont = () => { ctx.font = `900 ${Math.round(size)}px "Arial Black", Arial, sans-serif`; };
  setFont();
  try { ctx.letterSpacing = `${Math.round(size * 0.02)}px`; } catch { /* older canvas */ }
  while (ctx.measureText(title).width > band.w * 0.96 && size > 24) {
    size -= 4;
    setFont();
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  const fill = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
  fill.addColorStop(0, g.titleFill[0]);
  fill.addColorStop(1, g.titleFill[1]);
  const lw = Math.max(4, size * 0.09);
  if (state.lettering === 'neon') {
    ctx.shadowColor = g.titleShadow;
    ctx.shadowBlur = size * 0.45;
    ctx.strokeStyle = g.titleShadow;
    ctx.lineWidth = lw * 0.7;
    ctx.strokeText(title, 0, 0);
    ctx.shadowBlur = size * 0.18;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, 0, 0);
  } else if (state.lettering === 'outline') {
    ctx.strokeStyle = g.titleFill[0];
    ctx.lineWidth = lw * 0.55;
    ctx.strokeText(title, 0, 0);
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillText(title, 0, 0);
  } else {
    ctx.fillStyle = g.titleShadow;
    ctx.fillText(title, size * 0.06, size * 0.09);
    ctx.strokeStyle = g.titleStroke;
    ctx.lineWidth = lw;
    ctx.strokeText(title, 0, 0);
    ctx.fillStyle = fill;
    ctx.fillText(title, 0, 0);
  }
  ctx.restore();

  const sub = (state.subtitle || '').trim();
  if (sub) {
    const sy = band.y + band.h * 0.82;
    ctx.save();
    ctx.font = `700 ${Math.round(band.h * 0.115)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const tw = Math.min(ctx.measureText(sub.toUpperCase()).width + 44, band.w * 0.92);
    const pillH = band.h * 0.19;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.roundRect(cx - tw / 2, sy - pillH / 2, tw, pillH, pillH / 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(sub.toUpperCase(), cx, sy + 1);
    ctx.restore();
  }
}

/**
 * Draws the whole cover onto `canvas` (sized to the chosen post size).
 * `state`: { size, grade, lettering, title, subtitle, badge,
 *   showSun, showPalms, showHalftone, photos: [img|null, ...],
 *   panels: [{ photo, zoom, ox, oy }, ...] }
 */
export function drawCover(canvas, state) {
  const size = SIZES[state.size] || SIZES.poster;
  const grade = GRADES[state.grade] ? state.grade : 'sunset';
  const g = GRADES[grade];
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  const { w, h } = size;

  // Sky.
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  g.sky.forEach((c, i) => sky.addColorStop(i / (g.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  if (state.showHalftone) drawHalftone(ctx, w, h, 'rgba(255,255,255,0.20)');

  // Panels with their photos.
  const rects = panelRects(state.size);
  const all = [rects.hero, ...rects.lower];
  all.forEach((rect, i) => {
    const p = state.panels[i] || { photo: 0, zoom: 1.15, ox: 0, oy: 0 };
    const photo = p.photo === '' || p.photo == null ? null : state.photos[p.photo];
    drawPhotoPanel(ctx, rect, photo, p.zoom, p.ox, p.oy, grade);
  });

  // Bottom scrim so the caption reads over any photo.
  const scrim = ctx.createLinearGradient(0, rects.title.y - 30, 0, h);
  scrim.addColorStop(0, 'rgba(0,0,0,0)');
  scrim.addColorStop(0.45, g.scrim);
  scrim.addColorStop(1, g.scrim);
  ctx.fillStyle = scrim;
  ctx.fillRect(0, rects.title.y - 30, w, h - rects.title.y + 30);

  // Retro sun low in the title band, glowing behind the caption.
  if (state.showSun) {
    drawRetroSun(
      ctx, w * 0.5, rects.title.y + rects.title.h * 0.72,
      rects.title.h * 0.70, grade,
    );
  }

  // Palms flanking the title.
  if (state.showPalms) {
    const s = w / 1080;
    drawPalm(ctx, 26 * s, h - 6, 1.15 * s, false, '#140624');
    drawPalm(ctx, w - 26 * s, h - 6, 1.05 * s, true, '#140624');
  }

  // Caption + badge.
  drawCaption(ctx, rects.title, state, grade);
  const badgeText = (state.badge || '').trim();
  if (badgeText) {
    const bx = rects.hero.x + rects.hero.w - Math.min(w, h) * 0.075;
    const by = rects.hero.y + Math.min(w, h) * 0.075;
    drawBadge(ctx, bx, by, Math.min(w, h) * 0.068, badgeText, grade);
  }
}

/** Renders `state` to a fresh canvas at the chosen post size (for export). */
export function renderCover(state) {
  const canvas = document.createElement('canvas');
  drawCover(canvas, state);
  return canvas;
}
