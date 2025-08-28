"use client"

import { useEffect, useState } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react"

type HealthCheck = {
  ok: boolean
  data?: any
  error?: string
}

type HealthResponse = {
  ok: boolean
  checks: Record<string, HealthCheck>
}

export default function DataHealthWidget() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/market/health', { cache: 'no-store' })
      if (!res.ok) throw new Error(`Health request failed (${res.status})`)
      setHealth(await res.json())
    } catch (e: any) {
      setError(e?.message || 'Failed to load health')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const overallOk = health?.ok ?? false

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {overallOk ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <XCircle className="h-5 w-5 text-destructive" />
          )}
          <h2 className="text-lg font-medium text-foreground">Data Health</h2>
          <Badge variant={overallOk ? 'default' : 'destructive'} className="ml-1">
            {overallOk ? 'OK' : 'Attention'}
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="text-sm text-destructive mb-3">{error}</div>
      )}

      {/* Checks list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {health && Object.entries(health.checks).map(([name, chk]) => (
          <div key={name} className="border border-border rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {chk.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <div className="text-sm font-medium text-foreground">
                  {toTitle(name)}
                </div>
              </div>
              <Badge variant={chk.ok ? 'outline' : 'destructive'} className="text-xs">
                {chk.ok ? 'pass' : 'fail'}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              {renderCheckSummary(name, chk)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function toTitle(s: string) {
  return s
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function renderCheckSummary(name: string, chk: HealthCheck) {
  if (!chk.ok) return <div className="text-destructive">{chk.error || 'Unknown error'}</div>
  const d = chk.data || {}
  switch (name) {
    case 'files':
      return (
        <div>
          <div>Root: <code className="text-foreground/80">{d.root}</code></div>
          <div className="mt-1">Files: {Array.isArray(d.present) && d.present.map((f: any) => (
            <span key={f.file} className={`inline-block text-[11px] mr-2 ${f.exists ? 'text-emerald-600' : 'text-destructive'}`}>
              {f.exists ? '✓' : '✗'} {f.file}
            </span>
          ))}</div>
        </div>
      )
    case 'market_totals':
      return (
        <div>
          <div>Rows: {d.rows}</div>
          {d.yearRange && (
            <div>Years: {String(d.yearRange.min)}–{String(d.yearRange.max)}</div>
          )}
          {Array.isArray(d.segments) && (
            <div>Segments: {d.segments.slice(0, 6).join(', ')}{d.segments.length > 6 ? '…' : ''}</div>
          )}
        </div>
      )
    case 'market_by_country_segment':
      return (
        <div>
          <div>Rows: {d.rows}</div>
          {d.latestYear && <div>Latest Year: {d.latestYear}</div>}
          {Array.isArray(d.countries) && <div>Countries: {d.countries.length}</div>}
          {Array.isArray(d.segments) && <div>Segments: {d.segments.length}</div>}
        </div>
      )
    case 'pricing':
      return (
        <div>
          <div>Quotes: {d.quotes ?? 0}</div>
          {d.benchmarks != null && <div>Benchmarks: {d.benchmarks}</div>}
        </div>
      )
    case 'companies':
      return (
        <div>
          <div>Total: {d.total ?? 0}</div>
          <div>Geocoded: {d.geocoded ?? 0}</div>
        </div>
      )
    case 'equipment':
    case 'company_summaries':
      return <div>Total: {d.total ?? 0}</div>
    default:
      return <pre className="text-[11px] whitespace-pre-wrap">{JSON.stringify(d, null, 2)}</pre>
  }
}

