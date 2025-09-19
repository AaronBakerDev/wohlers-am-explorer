#!/usr/bin/env node

/**
 * Offline data-quality checks for the Beta workbook datasets.
 * Reads the Excel workbooks directly and reports validation issues without needing Supabase access.
 */

const path = require('path')
const fs = require('fs')
const XLSX = require('xlsx')

const BASE_DIR = path.join(__dirname, '..', 'docs', 'schema')
const COMPANY_WORKBOOK = path.join(BASE_DIR, 'FINAL_Company_data (1).xlsx')
const MARKET_WORKBOOK = path.join(BASE_DIR, 'FINAL_Market_data (1).xlsx')
const TRADE_WORKBOOK = path.join(BASE_DIR, 'Trade data (1).xlsx')

function readWorkbook(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Workbook not found: ${filePath}`)
  }
  return XLSX.readFile(filePath, { cellDates: true })
}

function sheetToJson(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) {
    return []
  }
  return XLSX.utils.sheet_to_json(sheet, { raw: false, defval: null })
}

function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
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

function analyseCompanyWorkbook() {
  const wb = readWorkbook(COMPANY_WORKBOOK)
  const issues = {
    companiesMissingId: [],
    duplicateCompanyIds: [],
    rolesMissingCategory: [],
    locationsMissingAlternateId: [],
    employeeCountsMissingDate: [],
    negativeLeadTimes: [],
    longLeadTimes: [],
    servicePricingMissingDates: [],
    materialPricingMissingPrice: [],
    revenueMissingCurrency: [],
    currencyDuplicateYear: [],
    contactsMissingEmail: [],
    smSalesMissingUnits: []
  }

  const companies = sheetToJson(wb, 'Company Information')
  const idCounts = new Map()

  companies.forEach((row, index) => {
    const id = cleanString(row.CompanyID)
    if (!id) {
      issues.companiesMissingId.push({ row: index + 2, company: cleanString(row.CompanyName) })
    } else {
      idCounts.set(id, (idCounts.get(id) || 0) + 1)
    }
  })

  for (const [id, count] of idCounts.entries()) {
    if (count > 1) {
      issues.duplicateCompanyIds.push({ company_id: id, occurrences: count })
    }
  }

  const roles = sheetToJson(wb, 'Company Roles')
  roles.forEach((row, index) => {
    if (!cleanString(row.Category)) {
      issues.rolesMissingCategory.push({ row: index + 2, company_id: cleanString(row.CompanyID) })
    }
  })

  const locations = sheetToJson(wb, 'Company Locations')
  locations.forEach((row, index) => {
    if (!cleanString(row.AlternateID)) {
      issues.locationsMissingAlternateId.push({ row: index + 2, company_id: cleanString(row.CompanyID) })
    }
  })

  const employeeCounts = sheetToJson(wb, 'Employee Count')
  employeeCounts.forEach((row, index) => {
    if (!toDate(row.DateUpdate)) {
      issues.employeeCountsMissingDate.push({ row: index + 2, company_id: cleanString(row.CompanyID) })
    }
  })

  const servicePricing = sheetToJson(wb, 'SP Pricing')
  servicePricing.forEach((row, index) => {
    const leadTime = toNumber(row['Lead time'])
    if (leadTime !== null) {
      if (leadTime < 0) {
        issues.negativeLeadTimes.push({ row: index + 2, company: cleanString(row.CompanyName), leadTime })
      } else if (leadTime > 180) {
        issues.longLeadTimes.push({ row: index + 2, company: cleanString(row.CompanyName), leadTime })
      }
    }

    const dayOrdered = toDate(row['Day ordered'])
    const deliveryDate = toDate(row['Delivery date'])
    if (!dayOrdered || !deliveryDate) {
      issues.servicePricingMissingDates.push({ row: index + 2, company: cleanString(row.CompanyName) })
    }
  })

  const materialPricing = sheetToJson(wb, 'MP Pricing')
  materialPricing.forEach((row, index) => {
    if (toNumber(row['Price($/kg)']) === null) {
      issues.materialPricingMissingPrice.push({ row: index + 2, company: cleanString(row.CompanyName), material: cleanString(row.Material) })
    }
  })

  const companyRevenue = sheetToJson(wb, 'Company Revenue')
  companyRevenue.forEach((row, index) => {
    if (!cleanString(row.NativeCurrency)) {
      issues.revenueMissingCurrency.push({ row: index + 2, company: cleanString(row.CompanyName), period: row.Period })
    }
  })

  const currencyConversion = sheetToJson(wb, 'Currency Conversion')
  const seenCurrencyYear = new Set()
  currencyConversion.forEach((row, index) => {
    const currency = cleanString(row.XtoUSD)
    const year = toNumber(row.Year)
    const key = currency && year ? `${currency}-${year}` : null
    if (!currency || !year) {
      issues.currencyDuplicateYear.push({ row: index + 2, reason: 'Missing currency or year' })
    } else if (seenCurrencyYear.has(key)) {
      issues.currencyDuplicateYear.push({ row: index + 2, currency, year, reason: 'Duplicate pair' })
    } else {
      seenCurrencyYear.add(key)
    }
  })

  const contacts = sheetToJson(wb, 'Company Contact Info')
  contacts.forEach((row, index) => {
    if (!cleanString(row.Email)) {
      issues.contactsMissingEmail.push({ row: index + 2, company: cleanString(row.CompanyName) })
    }
  })

  const systemSales = sheetToJson(wb, 'SM Sales')
  systemSales.forEach((row, index) => {
    if (toNumber(row.Units) === null && cleanString(row.Measure) !== 'USD') {
      issues.smSalesMissingUnits.push({ row: index + 2, company: cleanString(row.CompanyName), year: row.Year })
    }
  })

  const mergers = sheetToJson(wb, 'M& A Data')
  const missingCompanyIds = mergers.filter((row) => !cleanString(row['Acquired company']) || !cleanString(row['Acquiring company']))

  return { issues, totals: {
    companies: companies.length,
    roles: roles.length,
    locations: locations.length,
    employeeCounts: employeeCounts.length,
    servicePricing: servicePricing.length,
    materialPricing: materialPricing.length,
    companyRevenue: companyRevenue.length,
    currencyConversion: currencyConversion.length,
    contacts: contacts.length,
    systemSales: systemSales.length,
    mergers: mergers.length,
    mergersMissingNames: missingCompanyIds.length
  }}
}

function analyseMarketWorkbook() {
  const wb = readWorkbook(MARKET_WORKBOOK)
  const revenue2024 = sheetToJson(wb, 'AM market revenue 2024')
  const totals = sheetToJson(wb, 'Total AM market size')
  const revenueByIndustry = sheetToJson(wb, 'Revenue by industry 2024')
  const funding = sheetToJson(wb, 'Fundings and investments')

  const issues = {
    revenueMissingCountry: [],
    totalsMissingType: [],
    industryMissingShare: [],
    fundingMissingAmount: []
  }

  revenue2024.forEach((row, index) => {
    if (!cleanString(row.Country)) {
      issues.revenueMissingCountry.push({ row: index + 2, segment: cleanString(row.Segment) })
    }
  })

  totals.forEach((row, index) => {
    if (!cleanString(row.Type)) {
      issues.totalsMissingType.push({ row: index + 2, year: row.Year })
    }
  })

  revenueByIndustry.forEach((row, index) => {
    if (toNumber(row['Revenue (USD)']) === null) {
      issues.industryMissingShare.push({ row: index + 2, industry: cleanString(row.Industry) })
    }
  })

  funding.forEach((row, index) => {
    if (toNumber(row['Amount (in millions USD)']) === null) {
      issues.fundingMissingAmount.push({ row: index + 2, company: cleanString(row['Company name']) })
    }
  })

  return { issues, totals: {
    revenue2024: revenue2024.length,
    marketTotals: totals.length,
    industryRows: revenueByIndustry.length,
    fundingRows: funding.length
  }}
}

function analyseTradeWorkbook() {
  const wb = readWorkbook(TRADE_WORKBOOK)
  const records = sheetToJson(wb, 'Records')
  const issues = {
    missingReporter: [],
    missingPartner: [],
    missingValue: []
  }

  records.forEach((row, index) => {
    if (!cleanString(row.ReporterName)) {
      issues.missingReporter.push({ row: index + 2, product: cleanString(row.ProductDescription) })
    }
    if (!cleanString(row.PartnerName)) {
      issues.missingPartner.push({ row: index + 2, reporter: cleanString(row.ReporterName) })
    }
    if (toNumber(row.Value) === null) {
      issues.missingValue.push({ row: index + 2, reporter: cleanString(row.ReporterName), partner: cleanString(row.PartnerName) })
    }
  })

  return { issues, totals: { tradeRows: records.length } }
}

function printIssueSummary(title, issues) {
  console.log(`\n### ${title}`)
  const entries = Object.entries(issues)
  entries.forEach(([key, arr]) => {
    if (!arr.length) return
    console.log(`- ${key}: ${arr.length}`)
  })
  if (!entries.some(([, arr]) => arr.length)) {
    console.log('- No issues detected')
  }
}

function main() {
  console.log('🧪 Running Beta data quality checks (offline)')

  const companyResults = analyseCompanyWorkbook()
  const marketResults = analyseMarketWorkbook()
  const tradeResults = analyseTradeWorkbook()

  console.log('\n== Totals ==')
  console.log(companyResults.totals)
  console.log(marketResults.totals)
  console.log(tradeResults.totals)

  printIssueSummary('Company workbook issues', companyResults.issues)
  printIssueSummary('Market workbook issues', marketResults.issues)
  printIssueSummary('Trade workbook issues', tradeResults.issues)

  const blockers = []
  if (companyResults.issues.companiesMissingId.length) blockers.push('Companies missing CompanyID')
  if (companyResults.issues.duplicateCompanyIds.length) blockers.push('Duplicate CompanyID values')
  if (companyResults.issues.negativeLeadTimes.length) blockers.push('Negative lead times in service pricing')
  if (companyResults.issues.currencyDuplicateYear.length) blockers.push('Problems with currency conversion rows')
  if (tradeResults.issues.missingValue.length) blockers.push('Trade rows missing value')

  console.log('\n== Summary ==')
  if (blockers.length) {
    console.log('⚠️  Potential blockers before migration:')
    blockers.forEach((item) => console.log(` - ${item}`))
  } else {
    console.log('✅ No critical blockers detected in workbook data.')
  }

  console.log('\nDetailed results saved to console output.')
}

main()
