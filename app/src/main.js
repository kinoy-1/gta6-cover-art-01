// Vice Cover Studio — wires the page: load up to three photos, place each in
// a panel with zoom and focus controls (or drag the photo in the preview),
// edit the words, pick a layout, grade and size, and export the cover as a
// PNG. A `?shot=` query sets up a fixed scene for a screenshot instead
// (./shots.js). Photos are read on this machine and never leave it.
import { drawCover, renderCover, SIZES, coverCrop } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const previewNote = document.getElementById('preview-note');
const SAMPLES = ['samples/boulevard.jpg', 'samples/pier.jpg', 'samples/neon.jpg'];

// The editor's state; every control writes here, then redraw() paints it.
// Panels carry a focus point (ox, oy in 0..1 of the photo) and a zoom, so
// the crop follows the faces: the neon couple's faces sit high in their
// photo, so the hero's focus is oy 0.30, not the middle.
const state = {
  size: 'poster',
  grade: 'breakout',
  lettering: 'block',
  layout: 'breakout',
  title: 'LEONIDA',
  subtitle: 'VICE CITY',
  tagline: 'One last ride down Ocean Drive',
  badge: 'EST. 2026',
  showSun: true,
  showHalftone: true,
  showBadge: true,
  photos: [null, null, null],
  panels: [
    { photo: 2, zoom: 1.15, ox: 0.5, oy: 0.25 },
    { photo: 0, zoom: 1.15, ox: 0.5, oy: 0.25 },
    { photo: 1, zoom: 1.15, ox: 0.3, oy: 0.38 },
  ],
};

function redraw() {
  drawCover(canvas, state);
  previewNote.textContent = SIZES[state.size].label;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function setPhoto(slot, img, label) {
  state.photos[slot] = img;
  document.getElementById(`state-${slot}`).textContent = label;
  redraw();
}

for (let slot = 0; slot < 3; slot++) {
  document.getElementById(`photo-${slot}`).addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const img = await loadImage(URL.createObjectURL(file));
      setPhoto(slot, img, file.name);
      status.textContent = `Photo ${'ABC'[slot]} loaded — ${file.name}.`;
    } catch {
      status.textContent = `Could not read ${file.name} as an image.`;
    }
  });
  document.getElementById(`sample-${slot}`).addEventListener('click', async () => {
    const img = await loadImage(SAMPLES[slot]);
    setPhoto(slot, img, `sample ${SAMPLES[slot].split('/').pop()}`);
    status.textContent = `Photo ${'ABC'[slot]} is a sample photo. Pick your own any time.`;
  });
}

// Per-panel crop: which photo fills the panel, how far in, and where the
// focus sits. Focus sliders run 0..1 across the photo (0.5 is the middle).
for (let i = 0; i < 3; i++) {
  const panel = state.panels[i];
  document.getElementById(`panel-photo-${i}`).addEventListener('change', (e) => {
    panel.photo = e.target.value === '' ? '' : Number(e.target.value);
    redraw();
  });
  document.getElementById(`panel-zoom-${i}`).addEventListener('input', (e) => {
    panel.zoom = Number(e.target.value);
    redraw();
  });
  document.getElementById(`panel-ox-${i}`).addEventListener('input', (e) => {
    panel.ox = Number(e.target.value);
    redraw();
  });
  document.getElementById(`panel-oy-${i}`).addEventListener('input', (e) => {
    panel.oy = Number(e.target.value);
    redraw();
  });
}

// One photo in every panel: the fastest way to the "one photo, several
// panels" poster the bounty asks for.
document.getElementById('fill-all').addEventListener('click', () => {
  const slot = state.panels[0].photo;
  for (let i = 0; i < 3; i++) {
    state.panels[i].photo = slot;
    document.getElementById(`panel-photo-${i}`).value = slot === '' ? '' : String(slot);
  }
  redraw();
  status.textContent = 'Every panel now shows the hero photo.';
});

// Drag a photo inside the preview to move its focus: the panel under the
// pointer is the one that moves, so the hero and the small panels can be
// reframed without touching a slider.
const PANEL_RECTS = {
  poster: [
    { x: -30, y: 140, w: 1020, h: 710 },
    { x: 30, y: 890, w: 495, h: 175 },
    { x: 555, y: 890, w: 495, h: 175 },
  ],
  square: [
    { x: -25, y: 95, w: 1000, h: 555 },
    { x: 30, y: 680, w: 495, h: 150 },
    { x: 555, y: 680, w: 495, h: 150 },
  ],
  wide: [
    { x: -40, y: 55, w: 1070, h: 880 },
    { x: 1090, y: 640, w: 390, h: 270 },
    { x: 1500, y: 640, w: 390, h: 270 },
  ],
};

let drag = null;
function panelAtPoint(px, py) {
  const rects = PANEL_RECTS[state.size] || PANEL_RECTS.poster;
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}

function panPhoto(panelIndex, dxPoster, dyPoster) {
  const panel = state.panels[panelIndex];
  const img = panel.photo === '' || panel.photo == null ? null : state.photos[panel.photo];
  if (!img) return;
  const rects = PANEL_RECTS[state.size] || PANEL_RECTS.poster;
  const rect = rects[panelIndex];
  const crop = coverCrop(img, rect.w, rect.h, panel.zoom, panel.ox, panel.oy);
  // Poster pixels per image pixel, so a drag moves the focus by the same
  // distance on the photo it moves on the screen.
  const scaleX = rect.w / crop.sw;
  const scaleY = rect.h / crop.sh;
  panel.ox = Math.min(1, Math.max(0, panel.ox - dxPoster / scaleX / img.naturalWidth));
  panel.oy = Math.min(1, Math.max(0, panel.oy - dyPoster / scaleY / img.naturalHeight));
  document.getElementById(`panel-ox-${panelIndex}`).value = String(panel.ox);
  document.getElementById(`panel-oy-${panelIndex}`).value = String(panel.oy);
}

canvas.addEventListener('pointerdown', (e) => {
  const bounds = canvas.getBoundingClientRect();
  const px = ((e.clientX - bounds.left) / bounds.width) * canvas.width;
  const py = ((e.clientY - bounds.top) / bounds.height) * canvas.height;
  const panelIndex = panelAtPoint(px, py);
  if (panelIndex < 0) return;
  drag = { panelIndex, lastX: e.clientX, lastY: e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const bounds = canvas.getBoundingClientRect();
  const dxPoster = ((e.clientX - drag.lastX) / bounds.width) * canvas.width;
  const dyPoster = ((e.clientY - drag.lastY) / bounds.height) * canvas.height;
  panPhoto(drag.panelIndex, dxPoster, dyPoster);
  drag.lastX = e.clientX;
  drag.lastY = e.clientY;
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('pointercancel', () => { drag = null; });

document.getElementById('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
document.getElementById('tagline').addEventListener('input', (e) => { state.tagline = e.target.value; redraw(); });
document.getElementById('badge').addEventListener('input', (e) => { state.badge = e.target.value; redraw(); });
document.getElementById('grade').addEventListener('change', (e) => { state.grade = e.target.value; redraw(); });
document.getElementById('lettering').addEventListener('change', (e) => { state.lettering = e.target.value; redraw(); });
document.getElementById('layout').addEventListener('change', (e) => { state.layout = e.target.value; redraw(); });
document.getElementById('size').addEventListener('change', (e) => { state.size = e.target.value; redraw(); });
document.getElementById('show-sun').addEventListener('change', (e) => { state.showSun = e.target.checked; redraw(); });
document.getElementById('show-halftone').addEventListener('change', (e) => { state.showHalftone = e.target.checked; redraw(); });
document.getElementById('show-badge').addEventListener('change', (e) => { state.showBadge = e.target.checked; redraw(); });

// One click from a photo to a PNG in the chosen post size: render the cover
// at full resolution offscreen and download it. The filename carries the
// size so a shared PNG says what it is.
function exportPoster() {
  const out = renderCover(state);
  const size = SIZES[state.size];
  out.toBlob((blob) => {
    if (!blob) { status.textContent = 'Export failed — try again.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${size.w}x${size.h}.png`;
    a.click();
    status.textContent = `Saved vice-cover-${size.w}x${size.h}.png (${Math.round(blob.size / 1024)} KiB).`;
  }, 'image/png');
}

document.getElementById('export').addEventListener('click', exportPoster);

// The display font (Anton, shipped under app/fonts) loads after the first
// paint; redraw once it arrives so the preview shows the real lettering.
if (document.fonts && document.fonts.load) {
  document.fonts.load('165px Anton').then(redraw).catch(() => {});
}

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, state, async (slot, sample) => {
    const img = await loadImage(`samples/${sample}.jpg`);
    setPhoto(slot, img, `sample ${sample}.jpg`);
  }, redraw);
} else {
  redraw();
}
