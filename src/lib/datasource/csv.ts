import fs from 'fs'
import path from 'path'
import { getDataRoot } from './config'

// CSV Data Types
interface MarketTotalRow {
  Year: number
  Type: string
  Segment: string
  ' Past revenue (USD) ': number | string
}

interface MarketRevenueRow {
  Country: string
  Segment: string
  ' Revenue (USD) ': number | string
}

interface PricingDataRow {
  'Company name': string
  Country?: string
  Process?: string
  'Material type'?: string
  Material?: string
  Quantity: number
  'Manufacturing cost': number | string
  'Lead time'?: number | string
}

interface CompanyInfoRow {
  'Company name': string
  Website?: string
  Headquarters?: string
}

interface CompanyRoleRow {
  'Company name': string
  Category: string
}

interface InvestmentRow {
  'Company name': string
  'Amount (in millions USD)': number | string
  Year?: number
}

type CacheEntry<T> = { ts: number; data: T }
const cache = new Map<string, CacheEntry<unknown>>()
const TTL_MS = 10 * 60 * 1000 // 10 minutes

function readJsonFile<T = unknown>(fileName: string): T {
  const root = getDataRoot()
  const full = path.join(root, fileName)
  const now = Date.now()
  const hit = cache.get(full)
  if (hit && now - hit.ts < TTL_MS) return hit.data
  if (!fs.existsSync(full)) {
    throw new Error(`Data file not found: ${full}`)
  }
  const raw = fs.readFileSync(full, 'utf8')
  const parsed = JSON.parse(raw)
  cache.set(full, { ts: now, data: parsed })
  return parsed
}

function readTextFile(fileRelPath: string): string {
  const root = getDataRoot()
  const full = path.join(root, fileRelPath)
  if (!fs.existsSync(full)) throw new Error(`Data file not found: ${full}`)
  return fs.readFileSync(full, 'utf8')
}

function toNumber(v: unknown): number {
  if (typeof v === 'number') return v
  if (v == null) return 0
  const s = String(v).replace(/[$,\s]/g, '')
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

// --- Label harmonization helpers ---
function normKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const SEGMENT_ALIASES: Record<string, string> = {
  // Canonical: Printing services
  'printing services': 'Printing services',
  'printing service provider': 'Printing services',
  // Canonical: Printer sales & servicing
  'system manufacturer': 'Printer sales & servicing',
  'systems manufacturer': 'Printer sales & servicing',
  // Canonical: Materials
  'materials': 'Materials',
  'material': 'Materials',
  'material provider': 'Materials',
  'materials provider': 'Materials',
  // Canonical: Software
  'software': 'Software',
  // Preserve Total
  'total': 'Total',
}

function canonicalSegment(input: string): string {
  const key = normKey(input)
  return SEGMENT_ALIASES[key] || input
}

// --- Country normalization helpers ---
function normCountry(input?: string | null): string {
  const s = String(input || '').trim()
  if (!s) return s
  // Common definite article variants
  if (s.startsWith('The ')) return normCountry(s.slice(4))
  // United States
  if (s === 'U.S.' || s === 'US' || s === 'USA' || s === 'United States of America' || s === 'United States') return 'United States'
  // United Kingdom
  if (s === 'U.K.' || s === 'UK' || s === 'United Kingdom') return 'United Kingdom'
  // Netherlands
  if (s === 'Netherlands' || s === 'The Netherlands') return 'Netherlands'
  // Korea
  if (s === 'Korea, Rep.' || s === 'Republic of Korea' || s === 'Korea (Republic of)' || s === 'South Korea') return 'South Korea'
  if (s === "Korea, Dem. People's Rep." || s === 'Korea, Democratic People\'s Republic of' || s === 'North Korea') return 'North Korea'
  // Russia
  if (s === 'Russian Federation' || s === 'Russia') return 'Russia'
  // Vietnam
  if (s === 'Viet Nam' || s === 'Vietnam') return 'Vietnam'
  // Czech Republic / Czechia
  if (s === 'Czech Republic' || s === 'Czechia') return 'Czech Republic'
  // China
  if (s === 'People\'s Republic of China' || s === 'Mainland China' || s === 'China, Mainland' || s === 'PRC' || s === 'China') return 'China'
  // Taiwan
  if (s === 'Taiwan, Province of China' || s === 'Taiwan (Province of China)' || s === 'Chinese Taipei' || s === 'Taiwan') return 'Taiwan'
  // Misc definite-article countries
  if (s === 'Gambia') return 'Gambia'
  if (s === 'Philippines' || s === 'Republic of the Philippines') return 'Philippines'
  return s
}

// --- Public adapters ---

// Market totals from Total_AM_market_size.json
export function getMarketTotalsCsv(opts: { startYear?: number; endYear?: number; segment?: string | null }) {
  const rows = readJsonFile<MarketTotalRow[]>('Total_AM_market_size.json')
  const normalized = rows
    .filter((r) => r && typeof r.Year === 'number' && typeof r.Segment === 'string' && r[' Past revenue (USD) '] != null)
    .map((r) => ({
      year: r.Year as number,
      type: String(r.Type || '').trim(),
      segment: canonicalSegment(String(r.Segment || '').trim()),
      value: toNumber(r[' Past revenue (USD) ']),
    }))

  const start = opts.startYear ?? 2020
  const end = opts.endYear ?? 2030
  const segFilter = opts.segment && opts.segment !== 'all' ? canonicalSegment(opts.segment) : null

  // Choose scenario: Past revenue for ≤ 2024; Average forecast for > 2024
  const picked = normalized.filter((r) => {
    if (segFilter && r.segment !== segFilter && r.segment !== 'Total') return false
    if (r.year <= 2024) return r.type === 'Past revenue'
    return r.type === 'Average forecast'
  })

  const inRange = picked.filter((r) => r.year >= start && r.year <= end)

  // Build chart rows: year object with segments and total
  const yearMap = new Map<number, Record<string, number>>()
  for (const r of inRange) {
    const seg = r.segment === 'Total' ? 'Total' : r.segment
    const y = yearMap.get(r.year) || { year: r.year }
    if (seg !== 'Total') (y as Record<string, number>)[seg] = ((y as Record<string, number>)[seg] || 0) + r.value
    ;(y as Record<string, number>).total = ((y as Record<string, number>).total || 0) + r.value
    yearMap.set(r.year, y)
  }

  const chartData = Array.from(yearMap.values()).sort((a, b) => a.year - b.year)
  const segments = Array.from(
    new Set(inRange.map((r) => r.segment).filter((s) => s && s !== 'Total')),
  ).sort()

  return { data: chartData, segments, raw: inRange }
}

// Country/segment split for 2024 from AM_market_revenue_2024.json
export function getMarketCountriesCsv(opts: { year: number; segment?: string | null; country?: string | null; limit?: number }) {
  const rows = readJsonFile<MarketRevenueRow[]>('AM_market_revenue_2024.json')
  const segFilter = opts.segment && opts.segment !== 'all' ? canonicalSegment(opts.segment) : null
  const countryFilter = opts.country && opts.country !== 'all' ? normCountry(opts.country) : null
  const limit = Math.max(1, Math.min(1000, Number(opts.limit) || 1000))

  const cleaned = rows
    .filter((r) => r && r.Country && r.Segment && r[' Revenue (USD) '] != null)
    .map((r) => ({ country: normCountry(String(r.Country).trim()), segment: canonicalSegment(String(r.Segment).trim()), value: toNumber(r[' Revenue (USD) ']) }))

  let filtered = cleaned
  if (segFilter) filtered = filtered.filter((r) => r.segment === segFilter)
  if (countryFilter) filtered = filtered.filter((r) => r.country === countryFilter)

  const totalValue = filtered.reduce((s, r) => s + r.value, 0)
  const countries = Array.from(new Set(filtered.map((r) => r.country))).sort()
  const segments = Array.from(new Set(filtered.map((r) => r.segment))).sort()

  // Aggregate by country
  const byCountryMap = new Map<string, number>()
  for (const r of filtered) byCountryMap.set(r.country, (byCountryMap.get(r.country) || 0) + r.value)
  const topCountries = Array.from(byCountryMap.entries())
    .map(([country, value]) => ({ country, value, percentage: totalValue ? ((value / totalValue) * 100).toFixed(2) : '0.00' }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  // Aggregate by segment
  const bySegment = segments.map((seg) => ({
    segment: seg,
    value: filtered.filter((r) => r.segment === seg).reduce((s, r) => s + r.value, 0),
    countries: filtered.filter((r) => r.segment === seg).length,
  }))

  return {
    data: filtered.slice(0, limit),
    summary: {
      year: opts.year,
      totalValue,
      totalCountries: countries.length,
      totalSegments: segments.length,
      topCountries,
      bySegment,
    },
    filters: { availableCountries: countries, availableSegments: segments },
  }
}

// Pricing from Print_services_Pricing_data.json
export function getPricingCsv(opts: { process?: string | null; material?: string | null; quantity?: number | null; country?: string | null }) {
  const rows = readJsonFile<PricingDataRow[]>('Print_services_Pricing_data.json')
  const process = opts.process && opts.process !== 'all' ? opts.process : null
  const material = opts.material && opts.material !== 'all' ? opts.material : null
  const quantity = opts.quantity && Number.isFinite(opts.quantity) ? Number(opts.quantity) : null
  const country = opts.country && opts.country !== 'all' ? normCountry(opts.country) : null

  let items = rows
    .filter((r) => r && r['Company name'] && r['Manufacturing cost'] != null && r['Quantity'] != null)
    .map((r) => ({
      company: String(r['Company name']).trim(),
      country: normCountry(String(r['Country'] || 'Unknown')),
      process: String(r['Process'] || 'Unknown'),
      material: String(r['Material type'] || r['Material'] || 'Unknown'),
      quantity: Number(r['Quantity']),
      price: toNumber(r['Manufacturing cost']),
      leadTime: r['Lead time'] != null ? Number(r['Lead time']) : null,
    }))

  if (process) items = items.filter((i) => i.process === process)
  if (material) items = items.filter((i) => i.material === material)
  if (quantity != null) items = items.filter((i) => i.quantity === quantity)
  if (country) items = items.filter((i) => i.country === country)

  const prices = items.map((i) => i.price)
  const leadTimes = items.map((i) => i.leadTime).filter((v): v is number => typeof v === 'number')
  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)
  const median = (arr: number[]) => (arr.length ? [...arr].sort((a, b) => a - b)[Math.floor(arr.length / 2)] : 0)

  const statistics = {
    price: {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0,
      avg: avg(prices),
      median: median(prices),
      count: prices.length,
    },
    leadTime: {
      min: leadTimes.length ? Math.min(...leadTimes) : 0,
      max: leadTimes.length ? Math.max(...leadTimes) : 0,
      avg: avg(leadTimes),
      median: median(leadTimes),
      count: leadTimes.length,
    },
  }

  // Filter options
  const all = readJsonFile<PricingDataRow[]>('Print_services_Pricing_data.json')
  const uniq = <T,>(arr: T[]) => Array.from(new Set(arr))
  const processes = uniq(all.map((r) => String(r['Process'] || '').trim()).filter(Boolean)).sort()
  const materials = uniq(all.map((r) => String(r['Material type'] || r['Material'] || '').trim()).filter(Boolean)).sort()
  const quantities = uniq(all.map((r) => Number(r['Quantity'])).filter((n) => Number.isFinite(n))).sort((a, b) => a - b)
  const countries = uniq(all.map((r) => normCountry(String(r['Country'] || '').trim())).filter(Boolean)).sort()

  // Output rows aligned with UI schema
  const data = items
    .map((i, idx) => ({
      id: `csv-${idx}`,
      company: i.company,
      country: i.country,
      location: i.country,
      process: i.process,
      material: i.material,
      specificMaterial: '',
      quantity: i.quantity,
      price: i.price,
      leadTime: i.leadTime,
      pricePerUnit: i.quantity > 0 ? i.price / i.quantity : i.price,
      notes: null,
    }))
    .sort((a, b) => (a.price || 0) - (b.price || 0))

  return {
    data,
    statistics,
    filters: {
      processes,
      materials,
      quantities,
      countries,
    },
    metadata: {
      totalProviders: new Set(data.map((d) => d.company)).size,
      totalQuotes: data.length,
      dataSource: 'csv-json',
    },
  }
}

// Heatmap — US states by company counts from AM companies in NA directory
export function getHeatmapCsv() {
  // The file uses semicolon separators; header includes 'Company' and 'State / province' and 'Country'
  const text = readTextFile('../AM companies in NA - Copy 4/Detailed companies-Table 1.csv')
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return []
  const header = lines[0].split(';').map((h) => h.trim().toLowerCase())
  const idxCompany = header.findIndex((h) => h === 'company' || h.includes('company'))
  const idxCountry = header.findIndex((h) => h === 'country' || h.includes('country'))
  const idxState = header.findIndex((h) => h.includes('state'))
  if (idxCompany < 0 || idxCountry < 0 || idxState < 0) return []

  const uniqCompanyState = new Set<string>()
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';')
    const company = (cols[idxCompany] || '').trim()
    const country = (cols[idxCountry] || '').trim()
    const state = (cols[idxState] || '').trim()
    if (!company || !country || !state) continue
    // Focus on United States for state-level heatmap
    if (country !== 'United States' && country !== 'U.S.' && country !== 'US') continue
    uniqCompanyState.add(`${state}||United States||${company}`)
  }

  const stateCounts = new Map<string, number>()
  for (const key of uniqCompanyState) {
    const [state] = key.split('||')
    stateCounts.set(state, (stateCounts.get(state) || 0) + 1)
  }

  const out = Array.from(stateCounts.entries()).map(([state, companies]) => ({
    state,
    country: 'United States',
    company_count: companies,
    total_machines: 0,
  }))
  return out
}

// Directory — normalized companies list from CSV/JSON sources
export type CsvDirectoryItem = {
  id: string
  name: string
  website: string | null
  city: string | null
  state: string | null
  country: string | null
  company_type: string | null
  categories: string[]
  funding: { rounds: number; totalMillions: number; lastYear: number | null }
}

function slugifyId(name: string): string {
  return 'csv-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function inferCompanyType(categories: string[]): string | null {
  if (!categories || categories.length === 0) return null
  const cats = categories.map((c) => normKey(c))
  // Priority: equipment > service > material > software > other
  if (cats.some((c) => c.includes('printer') || c.includes('system'))) return 'equipment'
  if (cats.some((c) => c.includes('printing service') || c === 'printing services')) return 'service'
  if (cats.some((c) => c.includes('material'))) return 'material'
  if (cats.some((c) => c.includes('software'))) return 'software'
  return 'other'
}

let cachedDirectory: CacheEntry<CsvDirectoryItem[]> | null = null

export function getDirectoryCompaniesCsv(): CsvDirectoryItem[] {
  const now = Date.now()
  if (cachedDirectory && now - cachedDirectory.ts < TTL_MS) return cachedDirectory.data

  // Load sources
  const info = readJsonFile<CompanyInfoRow[]>('Company_information.json')
  const roles = readJsonFile<CompanyRoleRow[]>('Company_roles.json')
  const investments = readJsonFile<InvestmentRow[]>('Fundings_and_investments.json')

  // NA detailed companies for state/country enrichment
  let naLines: string[] = []
  try {
    const naText = readTextFile('../AM companies in NA - Copy 4/Detailed companies-Table 1.csv')
    naLines = naText.split(/\r?\n/).filter((l) => l.trim().length > 0)
  } catch {}

  const naIndex = (() => {
    if (naLines.length === 0) return { byName: new Map<string, { city?: string; state?: string; country?: string }>() }
    const header = naLines[0].split(';').map((h) => h.trim().toLowerCase())
    const idxCompany = header.findIndex((h) => h.includes('company'))
    const idxCountry = header.findIndex((h) => h.includes('country'))
    const idxState = header.findIndex((h) => h.includes('state'))
    const idxCity = header.findIndex((h) => h.includes('city'))
    const byName = new Map<string, { city?: string; state?: string; country?: string }>()
    for (let i = 1; i < naLines.length; i++) {
      const cols = naLines[i].split(';')
      const name = (cols[idxCompany] || '').trim()
      if (!name) continue
      const city = idxCity >= 0 ? (cols[idxCity] || '').trim() : ''
      const state = idxState >= 0 ? (cols[idxState] || '').trim() : ''
      const country = idxCountry >= 0 ? normCountry((cols[idxCountry] || '').trim()) : ''
      if (!byName.has(name)) byName.set(name, { city, state, country })
    }
    return { byName }
  })()

  // Build categories per company
  const categoriesByCompany = new Map<string, string[]>()
  for (const r of roles || []) {
    const name = String(r['Company name'] || '').trim()
    const cat = String(r['Category'] || '').trim()
    if (!name || !cat) continue
    const arr = categoriesByCompany.get(name) || []
    if (!arr.includes(cat)) arr.push(cat)
    categoriesByCompany.set(name, arr)
  }

  // Funding aggregates per company
  const fundingByCompany = new Map<string, { rounds: number; totalMillions: number; lastYear: number | null }>()
  for (const r of investments || []) {
    const name = String(r['Company name'] || '').trim()
    if (!name) continue
    const amount = toNumber(r['Amount (in millions USD)'])
    const year = r['Year'] != null ? Number(r['Year']) : null
    const agg = fundingByCompany.get(name) || { rounds: 0, totalMillions: 0, lastYear: null }
    agg.rounds += 1
    agg.totalMillions += Number.isFinite(amount) ? amount : 0
    if (year != null && (agg.lastYear == null || year > agg.lastYear)) agg.lastYear = year
    fundingByCompany.set(name, agg)
  }

  // Compose directory items from union of names in info, roles, investments, and NA data
  const nameSet = new Set<string>()
  for (const r of info || []) nameSet.add(String(r['Company name'] || '').trim())
  for (const r of roles || []) nameSet.add(String(r['Company name'] || '').trim())
  for (const r of investments || []) nameSet.add(String(r['Company name'] || '').trim())
  for (const n of naIndex.byName.keys()) nameSet.add(n)

  const items: CsvDirectoryItem[] = []
  for (const name of Array.from(nameSet)) {
    if (!name) continue
    const inf = (info || []).find((r) => String(r['Company name'] || '').trim() === name) || {}
    const web = inf['Website'] ? String(inf['Website']).trim() : null
    // Headquarters may be country or city+country; use NA override when present
    let country: string | null = inf['Headquarters'] ? normCountry(String(inf['Headquarters']).trim()) : null
    let state: string | null = null
    let city: string | null = null
    const na = naIndex.byName.get(name)
    if (na) {
      if (na.country) country = normCountry(na.country)
      if (na.state) state = na.state
      if (na.city) city = na.city
    }
    const categories = categoriesByCompany.get(name) || []
    const company_type = inferCompanyType(categories)
    const funding = fundingByCompany.get(name) || { rounds: 0, totalMillions: 0, lastYear: null }

    items.push({
      id: slugifyId(name),
      name,
      website: web,
      city,
      state,
      country,
      company_type,
      categories,
      funding,
    })
  }

  const deduped = items.filter((x) => x.name && x.name !== '-')
  cachedDirectory = { ts: now, data: deduped }
  return deduped
}

// Catalog — technologies and materials for lookup/catalog API
export function getCatalogCsv() {
  try {
    const pricingData = readJsonFile<PricingDataRow[]>('Print_services_Pricing_data.json')
    
    // Extract unique processes (technologies) with simple categorization
    const technologiesSet = new Set<string>()
    const materialsSet = new Set<string>()
    
    for (const row of pricingData || []) {
      const process = String(row['Process'] || '').trim()
      const material = String(row['Material type'] || row['Material'] || '').trim()
      
      if (process) technologiesSet.add(process)
      if (material) materialsSet.add(material)
    }
    
    // Convert to arrays with IDs and categories
    const technologies = Array.from(technologiesSet)
      .sort()
      .map((name, index) => ({
        id: `csv-tech-${index + 1}`,
        name,
        category: categorizeTechnology(name),
      }))
    
    const materials = Array.from(materialsSet)
      .sort()
      .map((name, index) => ({
        id: `csv-mat-${index + 1}`,
        name,
        category: categorizeMaterial(name),
      }))
    
    return {
      technologies,
      materials,
    }
  } catch (error) {
    console.error('Error reading catalog data from CSV:', error)
    return {
      technologies: [],
      materials: [],
    }
  }
}

function categorizeTechnology(process: string): string | null {
  const p = process.toLowerCase()
  if (p.includes('pbf') || p.includes('sls') || p.includes('powder bed')) return 'Powder Bed Fusion'
  if (p.includes('mex') || p.includes('fdm') || p.includes('fff')) return 'Material Extrusion'
  if (p.includes('vpp') || p.includes('sla') || p.includes('dlp')) return 'Vat Photopolymerization'
  if (p.includes('bjt') || p.includes('binder')) return 'Binder Jetting'
  if (p.includes('am-lwc') || p.includes('directed energy')) return 'Directed Energy Deposition'
  return 'Other'
}

function categorizeMaterial(material: string): string | null {
  const m = material.toLowerCase()
  if (m.includes('pla') || m.includes('abs') || m.includes('petg') || m.includes('nylon') || m.includes('pc') || m.includes('asa') || m.includes('tpu')) return 'Plastics'
  if (m.includes('steel') || m.includes('aluminum') || m.includes('titanium') || m.includes('bronze') || m.includes('brass') || m.includes('316l') || m.includes('inconel')) return 'Metals'
  if (m.includes('resin') || m.includes('photopolymer')) return 'Resins'
  if (m.includes('ceramic') || m.includes('sand')) return 'Ceramics'
  if (m.includes('carbon') || m.includes('glass') || m.includes('kevlar')) return 'Composites'
  return 'Other'
}
