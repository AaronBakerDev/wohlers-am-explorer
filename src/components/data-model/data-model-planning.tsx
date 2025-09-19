'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const sourceWorkbooks = [
  {
    title: 'FINAL_Company_data (1).xlsx',
    highlights: [
      '6,995 companies, 1,048,543 role rows, 7,853 location aliases',
      '4,396 July–September 2025 service quotes with lead times (requires outlier review)',
      '2,652 material price points (31 Mar 2023–15 Sep 2025) and 1,173 revenue records (FY 2019–FY 2025)'
    ]
  },
  {
    title: 'FINAL_Market_data (1).xlsx',
    highlights: [
      '2024 country × segment revenue table (~$21.9B USD total) for 11 countries and 4 segments',
      'Forecasts through 2034 across low/average/high scenarios with segment detail',
      '413 funding events for venture/M&A dashboards'
    ]
  },
  {
    title: 'Process_and_Documentation (1).xlsx',
    highlights: [
      'Workbook schema map aligning each sheet to the vendor staging tables',
      'Field-level data types (enum, decimal, FK) for ingestion validation',
      'Initial ownership of contact, revenue, trade, and system sales sheets'
    ]
  },
  {
    title: 'Trade data (1).xlsx',
    highlights: [
      '69,771 customs records (HS 848520/848580) covering 2022–2025',
      'Reporter/partner country breakdown with import/export value + unit mix',
      'Requires FX normalization and HS code mapping to internal categories'
    ]
  }
]

const stagingTracks = [
  {
    heading: 'Core Company Backbone',
    bullets: [
      '`vendor_company_information`, `vendor_company_roles`, `vendor_company_locations` feed `companies`, `company_categories`.',
      'Deduplicate using `CompanyID` and `AlternateID`; enforce country + name uniqueness.',
      'Align contact + employee snapshots for account health (contact cadence, headcount trends).'
    ]
  },
  {
    heading: 'Rates & Pricing',
    bullets: [
      'Service pricing → `service_pricing` with lead-time sanity filters (flag <0 or >120 days).',
      'Material pricing → extend `pricing_benchmarks` with `Form`, `MaterialClass`, `PriceUSD`.',
      'System sales volumes → connect to pricing analytics for cost-per-unit KPIs.'
    ]
  },
  {
    heading: 'Financial & Market Intelligence',
    bullets: [
      'Company revenue (FY 2019–2025) → `market_data` revenue facts + company financial snapshots.',
      'Market forecasts → `market_forecasts` + derived views (`market_totals`, `market_summary`).',
      'Funding/M&A feeds → `investments`, `mergers_acquisitions`, cross-check with company table IDs.'
    ]
  },
  {
    heading: 'Trade Pipeline',
    bullets: [
      'Normalize HS codes and map to internal technology/material segments.',
      'Apply FX conversion before storing USD values; retain native currency for audits.',
      'Define aggregation views for quarterly import/export trends by reporter/partner.'
    ]
  }
]

const milestoneColumns = [
  {
    label: 'Week of 22 Sep 2025',
    items: [
      'Finalize vendor table naming + Supabase schema alignment.',
      'Backfill FX table for 2020–2025 and plug into revenue/trade loaders.',
      'Identify data quality rules (lead times, negative prices, duplicate HS records).'
    ]
  },
  {
    label: 'Week of 29 Sep 2025',
    items: [
      'Implement staging → production ETL scripts for companies and pricing.',
      'Publish dashboard-ready views for service pricing + material pricing.',
      'Validate market forecasts against 2024 revenue baselines (consistency checks).'
    ]
  },
  {
    label: 'Week of 6 Oct 2025',
    items: [
      'Integrate trade dataset into analytics summary API.',
      'Run QA pass on financial metrics (currency reconciliation, period coverage).',
      'Document consumer API contracts for new rate endpoints.'
    ]
  }
]

const relationshipNotes = [
  {
    title: 'FX Normalization',
    details: [
      'Join `vendor_currency_conversion_rates` on `NativeCurrency = XtoUSD` and year prior to load.',
      'Store both native and USD columns for auditability and historical reprocessing.',
      'Expose conversion factors to analytics to support what-if currency scenarios.'
    ]
  },
  {
    title: 'Pricing ↔ Companies',
    details: [
      'Enforce `CompanyID` foreign keys before inserting into `service_pricing`.',
      'Map process names to `technologies` to keep filters aligned across UI.',
      'Material taxonomy should leverage `materials` + `material_category` enums.'
    ]
  },
  {
    title: 'Market ↔ Trade Context',
    details: [
      'Link HS codes to market segments to explain revenue vs. trade movements.',
      'Use reporter/partner dimensions to feed regional dashboards.',
      'Schedule reconciliations when market totals shift outside historical variance bands.'
    ]
  }
]

export function DataModelPlanning() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Data Planning Overview</CardTitle>
          <CardDescription>
            Snapshot for the September 2025 data refresh. Use this as the canonical outline while pipelines and
            documentation are formalized.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Primary Workbooks</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {sourceWorkbooks.map((workbook) => (
                <div key={workbook.title} className="rounded-lg border bg-muted/30 p-4">
                  <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                    {workbook.title}
                  </h4>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed">
                    {workbook.highlights.map((highlight) => (
                      <li key={highlight}>- {highlight}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Staging Tracks</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {stagingTracks.map((track) => (
                <div key={track.heading} className="rounded-lg border p-4 shadow-sm">
                  <h4 className="font-semibold">{track.heading}</h4>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed">
                    {track.bullets.map((bullet) => (
                      <li key={bullet}>- {bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Milestones & Deliverables</CardTitle>
          <CardDescription>
            Upcoming three-week plan; adjust as loaders stabilize and QA findings emerge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={milestoneColumns[0]?.label ?? ''} className="space-y-4">
            <TabsList className="flex flex-wrap gap-2">
              {milestoneColumns.map((column) => (
                <TabsTrigger key={column.label} value={column.label} className="px-3 py-1">
                  {column.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {milestoneColumns.map((column) => (
              <TabsContent key={column.label} value={column.label} className="space-y-3">
                <ul className="space-y-2 text-sm leading-relaxed">
                  {column.items.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Relationship Notes</CardTitle>
          <CardDescription>
            Guardrails to keep pricing, financial, and trade datasets aligned with the production schema.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {relationshipNotes.map((note) => (
            <div key={note.title} className="rounded-lg border bg-muted/20 p-4">
              <h4 className="text-base font-semibold">{note.title}</h4>
              <ul className="mt-2 space-y-2 text-sm leading-relaxed">
                {note.details.map((detail) => (
                  <li key={detail}>- {detail}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
