import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  primaryBluePalette,
  secondaryPalettes,
  chartPaletteNotes,
  typographyScale,
  spacingScale,
  resourceLinks
} from '@/lib/brand-system'

const getContrastClass = (contrast: 'light' | 'dark') =>
  contrast === 'light' ? 'text-white' : 'text-foreground'

export default function BrandSystemPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-8">
        <div className="space-y-3 text-balance">
          <Link
            href="/components-test"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Component Hub
          </Link>
          <Badge variant="secondary" className="bg-accent text-accent-foreground uppercase tracking-[0.18em] w-fit">
            ASTM Brand System
          </Badge>
          <h1 className="text-4xl font-light tracking-tight text-foreground">Design Tokens &amp; Usage</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Reference palette, typography, spacing, and asset guidelines extracted from the ASTM International brand book so
            designers and engineers can apply the system consistently across the Wohlers AM Explorer experience.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardDescription>Primary ASTM blue range and supporting secondary groups. Use one secondary group per surface.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">Primary Blue Scale</p>
                <div className="mt-3 space-y-2">
                  {primaryBluePalette.map((swatch) => (
                    <div
                      key={swatch.name}
                      className={`rounded-md px-4 py-3 flex items-center justify-between text-sm ${getContrastClass(swatch.contrast)}`}
                      style={{ backgroundColor: swatch.hex }}
                    >
                      <span>{swatch.name}</span>
                      <span className="font-mono text-xs opacity-80">{swatch.hex}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                {secondaryPalettes.map((group) => (
                  <div key={group.group}>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">{group.group}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {group.swatches.map((swatch) => (
                        <div
                          key={`${group.group}-${swatch.name}`}
                          className={`rounded-md px-4 py-3 flex flex-col gap-1 ${getContrastClass(swatch.contrast)}`}
                          style={{ backgroundColor: swatch.hex }}
                        >
                          <span className="text-sm font-medium">{swatch.name}</span>
                          <span className="font-mono text-xs opacity-80">{swatch.hex}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">Data Visualization Series</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {chartPaletteNotes.map((hex, index) => (
                  <div key={hex} className="flex flex-col items-center gap-1">
                    <div className="h-12 w-16 rounded-md" style={{ backgroundColor: hex }} />
                    <span className="text-xs font-mono text-muted-foreground">Series {index + 1}</span>
                    <span className="text-[11px] font-mono text-muted-foreground/80">{hex}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Primary CTA, navigation, and key headers stay on ASTM Blue. Secondary groups support charts, tags, and contextual
              highlights—avoid mixing groups within a single visualization.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Typography Scale</CardTitle>
            <CardDescription>Hierarchy mapped to the ASTM guide. Inter acts as a placeholder until Neue Haas Unica is licensed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {typographyScale.map((item) => (
              <div key={item.label} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">{item.label}</p>
                <p className={item.className}>{item.sample}</p>
              </div>
            ))}
            <p className="text-sm text-muted-foreground">
              Apply tracking of +0.18em to labels, navigation, and button text. Maintain generous line-height for body copy to keep
              long-form content legible.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spacing Rhythm</CardTitle>
            <CardDescription>Baseline spacing tokens used throughout components for consistent vertical rhythm.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {spacingScale.map((space) => (
                <div key={space.token} className="rounded-lg border border-border/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">{space.token}</p>
                      <p className="text-sm text-muted-foreground">{space.usage}</p>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="text-sm font-medium text-foreground">{space.px}px</span>
                      <span className="text-xs text-muted-foreground">{space.rem}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${space.px}px` }} />
                    <span className="text-xs text-muted-foreground">Visualized width</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Page templates should anchor to multiples of 8px, reserving 32–48px for hero padding and 16px as the standard grid gap for
              cards and form sections.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Iconography &amp; Supergraphic</CardTitle>
              <CardDescription>Key reminders lifted from the ASTM brand guide.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>Stick with outlined icons, consistent stroke weight, and ASTM Blue as the default color.</li>
                <li>Use the particle supergraphic once per hero surface, keeping opacity under 45% and clear space around messaging.</li>
                <li>Motion treatments are deferred until a formal creative brief is approved.</li>
              </ul>
              <Separator className="my-4" />
              <p className="text-sm text-muted-foreground">
                Source imagery and SVGs live in <code className="bg-muted px-1.5 py-0.5 text-xs">docs/astm-brand-guide-images/</code>. Reference the
                supergraphic guidance before applying overlays.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Resource Files</CardTitle>
              <CardDescription>Quick links to the working documentation stored in the repo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {resourceLinks.map((resource) => (
                <div key={resource.label} className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{resource.label}</p>
                  <p className="text-xs text-muted-foreground">{resource.path}</p>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                These markdown files live in the repo. Open them in your editor for detailed notes and history.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
