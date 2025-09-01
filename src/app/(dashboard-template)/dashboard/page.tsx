"use client"

export const dynamic = 'force-dynamic'

import { Suspense, useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import NextDynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MapPin,
  Table,
  Info,
  Calendar,
  Database,
  Users,
  Globe,
  RefreshCw,
  BarChart3
} from "lucide-react"

// Lazily load heavy tab content to reduce initial JS bundle - with loading states
const MapExplorerContent = NextDynamic(() => import('@/components/map-explorer-content'), {
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin" /></div>
})
const DirectoryContent = NextDynamic(() => import('@/components/directory-content'), {
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin" /></div>
})
const SystemManufacturersMatrix = NextDynamic(() => import('@/components/system-manufacturers-matrix'), {
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin" /></div>
})

// NEW: Unified Dataset View Component - replaces individual dataset components
const UnifiedDatasetView = NextDynamic(() => import('@/components/UnifiedDatasetView'), {
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin" /></div>
})

// Legacy components - kept for backward compatibility during migration
const AMSystemsManufacturersAnalytics = NextDynamic(() => import('@/components/am-systems-manufacturers-analytics'), {
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin" /></div>
})
const PrintServicesGlobalAnalytics = NextDynamic(() => import('@/components/print-services-global-analytics'), {
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin" /></div>
})
// Feature flag: hide Saved Searches unless explicitly enabled
import { ENABLE_SAVED_SEARCHES } from '@/lib/flags'
const SavedSearches = NextDynamic(() => import('@/components/SavedSearches'), {
  ssr: false,
})

// Import dataset configuration system
import { getActiveDatasets, getDatasetById } from '@/lib/config/datasets'

type TabType = 'overview' | 'map' | 'table' | 'matrix' | 'directory' | 'analytics'

function DashboardContent() {
  const searchParams = useSearchParams()

  // Active view is driven by URL: prefer `view`, fallback to legacy `tab`
  const computeActiveTab = (): TabType => {
    const raw = (searchParams.get('view') || searchParams.get('tab') || 'overview').toLowerCase()
    const allowed: TabType[] = ['overview', 'map', 'table', 'matrix', 'directory', 'analytics']
    if (allowed.includes(raw as TabType)) return raw as TabType
    // If legacy `tab` carried dataset id, default to overview
    return 'overview'
  }
  const activeTab = computeActiveTab()

  // Dataset selection via sidebar: ?dataset=<id>
  type ReportMetadata = {
    title: string
    description: string
    dataSource: string
    lastUpdated: string
    totalCompanies: number
    geographicCoverage: string
    dataPoints: string
    version: string
    [key: string]: unknown
  }

  // Determine dataset from either 'dataset' or 'tab' parameter
  const getDatasetId = () => {
    // Prefer explicit dataset param; support legacy paths where ?tab held dataset id
    const datasetParam = searchParams.get('dataset')
    const legacyTab = searchParams.get('tab')
    if (datasetParam) return datasetParam.toLowerCase()
    if (legacyTab === 'am-systems-manufacturers') return 'am-systems-manufacturers'
    if (legacyTab === 'print-services-global') return 'print-services-global'
    return 'am-systems-manufacturers'
  }
  
  const datasetId = getDatasetId()
  const dataset = getDatasetById(datasetId)
  
  // State for company count
  const [companyCount, setCompanyCount] = useState(0)
  
  // Fetch actual company count from database
  useEffect(() => {
    async function fetchCompanyCount() {
      if (!dataset) return
      
      try {
        // Import Supabase client dynamically to avoid SSR issues
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        // For vendor datasets (AM Systems and Print Services), count entries from vendor_companies_merged
        if (datasetId === 'am-systems-manufacturers' || datasetId === 'print-services-global') {
          // Query vendor_companies_merged with segment filter to get actual entry count
          let vendorQuery = supabase.from('vendor_companies_merged').select('id', { count: 'exact', head: true })
          
          if (datasetId === 'am-systems-manufacturers') {
            vendorQuery = vendorQuery.eq('segment', 'System manufacturer')
          } else if (datasetId === 'print-services-global') {
            vendorQuery = vendorQuery.eq('segment', 'Printing services')
          }
          
          const { count, error } = await vendorQuery
          
          if (!error && count !== null) {
            setCompanyCount(count)
          } else {
            console.error('Error fetching vendor entry count:', error)
            setCompanyCount(0)
          }
        } else {
          // For other datasets, query the main companies table
          let query = supabase.from('companies').select('id', { count: 'exact', head: true })
          
          if (datasetId === 'material-suppliers') {
            query = query.eq('company_type', 'material')
          } else if (datasetId === 'software-developers') {
            query = query.eq('company_type', 'software')
          }
          // For other datasets or if no specific type, get all companies
          
          const { count, error } = await query
          
          if (!error && count !== null) {
            setCompanyCount(count)
          } else {
            console.error('Error fetching company count:', error)
            setCompanyCount(0)
          }
        }
      } catch (error) {
        console.error('Failed to fetch company count:', error)
        setCompanyCount(0)
      }
    }
    
    fetchCompanyCount()
  }, [datasetId, dataset])
  
  // Convert dataset config to legacy ReportMetadata format for backward compatibility
  const reportMetadata: ReportMetadata = dataset ? {
    title: dataset.name,
    description: dataset.description,
    dataSource: 'Wohlers Associates Research Database',
    lastUpdated: dataset.updatedAt ? new Date(dataset.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'December 15, 2024',
    totalCompanies: companyCount,
    geographicCoverage: 'Global coverage',
    dataPoints: '800+ data points per company',
    version: dataset.version,
  } : {
    title: 'Dataset Not Found',
    description: 'The requested dataset is not available or has been removed.',
    dataSource: 'Unknown',
    lastUpdated: 'Unknown',
    totalCompanies: 0,
    geographicCoverage: 'Unknown',
    dataPoints: 'Unknown',
    version: 'Unknown',
  }

  const tabs = useMemo(() => {
    const baseTabs = [
      {
        id: 'overview' as TabType,
        label: 'Overview',
        icon: <Info className="h-4 w-4" />,
        description: 'Report details and metadata'
      },
      {
        id: 'map' as TabType,
        label: 'Map View',
        icon: <MapPin className="h-4 w-4" />,
        description: 'Interactive geographic visualization'
      },
      {
        id: 'table' as TabType,
        label: 'Data Table',
        icon: <Table className="h-4 w-4" />,
        description: 'Detailed company listings and export'
      }
    ]

    // Add analytics tab if dataset supports it
    if (dataset && dataset.enableAnalytics) {
      baseTabs.push({
        id: 'analytics' as TabType,
        label: 'Analytics',
        icon: <BarChart3 className="h-4 w-4" />,
        description: 'Data visualization and insights'
      })
    }

    return baseTabs
  }, [dataset])

  const renderTabContent = () => {
    if (!dataset) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-red-500">
            <h2 className="text-lg font-semibold mb-2">Dataset Not Found</h2>
            <p className="text-sm">Dataset "{datasetId}" is not configured or available.</p>
          </div>
        </div>
      )
    }

    // Unified rendering based on activeTab
    switch (activeTab) {
      case 'overview':
        return <OverviewContent reportMetadata={reportMetadata} />
        
      case 'map':
        // Use dataset mapType to determine the appropriate map view
        return <MapExplorerContent datasetId={datasetId} companyType={dataset.mapType} />
        
      case 'table':
        // Use new unified dataset view for all datasets
        return <UnifiedDatasetView datasetId={datasetId} />
        
      case 'analytics':
        // Legacy analytics components for backward compatibility
        if (datasetId === 'am-systems-manufacturers') {
          return <AMSystemsManufacturersAnalytics />
        }
        if (datasetId === 'print-services-global') {
          return (
            <div className="space-y-2">
              <div className="px-4 md:px-6">
                <div className="p-4 border-b border-border bg-card" data-testid="psg-analytics-header">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <h2 className="text-lg font-medium">Global Printing Services Analytics</h2>
                  </div>
                </div>
              </div>
              <PrintServicesGlobalAnalytics />
            </div>
          )
        }
        // Fallback to unified view for other datasets
        return <UnifiedDatasetView datasetId={datasetId} />
        
      case 'matrix':
        // Matrix view currently only for AM Systems Manufacturers
        if (datasetId === 'am-systems-manufacturers') {
          return <SystemManufacturersMatrix />
        }
        return <UnifiedDatasetView datasetId={datasetId} />
        
      case 'directory':
        return <DirectoryContent />
        
      default:
        return <UnifiedDatasetView datasetId={datasetId} />
    }
  }

  // Overview Content Component
  
  const OverviewContent = ({ reportMetadata }: { reportMetadata: ReportMetadata }) => (
    <div className="h-full overflow-auto bg-background">
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Report Description */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Report Description</h2>
          <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
            {reportMetadata.description}
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Dataset Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-muted/30 border border-border p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  {datasetId === 'am-systems-manufacturers' || datasetId === 'print-services-global' 
                    ? 'ENTRIES' 
                    : 'COMPANIES'}
                </span>
              </div>
              <div className="text-xl font-semibold text-foreground">{reportMetadata.totalCompanies.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                {datasetId === 'am-systems-manufacturers' || datasetId === 'print-services-global' 
                  ? 'Total entries' 
                  : 'Total companies'}
              </div>
            </div>

            <div className="bg-muted/30 border border-border p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-chart-2" />
                <span className="text-xs font-medium text-muted-foreground">COVERAGE</span>
              </div>
              <div className="text-lg font-semibold text-foreground">{reportMetadata.geographicCoverage}</div>
              <div className="text-xs text-muted-foreground">Geographic reach</div>
            </div>

            <div className="bg-muted/30 border border-border p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-chart-3" />
                <span className="text-xs font-medium text-muted-foreground">DATA POINTS</span>
              </div>
              <div className="text-lg font-semibold text-foreground">{reportMetadata.dataPoints}</div>
              <div className="text-xs text-muted-foreground">Per company</div>
            </div>

            <div className="bg-muted/30 border border-border p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-chart-4" />
                <span className="text-xs font-medium text-muted-foreground">LAST UPDATED</span>
              </div>
              <div className="text-lg font-semibold text-foreground">{reportMetadata.lastUpdated}</div>
              <div className="text-xs text-muted-foreground">Data freshness</div>
            </div>
          </div>
        </div>

        {/* About This Report */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 md:p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3">
                About This Report
              </h3>
              <div className="space-y-3 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  Data sourced from {reportMetadata.dataSource}. This report includes verified company information, 
                  technology classifications, and geographic coordinates.
                </p>
                <p>
                  The dataset covers {reportMetadata.totalCompanies.toLocaleString()} companies across {reportMetadata.geographicCoverage}, 
                  with over {reportMetadata.dataPoints} collected for each entry.
                </p>
                <p>
                  Use the navigation tabs above to explore different views of the data: interactive maps and 
                  detailed tables, plus the system matrix for AM systems.
                </p>
              </div>
            </div>
          </div>
        </div>

        

        {/* Data Source & Methodology */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Data Source & Methodology</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Data Collection</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Direct company surveys and interviews</li>
                <li>• Public filings and regulatory documents</li>
                <li>• Industry publications and trade shows</li>
                <li>• Third-party research and validation</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Data Validation</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Multi-source verification process</li>
                <li>• Regular updates and fact-checking</li>
                <li>• Geographic coordinate validation</li>
                <li>• Technology classification review</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Saved Searches (feature-flagged)
           - Default: hidden. Enable by setting `NEXT_PUBLIC_ENABLE_SAVED_SEARCHES=true`
             in your `.env.local` and restarting the dev server.
           - The component remains intact; we only gate rendering here. */}
        {ENABLE_SAVED_SEARCHES ? <SavedSearches /> : null}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header matching sidebar height */}
      <div className="bg-background border-b border-border">
        {/* Report Title Section - matching sidebar header height */}
        <div className="p-4 min-h-[100px] flex flex-col justify-center">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground leading-tight">{reportMetadata.title}</h1>
              <p className="text-xs text-muted-foreground mt-1">Comprehensive database and analysis</p>
            </div>
            {/* Hide debug/status badges in the main header to reduce clutter on mobile */}
            <div className="flex items-center gap-2">
              {/* Intentionally left empty; badges removed per UX feedback */}
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="px-4 md:px-6">
          <div className="flex items-center overflow-x-auto scrollbar-none">
            {tabs.map((tab) => {
              const params = new URLSearchParams()
              params.set('dataset', datasetId)
              params.set('view', tab.id)
              const href = `/dashboard?${params.toString()}`
              const isActive = activeTab === tab.id
              return (
                <Link
                  key={tab.id}
                  href={href}
                  className={`relative flex items-center gap-1 md:gap-2 px-3 md:px-4 py-3 text-xs md:text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-primary text-primary bg-blue-50 dark:bg-blue-950/30'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border hover:bg-accent/50'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Scrollable Tab Content */}
      <div className="flex-1 overflow-auto tab-content-container">
        <div className="h-full">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
