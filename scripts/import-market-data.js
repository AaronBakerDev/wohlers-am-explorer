const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Initialize Supabase client with service role for data import
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Using key:', supabaseServiceKey ? 'Found' : 'Missing')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Need NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Set data directory - matches the CSV mode config
const dataDir = process.env.DATA_DIR || path.join(__dirname, '../../project-documents/04-data/extracted-vendor-data')

console.log('Data directory:', dataDir)

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

// Normalize segment names to match CSV logic
const SEGMENT_ALIASES = {
  'printing services': 'Printing services',
  'printing service provider': 'Printing services',
  'system manufacturer': 'Printer sales & servicing',
  'systems manufacturer': 'Printer sales & servicing',
  'materials': 'Materials',
  'material': 'Materials',
  'material provider': 'Materials',
  'materials provider': 'Materials',
  'software': 'Software',
  'total': 'Total',
}

function canonicalSegment(input) {
  const key = input.toLowerCase().trim()
  return SEGMENT_ALIASES[key] || input
}

function normCountry(input) {
  const s = String(input || '').trim()
  if (!s) return s
  // United States
  if (s === 'U.S.' || s === 'US' || s === 'USA' || s === 'United States of America') return 'United States'
  // United Kingdom
  if (s === 'U.K.' || s === 'UK') return 'United Kingdom'
  // Korea
  if (s === 'Korea, Rep.' || s === 'Republic of Korea' || s === 'Korea (Republic of)') return 'South Korea'
  if (s === "Korea, Dem. People's Rep." || s === 'Korea, Democratic People\'s Republic of') return 'North Korea'
  // Russia
  if (s === 'Russian Federation') return 'Russia'
  // Vietnam
  if (s === 'Viet Nam') return 'Vietnam'
  // Czech Republic
  if (s === 'Czechia') return 'Czech Republic'
  // China
  if (s === 'People\'s Republic of China' || s === 'Mainland China' || s === 'China, Mainland' || s === 'PRC') return 'China'
  // Taiwan
  if (s === 'Taiwan, Province of China' || s === 'Taiwan (Province of China)' || s === 'Chinese Taipei') return 'Taiwan'
  return s
}

async function clearExistingMarketData() {
  console.log('Clearing existing market data...')
  const { error } = await supabase
    .from('market_data')
    .delete()
    .eq('data_source', 'vendor_import_2025')
  
  if (error) {
    throw new Error(`Failed to clear market data: ${error.message}`)
  }
  console.log('✓ Existing market data cleared')
}

async function importTotalMarketSize() {
  console.log('\\nImporting total market size data...')
  
  const rows = readJsonFile('Total_AM_market_size.json')
  const marketData = []
  
  for (const row of rows) {
    if (!row || typeof row.Year !== 'number' || typeof row.Segment !== 'string') continue
    if (row[' Past revenue (USD) '] == null) continue
    
    const year = row.Year
    const type = String(row.Type || '').trim()
    const segment = canonicalSegment(String(row.Segment || '').trim())
    const value = toNumber(row[' Past revenue (USD) '])
    
    if (!type || !segment || value === 0) continue
    
    marketData.push({
      data_type: type === 'Past revenue' ? 'revenue' : 'forecast',
      year,
      segment,
      value_usd: value,
      data_source: 'vendor_import_2025'
    })
  }
  
  console.log(`Processing ${marketData.length} total market size records...`)
  
  // Insert in batches
  const BATCH_SIZE = 100
  for (let i = 0; i < marketData.length; i += BATCH_SIZE) {
    const batch = marketData.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('market_data')
      .insert(batch)
    
    if (error) {
      console.error('Batch error:', error)
      throw new Error(`Failed to insert market data batch: ${error.message}`)
    }
  }
  
  console.log(`✓ Imported ${marketData.length} total market size records`)
}

async function importCountryRevenue() {
  console.log('\\nImporting country revenue data...')
  
  const rows = readJsonFile('AM_market_revenue_2024.json')
  const marketData = []
  
  for (const row of rows) {
    if (!row || !row.Country || !row.Segment) continue
    if (row[' Revenue (USD) '] == null) continue
    
    const country = normCountry(String(row.Country).trim())
    const segment = canonicalSegment(String(row.Segment).trim())
    const value = toNumber(row[' Revenue (USD) '])
    
    if (!country || !segment || value === 0) continue
    
    marketData.push({
      data_type: 'revenue',
      year: 2024,
      segment,
      country,
      value_usd: value,
      data_source: 'vendor_import_2025'
    })
  }
  
  console.log(`Processing ${marketData.length} country revenue records...`)
  
  // Insert in batches
  const BATCH_SIZE = 100
  for (let i = 0; i < marketData.length; i += BATCH_SIZE) {
    const batch = marketData.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('market_data')
      .insert(batch)
    
    if (error) {
      console.error('Batch error:', error)
      throw new Error(`Failed to insert country revenue batch: ${error.message}`)
    }
  }
  
  console.log(`✓ Imported ${marketData.length} country revenue records`)
}

async function importIndustryRevenue() {
  console.log('\\nImporting industry revenue data...')
  
  try {
    const rows = readJsonFile('Revenue_by_industry_2024.json')
    const marketData = []
    
    for (const row of rows) {
      if (!row || !row.Industry) continue
      if (row[' Revenue (USD) '] == null) continue
      
      const industry = String(row.Industry).trim()
      const value = toNumber(row[' Revenue (USD) '])
      
      if (!industry || value === 0) continue
      
      marketData.push({
        data_type: 'revenue',
        year: 2024,
        industry,
        value_usd: value,
        data_source: 'vendor_import_2025'
      })
    }
    
    console.log(`Processing ${marketData.length} industry revenue records...`)
    
    // Insert in batches
    const BATCH_SIZE = 100
    for (let i = 0; i < marketData.length; i += BATCH_SIZE) {
      const batch = marketData.slice(i, i + BATCH_SIZE)
      const { error } = await supabase
        .from('market_data')
        .insert(batch)
      
      if (error) {
        console.error('Batch error:', error)
        throw new Error(`Failed to insert industry revenue batch: ${error.message}`)
      }
    }
    
    console.log(`✓ Imported ${marketData.length} industry revenue records`)
  } catch (error) {
    if (error.message.includes('not found')) {
      console.log('⚠ Revenue_by_industry_2024.json not found, skipping industry revenue import')
    } else {
      throw error
    }
  }
}

async function importCompanyInformation() {
  console.log('\\nImporting/updating company information...')
  
  const rows = readJsonFile('Company_information.json')
  const companies = []
  
  for (const row of rows) {
    const name = String(row['Company name'] || '').trim()
    if (!name) continue
    
    const website = row['Website'] ? String(row['Website']).trim() : null
    const headquarters = row['Headquarters'] ? normCountry(String(row['Headquarters']).trim()) : null
    
    companies.push({
      name,
      website,
      country: headquarters
    })
  }
  
  console.log(`Processing ${companies.length} company records...`)
  
  // Use upsert to handle duplicates
  const BATCH_SIZE = 100
  let inserted = 0
  let updated = 0
  
  for (let i = 0; i < companies.length; i += BATCH_SIZE) {
    const batch = companies.slice(i, i + BATCH_SIZE)
    
    for (const company of batch) {
      // Try to find existing company by name
      const { data: existing, error: findError } = await supabase
        .from('companies')
        .select('id')
        .eq('name', company.name)
        .limit(1)
      
      if (findError) {
        console.error('Error finding company:', findError)
        continue
      }
      
      if (existing && existing.length > 0) {
        // Update existing
        const { error: updateError } = await supabase
          .from('companies')
          .update({
            website: company.website,
            country: company.country,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing[0].id)
        
        if (updateError) {
          console.error('Error updating company:', updateError)
        } else {
          updated++
        }
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('companies')
          .insert(company)
        
        if (insertError) {
          console.error('Error inserting company:', insertError)
        } else {
          inserted++
        }
      }
    }
  }
  
  console.log(`✓ Company information: ${inserted} inserted, ${updated} updated`)
}

async function importCompanyCategories() {
  console.log('\\nImporting company categories...')
  
  const rows = readJsonFile('Company_roles.json')
  
  // First, get all existing companies to map names to IDs
  const { data: companies, error: compError } = await supabase
    .from('companies')
    .select('id, name')
  
  if (compError) {
    throw new Error(`Failed to fetch companies: ${compError.message}`)
  }
  
  const companyMap = new Map()
  companies.forEach(c => companyMap.set(c.name, c.id))
  
  const categories = []
  
  for (const row of rows) {
    const companyName = String(row['Company name'] || '').trim()
    const category = String(row['Category'] || '').trim()
    
    if (!companyName || !category) continue
    
    const companyId = companyMap.get(companyName)
    if (!companyId) {
      console.log(`⚠ Company not found: ${companyName}`)
      continue
    }
    
    categories.push({
      company_id: companyId,
      category,
      is_primary: false // We could enhance this logic later
    })
  }
  
  console.log(`Processing ${categories.length} company category records...`)
  
  // Clear existing categories first
  const { error: clearError } = await supabase
    .from('company_categories')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
  
  if (clearError) {
    console.error('Error clearing categories:', clearError)
  }
  
  // Insert in batches
  const BATCH_SIZE = 100
  for (let i = 0; i < categories.length; i += BATCH_SIZE) {
    const batch = categories.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('company_categories')
      .insert(batch)
    
    if (error) {
      console.error('Batch error:', error)
    }
  }
  
  console.log(`✓ Imported ${categories.length} company categories`)
}

async function importInvestments() {
  console.log('\\nImporting investment data...')
  
  const rows = readJsonFile('Fundings_and_investments.json')
  
  // Get company mapping
  const { data: companies, error: compError } = await supabase
    .from('companies')
    .select('id, name')
  
  if (compError) {
    throw new Error(`Failed to fetch companies: ${compError.message}`)
  }
  
  const companyMap = new Map()
  companies.forEach(c => companyMap.set(c.name, c.id))
  
  const investments = []
  
  for (const row of rows) {
    const companyName = String(row['Company name'] || '').trim()
    const year = row['Year'] != null ? Number(row['Year']) : null
    const amount = toNumber(row['Amount (in millions USD)'])
    
    if (!companyName || !year || amount === 0) continue
    
    const companyId = companyMap.get(companyName)
    if (!companyId) {
      console.log(`⚠ Company not found for investment: ${companyName}`)
      continue
    }
    
    investments.push({
      company_id: companyId,
      investment_year: year,
      amount_millions: amount,
      funding_round: String(row['Funding round'] || '').trim() || null,
      lead_investor: String(row['Lead investor'] || '').trim() || null,
      country: String(row['Country'] || '').trim() || null,
      notes: String(row['Notes'] || '').trim() || null
    })
  }
  
  console.log(`Processing ${investments.length} investment records...`)
  
  // Clear existing investments first
  const { error: clearError } = await supabase
    .from('investments')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
  
  if (clearError) {
    console.error('Error clearing investments:', clearError)
  }
  
  // Insert in batches
  const BATCH_SIZE = 100
  for (let i = 0; i < investments.length; i += BATCH_SIZE) {
    const batch = investments.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('investments')
      .insert(batch)
    
    if (error) {
      console.error('Batch error:', error)
    }
  }
  
  console.log(`✓ Imported ${investments.length} investments`)
}

async function importMergerAcquisitions() {
  console.log('\\nImporting M&A data...')
  
  try {
    const rows = readJsonFile('M_A.json')
    
    // Get company mapping  
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('id, name')
    
    if (compError) {
      throw new Error(`Failed to fetch companies: ${compError.message}`)
    }
    
    const companyMap = new Map()
    companies.forEach(c => companyMap.set(c.name, c.id))
    
    const mergers = []
    
    for (const row of rows) {
      const acquiredName = String(row['Acquired company'] || '').trim()
      const acquiringName = String(row['Acquiring company'] || '').trim()
      
      if (!acquiredName || !acquiringName) continue
      
      const acquiredId = companyMap.get(acquiredName)
      const acquiringId = companyMap.get(acquiringName)
      
      mergers.push({
        acquired_company_name: acquiredName,
        acquiring_company_name: acquiringName,
        acquired_company_id: acquiredId,
        acquiring_company_id: acquiringId,
        announcement_date: row['Date'] ? String(row['Date']) : null,
        deal_size_millions: toNumber(row['Deal size (millions USD)']) || null,
        notes: String(row['Notes'] || '').trim() || null
      })
    }
    
    console.log(`Processing ${mergers.length} M&A records...`)
    
    // Clear existing M&A first
    const { error: clearError } = await supabase
      .from('mergers_acquisitions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (clearError) {
      console.error('Error clearing M&A:', clearError)
    }
    
    // Insert in batches
    const BATCH_SIZE = 100
    for (let i = 0; i < mergers.length; i += BATCH_SIZE) {
      const batch = mergers.slice(i, i + BATCH_SIZE)
      const { error } = await supabase
        .from('mergers_acquisitions')
        .insert(batch)
      
      if (error) {
        console.error('Batch error:', error)
      }
    }
    
    console.log(`✓ Imported ${mergers.length} M&A records`)
  } catch (error) {
    if (error.message.includes('not found')) {
      console.log('⚠ M_A.json not found, skipping M&A import')
    } else {
      throw error
    }
  }
}

async function importServicePricing() {
  console.log('\\nImporting service pricing data...')
  
  const rows = readJsonFile('Print_services_Pricing_data.json')
  
  // Get company mapping
  const { data: companies, error: compError } = await supabase
    .from('companies')
    .select('id, name')
  
  if (compError) {
    throw new Error(`Failed to fetch companies: ${compError.message}`)
  }
  
  const companyMap = new Map()
  companies.forEach(c => companyMap.set(c.name, c.id))
  
  const pricing = []
  
  for (const row of rows) {
    const companyName = String(row['Company name'] || '').trim()
    const process = String(row['Process'] || '').trim()
    const material = String(row['Material type'] || row['Material'] || '').trim()
    const quantity = Number(row['Quantity']) || null
    const price = toNumber(row['Manufacturing cost'])
    const leadTime = row['Lead time'] != null ? Number(row['Lead time']) : null
    
    if (!companyName || !process || !material || price === 0) continue
    
    const companyId = companyMap.get(companyName)
    if (!companyId) {
      console.log(`⚠ Company not found for pricing: ${companyName}`)
      continue
    }
    
    pricing.push({
      company_id: companyId,
      process,
      specific_material: material,
      quantity,
      price_usd: price,
      lead_time_days: leadTime
    })
  }
  
  console.log(`Processing ${pricing.length} pricing records...`)
  
  // Clear existing pricing first
  const { error: clearError } = await supabase
    .from('service_pricing')
    .delete()
    .eq('data_source', 'vendor_import_2025')
  
  if (clearError) {
    console.error('Error clearing pricing:', clearError)
  }
  
  // Insert in batches
  const BATCH_SIZE = 100
  for (let i = 0; i < pricing.length; i += BATCH_SIZE) {
    const batch = pricing.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('service_pricing')
      .insert(batch)
    
    if (error) {
      console.error('Batch error:', error)
    }
  }
  
  console.log(`✓ Imported ${pricing.length} pricing records`)
}

async function main() {
  try {
    console.log('🚀 Starting market data import...')
    console.log('Data source:', dataDir)
    
    // Clear existing data
    await clearExistingMarketData()
    
    // Import market intelligence data
    await importTotalMarketSize()
    await importCountryRevenue()
    await importIndustryRevenue()
    
    // Import company-related data
    await importCompanyInformation()
    await importCompanyCategories()
    await importInvestments()
    await importMergerAcquisitions()
    await importServicePricing()
    
    console.log('\\n✅ Market data import completed successfully!')
    
  } catch (error) {
    console.error('\\n❌ Import failed:', error.message)
    process.exit(1)
  }
}

// Run the import
main()