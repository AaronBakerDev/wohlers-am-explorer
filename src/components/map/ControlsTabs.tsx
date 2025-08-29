import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import FilterBar from '@/components/filters/FilterBar'
import { Search } from 'lucide-react'
import type { FilterState } from '@/lib/filters/types'
import type { LegendBucket, CompanyMarker } from './types'

/**
 * Filter and legend tabs above the map. Includes search, FilterBar, and legend.
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
  legendBuckets,
  getMarkerColor,
  companies,
}: Props) {
  return (
    <div className='border-b border-border bg-background'>
      <div className='px-4 pt-3'>
        <Tabs defaultValue='filters'>
          <TabsList>
            <TabsTrigger value='filters'>Filters</TabsTrigger>
            <TabsTrigger value='legend'>Legend</TabsTrigger>
          </TabsList>
          <TabsContent value='filters' className='mt-3'>
            <div className='flex items-center gap-3 flex-wrap'>
              <div className='relative w-full max-w-md'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search companies...'
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  className='pl-9'
                />
              </div>
              <div className='flex-1 min-w-[280px]'>
                <FilterBar
                  value={filters}
                  onChange={onFiltersChange}
                  orientation='horizontal'
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value='legend' className='mt-3'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <h4 className='text-sm font-medium mb-2'>Company Types</h4>
                <div className='grid grid-cols-2 gap-2 text-sm'>
                  <div className='flex items-center gap-2'>
                    <span
                      className='w-3 h-3 rounded-full'
                      style={{ backgroundColor: getMarkerColor('equipment') }}
                    />{' '}
                    Equipment
                  </div>
                  <div className='flex items-center gap-2'>
                    <span
                      className='w-3 h-3 rounded-full'
                      style={{ backgroundColor: getMarkerColor('service') }}
                    />{' '}
                    Service
                  </div>
                  <div className='flex items-center gap-2'>
                    <span
                      className='w-3 h-3 rounded-full'
                      style={{ backgroundColor: getMarkerColor('software') }}
                    />{' '}
                    Software
                  </div>
                  <div className='flex items-center gap-2'>
                    <span
                      className='w-3 h-3 rounded-full'
                      style={{ backgroundColor: getMarkerColor('material') }}
                    />{' '}
                    Material
                  </div>
                </div>
              </div>
              <div>
                <h4 className='text-sm font-medium mb-2'>Quick Stats</h4>
                <div className='grid grid-cols-2 gap-4 text-center'>
                  <div>
                    <div className='text-xl font-semibold text-foreground'>
                      {companies.length}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Companies
                    </div>
                  </div>
                  <div>
                    <div className='text-xl font-semibold text-foreground'>
                      {companies.reduce((sum, c) => sum + c.totalMachines, 0)}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Machines
                    </div>
                  </div>
                </div>
              </div>
              <div className='md:col-span-2'>
                <h4 className='text-sm font-medium mb-2'>Heatmap Scale</h4>
                {legendBuckets.length ? (
                  <div className='flex flex-wrap gap-3 text-sm'>
                    {legendBuckets.map((b, i) => (
                      <div key={`${b.color}-${i}`} className='flex items-center gap-2'>
                        <span className='inline-block w-4 h-3 rounded-sm' style={{ backgroundColor: b.color }} />
                        <span className='text-muted-foreground text-xs'>{b.label}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-xs text-muted-foreground'>
                    No data available for heatmap
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
