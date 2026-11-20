# Accessibility audit — T-07.02

Pioneer Atlas was checked on a production preview with Playwright and Chrome
157.0.8103.80 on Windows 11 (build 22000). Browser zoom was tested in Chromium.
The results cover the routes, loading states, and interactions listed here.

## Verification results

| Area | Result |
| --- | --- |
| Landmarks and headings | Overview, People, Person, About, 404, and invalid person ID each rendered one banner, main, footer, and page H1. Primary navigation retained the People indication on profile routes. About's three named sections are covered by its component test. |
| Search and recovery | The browser accessibility tree exposed the `Search by name` searchbox, the named directory list, and the empty-results status. Keyboard checks covered mixed-case search, profile links, and recovery links on both 404 and invalid person ID. |
| Skip link and route focus | Tab revealed the skip link and Enter focused `#main-content`. Client navigation focused the destination H1 after loading and continued to the search field on Tab. Initial load, browser Back and Forward, native fragment focus, and rapid navigation were also checked. |
| Pending route | All five delayed chunks showed one busy section with a decorative, nonfocusable skeleton absent from the accessibility tree. The shell's route status stayed outside the busy region. |
| Route announcements | A cold People navigation posted `Loading people…` then `People loaded`. Warm navigation posted only `People loaded`. Switching from a pending People route to About left `About loaded` in the status after the earlier request completed. |
| Rejected chunk | Blocking the People chunk removed the busy section, cleared the polite route status, and displayed a single alert. The Home link and Reload button both recovered when the chunk was available. |
| Reduced motion | All five skeletons stayed static under default and reduced-motion settings. With test-only animation and transition styles applied, reduced motion suppressed both and preserved the measured shape bounds. |
| Responsive layout | Six route states fit at 320×700, 375×812, 768×1024, and 1440×900. At 200% browser zoom from 1440×900, all six fit at an effective width of 720 CSS pixels. The Overview and People grids used two columns at that zoom. |
| Contrast | Sampled visible text across the six route states and empty search reached at least 7.49:1. The search boundary measured 7.49:1 and the skip-link focus outline 7.69:1 against their adjacent backgrounds. |
| Project checks | 96 tests passed. Lint, type checking, and the production build passed. The build manifest contained five separate dynamic page chunks. |

Contrast samples were compared with WCAG 2.2 guidance for
[minimum text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

## Manual NVDA and Chrome checklist

Spoken announcements remain unverified because NVDA was unavailable on the test
machine. Use the production preview and record the browser, Windows, and NVDA
versions when completing these checks.

1. Open each route, including an invalid person ID. Navigate by landmark and heading. Confirm the Primary and Recovery navigation names on the applicable pages.
2. Use Tab and Enter to activate the skip link, operate the People search, follow a profile link, and use browser Back. Confirm the spoken search label and the heading announcement when focus moves.
3. Delay a route chunk with a browser test tool. Listen for one loading message followed by one completion message on a cold navigation. Revisit the loaded route and check that it gives only the completion message.
4. Delay route A, open route B, and let B finish before releasing A. Check that A's completion is absent from the spoken queue and that focus remains on B.
5. Enter a People search with zero matches. Listen for the empty-results message and check its timing relative to the People route announcement.
6. Abort a delayed chunk and listen for one error alert. Check that the route status clears and that Reload and Home are easy to locate and activate.

The reduced-motion check compared element bounds while the routes were pending.
CLS is tracked separately by the project's performance protocol.
