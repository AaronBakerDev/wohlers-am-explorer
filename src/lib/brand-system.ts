type Contrast = 'light' | 'dark'

type PrimarySwatch = {
  name: string
  hex: string
  contrast: Contrast
}

type SecondarySwatch = {
  name: string
  hex: string
  contrast: Contrast
}

type SecondaryGroup = {
  group: string
  swatches: SecondarySwatch[]
}

export const primaryBluePalette: PrimarySwatch[] = [
  { name: 'ASTM Blue', hex: '#0f35b8', contrast: 'light' },
  { name: 'Blue 800', hex: '#0f3572', contrast: 'light' },
  { name: 'Blue 200', hex: '#c3cded', contrast: 'dark' },
  { name: 'Blue 100', hex: '#e9edf9', contrast: 'dark' }
]

export const secondaryPalettes: SecondaryGroup[] = [
  {
    group: 'Group 1 · Teal',
    swatches: [
      { name: 'Accent', hex: '#135659', contrast: 'light' },
      { name: 'Tint', hex: '#daf9e5', contrast: 'dark' }
    ]
  },
  {
    group: 'Group 2 · Aqua',
    swatches: [
      { name: 'Accent', hex: '#0091af', contrast: 'light' },
      { name: 'Tint', hex: '#bff7fb', contrast: 'dark' }
    ]
  },
  {
    group: 'Group 3 · Plum',
    swatches: [
      { name: 'Accent', hex: '#951962', contrast: 'light' },
      { name: 'Tint', hex: '#f8d5eb', contrast: 'dark' }
    ]
  },
  {
    group: 'Group 4 · Brick',
    swatches: [
      { name: 'Accent', hex: '#b92d19', contrast: 'light' },
      { name: 'Tint', hex: '#fee9e0', contrast: 'dark' }
    ]
  }
]

export const chartPaletteNotes = ['#0f35b8', '#135659', '#0091af', '#951962', '#b92d19'] as const

export const typographyScale = [
  {
    label: 'Display / Headline',
    sample: 'Advancing Standards.',
    className: 'text-4xl font-extralight tracking-tight'
  },
  {
    label: 'Section Title',
    sample: 'Transforming Markets',
    className: 'text-2xl font-light tracking-[0.08em] uppercase'
  },
  {
    label: 'Body Copy',
    sample: 'Helping our world work better through additive manufacturing insights.',
    className: 'text-base font-normal text-muted-foreground'
  },
  {
    label: 'Caption & UI Label',
    sample: 'Last updated · September 19, 2025',
    className: 'text-xs font-semibold uppercase tracking-[0.18em] text-subtle'
  }
]

export const spacingScale = [
  { token: 'spacing-1', px: 4, rem: '0.25rem', usage: 'Tight icon padding, chip gutters' },
  { token: 'spacing-2', px: 8, rem: '0.5rem', usage: 'Button padding, small gaps' },
  { token: 'spacing-3', px: 12, rem: '0.75rem', usage: 'Form field spacing, badge gutters' },
  { token: 'spacing-4', px: 16, rem: '1rem', usage: 'Default grid gap, card body padding' },
  { token: 'spacing-6', px: 24, rem: '1.5rem', usage: 'Section dividers, modal padding' },
  { token: 'spacing-8', px: 32, rem: '2rem', usage: 'Hero padding, card stack separation' },
  { token: 'spacing-12', px: 48, rem: '3rem', usage: 'Page gutters, hero top/bottom' }
]

export const resourceLinks = [
  {
    label: 'Color tokens draft',
    path: 'docs/astm-brand-guide-images/astm-color-token-draft.md'
  },
  {
    label: 'Typography plan',
    path: 'docs/astm-brand-guide-images/astm-typography-bridge.md'
  },
  {
    label: 'Icon usage note',
    path: 'docs/astm-brand-guide-images/astm-icon-usage-note.md'
  },
  {
    label: 'Supergraphic guidance',
    path: 'docs/astm-brand-guide-images/astm-supergraphic-guidelines.md'
  }
]
