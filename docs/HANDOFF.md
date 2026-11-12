# Handoff

## What this project is

An independent Aston Martin Formula One fan concept, titled **The Pursuit**. The visual system combines deep green and carbon surfaces, performance-lime accents, condensed display type, official car/driver photography and an interactive engineering studio. The Next.js App Router renders the editorial material to static HTML; client components add filtering, search, comparison, countdown and WebGL interactions.

The research date is **18 October 2026**. Completed race results stop at **11 October 2026**. These dates describe the stored snapshot, not a live connection. Updates require source verification, a content edit and a new build.

## Key decisions

- The 3D car is an original illustrative demonstration with accessible HTML controls and a static failure state. It is not presented as a precise AMR26 model. Chassis-specific details are anchored to official photographs and sourced record text.
- No confidential dimensions, operating maps, aerodynamic measurements, telemetry or live timing are invented. Published specifications, regulatory limits and unknown data are labelled separately.
- Original-marque records, the modern Aston Martin constructor and predecessor-team history are distinguished. Career titles and wins achieved by a driver with another constructor are not counted as Aston Martin achievements.
- The race centre is a local snapshot. The optional `RaceDataProvider` interface exists for a future integration; the shipped `staticRaceProvider` does not fetch data or use secrets.
- Fonts and images are served locally. The 3D component loads separately from the useful editorial HTML.

## Ownership and editing map

| Change | File or area |
| --- | --- |
| Sources, standings, team/driver facts, chassis records, races, stories and heritage events | `src/lib/data.ts` |
| Future race provider normalisation | `src/lib/race-provider.ts` |
| Page layouts, route parameters and shared metadata | `src/app/` |
| Search and navigation | `src/components/Shell.tsx` |
| Archive queries and comparisons | `src/components/Archives.tsx` |
| Garage controls and fallback | `src/components/Garage.tsx` |
| Geometry, lighting, orbiting and rendering lifecycle | `src/components/GarageScene.tsx` |
| Colours, typography, responsive layout and most motion | `src/app/globals.css` and `src/components/garage.css` |
| Provenance, rights and media context | `docs/SOURCES.md`, `docs/ASSET-CREDITS.md` |
| Exact verified archive scope | `docs/ARCHIVE-COVERAGE.md` and `coverage` in `data.ts` |

## Verification and release procedure

Run from the project directory:

```sh
pnpm check:content
pnpm typecheck
pnpm build
```

The content checker executes the self-contained typed content module in an isolated VM after TypeScript transpilation. It validates all source/car/driver/race references, duplicate IDs/slugs, literal local image and font paths, image signatures, session UTC timestamps and ordering, circuit timezones, result cutoffs and relevant point totals. It reports missing portraits/chassis images as declared gaps. It cannot prove source accuracy, ownership permission, external link availability, visual accessibility or browser performance.

Observed on 18 October 2026: `node scripts/check-content.mjs` passed for **20 driver profiles, 8 chassis, 34 races, 7 stories, 70 sources and 22 referenced local media files**. The checker reported the declared gaps of 16 driver portraits and one chassis image. `node node_modules/typescript/bin/tsc --noEmit` also passed. The final production build and 31 browser assertions also passed; see VERIFICATION.md for exact scope, measurements and limits.

The current workstation's pnpm wrapper may try to register its global store outside the writable workspace. If it fails with a store/symlink permission error while dependencies already exist, use the equivalent direct commands documented in the README. That environment limitation is separate from a TypeScript or application failure.

Before release, check:

- Open the built home page and deep links directly on the intended static host; refresh at a driver, car, race and story URL.
- Use the main navigation, search dialog, mobile menu and keyboard-only navigation. Check visible focus, Escape/close behaviour, skip link and page destinations.
- Apply archive filters and share the resulting URL. Check the empty state, result count and reloading a shared URL.
- Inspect a race in both circuit and local time. Confirm that stored UTC instants are displayed consistently and unknown schedules remain explicitly absent.
- Enter the garage; change camera views, select each hotspot, zoom/orbit/reset, pause motion and exercise the keyboard controls. Check the static fallback with WebGL unavailable.
- Check reduced-motion settings, hidden-tab/offscreen rendering pause and narrow/mobile layouts. Confirm that essential record information remains readable outside the canvas.
- Capture actual performance/a11y results if required. This document does not claim a Lighthouse score, Web Vitals result or automated WCAG audit.

A successful static build writes `out/`. Publish that directory through the configured host; record the host's confirmed public URL separately. The repository hosting configuration is a target, not evidence of a successful deployment.

## Remaining integrations and editorial limits

| Area | Exact remaining work |
| --- | --- |
| Photography rights | Official Aston Martin photographs have source credits but no supplied open publication licence. Obtain appropriate public/commercial permissions or replace with licensed assets before public release. |
| Exact car model | Supply an accurate, licensed and optimised chassis model if an exact AMR26 or chassis-switching 3D archive is required. Preserve the illustrative label until then. |
| Live race information | Connect an authorised timing/results provider, define freshness/failure states and retain source timestamps. This may require moving from static export to a secure server deployment or adding build-time ingestion. |
| Historic coverage | The roster and named chassis index are broader than the selected race classifications. Add official, audited qualifying/full-field results and event schedules gradually; do not call the race database complete. |
| Missing media | Some historic/support driver portraits and original chassis images are intentionally unavailable. Add only correctly attributed likenesses and chassis-specific media. |
| Telemetry/CFD/sound | No real telemetry, simulation output or licensed soundtrack is connected. The visual airflow is illustrative and sound remains absent. |
| CMS | Typed data files are the current editorial source. A CMS must preserve stable IDs, typed fields, relationships, verification dates and coverage notes. |

Read `docs/ARCHIVE-COVERAGE.md` for the current record-by-record boundary and `docs/ASSET-CREDITS.md` for photograph context, original image URLs and font licences. The README contains the update workflow and deployment instructions.
