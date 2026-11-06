# SchoolRide design system ("Signal")

Ice Silver, Deep Aubergine and Marigold. The silver canvas and aubergine ink stay quiet and professional. Marigold is the one loud colour, kept for the single most important thing on each screen. It still reads as school transport without the shout of bus yellow. Premium comes from restraint: one accent, aubergine-tinted depth, and glass only where things float.

## Colour

Every colour is a token in `:root` in `app/styles.css`. Nothing outside `:root` uses a hex or `rgb()` literal. Translucent colours use the `-rgb` tokens, e.g. `rgba(var(--ink-rgb), .18)`. The SVG maps in `app.js` read the same tokens once at load (the `T` object). The only literal left is the `theme-color` meta tag, which can't read CSS.

| Token | Value | Use |
|---|---|---|
| `--canvas` | `#EEF1F5` | Ice Silver canvas, flat driver row |
| `--card` | `#FFFFFF` | Raised cards, fields, map roads |
| `--line` | `#DCE1E8` | Hairlines, switch track when off |
| `--surface-flat` | `#E6EAF0` | Flat tints: calendar arrows, regular-day badge, sheet close, row and notification icons, child tags |
| `--ink` | `#3A1F3D` | Deep Aubergine: all primary text, nav pill, dark buttons, chips, focus ring |
| `--muted` | `#6B5A6E` | Secondary text, placeholders. **Never on marigold (3.5:1)** |
| `--on-ink` | `#FFFFFF` | Text and icons on aubergine |
| `--accent` | `#F5B82E` | Marigold: Track hero, FAB, selected calendar day, primary button, live position on the full map, driver call button in the call sheet |
| `--accent-light` / `--accent-deep` | `#FFC94F` / `#E9A41E` | Ends of the marigold gradients |
| `--accent-soft` | `rgba(245,184,46,.30)` | Quiet marigold tint: "Running late?" card, exam pickup highlight, OTP focus glow |
| `--field-line` | `#857A88` | Input and switch borders (4.1:1 on white) |
| `--stroke-quiet` | `#8A7F8D` | Upcoming stops, dotted route ahead, lost live dot (3.8:1 on white) |
| `--hero-lost` | `#DCE1E8` | Track hero when the signal is lost |
| `--green` / `--green-soft` / `--green-ink` | `#0F7A3E` / `#DDF3E6` / `#0B5A2E` | Only: arrived, verified, success (OTP check) |
| `--alert` / `--alert-soft` | `#C4302B` / `rgba(196,48,43,.11)` | Only: alerts (signal lost 5+ min, unread badge) |
| `--map-ground` / `--map-block` / `--map-road-edge` | `#E3E8EE` / `#D6DCE4` / `#C9D0DA` | Hand-drawn maps, sheet handle, carousel dots |

Contrast, measured with the WCAG formula (translucent fills blended over what's behind them):

| Pair | Ratio |
|---|---|
| Ink on canvas / card | 12.8 / 14.6 |
| Muted on canvas / card / flat tint | 5.6 / 6.3 / 5.3 |
| Ink on marigold (light end / base / deep end) | 9.5 / 8.2 / 6.8 |
| White on ink · white at 86% on the nav glass | 14.6 · 8.5 |
| Ink / muted on the lost hero | 11.1 / 4.8 (the tightest pair) |
| Green on white · verified badge | 5.4 · 7.2 |
| Red on white · white on red | 5.5 · 5.5 |

Rules:
- **One loud colour per screen.** Marigold marks only the single most important thing. Icons, avatars, chips, toggles and secondary buttons on aubergine are white, not marigold. A second save on the same screen uses `.btn-primary.dark`.
- Red never means "normal", and green never decorates.
- Verify any new text and background pair with `npm test`. Don't eyeball it.

## Depth

- Shadows are aubergine-tinted, never black.
- Raised cards use `--shadow-raised`: a 1px contact shadow plus a soft ambient one.
- Small floating controls (map chip, expand button, zoom, toast) use `--shadow-float`.

## Spacing

A 4px scale: `--s-1` 4px, `--s-2` 8px, `--s-3` 12px, `--s-4` 16px, `--s-5` 20px, `--s-6` 24px, `--s-8` 32px. New layout uses these tokens. Older rules still carry some odd values (11, 14, 18px); snap them only in a deliberate layout pass.

## Type

- **Archivo**, one family, weights 400 to 900.
- Headlines use weight 900 with tight tracking:
  - page titles 34px at −.03em;
  - the hero ETA numeral 112 to 160px at −.055em (it shrinks on short screens);
  - section and sheet titles at −.02em.
- Body text 13 to 18px. Nothing informational below 12px.
- Inputs are 16px, which stops iOS zooming the page when a field is tapped.
- Sentence case. No ALL-CAPS labels.

## Surfaces

- Only two card styles:
  - **Raised:** white, 22px radius, `--shadow-raised`.
  - **Flat:** a tinted fill, no shadow (e.g. the driver row on the canvas).
- **Track** is a full-bleed marigold hero (a gradient from lighter top-right to slightly deeper bottom-left, aubergine text). A white sheet overlaps it. A flat aubergine bus with ice windows rides the sheet's top edge, positioned by route progress. On the sheet, in order: Today's route (the next stop is a large white node with an aubergine ring), the driver card, then "Distance from home": the live map with a row per linked child giving the bus's approximate distance from that child's home. It is measured from home, so it reads the same whether the parent is at home or away, and needs no location permission.
- **Header**, two rows:
  - row 1: the parent's "SD" avatar (opens Account), a greeting by the phone's local time ("Good morning / afternoon / evening," over "Sarah"), and the bell on the right;
  - row 2, on Track, Schedule and History: the child switcher, left-aligned;
  - on Account's sub-screens the back button and the page title take row 1.
- **Avatars** show the person's photo if one is set, otherwise initials (ink, or the light tint for a second person). The parent's own avatar on Account carries a small white camera badge to say it can be changed. Photos are cropped square.
- **Account screens** reuse the panel, row list, field and switch row; marigold appears only on the one Save/Add button. Status rows end in a small tag ("On" in ink, "Not used" / "Soon" in the flat tint). Field errors are red text under the field with a red border, never colour alone.
- **Nav** is a light frosted pill with three tabs (Track, Schedule, History), floating above the content:
  - the active tab is ink at weight 800, with a short ink bar (20×3) under its label that glides to the new tab with a decelerating ease (transform only, no stretch or overshoot); the others are muted. Marigold can't mark it here: on white it is about 2:1, under the 3:1 a state indicator needs;
  - the raised marigold FAB docks at the pill's right end, centred on it. Its quick actions rise above it as a labelled stack, Call nearest the thumb, staggered by 30ms;
  - content scrolls underneath.
- **Header** turns frosted ice only once content scrolls under it.
- **Sheets** are frosted white glass over an aubergine-dimmed scrim.
- **Glass recipe:**
  - a translucent fill (`--glass-dark`, `--glass-light` or `--glass-sheet`);
  - a thin top highlight (`--glass-highlight`);
  - a subtle silver border (`--glass-border`).
- **Glass rules:**
  - Glass goes only on things that float above content: nav, header, sheets, the full-map cards.
  - Never glass on glass.
  - Text on glass is ink, not muted.
- **Blur budget.** Blur is kept to the nav, header, sheets and their scrims, the toast, the FAB scrim and the full-map cards, because it is the first thing to stutter on mid-range Android. The FAB shortcuts and map zoom buttons were deliberately left unblurred. An `@supports not (backdrop-filter)` fallback uses solid token fills.
- **Maps:**
  - silver ground, white roads, an aubergine route (solid behind, dotted ahead);
  - white stop nodes;
  - marigold only for the bus's live position on the full map.

## Motion

- **Start-up** (once per launch, so it may be expressive, but it stays near 2s: the parent came for the ETA). The native splash shows the bus on marigold; the same frame continues on screen and the wordmark rises in. The engine starts: a shiver settling to an idle, with three exhaust puffs. The bus rocks back on its rear wheel, nose up, then speeds off to the right (accelerating) with a big puff and speed lines while the wordmark lifts out, and the field fades into the first screen, which is marigold too. Timings (ms): word 120–500, rumble 450–1050, rock back 1050–1250, away 1250–1850, fade 1850–2150. Decorative, so Reduce Motion skips it.
- **Page entrances** (every tab change, so quiet): each block rises 10px and fades in over 300ms, 40ms after the one before (capped at 120ms), ease-out `cubic-bezier(.16,1,.3,1)`, no bounce. On Track the marigold hero stays still, its text rises, and the white sheet slides up 24px over it. Reduce Motion: blocks simply appear. Notifications already slides up as a whole, so its content does not stagger as well.
- Only transform and opacity are animated. No blur on page entrances: it costs too much on large surfaces on mid-range phones.
- The bus is the brand mark: see NOTES.txt for the planned app icon.
- Motion answers an action, or carries meaning:
  - The live dot pulses.
  - The next-stop ring pulses (animated with transform and opacity only).
  - The bus bobs gently.
- `prefers-reduced-motion: reduce` turns all animation off.

## Components to reuse

| Need | Use |
|---|---|
| Status | `.chip` (aubergine pill, white text); add `.lost` or `.alert` |
| Primary action | `.btn-primary` (marigold); `.dark` (aubergine) for a second action on the same screen |
| Call | `<a href="tel:...">` with `placeCall(event)`. Never a div |
| Toggle | `<button class="switch" role="switch" aria-checked>` |
| Child choice | the header `#trackSwitch` pills (`aria-pressed`) |
| Icons | `<svg><use href="#i-..."/></svg>` from the sprite in `index.html`, with `stroke="currentColor"` so the parent's colour token applies |
