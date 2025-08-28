#!/usr/bin/env node

/**
 * Setup Complete Unified Schema
 * 
 * This script creates the unified companies schema and then migrates the data.
 * It uses individual table operations that work with Supabase's standard interface.
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
 * Setup unified schema and migrate data
 */
async function setupCompleteSchema() {
  console.log('🚀 Setting Up Complete Unified Companies Schema')
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

    // Step 1: Check if schema already exists
    console.log('\n🔍 Step 1: Checking existing schema...')
    const { data: existingSchema } = await supabase
      .from('companies_unified')
      .select('id')
      .limit(1)

    if (existingSchema) {
      console.log('⚠️  Unified schema already exists. Proceeding with data migration...')
    } else {
      console.log('❌ Unified schema does not exist.')
      console.log('\n📋 MANUAL SETUP REQUIRED:')
      console.log('   1. Open Supabase SQL Editor')
      console.log('   2. Execute: sql-migrations/020_unified_companies_schema.sql')
      console.log('   3. Re-run this script: npm run migrate:unified')
      console.log('\n💡 The schema file creates all necessary tables and relationships.')
      process.exit(0)
    }

    // Step 2: Setup base data
    console.log('\n🔧 Step 2: Setting up base technologies and materials...')
    
    // Insert technologies
    const technologies = [
      { name: 'DMLS', category: 'Metal Printing', description: 'Direct Metal Laser Sintering', process_type: 'DMLS' },
      { name: 'SLM', category: 'Metal Printing', description: 'Selective Laser Melting', process_type: 'SLM' },
      { name: 'EBM', category: 'Metal Printing', description: 'Electron Beam Melting', process_type: 'EBM' },
      { name: 'FDM', category: 'Material Extrusion', description: 'Fused Deposition Modeling', process_type: 'FDM' },
      { name: 'FFF', category: 'Material Extrusion', description: 'Fused Filament Fabrication', process_type: 'FFF' },
      { name: 'SLA', category: 'Vat Photopolymerization', description: 'Stereolithography', process_type: 'SLA' },
      { name: 'SLS', category: 'Powder Bed Fusion', description: 'Selective Laser Sintering', process_type: 'SLS' },
      { name: 'MJF', category: 'Powder Bed Fusion', description: 'Multi Jet Fusion', process_type: 'MJF' },
      { name: 'PolyJet', category: 'Material Jetting', description: 'PolyJet Technology', process_type: 'PolyJet' }
    ]

    const { error: techError } = await supabase
      .from('technologies_unified')
      .upsert(technologies, { onConflict: 'name' })

    console.log(techError ? `⚠️  Technologies: ${techError.message}` : `✅ Technologies: ${technologies.length} added`)

    // Insert materials
    const materials = [
      { name: 'Titanium Ti6Al4V', material_type: 'Metal', material_format: 'Powder', description: 'Titanium alloy for aerospace' },
      { name: 'Stainless Steel 316L', material_type: 'Metal', material_format: 'Powder', description: 'Industrial stainless steel' },
      { name: 'Aluminum AlSi10Mg', material_type: 'Metal', material_format: 'Powder', description: 'Lightweight aluminum alloy' },
      { name: 'PLA', material_type: 'Thermoplastic', material_format: 'Filament', description: 'Polylactic acid' },
      { name: 'ABS', material_type: 'Thermoplastic', material_format: 'Filament', description: 'ABS thermoplastic' },
      { name: 'Nylon', material_type: 'Thermoplastic', material_format: 'Powder', description: 'Polyamide material' },
      { name: 'Standard Resin', material_type: 'Thermoset', material_format: 'Resin', description: 'Photopolymer resin' },
      { name: 'Metal', material_type: 'Metal', material_format: 'Powder', description: 'Generic metal materials' },
      { name: 'Thermoplastic', material_type: 'Thermoplastic', material_format: 'Filament', description: 'Generic thermoplastic' },
      { name: 'Thermoset', material_type: 'Thermoset', material_format: 'Resin', description: 'Generic thermoset materials' }
    ]

    const { error: materialError } = await supabase
      .from('materials_unified')
      .upsert(materials, { onConflict: 'name,material_type' })

    console.log(materialError ? `⚠️  Materials: ${materialError.message}` : `✅ Materials: ${materials.length} added`)

    // Step 3: Migrate company data
    console.log('\n🔧 Step 3: Migrating company data from vendor tables...')
    
    let totalMigrated = 0

    // Migrate AM Systems Manufacturers
    const { data: vendorAM } = await supabase
      .from('vendor_am_systems_manufacturers')
      .select('*')

    if (vendorAM && vendorAM.length > 0) {
      console.log(`📊 Found ${vendorAM.length} AM systems manufacturers`)
      
      const amCompanies = vendorAM
        .filter(company => company.company_name)
        .map(company => ({
          name: company.company_name,
          country: company.country || null,
          company_type: 'equipment',
          company_role: 'manufacturer',
          segment: ['industrial', 'professional', 'desktop', 'research'].includes(company.segment?.toLowerCase()) 
                    ? company.segment.toLowerCase() : 'industrial',
          primary_market: 'manufacturing',
          is_active: true,
          data_source: 'vendor_am_systems_manufacturers',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))

      const { data: insertedAM, error: amError } = await supabase
        .from('companies_unified')
        .upsert(amCompanies, { onConflict: 'name,company_type,company_role' })
        .select('id')

      if (amError) {
        console.log('⚠️  AM companies migration warning:', amError.message)
      } else {
        totalMigrated += amCompanies.length
        console.log(`✅ Migrated ${amCompanies.length} AM systems manufacturers`)
      }
    } else {
      console.log('⚠️  No vendor_am_systems_manufacturers data found')
    }

    // Migrate Print Service Providers
    const { data: vendorPS } = await supabase
      .from('vendor_print_services_global')
      .select('*')

    if (vendorPS && vendorPS.length > 0) {
      console.log(`📊 Found ${vendorPS.length} print service providers`)
      
      const psCompanies = vendorPS
        .filter(company => company.company_name)
        .map(company => ({
          name: company.company_name,
          country: company.country || null,
          company_type: 'service',
          company_role: 'provider',
          segment: ['industrial', 'professional', 'desktop', 'research'].includes(company.segment?.toLowerCase()) 
                    ? company.segment.toLowerCase() : 'professional',
          primary_market: 'services',
          is_active: true,
          data_source: 'vendor_print_services_global',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))

      const { data: insertedPS, error: psError } = await supabase
        .from('companies_unified')
        .upsert(psCompanies, { onConflict: 'name,company_type,company_role' })
        .select('id')

      if (psError) {
        console.log('⚠️  Print service companies migration warning:', psError.message)
      } else {
        totalMigrated += psCompanies.length
        console.log(`✅ Migrated ${psCompanies.length} print service providers`)
      }
    } else {
      console.log('⚠️  No vendor_print_services_global data found')
    }

    // Step 4: Add some sample data if no vendor data exists
    if (totalMigrated === 0) {
      console.log('\n🎭 Step 4: Adding sample data for testing...')
      
      const sampleCompanies = [
        {
          name: 'EOS GmbH',
          country: 'Germany',
          company_type: 'equipment',
          company_role: 'manufacturer',
          segment: 'industrial',
          primary_market: 'manufacturing',
          website: 'https://eos.info',
          is_active: true,
          data_source: 'sample_data'
        },
        {
          name: 'Stratasys',
          country: 'United States',
          company_type: 'equipment', 
          company_role: 'manufacturer',
          segment: 'professional',
          primary_market: 'manufacturing',
          website: 'https://stratasys.com',
          is_active: true,
          data_source: 'sample_data'
        },
        {
          name: 'Protolabs',
          country: 'United States',
          company_type: 'service',
          company_role: 'provider',
          segment: 'professional',
          primary_market: 'services',
          website: 'https://protolabs.com',
          is_active: true,
          data_source: 'sample_data'
        },
        {
          name: 'Sculpteo',
          country: 'France',
          company_type: 'service',
          company_role: 'provider', 
          segment: 'professional',
          primary_market: 'services',
          website: 'https://sculpteo.com',
          is_active: true,
          data_source: 'sample_data'
        }
      ]

      const { error: sampleError } = await supabase
        .from('companies_unified')
        .upsert(sampleCompanies, { onConflict: 'name,company_type,company_role' })

      if (sampleError) {
        console.log('⚠️  Sample data warning:', sampleError.message)
      } else {
        console.log(`✅ Added ${sampleCompanies.length} sample companies for testing`)
      }
    }

    // Step 5: Verify final results
    console.log('\n🔍 Step 5: Verifying migration results...')
    
    const [companiesResult, techResult, materialResult] = await Promise.all([
      supabase.from('companies_unified').select('*', { count: 'exact' }),
      supabase.from('technologies_unified').select('id', { count: 'exact' }),
      supabase.from('materials_unified').select('id', { count: 'exact' })
    ])

    console.log('\n📈 Final Results:')
    console.log(`   Companies: ${companiesResult.count || 0}`)
    console.log(`   Technologies: ${techResult.count || 0}`)
    console.log(`   Materials: ${materialResult.count || 0}`)

    if (companiesResult.data && companiesResult.data.length > 0) {
      const distribution = companiesResult.data.reduce((acc, company) => {
        const key = `${company.company_type}/${company.company_role}`
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})

      console.log('\n📊 Company Distribution:')
      Object.entries(distribution).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`)
      })

      // Show sample companies
      console.log('\n🏢 Sample Companies:')
      companiesResult.data.slice(0, 5).forEach(company => {
        console.log(`   ${company.name} (${company.company_type}/${company.company_role}) - ${company.country}`)
      })
    }

    console.log('\n🎉 Setup completed successfully!')
    console.log('='.repeat(60))
    console.log('🧪 Test the system:')
    console.log('1. Dashboard: /dashboard?dataset=am-systems-manufacturers&view=table')
    console.log('2. API Equipment: /api/companies?companyType=equipment')
    console.log('3. API Services: /api/companies?companyType=service')
    console.log('4. Verify: npm run verify:unified')
    
  } catch (error) {
    console.error('💥 Setup failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run the setup
setupCompleteSchema().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})