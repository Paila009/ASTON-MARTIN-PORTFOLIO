# Observed verification — 18 October 2026

## Build and records

- Production build passed: 102 static index pages, including the error page.
- TypeScript passed through the build and `tsc --noEmit`.
- Content validation passed for 20 profiles, eight chassis, 34 races, seven stories, 70 primary-source records and 22 referenced image files.
- Export validation checked 2,906 internal link destinations across the 102 index pages; all exist.
- Declared missing media: 16 historic/support portraits and one chassis-specific image (DBR5). Contextual images are labelled.
- Next 16.4.2 on this Windows workstation emitted nested catch-all segment payloads while requesting dotted filenames in the browser. `scripts/build.mjs` retains those files and creates 100 matching aliases. A subsequent browser run observed no failed payload requests or navigation errors.

## Browser checks actually performed

The final headless Chrome run passed **31/31** assertions against the built static export. The report is generated at `test-results/browser-results.json` (ignored output).

Covered:

- Desktop homepage, real local photography and global search; Escape dismisses the search dialog.
- Era filters, combined text search and filters, and sharing/reloading a filtered archive URL.
- UTC to India timezone conversion against the Austin session schedule.
- WebGL car rendering, nine external HTML system controls, and opening an engineering panel.
- Side-view camera selection, reset, zoom button execution, starting and pausing rotation, and the explicit conceptual-airflow label.
- Tablet garage at 768 × 1024 with no horizontal overflow.
- Mobile navigation and its Race Centre destination at 390 × 844.
- Mobile overflow checks for home, driver profile, chassis profile, timeline, editorial article and garage.
- OS reduced-motion handling and keyboard access to the skip link.
- Forced WebGL failure: annotated static diagram, working engineering panel and a touchscreen tap on the Tyres control.
- No uncaught browser exceptions or missing asset/payload responses during that run.

Screenshots of the homepage, driver section, machine preview, garage, mobile layouts and static fallback are generated in `test-results/`.

## Measured local performance

1440 × 1000, headless desktop Chrome, unthrottled local static server, software WebGL. Final observed homepage values:

| Measurement | Observed value |
| --- | --- |
| Largest contentful paint | 984 ms |
| DOMContentLoaded | 164 ms |
| Transferred resources at measurement | 3.17 MB |

These baseline values were observed before the scroll-experience revision, not a production Lighthouse score or a claim about mobile-network performance. Three.js now loads lazily as the home machine chapter approaches the viewport, or when the garage is visited.

## Scroll-experience revision

The revised production build passes TypeScript and emits the same 102 pages. All 31 navigation, search, controls, responsive and fallback regression assertions pass again. Content and export checks pass for 23 referenced media files and 2,905 internal link destinations. The revised local regression run observed homepage LCP of 1,792 ms, DOMContentLoaded of 1,434 ms and 3.01 MB transferred at measurement; concurrent software-WebGL QA was running, so this is not a controlled comparison with the baseline.

Dedicated motion tests and screenshots additionally verify that scroll changes the actual Three.js camera position and rendered view, the sticky chapter advances through its narrative, opposing hero transforms change, the ticker moves and driver entrances become visible. Exact dedicated results are generated at `test-results/motion-results.json`.

The focused motion follow-up passed **12/12** checks, including mobile real-WebGL readiness, route cleanup/reinitialisation and persisted manual reduced motion (`test-results/motion-followup-results.json`). It resolves two initial harness failures: a strict trailing-slash selector and a short mobile WebGL timeout while a prior test context remained open. OS reduced-motion and forced no-WebGL scenarios also passed in the initial motion run. Desktop early/late and mobile mid/late screenshots were visually reviewed. No uncaught browser exceptions or missing local assets were observed. Physical-device pinch and production-network performance remain untested.

## Limits

No physical phone/tablet testing, multi-touch pinch measurement, screen-reader audit, automated WCAG certification, production network performance test or external-link availability crawl was performed. Geometry and camera animation were visually reviewed in screenshots; browser tests confirm control state and working panels rather than proving chassis accuracy. The car is explicitly illustrative. Full-field qualifying/results and the remaining historical detail gaps are listed in `ARCHIVE-COVERAGE.md`.

## Interactive upgrade — 15 November 2026

The new production build and TypeScript check passed. Browser verification used the in-app browser against the built local export, including a 390 × 844 viewport:

- The hero's Next perspective changed the visible official photograph and selected state.
- The experience console opened from its button and Ctrl+K, navigated to stories/comparison/game, and closed with Escape.
- Story Next and two consecutive keyboard arrows changed the active record; Save and Saved-only reduced the deck to the saved record. The saved count persisted after reload.
- The chassis comparator opened from the console, changed challenger selections, rendered the matching drivers/specifications/season totals and updated its shareable URL. It had no mobile horizontal overflow.
- The reaction game detected an early press as a jump start, completed separate pointer and Space-key attempts, persisted the measured personal best after reload, and returned to idle when Abort was selected. The practice times are local test outputs, not driver benchmarks.
- Garage wireframe reached 228 real model materials. White lighting reached the renderer. Rear-view selection updated its pressed state.
- Home Take control changed the same canvas to manual mode. Wireframe, lime lighting, airflow and side-view/rotation controls changed renderer state and camera position. Follow scroll returned to the scroll camera.
- Mobile story controls, the comparison, console and manual 3D dock were reviewed. The console scrolls internally on small screens. No horizontal page overflow was observed at 390 px.
- The manual reduced-motion setting collapsed the scrolling chapter; manual inspection remained usable. The setting and viewport were restored after testing.
- The browser's captured error log was empty at the end of these checks.

The story deck and mobile 3D control dock were visually inspected in screenshots. Native touchscreen swipe/pinch, forced storage denial and a fresh forced WebGL failure were not exercised in this revision; accessible HTML controls and the existing fallback remain in the implementation. There is no new claim of a full WCAG audit or production performance score.
