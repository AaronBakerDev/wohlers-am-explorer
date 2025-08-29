'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Search,
  MapPin,
  X,
  Globe,
  ChevronRight,
  Loader2,
  BarChart3,
} from 'lucide-react';
import {
  getStateStatistics,
  getTechnologies,
  getMaterials,
} from '@/lib/supabase/client-queries';
import { Technology, Material } from '@/lib/supabase/types';
import dynamic from 'next/dynamic';
import FilterBar from '@/components/filters/FilterBar';
import { emptyFilters, FilterState } from '@/lib/filters/types';
import ExportButton from '@/components/ExportButton';
import type { ColumnDef } from '@/lib/export';

// Dynamically import Leaflet map to avoid SSR issues
const LeafletMap = dynamic(() => import('./leaflet-map'), {
  ssr: false,
  loading: () => (
    <div className='h-full flex items-center justify-center bg-gray-100'>
      <div className='text-center'>
        <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground' />
        <p className='text-sm text-muted-foreground'>Loading map...</p>
      </div>
    </div>
  ),
});

interface CompanyMarker {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
  technologies: string[];
  materials: string[];
  website: string | null;
  type: string | null;
  totalMachines: number;
  uniqueProcesses: number;
  uniqueMaterials: number;
  uniqueManufacturers: number;
  companies?: Array<{
    id: string;
    name: string;
    segment: string;
    process: string;
    material_format: string;
    material_type: string;
    country: string;
  }>;
  companyData?: {
    id: string;
    company_name: string;
    segment: string;
    printer_manufacturer: string;
    printer_model: string;
    number_of_printers: number;
    count_type: string;
    process: string;
    material_type: string;
    material_format: string;
    country: string;
    update_year: number;
    additional_info: string;
  };
}

interface StateHeatmapData {
  state: string;
  country: string;
  company_count: number;
  total_machines: number;
}

type CompanyType = 'equipment' | 'service' | 'software' | 'material' | 'other'

export default function MapExplorerContent({ companyType }: { companyType?: CompanyType } = {}) {
  // Move environment variable check outside of render cycle
  const isCSVMode = process.env.NEXT_PUBLIC_DATA_SOURCE === 'csv';

  const [selectedCompany, setSelectedCompany] = useState<CompanyMarker | null>(
    null
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCountryCompanies, setSelectedCountryCompanies] = useState<CompanyMarker['companies']>([]);
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [mapCompanies, setMapCompanies] = useState<CompanyMarker[]>([]);
  const [stateData, setStateData] = useState<StateHeatmapData[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Disable heatmap mode for global data (equipment, service, or global AM companies)
  const [isHeatmapMode, setIsHeatmapMode] = useState(false);
  const [viewportBbox, setViewportBbox] = useState<
    [number, number, number, number] | null
  >(null);
  const [legendBuckets, setLegendBuckets] = useState<
    Array<{ color: string; min: number; max: number | null; label: string }>
  >([]);

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(
    () => filters,
    [
      filters.technologyIds.join(','),
      filters.materialIds.join(','),
      filters.processCategories.join(','),
      filters.sizeRanges.join(','),
      filters.countries.join(','),
    ]
  );

  // Load initial catalogs (technologies/materials)
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // In CSV mode, skip Supabase catalogs to avoid errors; heatmap does not need them
        if (process.env.NEXT_PUBLIC_DATA_SOURCE === 'csv') {
          setTechnologies([]);
          setMaterials([]);
          return;
        }

        const [technologiesData, materialsData] = await Promise.all([
          getTechnologies(),
          getMaterials(),
        ]);

        setTechnologies(technologiesData);
        setMaterials(materialsData);
      } catch (err) {
        console.error('Error loading data:', err);
        // In CSV mode ignore, otherwise surface
        if (process.env.NEXT_PUBLIC_DATA_SOURCE !== 'csv') {
          setError(err instanceof Error ? err.message : 'Failed to load data');
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Load heatmap data
  useEffect(() => {
    async function loadHeatmap() {
      try {
        // For equipment and service company types, use country-level data
        if (companyType === 'equipment' || companyType === 'service') {
          const res = await fetch(`/api/companies/country-heatmap?type=${companyType}`);
          if (!res.ok)
            throw new Error(`Failed to fetch country heatmap (${res.status})`);
          const json = await res.json();
          setStateData(json.data || []);
        } else if (isCSVMode) {
          // In CSV mode (now global), use server endpoint with global data
          const res = await fetch('/api/companies/heatmap');
          if (!res.ok)
            throw new Error(`Failed to fetch heatmap (${res.status})`);
          const json = await res.json();
          setStateData(json.data || []);
        } else {
          const technologyIds = memoizedFilters.technologyIds.length
            ? memoizedFilters.technologyIds
            : undefined;
          const materialIds = memoizedFilters.materialIds.length
            ? memoizedFilters.materialIds
            : undefined;
          const stateStats = await getStateStatistics({
            technologyIds,
            materialIds,
            processCategories: memoizedFilters.processCategories,
            sizeRanges: memoizedFilters.sizeRanges,
            countries: memoizedFilters.countries,
          });
          setStateData(stateStats);
        }
      } catch (err) {
        console.error('Error loading heatmap data:', err);
        setError(`Failed to load heatmap data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
    loadHeatmap();
  }, [memoizedFilters, isCSVMode, companyType]);

  // Compute heatmap legend buckets (quantiles) from current stateData
  useEffect(() => {
    const intensities = stateData
      .map((s) =>
        s.total_machines && s.total_machines > 0
          ? s.total_machines
          : s.company_count || 0
      )
      .filter((v) => v > 0)
      .sort((a, b) => a - b);

    if (intensities.length === 0) {
      setLegendBuckets([]);
      return;
    }

    const q = (arr: number[], p: number) => {
      if (!arr.length) return 0;
      const idx = Math.floor((arr.length - 1) * p);
      return arr[idx];
    };
    const t1 = q(intensities, 0.2);
    const t2 = q(intensities, 0.4);
    const t3 = q(intensities, 0.6);
    const t4 = q(intensities, 0.8);
    const thresholds = [t1, t2, t3, t4].filter(
      (v, i, a) => i === 0 || v !== a[i - 1]
    );

    const colors = ['#FFEDA0', '#FED976', '#FEB24C', '#FD8D3C', '#E31A1C'];
    const bounds = [0, ...thresholds, Infinity];
    const buckets: Array<{
      color: string;
      min: number;
      max: number | null;
      label: string;
    }> = [];
    for (let i = 0; i < colors.length; i++) {
      const min = i === 0 ? 1 : Math.floor(bounds[i] + 1);
      const max =
        i < colors.length - 1 && Number.isFinite(bounds[i + 1])
          ? Math.floor(bounds[i + 1])
          : null;
      const label = max ? `${min}-${max}` : `${min}+`;
      buckets.push({ color: colors[i], min, max, label });
    }
    setLegendBuckets(buckets);
  }, [stateData]);

  // Fetch map-visible companies from server when viewport or filters change (supabase mode only)
  useEffect(() => {
    if (isCSVMode) return; // disable pins in CSV mode
    // All data is now global, so we don't need viewport restrictions

    const controller = new AbortController();
    async function fetchMapCompanies() {
      try {
        let apiUrl = '';
        const params = new URLSearchParams();
        
        if (companyType === 'equipment') {
          // Use systems manufacturers API
          apiUrl = '/api/companies/systems-manufacturers-map';
          params.set('limit', '2000');
        } else if (companyType === 'service') {
          // Use print services API
          apiUrl = '/api/companies/print-services-map';
          params.set('limit', '2000');
        } else {
          // Default behavior: use global companies API (no viewport restriction needed)
          apiUrl = '/api/companies/global-map';
          params.set('limit', '2000');
          
          // Add search and filter parameters
          if (searchQuery.trim()) params.set('q', searchQuery.trim());
          if (memoizedFilters.countries.length)
            params.set('countries', memoizedFilters.countries.join(','));
        }

        const res = await fetch(`${apiUrl}?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok)
          throw new Error(`Failed to fetch map companies (${res.status})`);
        const json = await res.json();
        const items = (json?.data?.items || []) as Array<any>;
        const transformed: CompanyMarker[] = items.map((c) => ({
          id: c.id,
          name: c.name,
          city: c.city,
          state: c.state,
          lat: c.lat,
          lng: c.lng,
          technologies: c.technologies || [],
          materials: c.materials || [],
          website: c.website || null,
          type: c.type || null,
          totalMachines: c.totalMachines || 0,
          uniqueProcesses: c.uniqueProcesses || 0,
          uniqueMaterials: c.uniqueMaterials || 0,
          uniqueManufacturers: c.uniqueManufacturers || 0,
          companies: c.companies || [], // Include nested companies array
          companyData: c.companyData || null, // Include company data for detailed view
        }));
        setMapCompanies(transformed);
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return;
        console.error('Error fetching map companies:', err);
      }
    }
    fetchMapCompanies();
    return () => controller.abort();
  }, [
    memoizedFilters,
    searchQuery,
    isHeatmapMode,
    isCSVMode,
    companyType]);

  // Apply search filter on top of technology/material filters
  const searchFilteredCompanies = useMemo(
    () =>
      mapCompanies.filter((company) => {
        if (!searchQuery) return true;

        return (
          company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (company.city &&
            company.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (company.state &&
            company.state.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }),
    [mapCompanies, searchQuery]
  );

  // Stable reference to avoid re-running child map effect on every render
  const getMarkerColor = useCallback((type: string | null) => {
    switch (type) {
      case 'equipment':
        return '#6366f1'; // indigo
      case 'service':
        return '#059669'; // emerald
      case 'software':
        return '#dc2626'; // red
      case 'material':
        return '#d97706'; // amber
      default:
        return '#6b7280'; // gray
    }
  }, []);

  // Filters can be reset via FilterBar's Clear button

  // Show loading state
  if (loading) {
    return (
      <div className='h-full flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground' />
          <p className='text-sm text-muted-foreground'>
            Loading company data...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className='h-full flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-destructive mb-4'>⚠️</div>
          <p className='text-sm text-muted-foreground mb-4'>
            Failed to load company data
          </p>
          <p className='text-xs text-destructive'>{error}</p>
        </div>
      </div>
    );
  }

  // Removed unused topTechnologies and topMaterials - no longer needed after viewport fetching

  // Handle map resize when sidebar opens/closes
  useEffect(() => {
    // Trigger map resize after DOM updates when sidebar state changes
    const timer = setTimeout(() => {
      // Force a window resize event to trigger Leaflet's built-in resize handler
      window.dispatchEvent(new Event('resize'));
    }, 350); // Slightly longer than CSS transition duration

    return () => clearTimeout(timer);
  }, [sidebarOpen]);

  const exportColumns: ColumnDef<CompanyMarker>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Company Name' },
    { key: 'type', header: 'Type' },
    { key: 'website', header: 'Website' },
    { key: 'city', header: 'City' },
    { key: 'state', header: 'State' },
    { key: 'lat', header: 'Latitude' },
    { key: 'lng', header: 'Longitude' },
    { key: 'totalMachines', header: 'Total Machines' },
    { key: 'uniqueProcesses', header: 'Unique Processes' },
    { key: 'uniqueMaterials', header: 'Unique Materials' },
    { key: 'uniqueManufacturers', header: 'Unique Manufacturers' },
    {
      key: 'technologies',
      header: 'Technologies',
      map: (r) => r.technologies.join('; '),
    },
    {
      key: 'materials',
      header: 'Materials',
      map: (r) => r.materials.join('; '),
    },
  ];

  return (
    <div className='h-full flex flex-col'>
      {/* Top Toolbar (sticky) */}
      <div className='bg-card border-b border-border p-4 sticky top-0 z-10'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <h2 className='text-lg font-semibold'>AM Companies Map</h2>
            <Badge variant='secondary'>
              {searchFilteredCompanies.length} results
            </Badge>
          </div>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2'>
              <MapPin className='h-4 w-4 text-muted-foreground' />
              <Label htmlFor='heatmap-toggle' className='text-sm'>
                Pins
              </Label>
              <Badge variant='outline' className='text-[10px]'>
                Global
              </Badge>
              <Label htmlFor='heatmap-toggle' className='text-sm'>
                View
              </Label>
              <BarChart3 className='h-4 w-4 text-muted-foreground' />
            </div>
            <ExportButton
              data={searchFilteredCompanies}
              columns={exportColumns}
              filenameBase='wohlers-am-map-results'
              filters={memoizedFilters}
              size='sm'
              align='end'
            />
          </div>
        </div>
      </div>

      {/* Controls Tabs */}
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
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='pl-9'
                  />
                </div>
                <div className='flex-1 min-w-[280px]'>
                  <FilterBar
                    value={filters}
                    onChange={setFilters}
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
                        {searchFilteredCompanies.length}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        Companies
                      </div>
                    </div>
                    <div>
                      <div className='text-xl font-semibold text-foreground'>
                        {searchFilteredCompanies.reduce(
                          (sum, c) => sum + c.totalMachines,
                          0
                        )}
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
                        <div
                          key={`${b.color}-${i}`}
                          className='flex items-center gap-2'>
                          <span
                            className='inline-block w-4 h-3 rounded-sm'
                            style={{ backgroundColor: b.color }}
                          />
                          <span className='text-muted-foreground text-xs'>
                            {b.label}
                          </span>
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

      {/* Map and details - Grid layout for sidebar */}
      <div className={`flex-1 grid min-h-0 transition-all duration-300 ${
        sidebarOpen ? 'grid-cols-[1fr_384px]' : 'grid-cols-[1fr]'
      }`}>
        {/* Map Container */}
        <div className='relative min-w-0'>
          <LeafletMap
            companies={searchFilteredCompanies}
            selectedCompany={selectedCompany}
            onCompanySelect={(company) => {
              // If this is a country cluster (has companies array), show sidebar
              if (company.companies && company.companies.length > 0) {
                setSelectedCountryCompanies(company.companies);
                setSidebarOpen(true);
                setSelectedCompany(null); // Don't show bottom drawer
              } else {
                // Individual company - show bottom drawer
                setSelectedCompany(company);
                setSidebarOpen(false);
              }
            }}
            getMarkerColor={getMarkerColor}
            isHeatmapMode={isHeatmapMode}
            stateData={stateData}
            onViewportChange={setViewportBbox}
          />
        </div>

        {/* Sidebar for Country Company Listings */}
        {sidebarOpen && (
          <div className='bg-card border-l border-border shadow-lg overflow-hidden'>
              <div className='h-full flex flex-col'>
                {/* Sidebar Header */}
                <div className='p-4 border-b border-border flex items-center justify-between'>
                  <h3 className='font-semibold text-lg'>
                    Companies ({selectedCountryCompanies.length})
                  </h3>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => setSidebarOpen(false)}
                    className='h-8 w-8'>
                    <X className='h-4 w-4' />
                  </Button>
                </div>
                
                {/* Company List */}
                <div className='flex-1 overflow-auto p-4 space-y-3'>
                  {selectedCountryCompanies.map((company) => (
                    <div key={company.id} className='border border-border rounded-lg bg-muted/30'>
                      {/* Company Header */}
                      <div 
                        className='p-3 cursor-pointer hover:bg-muted/50 transition-colors'
                        onClick={() => setExpandedCompany(expandedCompany === company.id ? null : company.id)}>
                        <div className='flex items-center justify-between'>
                          <div className='flex-1'>
                            <h4 className='font-medium text-sm'>{company.name}</h4>
                            <p className='text-xs text-muted-foreground'>{company.country}</p>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Badge variant='outline' className='text-xs'>
                              {company.segment}
                            </Badge>
                            <ChevronRight className={`h-4 w-4 transition-transform ${
                              expandedCompany === company.id ? 'rotate-90' : ''
                            }`} />
                          </div>
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
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
                                className={company.material_type === 'Metal' ? 'bg-blue-100 text-blue-800' : ''}>
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
            </div>
          )}

          {/* Bottom Drawer for Company Details */}
          {selectedCompany && (
            <div className='absolute inset-x-0 bottom-0 z-20 pb-[env(safe-area-inset-bottom)]'>
              <div className='mx-auto w-full md:max-w-5xl bg-card border-t border-border rounded-t-lg shadow-lg'>
                <div className='p-4 border-b border-border flex items-start justify-between'>
                  <div>
                    <h3 className='font-semibold text-lg'>
                      {selectedCompany.name}
                    </h3>
                    <p className='text-sm text-muted-foreground'>
                      {selectedCompany.city}{selectedCompany.state ? `, ${selectedCompany.state}` : ''}
                    </p>
                  </div>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => setSelectedCompany(null)}>
                    <X className='h-4 w-4' />
                  </Button>
                </div>
                <div className='p-4 space-y-4 max-h-[40vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]'>
                  {/* Show Print Services specific data if available */}
                  {selectedCompany.companyData ? (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div className='space-y-3'>
                        <div className='bg-muted/50 rounded-lg p-3'>
                          <div className='text-2xl font-bold text-primary'>
                            {selectedCompany.companyData.number_of_printers}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            Number of Printers ({selectedCompany.companyData.count_type})
                          </div>
                        </div>
                        
                        <div>
                          <h4 className='text-sm font-medium mb-2'>Company Details</h4>
                          <div className='space-y-2 text-sm'>
                            <div className='flex justify-between'>
                              <span className='text-muted-foreground'>Segment:</span>
                              <Badge variant='secondary'>{selectedCompany.companyData.segment}</Badge>
                            </div>
                            <div className='flex justify-between'>
                              <span className='text-muted-foreground'>Country:</span>
                              <span>{selectedCompany.companyData.country}</span>
                            </div>
                            <div className='flex justify-between'>
                              <span className='text-muted-foreground'>Last Updated:</span>
                              <span>{selectedCompany.companyData.update_year}</span>
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
                              <span className='font-medium'>{selectedCompany.companyData.printer_manufacturer}</span>
                            </div>
                            <div className='flex justify-between'>
                              <span className='text-muted-foreground'>Model:</span>
                              <span>{selectedCompany.companyData.printer_model}</span>
                            </div>
                            <div className='flex justify-between'>
                              <span className='text-muted-foreground'>Process:</span>
                              <Badge variant='outline' className='font-mono'>{selectedCompany.companyData.process}</Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className='text-sm font-medium mb-2'>Material Information</h4>
                          <div className='space-y-2 text-sm'>
                            <div className='flex justify-between'>
                              <span className='text-muted-foreground'>Type:</span>
                              <Badge variant={selectedCompany.companyData.material_type === 'Metal' ? 'default' : 'secondary'}>
                                {selectedCompany.companyData.material_type}
                              </Badge>
                            </div>
                            <div className='flex justify-between'>
                              <span className='text-muted-foreground'>Format:</span>
                              <span>{selectedCompany.companyData.material_format}</span>
                            </div>
                          </div>
                        </div>
                        
                        {selectedCompany.companyData?.additional_info && (
                          <div>
                            <h4 className='text-sm font-medium mb-2'>Additional Information</h4>
                            <p className='text-sm text-muted-foreground'>
                              {selectedCompany.companyData?.additional_info}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Default view for other company types
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                      <div className='bg-muted/50 rounded-lg p-3'>
                        <div className='text-xl font-bold text-chart-4'>
                          {selectedCompany.totalMachines}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          Total Machines
                        </div>
                      </div>
                      <div className='bg-muted/50 rounded-lg p-3'>
                        <div className='text-xl font-bold text-chart-2'>
                          {selectedCompany.uniqueProcesses}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          Processes
                        </div>
                      </div>
                      <div className='bg-muted/50 rounded-lg p-3'>
                        <div className='text-xl font-bold text-chart-5'>
                          {selectedCompany.uniqueMaterials}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          Materials
                        </div>
                      </div>
                      <div className='bg-muted/50 rounded-lg p-3'>
                        <div className='text-xl font-bold text-chart-3'>
                          {selectedCompany.uniqueManufacturers}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          Manufacturers
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedCompany.type && (
                    <div>
                      <h4 className='text-sm font-medium mb-2'>Company Type</h4>
                      <Badge
                        variant='outline'
                        style={{
                          borderColor: getMarkerColor(selectedCompany.type),
                        }}>
                        <div
                          className='w-2 h-2 rounded-full mr-2'
                          style={{
                            backgroundColor: getMarkerColor(
                              selectedCompany.type
                            ),
                          }}
                        />
                        {selectedCompany.type}
                      </Badge>
                    </div>
                  )}
                  {selectedCompany.technologies.length > 0 && (
                    <div>
                      <h4 className='text-sm font-medium mb-2'>Technologies</h4>
                      <div className='flex flex-wrap gap-2'>
                        {selectedCompany.technologies.map((tech, i) => (
                          <Badge key={i} variant='secondary'>
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedCompany.materials.length > 0 && (
                    <div>
                      <h4 className='text-sm font-medium mb-2'>Materials</h4>
                      <div className='flex flex-wrap gap-2'>
                        {selectedCompany.materials.map((material, i) => (
                          <Badge key={i} variant='outline'>
                            {material}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedCompany.website && (
                    <div>
                      <Button variant='outline' className='w-full' asChild>
                        <a
                          href={selectedCompany.website}
                          target='_blank'
                          rel='noopener noreferrer'>
                          <Globe className='h-4 w-4 mr-2' />
                          Visit Website
                          <ChevronRight className='h-4 w-4 ml-auto' />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
