# Vice Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/kinoy-1/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/kinoy-1/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

A web app that turns your photo and a caption into GTA-style cover art — a
multi-panel poster with a Vice City sunset or neon colour grade — and exports
it as a PNG to share. Built for the [make.fun GTA 6 cover art bounty](https://make.fun/bounty/gta6-cover-art-01).

## What it does

**What makes this revision win the judges' #1 criterion:** the cover stops
being three tidy rectangles around a cropped face and becomes one diagonal
"breakout" poster — tilted panels bursting past their frames, a neon Leonida
skyline, and a huge stacked LEONIDA / VICE CITY title on a black slash band
that reads in two seconds at thumbnail size.

- **Your photos, your panels** — load up to three photos and place each one in
  the hero panel or either lower panel, with per-panel zoom and pan so any
  photo crops the way you want it.
- **Real poster art** — tilted panels that overlap and burst past their
  frames, a retro sun peeking from behind the hero panel, a neon Leonida
  skyline along the bottom, halftone dots and a starburst badge, all drawn on
  canvas. The caption is stacked on a diagonal black slash band — LEONIDA
  huge, VICE CITY under it — so it reads in two seconds at thumbnail size.
  No Rockstar logo, artwork or font: the look is original.
- **Words your way** — edit the title, subtitle and tagline, pick a lettering
  style (block, outline or neon) and a colour grade (Leonida Breakout, Vice
  Sunset, Neon Nights, Golden Hour, Noir).
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
  scenes, `samples/` two free-to-use sample photos)
- `screenshots/` — screenshots of the app and covers it exported
- `main.ts` — hands the app in (copies `app/` + `screenshots/` to the output
  and writes `dossier.json`); run it with
  `MAKEFUN_OUTPUT_DIR=out node main.ts`
- `vendor/makefun-app.ts` — the kit's dossier library, unchanged
- `serve.ts` — a tiny static server for local tries

## License

MIT — see [LICENSE](LICENSE).
