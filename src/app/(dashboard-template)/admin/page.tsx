export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, BarChart3, ArrowRight } from 'lucide-react'
import { ResponsiveAdminLayout } from '@/components/admin/responsive-admin-layout'

export default function AdminHomePage() {
  return (
    <ResponsiveAdminLayout 
      title="Admin Overview"
      description="Manage company directory datasets and market intelligence data"
    >
      <div className="h-full overflow-auto">
        <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="group hover:shadow-md transition-all duration-200 border-2 hover:border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span>Companies</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Unified company records and details management
              </p>
              <Link href="/admin/companies" className="block">
                <Button size="sm" variant="default" className="w-full">Manage Companies</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-md transition-all duration-200 border-2 hover:border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>Market Data</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Market metrics by type, year, and region
              </p>
              <Link href="/admin/market-data" className="block">
                <Button size="sm" variant="default" className="w-full">Manage Market Data</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </ResponsiveAdminLayout>
  )
}
