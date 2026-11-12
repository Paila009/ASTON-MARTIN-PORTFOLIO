# Visual system

Concept: **Aston Martin / The Pursuit — Every curve. Every thousandth.**

The opening uses verified AMR26 photography with a brief, pausable light reveal. Original oversized condensed typography gives way to a calm editorial grid. The reference study took the immersive focal point and personal storytelling of Lando Norris's site, then built original Aston Martin layouts around studio precision, engineering and archival attribution.

| Token | Value | Role |
| --- | --- | --- |
| `--green` | `#003d32` | Racing identity, technical sections |
| `--midnight` | `#061c18` | Studio/header |
| `--lime` | `#d7f000` | Actions, active states, restrained annotation |
| `--paper` | `#f1f3ee` | Editorial canvas |
| `--silver` | `#cdd2ce` | Rules and quieter details |
| `--ink` | `#090d0b` | Readable text |

Barlow Condensed 600/700 supplies the headlines. Inter supplies reading text. Monospaced labels distinguish sources, dates and racing numbers. Fonts are local and licensed under OFL.

Page composition alternates a photographic reveal, compact season strip, portrait diptych, dark machine study, light race-information grid, architectural photograph, archival split and editorial stories. Shared thin rules, spacious alignment and lime annotations maintain coherence.

Controls use visible focus, comfortable touch targets and HTML outside the canvas. Motion respects both the OS preference and the footer setting. The garage reduces rendering quality on narrow or constrained devices and suspends rendering when hidden/offscreen. Its model, selection brackets and airflow are procedural illustrations rather than proprietary engineering measurements.

## Scroll experience

The home page now includes a genuine scroll-driven 3D chapter. A sticky studio follows native document scroll while the camera travels along a curved path, from a low front view to an elevated rear view. Three large narratives slide laterally across the scene. The chapter lazily loads near the viewport and stops rendering when hidden or offscreen. It reuses the illustrative garage model; the official AMR26 poster is retained as the fallback.

`ScrollMotion.tsx` adds opposing hero typography, a layered photographic reveal, a lime racing ticker, driver-panel perspective, staggered content entrances, architectural parallax and a page progress line. The engine uses passive scroll events and requestAnimationFrame without taking control of page scrolling. Its listeners and styles are removed when leaving the home page. The hero's Pause effects control, OS reduced motion and the footer preference all disable the effects; the 3D chapter becomes compact, static content.
