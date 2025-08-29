import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

type Row = {
  company: string
  country: string
  processes: string[]
  materials: string[]
  website?: string | null
}

function readData(): Row[] {
  const p = path.join(process.cwd(), 'public', 'data', 'system-manufacturers.json')
  try {
    const text = fs.readFileSync(p, 'utf8')
    return JSON.parse(text) as Row[]
  } catch (_e) {
    return []
  }
}

function parseMulti(value: string | null): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') || '').toLowerCase()
  const countries = parseMulti(url.searchParams.get('country')).map((v) => v.toLowerCase())
  const processes = parseMulti(url.searchParams.get('process')).map((v) => v.toLowerCase())
  const materials = parseMulti(url.searchParams.get('material')).map((v) => v.toLowerCase())

  const data = readData()

  const filtered = data.filter((row) => {
    if (q) {
      const hay = `${row.company} ${row.country}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (countries.length > 0) {
      if (!countries.includes((row.country || '').toLowerCase())) return false
    }
    if (processes.length > 0) {
      const rowProcs = (row.processes || []).map((p) => p.toLowerCase())
      if (!processes.some((p) => rowProcs.includes(p))) return false
    }
    if (materials.length > 0) {
      const rowMats = (row.materials || []).map((m) => m.toLowerCase())
      if (!materials.some((m) => rowMats.includes(m))) return false
    }
    return true
  })

  return NextResponse.json({ data: filtered })
}
export const dynamic = 'force-dynamic'
