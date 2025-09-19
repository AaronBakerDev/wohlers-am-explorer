import type { Metadata } from 'next'
import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { DataModelExplorer } from '@/components/data-model/data-model-explorer'
import { DataModelPlanning } from '@/components/data-model/data-model-planning'
import {
  betaWorkbook,
  betaSheets,
  betaRelationships,
  betaDataTypes
} from '@/components/data-model/beta-workbook'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Data Planning Hub | Wohlers AM Explorer',
  description:
    'Process & Documentation (Beta) workbook, relationships, content types, and interactive explorer for the Wohlers AM unified data model.'
}

export default function DataPlanningHubPage() {
  const groupedDataTypes = useMemo(() => {
    const grouping = new Map<string, { field: string; dataType: string }[]>()
    for (const entry of betaDataTypes) {
      if (!grouping.has(entry.table)) {
        grouping.set(entry.table, [])
      }
      grouping.get(entry.table)!.push({ field: entry.field, dataType: entry.dataType })
    }
    return Array.from(grouping.entries()).map(([table, rows]) => ({ table, rows }))
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-[1400px] space-y-8 px-4 py-8">
        <div className="space-y-4">
          <Link
            href="/components-test"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Planning Index
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-balance">
            <h1 className="text-4xl font-bold tracking-tight">Data Planning &amp; Schema Explorer</h1>
            <Badge variant="secondary" className="uppercase">Beta Refresh</Badge>
          </div>
          <p className="text-lg text-muted-foreground">
            Centralized workspace for the September 2025 schema refresh: review the Process &amp; Documentation (Beta)
            workbook, inspect table relationships, browse field-level content types, and explore the interactive data
            model. Use this page as the living source for planning, onboarding, and future migrations.
          </p>
          <div>
            <Link href="/components-test/data-model/documentation">
              <Button>Read Full Data Model Documentation</Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{betaWorkbook.displayName}</CardTitle>
            <CardDescription>{betaWorkbook.summary}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono text-[11px]">{betaWorkbook.path}</Badge>
                <Badge variant="secondary" className="text-[11px]">{betaWorkbook.sheetCount} sheets</Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{betaWorkbook.notes}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {betaSheets.map((sheet) => (
                  <div key={sheet.name} className="rounded-lg border bg-muted/20 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{sheet.name}</p>
                      <Badge variant="secondary" className="text-[11px]">{sheet.rows.toLocaleString()} rows</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{sheet.purpose}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Rows: {sheet.rows.toLocaleString()} · Columns: {sheet.columns}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">How To Use</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="rounded-lg border border-dashed border-muted-foreground/30 p-3">
                  Align ingestion scripts with the <span className="font-medium">Data types</span> sheet before staging data.
                </li>
                <li className="rounded-lg border border-dashed border-muted-foreground/30 p-3">
                  Reconcile aliases using <span className="font-medium">Company_mapping_onetomany</span> prior to dedupe jobs.
                </li>
                <li className="rounded-lg border border-dashed border-muted-foreground/30 p-3">
                  Use the relationship map below to prioritize QA and API contract updates.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workbook Relationships</CardTitle>
            <CardDescription>
              How the Beta workbook connects company master data to pricing, revenue, and trade facts.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Source Table</TableHead>
                  <TableHead className="whitespace-nowrap">Target Table</TableHead>
                  <TableHead className="whitespace-nowrap">Join Keys</TableHead>
                  <TableHead className="whitespace-nowrap">Cardinality</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {betaRelationships.map((relationship) => (
                  <TableRow key={`${relationship.source}-${relationship.target}`}>
                    <TableCell className="font-medium whitespace-nowrap">{relationship.source}</TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{relationship.target}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{relationship.join}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{relationship.cardinality}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{relationship.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Field Content Types</CardTitle>
            <CardDescription>
              Direct transcription of the Beta workbook’s <code>Data types</code> sheet so every downstream team references the same content contract.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupedDataTypes.map((group) => (
              <div key={group.table} className="rounded-lg border bg-muted/10 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{group.table}</h3>
                  <Badge variant="outline" className="text-[11px]">{group.rows.length} fields</Badge>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Field</TableHead>
                        <TableHead>Content Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.rows.map((row) => (
                        <TableRow key={`${group.table}-${row.field}`}>
                          <TableCell className="font-medium whitespace-nowrap text-sm">{row.field}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{row.dataType}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Planning Timeline</CardTitle>
            <CardDescription>
              Staging priorities, milestones, and guardrails aligned with the Beta workbook rollout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataModelPlanning />
          </CardContent>
        </Card>

        <DataModelExplorer />
      </div>
    </div>
  )
}
