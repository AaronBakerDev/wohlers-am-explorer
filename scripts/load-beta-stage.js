#!/usr/bin/env node

/**
 * Load Beta Workbook Data into staging schema
 *
 * - Reads the Process & Documentation Excel workbook and other Beta datasets
 * - Validates column types according to inferred definitions
 * - Inserts data into the `beta_stage` schema
 */

const path = require('path')
const fs = require('fs')
const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const BASE_DIR = path.join(__dirname, '..', 'docs', 'schema')
const COMPANY_WORKBOOK = path.join(BASE_DIR, 'FINAL_Company_data (1).xlsx')
const MARKET_WORKBOOK = path.join(BASE_DIR, 'FINAL_Market_data (1).xlsx')
const TRADE_WORKBOOK = path.join(BASE_DIR, 'Trade data (1).xlsx')
const BETA_WORKBOOK = path.join(__dirname, '..', 'docs', 'project-documents', 'Beta', 'Process_and_Documentation.xlsx')

function readWorkbook(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Workbook not found: ${filePath}`)
    process.exit(1)
  }
  return XLSX.readFile(filePath, { cellDates: true })
}

function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const cleaned = typeof value === 'string' ? value.replace(/[^0-9.\-]/g, '') : value
  const num = Number(cleaned)
  return Number.isNaN(num) ? null : num
}

function cleanString(value) {
  if (value === null || value === undefined) return null
  const str = String(value).trim()
  if (str === '' || str === '-' || str.toLowerCase() === 'n/a') return null
  return str
}

function chunk(array, size = 500) {
  const output = []
  for (let i = 0; i < array.length; i += size) {
    output.push(array.slice(i, i + size))
  }
  return output
}

function sheetToJson(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) {
    console.warn(`⚠️  Sheet ${sheetName} not found`)
    return []
  }
  return XLSX.utils.sheet_to_json(sheet, { raw: false, defval: null })
}

function parseCompanyData() {
  const wb = readWorkbook(COMPANY_WORKBOOK)

  const companies = sheetToJson(wb, 'Company Information')
    .map((row) => ({
      company_id: cleanString(row.CompanyID),
      company_name: cleanString(row.CompanyName) ?? 'Unknown Company',
      website: cleanString(row.Website),
      headquarter_country: cleanString(row.HeadquarterCountry),
      owned_by_subsidiary_of: cleanString(row.OwnedBySubsidiaryOf),
      status: cleanString(row.Status),
      public_stock_ticker: cleanString(row.PublicStockTicker),
      address: cleanString(row.Address),
      founding_year: toNumber(row.FoundingYear)
    }))
    .filter((row) => row.company_id)

  const roles = sheetToJson(wb, 'Company Roles')
    .map((row) => ({
      company_id: cleanString(row.CompanyID),
      category: cleanString(row.Category),
      company_name: cleanString(row.CompanyName)
    }))
    .filter((row) => row.company_id && row.category)

  const locations = sheetToJson(wb, 'Company Locations')
    .map((row) => ({
      company_id: cleanString(row.CompanyID),
      alternate_id: cleanString(row.AlternateID),
      company_name: cleanString(row.CompanyName),
      alternate_name: cleanString(row.AlternateName),
      location_type: cleanString(row.LocationType),
      address: cleanString(row.Address)
    }))
    .filter((row) => row.company_id)

  const employeeCounts = sheetToJson(wb, 'Employee Count')
    .map((row) => ({
      company_id: cleanString(row.CompanyID),
      count_type: cleanString(row.CountType),
      employees: toNumber(row.Employees),
      date_updated: toDate(row.DateUpdate),
      source: cleanString(row.Source)
    }))
    .filter((row) => row.company_id)

  const systemDetails = sheetToJson(wb, 'SM Details')
    .map((row) => ({
      company_id: cleanString(row.CompanyID),
      process: cleanString(row.Process),
      material_format: cleanString(row.MaterialFormat),
      material_type: cleanString(row.MaterialType)
    }))
    .filter((row) => row.company_id)

  const serviceProviderMachines = sheetToJson(wb, 'SP - EU details')
    .map((row) => ({
      company_id: cleanString(row.CompanyID),
      printer_manufacturer: cleanString(row.PrinterManufacturer),
      printer_model: cleanString(row.PrinterModel),
      process: cleanString(row.Process),
      material_type: cleanString(row.MaterialType),
      number_of_printers: toNumber(row.NumberOfPrinters),
      count_type: cleanString(row.CountType),
      source: cleanString(row.Source),
      update_year: toNumber(row.UpdateYear)
    }))
    .filter((row) => row.company_id)

  const servicePricing = sheetToJson(wb, 'SP Pricing')
    .map((row) => ({
      company_id: cleanString(row.CompanyID),
      company_name: cleanString(row.CompanyName),
      material_category: cleanString(row.Material_type),
      material: cleanString(row.Material),
      process: cleanString(row.Process),
      volume_cm3: toNumber(row['Volume (cm3)']),
      manufacturing_cost: toNumber(row.Mfg),
      shipping_cost: toNumber(row.Shipping),
      day_ordered: toDate(row['Day ordered']),
      delivery_date: toDate(row['Delivery date']),
      lead_time_days: toNumber(row['Lead time']),
      comments: cleanString(row.Comments),
      data_source: 'FINAL_Company_data_SP_Pricing'
    }))
    .filter((row) => row.company_id || row.company_name)

  const materialPricing = sheetToJson(wb, 'MP Pricing')
    .map((row) => ({
      observation_date: toDate(row.Date),
      material: cleanString(row.Material),
      material_class: cleanString(row['Material class']),
      material_subclass: cleanString(row['Material subclass']),
      company_id: cleanString(row.CompanyID),
      company_name: cleanString(row.CompanyName),
      form: cleanString(row.Form),
      size: cleanString(row.Size),
      process: cleanString(row.Process),
      quantity_kg: toNumber(row['Quantity(kg)']),
      price_usd_per_kg: toNumber(row['Price($/kg)']),
      source: cleanString(row.Source)
    }))

  const companyRevenue = sheetToJson(wb, 'Company Revenue')
    .map((row) => ({
      company_id: cleanString(row.CompanyID),
      company_name: cleanString(row.CompanyName),
      financial_metric: cleanString(row.FinancialMetric),
      metric_type: cleanString(row.MetricType),
      revenue_native_currency: toNumber(row.RevenueNativeCurrency),
      native_currency: cleanString(row.NativeCurrency),
      revenue_usd: toNumber(row.RevenueUSD),
      estimate_actual: cleanString(row.EstimateActual),
      period: cleanString(row.Period),
      source: cleanString(row.Source)
    }))
    .filter((row) => row.company_id || row.company_name)

  const currencyConversion = sheetToJson(wb, 'Currency Conversion')
    .map((row) => ({
      currency_code: cleanString(row.XtoUSD),
      year: toNumber(row.Year),
      rate_to_usd: toNumber(row.Rate)
    }))
    .filter((row) => row.currency_code && row.year)

  const companyContacts = sheetToJson(wb, 'Company Contact Info')
    .map((row) => ({
      company_name: cleanString(row.CompanyName),
      contact_name: cleanString(row.ContactName),
      email: cleanString(row.Email),
      interaction: cleanString(row.Interaction),
      year_of_last_interaction: toNumber(row['Year of last interaction'])
    }))
    .filter((row) => row.company_name)

  const systemSales = sheetToJson(wb, 'SM Sales')
    .map((row) => ({
      record_date: toDate(row.Date),
      year: toNumber(row.Year),
      company_name: cleanString(row.CompanyName),
      systems: cleanString(row.Systems),
      period_cumulative: cleanString(row.PeriodCumulative),
      units: toNumber(row.Units),
      measure: cleanString(row.Measure),
      source: cleanString(row.Source)
    }))
    .filter((row) => row.company_name)

  const mergersAndAcquisitions = sheetToJson(wb, 'M& A Data')
    .map((row) => ({
      event_type: cleanString(row['Merger/Investment']),
      published_at: row.Published_at ? new Date(row.Published_at).toISOString() : null,
      deal_date: toDate(row['Deal Date']),
      acquired_company: cleanString(row['Acquired company']),
      acquiring_company: cleanString(row['Acquiring company']),
      deal_size: cleanString(row['Deal size']),
      details: cleanString(row.Details),
      additional_financial_info: cleanString(row['Additional financial info'])
    }))

  return {
    companies,
    roles,
    locations,
    employeeCounts,
    systemDetails,
    serviceProviderMachines,
    servicePricing,
    materialPricing,
    companyRevenue,
    currencyConversion,
    companyContacts,
    systemSales,
    mergersAndAcquisitions
  }
}

function parseTradeData() {
  const wb = readWorkbook(TRADE_WORKBOOK)
  const records = sheetToJson(wb, 'Records')
    .map((row) => ({
      year: toNumber(row.Year),
      period: cleanString(row.Period),
      product_code: cleanString(row.ProductCode),
      product_description: cleanString(row.ProductDescription),
      reporter_name: cleanString(row.ReporterName),
      partner_name: cleanString(row.PartnerName),
      trade_flow_type: cleanString(row.TradeFlowType),
      value: toNumber(row.Value),
      source: cleanString(row.Source)
    }))
    .filter((row) => row.year && row.product_code)
  return records
}

async function insertRecords(table, rows) {
  if (!rows.length) return
  console.log(`⬆️  Inserting ${rows.length} rows into beta_stage.${table}`)
  for (const batch of chunk(rows, 500)) {
    const { error } = await supabase.schema('beta_stage').from(table).insert(batch)
    if (error) {
      console.error(`❌ Failed inserting into beta_stage.${table}:`, error.message)
      process.exit(1)
    }
  }
}

async function main() {
  console.log('🚀 Loading Beta workbook data into staging schema')

  console.log('🔍 Parsing company workbook...')
  const companyData = parseCompanyData()

  console.log('📦 Clearing previous staging data (beta_stage schema)...')
  const tablesToClear = [
    'trade_records',
    'mergers_acquisitions',
    'system_sales',
    'company_contacts',
    'company_revenue_facts',
    'currency_conversion_rates',
    'material_pricing_observations',
    'service_pricing_quotes',
    'service_provider_machines',
    'system_material_details',
    'employee_counts',
    'company_locations',
    'company_roles',
    'companies'
  ]

  for (const table of tablesToClear) {
    const { error } = await supabase.schema('beta_stage').from(table).delete().neq('created_at', null)
    if (error && !error.message.includes('does not exist')) {
      console.error(`❌ Failed clearing beta_stage.${table}:`, error.message)
      process.exit(1)
    }
  }

  await insertRecords('companies', companyData.companies)
  await insertRecords('company_roles', companyData.roles)
  await insertRecords('company_locations', companyData.locations)
  await insertRecords('employee_counts', companyData.employeeCounts)
  await insertRecords('system_material_details', companyData.systemDetails)
  await insertRecords('service_provider_machines', companyData.serviceProviderMachines)
  await insertRecords('service_pricing_quotes', companyData.servicePricing)
  await insertRecords('material_pricing_observations', companyData.materialPricing)
  await insertRecords('company_revenue_facts', companyData.companyRevenue)
  await insertRecords('currency_conversion_rates', companyData.currencyConversion)
  await insertRecords('company_contacts', companyData.companyContacts)
  await insertRecords('system_sales', companyData.systemSales)
  await insertRecords('mergers_acquisitions', companyData.mergersAndAcquisitions)

  console.log('🔍 Parsing trade workbook...')
  const tradeRecords = parseTradeData()
  await insertRecords('trade_records', tradeRecords)

  console.log('✅ Beta staging load complete')
}

main().catch((err) => {
  console.error('❌ Loader failed:', err)
  process.exit(1)
})
