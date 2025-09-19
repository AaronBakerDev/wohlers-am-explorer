'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, Home, LayoutDashboard, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const layoutComponents: Array<{
  title: string
  description: string
  badgeLabel: string
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
  preview: ReactNode
}> = [
  {
    title: 'AppSidebar',
    description: 'Navigation shell with routes, quick actions, and theming.',
    badgeLabel: 'Navigation',
    preview: (
      <div className="grid gap-4 md:grid-cols-[260px,1fr]">
        <aside className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Main Menu</div>
          <nav className="space-y-1 text-sm">
            <Button variant="secondary" className="w-full justify-start gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Users className="h-4 w-4" />
              Companies
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Home className="h-4 w-4" />
              Market Insights
            </Button>
          </nav>
          <Separator className="my-4" />
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Theme</span>
              <span>System</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Saved searches</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">8</span>
            </div>
          </div>
        </aside>
        <div className="hidden rounded-lg border border-dashed bg-muted/40 p-6 text-sm font-medium text-muted-foreground md:flex md:flex-col md:items-center md:justify-center">
          Sidebar collapses on mobile while preserving quick actions
        </div>
      </div>
    )
  },
  {
    title: 'AdminGuard',
    description: 'Access wrapper enforcing authentication and admin-only routes.',
    badgeLabel: 'Security',
    badgeVariant: 'secondary',
    preview: (
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Role Check</p>
            <p className="text-xs text-muted-foreground"><code>user.role === "admin"</code></p>
          </div>
          <Badge variant="outline" className="text-xs">Status: allowed</Badge>
        </div>
        <Separator className="my-4" />
        <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
          <div className="rounded-md border px-3 py-2">
            <p className="font-medium text-foreground">Authenticated</p>
            <p>Session valid · Supabase</p>
          </div>
          <div className="rounded-md border px-3 py-2">
            <p className="font-medium text-foreground">Redirect</p>
            <p>/auth/login</p>
          </div>
          <div className="rounded-md border px-3 py-2">
            <p className="font-medium text-foreground">Error Boundary</p>
            <p>Captures authorization errors</p>
          </div>
          <div className="rounded-md border px-3 py-2">
            <p className="font-medium text-foreground">Loading State</p>
            <p>Skeleton with shimmer feedback</p>
          </div>
        </div>
      </div>
    )
  },
  {
    title: 'ResponsiveAdminLayout',
    description: 'Adaptive page layout balancing sidebar, toolbar, and content.',
    badgeLabel: 'Layout',
    badgeVariant: 'outline',
    preview: (
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[280px,1fr]">
          <div className="rounded-md border border-dashed bg-muted/30 p-4 text-center text-xs text-muted-foreground">
            Sidebar (collapses to drawer on mobile)
          </div>
          <div className="space-y-3">
            <div className="rounded-md border px-4 py-3 text-sm font-medium">
              Top toolbar with breadcrumbs & filter controls
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border px-4 py-6 text-xs text-muted-foreground">
                Content area / charts
              </div>
              <div className="rounded-md border px-4 py-6 text-xs text-muted-foreground">
                Contextual insights
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    title: 'Dashboard Template Layout',
    description: 'Shared layout template for dashboard route group.',
    badgeLabel: 'Template',
    badgeVariant: 'outline',
    preview: (
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm">
            <span className="font-medium">Header · Wohlers AM Explorer</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>/dashboard</span>
              <span>/companies</span>
              <span>/map</span>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-[260px,1fr]">
            <div className="rounded-md border border-dashed bg-muted/30 p-4 text-xs text-muted-foreground">
              Sidebar slot
            </div>
            <div className="space-y-3">
              <div className="rounded-md border px-4 py-6 text-xs text-muted-foreground">
                Primary content slot
              </div>
              <div className="rounded-md border px-4 py-4 text-xs text-muted-foreground">
                Footer / metadata slot
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
]

export default function LayoutComponentsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Link href="/components-test" className="mb-4 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Component Test
          </Link>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Layout Components</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Navigation and layout structure components that define the application shell.
          </p>
        </div>

        <div className="space-y-6">
          {layoutComponents.map((component) => (
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
                  {component.preview}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 space-y-6">
          <div className="rounded-lg bg-muted/50 p-6">
            <h3 className="mb-4 text-lg font-semibold">Layout Architecture</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-medium">Route Groups</h4>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                  <li><code>(auth)/</code> – Authentication pages</li>
                  <li><code>(dashboard-template)/</code> – Protected dashboard shell</li>
                  <li>Shared layouts, middleware, and metadata</li>
                  <li>Route-based code splitting for feature bundles</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2 font-medium">Responsive Design</h4>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                  <li>Mobile-first approach with CSS container queries</li>
                  <li>Tailwind grid utilities for adaptive columns</li>
                  <li>Touch-friendly hit targets for key actions</li>
                  <li>Persistent navigation with reduced chrome on mobile</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-6">
            <h3 className="mb-4 text-lg font-semibold">Layout Structure Overview</h3>
            <div className="font-mono text-sm bg-muted p-4 rounded">
              <div>app/</div>
              <div className="ml-2">├── (auth)/</div>
              <div className="ml-4">│   ├── login/</div>
              <div className="ml-4">│   ├── register/</div>
              <div className="ml-4">│   └── layout.tsx</div>
              <div className="ml-2">├── (dashboard-template)/</div>
              <div className="ml-4">│   ├── companies/</div>
              <div className="ml-4">│   ├── map/</div>
              <div className="ml-4">│   ├── market-insights/</div>
              <div className="ml-4">│   ├── admin/</div>
              <div className="ml-4">│   └── layout.tsx</div>
              <div className="ml-2">└── layout.tsx (root)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
