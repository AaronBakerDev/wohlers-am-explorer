// Normalize system manufacturers data into a simple JSON for the dashboard matrix
// Input: docs/project-documents/04-data/extracted-vendor-data/*.json
// Output: public/data/system-manufacturers.json

const fs = require('fs')
const path = require('path')

function readJson(p, fallback = []) {
  try {
    const data = fs.readFileSync(p, 'utf8')
    return JSON.parse(data)
  } catch (e) {
    return fallback
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function slugKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeMaterial(input) {
  if (!input) return null
  const v = String(input).trim().toLowerCase()
  if (v.startsWith('metal')) return 'Metal'
  if (v.startsWith('polymer') || v === 'plastic' || v === 'resin') return 'Polymer'
  if (v.startsWith('ceramic')) return 'Ceramic'
  if (v.startsWith('sand')) return 'Sand'
  if (v.includes('composite') || v.includes('carbon')) return 'Composite'
  if (v.includes('concrete') || v.includes('cement')) return 'Concrete'
  if (v.includes('bio') || v.includes('tissue')) return 'Bio'
  return 'Other'
}

function normalizeProcess(input) {
  if (!input) return null
  const v = String(input).trim().toLowerCase()
  if (v.includes('bjt') || v.includes('binder')) return 'Binder Jetting'
  if (v.includes('cold spray')) return 'Cold Spray'
  if (v.startsWith('ded') || v.includes('directed energy deposition')) {
    if (v.includes('arc') || v.includes('wire')) return 'DED (Arc/Wire)'
    if (v.includes('laser')) return 'DED (Laser)'
    return 'Directed Energy Deposition'
  }
  if (v.includes('pbf')) {
    if (v.includes('eb')) return 'PBF-EB (Metal)'
    if (v.includes('lb/p') || v.includes('polymer')) return 'PBF-LB (Polymer)'
    return 'PBF-LB (Metal)'
  }
  if (v.includes('slm')) return 'PBF-LB (Metal)'
  if (v.includes('sls')) return 'PBF-LB (Polymer)'
  if (v.includes('mex') || v.includes('fdm') || v.includes('fff') || v.includes('material extrusion'))
    return 'Material Extrusion'
  if (v.includes('vpp') || v.includes('sla') || v.includes('dlp') || v.includes('vat'))
    return 'Vat Photopolymerization'
  if (v.includes('mj') || v.includes('material jetting')) return 'Material Jetting'
  return 'Unknown'
}

function main() {
  const root = process.cwd()
  const dataDir = path.join(
    root,
    'docs/project-documents/04-data/extracted-vendor-data'
  )
  const systemMfrsPath = path.join(dataDir, 'COMPANY___AM_systems_mfrs.json')
  const companyInfoPath = path.join(dataDir, 'Company_information.json')
  const companyRolesPath = path.join(dataDir, 'Company_roles.json')

  const systemMfrs = readJson(systemMfrsPath, [])
  const companyInfo = readJson(companyInfoPath, [])
  const companyRoles = readJson(companyRolesPath, [])

  const printerMfrSet = new Set(
    companyRoles
      .filter((r) => String(r['Category'] || '').toLowerCase() === 'printer manufacturer')
      .map((r) => r['Company name'])
      .filter(Boolean)
  )

  const infoByName = new Map()
  for (const rec of companyInfo) {
    if (!rec || !rec['Company name']) continue
    infoByName.set(rec['Company name'], {
      website: rec['Website'] || null,
      headquarters: rec['Headquarters'] || null,
    })
  }

  // aggregate by company key
  const byCompany = new Map()

  for (const rec of systemMfrs) {
    if (!rec) continue
    const name = rec['Company name']
    if (!name) continue

    // Filter to system manufacturers/printer manufacturers when possible
    const seg = (rec['Segment'] || '').toString().toLowerCase()
    const isSystemMfr = seg.includes('system manufacturer') || printerMfrSet.has(name)
    if (!isSystemMfr) continue

    const key = slugKey(name)
    if (!byCompany.has(key)) {
      const info = infoByName.get(name) || {}
      byCompany.set(key, {
        company: name,
        countries: new Map(), // value -> count
        processes: new Set(),
        materials: new Set(),
        website: info.website || null,
      })
    }

    const entry = byCompany.get(key)

    // Country
    const country = rec['Country'] || (infoByName.get(name) || {}).headquarters || null
    if (country) {
      const c = String(country).trim()
      entry.countries.set(c, (entry.countries.get(c) || 0) + 1)
    }

    // Process
    const proc = normalizeProcess(rec['Process'])
    if (proc) entry.processes.add(proc)

    // Material
    const mat = normalizeMaterial(rec['Material type'] || rec['Material'])
    if (mat) entry.materials.add(mat)
  }

  // Finalize
  const rows = []
  for (const [, v] of byCompany) {
    // pick country by highest count
    let country = null
    let maxCount = -1
    for (const [c, count] of v.countries.entries()) {
      if (count > maxCount) {
        country = c
        maxCount = count
      }
    }

    rows.push({
      company: v.company,
      country: country || '',
      processes: Array.from(v.processes).sort(),
      materials: Array.from(v.materials).sort(),
      website: v.website || null,
    })
  }

  rows.sort((a, b) => a.company.localeCompare(b.company))

  const outDir = path.join(root, 'public', 'data')
  ensureDir(outDir)
  const outPath = path.join(outDir, 'system-manufacturers.json')
  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2), 'utf8')
  console.log(`Wrote ${rows.length} rows to ${path.relative(root, outPath)}`)
}

if (require.main === module) {
  main()
}

