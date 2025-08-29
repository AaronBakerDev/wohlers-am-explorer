"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts"

type TotalsResponse = {
  data: Array<Record<string, number | string>>
  segments: string[]
  metadata: { totalRecords: number; yearRange: { min: number; max: number } }
}

export function MarketTotalsChart() {
  const [yearStart, setYearStart] = useState<string>("")
  const [yearEnd, setYearEnd] = useState<string>("")
  // Multi-select support: maintain a set of selected segments
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payload, setPayload] = useState<TotalsResponse | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (yearStart && yearEnd) {
        params.set("startYear", yearStart)
        params.set("endYear", yearEnd)
      }
      // Always fetch all segments; client handles filtering for multi-select
      const res = await fetch(`/api/market/totals?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as TotalsResponse
      setPayload(json)
      if (!yearStart || !yearEnd) {
        const min = json?.metadata?.yearRange?.min
        const max = json?.metadata?.yearRange?.max
        if (min && max) {
          setYearStart(String(min))
          setYearEnd(String(max))
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load totals")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Reload when filters change (debounce not needed initially)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearStart, yearEnd])

  const chartData = payload?.data ?? []
  const segments = (payload?.segments ?? []).filter((s) => s && s.toLowerCase() !== "total")

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#FFC658",
    "#FF7C7C",
  ]

  const years = useMemo(() => {
    const min = payload?.metadata?.yearRange?.min
    const max = payload?.metadata?.yearRange?.max
    if (!min || !max) return [] as number[]
    const out: number[] = []
    for (let y = min; y <= max; y++) out.push(y)
    return out
  }, [payload])

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>AM Market Size by Segment</CardTitle>
        <div className="flex items-center gap-3">
          {/* Segment filters: quick multi-select checkboxes */}
          <div className="hidden md:flex items-center gap-2">
            {/* "All" toggle */}
            <button
              className={`text-xs px-2 py-1 rounded border ${
                selected.size === 0 || selected.size === segments.length
                  ? "border-primary text-primary bg-primary/5"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setSelected(new Set())}
              title="Show all segments"
            >
              All
            </button>
            {segments.map((s) => {
              const isOn = selected.size === 0 || selected.has(s)
              return (
                <button
                  key={s}
                  className={`text-xs px-2 py-1 rounded border ${
                    isOn
                      ? "border-primary text-primary bg-primary/5"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => {
                    setSelected((prev) => {
                      const next = new Set(prev)
                      if (prev.size === 0) {
                        // when "All" state active, start from only this one
                        next.add(s)
                      } else if (next.has(s)) {
                        next.delete(s)
                      } else {
                        next.add(s)
                      }
                      // If all selected, collapse back to "All" state for clarity
                      if (next.size === segments.length) return new Set()
                      return next
                    })
                  }}
                >
                  {s}
                </button>
              )
            })}
          </div>
          <Select value={yearStart} onValueChange={setYearStart}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Start" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={yearEnd} onValueChange={setYearEnd}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="End" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData as any}>
                <XAxis dataKey="year" stroke="currentColor" />
                <YAxis stroke="currentColor" tickFormatter={(v) => `$${Math.round(Number(v) / 1_000_000)}M`} />
                <Tooltip formatter={(v: any) => `$${(Number(v) / 1_000_000).toFixed(1)}M`} />
                <Legend />
                {(selected.size === 0 ? segments : segments.filter((s) => selected.has(s))).map((s, i) => (
                  <Bar key={s} dataKey={s} stackId="a" fill={COLORS[i % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
