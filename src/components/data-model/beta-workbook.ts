export const betaWorkbook = {
  file: 'Process_and_Documentation.xlsx',
  displayName: 'Process & Documentation (Beta)',
  path: 'docs/project-documents/Beta/Process_and_Documentation.xlsx',
  summary:
    'Beta documentation workbook capturing the September 2025 schema refresh. It maps each dataset sheet to staging tables, documents field-level content types, and tracks aliasing between company identifiers.',
  sheetCount: 3,
  notes: 'Use this workbook as the canonical planning source before promoting data into docs/schema or Supabase staging tables.'
} as const

export const betaSheets = [
  {
    name: 'Database_schema',
    rows: 36,
    columns: 18,
    purpose:
      'Visual matrix aligning workbook sections (Company Contact Info, Pricing, Trade, etc.) with their target staging tables.'
  },
  {
    name: 'Data types',
    rows: 87,
    columns: 3,
    purpose: 'Field-level content types and foreign key notes for every planned table.'
  },
  {
    name: 'Company_mapping_onetomany',
    rows: 7_854,
    columns: 4,
    purpose: 'Alternate IDs and aliases that map one company to many branded or regional variants.'
  }
] as const

export const betaRelationships = [
  {
    source: 'Company Information',
    target: 'Company Roles',
    join: 'CompanyID',
    cardinality: '1 → many',
    notes: 'Each company can advertise multiple roles (printer manufacturer, service bureau, software, etc.).'
  },
  {
    source: 'Company Information',
    target: 'Company Locations',
    join: 'CompanyID / AlternateID',
    cardinality: '1 → many',
    notes: 'Primary company record owns multiple headquarters, regional offices, and alias IDs for dedupe.'
  },
  {
    source: 'Company Information',
    target: 'Employee Count',
    join: 'CompanyID',
    cardinality: '1 → many',
    notes: 'Headcount snapshots track AM-specific vs. total employee counts over time.'
  },
  {
    source: 'Company Information',
    target: 'SM Details',
    join: 'CompanyID',
    cardinality: '1 → many',
    notes: 'Links company to processes, material formats, and material types they support.'
  },
  {
    source: 'Company Information',
    target: 'SP – EU Details',
    join: 'CompanyID',
    cardinality: '1 → many',
    notes: 'Captures machine inventory per service provider, including manufacturer/model, material, and count type.'
  },
  {
    source: 'Company Information',
    target: 'SP Pricing',
    join: 'CompanyID',
    cardinality: '1 → many',
    notes: 'Service quote history (order/delivery, lead time, material) rolls up to the company for pricing benchmarks.'
  },
  {
    source: 'Company Information',
    target: 'MP Pricing',
    join: 'CompanyID',
    cardinality: '1 → many',
    notes: 'Material pricing observations (form, class, subclass) align with the supplying company.'
  },
  {
    source: 'Company Information',
    target: 'Company Revenue',
    join: 'CompanyID',
    cardinality: '1 → many',
    notes: 'Financial metrics per fiscal period, normalized using currency conversion rates.'
  },
  {
    source: 'Company Information',
    target: 'Company Contact',
    join: 'CompanyName (maps via CompanyID)',
    cardinality: '1 → many',
    notes: 'Tracks outreach touchpoints and last interaction year for each company.'
  },
  {
    source: 'Company Information',
    target: 'SM Sales',
    join: 'CompanyName / CompanyID',
    cardinality: '1 → many',
    notes: 'System shipment volumes contextualize pricing and adoption trends per company.'
  },
  {
    source: 'Company Information',
    target: 'M&A Data',
    join: 'AcquiredCompany / AcquiringCompany',
    cardinality: 'many ↔ many',
    notes: 'Both acquired and acquiring names map back to company master records for deal analytics.'
  },
  {
    source: 'Company Information',
    target: 'Company_mapping_onetomany',
    join: 'CompanyID / AlternateID',
    cardinality: '1 → many',
    notes: 'Establishes alias resolution across legacy IDs and regional brands.'
  },
  {
    source: 'Currency Conversion',
    target: 'Company Revenue',
    join: 'NativeCurrency = XtoUSD + Year',
    cardinality: 'many → many',
    notes: 'Applies yearly FX rates to convert native revenue into USD for reporting.'
  },
  {
    source: 'Currency Conversion',
    target: 'Trade Data',
    join: 'Source Currency = XtoUSD + Year',
    cardinality: 'many → many',
    notes: 'Normalizes customs values into USD for import/export comparisons.'
  },
  {
    source: 'Company Mapping One-to-Many',
    target: 'Company Locations',
    join: 'AlternateID',
    cardinality: '1 → many',
    notes: 'Alias IDs roll up to their unified company location entries.'
  }
] as const

export const betaDataTypes = [
  { table: 'Core', field: 'CompanyID', dataType: 'string (PK)' },
  { table: 'Core', field: 'CompanyName', dataType: 'string' },
  { table: 'Core', field: 'Website', dataType: 'string' },
  { table: 'Core', field: 'HeadquarterCountry', dataType: 'string' },
  { table: 'Core', field: 'OwnedBySubsidiaryOf', dataType: 'string (FK → CompanyID)' },
  { table: 'Core', field: 'Status', dataType: 'enum' },
  { table: 'Core', field: 'PublicStockTicker', dataType: 'string' },
  { table: 'Core', field: 'HeadquarterAddress', dataType: 'string' },
  { table: 'Core', field: 'FoundingYear', dataType: 'date/year' },
  { table: 'Roles', field: 'Category', dataType: 'enum' },
  { table: 'Locations / Aliases', field: 'CompanyNamec (PrimaryName)', dataType: 'string (PK → CompanyID)' },
  { table: 'Locations / Aliases', field: 'AlternateName', dataType: 'string (FK → AlternateID)' },
  { table: 'Locations / Aliases', field: 'LocationType', dataType: 'enum (e.g., HQ, Branch, Mailing)' },
  { table: 'Locations / Aliases', field: 'Address', dataType: 'string' },
  { table: 'Employee Count', field: 'CountType', dataType: 'enum (e.g., Total company count, AM specific count etc)' },
  { table: 'Employee Count', field: 'Employees', dataType: 'integer' },
  { table: 'Employee Count', field: 'DateUpdate', dataType: 'date' },
  { table: 'Employee Count', field: 'Source', dataType: 'enum / string' },
  { table: 'SM Details', field: 'Process', dataType: 'enum' },
  { table: 'SM Details', field: 'MaterialFormat', dataType: 'enum / string' },
  { table: 'SM Details', field: 'MaterialType', dataType: 'enum / string' },
  { table: 'SP – EU Details', field: 'PrinterManufacturer', dataType: 'string' },
  { table: 'SP – EU Details', field: 'PrinterModel', dataType: 'string' },
  { table: 'SP – EU Details', field: 'Process', dataType: 'enum' },
  { table: 'SP – EU Details', field: 'MaterialType', dataType: 'enum / string' },
  { table: 'SP – EU Details', field: 'NumberOfPrinters', dataType: 'integer' },
  { table: 'SP – EU Details', field: 'CountType', dataType: 'enum' },
  { table: 'SP – EU Details', field: 'Source', dataType: 'enum / string' },
  { table: 'SP – EU Details', field: 'UpdateYear', dataType: 'date / year' },
  { table: 'SP Pricing', field: 'Material_type', dataType: 'enum / string' },
  { table: 'SP Pricing', field: 'Material', dataType: 'string' },
  { table: 'SP Pricing', field: 'Process', dataType: 'enum' },
  { table: 'SP Pricing', field: 'Volume_cm3', dataType: 'decimal' },
  { table: 'SP Pricing', field: 'Mfg', dataType: 'string' },
  { table: 'SP Pricing', field: 'Shipping', dataType: 'string' },
  { table: 'SP Pricing', field: 'DayOrdered', dataType: 'date' },
  { table: 'SP Pricing', field: 'DeliveryDate', dataType: 'date' },
  { table: 'SP Pricing', field: 'LeadTime_Days', dataType: 'integer' },
  { table: 'SP Pricing', field: 'Comments', dataType: 'string' },
  { table: 'MP Pricing', field: 'Date', dataType: 'date' },
  { table: 'MP Pricing', field: 'Material', dataType: 'enum / string (or FK → MaterialID)' },
  { table: 'MP Pricing', field: 'MaterialClass', dataType: 'enum / string' },
  { table: 'MP Pricing', field: 'MaterialSubclass', dataType: 'enum / string' },
  { table: 'MP Pricing', field: 'Form', dataType: 'enum / string' },
  { table: 'MP Pricing', field: 'Size', dataType: 'string / decimal' },
  { table: 'MP Pricing', field: 'Process', dataType: 'enum' },
  { table: 'MP Pricing', field: 'Quantity_kg', dataType: 'decimal' },
  { table: 'MP Pricing', field: 'Price_USD_per_kg', dataType: 'decimal' },
  { table: 'MP Pricing', field: 'Source', dataType: 'enum / string' },
  { table: 'Company Contact', field: 'ContactName', dataType: 'string' },
  { table: 'Company Contact', field: 'Email', dataType: 'string' },
  { table: 'Company Contact', field: 'Interaction', dataType: 'enum / string (e.g., call, email, meeting)' },
  { table: 'Company Contact', field: 'YearOfLastInteraction', dataType: 'date / year' },
  { table: 'Currency Conversion', field: 'XtoUSD', dataType: 'string (e.g., EUR→USD)' },
  { table: 'Currency Conversion', field: 'Rate', dataType: 'decimal' },
  { table: 'Currency Conversion', field: 'Year', dataType: 'integer / year' },
  { table: 'SM Sales', field: 'Date', dataType: 'date' },
  { table: 'SM Sales', field: 'Year', dataType: 'integer / year' },
  { table: 'SM Sales', field: 'Systems', dataType: 'string / enum' },
  { table: 'SM Sales', field: 'PeriodCumulative', dataType: 'integer / decimal' },
  { table: 'SM Sales', field: 'Units', dataType: 'integer' },
  { table: 'SM Sales', field: 'Measure', dataType: 'enum (e.g., units, USD)' },
  { table: 'SM Sales', field: 'Source', dataType: 'enum / string' },
  { table: 'Company Revenue', field: 'FinancialMetric', dataType: 'enum (e.g., Revenue, ARR)' },
  { table: 'Company Revenue', field: 'MetricType', dataType: 'enum (e.g., Annual, Quarterly)' },
  { table: 'Company Revenue', field: 'RevenueNativeCurrency', dataType: 'decimal' },
  { table: 'Company Revenue', field: 'NativeCurrency', dataType: 'enum (ISO code)' },
  { table: 'Company Revenue', field: 'RevenueUSD', dataType: 'decimal' },
  { table: 'Company Revenue', field: 'EstimateActual', dataType: 'enum (Estimate, Actual)' },
  { table: 'Company Revenue', field: 'Period', dataType: 'date' },
  { table: 'Company Revenue', field: 'Source', dataType: 'enum / string' },
  { table: 'M&A Data', field: 'MergerOrInvestment', dataType: 'enum (Merger, Acquisition, Investment)' },
  { table: 'M&A Data', field: 'DealDate', dataType: 'date' },
  { table: 'M&A Data', field: 'AcquiredCompany', dataType: 'string (FK → CompanyID)' },
  { table: 'M&A Data', field: 'AcquiringCompany', dataType: 'string (FK → CompanyID)' },
  { table: 'M&A Data', field: 'DealSize_M_USD', dataType: 'decimal' },
  { table: 'M&A Data', field: 'Country', dataType: 'string (name or ISO code)' },
  { table: 'Trade Data', field: 'Year', dataType: 'integer / year' },
  { table: 'Trade Data', field: 'Period', dataType: 'date / string (month/quarter)' },
  { table: 'Trade Data', field: 'ProductCode', dataType: 'string (HS/SITC/SKU)' },
  { table: 'Trade Data', field: 'ProductDescription', dataType: 'string' },
  { table: 'Trade Data', field: 'ReporterName', dataType: 'string' },
  { table: 'Trade Data', field: 'PartnerName', dataType: 'string' },
  { table: 'Trade Data', field: 'TradeFlowType', dataType: 'enum (Import, Export)' },
  { table: 'Trade Data', field: 'Value', dataType: 'decimal' },
  { table: 'Trade Data', field: 'Source', dataType: 'enum / string' }
] as const
