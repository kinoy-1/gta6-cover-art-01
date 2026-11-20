// Fixed scenes for screenshots: ?shot=editor shows the page with photos loaded;
// ?shot=cover shows the cover alone; ?shot=export runs the real export pipeline
// and writes its PNG byte size into the page, so the export can be verified
// without a download. `photo`, `photo2`, `photo3` pick the samples for slots
// A, B and C; `size`, `grade`, `lettering`, `caption`, `subtitle` set the cover.
// window.__shotReady is set once the scene is painted.
import { renderCover } from './cover.js';

export async function runShot(shot, query, state, loadSample, redraw) {
  if (shot === 'cover') document.body.classList.add('shot-cover');

  const size = query.get('size');
  if (size && ['poster', 'square', 'wide'].includes(size)) {
    state.size = size;
    document.getElementById('size').value = size;
  }
  const grade = query.get('grade');
  if (grade && ['sunset', 'neon', 'gold', 'noir'].includes(grade)) {
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

  const samples = [query.get('photo') ?? 'pier', query.get('photo2') ?? 'boulevard', query.get('photo3') ?? 'pier'];
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
