#!/usr/bin/env node

/**
 * Import Vendor CSV Data to Supabase
 * 
 * This script imports all vendor CSV data files into the corresponding vendor_* tables
 * created by migration 010_vendor_data_schema_mapping.sql
 * 
 * CSV Files to Import:
 * - market-data/Company_information.csv → vendor_company_information
 * - market-data/Fundings_and_investments.csv → vendor_fundings_investments
 * - market-data/Print_services_Pricing_data.csv → vendor_print_service_pricing
 * - market-data/AM_market_revenue_2024.csv → vendor_am_market_revenue_2024
 * - market-data/M_A.csv → vendor_mergers_acquisitions
 * - market-data/Company_roles.csv → vendor_company_roles
 * - market-data/Revenue_by_industry_2024.csv → vendor_revenue_by_industry_2024
 * - market-data/Total_AM_market_size.csv → vendor_total_am_market_size
 * - market-data/Directory.csv → vendor_directory
 * - company-data/COMPANY___AM_systems_mfrs.csv → vendor_am_systems_manufacturers
 * - company-data/COMPANY___Print_services_global.csv → vendor_print_services_global
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const csv = require('csv-parse/sync')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please check .env.local file.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// CSV file mappings
const csvMappings = [
  {
    file: 'docs/project-documents/04-data/market-data/Company_information.csv',
    table: 'vendor_company_information',
    fieldMap: {
      'Company name': 'company_name',
      'Website': 'website', 
      'Headquarters': 'headquarters'
    }
  },
  {
    file: 'docs/project-documents/04-data/market-data/Fundings_and_investments.csv',
    table: 'vendor_fundings_investments',
    fieldMap: {
      'Year': 'year',
      'Month': 'month',
      'Company name': 'company_name',
      'Country': 'country',
      'Amount (in millions USD)': 'amount_millions_usd',
      'Funding round': 'funding_round',
      'Lead investor': 'lead_investor',
      '__EMPTY_2': 'notes'
    }
  },
  {
    file: 'docs/project-documents/04-data/market-data/Print_services_Pricing_data.csv',
    table: 'vendor_print_service_pricing',
    fieldMap: {
      'Company name': 'company_name',
      'Material type': 'material_type',
      'Material': 'material',
      'Process': 'process',
      'Quantity': 'quantity',
      'Manufacturing cost': 'manufacturing_cost',
      'Day ordered': 'day_ordered',
      'Delivery date': 'delivery_date',
      'Lead time': 'lead_time',
      'Country': 'country',
      'Scattered plot with manufacturing cost vs delivery time': 'scattered_plot_info'
    }
  },
  {
    file: 'docs/project-documents/04-data/market-data/AM_market_revenue_2024.csv',
    table: 'vendor_am_market_revenue_2024',
    fieldMap: {
      ' Revenue (USD) ': 'revenue_usd',
      'Country': 'country',
      'Segment': 'segment',
      '__EMPTY_1': 'filter_info_1',
      '__EMPTY_2': 'filter_info_2',
      '__EMPTY_3': 'filter_info_3',
      '__EMPTY_4': 'filter_info_4'
    }
  },
  {
    file: 'docs/project-documents/04-data/market-data/M_A.csv',
    table: 'vendor_mergers_acquisitions',
    fieldMap: {
      'Deal date  ': 'deal_date',
      'Acquired company  ': 'acquired_company',
      'Acquiring company  ': 'acquiring_company',
      'Deal size ($M)   ': 'deal_size_millions',
      'Country  ': 'country'
    }
  },
  {
    file: 'docs/project-documents/04-data/market-data/Company_roles.csv',
    table: 'vendor_company_roles',
    fieldMap: {
      'Company name': 'company_name',
      'Category': 'category'
    }
  },
  {
    file: 'docs/project-documents/04-data/market-data/Revenue_by_industry_2024.csv',
    table: 'vendor_revenue_by_industry_2024',
    fieldMap: {
      'Industry': 'industry',
      'Share of revenue (%)': 'share_of_revenue_percent',
      'Revenue (USD)': 'revenue_usd',
      'Region': 'region',
      'Material': 'material',
      '__EMPTY_1': 'filter_info_1',
      '__EMPTY_2': 'filter_info_2',
      '__EMPTY_3': 'filter_info_3',
      '__EMPTY_4': 'filter_info_4'
    }
  },
  {
    file: 'docs/project-documents/04-data/market-data/Total_AM_market_size.csv',
    table: 'vendor_total_am_market_size',
    fieldMap: {
      'Year': 'year',
      'Type': 'forecast_type',
      'Segment': 'segment',
      ' Past revenue (USD) ': 'revenue_usd',
      '__EMPTY_1': 'filter_info_1',
      '__EMPTY_2': 'filter_info_2',
      '__EMPTY_3': 'filter_info_3'
    }
  },
  {
    file: 'docs/project-documents/04-data/market-data/Directory.csv',
    table: 'vendor_directory',
    fieldMap: {
      'Figure name': 'figure_name',
      'Sheet name and link': 'sheet_name_and_link',
      'V1': 'v1',
      'Notes': 'notes'
    }
  },
  {
    file: 'docs/project-documents/04-data/company-data/COMPANY___AM_systems_mfrs.csv',
    table: 'vendor_am_systems_manufacturers',
    fieldMap: {
      'Company name': 'company_name',
      'Segment': 'segment',
      'Material type': 'material_type',
      'Material format': 'material_format',
      'Country': 'country'
    }
  },
  {
    file: 'docs/project-documents/04-data/company-data/COMPANY___Print_services_global.csv',
    table: 'vendor_print_services_global',
    fieldMap: {
      'Company name': 'company_name',
      'Segment': 'segment',
      'Material type': 'material_type',
      'Material format': 'material_format',
      'Country': 'country'
    }
  }
]

// Helper function to clean and convert values
function cleanValue(value, field) {
  if (value === null || value === undefined || value === '') {
    return null
  }
  
  // Convert string values
  const stringValue = String(value).trim()
  
  // Handle numeric fields
  if (field.includes('year') || field.includes('quantity') || field.includes('day_') || field.includes('lead_time')) {
    const num = parseInt(stringValue)
    return isNaN(num) ? null : num
  }
  
  // Handle decimal fields
  if (field.includes('amount') || field.includes('cost') || field.includes('revenue') || 
      field.includes('size') || field.includes('percent')) {
    const num = parseFloat(stringValue)
    return isNaN(num) ? null : num
  }
  
  // Return cleaned string
  return stringValue === '' ? null : stringValue
}

// Import function for a single CSV file
async function importCSV(mapping) {
  const filePath = path.join(__dirname, '..', mapping.file)
  
  console.log(`\n📁 Processing: ${mapping.file}`)
  console.log(`🎯 Target table: ${mapping.table}`)
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`)
    return
  }
  
  try {
    // Read and parse CSV
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })
    
    console.log(`📊 Found ${records.length} records`)
    
    if (records.length === 0) {
      console.log(`⚠️ No records to import`)
      return
    }
    
    // Clear existing data
    console.log(`🧹 Clearing existing data from ${mapping.table}...`)
    const { error: deleteError } = await supabase
      .from(mapping.table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
    
    if (deleteError) {
      console.log(`⚠️ Warning clearing ${mapping.table}:`, deleteError.message)
    }
    
    // Transform records
    const transformedRecords = records.map(record => {
      const transformed = {}
      
      for (const [csvField, dbField] of Object.entries(mapping.fieldMap)) {
        transformed[dbField] = cleanValue(record[csvField], dbField)
      }
      
      return transformed
    }).filter(record => {
      // Filter out completely empty records
      return Object.values(record).some(value => value !== null && value !== '')
    })
    
    console.log(`🔄 Transformed ${transformedRecords.length} valid records`)
    
    if (transformedRecords.length === 0) {
      console.log(`⚠️ No valid records to import after transformation`)
      return
    }
    
    // Insert in batches
    const batchSize = 100
    let imported = 0
    
    for (let i = 0; i < transformedRecords.length; i += batchSize) {
      const batch = transformedRecords.slice(i, i + batchSize)
      
      const { data, error } = await supabase
        .from(mapping.table)
        .insert(batch)
        .select('id')
      
      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error.message)
        console.error('Sample record causing error:', JSON.stringify(batch[0], null, 2))
        continue
      }
      
      imported += batch.length
      console.log(`✅ Imported batch ${Math.floor(i/batchSize) + 1} (${batch.length} records)`)
    }
    
    console.log(`🎉 Successfully imported ${imported} records to ${mapping.table}`)
    
  } catch (error) {
    console.error(`❌ Error processing ${mapping.file}:`, error.message)
  }
}

// Main import function
async function importAllVendorData() {
  console.log('🚀 Starting Vendor CSV Data Import')
  console.log('='.repeat(50))
  
  // Test Supabase connection
  console.log('🔌 Testing Supabase connection...')
  const { data, error } = await supabase.from('companies').select('id').limit(1)
  
  if (error) {
    console.error('❌ Supabase connection failed:', error.message)
    process.exit(1)
  }
  
  console.log('✅ Supabase connection successful')
  
  // Import each CSV file
  for (const mapping of csvMappings) {
    await importCSV(mapping)
  }
  
  console.log('\n🏁 Vendor data import completed!')
  console.log('='.repeat(50))
}

// Run the import
importAllVendorData().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})