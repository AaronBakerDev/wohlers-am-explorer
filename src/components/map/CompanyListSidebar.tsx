import { Badge } from '@/components/ui/badge'
import type { CompanyMarker } from './types'

type Props = {
  companies: CompanyMarker[]
  selectedCompanyId: string | null
  onSelect: (company: CompanyMarker) => void
  getMarkerColor: (type: string | null) => string
}

export default function CompanyListSidebar({
  companies,
  selectedCompanyId,
  onSelect,
  getMarkerColor,
}: Props) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-lg">Results ({companies.length})</h3>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {companies.map((c) => {
          const isSelected = selectedCompanyId === c.id
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className={`w-full text-left rounded-lg border transition-colors ${
                isSelected ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/50'
              }`}
            >
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {c.type && (
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: getMarkerColor(c.type) }}
                        />
                      )}
                      <h4 className="font-medium text-sm truncate">{c.name}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {c.country ? c.country : [c.city, c.state].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-background rounded p-2">
                    <div className="text-sm font-semibold">{c.totalMachines}</div>
                    <div className="text-[10px] text-muted-foreground">Machines</div>
                  </div>
                  <div className="bg-background rounded p-2">
                    <div className="text-sm font-semibold">{c.uniqueProcesses}</div>
                    <div className="text-[10px] text-muted-foreground">Processes</div>
                  </div>
                  <div className="bg-background rounded p-2">
                    <div className="text-sm font-semibold">{c.uniqueMaterials}</div>
                    <div className="text-[10px] text-muted-foreground">Materials</div>
                  </div>
                </div>
                {(c.technologies?.length || 0) > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {c.technologies.slice(0, 3).map((t, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        {t}
                      </Badge>
                    ))}
                    {c.technologies.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">+{c.technologies.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
