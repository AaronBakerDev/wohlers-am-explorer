import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  betaWorkbook,
  betaSheets,
  betaRelationships,
  betaDataTypes
} from '@/components/data-model/beta-workbook'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Data Model Documentation | Wohlers AM Explorer',
  description:
    'Narrative documentation describing the current production data model, the Beta Excel-driven schema, and the migration plan to reach the new structure.'
}

const groupedTypes = betaDataTypes.reduce<Record<string, { field: string; dataType: string }[]>>((acc, row) => {
  if (!acc[row.table]) {
    acc[row.table] = []
  }
  acc[row.table].push({ field: row.field, dataType: row.dataType })
  return acc
}, {})

export default function DataModelDocumentationPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl space-y-8 px-4 py-8">
        <div className="space-y-4">
          <Link
            href="/components-test/data-model"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Data Planning Hub
          </Link>
          <div className="space-y-2 text-balance">
            <h1 className="text-4xl font-bold tracking-tight">Data Model Documentation</h1>
            <p className="text-lg text-muted-foreground">
              This document explains where the product’s data model stands today, details the Process &amp; Documentation (Beta)
              workbook foundation, and outlines the migration path to the refreshed schema. Use it as the canonical
              reference while the new tables are implemented.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Current Production Footprint</CardTitle>
            <CardDescription>
              A written snapshot of what stays, what goes, and why.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              We will <span className="font-medium text-foreground">retain the authentication and personalization tables</span>
              that keep users logged in and their experiences tailored. Specifically, <code>auth.users</code>,
              <code>auth.identities</code>, <code>public.profiles</code>, <code>public.user_preferences</code>, and
              <code>public.saved_searches</code> remain untouched. These tables are orthogonal to the business datasets and
              allow us to upgrade the rest of the model without disturbing customer state.
            </p>
            <p>
              In addition, <code>public.dataset_configs_unified</code> and similar feature-configuration tables stay in place;
              we will update the values they reference once the new schema is live, but the structures themselves are stable.
            </p>
            <p>
              Everything else that serves business content—legacy <code>companies</code>, <code>equipment</code>,
              <code>market_data</code>, <code>service_pricing</code>, all <code>vendor_*</code> staging tables, and their
              supporting views—should be treated as <span className="font-medium text-foreground">temporary scaffolding</span>.
              Their responsibilities migrate to the workbook-driven schema described below. We will keep them only long enough
              to run side-by-side comparisons during the cutover phase.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Beta Workbook Overview</CardTitle>
            <CardDescription>
              The Excel source of truth (<code>{betaWorkbook.path}</code>) defines the target schema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              {betaWorkbook.summary}
            </p>
            <p>
              The workbook currently contains <strong>{betaWorkbook.sheetCount} sheets</strong>. Highlights:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              {betaSheets.map((sheet) => (
                <li key={sheet.name}>
                  <span className="font-medium text-foreground">{sheet.name}</span>: {sheet.purpose} (≈
                  {sheet.rows.toLocaleString()} rows, {sheet.columns} columns).
                </li>
              ))}
            </ul>
            <p>
              Treat these descriptions as the contractual schema. Every loader, migration, and downstream query should align
              with the columns and content types implied by the workbook.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Data Model Relationships</CardTitle>
            <CardDescription>
              Narrative view of how the new tables connect.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            {betaRelationships.map((relationship) => (
              <p key={`${relationship.source}-${relationship.target}`}>
                <span className="font-medium text-foreground">{relationship.source}</span> →
                <span className="font-medium text-foreground"> {relationship.target}</span> ({relationship.cardinality}) via
                <span className="font-medium text-foreground"> {relationship.join}</span>. {relationship.notes}
              </p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Field Content Types (Inferred)</CardTitle>
            <CardDescription>
              Plain-language summary of the data types we should enforce in Supabase.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-sm leading-relaxed text-muted-foreground">
            {Object.entries(groupedTypes).map(([table, rows]) => (
              <div key={table} className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{table}</h3>
                <ul className="list-disc space-y-1 pl-5">
                  {rows.map((row) => (
                    <li key={`${table}-${row.field}`}>
                      <span className="font-medium text-foreground">{row.field}</span>: {row.dataType}.
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Migration Plan</CardTitle>
            <CardDescription>
              Recommended phases to transition from legacy business tables to the Beta-aligned structure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <ol className="list-decimal space-y-3 pl-4">
              <li>
                <span className="font-medium text-foreground">Define target schema:</span> translate each Beta sheet into SQL DDL,
                including enums, primary keys, foreign keys, and indexes.
              </li>
              <li>
                <span className="font-medium text-foreground">Stage and validate:</span> load Excel data into new staging tables;
                enforce types from the `Data types` sheet and surface quality issues (e.g., lead-time outliers).
              </li>
              <li>
                <span className="font-medium text-foreground">Map legacy data:</span> migrate any irreplaceable historical facts or
                archive the old tables if a clean break is acceptable.
              </li>
              <li>
                <span className="font-medium text-foreground">Refactor application layers:</span> update Supabase queries, API routes,
                and UI components to consume the new tables.
              </li>
              <li>
                <span className="font-medium text-foreground">Cutover and retire:</span> run parallel read checks, switch endpoints to
                the new schema, and decommission the legacy tables once validated.
              </li>
            </ol>
            <p>
              Document every assumption in Git alongside the migrations so future refreshes follow the same path. Keep the
              Beta workbook updated whenever new sheets or fields are introduced.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
