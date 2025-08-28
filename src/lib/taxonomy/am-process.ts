// Process taxonomy helpers for System Manufacturers Matrix
// Maps various process codes/labels to canonical display names

export type CanonicalProcess =
  | 'Binder Jetting'
  | 'Cold Spray'
  | 'DED (Arc/Wire)'
  | 'DED (Laser)'
  | 'Directed Energy Deposition'
  | 'PBF-LB (Metal)'
  | 'PBF-LB (Polymer)'
  | 'PBF-EB (Metal)'
  | 'Material Extrusion'
  | 'Vat Photopolymerization'
  | 'Material Jetting'
  | 'Unknown'

const normalizeString = (value: string) => value.trim().toLowerCase()

export function normalizeProcess(input: string | undefined | null): CanonicalProcess | null {
  if (!input) return null
  const v = normalizeString(input)

  // Binder jetting
  if (v.includes('bjt') || v.includes('binder')) return 'Binder Jetting'

  // Cold Spray
  if (v.includes('cold spray')) return 'Cold Spray'

  // Directed Energy Deposition variants
  if (v.startsWith('ded') || v.includes('directed energy deposition')) {
    if (v.includes('arc') || v.includes('wire')) return 'DED (Arc/Wire)'
    if (v.includes('laser')) return 'DED (Laser)'
    return 'Directed Energy Deposition'
  }

  // Powder Bed Fusion variants
  if (v.includes('pbf')) {
    if (v.includes('eb')) return 'PBF-EB (Metal)'
    if (v.includes('lb/p') || v.includes('polymer')) return 'PBF-LB (Polymer)'
    return 'PBF-LB (Metal)'
  }

  // Common legacy acronyms
  if (v.includes('slm')) return 'PBF-LB (Metal)'
  if (v.includes('sls')) return 'PBF-LB (Polymer)'

  // Material Extrusion
  if (v.includes('mex') || v.includes('fdm') || v.includes('fff') || v.includes('material extrusion'))
    return 'Material Extrusion'

  // Vat Photopolymerization
  if (v.includes('vpp') || v.includes('sla') || v.includes('dlp') || v.includes('vat'))
    return 'Vat Photopolymerization'

  // Material Jetting
  if (v.includes('mj') || v.includes('material jetting')) return 'Material Jetting'

  return 'Unknown'
}

export const processSortOrder: CanonicalProcess[] = [
  'Binder Jetting',
  'Cold Spray',
  'DED (Arc/Wire)',
  'DED (Laser)',
  'Directed Energy Deposition',
  'PBF-EB (Metal)',
  'PBF-LB (Metal)',
  'PBF-LB (Polymer)',
  'Material Extrusion',
  'Vat Photopolymerization',
  'Material Jetting',
  'Unknown',
]

export function sortProcesses(values: (CanonicalProcess | string)[]): string[] {
  return [...new Set(values)].sort((a, b) => {
    const ai = processSortOrder.indexOf(a as CanonicalProcess)
    const bi = processSortOrder.indexOf(b as CanonicalProcess)
    if (ai === -1 && bi === -1) return String(a).localeCompare(String(b))
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

