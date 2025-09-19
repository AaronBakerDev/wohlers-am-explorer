'use client'

import { useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChartExportButton } from '@/components/ChartExportButton'
import { SubscriptionModal } from '@/components/subscription-modal'
import { WohlersLogo } from '@/components/wohlers-logo'

interface SpecializedComponent {
  title: string
  description: string
  badgeLabel: string
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
  render: () => ReactNode
}

export default function SpecializedComponentsPage() {
  const exportPreviewRef = useRef<HTMLDivElement | null>(null)
  const [subscriptionOpen, setSubscriptionOpen] = useState(false)

  const specializedComponents: SpecializedComponent[] = [
    {
      title: 'ChartExportButton',
      description: 'Exports any referenced chart or card to PNG with automatic filename handling.',
      badgeLabel: 'Export',
      render: () => (
        <div className="space-y-4">
          <div
            ref={exportPreviewRef}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Market Revenue Preview</p>
            <div className="mt-3 h-40 rounded-md bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5" aria-hidden="true" />
            <p className="mt-3 text-xs text-muted-foreground">
              Export button captures this element and downloads a themed PNG.
            </p>
          </div>
          <ChartExportButton
            targetRef={exportPreviewRef}
            filenameBase="market-revenue-preview"
            label="Export PNG"
          />
        </div>
      )
    },
    {
      title: 'SubscriptionModal',
      description: 'Upsell flow for unlocking premium datasets and analytics features.',
      badgeLabel: 'Commerce',
      badgeVariant: 'outline',
      render: () => (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Trigger the premium upsell modal as non-admin users navigate to restricted content.
          </p>
          <Button onClick={() => setSubscriptionOpen(true)}>Preview modal</Button>
          <SubscriptionModal open={subscriptionOpen} onOpenChange={setSubscriptionOpen} />
        </div>
      )
    },
    {
      title: 'WohlersLogo',
      description: 'Responsive SVG logomark that adapts to theme colors and container size.',
      badgeLabel: 'Branding',
      badgeVariant: 'secondary',
      render: () => (
        <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
          <WohlersLogo className="h-12 w-auto text-primary" />
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Vector-based rendering keeps the mark sharp on any display.</p>
            <p>Color inherits from the parent, enabling seamless dark-mode support.</p>
          </div>
        </div>
      )
    },
    {
      title: 'ReportPlaceholder',
      description: 'Content preview used for upcoming report modules across the dashboard.',
      badgeLabel: 'Content',
      badgeVariant: 'outline',
      render: () => (
        <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm text-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reports Module</p>
              <p className="text-sm font-medium text-foreground">AM Market Landscape 2025</p>
            </div>
            <Badge variant="secondary">Preview</Badge>
          </div>
          <p className="text-muted-foreground">
            Use the placeholder component to communicate roadmap items while still sharing key metrics and export hooks.
          </p>
          <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <div className="rounded-md border px-3 py-2">
              <p className="font-medium text-foreground">Datasets</p>
              <p>12 curated tables</p>
            </div>
            <div className="rounded-md border px-3 py-2">
              <p className="font-medium text-foreground">Exports</p>
              <p>CSV, Excel, PDF</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-fit">View placeholder</Button>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Link href="/components-test" className="mb-4 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Component Test
          </Link>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Specialized Components</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Domain-specific and utility components for premium workflows and exports.
          </p>
        </div>

        <div className="space-y-6">
          {specializedComponents.map((component) => (
            <Card key={component.title} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-xl">{component.title}</CardTitle>
                  <Badge variant={component.badgeVariant}>{component.badgeLabel}</Badge>
                </div>
                <CardDescription>{component.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {component.render()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 space-y-6">
          <div className="rounded-lg bg-muted/50 p-6">
            <h3 className="mb-4 text-lg font-semibold">Specialized Component Patterns</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-medium">Domain-Specific Logic</h4>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                  <li>Industry terminology and regulatory nuance baked into components</li>
                  <li>Integrated analytics for market sizing, forecasts, and benchmarking</li>
                  <li>Export-ready presentation for stakeholder reporting</li>
                  <li>Configurable thresholds for data quality and alerts</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2 font-medium">Integration Points</h4>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                  <li>Supabase data pipelines and cached queries</li>
                  <li>Third-party services for payments and document exports</li>
                  <li>Analytics instrumentation for usage tracking</li>
                  <li>Design system primitives for consistent theming</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
