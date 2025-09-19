import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Planning & Component Hub | Wohlers AM Explorer',
  description:
    'ASTM-aligned workspace for Wohlers AM Explorer planning artifacts, schema documentation, and reusable UI components.'
}

const componentCategories = [
  {
    title: 'Brand System Reference',
    description: 'Color tokens, typography, spacing, and asset guidelines aligned to ASTM.',
    href: '/components-test/brand-system',
    count: 3,
    components: ['Color Palette', 'Typography Scale', 'Spacing & Assets']
  },
  {
    title: 'Data Planning Hub',
    description: 'Process workbook, relationships, content types, and interactive explorer for schema alignment.',
    href: '/components-test/data-model',
    count: 4,
    components: ['Beta Workbook', 'Relationships', 'Content Types', 'Interactive Explorer']
  },
  {
    title: 'UI Components',
    description: 'Base shadcn/ui primitives themed with ASTM palette and typography.',
    href: '/components-test/ui',
    count: 9,
    components: ['Buttons', 'Cards', 'Badges', 'Form Inputs', 'Tabs', 'Table', 'Dialog & Dropdown', 'Progress & Skeletons', 'Avatars & Tooltips']
  },
  {
    title: 'Feature Components',
    description: 'Application-specific UI elements reflecting data, export, and monitoring workflows.',
    href: '/components-test/feature',
    count: 5,
    components: ['ExportButton', 'ThemeSwitcher', 'FilterChips', 'DataHealthWidget', 'CompanyTable']
  },
  {
    title: 'Map Components',
    description: 'Interactive mapping and geospatial components tuned for brand styling.',
    href: '/components-test/map',
    count: 4,
    components: ['LeafletMap', 'CompanyListSidebar', 'TopToolbar', 'BottomDrawer']
  },
  {
    title: 'Market Data Components',
    description: 'Charts and analytics views styled with ASTM data visualization palette.',
    href: '/components-test/market-data',
    count: 4,
    components: ['KpiCard', 'MarketTotalsChart', 'FilterCard', 'MarketDataLayouts']
  },
  {
    title: 'Layout Components',
    description: 'Navigation and responsive scaffolding matched to brand hierarchy.',
    href: '/components-test/layout',
    count: 4,
    components: ['AppSidebar', 'AdminGuard', 'ResponsiveAdminLayout', 'DashboardTemplate']
  },
  {
    title: 'Specialized Components',
    description: 'Domain-specific utilities, exports, and placeholders.',
    href: '/components-test/specialized',
    count: 4,
    components: ['ChartExportButton', 'SubscriptionModal', 'WohlersLogo', 'ReportPlaceholder']
  }
]

export default function ComponentTestPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 space-y-4 text-balance">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="space-y-3">
            <Badge variant="secondary" className="bg-accent text-accent-foreground uppercase tracking-[0.18em]">ASTM Update · Sept 2025</Badge>
            <h1 className="text-4xl font-light tracking-tight text-foreground">Planning &amp; Component Hub</h1>
            <p className="text-xl text-muted-foreground max-w-3xl">
              Centralize design tokens, documentation, and reusable UI references so product, data, and engineering teams stay
              synchronized while we roll the ASTM International brand system into the Wohlers AM Explorer experience.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {componentCategories.map((category) => (
            <Card key={category.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{category.title}</CardTitle>
                  <Badge variant="secondary">{category.count} resources</Badge>
                </div>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {category.components.slice(0, 6).map((component) => (
                      <Badge key={component} variant="outline" className="text-xs">
                        {component}
                      </Badge>
                    ))}
                    {category.components.length > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{category.components.length - 6} more
                      </Badge>
                    )}
                  </div>
                  <Link href={category.href}>
                    <Button className="w-full">View Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <Card className="p-6 border-border/60">
            <CardHeader>
              <CardTitle>Planning Playbook</CardTitle>
              <CardDescription>
                Quick reminders while threading ASTM alignment through the September 2025 refresh.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>Source-of-truth workbook: <code className="bg-muted px-1.5 py-0.5 text-xs">docs/project-documents/Beta/Process_and_Documentation.xlsx</code>.</li>
                <li>Run ETL against staging tables only after validating content types and joins listed in the Data Planning Hub.</li>
                <li>Sync UI with schema updates using the interactive explorer before pushing dashboard changes.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="p-6 border-border/60">
            <CardHeader>
              <CardTitle>Component Sandbox</CardTitle>
              <CardDescription>
                Why the reusable component catalog still matters during the brand rollout.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>Stress-test UI pieces against updated datasets before committing production changes.</li>
                <li>Share links with design and data teams for quick alignment on interactions.</li>
                <li>Capture visual deltas as the schema evolves to keep QA informed.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10">
          <Card className="p-6 bg-accent/40 border-accent/60">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>ASTM Brand System Resources</CardTitle>
                <CardDescription>Jump to the full reference page or open the supporting docs directly.</CardDescription>
              </div>
              <Button asChild size="sm">
                <Link href="/components-test/brand-system">Open Brand System</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>Color tokens draft: <code className="bg-muted px-1.5 py-0.5 text-xs">docs/astm-brand-guide-images/astm-color-token-draft.md</code></li>
                <li>Typography plan: <code className="bg-muted px-1.5 py-0.5 text-xs">docs/astm-brand-guide-images/astm-typography-bridge.md</code></li>
                <li>Icon usage note: <code className="bg-muted px-1.5 py-0.5 text-xs">docs/astm-brand-guide-images/astm-icon-usage-note.md</code></li>
                <li>Supergraphic guidance: <code className="bg-muted px-1.5 py-0.5 text-xs">docs/astm-brand-guide-images/astm-supergraphic-guidelines.md</code></li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
