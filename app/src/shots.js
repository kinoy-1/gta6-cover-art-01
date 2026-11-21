// Fixed scenes for screenshots: ?shot=editor shows the page with photos loaded;
// ?shot=cover shows the cover alone; ?shot=export runs the real export pipeline
// and writes its PNG byte size into the page, so the export can be verified
// without a download.
//
// `photo`, `photo2`, `photo3` pick the samples for slots A, B and C;
// `hero`, `small1`, `small2` pick which slot fills each panel (0, 1 or 2);
// `size`, `grade`, `lettering`, `layout`, `caption`, `subtitle`, `tagline`
// set the cover; `zoom0`/`ox0`/`oy0` (and 1/2) set each panel's crop —
// ox/oy are focus points in 0..1 of the photo, so oy 0.30 keeps faces that
// sit high in a portrait photo inside a landscape hero panel.
// window.__shotReady is set once the scene is painted and the display font
// has arrived, so a headless screenshot waits for the real cover.
import { renderCover } from './cover.js';

function setSelect(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function setInput(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

export async function runShot(shot, query, state, loadSample, redraw) {
  if (shot === 'cover') document.body.classList.add('shot-cover');

  const size = query.get('size');
  if (size && ['poster', 'square', 'wide'].includes(size)) {
    state.size = size;
    setSelect('size', size);
  }
  const grade = query.get('grade');
  if (grade && ['breakout', 'neon', 'gold', 'noir'].includes(grade)) {
    state.grade = grade;
    setSelect('grade', grade);
  }
  const lettering = query.get('lettering');
  if (lettering && ['block', 'outline', 'neon'].includes(lettering)) {
    state.lettering = lettering;
    setSelect('lettering', lettering);
  }
  const layout = query.get('layout');
  if (layout && ['breakout', 'trio', 'duo'].includes(layout)) {
    state.layout = layout;
    setSelect('layout', layout);
  }
  const caption = query.get('caption');
  if (caption !== null) {
    state.title = caption;
    setInput('title', caption);
  }
  const subtitle = query.get('subtitle');
  if (subtitle !== null) {
    state.subtitle = subtitle;
    setInput('subtitle', subtitle);
  }
  const tagline = query.get('tagline');
  if (tagline !== null) {
    state.tagline = tagline;
    setInput('tagline', tagline);
  }

  // Which slot fills each panel: the shot, not the editor default, decides.
  const panelParams = ['hero', 'small1', 'small2'];
  for (let i = 0; i < 3; i++) {
    const slot = query.get(panelParams[i]);
    if (slot !== null && ['0', '1', '2'].includes(slot)) {
      state.panels[i].photo = Number(slot);
      setSelect(`panel-photo-${i}`, slot);
    }
  }
  // Per-panel crop for a scene.
  for (let i = 0; i < 3; i++) {
    const zoom = query.get(`zoom${i}`);
    if (zoom !== null) {
      state.panels[i].zoom = Number(zoom);
      setInput(`panel-zoom-${i}`, zoom);
    }
    const ox = query.get(`ox${i}`);
    if (ox !== null) {
      state.panels[i].ox = Number(ox);
      setInput(`panel-ox-${i}`, ox);
    }
    const oy = query.get(`oy${i}`);
    if (oy !== null) {
      state.panels[i].oy = Number(oy);
      setInput(`panel-oy-${i}`, oy);
    }
  }

  const samples = [query.get('photo') ?? 'boulevard', query.get('photo2') ?? 'pier', query.get('photo3') ?? 'neon'];
  for (let slot = 0; slot < 3; slot++) {
    await loadSample(slot, samples[slot]);
  }

  // The title font is a file under app/fonts: wait for it before painting,
  // or the screenshot catches the fallback sans and the cover looks wrong.
  if (document.fonts && document.fonts.load) {
    try {
      await document.fonts.load('165px Anton');
      await document.fonts.load('60px Anton');
      await document.fonts.ready;
    } catch {
      // Fallback sans still renders; the cover is drawn either way.
    }
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

  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
    document.documentElement.dataset.shotReady = '1';
  }));
}
