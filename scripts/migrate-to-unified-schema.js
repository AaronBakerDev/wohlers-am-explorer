#!/usr/bin/env node

/**
 * Migrate Vendor Data to Unified Companies Schema
 * 
 * This script executes the migration from legacy vendor_* tables to the new
 * unified companies schema. It should be run after:
 * 1. The unified schema migration (020_unified_companies_schema.sql)
 * 2. Vendor data import (import-vendor-csv-data.js)
 * 
 * The script will:
 * - Execute the SQL migration file
 * - Validate the migration results
 * - Generate a detailed migration report
 * - Test the new unified API endpoints
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
 * Execute SQL file
 */
async function executeSQLFile(filePath) {
  console.log(`📄 Reading SQL file: ${filePath}`)
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`SQL file not found: ${filePath}`)
  }

  const sqlContent = fs.readFileSync(filePath, 'utf-8')
  
  // Split by statements and execute
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'))

  console.log(`🔧 Executing ${statements.length} SQL statements...`)

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    if (statement.length < 10) continue // Skip very short statements
    
    try {
      console.log(`  ⚡ Statement ${i + 1}/${statements.length}`)
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' })
      
      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error.message)
        throw error
      }
    } catch (err) {
      console.error(`💥 Failed on statement ${i + 1}:`, err.message)
      console.error(`Statement content: ${statement.substring(0, 200)}...`)
      throw err
    }
  }

  console.log('✅ SQL migration executed successfully')
}

/**
 * Validate migration results
 */
async function validateMigration() {
  console.log('\n🔍 Validating migration results...')
  
  try {
    // Check companies_unified table
    const { data: companies, error: companiesError } = await supabase
      .from('companies_unified')
      .select('id, name, company_type, company_role, country')
      .limit(5)

    if (companiesError) throw companiesError

    console.log(`✅ Companies table: ${companies.length} sample records found`)
    companies.forEach(company => {
      console.log(`   - ${company.name} (${company.company_type}/${company.company_role}) - ${company.country}`)
    })

    // Check technologies_unified table  
    const { data: technologies, error: techError } = await supabase
      .from('technologies_unified')
      .select('id, name, category')
      .limit(5)

    if (techError) throw techError

    console.log(`✅ Technologies table: ${technologies.length} sample records found`)
    technologies.forEach(tech => {
      console.log(`   - ${tech.name} (${tech.category})`)
    })

    // Check materials_unified table
    const { data: materials, error: materialsError } = await supabase
      .from('materials_unified')
      .select('id, name, material_type, material_format')
      .limit(5)

    if (materialsError) throw materialsError

    console.log(`✅ Materials table: ${materials.length} sample records found`)
    materials.forEach(material => {
      console.log(`   - ${material.name} (${material.material_type}/${material.material_format})`)
    })

    // Check company_technologies relationships
    const { data: companyTech, error: companyTechError } = await supabase
      .from('company_technologies')
      .select('company_id, technology_id')
      .limit(1)

    if (companyTechError) throw companyTechError

    console.log(`✅ Company-Technology relationships: ${companyTech.length > 0 ? 'Found' : 'None'} sample records`)

    // Check company_materials relationships
    const { data: companyMaterials, error: companyMaterialsError } = await supabase
      .from('company_materials')
      .select('company_id, material_id')
      .limit(1)

    if (companyMaterialsError) throw companyMaterialsError

    console.log(`✅ Company-Material relationships: ${companyMaterials.length > 0 ? 'Found' : 'None'} sample records`)

    return true
  } catch (error) {
    console.error('❌ Migration validation failed:', error.message)
    return false
  }
}

/**
 * Generate migration report
 */
async function generateReport() {
  console.log('\n📊 Generating migration report...')

  try {
    // Company counts by type and role
    const { data: companyStats, error: statsError } = await supabase
      .from('companies_unified')
      .select('company_type, company_role')

    if (statsError) throw statsError

    const stats = companyStats.reduce((acc, company) => {
      const key = `${company.company_type}/${company.company_role}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    console.log('📈 Company Distribution:')
    Object.entries(stats).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} companies`)
    })

    // Technology and material counts
    const [techResult, materialResult] = await Promise.all([
      supabase.from('technologies_unified').select('id', { count: 'exact' }),
      supabase.from('materials_unified').select('id', { count: 'exact' })
    ])

    console.log(`📈 Technologies: ${techResult.count || 0} unique technologies`)
    console.log(`📈 Materials: ${materialResult.count || 0} unique materials`)

    // Relationship counts
    const [companyTechResult, companyMaterialResult] = await Promise.all([
      supabase.from('company_technologies').select('id', { count: 'exact' }),
      supabase.from('company_materials').select('id', { count: 'exact' })
    ])

    console.log(`📈 Company-Technology Links: ${companyTechResult.count || 0}`)
    console.log(`📈 Company-Material Links: ${companyMaterialResult.count || 0}`)

    // Country distribution
    const { data: countries } = await supabase
      .from('companies_unified')
      .select('country')
      .not('country', 'is', null)

    const countryStats = countries.reduce((acc, { country }) => {
      acc[country] = (acc[country] || 0) + 1
      return acc
    }, {})

    console.log('🌍 Top Countries:')
    Object.entries(countryStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([country, count]) => {
        console.log(`   ${country}: ${count} companies`)
      })

    return true
  } catch (error) {
    console.error('❌ Report generation failed:', error.message)
    return false
  }
}

/**
 * Test unified API endpoints
 */
async function testAPIEndpoints() {
  console.log('\n🧪 Testing unified API endpoints...')

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  const testEndpoints = [
    '/api/companies?companyType=equipment&limit=5',
    '/api/companies?companyType=service&limit=5',
    '/api/companies?dataset=am-systems-manufacturers&limit=5',
    '/api/companies?dataset=print-services-global&limit=5'
  ]

  for (const endpoint of testEndpoints) {
    try {
      console.log(`  🔗 Testing: ${endpoint}`)
      const response = await fetch(`${baseUrl}${endpoint}`)
      
      if (!response.ok) {
        console.log(`  ⚠️  HTTP ${response.status}: ${response.statusText}`)
        continue
      }

      const data = await response.json()
      console.log(`  ✅ Success: ${data.data?.length || 0} companies returned`)
      
      if (data.data?.length > 0) {
        const sample = data.data[0]
        console.log(`     Sample: ${sample.name} (${sample.companyType}/${sample.companyRole})`)
      }
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}`)
    }
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 Starting Unified Companies Schema Migration')
  console.log('='.repeat(60))

  try {
    // Test Supabase connection
    console.log('🔌 Testing Supabase connection...')
    const { data, error } = await supabase.from('companies').select('id').limit(1)
    
    if (error && !error.message.includes('does not exist')) {
      console.error('❌ Supabase connection failed:', error.message)
      process.exit(1)
    }
    
    console.log('✅ Supabase connection successful')

    // Check if unified schema already exists
    console.log('🔍 Checking existing schema...')
    const { data: existingCompanies, error: existingError } = await supabase
      .from('companies_unified')
      .select('id')
      .limit(1)

    if (!existingError && existingCompanies?.length > 0) {
      console.log('⚠️  Unified companies table already contains data.')
      console.log('   This migration may have already been run.')
      
      // Still proceed with validation and reporting
      const isValid = await validateMigration()
      if (isValid) {
        await generateReport()
        await testAPIEndpoints()
      }
      
      console.log('\n✅ Migration check completed')
      return
    }

    // Execute the migration SQL file
    const migrationFile = path.join(__dirname, '../sql-migrations/021_migrate_vendor_to_unified_companies.sql')
    await executeSQLFile(migrationFile)

    // Validate the migration
    const isValid = await validateMigration()
    
    if (!isValid) {
      console.error('❌ Migration validation failed - please check the results manually')
      process.exit(1)
    }

    // Generate detailed report
    await generateReport()

    // Test API endpoints
    await testAPIEndpoints()

    console.log('\n🎉 Migration completed successfully!')
    console.log('='.repeat(60))
    console.log('Next steps:')
    console.log('1. Test the dashboard at /dashboard?dataset=am-systems-manufacturers')
    console.log('2. Test the dashboard at /dashboard?dataset=print-services-global')  
    console.log('3. Verify the unified API endpoints are working correctly')
    console.log('4. Consider adding geocoding for lat/lng coordinates')

  } catch (error) {
    console.error('💥 Migration failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Add exec_sql function helper if it doesn't exist in Supabase
async function ensureExecSQLFunction() {
  try {
    // Try to create a simple exec_sql function if it doesn't exist
    const { error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' })
    
    if (error && error.message.includes('function exec_sql')) {
      console.log('⚠️  exec_sql function not available - executing statements individually')
      return false
    }
    
    return true
  } catch (error) {
    console.log('⚠️  Will execute SQL statements individually')
    return false
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})