"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts"

type CountriesResponse = {
  data: Array<{ country: string; segment: string; value: number; year: number }>
  summary: {
    year: number
    totalValue: number
    totalCountries: number
    totalSegments: number
    topCountries: Array<{ country: string; value: number; percentage: string }>
    bySegment: Array<{ segment: string; value: number; countries: number }>
  }
  filters: { availableCountries: string[]; availableSegments: string[] }
}

export function MarketCountriesChart({ defaultYear = 2024 }: { defaultYear?: number }) {
  const [year, setYear] = useState<string>(String(defaultYear))
  const [segment, setSegment] = useState<string>("all")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payload, setPayload] = useState<CountriesResponse | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (year) params.set("year", year)
      if (segment && segment !== "all") params.set("segment", segment)
      const res = await fetch(`/api/market/countries?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as CountriesResponse
      setPayload(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load country data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, segment])

  const topCountries = payload?.summary?.topCountries ?? []
  const segments = payload?.filters?.availableSegments ?? []

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Revenue by Country (Top 10)</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={segment} onValueChange={setSegment}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Segment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Segments</SelectItem>
              {segments.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2023, 2022, 2021, 2020].map((y) => (
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
              <BarChart data={topCountries as any}>
                <XAxis dataKey="country" stroke="currentColor" interval={0} angle={-30} textAnchor="end" height={80} />
                <YAxis stroke="currentColor" tickFormatter={(v) => `$${Math.round(Number(v) / 1_000_000)}M`} />
                <Tooltip formatter={(v: any) => `$${(Number(v) / 1_000_000).toFixed(1)}M`} />
                <Legend />
                <Bar dataKey="value" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

