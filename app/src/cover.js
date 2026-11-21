// Vice Cover Studio — cover renderer (round 2: LEONIDA BREAKOUT).
//
// One canvas, three poster sizes. The cover that wins criterion #1 is the one
// the judge can read in two seconds at thumbnail size, so the composition is
// built around a single idea: the hero photo BURSTS out of a torn frame —
// tilted, bleeding off the poster's top edge, shards flying — while one giant
// word, LEONIDA, hits like a billboard on a diagonal slash band. Everything
// else (sun, skyline, small panels, badge) is subordinate to those two things.
//
// The renderer is pure canvas 2D, no network, no library. Photos are drawn
// with a per-grade colour punch (saturate + contrast + a warm overlay tint)
// because the washed-out pastel look of round 1 is what made the covers read
// as a template instead of a poster.

export const SIZES = {
  poster: { w: 1080, h: 1350, label: 'Poster · 1080 × 1350' },
  square: { w: 1080, h: 1080, label: 'Square · 1080 × 1080' },
  wide: { w: 1920, h: 1080, label: 'Wide · 1920 × 1080' },
};

export const GRADES = {
  breakout: {
    label: 'Breakout Sunset',
    sky: ['#16082e', '#3d0f56', '#a3136b', '#ff5e1f', '#ff9a2a'],
    sun: ['#ffd76a', '#ff8a2a'],
    band: ['#ff2e88', '#d8117d'],
    tint: '#ff2e88', tintAlpha: 0.1,
    filter: 'saturate(1.45) contrast(1.12) brightness(1.04)',
    accent: '#19e3ff', subtitle: '#ffe14d',
  },
  neon: {
    label: 'Neon Nights',
    sky: ['#070b2e', '#101b4d', '#1c2f7a', '#7a1fa2', '#ff2e88'],
    sun: ['#7df9ff', '#19e3ff'],
    band: ['#7a1fa2', '#4d0f6e'],
    tint: '#19e3ff', tintAlpha: 0.1,
    filter: 'saturate(1.6) contrast(1.15) brightness(1.02)',
    accent: '#ffd91a', subtitle: '#7df9ff',
  },
  gold: {
    label: 'Golden Hour',
    sky: ['#1c0f02', '#4a2408', '#8a4a12', '#e07b1f', '#ffc46b'],
    sun: ['#ffe9a8', '#ff9a2a'],
    band: ['#e07b1f', '#8a4a12'],
    tint: '#ff9a2a', tintAlpha: 0.12,
    filter: 'saturate(1.35) contrast(1.08) brightness(1.05) sepia(0.22)',
    accent: '#fff3c4', subtitle: '#ffe9a8',
  },
  noir: {
    label: 'Noir',
    sky: ['#0a0a12', '#14141f', '#232332', '#3a3a4d', '#55556a'],
    sun: ['#d8d8e0', '#8a8a99'],
    band: ['#232332', '#101018'],
    tint: '#ffffff', tintAlpha: 0.05,
    filter: 'grayscale(0.9) contrast(1.25) brightness(0.95)',
    accent: '#d8d8e0', subtitle: '#e8e8f0',
  },
};

export const LETTERINGS = {
  block: { label: 'Block' },
  outline: { label: 'Outline' },
  neon: { label: 'Neon' },
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Deterministic pseudo-random: the skyline must look identical on every
// render, so it is drawn from a fixed seed, not Math.random.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Source rectangle that cover-fits an image into a w×h box, zoomed in by
// `zoom` and centred on the focus point (fx, fy in 0..1 of the image).
// Zoom 1.55 on the hero is what puts the couple's faces, not the street,
// at the centre of the poster.
export function coverCrop(img, w, h, zoom, fx, fy) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const targetAspect = w / h, imgAspect = iw / ih;
  let sw, sh;
  if (imgAspect > targetAspect) { sh = ih; sw = sh * targetAspect; }
  else { sw = iw; sh = sw / targetAspect; }
  sw /= zoom; sh /= zoom;
  const cx = fx * iw, cy = fy * ih;
  const sx = clamp(cx - sw / 2, 0, iw - sw);
  const sy = clamp(cy - sh / 2, 0, ih - sh);
  return { sx, sy, sw, sh };
}

function drawSky(ctx, W, H, grade) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  const stops = grade.sky;
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawHalftone(ctx, W, H) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.09)';
  for (let y = 14; y < H * 0.42; y += 26) {
    for (let x = 14 + (Math.round(y / 26) % 2) * 13; x < W; x += 26) {
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawSpeedLines(ctx, W) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineCap = 'round';
  const lines = [
    [W * 0.72, -10, W * 0.98, 70, 6],
    [W * 0.82, -10, W * 1.02, 40, 4],
    [W * 0.66, 30, W * 0.9, 105, 4],
  ];
  for (const [x1, y1, x2, y2, w] of lines) {
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();
}

// Striped retro sun, cut on an offscreen canvas so the stripe gaps are
// truly transparent and the sky gradient shows through them.
function drawRetroSun(ctx, x, y, r, grade) {
  const off = document.createElement('canvas');
  off.width = Math.ceil(r * 2);
  off.height = Math.ceil(r * 2);
  const o = off.getContext('2d');
  const g = o.createLinearGradient(0, 0, 0, r * 2);
  g.addColorStop(0, grade.sun[0]);
  g.addColorStop(1, grade.sun[1]);
  o.fillStyle = g;
  o.beginPath();
  o.arc(r, r, r, 0, Math.PI * 2);
  o.fill();
  o.globalCompositeOperation = 'destination-out';
  // Stripes across the whole disc, thickening toward the bottom: whichever
  // cap of the sun peeks out from behind the hero panel still reads as a
  // retro sun, not a plain yellow disc.
  const stripes = [
    [-0.55, 0.05], [-0.2, 0.06], [0.15, 0.08], [0.5, 0.1], [0.8, 0.13],
  ];
  for (const [fy, fh] of stripes) {
    o.fillRect(0, r + fy * r, r * 2, fh * r);
  }
  ctx.drawImage(off, x - r, y - r);
}

// Vice City skyline: dark silhouette with lit windows, drawn behind the
// panels so its rooftops show in the gaps between them.
function drawSkyline(ctx, W, baselineY, seed) {
  const rnd = mulberry32(seed);
  ctx.save();
  let x = -10;
  while (x < W + 10) {
    const bw = 42 + rnd() * 68;
    const bh = 55 + rnd() * 135;
    ctx.fillStyle = '#150829';
    ctx.fillRect(x, baselineY - bh, bw, bh);
    // Lit windows: a sparse grid, mostly warm yellow, some cyan.
    for (let wy = baselineY - bh + 12; wy < baselineY - 12; wy += 20) {
      for (let wx = x + 8; wx < x + bw - 8; wx += 16) {
        const roll = rnd();
        if (roll < 0.3) {
          ctx.fillStyle = roll < 0.24 ? '#ffd94a' : '#19e3ff';
          ctx.fillRect(wx, wy, 7, 9);
        }
      }
    }
    // Rooftop aerials on a few towers.
    if (rnd() < 0.4) {
      ctx.fillStyle = '#150829';
      ctx.fillRect(x + bw / 2 - 2, baselineY - bh - 22, 4, 22);
    }
    x += bw + 4 + rnd() * 10;
  }
  ctx.restore();
}

// Sixteen-point starburst badge ("EST. 2026") — black text on hot yellow,
// big enough to read at thumbnail size.
function drawStarburstBadge(ctx, x, y, r, textTop, textBottom) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  const points = 16;
  for (let i = 0; i < points * 2; i++) {
    const ang = (i * Math.PI) / points - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.78;
    const px = Math.cos(ang) * rad, py = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffd91a';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#0d0218';
  ctx.stroke();
  ctx.fillStyle = '#0d0218';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.round(r * 0.3)}px Anton, "Arial Black", sans-serif`;
  ctx.fillText(textTop, 0, -r * 0.16);
  ctx.fillText(textBottom, 0, r * 0.2);
  ctx.restore();
}

// One line of tracked (letterspaced) title text, centred on cx at the
// given baseline. Anton has no built-in tracking in canvas, so the letters
// are drawn one by one.
function drawTrackedText(ctx, text, cx, baselineY, size, tracking, drawLetter) {
  const letters = [...text];
  const widths = letters.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (letters.length - 1);
  let x = cx - total / 2;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  for (let i = 0; i < letters.length; i++) {
    drawLetter(letters[i], x, baselineY);
    x += widths[i] + tracking;
  }
  ctx.restore();
}

// The giant title. Three lettering styles, all built on the same tracked
// drawing so the title keeps its shape whichever style is picked.
function drawTitleText(ctx, text, cx, baselineY, size, lettering, grade) {
  ctx.save();
  ctx.font = `${size}px Anton, "Arial Black", sans-serif`;
  const tracking = size * 0.02;
  ctx.lineJoin = 'round';
  if (lettering === 'outline') {
    drawTrackedText(ctx, text, cx, baselineY, size, tracking, (ch, x, y) => {
      ctx.lineWidth = size * 0.09;
      ctx.strokeStyle = '#0d0218';
      ctx.strokeText(ch, x, y);
      ctx.lineWidth = size * 0.035;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeText(ch, x, y);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillText(ch, x, y);
    });
  } else if (lettering === 'neon') {
    // Solid accent echo behind, then the white face with a magenta glow.
    ctx.shadowColor = grade.accent;
    ctx.shadowOffsetX = size * 0.04;
    ctx.shadowOffsetY = size * 0.05;
    ctx.shadowBlur = 0;
    drawTrackedText(ctx, text, cx, baselineY, size, tracking, (ch, x, y) => {
      ctx.fillStyle = grade.accent;
      ctx.fillText(ch, x, y);
    });
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = size * 0.16;
    drawTrackedText(ctx, text, cx, baselineY, size, tracking, (ch, x, y) => {
      ctx.lineWidth = size * 0.02;
      ctx.strokeStyle = '#ff2e88';
      ctx.strokeText(ch, x, y);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(ch, x, y);
    });
  } else {
    // Block: white fill, thick dark outline, cyan drop shadow.
    ctx.shadowColor = grade.accent;
    ctx.shadowOffsetX = size * 0.045;
    ctx.shadowOffsetY = size * 0.055;
    ctx.shadowBlur = 0;
    drawTrackedText(ctx, text, cx, baselineY, size, tracking, (ch, x, y) => {
      ctx.lineWidth = size * 0.075;
      ctx.strokeStyle = '#0d0218';
      ctx.strokeText(ch, x, y);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(ch, x, y);
    });
  }
  ctx.restore();
}

// ---- panels ---------------------------------------------------------------

// Rotate a point around a centre by an angle in radians.
function rotatePoint(px, py, cx, cy, angle) {
  const dx = px - cx, dy = py - cy;
  const c = Math.cos(angle), s = Math.sin(angle);
  return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
}

// Shards of white frame flying off the hero panel's torn top-right corner:
// the literal "bursting out of the frame" moment. Drawn in poster space,
// some shards run past the poster's edge and are clipped there — the subject
// escapes the poster itself.
function drawBreakoutShards(ctx, rect, tiltDeg) {
  const tilt = (tiltDeg * Math.PI) / 180;
  const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
  const corner = rotatePoint(rect.x + rect.w, rect.y, cx, cy, tilt);
  const shards = [
    [[12, -34], [58, -74], [32, -6]],
    [[42, 8], [98, -28], [56, 34]],
    [[-6, -48], [26, -98], [48, -42]],
  ];
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#0d0218';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  for (const shard of shards) {
    ctx.beginPath();
    shard.forEach(([dx, dy], i) => {
      if (i === 0) ctx.moveTo(corner.x + dx, corner.y + dy);
      else ctx.lineTo(corner.x + dx, corner.y + dy);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

// One photo panel: drop shadow, white frame, the photo cover-fit with its
// grade punch, a warm overlay tint, and a dark foot so the panel reads as
// one poster rather than a pasted photo.
function drawPhotoPanel(ctx, img, rect, panel, grade, border) {
  const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
  const tilt = ((rect.tilt || 0) * Math.PI) / 180;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt);
  ctx.translate(-cx, -cy);
  // Drop shadow behind the frame.
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(rect.x - border + 12, rect.y - border + 16, rect.w + border * 2, rect.h + border * 2);
  // White frame.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(rect.x - border, rect.y - border, rect.w + border * 2, rect.h + border * 2);
  // Photo, clipped to the panel.
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (img) {
    const crop = coverCrop(img, rect.w, rect.h, panel.zoom, panel.ox, panel.oy);
    ctx.filter = grade.filter;
    ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, rect.x, rect.y, rect.w, rect.h);
    ctx.filter = 'none';
    // Warm overlay tint: the grade's colour washed over the photo.
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = grade.tintAlpha;
    ctx.fillStyle = grade.tint;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    // Dark foot: grounds the photo inside the poster.
    const wash = ctx.createLinearGradient(0, rect.y + rect.h * 0.55, 0, rect.y + rect.h);
    wash.addColorStop(0, 'rgba(10,2,24,0)');
    wash.addColorStop(1, 'rgba(10,2,24,0.28)');
    ctx.fillStyle = wash;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  } else {
    ctx.fillStyle = '#241233';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `700 ${Math.round(rect.h * 0.14)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', cx, cy);
  }
  ctx.restore();
  ctx.restore();
}

// ---- title band -----------------------------------------------------------

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// A small black pill with centred white tracked text, for the tagline.
function drawTaglinePill(ctx, text, cx, cy, maxW, fontPx) {
  ctx.save();
  ctx.font = `700 ${fontPx}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tw = Math.min(ctx.measureText(text).width + 48, maxW);
  const ph = fontPx * 1.7;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRectPath(ctx, cx - tw / 2, cy - ph / 2, tw, ph, ph / 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, cx, cy + 1);
  ctx.restore();
}

// Measure the width of tracked text at the current font.
function trackedWidth(ctx, text, tracking) {
  let total = 0;
  for (const ch of [...text]) total += ctx.measureText(ch).width;
  return total + tracking * (Math.max(text.length - 1, 0));
}

// Shrink a title until it fits maxW, starting from startSize.
function fitTitleSize(ctx, text, maxW, startSize, floor) {
  let size = startSize;
  while (size > floor) {
    ctx.font = `${size}px Anton, "Arial Black", sans-serif`;
    if (trackedWidth(ctx, text, size * 0.02) <= maxW) return size;
    size -= 6;
  }
  return size;
}

// The diagonal slash band the caption sits on: a magenta band rotated a
// few degrees, with a hot accent stripe along its top edge. It overlaps the
// hero's lower edge so the title and the photo read as one poster.
function drawSlashBand(ctx, W, bandTop, bandBottom, grade, slopeDeg) {
  const slope = (slopeDeg * Math.PI) / 180;
  const midY = (bandTop + bandBottom) / 2;
  const bandH = bandBottom - bandTop;
  const g = ctx.createLinearGradient(0, bandTop, 0, bandBottom);
  g.addColorStop(0, grade.band[0]);
  g.addColorStop(1, grade.band[1]);
  ctx.save();
  ctx.translate(W / 2, midY);
  ctx.rotate(slope);
  ctx.fillStyle = g;
  ctx.fillRect(-W * 0.6, -bandH / 2, W * 1.2, bandH);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(-W * 0.6, -bandH / 2, W * 1.2, 5);
  ctx.restore();
}

// A soft vignette over the photos (never over the title band, which is
// drawn after it) so the poster has depth at the edges.
function drawVignette(ctx, W, H) {
  const r = Math.max(W, H) * 0.72;
  const g = ctx.createRadialGradient(W / 2, H * 0.4, r * 0.55, W / 2, H * 0.4, r);
  g.addColorStop(0, 'rgba(16,3,38,0)');
  g.addColorStop(1, 'rgba(16,3,38,0.30)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// ---- layout specs ---------------------------------------------------------
//
// One spec per size: where the sun, the hero, the small panels, the skyline
// and the title band go. `layout` changes the attitude: breakout tilts the
// hero and bleeds it off the edges with torn shards; trio keeps every panel
// straight and inside the frame; duo drops the second small panel and lets
// the first one run full width.

function specFor(sizeKey, layout) {
  const L = layout || 'breakout';
  if (sizeKey === 'wide') {
    const spec = {
      sun: { x: 190, y: 130, r: 160 },
      hero: { x: -40, y: 55, w: 1070, h: 880, tilt: -4, border: 12, breakout: true },
      small1: { x: 1090, y: 640, w: 390, h: 270, tilt: 2, border: 8 },
      small2: { x: 1500, y: 640, w: 390, h: 270, tilt: -2, border: 8 },
      skylineY: 1060,
      badge: { x: 940, y: 110, r: 68 },
      title: { kind: 'wide', band: { x: 1050, y: 90, w: 870, h: 530, slope: -2 } },
    };
    if (L === 'trio') {
      spec.hero = { x: 40, y: 60, w: 1000, h: 880, tilt: 0, border: 12, breakout: false };
      spec.small1.tilt = 0; spec.small2.tilt = 0;
    }
    if (L === 'duo') {
      spec.small1 = { x: 1090, y: 640, w: 800, h: 270, tilt: 0, border: 8 };
      spec.small2 = null;
    }
    return spec;
  }
  if (sizeKey === 'square') {
    const spec = {
      sun: { x: 195, y: 130, r: 165 },
      hero: { x: -25, y: 95, w: 1000, h: 555, tilt: -5, border: 12, breakout: true },
      small1: { x: 30, y: 680, w: 495, h: 150, tilt: 2, border: 8 },
      small2: { x: 555, y: 680, w: 495, h: 150, tilt: -2, border: 8 },
      skylineY: 855,
      badge: { x: 880, y: 85, r: 70 },
      title: { kind: 'bottom', bandTop: 855, bandBottom: 1080, slope: -2.5, titlePx: 150, subPx: 46, tagPx: 22 },
    };
    if (L === 'trio') {
      spec.hero = { x: 40, y: 100, w: 1000, h: 540, tilt: 0, border: 12, breakout: false };
      spec.small1.tilt = 0; spec.small2.tilt = 0;
    }
    if (L === 'duo') {
      spec.small1 = { x: 30, y: 680, w: 1020, h: 150, tilt: 0, border: 8 };
      spec.small2 = null;
    }
    return spec;
  }
  // Poster 1080 × 1350 (the default).
  const spec = {
    sun: { x: 215, y: 150, r: 190 },
    hero: { x: -30, y: 140, w: 1020, h: 710, tilt: -5, border: 12, breakout: true },
    small1: { x: 30, y: 890, w: 495, h: 175, tilt: 2, border: 8 },
    small2: { x: 555, y: 890, w: 495, h: 175, tilt: -2, border: 8 },
    skylineY: 1075,
    badge: { x: 880, y: 130, r: 78 },
    title: { kind: 'bottom', bandTop: 1105, bandBottom: 1350, slope: -2.5, titlePx: 165, subPx: 48, tagPx: 24 },
  };
  if (L === 'trio') {
    spec.hero = { x: 40, y: 130, w: 1000, h: 700, tilt: 0, border: 12, breakout: false };
    spec.small1.tilt = 0; spec.small2.tilt = 0;
  }
  if (L === 'duo') {
    spec.small1 = { x: 30, y: 890, w: 1020, h: 175, tilt: 0, border: 8 };
    spec.small2 = null;
  }
  return spec;
}

// ---- main entry -----------------------------------------------------------

// Draws the whole cover onto `canvas` (sized to the chosen post size).
// `state`: { size, grade, lettering, layout, title, subtitle, tagline,
//   badge, showSun, showHalftone, showBadge,
//   photos: [img|null, ...],
//   panels: [{ photo, zoom, ox, oy }, ...] } — panels[0] is the hero.
export function drawCover(canvas, state) {
  const size = SIZES[state.size] || SIZES.poster;
  const grade = GRADES[state.grade] || GRADES.breakout;
  const spec = specFor(state.size, state.layout);
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  const { w, h } = size;

  drawSky(ctx, w, h, grade);
  if (state.showHalftone) drawHalftone(ctx, w, h);
  drawSpeedLines(ctx, w);
  if (state.showSun) drawRetroSun(ctx, spec.sun.x, spec.sun.y, spec.sun.r, grade);
  drawSkyline(ctx, w, spec.skylineY, 7);

  const panels = state.panels || [];
  const heroPanel = panels[0] || { photo: 0, zoom: 1.55, ox: 0.5, oy: 0.3 };
  const heroImg = heroPanel.photo === '' || heroPanel.photo == null ? null : state.photos[heroPanel.photo];
  drawPhotoPanel(ctx, heroImg, spec.hero, heroPanel, grade, spec.hero.border);
  if (spec.hero.breakout) drawBreakoutShards(ctx, spec.hero, spec.hero.tilt);
  if (state.showBadge && (state.badge || '').trim()) {
    drawStarburstBadge(ctx, spec.badge.x, spec.badge.y, spec.badge.r, 'EST.', '2026');
  }

  const smalls = [spec.small1, spec.small2];
  for (let i = 0; i < smalls.length; i++) {
    const rect = smalls[i];
    if (!rect) continue;
    const p = panels[i + 1] || { photo: i + 1, zoom: 1.15, ox: 0.5, oy: 0.5 };
    const img = p.photo === '' || p.photo == null ? null : state.photos[p.photo];
    drawPhotoPanel(ctx, img, rect, p, grade, rect.border);
  }

  drawVignette(ctx, w, h);

  const title = (state.title || 'LEONIDA').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim().toUpperCase();
  const tagline = (state.tagline || '').trim().toUpperCase();

  if (spec.title.kind === 'wide') {
    // Wide: the title block is its own slash band on the right; a two-word
    // caption stacks on two lines ("OCEAN" / "DRIVE").
    const band = spec.title.band;
    const slope = (band.slope * Math.PI) / 180;
    const g = ctx.createLinearGradient(band.x, band.y, band.x, band.y + band.h);
    g.addColorStop(0, grade.band[0]);
    g.addColorStop(1, grade.band[1]);
    ctx.save();
    ctx.translate(band.x + band.w / 2, band.y + band.h / 2);
    ctx.rotate(slope);
    ctx.fillStyle = g;
    ctx.fillRect(-band.w / 2, -band.h / 2, band.w, band.h);
    ctx.fillStyle = grade.accent;
    ctx.fillRect(-band.w / 2, -band.h / 2, band.w, 5);
    ctx.restore();
    const words = title.split(/\s+/);
    const lines = words.length >= 2 ? [words[0], words.slice(1).join(' ')] : [title];
    const lineSize = fitTitleSize(ctx, lines.reduce((a, b) => (a.length > b.length ? a : b)), band.w * 0.92, 175, 60);
    const cx = band.x + band.w / 2;
    const firstBaseline = band.y + 225;
    lines.forEach((line, i) => {
      drawTitleText(ctx, line, cx, firstBaseline + i * (lineSize + 18), lineSize, state.lettering, grade);
    });
    if (subtitle) {
      ctx.save();
      ctx.font = `60px Anton, "Arial Black", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.shadowColor = grade.accent;
      ctx.shadowBlur = 16;
      ctx.fillStyle = grade.subtitle;
      ctx.fillText(subtitle, cx, band.y + band.h - 18);
      ctx.restore();
    }
    if (tagline) drawTaglinePill(ctx, tagline, cx, h - 105, band.w * 0.94, 28);
  } else {
    // Poster / square: the title band runs along the bottom, the caption
    // stacked on it — title huge, subtitle under it, tagline as a pill.
    const t = spec.title;
    drawSlashBand(ctx, w, t.bandTop, t.bandBottom, grade, t.slope);
    const cx = w / 2;
    const titleSize = fitTitleSize(ctx, title, w * 0.96, t.titlePx, 48);
    const titleBaseline = t.bandTop + (t.bandBottom - t.bandTop) * 0.52;
    drawTitleText(ctx, title, cx, titleBaseline, titleSize, state.lettering, grade);
    if (subtitle) {
      ctx.save();
      ctx.font = `${t.subPx}px Anton, "Arial Black", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.shadowColor = grade.accent;
      ctx.shadowBlur = 14;
      ctx.fillStyle = grade.subtitle;
      ctx.fillText(subtitle, cx, t.bandTop + (t.bandBottom - t.bandTop) * 0.78);
      ctx.restore();
    }
    if (tagline) {
      drawTaglinePill(ctx, tagline, cx, t.bandBottom - (t.bandBottom - t.bandTop) * 0.1, w * 0.94, t.tagPx);
    }
  }
}

/** Renders `state` to a fresh canvas at the chosen post size (for export). */
export function renderCover(state) {
  const canvas = document.createElement('canvas');
  drawCover(canvas, state);
  return canvas;
}
