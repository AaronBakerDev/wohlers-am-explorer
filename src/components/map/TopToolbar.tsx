import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { BarChart3, MapPin } from 'lucide-react'
import ExportButton from '@/components/ExportButton'
import type { ColumnDef } from '@/lib/export'
import type { CompanyMarker } from './types'
import type { FilterState } from '@/lib/filters/types'

/**
 * Sticky header above the map showing result counts and export action.
 */
type Props = {
  resultCount: number
  exportData: CompanyMarker[]
  exportColumns: ColumnDef<CompanyMarker>[]
  exportFilters: FilterState
  mapMode: 'pins' | 'heatmap'
  onMapModeChange: (mode: 'pins' | 'heatmap') => void
}

/**
 * Renders the top toolbar for the map explorer.
 */
export default function TopToolbar({
  resultCount,
  exportData,
  exportColumns,
  exportFilters,
  mapMode,
  onMapModeChange,
}: Props) {
  return (
    <div className='bg-card border-b border-border p-4 sticky top-0 z-10'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <h2 className='text-lg font-semibold'>AM Companies Map</h2>
          <Badge variant='secondary'>{resultCount} results</Badge>
        </div>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <div className='flex items-center rounded-md border border-border overflow-hidden'>
              <Button
                variant={mapMode === 'pins' ? 'default' : 'ghost'}
                size='sm'
                className='h-8 rounded-none'
                onClick={() => onMapModeChange('pins')}
                title='Show pins'
              >
                <MapPin className='h-4 w-4 mr-1' /> Pins
              </Button>
              <Button
                variant={mapMode === 'heatmap' ? 'default' : 'ghost'}
                size='sm'
                className='h-8 rounded-none'
                onClick={() => onMapModeChange('heatmap')}
                title='Show heatmap'
              >
                <BarChart3 className='h-4 w-4 mr-1' /> Heatmap
              </Button>
            </div>
          </div>
          <ExportButton
            data={exportData}
            columns={exportColumns}
            filenameBase='wohlers-am-map-results'
            filters={exportFilters}
            size='sm'
            align='end'
          />
        </div>
      </div>
    </div>
  )
}
