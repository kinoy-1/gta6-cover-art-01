// Fixed scenes for screenshots: ?shot=editor shows the page with photos loaded;
// ?shot=cover shows the cover alone; ?shot=export runs the real export pipeline
// and writes its PNG byte size into the page, so the export can be verified
// without a download. `photo`, `photo2`, `photo3` pick the samples for slots
// A, B and C; `size`, `grade`, `lettering`, `caption`, `subtitle`, `tagline`
// set the cover. window.__shotReady is set once the scene is painted.
import { renderCover } from './cover.js';

export async function runShot(shot, query, state, loadSample, redraw) {
  if (shot === 'cover') document.body.classList.add('shot-cover');

  const size = query.get('size');
  if (size && ['poster', 'square', 'wide'].includes(size)) {
    state.size = size;
    document.getElementById('size').value = size;
  }
  const grade = query.get('grade');
  if (grade && ['breakout', 'sunset', 'neon', 'gold', 'noir'].includes(grade)) {
    state.grade = grade;
    document.getElementById('grade').value = grade;
  }
  const lettering = query.get('lettering');
  if (lettering && ['block', 'outline', 'neon'].includes(lettering)) {
    state.lettering = lettering;
    document.getElementById('lettering').value = lettering;
  }
  const caption = query.get('caption');
  if (caption !== null) {
    state.title = caption;
    document.getElementById('title').value = caption;
  }
  const subtitle = query.get('subtitle');
  if (subtitle !== null) {
    state.subtitle = subtitle;
    document.getElementById('subtitle').value = subtitle;
  }
  const tagline = query.get('tagline');
  if (tagline !== null) {
    state.tagline = tagline;
    document.getElementById('tagline').value = tagline;
  }
  // Per-panel crop for a scene: oy0/oy1/oy2 pan up-down, zoom0/zoom1/zoom2
  // zoom. Portrait photos need oy near 1 in a landscape hero panel so the
  // faces at the top of the photo stay in frame.
  for (let i = 0; i < 3; i++) {
    const oy = query.get(`oy${i}`);
    if (oy !== null) {
      state.panels[i].oy = Number(oy);
      document.getElementById(`panel-oy-${i}`).value = oy;
    }
    const zoom = query.get(`zoom${i}`);
    if (zoom !== null) {
      state.panels[i].zoom = Number(zoom);
      document.getElementById(`panel-zoom-${i}`).value = zoom;
    }
  }

  const samples = [query.get('photo') ?? 'boulevard', query.get('photo2') ?? 'pier', query.get('photo3') ?? 'neon'];
  for (let slot = 0; slot < 3; slot++) {
    await loadSample(slot, samples[slot]);
  }
  redraw();

  if (shot === 'export') {
    const out = renderCover(state);
    const blob = await new Promise((resolve) => out.toBlob(resolve, 'image/png'));
    const note = blob
      ? `export ok: ${out.width}x${out.height} PNG, ${blob.size} bytes`
      : 'export failed: no blob';
    document.getElementById('status').textContent = note;
    document.title = note;
  }

  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
