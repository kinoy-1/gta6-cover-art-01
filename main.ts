// Vice Cover Studio — the hand-in for make.fun's gta6-cover-art-01 bounty.
//
// This program is the entrypoint the grader runs (node22, standard library
// only). It takes the app this directory holds — plain static files under
// app/ that turn a person's photos and a caption into GTA-style cover art —
// and hands it in: it copies app/ and screenshots/ into the output directory
// and writes /output/dossier.json, the summary the judge reads, with the
// vendored make.fun library.
//
// Round 2 (LEONIDA BREAKOUT): the app it hands in is the full-bleed breakout
// poster — the hero photo torn out of its frame, shards flying, one giant
// Anton word on a diagonal slash band. The hand-in itself is unchanged: it
// still copies app/ + screenshots/ and writes the dossier. What is new is a
// self-check before the dossier is written: the hand-in is only worth writing
// when the screenshots the judge sees actually exist and fit the scorer's
// caps, so a broken shot fails loudly here instead of silently at grading.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The program never removes the output directory itself: it only creates it
// (mkdirSync, recursive) and copies files into it.

import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of app
// files, in all, or a path under app/ over 1000 bytes: app/ counts beside
// /output's own 1000-entry cap, its screenshots/ and dossier.json).
const SCREENSHOT_MAX = 262144;
const SCREENSHOT_NAMES = ['1-cover.jpg', '2-editor.jpg', '3-cover-square.jpg', '4-cover-wide.jpg'];

// Fail loudly, before any dossier is written, when the hand-in is missing
// a piece the judge needs: the app's entry point, the display font the
// titles are drawn in, or any of the four screenshots (each inside its cap).
function selfCheck() {
  const problems = [];
  if (!existsSync(join(here, 'app', 'index.html'))) {
    problems.push('app/index.html is missing');
  }
  if (!existsSync(join(here, 'app', 'fonts', 'Anton-Regular.ttf'))) {
    problems.push('app/fonts/Anton-Regular.ttf is missing');
  }
  for (const name of SCREENSHOT_NAMES) {
    const shot = join(here, 'screenshots', name);
    if (!existsSync(shot)) {
      problems.push(`screenshots/${name} is missing`);
    } else if (statSync(shot).size > SCREENSHOT_MAX) {
      problems.push(`screenshots/${name} is over the 256 KiB cap`);
    }
  }
  if (problems.length > 0) {
    throw new Error(`hand-in failed self-check: ${problems.join('; ')}`);
  }
}

selfCheck();

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Pre-flight: the hand-in is only worth writing when the app's entry point
// actually landed in the output directory.
if (!existsSync(join(out, 'app', 'index.html'))) {
  throw new Error('hand-in failed: app/index.html did not copy to the output directory');
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

console.log(`handed in Vice Cover Studio (LEONIDA BREAKOUT) to ${out}`);
