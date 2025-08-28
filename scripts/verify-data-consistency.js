const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Set data directory - matches the CSV mode config
const dataDir = process.env.DATA_DIR || path.join(__dirname, '../../project-documents/04-data/extracted-vendor-data')

function readJsonFile(fileName) {
  const fullPath = path.join(dataDir, fileName)
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Data file not found: ${fullPath}`)
  }
  const content = fs.readFileSync(fullPath, 'utf8')
  return JSON.parse(content)
}

function toNumber(v) {
  if (typeof v === 'number') return v
  if (v == null) return 0
  const s = String(v).replace(/[$,\s]/g, '')
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

async function verifyMarketTotals() {
  console.log('\\n🔍 Verifying Market Totals Data...')
  
  // CSV data
  const csvRows = readJsonFile('Total_AM_market_size.json')
  const csvCount = csvRows.filter(r => r && typeof r.Year === 'number' && r[' Past revenue (USD) '] != null).length
  
  // Supabase data
  const { data: supabaseRows, error } = await supabase
    .from('market_data')
    .select('*', { count: 'exact' })
    .in('data_type', ['revenue', 'forecast'])
    .eq('data_source', 'vendor_import_2025')
  
  if (error) {
    console.error('❌ Error fetching market data:', error)
    return false
  }
  
  console.log(`  CSV records: ${csvCount}`)
  console.log(`  Supabase records: ${supabaseRows.length}`)
  
  if (Math.abs(csvCount - supabaseRows.length) <= csvCount * 0.1) { // Allow 10% variance
    console.log('  ✅ Market totals data counts are consistent')
    return true
  } else {
    console.log('  ❌ Market totals data counts differ significantly')
    return false
  }
}

async function verifyCountryRevenue() {
  console.log('\\n🔍 Verifying Country Revenue Data...')
  
  // CSV data
  const csvRows = readJsonFile('AM_market_revenue_2024.json')
  const csvCount = csvRows.filter(r => r && r.Country && r[' Revenue (USD) '] != null).length
  
  // Supabase data
  const { data: supabaseRows, error } = await supabase
    .from('market_data')
    .select('*', { count: 'exact' })
    .eq('data_type', 'revenue')
    .eq('year', 2024)
    .not('country', 'is', null)
  
  if (error) {
    console.error('❌ Error fetching country revenue:', error)
    return false
  }
  
  console.log(`  CSV records: ${csvCount}`)
  console.log(`  Supabase records: ${supabaseRows.length}`)
  
  if (Math.abs(csvCount - supabaseRows.length) <= csvCount * 0.1) {
    console.log('  ✅ Country revenue data counts are consistent')
    return true
  } else {
    console.log('  ❌ Country revenue data counts differ significantly')
    return false
  }
}

async function verifyCompanies() {
  console.log('\\n🔍 Verifying Company Data...')
  
  // CSV data sources
  const companyInfo = readJsonFile('Company_information.json')
  const companyRoles = readJsonFile('Company_roles.json')
  const investments = readJsonFile('Fundings_and_investments.json')
  
  // Get unique company names from all CSV sources
  const csvCompanies = new Set()
  companyInfo.forEach(r => {
    const name = String(r['Company name'] || '').trim()
    if (name) csvCompanies.add(name)
  })
  companyRoles.forEach(r => {
    const name = String(r['Company name'] || '').trim()
    if (name) csvCompanies.add(name)
  })
  investments.forEach(r => {
    const name = String(r['Company name'] || '').trim()
    if (name) csvCompanies.add(name)
  })
  
  // Supabase data
  const { data: supabaseCompanies, error } = await supabase
    .from('companies')
    .select('name', { count: 'exact' })
  
  if (error) {
    console.error('❌ Error fetching companies:', error)
    return false
  }
  
  console.log(`  CSV unique companies: ${csvCompanies.size}`)
  console.log(`  Supabase companies: ${supabaseCompanies.length}`)
  
  if (Math.abs(csvCompanies.size - supabaseCompanies.length) <= csvCompanies.size * 0.15) { // Allow 15% variance
    console.log('  ✅ Company data counts are reasonably consistent')
    return true
  } else {
    console.log('  ❌ Company data counts differ significantly')
    return false
  }
}

async function verifyInvestments() {
  console.log('\\n🔍 Verifying Investment Data...')
  
  // CSV data
  const csvRows = readJsonFile('Fundings_and_investments.json')
  const csvCount = csvRows.filter(r => r && r['Company name'] && r['Year']).length
  
  // Supabase data
  const { data: supabaseRows, error } = await supabase
    .from('investments')
    .select('*', { count: 'exact' })
  
  if (error) {
    console.error('❌ Error fetching investments:', error)
    return false
  }
  
  console.log(`  CSV records: ${csvCount}`)
  console.log(`  Supabase records: ${supabaseRows.length}`)
  
  if (Math.abs(csvCount - supabaseRows.length) <= csvCount * 0.2) { // Allow 20% variance for company matching
    console.log('  ✅ Investment data counts are reasonably consistent')
    return true
  } else {
    console.log('  ❌ Investment data counts differ significantly')
    return false
  }
}

async function verifyServicePricing() {
  console.log('\\n🔍 Verifying Service Pricing Data...')
  
  // CSV data
  const csvRows = readJsonFile('Print_services_Pricing_data.json')
  const csvCount = csvRows.filter(r => r && r['Company name'] && r['Manufacturing cost'] != null).length
  
  // Supabase data
  const { data: supabaseRows, error } = await supabase
    .from('service_pricing')
    .select('*', { count: 'exact' })
    .eq('data_source', 'vendor_import_2025')
  
  if (error) {
    console.error('❌ Error fetching service pricing:', error)
    return false
  }
  
  console.log(`  CSV records: ${csvCount}`)
  console.log(`  Supabase records: ${supabaseRows.length}`)
  
  if (Math.abs(csvCount - supabaseRows.length) <= csvCount * 0.2) { // Allow 20% variance for company matching
    console.log('  ✅ Service pricing data counts are reasonably consistent')
    return true
  } else {
    console.log('  ❌ Service pricing data counts differ significantly')
    return false
  }
}

async function verifyTechnologiesMaterials() {
  console.log('\\n🔍 Verifying Technologies and Materials...')
  
  // CSV data
  const pricingData = readJsonFile('Print_services_Pricing_data.json')
  const csvTechnologies = new Set()
  const csvMaterials = new Set()
  
  pricingData.forEach(row => {
    const process = String(row['Process'] || '').trim()
    const material = String(row['Material type'] || row['Material'] || '').trim()
    if (process) csvTechnologies.add(process)
    if (material) csvMaterials.add(material)
  })
  
  // Supabase data
  const { data: supabaseTech, error: techError } = await supabase
    .from('technologies')
    .select('name', { count: 'exact' })
  
  const { data: supabaseMat, error: matError } = await supabase
    .from('materials')
    .select('name', { count: 'exact' })
  
  if (techError || matError) {
    console.error('❌ Error fetching technologies/materials:', techError || matError)
    return false
  }
  
  console.log(`  CSV technologies: ${csvTechnologies.size}`)
  console.log(`  Supabase technologies: ${supabaseTech.length}`)
  console.log(`  CSV materials: ${csvMaterials.size}`)
  console.log(`  Supabase materials: ${supabaseMat.length}`)
  
  const techMatch = csvTechnologies.size === supabaseTech.length
  const matMatch = csvMaterials.size === supabaseMat.length
  
  if (techMatch && matMatch) {
    console.log('  ✅ Technologies and materials counts match exactly')
    return true
  } else {
    console.log('  ❌ Technologies and materials counts do not match')
    return false
  }
}

async function sampleDataComparison() {
  console.log('\\n🔍 Sample Data Value Verification...')
  
  // Check a few sample market totals values
  const csvTotals = readJsonFile('Total_AM_market_size.json')
  const sampleRow = csvTotals.find(r => r.Year === 2024 && r.Type === 'Past revenue' && r.Segment === 'Total')
  
  if (sampleRow) {
    const csvValue = toNumber(sampleRow[' Past revenue (USD) '])
    
    const { data: supabaseRow, error } = await supabase
      .from('market_data')
      .select('value_usd')
      .eq('year', 2024)
      .eq('data_type', 'revenue')
      .eq('segment', 'Total')
      .limit(1)
    
    if (!error && supabaseRow && supabaseRow.length > 0) {
      const supabaseValue = supabaseRow[0].value_usd
      console.log(`  Sample 2024 Total Revenue - CSV: $${csvValue}, Supabase: $${supabaseValue}`)
      
      if (Math.abs(csvValue - supabaseValue) < csvValue * 0.01) { // 1% tolerance
        console.log('  ✅ Sample values match within tolerance')
        return true
      } else {
        console.log('  ❌ Sample values differ significantly')
        return false
      }
    }
  }
  
  console.log('  ⚠️  Could not find sample data for comparison')
  return true // Don't fail on this
}

async function main() {
  try {
    console.log('🔍 Starting data consistency verification...')
    console.log('CSV data source:', dataDir)
    
    const checks = []
    
    checks.push(await verifyMarketTotals())
    checks.push(await verifyCountryRevenue())
    checks.push(await verifyCompanies())
    checks.push(await verifyInvestments())
    checks.push(await verifyServicePricing())
    checks.push(await verifyTechnologiesMaterials())
    checks.push(await sampleDataComparison())
    
    const passed = checks.filter(Boolean).length
    const total = checks.length
    
    console.log(`\\n📊 Verification Summary:`)
    console.log(`  Passed: ${passed}/${total} checks`)
    
    if (passed === total) {
      console.log('\\n✅ All data consistency checks passed!')
      console.log('CSV mode and Supabase contain consistent data.')
    } else if (passed >= total * 0.7) {
      console.log('\\n⚠️  Most data consistency checks passed.')
      console.log('There may be minor discrepancies but data is largely consistent.')
    } else {
      console.log('\\n❌ Multiple data consistency checks failed.')
      console.log('Significant discrepancies found between CSV and Supabase data.')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('\\n❌ Verification failed:', error.message)
    process.exit(1)
  }
}

// Run the verification
main()