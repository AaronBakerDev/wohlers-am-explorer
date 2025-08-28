/**
 * Mock Data Demo Page
 * 
 * This page demonstrates the unified mock data structure and API functionality.
 * It shows how the data adapter switches between mock and live data.
 */

'use client'

import { useState, useEffect } from 'react'
import { CompanyWithCapabilities } from '@/lib/types/unified'

interface ApiResponse {
  companies: CompanyWithCapabilities[]
  total: number
  filtered: number
  meta: {
    source: 'mock' | 'live'
    timestamp: string
    dataset?: string
    filters?: any
  }
}

export default function MockDemoPage() {
  const [amCompanies, setAmCompanies] = useState<ApiResponse | null>(null)
  const [serviceCompanies, setServiceCompanies] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch AM Systems Manufacturers
        const amResponse = await fetch('/api/unified/companies?dataset=am-systems-manufacturers&limit=10')
        if (!amResponse.ok) throw new Error('Failed to fetch AM companies')
        const amData = await amResponse.json()
        setAmCompanies(amData)
        
        // Fetch Print Services
        const serviceResponse = await fetch('/api/unified/companies?dataset=print-services-global&limit=10')
        if (!serviceResponse.ok) throw new Error('Failed to fetch service companies')
        const serviceData = await serviceResponse.json()
        setServiceCompanies(serviceData)
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Mock Data Demo</h1>
          <div className="text-center">Loading mock data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Mock Data Demo</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error: {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Unified Mock Data Demo</h1>
        
        {/* Data Source Status */}
        <div className="mb-8 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          <h2 className="font-bold mb-2">Data Source Status</h2>
          <p>AM Companies Source: <span className="font-mono">{amCompanies?.meta.source}</span></p>
          <p>Service Companies Source: <span className="font-mono">{serviceCompanies?.meta.source}</span></p>
          <p>Environment: <span className="font-mono">{process.env.NODE_ENV}</span></p>
          <p>Use Mocks: <span className="font-mono">{process.env.NEXT_PUBLIC_USE_MOCKS}</span></p>
        </div>
        
        {/* AM Systems Manufacturers */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">AM Systems Manufacturers ({amCompanies?.filtered} companies)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {amCompanies?.companies.map((company) => (
              <div key={company.id} className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold text-lg mb-2">{company.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{company.country}</p>
                <p className="text-sm mb-3">{company.description?.substring(0, 100)}...</p>
                
                <div className="mb-3">
                  <p className="text-xs font-medium">Type: <span className="font-mono">{company.company_type}/{company.company_role}</span></p>
                  <p className="text-xs font-medium">Segment: <span className="font-mono">{company.segment}</span></p>
                </div>
                
                {company.technologies && company.technologies.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium mb-1">Technologies:</p>
                    <div className="flex flex-wrap gap-1">
                      {company.technologies.map((tech) => (
                        <span key={tech.id} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {tech.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {company.materials && company.materials.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium mb-1">Materials:</p>
                    <div className="flex flex-wrap gap-1">
                      {company.materials.slice(0, 3).map((material) => (
                        <span key={material.id} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          {material.name}
                        </span>
                      ))}
                      {company.materials.length > 3 && (
                        <span className="text-xs text-gray-500">+{company.materials.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  <p>Founded: {company.founded_year}</p>
                  <p>Employees: {company.employee_count_range}</p>
                  {company.stock_ticker && <p>Ticker: {company.stock_ticker}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Print Service Providers */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Print Service Providers ({serviceCompanies?.filtered} companies)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {serviceCompanies?.companies.map((company) => (
              <div key={company.id} className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold text-lg mb-2">{company.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{company.country}</p>
                <p className="text-sm mb-3">{company.description?.substring(0, 100)}...</p>
                
                <div className="mb-3">
                  <p className="text-xs font-medium">Type: <span className="font-mono">{company.company_type}/{company.company_role}</span></p>
                  <p className="text-xs font-medium">Segment: <span className="font-mono">{company.segment}</span></p>
                </div>
                
                {company.services && company.services.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium mb-1">Services:</p>
                    <div className="space-y-1">
                      {company.services.map((service) => (
                        <div key={service.id} className="text-xs">
                          <p className="font-medium">{service.service_name}</p>
                          <p className="text-gray-500">{service.service_type} • {service.lead_time_days} days</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  <p>Founded: {company.founded_year}</p>
                  <p>Revenue: {company.annual_revenue_range}</p>
                  {company.stock_ticker && <p>Ticker: {company.stock_ticker}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* API Response Meta */}
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">API Response Metadata</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify({ 
              am_meta: amCompanies?.meta, 
              service_meta: serviceCompanies?.meta 
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}