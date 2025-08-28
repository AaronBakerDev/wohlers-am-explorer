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

// Function to normalize company names and aggregate data
function aggregateCompanyData(csvData) {
  const companies = new Map()
  
  csvData.forEach(row => {
    const companyName = row.Company
    if (!companyName) return
    
    if (!companies.has(companyName)) {
      companies.set(companyName, {
        name: companyName,
        website: row.Website || null,
        country: row.Country || null,
        state: row['State / province'] || null,
        printers: [],
        technologies: new Set(),
        materials: new Set()
      })
    }
    
    const company = companies.get(companyName)
    
    // Add printer information
    if (row['Printer manufacturer'] || row['Printer model'] || row['Number of printers']) {
      company.printers.push({
        manufacturer: row['Printer manufacturer'] || null,
        model: row['Printer model'] || null,
        number: parseInt(row['Number of printers']) || 1,
        countType: row['Count type'] || 'Minimum',
        process: row.Process || null,
        material: row.Material || null
      })
    }
    
    // Aggregate technologies and materials
    if (row.Process) company.technologies.add(row.Process)
    if (row.Material) company.materials.add(row.Material)
  })
  
  return Array.from(companies.values()).map(company => ({
    ...company,
    technologies: Array.from(company.technologies),
    materials: Array.from(company.materials)
  }))
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
  }
  
  if (country === 'Canada') {
    return locations['ON'] || { lat: 45.4215, lng: -75.6972 } // Ottawa default
  }
  
  return locations[state] || { lat: 39.8283, lng: -98.5795 } // Center of US default
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
    
    console.log('Aggregating company data...')
    const companies = aggregateCompanyData(csvData)
    console.log(`Found ${companies.length} unique companies`)
    
    console.log('Getting technology and material IDs...')
    const { data: technologies, error: techError } = await supabase.from('technologies').select('id, name')
    const { data: materials, error: matError } = await supabase.from('materials').select('id, name')
    
    if (techError) {
      console.error('Error fetching technologies:', techError)
      process.exit(1)
    }
    
    if (matError) {
      console.error('Error fetching materials:', matError)
      process.exit(1)
    }
    
    if (!technologies || !materials) {
      console.error('No technologies or materials found in database')
      process.exit(1)
    }
    
    const techMap = new Map(technologies.map(t => [t.name, t.id]))
    const materialMap = new Map(materials.map(m => [m.name, m.id]))
    
    console.log(`Found ${technologies.length} technologies and ${materials.length} materials`)
    
    console.log('Importing companies...')
    let successCount = 0
    let errorCount = 0
    
    for (const company of companies) {
      try {
        const coords = getCoordinates(null, company.state, company.country)
        
        // Determine company type based on printer data
        let companyType = 'service' // Default for companies with printers
        if (company.printers.length === 0) {
          companyType = 'other'
        }
        
        // Calculate total printers and aggregate info
        const totalPrinters = company.printers.reduce((sum, p) => sum + p.number, 0)
        const primaryPrinter = company.printers[0] // Use first printer as primary
        
        // Insert company
        const { data: insertedCompany, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: company.name,
            website: company.website,
            country: company.country,
            state: company.state,
            latitude: coords.lat,
            longitude: coords.lng,
            company_type: companyType,
            printer_manufacturer: primaryPrinter?.manufacturer,
            printer_model: primaryPrinter?.model,
            number_of_printers: totalPrinters || 1,
            count_type: primaryPrinter?.countType || 'Minimum',
            description: `AM service provider with ${company.technologies.join(', ')} capabilities`
          })
          .select()
          .single()
        
        if (companyError) {
          console.error(`Error inserting company ${company.name}:`, companyError.message)
          errorCount++
          continue
        }
        
        const companyId = insertedCompany.id
        
        // Insert technology relationships
        for (const techName of company.technologies) {
          const techId = techMap.get(techName)
          if (techId) {
            await supabase
              .from('company_technologies')
              .insert({
                company_id: companyId,
                technology_id: techId,
                is_primary: company.technologies[0] === techName
              })
          }
        }
        
        // Insert material relationships
        for (const materialName of company.materials) {
          const materialId = materialMap.get(materialName)
          if (materialId) {
            await supabase
              .from('company_materials')
              .insert({
                company_id: companyId,
                material_id: materialId,
                is_primary: company.materials[0] === materialName
              })
          }
        }
        
        successCount++
        if (successCount % 10 === 0) {
          console.log(`Imported ${successCount} companies...`)
        }
        
      } catch (error) {
        console.error(`Error processing company ${company.name}:`, error.message)
        errorCount++
      }
    }
    
    console.log(`\nImport completed!`)
    console.log(`✅ Successfully imported: ${successCount} companies`)
    console.log(`❌ Errors: ${errorCount}`)
    
  } catch (error) {
    console.error('Import failed:', error)
    process.exit(1)
  }
}

// Run the import
importData()