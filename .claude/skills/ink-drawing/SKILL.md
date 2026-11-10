---
name: ink-drawing
description: Draw a building as an inked plate in the manner of Heron (heronaiapp.com) — even stipple tone, hard sun shadows, black structure, paper-white glass, bare ink trees, a flat coloured sun disc — live in WebGL, with shadows that follow the real sun. Use when asked to draw, add or fix an ink drawing of any of the Unofficial Project scenes (Courtyard Homes is done; Villas, pool, gym, lounge, walkway, aerial, entrance are next), or to give another building this look.
---

# Ink drawing

The method behind `src/ink/` in this repo. Courtyard Homes is the worked example (`src/ink/homes.js`).
The full history and the reasoning are in `docs/ink-plan.md`; this file is what you need to do the next one.

## Sources

- The developer's website renders: `git show origin/main:public/images/<name>.webp`, kept outside the repo.
- The developer's brochure (user-supplied link): https://www.jesseltoncourtyard.com/images/Jesselton%20Courtyard.pdf — download it into its own scratch folder, never into the repo, never onto the site. It has the plan widths: Courtyard Homes upper floors 9.15 m, plot 12.8 m (A1/A2, pp. 13–14); Courtyard Villas 8.4 m per home (pp. 17–20). It has no floor heights. Homes stand on a slope: car porch at street level, garden one floor up (pp. 12–13). Pages 3, 9 and 10 show scenes not drawn yet: the aerial, a tree-house play area, the garden walk.
- Widths come from the brochure; heights and details from the render at the same scale. The site must say so. Never use the development's name or the developer's logo on the site.

## What the user wants, and does not

- **Only Heron's drawing method.** Not its page layout: no ruled grid, rulers, corner crosses, title strips, `[01]` notes.
- **The building must look like the developer's render.** Check by overlay (below), not by eye.
- **Glass must read as glass.**
- **Clean, never dirty.** The user rejected random grain twice ("噪点太多" / "看起来太肮脏"). Tone is an even dot screen; light greys are clean paper; no stray specks, no mottling. Do not bring random noise back.
- Unofficial concept site: text says only what the render shows, sizes are estimated, nothing implies it is the developer's material. Do not commit the developer's renders. Do not touch `main` or the live site until the user says 上线; work on the feature branch and send a private preview.
- Reply in Chinese, briefly. Verify before saying something is done.

## How a plate is made (`src/ink/stage.js`)

Three passes, every frame the sun moves:

1. **Tone**: the model, faces carrying only a grey value, lit by one directional sun with hard shadows (PCF, 4096 map, shadow camera ±22 m — call `updateProjectionMatrix()` after changing it), rendered to an MSAA target.
2. **Stipple**: a full-screen shader turns that grey into dots. One round dot per cell (1.8–2.6 CSS px, finer on a small drawing), dot area = coverage, centre jittered ±14 % of a cell so it is not a mechanical screen. Coverage = `0.9 · ((d − 0.2)/0.8)^1.3` where d is darkness, so anything lighter than 20 % is paper. Past d = 0.9 it is solid ink. End custom shaders with `#include <colorspace_fragment>` or the paper goes dark.
3. **Lines**: edges in four weights (`heavy` 1.7, `main` 1, `soft` 0.7, `hair` 0.5 CSS px, thinned on small drawings), drawn after a depth-only pass so faces hide the lines behind them.

Lighting: ambient 0.66; the sun's intensity is normalised so a face square to the drawing, in sun, prints at its own grey.

Camera (`src/ink/project.js`): a **one-point perspective square to the façade, with a shifted frustum** so verticals stay vertical. A view is `{ cx, cy, width, eye, dist, camX }` measured on the façade plane z = 0. Write the frustum straight into `projectionMatrix` (`makePerspective`) — `updateProjectionMatrix()` would undo the shift. `projector(view, w, h)(x, y, z)` gives CSS px for everything drawn outside WebGL (trees, sun disc, hotspots, overlay); keep it a pure function. Perspective matters: it is what shows the soffits and reveals that make recesses and glass read.

Kit calls a model uses:

- `box(x, y, z, w, h, d, grey, { line, clean, shade, cast, flat })`. `flat` = unlit fixed grey (background houses, lit rooms).
- `pane(x0, y0, x1, y1, z, a0, a1)`: a clean upright face. By default it receives no shadow.
- `veil(...)`: multiply-darkens what is behind it. It can only darken; to lighten something, change its grey.
- `seg(pairs, weight)`, `rect(...)`.

## Rules that make it look right

- **Glass**: paper white, out of every cast shadow, set back 0.06–0.25 m in its opening with reveals; solid black frame and mullions, one weight heavier than railings and slats. Where the render shows the interior, build a lit room behind it (back wall, sides, ceiling, floor, all `flat`, ceiling darker) with silhouettes of what shows through (stair, furniture, screens). Where the render shows reflection, a plain white pane.
- **Dense line work** (railings, louvres, slats) goes in `hair` or `soft`, or it buries the tone.
- **Tones from the render**: near-black volumes about 0.18 (not past the solid threshold, so their windows still show), recessed walls about 0.45, timber 0.76, white 0.97.
- **Neighbours**: half a house each side, `flat`, grey pulled to `1 − (1 − a)·0.15`, lines softened. They should read as line only.
- **Trees**: bare, forked, tapering strokes on a 2D canvas (`src/ink/trees.js`), placed in the gaps, slightly in front, scaled with `scaleAt`.
- **Sun**: `src/ink/light.js`. The time is real (sun over George Town now); the façade orientation is unknown, so the light is kept in front, morning from the left, afternoon from the right. Drawn altitude is clamped to 14–52° (or recesses go black at noon). Before sunrise and after dark, say so and keep first or last light. Say all of this in a note under the drawing.
- **Interaction**: drag sideways or use the arrow keys to move the time; let go and it drifts back to live. On touch, a vertical swipe must still scroll. Orange squares open notes. No crosshair, coordinates or extension lines (Heron's layout language).

## The two residence types are drawn alike

Courtyard Homes (`src/ink/homes.js`) and Courtyard Villas (`src/ink/villas.js`) sit side by side in Residences, so they share one camera (square-on, eye 1.7 m, about 24 m back), the same tones, glass and tree rules, and both are draggable `InkDrawing`s (`model="homes" | "villas"`, registered in `src/ink/models.js`). Never give one of them a different viewpoint. A wall with windows is built around its openings (villas.js `wall()`), with a lit room behind each, or the glass ends up inside a solid box. Fallback stills: `node tools/ink/still.cjs <model> public/drawings/<model>-ink.jpg`.

## The oblique scenes (done)

Pool, walkway, lounge, gym, aerial and entrance (and an oblique villas, unused in the site) are the line-drawing scenes in `tools/drawings/scenes/`, built into the ink stage unchanged through `src/ink/adapter.js` (same calls as `tools/drawings/kit.js`; a box or mesh may carry `{ a: grey }`, soft parts default to 0.8, trees are 3D bare branches that cast shadows). `src/ink/scenes.js` lists them with their shadow area. A view with `look: { eye, at, fov, aspect }` is an oblique camera; the light is turned to stay in front of it and swung to the side so shadows fall across what is seen.

In the site they are `<InkPlate scene=… still=… />` (`src/ink/InkPlate.jsx`): looked at, not dragged, redrawn once a minute, all drawn through one shared WebGL context and copied into each card's own canvas. Test page: `sample.html?plates`.

## Making a new scene

1. Model it in `src/ink/<scene>.js` like `homes.js`: one exported default `(kit) => …`, `VIEW` / `CARD_VIEW` / `NARROW_VIEW`, `SPOTS`, and an `OUTLINE` of the main rectangles. Reuse the massing from `tools/drawings/scenes/<scene>.js`, the earlier line drawings traced from the renders.
2. Read proportions off the render with one known element as the ruler. Record them as a table (see `docs/ink-plan.md`, appendix A).
3. Overlay: `node tools/ink/overlay.cjs <render> out.png` (render from `git show origin/main:public/images/<name>.webp`, kept outside the repo). Every main edge within about 10 px. Rectangles in recesses are measured at their opening in the front face, not at the back wall. Generalise `overlay.cjs` (it reads `homes.js` today) when you add a scene.
4. The six oblique scenes (pool, gym, lounge, walkway, aerial, entrance) need a general camera in `stage.js` and `project.js`, not only the square-on one. Side and top faces then carry the tone; trees need leaves.
5. Put it in the site with `<LiveInk still={webp} … />` (`src/ink/LiveInk.jsx`): WebGL starts near the screen, is freed far away, and falls back to the still drawing.

## Checking

Start the dev server first: `npx vite --port 4390`. The test page is `/unofficial-project/sample.html`.

- `node tools/ink/shot.cjs out.png 1440 900 2026-11-09T02:30:00Z` — screenshot at a fixed time (UTC). Also look at afternoon, before sunrise and after dark.
- `node tools/ink/act.cjs 1440 900 tag` — drag, release, keys, hotspot.
- `node tools/ink/touch.cjs` — real touch on a 390 px phone.
- Look at the phone at device scale 3 and at a native-pixel crop of the desktop before saying it is clean.
- `npx eslint src`, `npx vite build`; for a preview, `npx vite build --base ./ --outDir <dir>` and publish that folder.
- Tests run on software WebGL. Smoothness on a real phone has not been measured; say so.
