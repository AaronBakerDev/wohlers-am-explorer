#!/usr/bin/env node
/**
 * Generate SQL seed statements for unified market aggregate tables
 * using the provided vendor data files in docs/project-documents/04-data/market-data.
 *
 * - Outputs INSERT statements for:
 *   - market_totals(year, segment, total_value)
 *   - market_by_country_segment(year, country, segment, value)
 *
 * Usage:
 *   node scripts/generate-market-aggregates-sql.mjs > market-aggregates.sql
 *   # Review the SQL and run it against your database.
 */

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const DATA_DIR = path.join(
  ROOT,
  'docs/project-documents/04-data/market-data'
)

function readJson(file) {
  const p = path.join(DATA_DIR, file)
  const raw = fs.readFileSync(p, 'utf-8')
  return JSON.parse(raw)
}

// 1) market_totals from Total_AM_market_size.json
function generateMarketTotals() {
  const rows = readJson('Total_AM_market_size.json')
  const out = []

  // We include segment-level rows, exclude the synthetic 'Total' segment to avoid double counting
  for (const r of rows) {
    const year = Number(r['Year'])
    const type = String(r['Type'] || '').trim()
    const segment = String(r['Segment'] || '').trim()
    const value = Number(r[' Past revenue (USD) '])
    if (!year || !segment || Number.isNaN(value)) continue
    if (segment.toLowerCase() === 'total') continue

    // For forecast years (>= 2025), use the Average forecast by default
    if (year >= 2025 && type !== 'Average forecast') continue
    // For historical years (<= 2024), use Past revenue rows
    if (year <= 2024 && type !== 'Past revenue') continue

    out.push({ year, segment, value })
  }

  // Build SQL
  const values = out
    .map(({ year, segment, value }) => `(${year}, '${segment.replace(/'/g, "''")}', ${Math.round(value)})`)
    .join(',\n')

  return `-- Seed market_totals from Total_AM_market_size.json\nINSERT INTO market_totals (year, segment, total_value)\nVALUES\n${values};\n`
}

// 2) market_by_country_segment from AM_market_revenue_2024.json
function generateMarketByCountrySegment() {
  const rows = readJson('AM_market_revenue_2024.json')
  const out = []
  for (const r of rows) {
    const country = String(r['Country'] || '').trim()
    const segment = String(r['Segment'] || '').trim()
    const revenue = Number(r[' Revenue (USD) '])
    if (!country || !segment || Number.isNaN(revenue)) continue
    out.push({ year: 2024, country, segment, value: Math.round(revenue) })
  }

  const values = out
    .map(({ year, country, segment, value }) => `(${year}, '${country.replace(/'/g, "''")}', '${segment.replace(/'/g, "''")}', ${value})`)
    .join(',\n')

  return `-- Seed market_by_country_segment from AM_market_revenue_2024.json\nINSERT INTO market_by_country_segment (year, country, segment, value)\nVALUES\n${values};\n`
}

function main() {
  const parts = []
  parts.push('-- Auto-generated SQL for market aggregate tables')
  parts.push('BEGIN;')
  parts.push(generateMarketTotals())
  parts.push(generateMarketByCountrySegment())
  parts.push('COMMIT;')
  process.stdout.write(parts.join('\n'))
}

main()

