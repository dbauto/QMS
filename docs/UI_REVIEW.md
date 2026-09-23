# UI review notes

## Design intent

The first screen previously put a welcome banner, calendar, three metric cards, a readiness chart, a work queue, and a deadlines list at competing levels of emphasis. The collapsed sidebar also required people to identify features by icons.

The testing design gives the next action the strongest emphasis. It uses a stable labeled sidebar, a neutral sage background, restrained status colors, and larger operational text. Repeated readiness graphics and the static calendar are removed from Overview. Settings and configuration remain discoverable under Administration.

The existing `UX_BLUEPRINT.md` remains the product reference. The two shared-chat links supplied with the request could not be retrieved; their contents were not assumed.

## Surface review

| Surface | Change |
| --- | --- |
| Overview | Action queue first; due-today approval first; one readiness summary; compact deadlines and workspace totals |
| Documents | Searchable cross-space list first; combined search/type/space/status filters; empty state and clear action |
| Area browsing | Retained as a secondary tab; reduced repeated metrics and registration actions |
| Records & evidence | Consistent typography and status colors; readable metadata; responsive process navigation |
| My tasks | More space for decisions; consistent queue/detail styling; stacked layout on small screens |
| Traceability, audit, ISO readiness | Shared shell and typography; improved contrast and keyboard access to scrolling regions |
| Administration | Collapsed navigation group; contained horizontal scrolling in the permission matrix; labeled permission controls |
| Document details and forms | Existing revision/traceability model preserved; focus contained while dialogs are open |

## Engineering scope

`calm.css` isolates the testing design from the accumulated legacy stylesheet. `calm.js` owns shell interactions and accessibility. Targeted changes to `app.js` remove hover expansion, choose the document list as the default, support routing events, and namespace testing storage. No framework migration or production backend is introduced.

Icons are generated locally from the pinned lockfile, including the upstream license. No third-party asset request is needed to render the app. Hash URLs use `#/view` so navigation does not accidentally scroll underneath the sticky header.

The original stylesheet is retained for the deeper prototype screens. Combined CSS exceeds the skill's default 35 KB compressed desktop budget (about 49 KB); this is an explicit temporary exception to keep this UI experiment reviewable without rewriting every legacy component. Combined JavaScript stays below 60 KB compressed. There are no web fonts or initial image downloads.

## Validation scope

The automated suite covers the 12 application views at 320, 375, 768, 1024, 1280, 1440 and 1920 pixels, checks page overflow, and runs axe WCAG A/AA checks at 375 and 1440 pixels. It also exercises search, filters, empty states, document tabs, dialog focus, mobile navigation, browser history, storage isolation, and missing icons.

Screenshots are captured for every view at mobile and desktop sizes. The saved overview screenshots show the design for review. The workspace intentionally uses a light theme; it does not introduce a dark-mode control. Reduced motion is supported. Automated accessibility checks do not substitute for a native screen-reader usability review, which was not performed.

SEO scoring is excluded from Lighthouse because this is a deliberately non-indexable testing workspace. The final measured scores and test result are recorded below after validation.

## Recorded results — 23 September 2026

- All 20 automated cases passed across the full run and targeted reruns after fixes.
- All 12 views passed overflow checks at seven widths, plus axe WCAG A/AA at 375 and 1440 pixels.
- Lighthouse against the local static server with gzip: desktop **100 performance / 100 accessibility / 100 best practices**; mobile **99 / 100 / 100**.
- Desktop LCP 0.45 s; mobile LCP 1.77 s. Desktop CLS 0.0045; mobile CLS 0. These are laboratory results, not production field measurements.
- `git diff --check` and JavaScript syntax checks passed.

The final preview keeps main and its Pages settings untouched. Screenshots and these notes are committed for remote review; the interactive preview runs locally with `npm start`.
