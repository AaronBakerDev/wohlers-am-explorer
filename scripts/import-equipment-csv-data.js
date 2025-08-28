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

// Function to parse CSV with semicolon separators
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim())
  const headers = lines[0].split(';').map(h => h.trim())
  
  const data = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';').map(v => v.trim())
    if (values.length >= headers.length) {
      const row = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || null
      })
      data.push(row)
    }
  }
  
  return data
}

// Function to get or create location coordinates (simplified - just major cities)
function getCoordinates(city, state, country) {
  const locations = {
    // Major US cities
    'CA': { lat: 34.0522, lng: -118.2437 }, // Los Angeles as default for CA
    'NY': { lat: 40.7128, lng: -74.0060 }, // New York
    'TX': { lat: 32.7767, lng: -96.7970 }, // Dallas
    'FL': { lat: 25.7617, lng: -80.1918 }, // Miami
    'IL': { lat: 41.8781, lng: -87.6298 }, // Chicago
    'OH': { lat: 39.9612, lng: -82.9988 }, // Columbus
    'GA': { lat: 33.7490, lng: -84.3880 }, // Atlanta
    'VA': { lat: 37.4316, lng: -78.6569 }, // Richmond
    'MA': { lat: 42.3601, lng: -71.0589 }, // Boston
    'MI': { lat: 42.3314, lng: -83.0458 }, // Detroit
    'OR': { lat: 45.5152, lng: -122.6784 }, // Portland
    'WA': { lat: 47.6062, lng: -122.3321 }, // Seattle
    'ON': { lat: 43.6532, lng: -79.3832 }, // Toronto
    'AZ': { lat: 33.4484, lng: -112.0740 }, // Phoenix
    'IN': { lat: 39.7684, lng: -86.1581 }, // Indianapolis
    'KY': { lat: 38.2009, lng: -84.8733 }, // Frankfort
    'NV': { lat: 39.1638, lng: -119.7674 }, // Carson City
    'MD': { lat: 39.0458, lng: -76.6413 }, // Annapolis
    'KS': { lat: 39.04, lng: -95.69 }, // Topeka
    'HI': { lat: 21.30895, lng: -157.826182 }, // Honolulu
    'ND': { lat: 46.8083, lng: -100.7837 }, // Bismarck
  }
  
  if (country === 'Canada') {
    return locations['ON'] || { lat: 45.4215, lng: -75.6972 } // Ottawa default
  }
  
  return locations[state] || { lat: 39.8283, lng: -98.5795 } // Center of US default
}

// Function to normalize company data and create unique companies
function extractCompanies(csvData) {
  const companies = new Map()
  
  csvData.forEach(row => {
    const companyName = row.Company
    if (!companyName) return
    
    if (!companies.has(companyName)) {
      const coords = getCoordinates(null, row['State / province'], row.Country)
      
      companies.set(companyName, {
        name: companyName,
        website: row.Website || null,
        country: row.Country || null,
        state: row['State / province'] || null,
        latitude: coords.lat,
        longitude: coords.lng,
        company_type: 'service', // Default for AM service providers
        description: `Additive manufacturing service provider`
      })
    }
  })
  
  return Array.from(companies.values())
}

// Function to create equipment records from CSV data
function extractEquipment(csvData, companyMap, technologyMap, materialMap) {
  const equipment = []
  
  csvData.forEach(row => {
    const companyName = row.Company
    if (!companyName || !companyMap.has(companyName)) return
    
    const companyId = companyMap.get(companyName)
    
    // Normalize count_type to match database constraints
    let countType = row['Count type'] || 'Minimum'
    if (countType.toLowerCase() === 'estimate') {
      countType = 'Estimated'
    }
    
    // Get technology and material IDs from maps
    const technologyId = technologyMap.get(row.Process) || null
    const materialId = materialMap.get(row.Material) || null
    
    // Create equipment record for each CSV row
    equipment.push({
      company_id: companyId,
      manufacturer: row['Printer manufacturer'] || null,
      model: row['Printer model'] || null,
      process: row.Process || null, // Keep for reference during migration
      material: row.Material || null, // Keep for reference during migration
      technology_id: technologyId,
      material_id: materialId,
      count: parseInt(row['Number of printers']) || 1,
      count_type: countType
    })
  })
  
  return equipment
}

// Main import function
async function importData() {
  try {
    // Test connection first
    console.log('Testing Supabase connection...')
    const testResult = await supabase.from('technologies').select('count', { count: 'exact', head: true })
    if (testResult.error) {
      console.error('Connection test failed:', testResult.error)
      process.exit(1)
    }
    console.log('Connection successful')
    
    console.log('Reading CSV file...')
    const csvPath = path.join(__dirname, '../../project-documents/AM companies in NA - Copy 4/Detailed companies-Table 1.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    
    console.log('Parsing CSV data...')
    const csvData = parseCSV(csvContent)
    console.log(`Parsed ${csvData.length} rows`)
    
    console.log('Extracting unique companies...')
    const companies = extractCompanies(csvData)
    console.log(`Found ${companies.length} unique companies`)
    
    // Clear existing data
    console.log('Clearing existing data...')
    await supabase.from('equipment').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('companies').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    console.log('Importing companies...')
    const companyMap = new Map()
    let successCount = 0
    let errorCount = 0
    
    // Import companies first
    for (const company of companies) {
      try {
        const { data: insertedCompany, error: companyError } = await supabase
          .from('companies')
          .insert(company)
          .select()
          .single()
        
        if (companyError) {
          console.error(`Error inserting company ${company.name}:`, companyError.message)
          errorCount++
          continue
        }
        
        companyMap.set(company.name, insertedCompany.id)
        successCount++
        
        if (successCount % 25 === 0) {
          console.log(`Imported ${successCount} companies...`)
        }
        
      } catch (error) {
        console.error(`Error processing company ${company.name}:`, error.message)
        errorCount++
      }
    }
    
    console.log(`\\nCompany import completed!`)
    console.log(`✅ Successfully imported: ${successCount} companies`)
    console.log(`❌ Errors: ${errorCount}`)
    
    // Get technology and material mappings
    console.log('\\nFetching technology and material mappings...')
    const { data: technologies, error: techError } = await supabase.from('technologies').select('id, name')
    const { data: materials, error: matError } = await supabase.from('materials').select('id, name')
    
    if (techError || matError) {
      console.error('Error fetching lookup data:', techError || matError)
      process.exit(1)
    }
    
    const technologyMap = new Map(technologies.map(t => [t.name, t.id]))
    const materialMap = new Map(materials.map(m => [m.name, m.id]))
    
    console.log(`Found ${technologies.length} technologies and ${materials.length} materials`)
    
    // Now import equipment
    console.log('\\nExtracting equipment data...')
    const equipment = extractEquipment(csvData, companyMap, technologyMap, materialMap)
    console.log(`Found ${equipment.length} equipment records`)
    
    console.log('Importing equipment...')
    let equipmentSuccessCount = 0
    let equipmentErrorCount = 0
    
    // Import equipment in batches for better performance
    const batchSize = 50
    for (let i = 0; i < equipment.length; i += batchSize) {
      const batch = equipment.slice(i, i + batchSize)
      
      try {
        const { error: equipmentError } = await supabase
          .from('equipment')
          .insert(batch)
        
        if (equipmentError) {
          console.error(`Error inserting equipment batch ${i}-${i + batch.length}:`, equipmentError.message)
          equipmentErrorCount += batch.length
        } else {
          equipmentSuccessCount += batch.length
        }
        
        if ((i + batchSize) % 200 === 0) {
          console.log(`Imported ${equipmentSuccessCount} equipment records...`)
        }
        
      } catch (error) {
        console.error(`Error processing equipment batch ${i}-${i + batch.length}:`, error.message)
        equipmentErrorCount += batch.length
      }
    }
    
    console.log(`\\nEquipment import completed!`)
    console.log(`✅ Successfully imported: ${equipmentSuccessCount} equipment records`)
    console.log(`❌ Errors: ${equipmentErrorCount}`)
    
    console.log(`\\n🎉 Import Summary:`)
    console.log(`📊 Companies: ${successCount} imported`)
    console.log(`🔧 Equipment: ${equipmentSuccessCount} imported`)
    console.log(`📈 Total CSV rows processed: ${csvData.length}`)
    
  } catch (error) {
    console.error('Import failed:', error)
    process.exit(1)
  }
}

// Run the import
importData()