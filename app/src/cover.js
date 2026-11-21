// Vice Cover Studio — draws the cover art onto a canvas.
// Own artwork: a "breakout" multi-panel poster in the spirit of GTA 6's covers.
// The panels are tilted and overlap each other so the photos burst past their
// frames; a neon Leonida skyline runs along the bottom, a retro sun peeks from
// behind the hero panel, and the caption is stacked on a diagonal black slash
// band — LEONIDA huge, VICE CITY under it — so it reads in two seconds at
// thumbnail size. No Rockstar logo, artwork or font: the lettering is a system
// sans-serif, the sun, skyline and palms are drawn paths.

/** The three post sizes the app exports. */
export const SIZES = {
  poster: { w: 1080, h: 1350, label: 'Poster · 1080 × 1350' },
  square: { w: 1080, h: 1080, label: 'Square · 1080 × 1080' },
  wide: { w: 1920, h: 1080, label: 'Wide · 1920 × 1080' },
};

/** Colour grades: sky stops, sun colours, panel tint, title colours. */
export const GRADES = {
  breakout: {
    sky: ['#16042b', '#4b0f66', '#a4136b', '#ff2e88', '#00e5ff'],
    sun: ['#fff3c4', '#ffb35c', '#ff2e88'],
    tint: 'rgba(255, 46, 136, 0.18)',
    scrim: 'rgba(16, 4, 32, 0.72)',
    titleFill: ['#ffffff', '#ffe45c'],
    titleStroke: '#16042b',
    titleShadow: '#00e5ff',
    accent: '#ffe45c',
  },
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
 * title band the caption sits in. The hero starts below a strip of sky so the
 * retro sun can peek out from behind it; the lower panels overlap the hero's
 * bottom edge and each panel carries a tilt, so the photos burst past their
 * frames instead of sitting in tidy rectangles. Wide lays the two small panels
 * to the right.
 */
export function panelRects(sizeKey) {
  if (sizeKey === 'wide') {
    return {
      hero: { x: 36, y: 96, w: 1150, h: 700, slant: 30, tilt: -0.03 },
      lower: [
        { x: 1216, y: 80, w: 656, h: 352, slant: 0, tilt: 0.025 },
        { x: 1216, y: 448, w: 656, h: 348, slant: 0, tilt: -0.02 },
      ],
      title: { x: 36, y: 860, w: 1836, h: 200 },
    };
  }
  if (sizeKey === 'square') {
    return {
      hero: { x: 32, y: 92, w: 1016, h: 480, slant: 26, tilt: -0.035 },
      lower: [
        { x: 26, y: 556, w: 508, h: 200, slant: 0, tilt: 0.03 },
        { x: 546, y: 568, w: 508, h: 200, slant: 0, tilt: -0.02 },
      ],
      title: { x: 32, y: 830, w: 1016, h: 220 },
    };
  }
  return {
    hero: { x: 36, y: 96, w: 1008, h: 620, slant: 30, tilt: -0.035 },
    lower: [
      { x: 28, y: 700, w: 500, h: 250, slant: 0, tilt: 0.03 },
      { x: 552, y: 712, w: 500, h: 250, slant: 0, tilt: -0.02 },
    ],
    title: { x: 36, y: 1070, w: 1008, h: 240 },
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

/**
 * Draws one photo into a panel, cover-fit, with zoom and pan offsets. The
 * whole panel is rotated by its tilt around its centre, so neighbouring panels
 * overlap and the photos break out of the frame.
 */
function drawPhotoPanel(ctx, rect, photo, zoom, ox, oy, grade) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const tilt = rect.tilt || 0;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt);
  ctx.translate(-cx, -cy);
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
  // Thick accent frame under a white frame, with a soft drop shadow, so each
  // tilted panel pops off the one behind it.
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  panelPath(ctx, rect);
  ctx.strokeStyle = GRADES[grade].accent;
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.restore();
  panelPath(ctx, rect);
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
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
  // Slats start above the centre so they show in the dome that peeks out
  // from behind the hero panel, not only in the hidden lower half.
  let y = cy - r * 0.12;
  let gap = 3;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, gap);
    y += gap + r * 0.16;
    gap += 3;
  }
  ctx.restore();
}

/** Diagonal neon speed lines streaking across the sky strip. */
function drawSpeedLines(ctx, w, h, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  const lines = [
    [0.02, 0.10, 0.16, 0.015, 5],
    [0.06, 0.16, 0.22, 0.05, 3],
    [0.84, 0.02, 0.98, 0.10, 5],
    [0.78, 0.08, 0.94, 0.16, 3],
  ];
  for (const [x1, y1, x2, y2, lw] of lines) {
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(w * x1, h * y1);
    ctx.lineTo(w * x2, h * y2);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * A Leonida skyline: dark towers with lit windows along the bottom, drawn
 * before the title band so their tops peek out above it. Deterministic — the
 * same seed pattern every render, so exports are stable.
 */
function drawSkyline(ctx, w, h, baseY, color, windowColor) {
  ctx.save();
  ctx.fillStyle = color;
  let x = -10;
  let i = 0;
  while (x < w + 10) {
    const bw = 46 + ((i * 37) % 58);
    const bh = 60 + ((i * 53) % 70);
    const top = baseY - bh;
    ctx.fillRect(x, top, bw, bh + (h - baseY));
    // Antenna on every third tower.
    if (i % 3 === 0) ctx.fillRect(x + bw / 2 - 2, top - 26, 4, 26);
    // Lit windows.
    ctx.fillStyle = windowColor;
    for (let wy = top + 14; wy < baseY - 12; wy += 24) {
      for (let wx = x + 8; wx < x + bw - 10; wx += 20) {
        if (((wx * 7 + wy * 13 + i * 29) % 5) < 2) ctx.fillRect(wx, wy, 7, 9);
      }
    }
    ctx.fillStyle = color;
    x += bw + 8;
    i++;
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

/**
 * The diagonal slash band the caption sits on: a black band rotated a few
 * degrees across the title area, with a hot accent stripe along its top edge.
 * The band is drawn wide enough that its ends run off the canvas edges.
 */
function drawTitleBand(ctx, band, w, grade) {
  const g = GRADES[grade];
  const cx = band.x + band.w / 2;
  const cy = band.y + band.h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.03);
  ctx.fillStyle = 'rgba(8, 2, 18, 0.92)';
  ctx.fillRect(-w * 0.6, -band.h / 2, w * 1.2, band.h);
  ctx.fillStyle = g.accent;
  ctx.fillRect(-w * 0.6, -band.h / 2, w * 1.2, 7);
  ctx.fillStyle = g.titleShadow;
  ctx.fillRect(-w * 0.6, band.h / 2 - 4, w * 1.2, 4);
  ctx.restore();
}

/**
 * The caption, stacked on the slash band: the title huge, the subtitle under
 * it in the accent colour, and the tagline as a small pill. A short subtitle
 * (VICE CITY) is set as a second display line; a long one falls back to the
 * pill. The whole stack is tilted with the band so it reads as one poster.
 */
function drawCaption(ctx, band, state, grade) {
  const g = GRADES[grade];
  const title = (state.title || 'LEONIDA').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim().toUpperCase();
  const tagline = (state.tagline || '').trim();
  const cx = band.x + band.w / 2;
  const cy = band.y + band.h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.03);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';

  // Title: fit the band width, never smaller than a readable floor.
  let size = Math.min(band.h * 0.46, (band.w * 0.98 / Math.max(title.length, 1)) * 1.35);
  const setTitleFont = () => { ctx.font = `900 ${Math.round(size)}px "Arial Black", Arial, sans-serif`; };
  setTitleFont();
  try { ctx.letterSpacing = `${Math.round(size * 0.02)}px`; } catch { /* older canvas */ }
  while (ctx.measureText(title).width > band.w * 0.96 && size > 24) {
    size -= 4;
    setTitleFont();
  }
  const titleY = subtitle ? -band.h * 0.20 : -band.h * 0.08;
  const fill = ctx.createLinearGradient(0, titleY - size / 2, 0, titleY + size / 2);
  fill.addColorStop(0, g.titleFill[0]);
  fill.addColorStop(1, g.titleFill[1]);
  const lw = Math.max(4, size * 0.09);
  if (state.lettering === 'neon') {
    ctx.shadowColor = g.titleShadow;
    ctx.shadowBlur = size * 0.45;
    ctx.strokeStyle = g.titleShadow;
    ctx.lineWidth = lw * 0.7;
    ctx.strokeText(title, 0, titleY);
    ctx.shadowBlur = size * 0.18;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, 0, titleY);
    ctx.shadowBlur = 0;
  } else if (state.lettering === 'outline') {
    ctx.strokeStyle = g.titleFill[0];
    ctx.lineWidth = lw * 0.55;
    ctx.strokeText(title, 0, titleY);
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillText(title, 0, titleY);
  } else {
    ctx.fillStyle = g.titleShadow;
    ctx.fillText(title, size * 0.05, titleY + size * 0.08);
    ctx.strokeStyle = g.titleStroke;
    ctx.lineWidth = lw;
    ctx.strokeText(title, 0, titleY);
    ctx.fillStyle = fill;
    ctx.fillText(title, 0, titleY);
  }

  // Subtitle: short ones become a second display line in the accent colour.
  if (subtitle && subtitle.length <= 14) {
    const subSize = Math.round(size * 0.44);
    ctx.font = `900 ${subSize}px "Arial Black", Arial, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(subSize * 0.22)}px`; } catch { /* older canvas */ }
    ctx.fillStyle = g.accent;
    ctx.shadowColor = g.titleShadow;
    ctx.shadowBlur = subSize * 0.25;
    ctx.fillText(subtitle, 0, band.h * 0.22);
    ctx.shadowBlur = 0;
  } else if (subtitle) {
    drawPill(ctx, subtitle, 0, band.h * 0.22, band);
  }

  // Tagline pill at the foot of the band.
  if (tagline) {
    drawPill(ctx, tagline.toUpperCase(), 0, band.h * 0.40, band, band.h * 0.115);
  }
  ctx.restore();
}

/** A small dark pill with centred white text, for subtitles and taglines. */
function drawPill(ctx, text, x, y, band, fontSize) {
  const fs = fontSize || Math.round(band.h * 0.13);
  ctx.save();
  ctx.font = `700 ${Math.round(fs)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tw = Math.min(ctx.measureText(text).width + 44, band.w * 0.92);
  const pillH = fs * 1.9;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.roundRect(x - tw / 2, y - pillH / 2, tw, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, x, y + 1);
  ctx.restore();
}

/**
 * Draws the whole cover onto `canvas` (sized to the chosen post size).
 * `state`: { size, grade, lettering, title, subtitle, tagline, badge,
 *   showSun, showPalms, showHalftone, photos: [img|null, ...],
 *   panels: [{ photo, zoom, ox, oy }, ...] }
 */
export function drawCover(canvas, state) {
  const size = SIZES[state.size] || SIZES.poster;
  const grade = GRADES[state.grade] ? state.grade : 'breakout';
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
  drawSpeedLines(ctx, w, h, 'rgba(255,255,255,0.55)');

  // Retro sun peeking from behind the hero panel's top edge, top-left so it
  // never collides with the badge on the hero's top-right corner.
  const rects = panelRects(state.size);
  if (state.showSun) {
    drawRetroSun(ctx, w * 0.14, rects.hero.y - 24, Math.min(w, h) * 0.10, grade);
  }

  // Leonida skyline along the bottom, its tops showing in the gap between the
  // lower panels and the title band, behind the band itself.
  drawSkyline(ctx, w, h, rects.title.y + 10, '#0d0218', 'rgba(255, 228, 92, 0.85)');

  // Panels with their photos — tilted, overlapping, bursting out of the frame.
  const all = [rects.hero, ...rects.lower];
  all.forEach((rect, i) => {
    const p = state.panels[i] || { photo: 0, zoom: 1.15, ox: 0, oy: 0 };
    const photo = p.photo === '' || p.photo == null ? null : state.photos[p.photo];
    drawPhotoPanel(ctx, rect, photo, p.zoom, p.ox, p.oy, grade);
  });

  // Diagonal slash band + stacked caption.
  drawTitleBand(ctx, rects.title, w, grade);
  drawCaption(ctx, rects.title, state, grade);

  // Palms flanking the title band, in front of its ends.
  if (state.showPalms) {
    const s = w / 1080;
    drawPalm(ctx, 20 * s, h - 4, 0.95 * s, false, '#0d0218');
    drawPalm(ctx, w - 20 * s, h - 4, 0.88 * s, true, '#0d0218');
  }

  // Badge on the hero panel's top corner.
  const badgeText = (state.badge || '').trim();
  if (badgeText) {
    const bx = rects.hero.x + rects.hero.w - Math.min(w, h) * 0.062;
    const by = rects.hero.y + Math.min(w, h) * 0.062;
    drawBadge(ctx, bx, by, Math.min(w, h) * 0.062, badgeText, grade);
  }
}

/** Renders `state` to a fresh canvas at the chosen post size (for export). */
export function renderCover(state) {
  const canvas = document.createElement('canvas');
  drawCover(canvas, state);
  return canvas;
}
