# Design: uwumi dash

The locked system. Every Hallmark run reads this first and pages share it. Change it on purpose; the file is the rule.

## System
- Genre: modern-minimal
- Shape of the first page: Narrative Workflow (`/`); the shared link (`/info`) is a single Settled screen; `/admin` is an app screen
- Theme: Ultraviolet, re-hued from violet 290 to the uwumi blue #0058CA (hue 259)
- Axes: light/geometric-sans/cool · posture: committed · night colourway by default (`.dark`), lavender by day

## Tokens
`src/app/tokens.css` is the source of truth. The roles (day, then night):
```css
:root {
  --color-paper: oklch(96% 0.012 259);  --color-paper-2: oklch(93% 0.02 259);  --color-paper-3: oklch(90% 0.026 259);
  --color-ink: oklch(18% 0.02 259);  --color-ink-2: oklch(28% 0.03 259);  --color-muted: oklch(46% 0.05 259);  --color-rule: oklch(85% 0.03 259);
  --color-accent: oklch(49.1% 0.191 259);  --color-accent-ink: oklch(98% 0.005 259);  --color-focus: oklch(49.1% 0.191 259);
  --font-display: Outfit;  --font-body: Onest;  --font-outlier: "JetBrains Mono";
  --radius-card: 16px;  --radius-pill: 999px;  --rule-hair: 1px;  --shadow-card: 0 1px 2px oklch(18% 0.02 259 / 0.06);
}
.dark {
  --color-paper: oklch(14% 0.02 262);  --color-paper-2: oklch(17.5% 0.025 262);  --color-paper-3: oklch(21% 0.03 262);
  --color-ink: oklch(92% 0.03 259);  --color-muted: oklch(68% 0.05 259);  --color-rule: oklch(28% 0.04 262);
  --color-accent: oklch(54% 0.2 259);  --color-focus: oklch(64% 0.17 259);
}
```
Faces load through `next/font` in `src/app/layout.tsx` (`--font-outfit`, `--font-onest`). The spacing scale, the type scale, the easings and the durations are the scaffold's and live in `tokens.css`. Charts use `--chart-1` to `--chart-5`, one lightness ramp on the accent hue.

## Voice
- Heads, nav links, buttons, tabs and labels are Outfit 500, lowercase; prose is Onest 400 in sentence case. Media titles keep their own case.
- Figures are Outfit 300, tabular.

## Controls
- Primary: accent fill, accent-ink text, pill, 48px on pages and 36px in admin; one filled primary per screen
- Secondary: a 1.5px inset ring of currentColor, same pill and height
- Toggles and tabs: a pill track with a 1.5px rule-2 ring; the selected one fills ink
- A state that is not an action (coming soon) is text, never a disabled pill
- Inside the accent field (`--color-field`, the landing's close, once a page) the filled pill turns white with blue text

## Surfaces
- No borders on cards; a surface is a step to paper-2. Hairlines between rows. 16px radius on surfaces and screenshots, pills on controls.
- App screenshots sit plain on paper-2, untreated, in a `figure.shot` with `data-kind="product"`; never in a device frame.
- The nav is a slab: a paper-2 bar on a 2px rule.
- One band of the accent field a page at most; it holds the page's last action.

## Motion
- Character: brisk; colour transitions at `--dur-micro`, the pinned screen cross-fades at `--dur-short`; no reveal on load; under reduced motion everything ends at once.

## Exports
`tokens.css` in this project. shadcn/ui names are mapped onto the roles at the end of `tokens.css`; Tailwind 3 reads them through `color-mix` in `tailwind.config.js`, with the Hallmark names as `paper`, `ink`, `rule`, `signal` (the accent) and `focus`.
