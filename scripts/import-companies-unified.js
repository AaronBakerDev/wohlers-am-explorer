#!/usr/bin/env node

/**
 * Import Companies to Unified Schema
 * 
 * This script imports company data from the CSV file into the companies_unified table
 * with proper schema mapping and deduplication.
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables. Please check .env.local file.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Parse CSV line handling semicolon delimiter and quoted fields
 */
function parseCsvLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ';' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

/**
 * Parse CSV content
 */
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim())
  const headers = parseCsvLine(lines[0])
  const data = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    if (values.length >= headers.length) {
      const row = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      data.push(row)
    }
  }
  
  return data
}

/**
 * Aggregate company data from CSV rows
 */
function aggregateCompanyData(csvData) {
  const companyMap = new Map()
  
  csvData.forEach(row => {
    const companyName = row.Company?.trim()
    if (!companyName || companyName === '') return
    
    const country = row['Country']?.trim() || null
    const state = row['State / province']?.trim() || null
    const website = row['Website']?.trim() || null
    
    // Create or update company entry
    if (!companyMap.has(companyName)) {
      companyMap.set(companyName, {
        name: companyName,
        country: country === 'United States' ? 'United States' : country,
        state: state,
        website: website && website.startsWith('http') ? website : null,
        company_type: 'service', // Most companies in this dataset are service providers
        company_role: 'provider',
        segment: 'professional',
        primary_market: 'services',
        is_active: true,
        data_source: 'wohlers_csv_import'
      })
    } else {
      // Update existing entry with additional info if available
      const existing = companyMap.get(companyName)
      if (!existing.website && website && website.startsWith('http')) {
        existing.website = website
      }
      if (!existing.state && state) {
        existing.state = state
      }
    }
  })
  
  return Array.from(companyMap.values())
}

/**
 * Import companies data
 */
async function importCompanies() {
  console.log('🚀 Importing Companies to Unified Schema')
  console.log('='.repeat(50))
  
  try {
    // Test connection
    console.log('🔌 Testing Supabase connection...')
    const { error: connectionError } = await supabase.from('companies_unified').select('id').limit(1)
    
    if (connectionError && !connectionError.message.includes('does not exist')) {
      console.error('❌ Connection failed:', connectionError.message)
      process.exit(1)
    }
    
    console.log('✅ Supabase connection successful')

    // Read and parse CSV
    console.log('📖 Reading CSV file...')
    const csvPath = path.join(__dirname, '../../project-documents/AM companies in NA - Copy 4/Detailed companies-Table 1.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    
    console.log('📊 Parsing CSV data...')
    const csvData = parseCSV(csvContent)
    console.log(`   Parsed ${csvData.length} rows`)
    
    console.log('🏢 Aggregating company data...')
    const companies = aggregateCompanyData(csvData)
    console.log(`   Found ${companies.length} unique companies`)

    // Clear existing imported data (keep sample data)
    console.log('🗑️  Clearing existing imported data...')
    await supabase
      .from('companies_unified')
      .delete()
      .eq('data_source', 'wohlers_csv_import')

    // Batch insert companies
    console.log('⬆️  Importing companies...')
    const batchSize = 50
    let imported = 0
    let errors = 0

    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, i + batchSize)
      
      try {
        const { data, error } = await supabase
          .from('companies_unified')
          .insert(batch)
          .select('id')

        if (error) {
          console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, error.message)
          errors += batch.length
        } else {
          imported += data?.length || batch.length
          console.log(`   ✅ Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} companies`)
        }
      } catch (err) {
        console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} error:`, err.message)
        errors += batch.length
      }
    }

    // Verify import
    console.log('\n📈 Import Summary:')
    console.log(`   ✅ Successfully imported: ${imported} companies`)
    console.log(`   ❌ Errors: ${errors}`)

    // Get final count
    const { count: totalCount } = await supabase
      .from('companies_unified')
      .select('*', { count: 'exact', head: true })

    console.log(`   📊 Total companies in database: ${totalCount}`)

    if (imported > 0) {
      console.log('\n🎉 Import completed successfully!')
      console.log('🧪 Test your data:')
      console.log('1. Dashboard: http://localhost:3000/dashboard')
      console.log('2. API Test: http://localhost:3000/api/companies?limit=10')
    } else {
      console.log('\n⚠️  No companies were imported. Check error messages above.')
    }

  } catch (error) {
    console.error('💥 Import failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run import
importCompanies().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})