import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronRight, Globe, X } from 'lucide-react'
import type { CompanyMarker } from './types'

/**
 * Bottom sheet style drawer showing details for a selected company marker.
 */
type Props = {
  company: CompanyMarker
  getMarkerColor: (type: string | null) => string
  onClose: () => void
}

/**
 * Renders the bottom drawer with detailed company information.
 */
export default function BottomDrawer({ company, getMarkerColor, onClose }: Props) {
  return (
    <div className='absolute inset-x-0 bottom-0 z-20 pb-[env(safe-area-inset-bottom)]'>
      <div className='mx-auto w-full md:max-w-5xl bg-card border-t border-border rounded-t-lg shadow-lg'>
        <div className='p-4 border-b border-border flex items-start justify-between'>
          <div>
            <h3 className='font-semibold text-lg'>{company.name}</h3>
            <p className='text-sm text-muted-foreground'>
              {company.city}
              {company.state ? `, ${company.state}` : ''}
            </p>
          </div>
          <Button variant='ghost' size='icon' onClick={onClose}>
            <X className='h-4 w-4' />
          </Button>
        </div>
        <div className='p-4 space-y-4 max-h-[40vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]'>
          {company.companyData ? (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-3'>
                <div className='bg-muted/50 rounded-lg p-3'>
                  <div className='text-2xl font-bold text-primary'>
                    {company.companyData.number_of_printers}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    Number of Printers ({company.companyData.count_type})
                  </div>
                </div>
                <div>
                  <h4 className='text-sm font-medium mb-2'>Company Details</h4>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Segment:</span>
                      <Badge variant='secondary'>{company.companyData.segment}</Badge>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Country:</span>
                      <span>{company.companyData.country}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Last Updated:</span>
                      <span>{company.companyData.update_year}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className='space-y-3'>
                <div>
                  <h4 className='text-sm font-medium mb-2'>Equipment Details</h4>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Manufacturer:</span>
                      <span className='font-medium'>{company.companyData.printer_manufacturer}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Model:</span>
                      <span>{company.companyData.printer_model}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Process:</span>
                      <Badge variant='outline' className='font-mono'>{company.companyData.process}</Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className='text-sm font-medium mb-2'>Material Information</h4>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Type:</span>
                      <Badge variant={company.companyData.material_type === 'Metal' ? 'default' : 'secondary'}>
                        {company.companyData.material_type}
                      </Badge>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Format:</span>
                      <span>{company.companyData.material_format}</span>
                    </div>
                  </div>
                </div>
                {company.companyData?.additional_info && (
                  <div>
                    <h4 className='text-sm font-medium mb-2'>Additional Information</h4>
                    <p className='text-sm text-muted-foreground'>
                      {company.companyData?.additional_info}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='bg-muted/50 rounded-lg p-3'>
                  <div className='text-xl font-bold text-chart-4'>{company.totalMachines}</div>
                  <div className='text-xs text-muted-foreground'>
                    {company.name.includes('manufacturers') || 
                     (company.type === 'equipment' && company.companies && company.companies.length > 0) 
                     ? 'Manufacturers' : 'Total Machines'}
                  </div>
                </div>
                <div className='bg-muted/50 rounded-lg p-3'>
                  <div className='text-xl font-bold text-chart-2'>{company.uniqueProcesses}</div>
                  <div className='text-xs text-muted-foreground'>Processes</div>
                </div>
                <div className='bg-muted/50 rounded-lg p-3'>
                  <div className='text-xl font-bold text-chart-5'>{company.uniqueMaterials}</div>
                  <div className='text-xs text-muted-foreground'>Materials</div>
                </div>
                <div className='bg-muted/50 rounded-lg p-3'>
                  <div className='text-xl font-bold text-chart-3'>{company.uniqueManufacturers}</div>
                  <div className='text-xs text-muted-foreground'>Manufacturers</div>
                </div>
              </div>
              {company.type && (
                <div>
                  <h4 className='text-sm font-medium mb-2'>Company Type</h4>
                  <Badge
                    variant='outline'
                    style={{ borderColor: getMarkerColor(company.type) }}
                  >
                    <div
                      className='w-2 h-2 rounded-full mr-2'
                      style={{ backgroundColor: getMarkerColor(company.type) }}
                    />
                    {company.type}
                  </Badge>
                </div>
              )}
              {company.technologies.length > 0 && (
                <div>
                  <h4 className='text-sm font-medium mb-2'>Technologies</h4>
                  <div className='flex flex-wrap gap-2'>
                    {company.technologies.map((tech, i) => (
                      <Badge key={i} variant='secondary'>
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {company.materials.length > 0 && (
                <div>
                  <h4 className='text-sm font-medium mb-2'>Materials</h4>
                  <div className='flex flex-wrap gap-2'>
                    {company.materials.map((material, i) => (
                      <Badge key={i} variant='outline'>
                        {material}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {company.website && (
                <div>
                  <Button variant='outline' className='w-full' asChild>
                    <a href={company.website} target='_blank' rel='noopener noreferrer'>
                      <Globe className='h-4 w-4 mr-2' />
                      Visit Website
                      <ChevronRight className='h-4 w-4 ml-auto' />
                    </a>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
