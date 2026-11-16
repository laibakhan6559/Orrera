# ORRERA - A Pocket Solar System

Interactive, API-free educational Solar System explorer. Built with React, TypeScript, Vite and Tailwind CSS.

Built by **LAKhan** @2026. All Rights Reserved.

## Status

| Step | Scope | State |
|---|---|---|
| 1 | Foundation: Vite, routing, navbar, footer, "Brass & Void" theme, responsive layout, Home | Done |
| 2 | Data: Sun + 8 planets, 27 facts, 20 quiz questions, unit formatting, validation, tests | Done |
| 3 | 3D base: canvas, camera, lights, star field, loading state, WebGL fallback, error boundary | Done |
| 4 | Sun, 8 planets, procedural textures, Saturn rings, orbit lines, delta-time animation, play/pause/speed | Done |
| 5 | Interaction: click/tap select, camera focus, info panel, object list, reset view, mobile drawer, `?focus=` links | Done |
| 6 | Compare, Facts, Quiz, Settings, favorites (LocalStorage) | Done |
| 7 | Polish, accessibility, performance, deploy | Done |

All pages are live: `/`, `/explore` (3D), `/globe` (360°), `/planet/:slug`, `/compare`, `/facts`, `/quiz`, `/settings`.

## Pages

- **360° View** (`/globe`) - Sun, all eight planets and the Moon as big 3D models. They turn a full 360° on their tilted axis; drag to turn by hand, scroll/pinch or +/- buttons to zoom, optional axis line. Shows the real rotation period and tilt (the on-screen spin is sped up). Built with three.js, react-three-fiber and drei (`OrbitControls`, `Stars`, `Line`). Link to one object with `/globe?body=saturn`.
- **Compare** - pick 2 to 4 planets; size chart (true proportions) and a table with bars and "x Earth" ratios. The selection lives in the address (`/compare?p=earth,mars`), so it can be shared.
- **Facts** - fact of the day (changes with your local date), random fact, search and topic filter.
- **Quiz** - choose difficulty and length; questions and answers are shuffled, keys 1 to 4 answer, every answer is explained, wrong answers are reviewed at the end, best score per difficulty is saved.
- **Settings** - units (metric/imperial), motion (follow device/reduce), 3D quality (auto/low/high), saved favorites, quiz scores, reset.
- **Favorites** - the heart on any planet card or page. Saved ones appear on Home.

## Privacy

Settings, favorites and quiz scores are stored in this browser only (`localStorage`, key `orrera:v1`). No accounts, no tracking, no outside requests. Settings > Reset local data removes them. If storage is blocked, the app keeps working for the session.

## Accessibility and performance

- Skip link, landmarks, one h1 per page, focus moves to the main area after navigation, visible focus rings, 44px touch targets, `prefers-reduced-motion` plus an in-app override.
- Automated checks: axe-core runs on every route in tests (`src/tests/a11y.test.tsx`) and was also run with colour contrast in a real browser at 1440 and 390 px width, with no horizontal overflow.
- Pages are code-split. The 3D library (~254 KB gzip) loads only on `/explore`; the main bundle is ~107 KB gzip.
- "Auto" 3D quality uses fewer polygons and pixels on devices reporting 4 or fewer CPU cores.

## 3D Explorer

- Built with `three`, `@react-three/fiber` and `@react-three/drei`. The canvas is lazy-loaded, so the home page stays light.
- No image files: every planet texture is generated at runtime from a seeded random generator (`src/utils/proceduralTextures.ts`), so there are no texture licences and nothing extra to host.
- **Not to scale.** Sizes and distances are display values from `visual.*` in `bodies.json`. Orbit speeds keep the correct order (inner planets are faster) but are compressed with a square root so Neptune still visibly moves. This is stated on screen.
- Animation is time-based (uses frame delta, capped at 0.1 s) and scaled by the speed setting; pausing sets the time scale to 0.
- Controls: click/tap a planet or use the object list, Esc to clear, Reset view, Play/Pause, speed, orbit and label toggles. Link straight to a planet with `/explore?focus=saturn`.
- Reduced motion: the scene starts paused and camera moves become instant.
- If WebGL is missing or the scene fails, `/explore` falls back to a plain list of links to every planet page.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit + component tests
npm run typecheck
npm run lint
npm run build      # outputs dist/
npm run preview
```

Requires Node 20+.

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. In Vercel choose **Add New > Project** and import the repo.
3. Framework preset: **Vite** (auto-detected). Build command `npm run build`, output `dist`.
4. Deploy. `vercel.json` already rewrites all routes to `index.html` (so `/planet/earth` works on refresh), caches `/assets/*` as immutable and adds security headers.

Or with the CLI: `npx vercel --prod`.

## Project layout

```
src/
  app/          router, routes, providers
  components/   layout, home, planets, explorer, compare, quiz, ui
  store/        explorerStore, settingsStore (persisted)
  data/         bodies.json, facts.json, quiz.json, types.ts, index.ts
  pages/        Home, Explorer, PlanetDetail, Compare, Facts, Quiz, Settings, NotFound
  utils/        units, stats, dataValidation, compare, facts, quiz, quality, random, 3D helpers
  tests/        vitest tests
```

## Data notes

- Planet values follow the NASA Planetary Fact Sheet (metric), last updated 18 March 2025. Sun values follow the NASA Sun Fact Sheet.
- Every record has `sources`, `dataAsOf` and `lastReviewed`. Moon counts carry an "as of" date because they change.
- Missing values are `null` and display as "Not in this dataset"; nothing is guessed.
- Gas and ice giants have no solid surface, so their temperature and gravity are labelled as 1-bar values.
- Venus and Uranus have negative sidereal rotation periods, meaning retrograde spin.
- Scientific values and display values (`visual.*`) are stored separately. The visualization is **not to scale**.
- Data is validated by `src/utils/dataValidation.ts` and checked in `src/tests/data.test.ts`.

## Design

"Brass & Void": near-black background, antique brass lines and accents, Fraunces (serif) headings, Manrope body, JetBrains Mono data labels. Planets are procedural (CSS gradients), so there are no texture licences or large image downloads.
