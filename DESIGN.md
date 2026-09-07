# Design system

QuoteCast is an **Operate** surface: the person using it is mid-task, not exploring. The design
commits to the contemporary B2B SaaS convention played straight, with the Stripe Dashboard as the
craft bar — tabular figures, precise number formatting, dense tables that stay readable, colour
reserved for state, and charts that show uncertainty honestly.

The rule that follows from that: **expression never obscures the task.** Personality lives in
precision, not decoration.

---

## Tokens

Every colour is defined once in `frontend/app/index.css` and consumed through Tailwind theme
mappings. Components never hardcode a colour. Light and dark are defined as equals — neither is a
filter applied to the other.

### Surfaces

The dark theme follows GitHub's model: a neutral near-black with only a trace of blue, no violet
cast. Panels lift by surface step, never by tint shift.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--background` | `#f6f8fa` | `#0d1117` | Page ground, one step below panels |
| `--card` | `#ffffff` | `#151b23` | Panels, tables, tiles |
| `--popover` | `#ffffff` | `#1c2128` | Menus, tooltips, dialogs |
| `--secondary` | `#eff2f5` | `#21262d` | Inset controls, hover fills, bar tracks |
| `--border` | `#d1d9e0` | `#30363d` | Hairlines |
| `--sidebar` | `#ffffff` | `#010409` | Navigation rail (darkest surface in dark) |

Panels separate from the page by a **surface step plus a hairline**, not by shadow. Shadows appear
only on genuinely floating layers (tooltip, popover).

### Accent

`--primary` (`#0969da` light / `#2f81f7` dark) is spent on exactly three things: the primary
action, the current selection, and focus. It is never used decoratively.

The accent is a plain blue rather than a branded hue. On a tool someone stares at all day, an accent
that competes with the data is a cost, not a personality.

### Status

Five states, each with a foreground and a surface token, always rendered as a labelled badge:

| Status | Token pair |
| --- | --- |
| 下書き / Draft | `--status-draft` on `--status-draft-surface` |
| 送付済み / Sent | `--status-sent` on `--status-sent-surface` |
| 受注 / Won | `--status-accepted` on `--status-accepted-surface` |
| 失注 / Lost | `--status-rejected` on `--status-rejected-surface` |
| 期限切れ / Expired | `--status-expired` on `--status-expired-surface` |

Labels are defined once in the dictionary and read through `lib/status.ts`. The filter, the status
menu and the table badge all render from that single source, so the same status cannot be called
two different things on two screens.

**Colour never carries status alone.** Every status badge shows its label, and the validity bar
pairs its colour with a written day count. Mapping lives in `frontend/app/lib/status.ts`, where
class names are complete strings so Tailwind's scanner can see them.

### Chart

| Token | Meaning |
| --- | --- |
| `--chart-actual` | Confirmed months — solid fill |
| `--chart-forecast` | Predicted months — hatch stroke and bar outline |
| `--chart-band` | 95% prediction interval fill |
| `--chart-count` | Quotation count line |
| `--chart-grid` / `--chart-axis` | Grid rules and axis labels |

Actual and forecast share a hue and separate by **texture**: actuals are solid, forecasts are
hatched and outlined. That survives greyscale and colour-blindness, which a hue-only split does not.

---

## Typography

One family (Geist) carries everything; there is no display face. The Japanese fallback chain is
explicit (`Hiragino Sans` → `Noto Sans JP` → `Yu Gothic UI` → `Meiryo`) because the interface is
Japanese by default and kanji must not fall back to a substituted face.

- Page title `text-lg` semibold; panel title `text-sm` semibold; body `text-sm`; metadata `text-xs`;
  column headers and micro-labels `text-[11px]` uppercase with tracking.
- The scale ratio is deliberately tight. Product UI has many type roles; exaggerated contrast makes
  noise rather than hierarchy.
- **Every number that can be compared down a column uses the `.tabular` utility**
  (`font-variant-numeric: tabular-nums lining-nums`). Money, counts, dates, percentages, MASE
  scores. This is the single highest-leverage detail in a financial interface: without it, digits of
  different widths make columns wobble and the eye cannot scan.

---

## Layout

- Content maxes at `88rem` with `px-4` / `sm:px-6` gutters.
- Sidebar is a fixed `15rem` column at `lg` and above; below that it collapses to a top bar with a
  drawer. Responsive behaviour is **structural**, not fluid type.
- Tile rows use a `gap-px` grid on a `bg-border` parent, so dividers are the grid gap itself rather
  than borders that double up at the seams.
- Tables set `min-w-[56rem]` and scroll inside their own container; the page body never scrolls
  horizontally.

---

## Components

Every interactive element ships default, hover, focus and disabled states. Focus is a global
`:focus-visible` ring in `--ring` at 2px with 2px offset — never removed, never restyled per
component.

- **Buttons** — one shape (`rounded-md`, `h-8` for toolbar actions). Primary is filled with the
  accent; everything else is a bordered or ghost control.
- **Segmented controls** (period, horizon) — a bordered track holding buttons that carry
  `aria-pressed`, with the active item on `--secondary`.
- **Badges** — `rounded` (not pill), `text-[11px]` medium, status surface plus status foreground.
- **Tables** — hairline row separators, `hover:bg-secondary/50`, whole row clickable, per-row action
  menu that stops propagation.
- **Loading** — skeletons that mirror the real layout. No spinners in the middle of content; nothing
  should jump when data arrives.
- **Empty states** — an icon, what happened, and what to do next; filtered-empty and truly-empty are
  different messages.

---

## Motion

150 ms transitions on colour and background only. Motion reports state change, never decorates.
There are no page-load choreographies — the app loads into a task. Chart animation is off
(`isAnimationActive={false}`) so re-reading a value after changing the period is instant.

`prefers-reduced-motion: reduce` collapses all animation and transition durations globally.

---

## Browser surfaces

The parts not drawn by the app still carry the design: text selection, the focus ring, and
scrollbars are themed from the palette in `index.css`. A themed scrollbar is the cheapest signal
that a page was built rather than assembled.

---

## Internationalisation

Japanese is the source language; English is a peer translation, not a gloss. The dictionary lives in
`frontend/app/i18n/dictionary.ts`, keyed `screen.element`, and `TranslationKey` is derived from the
Japanese object — **a key missing from either language is a compile error.**

Layout constraints that follow:

- No fixed-width text containers. English runs roughly 1.4× the character count of Japanese.
- Numbers format through `Intl.NumberFormat` bound to the active locale, never string concatenation.
- Labels are never assembled from sentence fragments; interpolation uses `{n}` / `{value}` tokens so
  word order can differ between languages.

---

## Accessibility floor

- Body and placeholder text meet 4.5:1; large text meets 3:1, in both themes.
- Status is never colour-only.
- Every control is keyboard reachable with a visible focus ring.
- Icon-only buttons carry `aria-label`; decorative icons carry `aria-hidden`.
- Toggles expose `aria-pressed`; the current nav item exposes `aria-current="page"`.
- The interface holds together at 200% zoom.

---

## What this system refuses

- Cards as page structure, and nested cards.
- Gradient text, glass blur as decoration, hard offset shadows.
- Colour as the only carrier of meaning.
- Spinners where a skeleton belongs.
- Hardcoded colours in components.
- Proportional figures in numeric columns.
- Emoji standing in for an icon system — icons come from lucide at one stroke weight.
