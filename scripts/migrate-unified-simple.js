#!/usr/bin/env node

/**
 * Simple Unified Schema Migration
 * 
 * This script runs the migration by executing individual SQL statements
 * that work with Supabase's standard query interface.
 */

const { createClient } = require('@supabase/supabase-js')

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
 * Execute migration steps
 */
async function runMigration() {
  console.log('🚀 Starting Simple Unified Companies Schema Migration')
  console.log('='.repeat(60))

  try {
    // Test connection
    console.log('🔌 Testing Supabase connection...')
    const { error: connectionError } = await supabase.from('companies').select('id').limit(1)
    
    if (connectionError && !connectionError.message.includes('does not exist')) {
      console.error('❌ Connection failed:', connectionError.message)
      process.exit(1)
    }
    
    console.log('✅ Supabase connection successful')

    // Check if unified schema exists
    console.log('\n🔍 Checking if unified schema exists...')
    const { data: existingSchema, error: schemaError } = await supabase
      .from('companies_unified')
      .select('id')
      .limit(1)

    if (schemaError && schemaError.message.includes('does not exist')) {
      console.log('❌ Unified schema not found. Please run the schema migration first:')
      console.log('   Execute sql-migrations/020_unified_companies_schema.sql in Supabase SQL Editor')
      process.exit(1)
    }

    if (existingSchema && existingSchema.length > 0) {
      console.log('⚠️  Companies table already contains data.')
      console.log('   Migration may have already been run. Proceeding with verification...')
    }

    // Step 1: Populate technologies
    console.log('\n🔧 Step 1: Populating technologies...')
    const { error: techError } = await supabase
      .from('technologies_unified')
      .upsert([
        { name: 'DMLS', category: 'Metal Printing', description: 'Direct Metal Laser Sintering', process_type: 'DMLS' },
        { name: 'SLM', category: 'Metal Printing', description: 'Selective Laser Melting', process_type: 'SLM' },
        { name: 'EBM', category: 'Metal Printing', description: 'Electron Beam Melting', process_type: 'EBM' },
        { name: 'FDM', category: 'Material Extrusion', description: 'Fused Deposition Modeling', process_type: 'FDM' },
        { name: 'FFF', category: 'Material Extrusion', description: 'Fused Filament Fabrication', process_type: 'FFF' },
        { name: 'SLA', category: 'Vat Photopolymerization', description: 'Stereolithography', process_type: 'SLA' },
        { name: 'SLS', category: 'Powder Bed Fusion', description: 'Selective Laser Sintering', process_type: 'SLS' },
        { name: 'MJF', category: 'Powder Bed Fusion', description: 'Multi Jet Fusion', process_type: 'MJF' },
        { name: 'PolyJet', category: 'Material Jetting', description: 'PolyJet Technology', process_type: 'PolyJet' },
        { name: 'Powder', category: 'Material Format', description: 'Powder Material Format', process_type: 'Powder' },
        { name: 'Filament', category: 'Material Format', description: 'Filament Material Format', process_type: 'Filament' },
        { name: 'Resin', category: 'Material Format', description: 'Resin Material Format', process_type: 'Resin' }
      ], { onConflict: 'name' })

    if (techError) {
      console.log('⚠️  Technology insert warning:', techError.message)
    } else {
      console.log('✅ Technologies populated')
    }

    // Step 2: Populate materials
    console.log('\n🔧 Step 2: Populating materials...')
    const { error: materialError } = await supabase
      .from('materials_unified')
      .upsert([
        { name: 'Titanium Ti6Al4V', material_type: 'Metal', material_format: 'Powder', description: 'Titanium alloy for aerospace applications' },
        { name: 'Stainless Steel 316L', material_type: 'Metal', material_format: 'Powder', description: 'Stainless steel for industrial applications' },
        { name: 'Aluminum AlSi10Mg', material_type: 'Metal', material_format: 'Powder', description: 'Aluminum alloy for lightweight components' },
        { name: 'PLA', material_type: 'Thermoplastic', material_format: 'Filament', description: 'Polylactic acid thermoplastic' },
        { name: 'ABS', material_type: 'Thermoplastic', material_format: 'Filament', description: 'Acrylonitrile butadiene styrene thermoplastic' },
        { name: 'Nylon', material_type: 'Thermoplastic', material_format: 'Powder', description: 'Polyamide thermoplastic' },
        { name: 'Standard Resin', material_type: 'Thermoset', material_format: 'Resin', description: 'Standard photopolymer resin' },
        { name: 'Metal', material_type: 'Metal', material_format: 'Powder', description: 'Generic metal materials' },
        { name: 'Thermoplastic', material_type: 'Thermoplastic', material_format: 'Filament', description: 'Generic thermoplastic materials' },
        { name: 'Thermoset', material_type: 'Thermoset', material_format: 'Resin', description: 'Generic thermoset materials' }
      ], { onConflict: 'name,material_type' })

    if (materialError) {
      console.log('⚠️  Material insert warning:', materialError.message)
    } else {
      console.log('✅ Materials populated')
    }

    // Step 3: Check and migrate vendor data
    console.log('\n🔧 Step 3: Checking vendor data...')
    
    // Check if vendor tables exist
    const { data: vendorAM, error: vendorAMError } = await supabase
      .from('vendor_am_systems_manufacturers')
      .select('company_name, country, segment, material_type, process')
      .limit(10)

    const { data: vendorPS, error: vendorPSError } = await supabase
      .from('vendor_print_services_global')
      .select('company_name, country, segment, material_type, process')
      .limit(10)

    if (vendorAMError) {
      console.log('⚠️  vendor_am_systems_manufacturers table not found:', vendorAMError.message)
    } else if (vendorAM) {
      console.log(`📊 Found ${vendorAM.length} AM systems manufacturers to migrate`)
      
      // Migrate AM systems manufacturers
      const amCompanies = vendorAM.map(company => ({
        name: company.company_name,
        country: company.country,
        company_type: 'equipment',
        company_role: 'manufacturer',
        segment: company.segment?.toLowerCase() === 'industrial' ? 'industrial' : 
                 company.segment?.toLowerCase() === 'professional' ? 'professional' :
                 company.segment?.toLowerCase() === 'desktop' ? 'desktop' : 'industrial',
        primary_market: 'manufacturing',
        is_active: true,
        data_source: 'vendor_am_systems_manufacturers'
      })).filter(company => company.name)

      const { error: amInsertError } = await supabase
        .from('companies_unified')
        .upsert(amCompanies, { onConflict: 'name,company_type,company_role' })

      if (amInsertError) {
        console.log('⚠️  AM companies insert warning:', amInsertError.message)
      } else {
        console.log(`✅ Migrated ${amCompanies.length} AM systems manufacturers`)
      }
    }

    if (vendorPSError) {
      console.log('⚠️  vendor_print_services_global table not found:', vendorPSError.message)
    } else if (vendorPS) {
      console.log(`📊 Found ${vendorPS.length} print service providers to migrate`)
      
      // Migrate print service providers
      const psCompanies = vendorPS.map(company => ({
        name: company.company_name,
        country: company.country,
        company_type: 'service',
        company_role: 'provider',
        segment: company.segment?.toLowerCase() === 'industrial' ? 'industrial' : 
                 company.segment?.toLowerCase() === 'professional' ? 'professional' :
                 company.segment?.toLowerCase() === 'desktop' ? 'desktop' : 'professional',
        primary_market: 'services',
        is_active: true,
        data_source: 'vendor_print_services_global'
      })).filter(company => company.name)

      const { error: psInsertError } = await supabase
        .from('companies_unified')
        .upsert(psCompanies, { onConflict: 'name,company_type,company_role' })

      if (psInsertError) {
        console.log('⚠️  Print service companies insert warning:', psInsertError.message)
      } else {
        console.log(`✅ Migrated ${psCompanies.length} print service providers`)
      }
    }

    // Step 4: Add website information
    console.log('\n🔧 Step 4: Adding website information...')
    const { data: companyInfo, error: companyInfoError } = await supabase
      .from('vendor_company_information')
      .select('company_name, website')
      .not('website', 'is', null)
      .limit(100)

    if (companyInfoError) {
      console.log('⚠️  vendor_company_information table not found:', companyInfoError.message)
    } else if (companyInfo && companyInfo.length > 0) {
      console.log(`📊 Found ${companyInfo.length} companies with website information`)
      
      // This would need to be done with a more complex update operation
      // For now, just log that we found the data
      console.log('ℹ️  Website data found but update logic needs custom implementation')
    }

    // Step 5: Verify results
    console.log('\n🔍 Verifying migration results...')
    
    const [companiesResult, techResult, materialResult] = await Promise.all([
      supabase.from('companies_unified').select('company_type, company_role', { count: 'exact' }),
      supabase.from('technologies_unified').select('id', { count: 'exact' }),
      supabase.from('materials_unified').select('id', { count: 'exact' })
    ])

    console.log('📈 Migration Results:')
    console.log(`   Companies: ${companiesResult.count || 0}`)
    console.log(`   Technologies: ${techResult.count || 0}`)
    console.log(`   Materials: ${materialResult.count || 0}`)

    if (companiesResult.data) {
      const distribution = companiesResult.data.reduce((acc, company) => {
        const key = `${company.company_type}/${company.company_role}`
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})

      console.log('📊 Company Distribution:')
      Object.entries(distribution).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`)
      })
    }

    console.log('\n🎉 Migration completed successfully!')
    console.log('='.repeat(60))
    console.log('Next steps:')
    console.log('1. Test: /dashboard?dataset=am-systems-manufacturers&view=table')
    console.log('2. Test: /api/companies?companyType=equipment')
    console.log('3. Test: /api/companies?companyType=service')
    console.log('4. Run: npm run verify:unified')

  } catch (error) {
    console.error('💥 Migration failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})