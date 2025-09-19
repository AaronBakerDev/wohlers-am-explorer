# ASTM Color Token Draft
_Source: ASTM Brand Guidelines v2.6 (2024) — pages 19-22. Implementation mapped to `src/app/globals.css` on 2025-09-19._

## Primary Blue Family
- `astm-blue-900`: `#021740` (deep base tint)
- `astm-blue-800`: `#0f3572`
- `astm-blue-700`: `#0f35b8` (primary ASTM Blue)
- `astm-blue-200`: `#c3cded`
- `astm-blue-100`: `#e9edf9`
- `astm-blue-000`: `#ffffff`

Usage: Logo, navigation, primary CTAs, key headings. Pantone equivalent: 293 for print.

## Secondary Palette (Keep Groups Isolated)
### Group 1 — Deep Teal Spectrum
- Base: `#002323`
- Accent: `#135659`
- Tint: `#daf9e5`

### Group 2 — Navy to Aqua
- Base: `#021740`
- Accent: `#0091af`
- Tint: `#bff7fb`

### Group 3 — Plum to Blush
- Base: `#330b28`
- Accent: `#951962`
- Tint: `#f8d5eb`

### Group 4 — Brick to Peach
- Base: `#2f101a`
- Accent: `#b92d19`
- Tint: `#fee9e0`

### Group 5 — Slate Neutrals
- Base: `#bfbfbf`
- Accent: `#d9d9a9`
- Tints: `#d9d9d9`, `#ededed`

Usage: Feature highlights, infographics, data group differentiation. Do not mix groups within a single visualization.

## Neutral Ramp (Support UI Backgrounds)
- `neutral-950`: `#021740` (shared with blue family for deep backgrounds)
- `neutral-900`: `#0f3572`
- `neutral-700`: `#135659`
- `neutral-500`: `#71717a` (placeholder until final neutral guidance confirmed)
- `neutral-200`: `#d9d9d9`
- `neutral-100`: `#ededed`
- `neutral-000`: `#ffffff`

_Note: Confirm final neutral ramp once ASTM provides official grayscale guidance (Index references only secondary group 5)._

## Data Visualization Guidance
- Use one secondary group per chart/series + ASTM Blue accents as needed.
- Provide token aliases `chart-group-1-*` … `chart-group-5-*` to mirror the above group bases/tints.

## Next Steps
1. Map tokens to CSS custom properties in `src/app/globals.css` (light/dark variants).
2. Create Figma/Storybook swatch reference for design review.
3. Validate contrast ratios with ASTM Blue foreground/background combinations.
