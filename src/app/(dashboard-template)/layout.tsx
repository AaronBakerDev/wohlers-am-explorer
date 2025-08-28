
'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronLeft,
  ChevronRight,
  FileText,
  Building2,
  TrendingUp,
  Calendar,
  Database,
  Lock,
  Settings,
  User,
  Shield,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import Link from "next/link"

const generalReports = [
  { id: 'wohlers-2026', name: 'Wohlers Report 2026', year: '2026', status: 'upcoming' },
  { id: 'wohlers-2025', name: 'Wohlers Report 2025', year: '2025', status: 'upcoming' },
  { id: 'wohlers-2024', name: 'Wohlers Report 2024', year: '2024', status: 'available' },
  { id: 'wohlers-2023', name: 'Wohlers Report 2023', year: '2023', status: 'available' }
]

const marketData = [
  {
    id: 'am-market-revenue-2024',
    name: 'AM Market Revenue 2024',
    description: 'Revenue data by country and segment',
    status: 'active',
    dataPoints: '193 records',
    lastUpdated: '2024-12-20',
    hasVendorData: true
  },
  {
    id: 'fundings-investments',
    name: 'Fundings & Investments',
    description: 'Investment rounds and funding data',
    status: 'active',
    dataPoints: '413 investments',
    lastUpdated: '2024-12-18',
    hasVendorData: true
  },
  {
    id: 'mergers-acquisitions',
    name: 'Mergers & Acquisitions',
    description: 'M&A transactions in AM industry',
    status: 'active',
    dataPoints: '0+ deals',
    lastUpdated: '2024-12-15',
    hasVendorData: true
  },
  {
    id: 'print-services-pricing',
    name: 'Print Services Pricing',
    description: 'Pricing data for AM services',
    status: 'active',
    dataPoints: '1,724 quotes',
    lastUpdated: '2024-12-12',
    hasVendorData: true
  },
  {
    id: 'revenue-by-industry-2024',
    name: 'Revenue by Industry 2024',
    description: 'Industry segment revenue breakdown',
    status: 'active',
    dataPoints: '48 industries',
    lastUpdated: '2024-12-10',
    hasVendorData: true
  },
  {
    id: 'total-am-market-size',
    name: 'Total AM Market Size',
    description: 'Market size forecasts and analysis',
    status: 'active',
    dataPoints: '205 metrics',
    lastUpdated: '2024-12-08',
    hasVendorData: true
  },
  {
    id: 'company-information',
    name: 'Company Information',
    description: 'Detailed company profiles',
    status: 'active',
    dataPoints: '4,688 companies',
    lastUpdated: '2024-12-05',
    hasVendorData: true
  },
  {
    id: 'company-roles',
    name: 'Company Roles',
    description: 'Company role categorization',
    status: 'active',
    dataPoints: '4,664 roles',
    lastUpdated: '2024-12-03',
    hasVendorData: true
  },
  {
    id: 'directory',
    name: 'Directory',
    description: 'Figure and sheet directory',
    status: 'active',
    dataPoints: '92 entries',
    lastUpdated: '2024-12-01',
    hasVendorData: true
  }
]

const focusReports = [
  {
    id: 'am-systems-manufacturers',
    name: 'AM Systems Manufacturers',
    description: '89 manufacturers',
    status: 'active',
    dataPoints: '89 manufacturers',
    lastUpdated: '2024-12-15'
  },
  {
    id: 'print-services-global',
    name: 'Global Printing Services',
    description: '312 service providers',
    status: 'active',
    dataPoints: '312 service providers',
    lastUpdated: '2024-12-20'
  },
  { 
    id: 'am-materials-trends', 
    name: 'AM Materials Market Trends', 
    description: 'Analysis of material adoption in additive manufacturing',
    status: 'coming-soon',
    dataPoints: '245 materials',
    lastUpdated: '2024-11-20'
  },
  { 
    id: 'am-applications-automotive', 
    name: 'AM Applications in Automotive', 
    description: 'Industry-specific applications and case studies',
    status: 'coming-soon',
    dataPoints: '89 case studies',
    lastUpdated: '2024-10-10'
  },
  { 
    id: 'am-aerospace-analysis', 
    name: 'AM in Aerospace Industry', 
    description: 'Aerospace additive manufacturing adoption and trends',
    status: 'coming-soon',
    dataPoints: '127 companies',
    lastUpdated: '2024-09-15'
  },
  { 
    id: 'am-medical-devices', 
    name: 'Medical Device Manufacturing', 
    description: 'AM applications in medical and dental sectors',
    status: 'coming-soon',
    dataPoints: '78 applications',
    lastUpdated: '2024-08-30'
  },
  { 
    id: 'am-software-platforms', 
    name: 'AM Software Platforms', 
    description: 'Analysis of software tools and platforms',
    status: 'coming-soon',
    dataPoints: '45 platforms',
    lastUpdated: '2024-08-15'
  },
  { 
    id: 'am-post-processing', 
    name: 'Post-Processing Technologies', 
    description: 'Survey of finishing and post-processing solutions',
    status: 'coming-soon',
    dataPoints: '67 technologies',
    lastUpdated: '2024-07-20'
  },
  { 
    id: 'am-sustainability', 
    name: 'Sustainability in AM', 
    description: 'Environmental impact and sustainable practices',
    status: 'coming-soon',
    dataPoints: '134 metrics',
    lastUpdated: '2024-07-10'
  }
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const searchParams = useSearchParams()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [comingSoonExpanded, setComingSoonExpanded] = useState(false)
  const [generalReportsExpanded, setGeneralReportsExpanded] = useState(false)
  
  // Get current active tab/dataset
  const currentTab = searchParams.get('tab')
  const currentDataset = searchParams.get('dataset')

  // No nested navigation under Focus Reports; selecting a dataset loads the dashboard

  return (
    <div className="h-screen bg-background text-foreground">
      {/* Mobile Layout (md and below) */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <div className="bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image 
              src="/wohlers-astm-logo.png" 
              alt="Wohlers ASTM Logo" 
              width={2250}
              height={851}
              className="h-8 w-auto"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-8 w-8 p-0"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed left-0 top-0 bottom-0 w-80 bg-card border-r border-border z-50 flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
              {/* Mobile Sidebar Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Image 
                      src="/wohlers-astm-logo.png" 
                      alt="Wohlers ASTM Logo" 
                      width={2250}
                      height={851}
                      className="h-12 w-auto"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileMenuOpen(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Your Gateway to the AM Industry&apos;s Most Trusted Market Intelligence</p>
              </div>

              {/* Mobile Reports Navigation */}
              <div className="flex-1 overflow-y-auto min-h-0 sidebar-scrollbar">
                <div className="p-4 space-y-6">
                  {/* General Reports */}
                  <div>
                  <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-medium text-foreground">Wohlers Report</h3>
                    </div>
                    <div className="space-y-2">
                      {/* Available Reports */}
                      {generalReports.filter(report => report.status === 'available').map((report) => (
                        <div
                          key={report.id}
                          className="p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{report.name}</span>
                            <Badge variant="outline" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              Available
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">Annual industry analysis</p>
                        </div>
                      ))}
                      
                      {/* Upcoming Reports */}
                      <div>
                        <button
                          onClick={() => setGeneralReportsExpanded(!generalReportsExpanded)}
                          className="w-full flex items-center justify-between p-2 text-xs text-muted-foreground hover:text-foreground transition-colors rounded border border-border/50"
                        >
                          <span>Upcoming ({generalReports.filter(r => r.status === 'upcoming').length})</span>
                          {generalReportsExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                        
                        {generalReportsExpanded && (
                          <div className="mt-2 space-y-2">
                            {generalReports.filter(report => report.status === 'upcoming').map((report) => (
                              <div
                                key={report.id}
                                className="p-3 rounded-lg border border-border/50 opacity-50"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">{report.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Soon
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">Annual industry analysis</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Focus Reports */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-medium text-foreground">Company Data</h3>
                    </div>
                    <div className="space-y-2">
                      {/* Active Reports */}
                      {focusReports.filter(report => report.status === 'active').map((report) => {
                        const isAccessible = report.status === 'active'
                        const href = report.id === 'am-systems-manufacturers'
                          ? "/dashboard?dataset=am-systems-manufacturers&view=overview"
                          : report.id === 'print-services-global'
                          ? "/dashboard?dataset=print-services-global&view=overview"
                          : "#"
                        const isActive = currentDataset === report.id || currentTab === report.id

                        return (
                          <Link
                            key={report.id}
                            href={isAccessible ? href : "#"}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block p-3 rounded-lg border transition-colors ${
                              isActive 
                                ? 'border-primary bg-primary/5' 
                                : isAccessible
                                ? 'border-border hover:bg-accent/50'
                                : 'border-border/50 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{report.name}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{report.dataPoints}</span>
                            </div>
                          </Link>
                        )
                      })}
                      
                      {/* Coming Soon Reports */}
                      <div>
                        <button
                          onClick={() => setComingSoonExpanded(!comingSoonExpanded)}
                          className="w-full flex items-center justify-between p-2 text-xs text-muted-foreground hover:text-foreground transition-colors rounded border border-border/50"
                        >
                          <span>Coming Soon ({focusReports.filter(r => r.status === 'coming-soon').length})</span>
                          {comingSoonExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                        
                        {comingSoonExpanded && (
                          <div className="mt-2 space-y-2">
                            {focusReports.filter(report => report.status === 'coming-soon').map((report) => (
                              <div
                                key={report.id}
                                className="p-3 rounded-lg border border-border/50 opacity-50"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">{report.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Soon
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{report.dataPoints}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Market Data */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-medium text-foreground">Market Data</h3>
                    </div>
                    <div className="space-y-2">
                      {/* Active Market Data */}
                      {marketData.filter(item => item.status === 'active').map((item) => {
                        const isAccessible = item.status === 'active'
                        const href = `/market-data?dataset=${item.id}`

                        return (
                          <Link
                            key={item.id}
                            href={isAccessible ? href : "#"}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block p-3 rounded-lg border transition-colors ${
                              isAccessible
                              ? 'border-border hover:bg-accent/50'
                              : 'border-border/50 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{item.name}</span>
                              {item.hasVendorData && (
                                <Badge variant="outline" className="text-xs">
                                  <Database className="h-2 w-2 mr-1" />
                                  Live
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{item.dataPoints}</span>
                            </div>
                          </Link>
                        )
                      })}
                      
                      {/* Coming Soon Market Data */}
                      {marketData.filter(item => item.status === 'coming-soon').length > 0 && (
                        <div className="mt-2 space-y-2">
                          {marketData.filter(item => item.status === 'coming-soon').map((item) => (
                            <div
                              key={item.id}
                              className="p-3 rounded-lg border border-border/50 opacity-50"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">{item.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  <Lock className="h-3 w-3 mr-1" />
                                  Soon
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{item.dataPoints}</span>
                                <span>Updated {item.lastUpdated}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Sidebar Footer */}
              <div className="p-4 border-t border-border">
                <div className="space-y-2">
                  <ThemeSwitcher />
                  <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs">
                    <Settings className="h-3 w-3 mr-2" />
                    Settings
                  </Button>
                  <Link href="/account/profile" className="inline-flex w-full">
                    <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs">
                      <User className="h-3 w-3 mr-2" />
                      Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Mobile Main Content */}
        <div className="h-[calc(100vh-4rem)] overflow-hidden">
          {children}
        </div>
      </div>

      {/* Desktop Layout (md and above) */}
      <div className="hidden md:flex h-full">
        {/* Desktop Sidebar */}
        <div className={`bg-card border-r border-border transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-80'
        } flex flex-col h-full`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <Image 
                  src="/wohlers-astm-logo.png" 
                  alt="Wohlers ASTM Logo" 
                  width={2250}
                  height={851}
                  className="h-12 w-auto"
                />
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-8 w-8 p-0"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
          {!sidebarCollapsed && (
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Your Gateway to the AM Industry&apos;s Most Trusted Market Intelligence</p>
          )}
        </div>

        {/* Reports Navigation */}
        <div className="flex-1 overflow-y-auto min-h-0 sidebar-scrollbar">
          {!sidebarCollapsed ? (
            <div className="p-4 space-y-6">
              {/* General Reports */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-foreground">Wohlers Report</h3>
                </div>
                <div className="space-y-2">
                  {/* Available Reports */}
                  {generalReports.filter(report => report.status === 'available').map((report) => (
                    <div
                      key={report.id}
                      className="p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{report.name}</span>
                        <Badge variant="outline" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          Available
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Annual industry analysis</p>
                    </div>
                  ))}
                  
                  {/* Upcoming Reports */}
                  <div>
                    <button
                      onClick={() => setGeneralReportsExpanded(!generalReportsExpanded)}
                      className="w-full flex items-center justify-between p-2 text-xs text-muted-foreground hover:text-foreground transition-colors rounded border border-border/50"
                    >
                      <span>Upcoming ({generalReports.filter(r => r.status === 'upcoming').length})</span>
                      {generalReportsExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    
                    {generalReportsExpanded && (
                      <div className="mt-2 space-y-2">
                        {generalReports.filter(report => report.status === 'upcoming').map((report) => (
                          <div
                            key={report.id}
                            className="p-3 rounded-lg border border-border/50 opacity-50"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{report.name}</span>
                              <Badge variant="outline" className="text-xs">
                                <Calendar className="h-3 w-3 mr-1" />
                                Soon
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">Annual industry analysis</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Focus Reports */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-foreground">Company Data</h3>
                </div>
                <div className="space-y-2">
                  {/* Active Reports */}
                  {focusReports.filter(report => report.status === 'active').map((report) => {
                    const isAccessible = report.status === 'active'
                        const href = report.id === 'am-systems-manufacturers'
                      ? '/dashboard?dataset=am-systems-manufacturers&view=overview'
                      : report.id === 'print-services-global'
                      ? '/dashboard?dataset=print-services-global&view=overview'
                      : '#'
                    const isActive = currentDataset === report.id || currentTab === report.id

                    return (
                      <div
                        key={report.id}
                        className={`p-3 rounded-lg border transition-colors ${
                          isActive 
                            ? 'border-primary bg-primary/5' 
                            : isAccessible
                            ? 'border-border hover:bg-accent/50'
                            : 'border-border/50 opacity-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Link
                            href={isAccessible ? href : '#'}
                            className={`text-sm font-medium ${isAccessible ? 'hover:underline' : ''}`}
                          >
                            {report.name}
                          </Link>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{report.dataPoints}</span>
                          <span>Updated {report.lastUpdated}</span>
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Coming Soon Reports */}
                  <div>
                    <button
                      onClick={() => setComingSoonExpanded(!comingSoonExpanded)}
                      className="w-full flex items-center justify-between p-2 text-xs text-muted-foreground hover:text-foreground transition-colors rounded border border-border/50"
                    >
                      <span>Coming Soon ({focusReports.filter(r => r.status === 'coming-soon').length})</span>
                      {comingSoonExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    
                    {comingSoonExpanded && (
                      <div className="mt-2 space-y-2">
                        {focusReports.filter(report => report.status === 'coming-soon').map((report) => (
                          <div
                            key={report.id}
                            className="p-3 rounded-lg border border-border/50 opacity-50"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{report.name}</span>
                              <Badge variant="outline" className="text-xs">
                                <Lock className="h-3 w-3 mr-1" />
                                Soon
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{report.dataPoints}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Market Data */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-foreground">Market Data</h3>
                </div>
                <div className="space-y-2">
                  {/* Active Market Data */}
                  {marketData.filter(item => item.status === 'active').map((item) => {
                    const isAccessible = item.status === 'active'
                    const href = `/market-data?dataset=${item.id}`

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border transition-colors ${
                          isAccessible
                          ? 'border-border hover:bg-accent/50'
                          : 'border-border/50 opacity-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Link
                            href={isAccessible ? href : '#'}
                            className={`text-sm font-medium ${isAccessible ? 'hover:underline' : ''}`}
                          >
                            {item.name}
                          </Link>
                          {item.hasVendorData && (
                            <Badge variant="outline" className="text-xs">
                              <Database className="h-2 w-2 mr-1" />
                              Live
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{item.dataPoints}</span>
                          <span>Updated {item.lastUpdated}</span>
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Coming Soon Market Data */}
                  {marketData.filter(item => item.status === 'coming-soon').length > 0 && (
                    <div className="mt-2 space-y-2">
                      {marketData.filter(item => item.status === 'coming-soon').map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-lg border border-border/50 opacity-50"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{item.name}</span>
                            <Badge variant="outline" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              Soon
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{item.dataPoints}</span>
                            <span>Updated {item.lastUpdated}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Collapsed sidebar - just icons
            <div className="p-2 space-y-4">
              <div className="flex flex-col items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="w-8 h-px bg-border" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <div className="w-2 h-2 bg-primary rounded-full" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <div className="w-8 h-px bg-border" />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border">
          {!sidebarCollapsed ? (
            <div className="space-y-2">
              <ThemeSwitcher />
              <Link href="/admin" className="inline-flex w-full">
                <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs">
                  <Shield className="h-3 w-3 mr-2" />
                  Admin
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs">
                <Settings className="h-3 w-3 mr-2" />
                Settings
              </Button>
              <Link href="/account/profile" className="inline-flex w-full">
                <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs">
                  <User className="h-3 w-3 mr-2" />
                  Profile
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ThemeSwitcher compact />
              <Link href="/admin" className="inline-flex">
                <Shield className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Settings className="h-4 w-4 text-muted-foreground" />
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

        {/* Desktop Main Content */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}
