# SchoolRide

Live school-transport tracking for parents. Schools license the service; parents see only their own child's ride (ETA, pickup and drop-off, exam-day pickup changes) and can reach the driver or the school in one tap.

This repo is the **parent app prototype**: plain HTML, CSS and JS, no build step. It is the UX source of truth for the planned React Native (Expo) app. Change behaviour here first, keep the tests green, then port.

- Product rules, the two-app architecture and the data model: `docs/product-spec.md`
- Colours, type, components and the reasons behind them: `docs/design-system.md`

## Commands

```bash
npm run setup     # once: installs Playwright and its Chromium
npm test          # 71 checks: behaviour, semantics, contrast, tap targets, layout at 320/360/390 px
npm start         # serves app/ at http://localhost:5173 (opening app/index.html directly also works)
npm run build:mobile-web   # exports the React Native port (mobile/) for web, into mobile/dist-web (uses nvm's Node 24)
npm run test:mobile-web    # 30 checks on that build: contrast, 12px floor, 44pt targets, errors, nothing clipped at 320/360/390
```

The port's own checks run in `mobile/` with Node 24 (`nvm use`): `npm run typecheck`, `npm run lint`, `npx jest`.

In the Claude desktop app, previews run from `.claude/launch.json` (Python's built-in server on port 5173). `npm test` needs Node.js 18+; if `node` is missing, install it before running the tests. Playwright is pinned to `~1.61.0` because 1.62 dropped Node 18.

Before calling any UI change done, run `npm test`. Also look at the changed screens in a browser at 390x844 and 360x640: the tests do not judge whether something looks right.

## Files

```
app/index.html   markup for every screen, overlay and sheet, plus the SVG sprite (#bus and #i-* icons)
app/styles.css   all styles; tokens live in :root at the top
app/app.js       all behaviour: mock data, render functions, navigation
tests/*.test.js  node:test + Playwright, driving the real page
```

## How the app works

- **One active child.** `activeChild` ('jane' or 'liam') changes only through `setActiveChild(key)`. That function re-renders Track, the call sheet, Schedule, History and the share sheet. Anything new that depends on the child must be added there. Never assign `activeChild` directly; that is how screens used to fall out of sync.
- **Mock data**, all in `app.js`: `trackData` (ETA, route, driver, signal state, `homeKm`: each bus's approximate distance from the child's home), `callData` + `callPrefs` (contacts, and which ones the parent chose to show, per child), `examDaysByChild`, `historyData`, `notifications` (each tagged with a `child`), `miniMapSpec` / `routeMaps` (hand-drawn SVG maps, not a real map provider).
- **Navigation.** `switchTab(name)` for track, schedule, history and profile. The nav pill holds only Track, Schedule and History; Account opens from the "SD" avatar in the header's top-left corner (`#accountBtn`), and the back button takes the avatar's place on its sub-screens. Beside the avatar, `greetingFor(hour)` greets by the phone's local time (morning 05–11, afternoon 12–16, evening otherwise), refreshed every minute; the child switcher sits on the header's second row. Account sub-screens: `goToPersonal()`, `goToFamily()`, `goToPrivacy()`, `goToSecurity()`, `goToTerms()` (all through `goToSub(name)`), and `goBack()`, which returns to the previous sub-screen (Privacy opens Terms). Account state: `profile`, `photos` (data URLs per person, null = initials), `trustedFriends`; `renderProfile()` and `renderPics()` update every `[data-pic]` avatar. Overlays: `openRouteView()`, `openNotifications()`, `openSheet('call' | 'share')`.
- **Calling.** Calls are real `tel:` links. `DEMO_CALLS = true` turns them into a "Calling..." toast so the prototype never leaves the page; set it to false for real dialling.
- **Motion.** A start-up animation (`.intro` + `startUp()`: the bus on marigold starts up (rumble, exhaust puffs), rocks back and speeds off, then the field fades into the first screen, about 2.1s) and page entrances (`playEntrance(el)` on every tab change). Both are skipped or collapsed under reduced motion. The bus is the brand mark; the app-icon plan is in `NOTES.txt`.
- **Demo controls** are labelled "(demo control)": "Simulate signal loss" and "Skip onboarding". The demo code hint in onboarding is `123456`. Hide all of these before any real user sees the app.

## Rules that are already decided

Do not quietly undo these. If one needs to change, say so.

- **Privacy.** A parent only ever sees their own children. Other children on a route appear only as a stop count, never by name.
- **No self-service linking.** The school verifies guardian-to-child links. "Add a child" tells the parent to contact the school.
- **Calls.**
  - The driver is always one tap from Track.
  - School contacts (grade head, register teacher) are always listed and callable, never hidden behind a toggle. Edit mode only chooses who is listed, and that choice is remembered per child.
  - On an exam day, the detail card offers "Running late?": the register teacher first, the grade head as fallback, nothing if the parent hid both.
- **The FAB keeps a call shortcut on purpose.** It's a deliberate trade-off for the premium feel. Anything time-sensitive must also exist outside the FAB. Notifications live in the header bell, not the FAB.
- **Signal loss stays calm.** It shows grey, with "Last seen X min ago". At 5 minutes or more the chip turns red and a direct "Call [driver] to check in" button appears.
- **Exam days.** Pickups are grouped by consecutive end-time gaps under a per-school threshold (default 120 min). Morning order is farthest home first, afternoon is closest first. Full rules: `docs/product-spec.md`.
- **Recovery email is optional**, behind a toggle that is off by default.
- **Trusted family friends** are the parent's own contacts, not linked to any child. They appear only in Share ETA, see a ride only when the parent shares it (that day only), and need the school's approval to collect a child.
- **Privacy defaults.** The app never uses the parent's phone location. Usage analytics and crash reports are off until the parent turns them on.
- **Memoji only on Apple devices** (`isAppleDevice()`); there is no API for the Apple Account's Memoji, so the parent picks one saved to Photos. Initials are the default avatar.

## Quality bar (`npm test` enforces this)

- Text contrast meets WCAG AA (4.5:1, or 3:1 for large text), measured from rendered pixels. No informational text below 12px.
- Every tappable control has a hit area of at least 44x44px. An invisible `::after` may extend a small visual; the tests count it.
- No horizontal overflow at 320, 360 or 390px widths, and no page errors.
- Colour meaning: marigold (`--accent`) is the one loud colour and marks only the single most important thing (Track hero, FAB, selected calendar day, primary button; on the full map, the bus's live position). Aubergine (`--ink`) is text and dark surfaces; Ice Silver is the canvas. Green only for arrived/verified/success, red only for alerts.
- Colours live only as tokens in `:root` in `styles.css`. Shadows are aubergine-tinted (`rgba(var(--ink-rgb), a)`), never black. The SVG maps read the tokens through `T` in `app.js`; the only literal left is the `theme-color` meta tag.
- Animations respect `prefers-reduced-motion`.

## Known gaps, roughly in priority order

1. **Semantics.** Done for controls: every `onclick` is on a `<button>` or `<a>` with an accessible name (`tests/semantics.test.js`), except the `.scrim` / `.sheet-scrim` backdrops, which are pointer-only on purpose. Closed layers (onboarding once finished, sheets, overlays, FAB menu, recovery fields) are `inert`, so hidden controls stay out of the tab order. Still open: focus is not moved into a sheet or overlay when it opens or back to its opener when it closes, there is no Escape-to-close, and the app behind an open overlay is still reachable.
2. **Onboarding inputs.** Done: the phone field is `type="tel"` and checked before a code is sent, "Change number" returns from the code step, a wrong code shows a message, and reduced motion jumps straight to the check. The phone step links to the terms (`obGoTo('terms')`, the same text as Account).
3. **Payment tab.** Set up payment per school, per child, including other schools on the network.
4. **More states.** Route deviation and major delays. Consent and data-disclosure screens.
5. **Installable app.** No web app manifest or service worker yet, so Android will not offer install.
6. **The rest of the system.** The driver app (checklist UI), the school admin Console, then the React Native port and the backend described in `docs/product-spec.md`.
