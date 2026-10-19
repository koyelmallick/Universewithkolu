---
name: Frontend Design
description: Premium UI/UX for "Explore the Universe" - design tokens, dark-theme visual hierarchy, responsive layout rules, typography scale, and the motion system used across the site. Use when building or restyling any section, hero, card, nav, or animation in this repo.
---

# Frontend Design - Explore the Universe

This is a **cinematic dark-theme science museum in a browser**. The reference point
is a planetarium exhibit, not a SaaS dashboard. Every design decision should make
the user feel like they are looking through glass at something enormous.

## 1. Design tokens live in `src/index.css`

Never hardcode colors, radii, or shadows in components. Read the tokens defined in
the `@theme` block and use the Tailwind utilities they generate. The token name and
the utility name are the same string: `--color-ink-muted` gives you `text-ink-muted`,
`--color-ion` gives you `bg-ion` / `border-ion` / `ring-ion`.

| Token | Value | Use |
| --- | --- | --- |
| `--color-void` | `#04050c` | Page background. Near-black, never pure `#000`. |
| `--color-abyss` | `#080b16` | Section background, alternating band. |
| `--color-panel` | `#0e1220` | Card surface. |
| `--color-panel-2` | `#151a2c` | Hover / raised surface. |
| `--color-hairline` | `rgba(148,163,184,0.14)` | 1px borders. Never use a solid grey border. |
| `--color-ink` | `#eef1fb` | Primary text. |
| `--color-ink-muted` | `#98a5c6` | Body copy. Must stay >= 4.5:1 on `--color-void`. |
| `--color-ink-faint` | `#6b7796` | Captions, credits, metadata only. |
| `--color-ion` | `#5ce1e6` | Primary accent. Interactive + "verified fact" markers. |
| `--color-solar` | `#ffb454` | Secondary accent. Warnings, heat, volcanoes. |
| `--color-nebula` | `#a78bfa` | Tertiary accent. Hypothesis / simulation markers. |
| `--color-bio` | `#4ade80` | Life, oceans, growth. |
| `--color-danger` | `#f87171` | Errors and destructive states. |

Accent usage rule: **one accent per section**. Space = ion, Earth = bio + solar,
Science = nebula, Human exploration = solar, Discovery = ion. Mixing all four in a
single viewport reads as a toy.

## 2. Typography

Two families, loaded in `index.html`:

- **Display / headings:** `Space Grotesk` - geometric, slightly technical.
- **Body / UI:** `Inter` - maximum legibility for long-form explanations.

```css
/* Headings */
font-family: "Space Grotesk", "Inter", system-ui, sans-serif;
letter-spacing: -0.02em;   /* large type only */
text-wrap: balance;        /* on h1-h3 */

/* Body */
font-family: "Inter", system-ui, sans-serif;
line-height: 1.7;          /* long explanations in a science site need air */
max-width: 68ch;
text-wrap: pretty;
```

Scale (use Tailwind's fluid classes, do not invent arbitrary px):

| Role | Class |
| --- | --- |
| Hero h1 | `text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight` |
| Section h2 | `text-3xl sm:text-4xl font-semibold tracking-tight` |
| Card h3 | `text-lg font-semibold` |
| Body | `text-base text-ink-muted` |
| Eyebrow / section label | `.eyebrow` utility - `text-xs uppercase tracking-[0.2em] text-ink-faint` |
| Long copy | `.prose-space` utility - caps at 68ch and spaces paragraphs |
| Numeric fact | `text-xl sm:text-2xl font-semibold tnum` |

Use `.eyebrow` and `.prose-space` rather than re-deriving them; they exist so the
whole site stays on one rhythm. Always use `.tnum` (tabular-nums) on numbers that
animate or sit in a column - otherwise digit counting jitters the layout.

## 3. Layout skeleton

- Max content width: `max-w-7xl mx-auto px-5 sm:px-8`.
- Every section: `py-24 sm:py-32`, wrapped in `<section id="...">` so nav anchors work.
- Vertical rhythm between a section heading and its content: `mt-4` for the lede,
  `mt-14` for the grid.
- Grids: `grid gap-6 md:grid-cols-2 xl:grid-cols-3`. Never let a card row go below
  `gap-5` - the whole design collapses if panels touch.
- Cards: use `<Panel>` (`src/components/ui/Panel.tsx`) rather than hand-rolling the
  surface. It already applies `panel` plus padding and an accent hover rule.
  Inner padding is never less than `p-5`.

## 3b. Use the existing components before writing new markup

The whole site is assembled from these. Reaching for raw `<div>`s when one of these
fits is the single most common way this codebase drifts.

| Component | Purpose |
| --- | --- |
| `SectionShell` | `<section>` with `id`, section padding, and an accent glow. |
| `SectionHeading` | Eyebrow + `h2` + lede, each revealed in sequence. |
| `Reveal` | Wraps children in the scroll-reveal animation. |
| `Panel` | The glass surface. |
| `EvidenceTag` / `TierTag` | Photograph / simulation / illustration / data badges. |
| `MediaFigure` | A credited image. Mandatory for any picture. |
| `FactGrid` | The sourced-numbers block. |
| `SourceList` | The reference list. Deduplicates by URL. |
| `Tabs` / `TabPanel` | Accessible topic selector with arrow-key support. |
| `TopicDetail` | A whole topic in the required four-block structure. |
| `SceneFrame` | A 3D scene with its "simulation" badge and scale caption. |

## 4. The "glass over space" surface recipe

Three layers, always in this order:

1. **Background:** `<Starfield>` (`src/components/Starfield.tsx`) - a fixed 2D canvas
   plus a base radial gradient. It draws with the 2D API on purpose so it costs no
   WebGL context.
2. **Scrim:** `bg-gradient-to-b from-void/0 via-void/60 to-void`, or the inline
   linear-gradient the hero uses, behind text blocks so body copy stays readable
   over 3D.
3. **Panel:** `.panel` (translucent surface + `backdrop-blur-xl` + 1px hairline).

Never place text directly on an un-scrimmed 3D canvas. If a section has a live
`<Canvas>`, the copy column gets a gradient scrim or sits in a panel.

## 5. Motion system

- CSS-only for layout/entrance: `transition-[opacity,transform] duration-500 ease-out`.
- Reveal on scroll via the `<Reveal>` wrapper (`src/components/layout/SectionShell.tsx`),
  which uses the `useInView` hook. It toggles `data-visible`; the CSS in `index.css`
  does the rest. Never add a `window.addEventListener('scroll')` handler.
- Stagger children with `transition-delay: calc(var(--i) * 70ms)` and pass `index={n}`
  to `<Reveal>`.
- Respect the reduced-motion contract: `@media (prefers-reduced-motion: reduce)` in
  `index.css` disables transitions, and R3F's `useFrame` animation is gated by the
  `useReducedMotion()` hook. Any new animation must be gated too.
- Hover: lift by `-translate-y-1` **and** brighten the hairline to the section accent.
  Two simultaneous cues, never a scale jitter.

## 6. Responsive rules specific to this site

- The 3D hero scales with `dpr={[1, 1.75]}` and `EarthScene` uses `useMediaQuery` to
  drop and shrink the globe below `lg`, so the headline never overlaps it.
- Below `md`, collapse multi-column fact tables into stacked definition lists rather
  than horizontal scroll.
- Touch targets: `min-h-11 min-w-11` on every tab, chip, and nav link.
- Test at 390px, 768px, 1280px, and 1920px before calling a section done. `npm run
  smoke` checks 390 / 768 / 1920 for horizontal overflow automatically.

## 7. Accessibility non-negotiables

- Contrast: body text on panels >= 4.5:1. `--color-ink-muted` on `--color-panel` clears
  it; `--color-ink-faint` does **not** and is for captions and metadata only.
- Focus: `focus-visible:ring-2 focus-visible:ring-ion focus-visible:ring-offset-2 focus-visible:ring-offset-void`.
- Interactive 3D scenes get a text alternative: `LazyCanvas` puts the description on
  the wrapper's `aria-label`, and `SceneFrame` renders the scale caveat as real text.
- Never encode meaning in color alone. Every badge pairs color with a label.

## 8. Done checklist for a new section

1. Uses only tokens from `@theme`.
2. Has `id`, an eyebrow label, an `h2`, and a one-sentence lede.
3. Every card has at least one sourced fact.
4. Renders correctly at 390px and 1920px.
5. Reveal animation gated by reduced-motion.
6. No horizontal scrollbar at any width.
