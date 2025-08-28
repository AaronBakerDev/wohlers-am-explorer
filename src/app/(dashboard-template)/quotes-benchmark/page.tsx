export const dynamic = 'force-dynamic'

import QuotesBenchmarkContent from '@/components/quotes-benchmark-content'
import { Button } from '@/components/ui/button'

export default function QuotesBenchmarkPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border bg-background">
        <div className="p-4 md:p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Quotes Benchmark</h1>
            <p className="text-xs text-muted-foreground">Compare and analyze pricing</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">Export CSV</Button>
            <Button size="sm" variant="secondary">Export JSON</Button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6">
          <QuotesBenchmarkContent />
        </div>
      </div>
    </div>
  )
}

