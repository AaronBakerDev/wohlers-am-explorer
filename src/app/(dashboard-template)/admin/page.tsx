export const dynamic = 'force-dynamic'

import Link from 'next/link'
import AdminGuard from '@/components/admin/AdminGuard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, PrinterIcon, Factory, Shield } from 'lucide-react'

export default function AdminHomePage() {
  return (
    <AdminGuard>
      <div className="h-full overflow-auto">
        <div className="p-4 md:p-6 border-b border-border bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">Admin</h1>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Database className="h-3 w-3" />
              <span>{(process.env.NEXT_PUBLIC_DATA_SOURCE || 'supabase').toUpperCase()}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Manage company directory datasets.</p>
        </div>

        <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PrinterIcon className="h-4 w-4 text-primary" />
                Global Printing Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                CRUD providers, capabilities, and equipment counts.
              </p>
              <Link href="/admin/print-services">
                <Button size="sm" variant="default">Open</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-4 w-4 text-primary" />
                AM Systems Manufacturers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                CRUD manufacturers, processes, and materials.
              </p>
              <Link href="/admin/am-systems">
                <Button size="sm" variant="default">Open</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminGuard>
  )
}
