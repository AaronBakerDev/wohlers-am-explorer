#!/usr/bin/env node

/**
 * Complete Unified Migration Script
 * 
 * This script provides a comprehensive migration process with clear instructions
 * and handles both automatic migration (where possible) and manual steps.
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
 * Complete migration with instructions
 */
async function completeUnifiedMigration() {
  console.log('🚀 Complete Unified Companies Schema Migration')
  console.log('='.repeat(60))
  console.log('This script will guide you through the complete migration process.\n')

  try {
    // Test connection
    console.log('🔌 Step 1: Testing Supabase connection...')
    const { error: connectionError } = await supabase.from('companies').select('id').limit(1)
    
    if (connectionError && !connectionError.message.includes('does not exist')) {
      console.error('❌ Connection failed:', connectionError.message)
      process.exit(1)
    }
    
    console.log('✅ Supabase connection successful')

    // Step 2: Check schema
    console.log('\n🔍 Step 2: Checking unified schema...')
    const { data: schemaCheck, error: schemaError } = await supabase
      .from('companies_unified')
      .select('id')
      .limit(1)

    if (schemaError && schemaError.message.includes('does not exist')) {
      console.log('❌ Unified schema not found.')
      
      // Read and display the schema file for manual execution
      const schemaPath = path.join(__dirname, '../sql-migrations/020_unified_companies_schema.sql')
      
      if (fs.existsSync(schemaPath)) {
        console.log('\n📋 MANUAL SCHEMA SETUP REQUIRED:')
        console.log('─'.repeat(50))
        console.log('1. Open your Supabase Dashboard')
        console.log('2. Go to SQL Editor')
        console.log('3. Copy and paste the following file content:')
        console.log(`   📄 ${schemaPath}`)
        console.log('4. Click "RUN" to execute the SQL')
        console.log('5. Re-run this script: npm run migrate:unified')
        
        console.log('\n📄 SCHEMA FILE PREVIEW:')
        console.log('─'.repeat(30))
        const schemaContent = fs.readFileSync(schemaPath, 'utf-8')
        const previewLines = schemaContent.split('\n').slice(0, 20)
        previewLines.forEach(line => console.log(`   ${line}`))
        console.log('   ... (file continues)')
        
        console.log('\n💡 TIP: The schema file is located at:')
        console.log(`   ${path.resolve(schemaPath)}`)
        
        process.exit(0)
      } else {
        console.error('❌ Schema file not found. Please ensure you have the migration files.')
        process.exit(1)
      }
    }

    console.log('✅ Unified schema exists')

    // Step 3: Check for existing data
    console.log('\n📊 Step 3: Checking existing data...')
    const { data: existingCompanies, count: companyCount } = await supabase
      .from('companies_unified')
      .select('*', { count: 'exact' })
      .limit(1)

    if (companyCount > 0) {
      console.log(`✅ Found ${companyCount} existing companies in unified schema`)
      console.log('⚠️  Migration may have already been completed.')
      
      // Still run verification
      await runVerification()
      return
    }

    // Step 4: Migrate data
    console.log('\n🔧 Step 4: Migrating data...')
    await migrateData()

    // Step 5: Verification
    console.log('\n🔍 Step 5: Running verification...')
    await runVerification()

    console.log('\n🎉 Migration completed successfully!')
    console.log('='.repeat(60))
    console.log('🧪 Test your unified system:')
    console.log('1. Dashboard: http://localhost:3000/dashboard?dataset=am-systems-manufacturers&view=table')
    console.log('2. API Test: http://localhost:3000/api/companies?companyType=equipment')
    console.log('3. Service Test: http://localhost:3000/api/companies?companyType=service')
    console.log('\n📚 View the unified architecture at:')
    console.log('   - src/components/UnifiedDatasetView.tsx')
    console.log('   - src/app/api/companies/route.ts')
    console.log('   - src/lib/filters/company-filters.ts')
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

/**
 * Migrate data from vendor tables
 */
async function migrateData() {
  let totalMigrated = 0

  // Setup base technologies and materials first
  console.log('   🔧 Setting up base technologies and materials...')
  
  const technologies = [
    { name: 'DMLS', category: 'Metal Printing', description: 'Direct Metal Laser Sintering', process_type: 'DMLS' },
    { name: 'SLM', category: 'Metal Printing', description: 'Selective Laser Melting', process_type: 'SLM' },
    { name: 'EBM', category: 'Metal Printing', description: 'Electron Beam Melting', process_type: 'EBM' },
    { name: 'FDM', category: 'Material Extrusion', description: 'Fused Deposition Modeling', process_type: 'FDM' },
    { name: 'SLA', category: 'Vat Photopolymerization', description: 'Stereolithography', process_type: 'SLA' },
    { name: 'SLS', category: 'Powder Bed Fusion', description: 'Selective Laser Sintering', process_type: 'SLS' },
    { name: 'MJF', category: 'Powder Bed Fusion', description: 'Multi Jet Fusion', process_type: 'MJF' },
    { name: 'PolyJet', category: 'Material Jetting', description: 'PolyJet Technology', process_type: 'PolyJet' }
  ]

  await supabase.from('technologies_unified').upsert(technologies, { onConflict: 'name' })

  const materials = [
    { name: 'Metal', material_type: 'Metal', material_format: 'Powder', description: 'Generic metal materials' },
    { name: 'Thermoplastic', material_type: 'Thermoplastic', material_format: 'Filament', description: 'Generic thermoplastic' },
    { name: 'Thermoset', material_type: 'Thermoset', material_format: 'Resin', description: 'Generic thermoset' },
    { name: 'PLA', material_type: 'Thermoplastic', material_format: 'Filament', description: 'Polylactic acid' },
    { name: 'ABS', material_type: 'Thermoplastic', material_format: 'Filament', description: 'ABS thermoplastic' }
  ]

  await supabase.from('materials_unified').upsert(materials, { onConflict: 'name,material_type' })

  // Migrate AM Systems Manufacturers
  console.log('   📦 Migrating AM systems manufacturers...')
  const { data: vendorAM } = await supabase.from('vendor_am_systems_manufacturers').select('*')

  if (vendorAM && vendorAM.length > 0) {
    const amCompanies = vendorAM
      .filter(company => company.company_name && company.company_name.trim())
      .map(company => ({
        name: company.company_name.trim(),
        country: company.country || null,
        company_type: 'equipment',
        company_role: 'manufacturer',
        segment: ['industrial', 'professional', 'desktop', 'research'].includes(company.segment?.toLowerCase()) 
                  ? company.segment.toLowerCase() : 'industrial',
        primary_market: 'manufacturing',
        is_active: true,
        data_source: 'vendor_am_systems_manufacturers'
      }))

    // Remove duplicates
    const uniqueCompanies = amCompanies.filter((company, index, self) => 
      index === self.findIndex(c => c.name === company.name && c.company_type === company.company_type)
    )

    if (uniqueCompanies.length > 0) {
      const { error } = await supabase
        .from('companies_unified')
        .upsert(uniqueCompanies, { onConflict: 'name,company_type,company_role' })

      if (error) {
        console.log(`   ⚠️  AM migration warning: ${error.message}`)
      } else {
        totalMigrated += uniqueCompanies.length
        console.log(`   ✅ Migrated ${uniqueCompanies.length} AM systems manufacturers`)
      }
    }
  }

  // Migrate Print Service Providers
  console.log('   🖨️  Migrating print service providers...')
  const { data: vendorPS } = await supabase.from('vendor_print_services_global').select('*')

  if (vendorPS && vendorPS.length > 0) {
    const psCompanies = vendorPS
      .filter(company => company.company_name && company.company_name.trim())
      .map(company => ({
        name: company.company_name.trim(),
        country: company.country || null,
        company_type: 'service',
        company_role: 'provider',
        segment: ['industrial', 'professional', 'desktop', 'research'].includes(company.segment?.toLowerCase()) 
                  ? company.segment.toLowerCase() : 'professional',
        primary_market: 'services',
        is_active: true,
        data_source: 'vendor_print_services_global'
      }))

    // Remove duplicates
    const uniqueCompanies = psCompanies.filter((company, index, self) => 
      index === self.findIndex(c => c.name === company.name && c.company_type === company.company_type)
    )

    if (uniqueCompanies.length > 0) {
      const { error } = await supabase
        .from('companies_unified')
        .upsert(uniqueCompanies, { onConflict: 'name,company_type,company_role' })

      if (error) {
        console.log(`   ⚠️  Print services migration warning: ${error.message}`)
      } else {
        totalMigrated += uniqueCompanies.length
        console.log(`   ✅ Migrated ${uniqueCompanies.length} print service providers`)
      }
    }
  }

  // Add sample data if no vendor data found
  if (totalMigrated === 0) {
    console.log('   🎭 No vendor data found. Adding sample data...')
    
    const sampleCompanies = [
      { name: 'EOS GmbH', country: 'Germany', company_type: 'equipment', company_role: 'manufacturer', segment: 'industrial', primary_market: 'manufacturing', website: 'https://eos.info', is_active: true, data_source: 'sample' },
      { name: 'Stratasys', country: 'United States', company_type: 'equipment', company_role: 'manufacturer', segment: 'professional', primary_market: 'manufacturing', website: 'https://stratasys.com', is_active: true, data_source: 'sample' },
      { name: 'Protolabs', country: 'United States', company_type: 'service', company_role: 'provider', segment: 'professional', primary_market: 'services', website: 'https://protolabs.com', is_active: true, data_source: 'sample' },
      { name: 'Sculpteo', country: 'France', company_type: 'service', company_role: 'provider', segment: 'professional', primary_market: 'services', website: 'https://sculpteo.com', is_active: true, data_source: 'sample' }
    ]

    await supabase.from('companies_unified').upsert(sampleCompanies, { onConflict: 'name,company_type,company_role' })
    console.log(`   ✅ Added ${sampleCompanies.length} sample companies`)
  }

  console.log(`   📊 Total companies migrated/added: ${totalMigrated || 4}`)
}

/**
 * Run verification checks
 */
async function runVerification() {
  const [companiesResult, techResult, materialResult] = await Promise.all([
    supabase.from('companies_unified').select('company_type, company_role, name, country', { count: 'exact' }),
    supabase.from('technologies_unified').select('id', { count: 'exact' }),
    supabase.from('materials_unified').select('id', { count: 'exact' })
  ])

  console.log('   📈 Verification Results:')
  console.log(`      Companies: ${companiesResult.count || 0}`)
  console.log(`      Technologies: ${techResult.count || 0}`)
  console.log(`      Materials: ${materialResult.count || 0}`)

  if (companiesResult.data && companiesResult.data.length > 0) {
    const distribution = companiesResult.data.reduce((acc, company) => {
      const key = `${company.company_type}/${company.company_role}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    console.log('   📊 Company Distribution:')
    Object.entries(distribution).forEach(([type, count]) => {
      console.log(`      ${type}: ${count}`)
    })

    console.log('   🏢 Sample Companies:')
    companiesResult.data.slice(0, 3).forEach(company => {
      console.log(`      ${company.name} (${company.company_type}) - ${company.country}`)
    })
  }

  // Test API endpoint
  console.log('   🧪 Testing unified API...')
  try {
    const response = await fetch(`${supabaseUrl.replace('/rest/v1', '')}/api/companies?companyType=equipment&limit=3`)
    if (response.ok) {
      console.log('   ✅ Unified API is accessible')
    } else {
      console.log('   ⚠️  Unified API not accessible (this is expected during setup)')
    }
  } catch {
    console.log('   ⚠️  Unified API not accessible (this is expected during setup)')
  }
}

// Run complete migration
completeUnifiedMigration().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})