// Vice Cover Studio — wires the page: load up to three photos, place each in a
// panel with crop and position controls, edit the words, pick a grade and size,
// and export the cover as a PNG. A `?shot=` query sets up a fixed scene for a
// screenshot instead (./shots.js). Photos are read on this machine and never leave it.
import { drawCover, renderCover, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const previewNote = document.getElementById('preview-note');
const SAMPLES = ['samples/boulevard.jpg', 'samples/pier.jpg', 'samples/boulevard.jpg'];

/** The editor's state; every control writes here, then redraw() paints it. */
const state = {
  size: 'poster',
  grade: 'sunset',
  lettering: 'block',
  title: 'VICE SUNSET',
  subtitle: 'One last ride down Ocean Drive',
  badge: 'EST. 2026',
  showSun: true,
  showPalms: true,
  showHalftone: true,
  photos: [null, null, null],
  panels: [
    { photo: 0, zoom: 1.15, ox: 0, oy: 0 },
    { photo: 1, zoom: 1.2, ox: 0, oy: 0 },
    { photo: 2, zoom: 1.2, ox: 0, oy: 0 },
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

document.getElementById('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
document.getElementById('badge').addEventListener('input', (e) => { state.badge = e.target.value; redraw(); });
document.getElementById('grade').addEventListener('change', (e) => { state.grade = e.target.value; redraw(); });
document.getElementById('lettering').addEventListener('change', (e) => { state.lettering = e.target.value; redraw(); });
document.getElementById('size').addEventListener('change', (e) => { state.size = e.target.value; redraw(); });
document.getElementById('show-sun').addEventListener('change', (e) => { state.showSun = e.target.checked; redraw(); });
document.getElementById('show-palms').addEventListener('change', (e) => { state.showPalms = e.target.checked; redraw(); });
document.getElementById('show-halftone').addEventListener('change', (e) => { state.showHalftone = e.target.checked; redraw(); });

document.getElementById('export').addEventListener('click', () => {
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
});

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
