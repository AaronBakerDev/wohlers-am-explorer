'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
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
  RefreshCw
} from "lucide-react"

// Lazily load heavy tab content to reduce initial JS bundle
const MapExplorerContent = NextDynamic(() => import('@/components/map-explorer-content'), {
  ssr: false,
})
const DataTableContent = NextDynamic(() => import('@/components/data-table-content'), {
  ssr: false,
})
const DirectoryContent = NextDynamic(() => import('@/components/directory-content'), {
  ssr: false,
})
const SystemManufacturersMatrix = NextDynamic(() => import('@/components/system-manufacturers-matrix'), {
  ssr: false,
})
const AMSystemsManufacturersContent = NextDynamic(() => import('@/components/am-systems-manufacturers-content'), {
  ssr: false,
})
const PrintServicesGlobalContent = NextDynamic(() => import('@/components/print-services-global-content'), {
  ssr: false,
})
// Feature flag: hide Saved Searches unless explicitly enabled
import { ENABLE_SAVED_SEARCHES } from '@/lib/flags'
const SavedSearches = NextDynamic(() => import('@/components/SavedSearches'), {
  ssr: false,
})

type TabType = 'overview' | 'map' | 'table' | 'matrix' | 'directory'

function DashboardContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  // Support deep-linking via ?tab=map|table|overview|directory|am-systems-manufacturers|print-services-global
  useEffect(() => {
    const tabParam = (searchParams.get('tab') || '').toLowerCase()
    const allowed: TabType[] = ['overview', 'map', 'table', 'visualizations', 'matrix', 'directory']
    if (allowed.includes(tabParam as TabType)) {
      setActiveTab(tabParam as TabType)
    } else if (tabParam === 'am-systems-manufacturers' || tabParam === 'print-services-global') {
      // Company data cards deep-link to dataset; default to Table view
      setActiveTab('table')
    }
  }, [searchParams])

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

  const DATASETS: Record<string, ReportMetadata> = {
    'am-companies-na': {
      title: 'AM Companies in North America',
      description:
        'Comprehensive database and analysis of additive manufacturing companies across the United States and Canada. This report provides detailed insights into the geographic distribution, technology adoption, and market characteristics of the North American AM industry.',
      dataSource: 'Wohlers Associates Research Database',
      lastUpdated: 'December 15, 2024',
      totalCompanies: 156,
      geographicCoverage: '35 states, 3 provinces',
      dataPoints: '1,200+ data points per company',
      version: 'v2.1.0',
    },
    'am-systems-manufacturers': {
      title: 'AM Systems Manufacturers',
      description:
        'Comprehensive directory of additive manufacturing systems and equipment manufacturers worldwide. This dataset includes detailed information about production systems, technology capabilities, and manufacturing specifications.',
      dataSource: 'Wohlers Associates Systems Database',
      lastUpdated: 'December 15, 2024',
      totalCompanies: 89,
      geographicCoverage: '25 countries worldwide',
      dataPoints: '800+ data points per manufacturer',
      version: 'v1.5.0',
    },
    'print-services-global': {
      title: 'Print Services Global',
      description:
        'Global directory of additive manufacturing print service providers and bureaus. This comprehensive database covers service capabilities, materials offered, geographic reach, and pricing models across the worldwide AM services market.',
      dataSource: 'Wohlers Associates Services Database',
      lastUpdated: 'December 20, 2024',
      totalCompanies: 312,
      geographicCoverage: '45 countries worldwide',
      dataPoints: '600+ data points per service provider',
      version: 'v1.3.0',
    },
  }

  // Determine dataset from either 'dataset' or 'tab' parameter
  const getDatasetId = () => {
    const datasetParam = searchParams.get('dataset')
    const tabParam = searchParams.get('tab')
    
    if (datasetParam) {
      return datasetParam.toLowerCase()
    } else if (tabParam === 'am-systems-manufacturers') {
      return 'am-systems-manufacturers'
    } else if (tabParam === 'print-services-global') {
      return 'print-services-global'
    }
    return 'am-companies-na'
  }
  
  const datasetId = getDatasetId()
  const reportMetadata = DATASETS[datasetId] ?? DATASETS['am-companies-na']

  const tabs = [
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
    },
    {
      id: 'matrix' as TabType,
      label: 'System Matrix',
      icon: <Database className="h-4 w-4" />,
      description: 'AM system manufacturers by process and material'
    },
    {
      id: 'directory' as TabType,
      label: 'Directory',
      icon: <Users className="h-4 w-4" />,
      description: 'Company directory view'
    }
  ]

  const renderTabContent = () => {
    // Special handling for AM Systems Manufacturers dataset
    if (datasetId === 'am-systems-manufacturers') {
      switch (activeTab) {
        case 'overview':
          return <OverviewContent reportMetadata={reportMetadata} />
        case 'map':
          return <MapExplorerContent companyType="equipment" />
        case 'table':
          return <AMSystemsManufacturersContent />
        // charts/analytics are disabled in this dataset view
        case 'matrix':
          return <SystemManufacturersMatrix />
        default:
          return <AMSystemsManufacturersContent />
      }
    }

    // Special handling for Print Services Global dataset
    if (datasetId === 'print-services-global') {
      switch (activeTab) {
        case 'overview':
          // Analytics component removed per request; show standard overview only
          return <OverviewContent reportMetadata={reportMetadata} />
        case 'map':
          return <MapExplorerContent companyType="service" />
        case 'table':
          return <PrintServicesGlobalContent />
        // charts/analytics are disabled in this dataset view
        default:
          return <PrintServicesGlobalContent />
      }
    }

    // Default rendering for other datasets
    switch (activeTab) {
      case 'overview':
        return <OverviewContent reportMetadata={reportMetadata} />
      case 'map':
        return <MapExplorerContent />
      case 'table':
        return <DataTableContent />
      case 'matrix':
        return <SystemManufacturersMatrix />
      case 'directory':
        return <DirectoryContent />
      default:
        return <OverviewContent reportMetadata={reportMetadata} />
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
                <span className="text-xs font-medium text-muted-foreground">COMPANIES</span>
              </div>
              <div className="text-xl font-semibold text-foreground">{reportMetadata.totalCompanies.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total entries</div>
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
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs">
                <Database className="h-3 w-3 mr-1" />
                {reportMetadata.version}
              </Badge>
              <Badge variant="outline" className="text-xs" title="Data source mode">
                {(process.env.NEXT_PUBLIC_DATA_SOURCE || 'supabase').toUpperCase()}
              </Badge>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <RefreshCw className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Refresh Data</span>
                <span className="sm:hidden">Refresh</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="px-4 md:px-6">
          <div className="flex items-center overflow-x-auto scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 md:gap-2 px-3 md:px-4 py-3 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
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
