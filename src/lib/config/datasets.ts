// Unified dataset configuration for market/vendor data
// Used by API routes and UI for names, descriptions, and table mappings

export type DatasetKey =
  | 'company-information'
  | 'fundings-investments'
  | 'print-services-pricing'
  | 'am-market-revenue-2024'
  | 'mergers-acquisitions'
  | 'company-roles'
  | 'revenue-by-industry-2024'
  | 'total-am-market-size'
  | 'directory'
  | 'am-systems-manufacturers'
  | 'print-services-global'

export type DatasetConfig = {
  table: string
  name: string
  description: string
  columns: string[]
  displayColumns: string[]
}

export const DATASET_CONFIGS: Record<DatasetKey, DatasetConfig> = {
  'company-information': {
    table: 'vendor_company_information',
    name: 'Company Information',
    description: 'Vendor company profiles and headquarters',
    columns: ['company_name', 'website', 'headquarters'],
    displayColumns: ['Company Name', 'Website', 'Headquarters'],
  },
  'fundings-investments': {
    table: 'vendor_fundings_investments',
    name: 'Fundings & Investments',
    description: 'Investment rounds and funding data',
    columns: [
      'year',
      'month',
      'company_name',
      'country',
      'amount_millions_usd',
      'funding_round',
      'lead_investor',
    ],
    displayColumns: [
      'Year',
      'Month',
      'Company Name',
      'Country',
      'Amount (millions USD)',
      'Funding Round',
      'Lead Investor',
    ],
  },
  'print-services-pricing': {
    table: 'vendor_print_service_pricing',
    name: 'Print Services Pricing',
    description: 'AM service pricing and lead time data',
    columns: [
      'company_name',
      'material_type',
      'material',
      'process',
      'quantity',
      'manufacturing_cost',
      'lead_time',
      'country',
    ],
    displayColumns: [
      'Company Name',
      'Material Type',
      'Material',
      'Process',
      'Quantity',
      'Manufacturing Cost',
      'Lead Time',
      'Country',
    ],
  },
  'am-market-revenue-2024': {
    table: 'vendor_am_market_revenue_2024',
    name: 'AM Market Revenue 2024',
    description: '2024 market revenue by country and segment',
    columns: ['revenue_usd', 'country', 'segment'],
    displayColumns: ['Revenue (USD)', 'Country', 'Segment'],
  },
  'mergers-acquisitions': {
    table: 'vendor_mergers_acquisitions',
    name: 'Mergers & Acquisitions',
    description: 'M&A transactions in AM industry',
    columns: [
      'deal_date',
      'acquired_company',
      'acquiring_company',
      'deal_size_millions',
      'country',
    ],
    displayColumns: [
      'Deal Date',
      'Acquired Company',
      'Acquiring Company',
      'Deal Size (millions)',
      'Country',
    ],
  },
  'company-roles': {
    table: 'vendor_company_roles',
    name: 'Company Roles',
    description: 'Company role categorization',
    columns: ['company_name', 'category'],
    displayColumns: ['Company Name', 'Category'],
  },
  'revenue-by-industry-2024': {
    table: 'vendor_revenue_by_industry_2024',
    name: 'Revenue by Industry 2024',
    description: 'Industry segment revenue breakdown',
    columns: ['industry', 'share_of_revenue_percent', 'revenue_usd', 'region', 'material'],
    displayColumns: [
      'Industry',
      'Share of Revenue (%)',
      'Revenue (USD)',
      'Region',
      'Material',
    ],
  },
  'total-am-market-size': {
    table: 'vendor_total_am_market_size',
    name: 'Total AM Market Size',
    description: 'Market size forecasts and historical data',
    columns: ['year', 'forecast_type', 'segment', 'revenue_usd'],
    displayColumns: ['Year', 'Forecast Type', 'Segment', 'Revenue (USD)'],
  },
  'directory': {
    table: 'vendor_directory',
    name: 'Directory',
    description: 'Figure and sheet directory data',
    columns: ['figure_name', 'sheet_name_and_link', 'v1', 'notes'],
    displayColumns: ['Figure Name', 'Sheet Name and Link', 'V1', 'Notes'],
  },
  'am-systems-manufacturers': {
    table: 'vendor_am_systems_manufacturers',
    name: 'AM Systems Manufacturers',
    description: 'AM printer and system manufacturers',
    columns: ['company_name', 'segment', 'material_type', 'material_format', 'country'],
    displayColumns: ['Company Name', 'Segment', 'Material Type', 'Material Format', 'Country'],
  },
  'print-services-global': {
    table: 'vendor_print_services_global',
    name: 'Print Services Global',
    description: 'Global print service providers',
    columns: ['company_name', 'segment', 'material_type', 'material_format', 'country'],
    displayColumns: ['Company Name', 'Segment', 'Material Type', 'Material Format', 'Country'],
  },
}

