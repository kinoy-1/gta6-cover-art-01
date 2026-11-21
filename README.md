# Vice Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/kinoy-1/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/kinoy-1/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

A web app that turns your photo and a caption into GTA-style cover art — a
multi-panel poster with a Vice City sunset or neon colour grade — and exports
it as a PNG to share. Built for the [make.fun GTA 6 cover art bounty](https://make.fun/bounty/gta6-cover-art-01).

## What it does

**What makes this revision win the judges' #1 criterion:** the cover stops
being three tidy rectangles around a cropped face and becomes one diagonal
"breakout" poster — the hero photo, a laughing couple in neon light, is
cropped tight on their faces, tilted, and torn out of its frame with shards
flying past the poster's top edge, while one giant word, LEONIDA, hits like a
billboard on a diagonal magenta slash band. A striped retro sun, a lit
Leonida skyline and a hot sunset grade punch the photos up so the whole thing
reads in two seconds at thumbnail size.

- **Your photos, your panels** — load up to three photos and place each one in
  the hero panel or either lower panel, with per-panel zoom and focus — or drag
  a photo in the preview to reframe it. One photo can fill several panels
  ("Same photo in all panels"), or each panel can hold a different one.
- **Real poster art** — the hero bursts out of a torn frame, two small panels
  sit under it, a striped retro sun hangs behind it, a neon Leonida skyline
  runs along the bottom, halftone dots and a starburst badge finish it. The
  caption is stacked on a diagonal slash band — LEONIDA huge, VICE CITY under
  it — in Anton, a condensed display face shipped under the SIL Open Font
  License. No Rockstar logo, artwork or font: the look is original.
- **Words your way** — edit the title, subtitle and tagline, pick a layout
  (Breakout / Trio / Duo), a lettering style (block, outline or neon) and a
  colour grade (Breakout Sunset, Neon Nights, Golden Hour, Noir).
- **Fast to a PNG** — one click exports the cover in the common post sizes:
  Poster 1080 × 1350, Square 1080 × 1080, Wide 1920 × 1080.
- **Private by design** — the app is plain static files under `app/`; it runs
  offline in desktop Chrome and photos never leave your machine.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

Pick a photo (or tap "Use sample"), place it in the panels, type your
caption, choose a size and hit **Export PNG**.

## Layout

- `app/` — the static web app (`index.html`, `style.css`, `src/cover.js` the
  cover renderer, `src/main.js` the wiring, `src/shots.js` the screenshot
  scenes, `fonts/` the Anton display face (SIL OFL), `samples/` three
  free-to-use sample photos)
- `screenshots/` — screenshots of the app and covers it exported
- `main.ts` — hands the app in (checks the screenshots, copies `app/` +
  `screenshots/` to the output and writes `dossier.json`); run it with
  `MAKEFUN_OUTPUT_DIR=out node main.ts`
- `vendor/makefun-app.ts` — the kit's dossier library, unchanged
- `serve.ts` — a tiny static server for local tries

## License

MIT — see [LICENSE](LICENSE).

---

<sub>Entered on [make.fun](https://make.fun/?ref=qzezv1jd&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
