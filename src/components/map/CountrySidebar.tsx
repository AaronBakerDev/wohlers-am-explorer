import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronRight, X } from 'lucide-react'
import type { CompanyMarker } from './types'

/**
 * Right-hand sidebar listing companies within a selected country cluster.
 */
type Props = {
  companies: NonNullable<CompanyMarker['companies']>
  expandedCompany: string | null
  onToggleExpand: (id: string) => void
  onClose: () => void
}

/**
 * Renders the sidebar list of companies for a selected country.
 */
export default function CountrySidebar({
  companies,
  expandedCompany,
  onToggleExpand,
  onClose,
}: Props) {
  return (
    <div className='h-full flex flex-col'>
      <div className='p-4 border-b border-border flex items-center justify-between'>
        <h3 className='font-semibold text-lg'>
          Companies ({companies.length})
        </h3>
        <Button variant='ghost' size='icon' onClick={onClose} className='h-8 w-8'>
          <X className='h-4 w-4' />
        </Button>
      </div>
      <div className='flex-1 overflow-auto p-4 space-y-3'>
        {companies.map((company) => (
          <div key={company.id} className='border border-border rounded-lg bg-muted/30'>
            <div
              className='p-3 cursor-pointer hover:bg-muted/50 transition-colors'
              onClick={() => onToggleExpand(company.id)}
            >
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <h4 className='font-medium text-sm'>{company.name}</h4>
                  <p className='text-xs text-muted-foreground'>{company.country}</p>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline' className='text-xs'>
                    {company.segment}
                  </Badge>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${expandedCompany === company.id ? 'rotate-90' : ''}`}
                  />
                </div>
              </div>
            </div>
            {expandedCompany === company.id && (
              <div className='px-3 pb-3 border-t border-border/50'>
                <div className='pt-3 space-y-3'>
                  <div>
                    <h5 className='text-xs font-medium mb-2 text-muted-foreground'>Manufacturing Process</h5>
                    <Badge variant='secondary' className='font-mono text-xs'>
                      {company.process}
                    </Badge>
                  </div>
                  <div>
                    <h5 className='text-xs font-medium mb-2 text-muted-foreground'>Material Type</h5>
                    <Badge
                      variant={company.material_type === 'Metal' ? 'default' : 'secondary'}
                      className={company.material_type === 'Metal' ? 'bg-blue-100 text-blue-800' : ''}
                    >
                      {company.material_type}
                    </Badge>
                  </div>
                  <div>
                    <h5 className='text-xs font-medium mb-2 text-muted-foreground'>Material Format</h5>
                    <span className='text-sm'>{company.material_format}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
