'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import {
  getStateStatistics,
  getTechnologies,
  getMaterials,
} from '@/lib/supabase/client-queries';
import { Technology, Material } from '@/lib/supabase/types';
import dynamic from 'next/dynamic';
import { emptyFilters, FilterState } from '@/lib/filters/types';
import type { ColumnDef } from '@/lib/export';
import { BottomDrawer, ControlsTabs, CountrySidebar, TopToolbar } from '@/components/map';
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

      <div className={`flex-1 grid min-h-0 transition-all duration-300 ${sidebarOpen ? 'grid-cols-[1fr_384px]' : 'grid-cols-[1fr]'}`}>
        <div className='relative min-w-0'>
          <LeafletMap
            companies={searchFilteredCompanies}
            selectedCompany={selectedCompany}
            onCompanySelect={(company) => {
              if (company.companies && company.companies.length > 0) {
                setSelectedCountryCompanies(company.companies);
                setSidebarOpen(true);
                setSelectedCompany(null);
              } else {
                setSelectedCompany(company);
                setSidebarOpen(false);
              }
            }}
            getMarkerColor={getMarkerColor}
            isHeatmapMode={isHeatmapMode}
            stateData={stateData}
            onViewportChange={setViewportBbox}
          />

          {selectedCompany && (
            <BottomDrawer
              company={selectedCompany}
              getMarkerColor={getMarkerColor}
              onClose={() => setSelectedCompany(null)}
            />
          )}
        </div>

        {sidebarOpen && (
          <div className='bg-card border-l border-border shadow-lg overflow-hidden'>
            <CountrySidebar
              companies={selectedCountryCompanies || []}
              expandedCompany={expandedCompany}
              onToggleExpand={(id) =>
                setExpandedCompany(expandedCompany === id ? null : id)
              }
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
