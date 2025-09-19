import type { FeatureCollection } from 'geojson'

export type DemoCompanyLocation = {
  id: number
  name: string
  city: string
  countryCode: string
  type: 'System Manufacturer' | 'Service Provider' | 'Material Producer'
  technology: 'FDM' | 'SLA' | 'DMLS' | 'Binder Jetting' | 'Material Jetting'
  revenue: number // USD millions
  employees: number
  lat: number
  lng: number
}

export const demoCompanyLocations: DemoCompanyLocation[] = [
  {
    id: 1,
    name: 'Stratasys',
    city: 'Eden Prairie, MN',
    countryCode: 'US',
    type: 'System Manufacturer',
    technology: 'FDM',
    revenue: 620,
    employees: 2300,
    lat: 44.854,
    lng: -93.470
  },
  {
    id: 2,
    name: '3D Systems',
    city: 'Rock Hill, SC',
    countryCode: 'US',
    type: 'System Manufacturer',
    technology: 'SLA',
    revenue: 510,
    employees: 2500,
    lat: 34.924,
    lng: -81.025
  },
  {
    id: 3,
    name: 'Proto Labs',
    city: 'Maple Plain, MN',
    countryCode: 'US',
    type: 'Service Provider',
    technology: 'Material Jetting',
    revenue: 445,
    employees: 2400,
    lat: 45.098,
    lng: -93.417
  },
  {
    id: 4,
    name: 'Desktop Metal',
    city: 'Burlington, MA',
    countryCode: 'US',
    type: 'System Manufacturer',
    technology: 'Binder Jetting',
    revenue: 210,
    employees: 1200,
    lat: 42.504,
    lng: -71.196
  },
  {
    id: 5,
    name: 'EOS',
    city: 'Krailling, Germany',
    countryCode: 'DE',
    type: 'System Manufacturer',
    technology: 'DMLS',
    revenue: 430,
    employees: 1500,
    lat: 48.105,
    lng: 11.433
  },
  {
    id: 6,
    name: 'Materialise',
    city: 'Leuven, Belgium',
    countryCode: 'BE',
    type: 'Service Provider',
    technology: 'Material Jetting',
    revenue: 280,
    employees: 2300,
    lat: 50.879,
    lng: 4.700
  },
  {
    id: 7,
    name: 'Farsoon',
    city: 'Changsha, China',
    countryCode: 'CN',
    type: 'System Manufacturer',
    technology: 'DMLS',
    revenue: 130,
    employees: 900,
    lat: 28.228,
    lng: 112.938
  },
  {
    id: 8,
    name: 'Shapeways',
    city: 'Eindhoven, Netherlands',
    countryCode: 'NL',
    type: 'Service Provider',
    technology: 'SLA',
    revenue: 35,
    employees: 300,
    lat: 51.441,
    lng: 5.469
  }
]

export const demoCountryPolygons: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        iso_a2: 'US',
        name: 'United States',
        region: 'North America',
        center: { lat: 39.828, lng: -98.579 }
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-124.848974, 24.396308],
            [-66.885444, 24.396308],
            [-66.885444, 49.384358],
            [-124.848974, 49.384358],
            [-124.848974, 24.396308]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        iso_a2: 'DE',
        name: 'Germany',
        region: 'Europe',
        center: { lat: 51.165, lng: 10.451 }
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [5.866315, 47.27021],
            [15.041896, 47.27021],
            [15.041896, 55.058347],
            [5.866315, 55.058347],
            [5.866315, 47.27021]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        iso_a2: 'BE',
        name: 'Belgium',
        region: 'Europe',
        center: { lat: 50.503, lng: 4.469 }
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [2.513573, 49.529484],
            [6.156658, 49.529484],
            [6.156658, 51.475024],
            [2.513573, 51.475024],
            [2.513573, 49.529484]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        iso_a2: 'NL',
        name: 'Netherlands',
        region: 'Europe',
        center: { lat: 52.132, lng: 5.291 }
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [3.314971, 50.803721],
            [7.092053, 50.803721],
            [7.092053, 53.555],
            [3.314971, 53.555],
            [3.314971, 50.803721]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        iso_a2: 'CN',
        name: 'China',
        region: 'Asia-Pacific',
        center: { lat: 35.861, lng: 104.195 }
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [73.675379, 18.197701],
            [134.77281, 18.197701],
            [134.77281, 53.560974],
            [73.675379, 53.560974],
            [73.675379, 18.197701]
          ]
        ]
      }
    }
  ]
}

export const countryRegionMap: Record<string, string> = Object.fromEntries(
  demoCountryPolygons.features
    .map((feature) => {
      const props = feature.properties as { iso_a2?: string; region?: string } | undefined
      if (!props?.iso_a2 || !props?.region) return null
      return [props.iso_a2, props.region]
    })
    .filter(Boolean) as Array<[string, string]>
)
