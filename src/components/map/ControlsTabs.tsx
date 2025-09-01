// Tabs removed since Legend switcher is no longer needed
// import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import FilterBar from '@/components/filters/FilterBar'
import { Search } from 'lucide-react'
import type { FilterState } from '@/lib/filters/types'
import type { LegendBucket, CompanyMarker } from './types'
import { ENABLE_MAP_SEARCH } from '@/lib/flags'

/**
 * Filter controls above the map. Legend switcher removed.
 */
type Props = {
  searchQuery: string
  onSearchQueryChange: (v: string) => void
  filters: FilterState
  onFiltersChange: (f: FilterState) => void
  legendBuckets: LegendBucket[]
  getMarkerColor: (type: string | null) => string
  companies: CompanyMarker[]
}

/**
 * Renders the filters and legend controls for the map.
 */
export default function ControlsTabs({
  searchQuery,
  onSearchQueryChange,
  filters,
  onFiltersChange,
  // Unused props retained for compatibility with callers
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  legendBuckets: _legendBuckets,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getMarkerColor: _getMarkerColor,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  companies: _companies,
}: Props) {
  return (
    <div className='border-b border-border bg-background'>
      <div className='px-4 pt-5 pb-4'>
        <div className='mt-2'>
          <div className='flex items-center gap-5 md:gap-8 flex-wrap'>
            {ENABLE_MAP_SEARCH && (
              <div className='relative w-full max-w-md'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search companies...'
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  className='pl-9'
                />
              </div>
            )}
            <div className='flex-1 min-w-[280px]'>
              <FilterBar
                value={filters}
                onChange={onFiltersChange}
                orientation='horizontal'
                className='gap-4 md:gap-6'
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
