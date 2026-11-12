# Aston Martin / The Pursuit

**Every curve. Every thousandth.** An independent Formula One fan concept built with Next.js, React, TypeScript and React Three Fiber. The experience connects a cinematic AMR26 opening, an illustrative 3D engineering studio, driver and chassis records, a dated race centre and editorial stories.

This is a static editorial snapshot. The content was verified on **18 October 2026**, with race results through **11 October 2026**. It does not receive live timing or automatically update standings.

## Run locally

Use Node.js **20.9 or later** and pnpm **10.11.0** as specified by `package.json`. The installed dependencies were inspected with Node 24.19.0; the lockfile currently resolves Next.js 16.4.2.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open [http://127.0.0.1:3001](http://127.0.0.1:3001). No environment variables, account or API key is required. `.env.example` documents placeholders for a future authorised server-side race data integration; the static implementation does not read them.

Before shipping changes:

```sh
pnpm check:content
pnpm typecheck
pnpm build
```

`check:content` validates the actual content module: unique IDs/slugs, driver/car/race/source references, local image/font files, image file signatures, dates, session ordering and timezones, current constructor/result points and selected driver/season totals. Empty, explicitly unsupported imagery remains a declared content gap. It performs no network requests and does not certify that external facts are correct.

In a restricted desktop environment where pnpm's global store is not writable, existing installed dependencies can run the equivalent checks without touching that store:

```sh
node scripts/check-content.mjs
node node_modules/typescript/bin/tsc --noEmit
node scripts/build.mjs
node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3001
```

## Static deployment

`next.config.ts` uses `output: 'export'`, trailing-slash routes and local, unoptimised images. A successful `pnpm build` creates the **`out/`** deployment directory. Publish its contents to a static host that serves directory index files. No Node server is required in production, and `next start` is not the serving command for this exported site.

If working in a private Sites checkout, keep its existing `.openai/hosting.json` project ID and `out` directory. GitHub Pages does not use this file. After publishing, check the host's deployment URL and open a few direct links.

For a local production preview:

```sh
pnpm build
pnpm preview
```

Open the printed local URL. The preview uses port 3001 by default and tries the next available port if needed.

### GitHub Pages

The workflow in `.github/workflows/pages.yml` builds and deploys the static export on pushes to `main` and can also be run manually from the Actions tab. Set **Settings → Pages → Source** to **GitHub Actions** once. The workflow reads the Pages URL and path from GitHub, so navigation, media and generated bundles also work under the repository's subdirectory. Node 22 and the project's pinned pnpm version are used in CI. No site secrets are needed.

To test a prefixed build outside Actions, set `NEXT_PUBLIC_BASE_PATH=/ASTON-MARTIN-PORTFOLIO` and `SITE_URL=https://paila009.github.io/ASTON-MARTIN-PORTFOLIO`, then run `pnpm build` and `node scripts/check-export.mjs` with the same environment. Deploy the contents of `out/` at that prefix. Optionally set `SITE_EXPORT_DIR=pages-out` for both commands to keep an existing local `out/` preview running. Leave the variables unset for a root-path build.

## Project map

| Location | Responsibility |
| --- | --- |
| `src/app/` | Pre-rendered page templates, metadata and global visual system |
| `src/components/Shell.tsx` | Navigation, search, footer and motion preference |
| `src/components/Archives.tsx` | Client-side archive search, filters and sorting controls |
| `src/components/HomeInteractions.tsx` | Home motion, preview interactions and countdown |
| `src/components/ScrollMotion.tsx` | Native-scroll typography, depth, reveals and progress |
| `src/components/ScrollGarage.tsx` | Lazy scroll-driven 3D camera chapter with static fallback |
| `src/components/Garage.tsx` | Accessible garage controls, labels and fallback state |
| `src/components/GarageScene.tsx` | Lazily loaded WebGL scene and illustrative car geometry |
| `src/lib/data.ts` | Typed entities, stable relationships, source registry and verification dates |
| `src/lib/race-provider.ts` | Replaceable race data provider contract; static implementation only |
| `public/images/`, `public/fonts/` | Local imagery, typefaces and font licences |
| `scripts/check-content.mjs` | Offline content and media validation |
| `docs/` | Sources, archive coverage, asset credits and handoff notes |

The main route families are `/team`, `/drivers`, `/cars`, `/garage`, `/race-centre`, `/races`, `/seasons`, `/heritage`, `/engineering`, `/stories`, `/academy`, `/partners`, `/media`, `/fan-experience` and `/sources`. Individual records use their stable slugs; race detail paths include the season year. Keep route generation and internal links aligned when adding a record.

## Update the content

1. Check the relevant official team, Formula 1, FIA or Honda source. Add its URL and a specific verification date to `sources` in `src/lib/data.ts`. Source IDs are stable keys; titles should identify the source's scope and publication date when known.
2. Edit the typed record rather than adding disconnected page copy. Use `driverIds`, `carIds`, `raceIds` and `sourceIds` to connect records. A related race must exist in `races`; a source URL alone is not an internal race record.
3. For a race update, verify the calendar, classifications and session schedules separately. Store session instants in UTC (`...Z`) and the circuit's IANA timezone. `null` or an empty array means unavailable; do not fabricate classifications or timings.
4. Reconcile the current result points, driver statistics, season totals, `team`, `nextRace` and `recentResults`. Update `snapshotThrough` only after the completed results have been audited. Update `verificationDate` to the actual research date and retain event-specific source dates.
5. Add correctly attributed media to `public/images`. Preserve the chassis, person and year of the image; a DBR4 photograph does not become a DBR5 image because a page needs one. Supply a real `imageCredit`, an image note when context differs, meaningful alt text in the template, and an entry in `docs/ASSET-CREDITS.md`.
6. Update `coverage.notes` and `docs/ARCHIVE-COVERAGE.md` for newly verified scope or unresolved gaps. Run the three verification commands, then inspect desktop/mobile views and deep links before rebuilding/publishing.

## Data provider boundary

`raceProvider.getSnapshot()` returns a `RaceSnapshot` with an explicit mode, verification date, result cutoff, races, seasons, team totals and source registry. `staticRaceProvider` makes no request and always identifies its data as a snapshot.

To integrate an authorised provider, implement `RaceDataProvider`, validate and normalise the response into the existing entity contracts, and preserve provenance and missing-data states. Real-time server requests or secret API credentials require a server-backed deployment architecture or a separate secure build-time ingestion service. Never expose API keys through browser code or `NEXT_PUBLIC_` variables. Do not label data live until a real feed and freshness/error handling are connected.

## Scope and rights

The garage model is an original illustrative demonstration, not an exact AMR26 scan or licensed factory CAD model. Verified official photographs provide chassis-specific reference. Airflow effects explain a principle; they are not CFD or telemetry. No licensed sound is supplied.

The selected archive is not a complete historic results database. Refer to [archive coverage](docs/ARCHIVE-COVERAGE.md), [sources](docs/SOURCES.md), [asset credits](docs/ASSET-CREDITS.md) and [handoff](docs/HANDOFF.md) for the exact limits and remaining integrations. Official photographs and trademarks retain their owners' rights. The photographs are supplied for local concept review; public/commercial publication requires appropriate permissions. Barlow Condensed and Inter are included under the SIL Open Font License, with licence files in `public/fonts`.
