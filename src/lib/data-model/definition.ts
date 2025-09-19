export type DataModelNodeKind = 'core' | 'link' | 'support' | 'api'

export interface DataModelNode {
  id: string
  label: string
  kind: DataModelNodeKind
  description: string
  fields: string[]
  sampleQuestions: string[]
  position: {
    x: number
    y: number
  }
  table?: string
  docs?: string
}

export type DataModelRelationshipType = 'one-to-many' | 'many-to-many' | 'lookup' | 'drives' | 'extends' | 'produces'

export interface DataModelEdge {
  id: string
  source: string
  target: string
  type: DataModelRelationshipType
  description: string
  via?: string
}

export interface DataModelJourneyStep {
  id: string
  title: string
  summary: string
  touches: string[]
}

export interface DataModelJourney {
  id: string
  title: string
  scenario: string
  outcome: string
  steps: DataModelJourneyStep[]
}

export const dataModelNodes: DataModelNode[] = [
  {
    id: 'unifiedCompany',
    label: 'UnifiedCompany',
    kind: 'core',
    description: 'Primary entity representing a company participating in the additive manufacturing ecosystem.',
    fields: ['id', 'name', 'company_type', 'company_role', 'segment', 'primary_market', 'lat/lng', 'is_active'],
    sampleQuestions: [
      'How many active equipment manufacturers are in the database?',
      'Which companies operate in the industrial segment in Germany?',
      'When was the last time a company record was verified?'
    ],
    position: { x: 50, y: 50 },
    table: 'unified_companies',
    docs: 'sql-migrations/020_unified_companies_schema.sql'
  },
  {
    id: 'companyTechnology',
    label: 'CompanyTechnology',
    kind: 'link',
    description: 'Join table capturing the technologies a company works with and their proficiency levels.',
    fields: ['company_id', 'technology_id', 'proficiency_level', 'years_experience'],
    sampleQuestions: [
      'Which SLM providers have expert-level experience?',
      'How long has a company supported a specific process?'
    ],
    position: { x: 30, y: 33 },
    table: 'company_technologies',
    docs: 'src/lib/types/unified.ts'
  },
  {
    id: 'technology',
    label: 'Technology',
    kind: 'core',
    description: 'Reference catalog of additive manufacturing processes and technology families.',
    fields: ['id', 'name', 'category', 'process_type', 'typical_materials'],
    sampleQuestions: [
      'What processes apply to metal powder bed fusion?',
      'Which technologies share compatible materials?'
    ],
    position: { x: 15, y: 20 },
    table: 'technologies'
  },
  {
    id: 'companyMaterial',
    label: 'CompanyMaterial',
    kind: 'link',
    description: 'Join table relating companies to the materials they run through their systems.',
    fields: ['company_id', 'material_id', 'usage_type', 'certifications'],
    sampleQuestions: [
      'Which companies are certified to print aerospace-grade alloys?',
      'What materials are experimental for a given supplier?'
    ],
    position: { x: 30, y: 67 },
    table: 'company_materials'
  },
  {
    id: 'material',
    label: 'Material',
    kind: 'core',
    description: 'Catalog of printable materials grouped by type, format, and common properties.',
    fields: ['id', 'name', 'material_type', 'material_format', 'properties'],
    sampleQuestions: [
      'Which materials are available in filament format?',
      'What materials support high-temperature applications?'
    ],
    position: { x: 15, y: 80 },
    table: 'materials'
  },
  {
    id: 'equipmentSystem',
    label: 'EquipmentSystem',
    kind: 'support',
    description: 'Equipment inventory for each company, mapping to technologies and operational status.',
    fields: ['id', 'company_id', 'manufacturer', 'model', 'technology_id', 'status'],
    sampleQuestions: [
      'How many metal systems does a service bureau operate?',
      'Which systems are currently in maintenance?'
    ],
    position: { x: 67, y: 30 },
    table: 'equipment_systems'
  },
  {
    id: 'companyService',
    label: 'CompanyService',
    kind: 'support',
    description: 'Service catalog for each company capturing capabilities, pricing, and delivery windows.',
    fields: ['id', 'company_id', 'service_type', 'pricing_model', 'lead_time_days'],
    sampleQuestions: [
      'Which companies offer design consulting as a service?',
      'What is the lead time for a specific provider?'
    ],
    position: { x: 67, y: 70 },
    table: 'company_services'
  },
  {
    id: 'companyFilters',
    label: 'CompanyFilters',
    kind: 'support',
    description: 'Shared filter contract used across dataset configurations and API requests.',
    fields: ['companyType', 'companyRole', 'segment', 'country', 'technologies'],
    sampleQuestions: [
      'Which filters drive the desktop service dataset?',
      'How do we restrict a query to public companies?'
    ],
    position: { x: 50, y: 15 },
    docs: 'src/lib/filters/company-filters.ts'
  },
  {
    id: 'datasetConfig',
    label: 'DatasetConfig',
    kind: 'support',
    description: 'Predefined dataset templates that bundle filters, table columns, and map settings.',
    fields: ['id', 'name', 'filters', 'displayColumns', 'enableMap'],
    sampleQuestions: [
      'What columns are exposed in the Unified dataset view?',
      'Which datasets enable map mode by default?'
    ],
    position: { x: 85, y: 50 },
    docs: 'src/components/UnifiedDatasetView.tsx'
  },
  {
    id: 'companyFilterRequest',
    label: 'CompanyFilterRequest',
    kind: 'api',
    description: 'Request payload combining base filters with pagination and sorting metadata.',
    fields: ['limit', 'offset', 'sortBy', 'includeCapabilities'],
    sampleQuestions: [
      'What payload do we send when exporting filtered results?',
      'How do we request capability enrichments?'
    ],
    position: { x: 80, y: 20 },
    docs: 'src/lib/filters/company-filters.ts'
  },
  {
    id: 'companyFilterResponse',
    label: 'CompanyFilterResponse',
    kind: 'api',
    description: 'API response contract returning companies, aggregation summaries, and pagination info.',
    fields: ['companies', 'aggregations', 'pagination', 'total'],
    sampleQuestions: [
      'Where do country aggregations surface from?',
      'How are pagination totals represented?'
    ],
    position: { x: 80, y: 80 },
    docs: 'src/lib/filters/company-filters.ts'
  },
  {
    id: 'apiCompaniesMap',
    label: 'API /companies/map',
    kind: 'api',
    description: 'Edge API that powers the global company map with clustered geo results.',
    fields: ['POST request', 'returns CompanyFilterResponse', 'supports map-specific aggregations'],
    sampleQuestions: [
      'How does the map fetch clustered companies?',
      'What response shape does the map sidebar consume?'
    ],
    position: { x: 95, y: 15 },
    docs: 'src/app/api/companies/map/route.ts'
  },
  {
    id: 'apiDatasetUnified',
    label: 'API /datasets/unified',
    kind: 'api',
    description: 'Dataset endpoint generating curated segments using stored dataset configs.',
    fields: ['GET request', 'resolves DatasetConfig', 'returns CompanyFilterResponse'],
    sampleQuestions: [
      'How does the unified dataset decide visible columns?',
      'Which filters are applied before analytics are generated?'
    ],
    position: { x: 95, y: 50 },
    docs: 'src/app/api/datasets/unified-segment/route.ts'
  }
]

export const dataModelEdges: DataModelEdge[] = [
  {
    id: 'company-has-technology',
    source: 'unifiedCompany',
    target: 'companyTechnology',
    type: 'one-to-many',
    description: 'Each company references multiple technology experience records.'
  },
  {
    id: 'technology-lookup',
    source: 'companyTechnology',
    target: 'technology',
    type: 'lookup',
    description: 'Technology references resolve process metadata used in filters and badges.'
  },
  {
    id: 'company-has-materials',
    source: 'unifiedCompany',
    target: 'companyMaterial',
    type: 'one-to-many',
    description: 'Material usage profiles enable search by material families and certifications.'
  },
  {
    id: 'material-lookup',
    source: 'companyMaterial',
    target: 'material',
    type: 'lookup',
    description: 'Material catalog powers filters and technical detail popovers.'
  },
  {
    id: 'company-equipment',
    source: 'unifiedCompany',
    target: 'equipmentSystem',
    type: 'one-to-many',
    description: 'Equipment inventory shows hardware footprint that supports market intelligence.'
  },
  {
    id: 'company-services',
    source: 'unifiedCompany',
    target: 'companyService',
    type: 'one-to-many',
    description: 'Service offerings support marketplace search, exports, and pricing analysis.'
  },
  {
    id: 'equipment-to-technology',
    source: 'equipmentSystem',
    target: 'technology',
    type: 'lookup',
    description: 'Each system references a primary technology for capability tagging.'
  },
  {
    id: 'dataset-uses-filters',
    source: 'datasetConfig',
    target: 'companyFilters',
    type: 'produces',
    description: 'Dataset templates declare base filters shared across dashboards.'
  },
  {
    id: 'request-extends-filters',
    source: 'companyFilterRequest',
    target: 'companyFilters',
    type: 'extends',
    description: 'API requests extend the base filter contract with pagination metadata.'
  },
  {
    id: 'map-api-receives-request',
    source: 'companyFilterRequest',
    target: 'apiCompaniesMap',
    type: 'drives',
    description: 'Map endpoint consumes filter requests and returns geo-focused data.'
  },
  {
    id: 'map-api-returns-response',
    source: 'apiCompaniesMap',
    target: 'companyFilterResponse',
    type: 'produces',
    description: 'Map endpoint emits enriched company data for map rendering.'
  },
  {
    id: 'dataset-api-returns-response',
    source: 'apiDatasetUnified',
    target: 'companyFilterResponse',
    type: 'produces',
    description: 'Dataset endpoint reuses shared response contract for tables and exports.'
  },
  {
    id: 'response-includes-companies',
    source: 'companyFilterResponse',
    target: 'unifiedCompany',
    type: 'many-to-many',
    description: 'Responses deliver paginated company collections with capability enrichment.'
  },
  {
    id: 'dataset-api-uses-config',
    source: 'datasetConfig',
    target: 'apiDatasetUnified',
    type: 'drives',
    description: 'Dataset endpoint looks up styling, columns, and default filters from configs.'
  }
]

export const dataModelJourneys: DataModelJourney[] = [
  {
    id: 'map-intelligence',
    title: 'Global Map Intelligence',
    scenario: 'Analyst explores where metal service bureaus operate active equipment.',
    outcome: 'Interactive map and sidebar display filtered companies with capability context.',
    steps: [
      {
        id: 'step-1',
        title: 'Analyst picks dataset',
        summary: 'User selects the map view tied to a dataset template.',
        touches: ['datasetConfig', 'companyFilters']
      },
      {
        id: 'step-2',
        title: 'Client sends request',
        summary: 'Front-end builds a filter request with segment, technology, and active status.',
        touches: ['companyFilterRequest']
      },
      {
        id: 'step-3',
        title: 'Edge function responds',
        summary: 'API applies filters, hydrates companies, and resolves aggregations.',
        touches: ['apiCompaniesMap', 'companyFilterResponse', 'unifiedCompany']
      }
    ]
  },
  {
    id: 'dataset-export',
    title: 'Dataset Export Workflow',
    scenario: 'Operator exports a CSV of desktop polymer OEMs with available materials.',
    outcome: 'Export-ready dataset contains companies plus related materials and services.',
    steps: [
      {
        id: 'step-1',
        title: 'Dataset configuration',
        summary: 'Unified dataset defines default filters and visible columns.',
        touches: ['datasetConfig', 'companyFilters']
      },
      {
        id: 'step-2',
        title: 'Request with enrichment',
        summary: 'Frontend toggles `includeCapabilities` for materials and technologies.',
        touches: ['companyFilterRequest', 'companyTechnology', 'companyMaterial']
      },
      {
        id: 'step-3',
        title: 'Response hydration',
        summary: 'API joins related tables and returns enriched rows for export.',
        touches: ['companyFilterResponse', 'material', 'technology', 'unifiedCompany']
      }
    ]
  }
]
