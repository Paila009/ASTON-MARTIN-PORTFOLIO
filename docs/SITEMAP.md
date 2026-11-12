# Sitemap and content inventory

| Destination | Purpose and relationships |
| --- | --- |
| `/` | Reveal → season snapshot → drivers → machine → next race → campus → heritage → stories → fan links |
| `/team` | Current leadership, campus, race pairing and links to academy/partners |
| `/drivers` | Searchable 20-person index; era, season and role filters; name and chronology sorting |
| `/drivers/[slug]` | Role, biography, season-specific numbers/record, cars and sources |
| `/cars` | Eight-chassis archive with era/season filters and search |
| `/cars/[slug]` | Chassis, power unit, drivers, sourced specification types, variants, notable results |
| `/garage` | Illustrative 3D study, nine systems, camera controls, airflow and annotated fallback |
| `/engineering` | Component principles, campus/manufacturing stories and 2026 context |
| `/race-centre` | Season selector, calendar, team results, standings and official full-field links |
| `/seasons/[year]` | Eight season summaries, car/driver relationships and championship record |
| `/races/[season]/[slug]` | 34 selected events; schedule when imported, results, source and related car/people |
| `/heritage` | Filterable marque, modern-team and predecessor tracks |
| `/heritage/[chapter]` | Nine substantial chapters with contextual media and related records |
| `/stories` | Seven original editorial summaries, searchable by text/category |
| `/stories/[slug]` | Full summary, official article/film link, connected people and chassis |
| `/academy` | Current support/development profiles and official academy/esports links |
| `/media` | Official films, video destination and credited photography |
| `/partners` | Selected verified technical relationships and full official roster link |
| `/fan-experience` | Official I / AM, merchandise and marque destinations |
| `/sources` | 70 official-source links, credits, coverage boundaries and independent-concept notice |

All route parameters are generated from stable entity slugs at build time. The archival and editorial HTML is pre-rendered. Global search joins driver, car, story and destination records; filters write shareable query parameters. Comprehensive race classifications are a documented integration gap, not an implied complete database.
