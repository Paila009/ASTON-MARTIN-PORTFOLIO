# Archive coverage report

Verified 18 October 2026. This release is a **verified roster and chassis index with a selected race archive**. It is not a complete event-by-event database, and the interface should not describe it as one.

## Scope actually included

| Area | Included | Exact limit |
| --- | --- | --- |
| Championship race drivers | Salvadori, Shelby, Trintignant, Vettel, Stroll, Hülkenberg and Alonso | Seven identified starters across the original and modern Aston Martin-branded programmes. Hülkenberg’s substitute starts are included. |
| Other driver associations | Clark, Moss, Crawford, Vandoorne, Drugovich, Hawkins, Yelloly, Juncadella, Boya, Paatz, Hausmann, Button and de la Rosa | Roles are distinct. This is a sourced support-role index, not a claim to have audited every private test or simulator session. |
| Car models | DBR4, DBR5, AMR21, AMR22, AMR23, AMR24, AMR25, AMR26 | Eight model records. No road, safety, medical or sports cars are counted as F1 chassis. |
| Original championship races | Four in 1959 and Britain in 1960 | All five races actually started by the original constructor are represented with Aston Martin finishing results. The Dutch 1960 withdrawal is explained separately. |
| Modern season summaries | 2021–2025 final constructor and driver points; 2026 dated snapshot | Historical race-start counts remain `null` where not individually reconciled. |
| 2026 calendar | All 23 rounds in the current official calendar | Seventeen completed rounds have Aston Martin finishing results through Singapore. Six upcoming events are marked upcoming. |
| 2026 standings | Aston Martin plus the two race drivers | Constructor and driver positions and points verified against official standings. A full-field standings UI needs a provider extension. |
| Session schedules | Austin 2026: FP1, FP2, FP3, qualifying and race | UTC instants verified. Other events contain dates without invented session start times. |
| Selected modern races | Baku 2021; Bahrain and Saudi Arabia 2022; Bahrain, Monaco and São Paulo 2023 | Useful linked milestones, not every race in those seasons. |
| Heritage | Marque, modern team and predecessor organisation tracks | Milestones are distinct; no predecessor win or championship is added to Aston Martin totals. |
| Editorial | Seven original summaries with official sources and related entities | Summaries are editorial, not copied official articles or attributed quotations. |

## Driver role audit

| Driver | Aston Martin-branded F1 relationship | Race-start treatment |
| --- | --- | --- |
| Roy Salvadori | 1959–1960 race driver | Four starts in 1959; one in 1960. Dutch 1960 withdrawal is excluded from starts. |
| Carroll Shelby | 1959 race driver | Four championship starts. |
| Maurice Trintignant | 1960 race driver | One championship start in Britain. |
| Sebastian Vettel | 2021–2022 race driver | Season points and podiums verified; full start reconciliation is pending. |
| Lance Stroll | 2021–2026 race driver | Season points verified; 2026 official profile lists 17 Grands Prix through Singapore. Older season start counts are not guessed. |
| Nico Hülkenberg | 2021–2022 reserve/development; 2022 substitute | Bahrain and Saudi Arabia 2022: two starts, zero points. Racing Point substitutions are separate. |
| Fernando Alonso | 2023–2026 race driver | Season points and podiums verified; 2026 official profile lists 17 Grands Prix through Singapore. |
| Jim Clark | Signed to the 1960 programme | No Aston Martin championship start. Not labelled as a raced entrant. |
| Stirling Moss | Brief 1960 practice evaluation | No Aston Martin championship start. Sports-car results excluded. |
| Jak Crawford | Young-driver programme, then third driver in 2026 | Practice, tests and simulator work do not count as Grand Prix starts. |
| Stoffel Vandoorne | Simulator, test and reserve | His McLaren starts are excluded. |
| Felipe Drugovich | Development, test and reserve, 2022–2025 | Tests and practice only in the verified record. |
| Jessica Hawkins | Driver ambassador, test work, Head of F1 ACADEMY | Test appearance does not imply a championship race entry. |
| Nick Yelloly | Verified 2021 simulator and test work | No championship race entry claimed; later contract dates unasserted. |
| Daniel Juncadella | Verified 2025 simulator appointment | No championship race entry claimed; a 2026 contract is not inferred. |
| Mari Boya | Driver Academy | Formula 2 activity remains separate. |
| Mathilda Paatz | 2026 F1 ACADEMY representative | F1 ACADEMY activity remains separate. |
| Tina Hausmann | 2024–2025 F1 ACADEMY representative | F1 ACADEMY activity remains separate. |
| Jenson Button | Team ambassador from 2026 | No Aston Martin race start; Brawn title remains with Brawn. |
| Pedro de la Rosa | Team ambassador | No Aston Martin race start; earlier career results remain separate. |

## Known gaps that remain

- Full historical race entry lists, qualifying classifications, sprint classifications and all-field race results for 2021–2025 are not imported. The original withdrawal requires a complete entry-list source before a structured non-starter row can be considered fully audited.
- Modern driver starts need an event-by-event reconciliation that distinguishes entries, starts, withdrawals and non-starters. `null` values deliberately preserve this gap.
- Full-field 2026 standings and lap-by-lap timing are not connected. The local snapshot must not be labelled live or in progress.
- Exact DBR4/DBR5 chassis allocation has conflicting historical descriptions. The official F1 feature calls the 1960 Dutch practice car a DBR5; other descriptions differ. The official team describes both 1960 British drivers within the DBR5 programme. Serial-number-level allocation is not claimed.
- Published historical dimensions, weights, individual engine variants, complete aerodynamic upgrade lists and liveries for every event are not fully audited. Regulatory limits are explicitly marked and are not substituted for measured chassis specifications.
- Original-era portrait photography and a verified DBR5 photograph have not been supplied. Driver profiles retain a designed no-portrait state. The available historic photograph shows Shelby’s DBR4 in 1959; it must not be relabelled as a DBR5 or a modern driver portrait.
- Support-driver roles are sourced individually. A comprehensive register of all private testing and simulator duties, academy tenures, and changes of ambassador appointment is not complete.
- No authenticated membership, shop, booking, newsletter or race-data backend is configured. Fan actions link to the official destination and do not simulate successful transactions.
- No licensed exact AMR26 3D model or sound recording is supplied. The garage’s authored geometry and airflow graphics are labelled as illustrative demonstrations. They do not show measured CFD or live telemetry.

## Attribution checks

The original 1959–1960 programme, modern Aston Martin team and earlier Silverstone identities remain separate. Sixth place in 1959 is shown with zero points because only the top five scored finishing points then. The non-championship 1959 International Trophy result is never presented as a World Championship podium. Le Mans and the DBR1 remain sports-car context.

The F1 team page’s lifetime entrant summary contains Racing Point-era results. This implementation uses the page’s explicitly dated 2026 section and separately verified annual standings. It does not claim Racing Point’s 2020 win as an Aston Martin win.

## How to extend the audit

Import official FIA entry lists and final classifications event by event; record the original entrant, constructor, chassis, driver and start status. Reconcile driver totals against those entries. Store session and classification status, source URL and successful update timestamp. Expand this report only when those records have been checked. Keep the original snapshots available for reproducibility.
