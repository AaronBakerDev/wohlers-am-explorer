'use client'
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, ArrowRight, Database } from 'lucide-react'
import { ResponsiveAdminLayout } from '@/components/admin/responsive-admin-layout'

const MARKET_DATASETS: { id: string; name: string; description: string }[] = [
  { id: 'am-market-revenue-2024', name: 'AM Market Revenue 2024', description: 'Revenue by country and segment (2024)' },
  { id: 'revenue-by-industry-2024', name: 'Revenue by Industry 2024', description: 'Revenue breakdown by industry (2024)' },
  { id: 'total-am-market-size', name: 'Total AM Market Size', description: 'Market size forecasts and historical totals' },
  { id: 'fundings-investments', name: 'Fundings & Investments', description: 'Investment rounds and funding events' },
  { id: 'mergers-acquisitions', name: 'Mergers & Acquisitions', description: 'M&A transactions in AM industry' },
  { id: 'print-services-pricing', name: 'Print Services Pricing', description: 'Quotes and lead time benchmarks' },
]

export default function VendorDatasetsAdminHub() {
  const headerActions = (
    <div className="flex items-center gap-2">
      <Badge variant="secondary">{MARKET_DATASETS.length} datasets</Badge>
    </div>
  )

  return (
    <ResponsiveAdminLayout 
      title="Market Data Datasets"
      description="Legacy vendor datasets for investments, M&A, revenue, and pricing"
      actions={headerActions}
    >
      <div className="h-full overflow-auto">
        <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {MARKET_DATASETS.map((d) => (
            <Card key={d.id} className="group hover:shadow-md transition-all duration-200 border-2 hover:border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-orange-500" />
                    <span className="text-sm md:text-base">{d.name}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{d.description}</p>
                <Link href={`/admin/market-data/vendor/${d.id}`} className="block">
                  <Button size="sm" variant="default" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Manage Dataset
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ResponsiveAdminLayout>
  )
}
