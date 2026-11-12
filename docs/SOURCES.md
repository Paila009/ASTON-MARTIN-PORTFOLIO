# Sources and update policy

Research verified **18 October 2026**. Changing sporting data is a **snapshot through the Singapore Grand Prix, 11 October 2026**, not a live feed. All records live in `src/lib/data.ts`; `sourceIds` resolve to its source registry, which stores the public URL and verification date.

## Current-season facts

| Dataset | Verified fact | Primary evidence |
| --- | --- | --- |
| Race pairing | Fernando Alonso, number 14; Lance Stroll, number 18 | [Alonso profile](https://www.formula1.com/en/drivers/fernando-alonso), [Stroll profile](https://www.formula1.com/en/drivers/lance-stroll) |
| Car and supplier | AMR26; Honda RA626H | [Official livery launch](https://www.astonmartinf1.com/en-GB/news/announcement/aston-martin-aramco-launches-season-with-livery-reveal), [Honda AMR26 record](https://global.honda/en/F1/machine/2026_AMR26/) |
| Leadership | Adrian Newey: Managing Technical Partner and Team Principal; Enrico Cardile: Chief Technical Officer; Lawrence Stroll: Executive Chairman; Andy Cowell: Chief Strategy Officer | [26 November 2025 leadership announcement](https://www.astonmartinf1.com/en-GB/news/announcement/aston-martin-aramco-announces-changes-to-leadership-structure), [2026 launch](https://www.astonmartinf1.com/en-GB/news/announcement/aston-martin-aramco-launches-season-with-livery-reveal) |
| Constructors | Tenth, seven points after Singapore | [F1 standings](https://www.formula1.com/en/results/2026/team), [team standings](https://www.astonmartinf1.com/en-GB/season/2026/constructors) |
| Drivers | Alonso seventeenth, seven points; Stroll twenty-first, zero | [Team standings](https://www.astonmartinf1.com/en-GB/season/2026/drivers), official F1 profiles above |
| Next event | United States Grand Prix, Austin, 23–25 October; round 18 on the updated calendar | [Updated team calendar](https://www.astonmartinf1.com/en-GB/season/2026), [F1 event schedule](https://www.formula1.com/en/racing/2026/united-states) |
| Austin race start | 25 October, 20:00 UTC; circuit timezone `America/Chicago` | [F1 event schedule](https://www.formula1.com/en/racing/2026/united-states) |

The initial June 2025 calendar announcement is not treated as the current calendar. The current team calendar has 23 rounds. Its round 16 is the **Bahrain Grand Prix in Malaysia**, held at Sepang on 4 October. The [official race report](https://www.astonmartinf1.com/en-GB/races/2026-bahrain-gp) documents the relocation. The current calendar and event schedule take precedence over superseded announcements.

All Austin session instants are stored with a `Z` UTC suffix. Other events have verified dates but no invented session times. A date-only value is not used for a race-start countdown.

## Historical sporting records

Modern season standings were opened and checked individually:

| Season | Position | Points | Constructor source | Driver source |
| --- | --- | --- | --- | --- |
| 2021 | 7 | 77 | [F1](https://www.formula1.com/en/results/2021/team) | [F1](https://www.formula1.com/en/results/2021/drivers) |
| 2022 | 7 | 55 | [F1](https://www.formula1.com/en/results/2022/team) | [F1](https://www.formula1.com/en/results/2022/drivers) |
| 2023 | 5 | 280 | [F1](https://www.formula1.com/en/results/2023/team) | [F1](https://www.formula1.com/en/results/2023/drivers) |
| 2024 | 5 | 94 | [F1](https://www.formula1.com/en/results/2024/team) | [F1](https://www.formula1.com/en/results/2024/drivers) |
| 2025 | 7 | 89 | [F1](https://www.formula1.com/en/results/2025/team) | [F1](https://www.formula1.com/en/results/2025/drivers) |

Original-era championship race results were checked for the [1959 Netherlands](https://www.formula1.com/en/results/1959/races/171/netherlands/race-result), [1959 Britain](https://www.formula1.com/en/results/1959/races/173/great-britain/race-result), [1959 Portugal](https://www.formula1.com/en/results/1959/races/175/portugal/race-result), [1959 Italy](https://www.formula1.com/en/results/1959/races/176/italy/race-result), and [1960 Britain](https://www.formula1.com/en/results/1960/races/184/great-britain/race-result). These identify Roy Salvadori, Carroll Shelby and Maurice Trintignant as the original programme’s championship starters.

The modern reserve substitution is supported by the [team’s Bahrain announcement](https://www.astonmartinf1.com/en-GB/news/announcement/nico-huelkenberg-to-substitute-for-sebastian-vettel-in-bahrain), plus the official [Bahrain](https://www.formula1.com/en/results/2022/races/1124/bahrain/race-result) and [Saudi Arabian](https://www.formula1.com/en/results/2022/races/1125/saudi-arabia/race-result) classifications. Hülkenberg’s two 2022 starts are included; his Racing Point appearances are excluded.

Other selected classifications are [Baku 2021](https://www.formula1.com/en/results/2021/races/1068/azerbaijan/race-result), [Bahrain 2023](https://www.formula1.com/en/results/2023/races/1141/bahrain/race-result), [Monaco 2023](https://www.formula1.com/en/results/2023/races/1210/monaco/race-result), and [São Paulo 2023](https://www.formula1.com/en/results/2023/races/1224/brazil/race-result). The selected 2023 route round numbers preserve the original scheduled numbering, including cancelled Imola; this is explained in those records.

## Attribution rules and conflicting sources

- The F1 team profile’s **overall** summary follows the entrant lineage from 2018 and includes Racing Point achievements. Its overall totals are not copied into Aston Martin-branded totals. Only the expressly labelled 2026 section is used for current team statistics.
- Jordan, Midland, Spyker, Force India and Racing Point are a separate organisational track. Their results retain the constructor identity used at the time.
- Alonso’s Renault championships, Vettel’s Red Bull championships, Stroll’s Williams and Racing Point podiums, and Button’s Brawn title remain whole-career context.
- Le Mans results belong to sports-car racing. The DBR1 is not added to the Formula One chassis archive.
- Jim Clark’s signed 1960 association is supported by [F1’s dated historical feature](https://www.formula1.com/en/latest/article/coming-back-to-win-why-aston-martins-first-f1-entry-was-one-to-forget.4q0FdTJYnH5AtRqNmTZFfo). It does not imply an Aston Martin championship start. The same source documents Moss’s brief practice evaluation.
- The 1960 Dutch withdrawal is kept separate from race starts. Exact chassis allocation remains unresolved: the F1 feature calls the Dutch car a DBR5, while other historical descriptions associate the entry with the older car. No individual chassis serial number is asserted.
- The [team’s 4 March 2021 historical note](https://www.astonmartinf1.com/en-GB/news/announcement/amr21-makes-track-debut-at-silverstone-promotional-day) describes Salvadori and Trintignant as DBR5 drivers in Britain in 1960. The archive follows this official programme attribution and flags chassis-level allocation for further research.

## Car specifications

The official pages for [AMR21](https://www.astonmartinf1.com/en-GB/amr21), [AMR22](https://www.astonmartinf1.com/en-GB/AMR22), [AMR23](https://www.astonmartinf1.com/en-GB/AMR23), [AMR24](https://www.astonmartinf1.com/en-GB/AMR24), [AMR25](https://www.astonmartinf1.com/en-GB/AMR25) and [2026 regulations](https://www.astonmartinf1.com/en-GB/2026) were reviewed. Honda confirms the [AMR26 power unit](https://global.honda/en/F1/machine/2026_AMR26/).

`specs.kind` distinguishes a published car figure from a regulatory limit. In particular, the 2026 team explainer explicitly calls 768 kg a minimum, 1,900 mm a maximum width, and 3,400 mm a maximum wheelbase. These are not measured AMR26 dimensions. The AMR22 page retains a 795 kg launch figure; the AMR23 page describes the later 798 kg regulatory minimum. They are not silently treated as equivalent measurements.

Aerodynamic revisions are described without invented version names, CFD outputs or performance gains. The interactive model and airflow graphics are conceptual illustrations. The official chassis photographs remain the reference for real geometry.

## Driver roles, engineering and media

The [current squad](https://www.astonmartinf1.com/en-GB/driver-squad) and individual profiles verify current role labels. The [academy page](https://www.astonmartinf1.com/en-GB/driver-academy) documents its separate development pathway. F1 ACADEMY is a separate championship. Neither academy membership nor an ambassador title is treated as an F1 race entry.

Historical support roles have dated evidence in the registry: Drugovich’s development appointment and 2025 retention, Yelloly’s 2021 simulator work, Juncadella’s 2025 appointment, and Hawkins’s test programme. A dated appointment is not extrapolated into an unverified current contract.

The [CoreWeave announcement, 22 May 2025](https://www.astonmartinf1.com/en-GB/news/announcement/aston-martin-aramco-announces-coreweave-as-official-ai-cloud-computing-partner) verifies the wind tunnel coming online in March 2025. [INSIDER: Building an F1 car](https://www.astonmartinf1.com/en-GB/news/feature/insider-building-an-f1-car) is the primary manufacturing film reference. Videos are linked to official destinations rather than represented as locally licensed media.

Image sources, original captions and rights notes are in `docs/ASSET-CREDITS.md`. An available public image URL is not a transfer of copyright or a commercial licence.

## Updating content

1. Verify the current official calendar and the event page. Do not infer next-race status from a historical calendar announcement.
2. Update `verificationDate`, `snapshotThrough`, the source registry and affected records together.
3. Check constructor and driver standings independently; preserve points from sprints where applicable.
4. Store session instants in UTC and retain the circuit IANA timezone. Leave unavailable times `null` or the session list empty.
5. Keep unknown statistics `null`; never replace a missing audit with zero.
6. Link new drivers, cars, races and stories through stable IDs. Run the content validator and type/build checks.
7. Update `docs/ARCHIVE-COVERAGE.md` when the actual audited range changes. Only claim completeness for a fully checked scope.

The initial provider is structured local content. A future sports-data integration should replace it with a licensed, server-side provider and preserve the source, timestamp, state and provenance fields. No API credential is required for this snapshot.
