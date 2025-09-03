'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { getTechnologies, getMaterials } from '@/lib/supabase/client-queries';
import { Technology, Material } from '@/lib/supabase/types';
import dynamic from 'next/dynamic';
import { emptyFilters, FilterState } from '@/lib/filters/types';
import { filtersToSearchParams, CompanyFilterResponse, CompanyFilters } from '@/lib/filters/company-filters';
import type { ColumnDef } from '@/lib/export';
import { BottomDrawer, ControlsTabs, CompanyListSidebar, TopToolbar } from '@/components/map';
import type { CompanyMarker, LegendBucket, StateHeatmapData } from '@/components/map';

// Lightweight loading component to avoid complex inline JSX in dynamic() options
const MapLoading = () => (
  <div className='h-full flex items-center justify-center bg-gray-100'>
    <div className='text-center'>
      <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground' />
      <p className='text-sm text-muted-foreground'>Loading map...</p>
    </div>
  </div>
);

// Dynamically import Leaflet map to avoid SSR issues
const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: MapLoading,
});

// Types moved to '@/components/map/types'

type CompanyType = 'equipment' | 'service' | 'software' | 'material' | 'other'

export default function MapExplorerContent({ companyType, datasetId }: { companyType?: CompanyType, datasetId?: string } = {}) {
  // Simple country normalizer to match server logic
  const normCountry = useCallback((input?: string | null) => {
    const s = String(input || '').trim()
    if (!s) return s
    if (s.startsWith('The ')) return normCountry(s.slice(4))
    if (['U.S.', 'US', 'USA', 'United States of America'].includes(s)) return 'United States'
    if (['U.K.', 'UK'].includes(s)) return 'United Kingdom'
    if (s === 'Viet Nam') return 'Vietnam'
    if (s === 'Czechia') return 'Czech Republic'
    return s
  }, [])
  // Move environment variable check outside of render cycle
  const isCSVMode = process.env.NEXT_PUBLIC_DATA_SOURCE === 'csv';

  const [selectedCompany, setSelectedCompany] = useState<CompanyMarker | null>(
    null
  );
  // Always-on sidebar for results list
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
  const [mapMode, setMapMode] = useState<'pins' | 'heatmap'>(
    'heatmap'
  );
  const [viewportBbox, setViewportBbox] = useState<
    [number, number, number, number] | null
  >(null);
  const [legendBuckets, setLegendBuckets] = useState<LegendBucket[]>([]);

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(
    () => filters,
    [
      filters.technologyIds.join(','),
      filters.materialIds.join(','),
      filters.processCategories.join(','),
      filters.sizeRanges.join(','),
      filters.countries.join(','),
      (filters.vendorMaterialTypes || []).join(','),
      (filters.vendorMaterialFormats || []).join(','),
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

  // Load heatmap/country aggregation data when needed
  useEffect(() => {
    async function loadHeatmap() {
      try {
        // Build filters
        const params = new URLSearchParams()
        const selectedTechnologyNames = technologies
          .filter(t => memoizedFilters.technologyIds.includes(t.id))
          .map(t => t.name)
        const selectedMaterialNames = materials
          .filter(m => memoizedFilters.materialIds.includes(m.id))
          .map(m => m.name)
        // Also translate selected process categories into technology names
        const processTechNames = technologies
          .filter(t => memoizedFilters.processCategories.includes((t as any).category || ''))
          .map(t => t.name)
        const techUnion = Array.from(new Set([...selectedTechnologyNames, ...processTechNames]))
        
        if (memoizedFilters.countries.length) params.set('country', memoizedFilters.countries.join(','))

        if (isVendorDataset && vendorSegment) {
          // Vendor heatmap honors vendor filters
          params.set('segment', vendorSegment)
          const processList = memoizedFilters.processCategories.length
            ? memoizedFilters.processCategories
            : techUnion
          if (processList.length) params.set('process', processList.join(','))
          if ((memoizedFilters.vendorMaterialTypes || []).length)
            params.set('material_type', (memoizedFilters.vendorMaterialTypes || []).join(','))
          if ((memoizedFilters.vendorMaterialFormats || []).length)
            params.set('material_format', (memoizedFilters.vendorMaterialFormats || []).join(','))
          if ((memoizedFilters.vendorPrinterManufacturers || []).length)
            params.set('printer_manufacturer', (memoizedFilters.vendorPrinterManufacturers || []).join(','))
          if ((memoizedFilters.vendorPrinterModels || []).length)
            params.set('printer_model', (memoizedFilters.vendorPrinterModels || []).join(','))

          const res = await fetch(`/api/vendor/country-heatmap?${params.toString()}`)
          if (!res.ok) throw new Error(`Failed to fetch vendor country heatmap (${res.status})`)
          const json = await res.json()
          setStateData(json.data || [])
          return
        }

        // Unified heatmap honors technologies/materials and process categories (via tech names)
        if (companyType) params.set('type', companyType)
        if (techUnion.length) params.set('technologies', techUnion.join(','))
        if (selectedMaterialNames.length) params.set('materials', selectedMaterialNames.join(','))

        const res = await fetch(`/api/companies/country-heatmap?${params.toString()}`)
        if (!res.ok) throw new Error(`Failed to fetch country heatmap (${res.status})`)
        const json = await res.json()
        setStateData(json.data || [])
      } catch (err) {
        console.error('Error loading heatmap data:', err);
        setError(`Failed to load heatmap data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
    if (mapMode !== 'heatmap') return
    const t = setTimeout(() => { loadHeatmap() }, 200)
    return () => clearTimeout(t)
  }, [memoizedFilters, isCSVMode, companyType, technologies, materials, mapMode]);

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
    const buckets: LegendBucket[] = [];
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

  // Vendor dataset detection for merged vendor view
  const isVendorDataset = datasetId === 'am-systems-manufacturers' || datasetId === 'print-services-global'
  const vendorSegment = datasetId === 'am-systems-manufacturers'
    ? 'System manufacturer'
    : datasetId === 'print-services-global'
      ? 'Printing services'
      : null

  // Fetch map-visible companies from server when viewport or filters change (supabase mode only)
  useEffect(() => {
    if (isCSVMode) return; // disable pins in CSV mode
    // All data is now global, so we don't need viewport restrictions

    const controller = new AbortController();
    async function fetchMapCompanies() {
      try {
        // Build selected tech/material names
        const selectedTechnologyNames = technologies
          .filter(t => memoizedFilters.technologyIds.includes(t.id))
          .map(t => t.name)
        const selectedMaterialNames = materials
          .filter(m => memoizedFilters.materialIds.includes(m.id))
          .map(m => m.name)

        if (isVendorDataset && vendorSegment) {
          // Page through vendor companies to fetch all rows
          const buildParams = () => {
            const params = new URLSearchParams()
            params.set('segment', vendorSegment)
            params.set('limit', '2000') // server max per page; loop to get all
            params.set('includeFilters', 'false')
            params.set('includeCount', 'false')
            params.set('fields', 'map')
            if (memoizedFilters.countries.length) {
              params.set('country', memoizedFilters.countries.map(c => normCountry(c)).join(','))
            }
            if (memoizedFilters.processCategories.length) {
              params.set('process', memoizedFilters.processCategories.join(','))
            } else if (selectedTechnologyNames.length) {
              params.set('process', selectedTechnologyNames.join(','))
            }
            if ((memoizedFilters.vendorMaterialTypes || []).length) {
              params.set('material_type', (memoizedFilters.vendorMaterialTypes || []).join(','))
            }
            if ((memoizedFilters.vendorMaterialFormats || []).length) {
              params.set('material_format', (memoizedFilters.vendorMaterialFormats || []).join(','))
            }
            if ((memoizedFilters.vendorPrinterManufacturers || []).length) {
              params.set('printer_manufacturer', (memoizedFilters.vendorPrinterManufacturers || []).join(','))
            }
            if ((memoizedFilters.vendorPrinterModels || []).length) {
              params.set('printer_model', (memoizedFilters.vendorPrinterModels || []).join(','))
            }
            return params
          }

          let page = 1
          const all: CompanyMarker[] = []
          while (true) {
            if (controller.signal.aborted) return
            const params = buildParams()
            params.set('page', String(page))
            const res = await fetch(`/api/vendor/companies?${params.toString()}`, { signal: controller.signal })
            if (!res.ok) throw new Error(`Failed to fetch vendor map companies (${res.status})`)
            const json: CompanyFilterResponse = await res.json()
            const items = json?.data || []
            const transformed: CompanyMarker[] = items.map((c) => ({
              id: c.id,
              name: c.name,
              city: c.city,
              state: c.state,
              country: c.country || null,
              lat: c.lat || null,
              lng: c.lng || null,
              technologies: c.technologies || [],
              materials: c.materials || [],
              website: c.website || null,
              type: c.companyType || (vendorSegment === 'System manufacturer' ? 'equipment' : 'service'),
              totalMachines: c.equipmentCount || 0,
              uniqueProcesses: Array.isArray(c.technologies) ? c.technologies.length : 0,
              uniqueMaterials: Array.isArray(c.materials) ? c.materials.length : 0,
              uniqueManufacturers: 0,
              companyData: {
                id: c.id,
                company_name: c.name,
                segment: vendorSegment || '',
                printer_manufacturer: (c as any).printerManufacturer || null,
                printer_model: (c as any).printerModel || null,
                number_of_printers: (c as any).numberOfPrinters ?? 0,
                count_type: (c as any).countType || '',
                process: (c as any).process || '',
                material_type: (c as any).materialType || '',
                material_format: (c as any).materialFormat || '',
                country: c.country || '',
                update_year: (c as any).updateYear || new Date().getFullYear(),
                additional_info: '',
              }
            }))
            all.push(...transformed)
            setMapCompanies([...all])
            const hasNext = (items.length || 0) === 2000 || Boolean((json as any)?.pagination?.hasNext)
            if (!hasNext) break
            page += 1
          }
          setMapCompanies(all)
        } else {
          // Build unified filter request against /api/companies so the map reflects the same filters
          const baseFilters: CompanyFilters = {
            companyType: companyType ? [companyType] as CompanyFilters['companyType'] : undefined,
            // Exclude free-text search from server request; filter locally
            country: memoizedFilters.countries.length ? memoizedFilters.countries : undefined,
            technologies: selectedTechnologyNames.length ? selectedTechnologyNames : undefined,
            materials: selectedMaterialNames.length ? selectedMaterialNames : undefined,
          }

          const all: CompanyMarker[] = []
          let page = 1
          while (true) {
            if (controller.signal.aborted) return
            const params = filtersToSearchParams(baseFilters)
            params.set('limit', '1000') // server max per page
            params.set('includeFilters', 'false')
            params.set('includeCount', 'false')
            params.set('page', String(page))
            const res = await fetch(`/api/companies?${params.toString()}`, { signal: controller.signal })
            if (!res.ok) throw new Error(`Failed to fetch map companies (${res.status})`)
            const json: CompanyFilterResponse = await res.json()
            const items = json?.data || []
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
              type: c.companyType || null,
              totalMachines: c.equipmentCount || 0,
              uniqueProcesses: Array.isArray(c.technologies) ? c.technologies.length : 0,
              uniqueMaterials: Array.isArray(c.materials) ? c.materials.length : 0,
              uniqueManufacturers: 0,
            }))
            all.push(...transformed)
            setMapCompanies([...all])
            const hasNext = (items.length || 0) === 1000 || Boolean((json as any)?.pagination?.hasNext)
            if (!hasNext) break
            page += 1
          }
          setMapCompanies(all)
        }
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return;
        console.error('Error fetching map companies:', err);
      }
    }
    const t = setTimeout(() => { fetchMapCompanies() }, 200)
    return () => { clearTimeout(t); controller.abort() };
  }, [
    memoizedFilters,
    mapMode,
    isCSVMode,
    companyType,
    datasetId,
    isVendorDataset,
    vendorSegment]);

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

  // Handle map resize when sidebar opens/closes
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 350)
    return () => clearTimeout(timer)
  }, [sidebarOpen])

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

  // Subcomponents for clarity and maintenance
  // Subcomponents moved to files under '@/components/map'

  return (
    <div className='h-full flex flex-col'>
      <TopToolbar
        resultCount={searchFilteredCompanies.length}
        exportData={searchFilteredCompanies}
        exportColumns={exportColumns}
        exportFilters={memoizedFilters}
        mapMode={mapMode}
        onMapModeChange={setMapMode}
      />
      <ControlsTabs
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        filters={filters}
        onFiltersChange={setFilters}
        legendBuckets={legendBuckets}
        getMarkerColor={getMarkerColor}
        companies={searchFilteredCompanies}
      />

      <div className={`flex-1 grid min-h-0 transition-all duration-300 grid-cols-[1fr_384px]`}>
        <div className='relative min-w-0'>
          <LeafletMap
            companies={searchFilteredCompanies}
            selectedCompany={selectedCompany}
            onCompanySelect={(company) => {
              setSelectedCompany(company);
              // For vendor datasets, also filter by the company's country
              if (isVendorDataset && company?.country) {
                setFilters(prev => ({
                  ...prev,
                  countries: [normCountry(company.country!)]
                }));
              }
            }}
            getMarkerColor={getMarkerColor}
            isHeatmapMode={mapMode === 'heatmap'}
            stateData={stateData}
            onViewportChange={setViewportBbox}
            isCountryLevelOnly={isVendorDataset}
            onCountryClick={(country) => {
              // Update filters to show only the selected country
              setFilters(prev => ({
                ...prev,
                countries: [normCountry(country)]
              }));
            }}
          />

          {selectedCompany && (
            <BottomDrawer
              company={selectedCompany}
              getMarkerColor={getMarkerColor}
              onClose={() => setSelectedCompany(null)}
            />
          )}
        </div>

        <div className='bg-card border-l border-border shadow-lg overflow-hidden'>
          <CompanyListSidebar
            companies={searchFilteredCompanies}
            selectedCompanyId={selectedCompany?.id ?? null}
            onSelect={(c) => setSelectedCompany(c)}
            getMarkerColor={getMarkerColor}
          />
        </div>
      </div>
    </div>
  );
}
