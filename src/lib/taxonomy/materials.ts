// Material taxonomy helpers for System Manufacturers Matrix

export type CanonicalMaterial =
  | 'Metal'
  | 'Polymer'
  | 'Ceramic'
  | 'Sand'
  | 'Composite'
  | 'Concrete'
  | 'Bio'
  | 'Other'

const normalizeString = (value: string) => value.trim().toLowerCase()

export function normalizeMaterial(input: string | undefined | null): CanonicalMaterial | null {
  if (!input) return null
  const v = normalizeString(input)

  if (v.startsWith('metal')) return 'Metal'
  if (v.startsWith('polymer') || v === 'plastic' || v === 'resin') return 'Polymer'
  if (v.startsWith('ceramic')) return 'Ceramic'
  if (v.startsWith('sand')) return 'Sand'
  if (v.includes('composite') || v.includes('carbon')) return 'Composite'
  if (v.includes('concrete') || v.includes('cement')) return 'Concrete'
  if (v.includes('bio') || v.includes('tissue')) return 'Bio'

  return 'Other'
}

export function sortMaterials(values: (CanonicalMaterial | string)[]): string[] {
  const order: CanonicalMaterial[] = ['Metal', 'Polymer', 'Ceramic', 'Sand', 'Composite', 'Concrete', 'Bio', 'Other']
  return [...new Set(values)].sort((a, b) => {
    const ai = order.indexOf(a as CanonicalMaterial)
    const bi = order.indexOf(b as CanonicalMaterial)
    if (ai === -1 && bi === -1) return String(a).localeCompare(String(b))
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

