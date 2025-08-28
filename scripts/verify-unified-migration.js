#!/usr/bin/env node

/**
 * Verify Unified Companies Schema Migration
 * 
 * This script verifies that the migration from vendor_* tables to the unified
 * companies schema was successful. It runs various checks and generates a report.
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
 * Verify table existence and data
 */
async function verifyTables() {
  console.log('🔍 Verifying unified schema tables...\n')

  const tables = [
    'companies_unified',
    'technologies_unified', 
    'materials_unified',
    'company_technologies',
    'company_materials'
  ]

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1)

      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: ${count || 0} records`)
        if (data && data.length > 0) {
          const sampleRecord = data[0]
          const sampleFields = Object.keys(sampleRecord).slice(0, 3).join(', ')
          console.log(`   Sample fields: ${sampleFields}`)
        }
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`)
    }
  }
}

/**
 * Check data distribution
 */
async function checkDataDistribution() {
  console.log('\n📊 Analyzing data distribution...\n')

  try {
    // Company type distribution
    const { data: companyTypes, error: typeError } = await supabase
      .from('companies_unified')
      .select('company_type, company_role')

    if (typeError) {
      console.log('❌ Could not fetch company distribution:', typeError.message)
    } else {
      const distribution = companyTypes.reduce((acc, company) => {
        const key = `${company.company_type}/${company.company_role}`
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})

      console.log('Company Type/Role Distribution:')
      Object.entries(distribution).forEach(([type, count]) => {
        console.log(`  ${type}: ${count} companies`)
      })
    }

    // Country distribution  
    const { data: countries } = await supabase
      .from('companies_unified')
      .select('country')
      .not('country', 'is', null)

    if (countries) {
      const countryDist = countries.reduce((acc, { country }) => {
        acc[country] = (acc[country] || 0) + 1
        return acc
      }, {})

      const topCountries = Object.entries(countryDist)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)

      console.log('\nTop Countries:')
      topCountries.forEach(([country, count]) => {
        console.log(`  ${country}: ${count} companies`)
      })
    }

  } catch (error) {
    console.log('❌ Data distribution check failed:', error.message)
  }
}

/**
 * Test relationships
 */
async function testRelationships() {
  console.log('\n🔗 Testing table relationships...\n')

  try {
    // Test company-technology relationships
    const { data: companyTechSample } = await supabase
      .from('company_technologies')
      .select(`
        companies_unified(name, company_type),
        technologies_unified(name, category)
      `)
      .limit(3)

    if (companyTechSample && companyTechSample.length > 0) {
      console.log('✅ Company-Technology relationships working:')
      companyTechSample.forEach(rel => {
        if (rel.companies_unified && rel.technologies_unified) {
          console.log(`  ${rel.companies_unified.name} → ${rel.technologies_unified.name}`)
        }
      })
    } else {
      console.log('⚠️ No company-technology relationships found')
    }

    // Test company-material relationships  
    const { data: companyMaterialSample } = await supabase
      .from('company_materials')
      .select(`
        companies_unified(name, company_type),
        materials_unified(name, material_type)
      `)
      .limit(3)

    if (companyMaterialSample && companyMaterialSample.length > 0) {
      console.log('\n✅ Company-Material relationships working:')
      companyMaterialSample.forEach(rel => {
        if (rel.companies_unified && rel.materials_unified) {
          console.log(`  ${rel.companies_unified.name} → ${rel.materials_unified.name}`)
        }
      })
    } else {
      console.log('\n⚠️ No company-material relationships found')
    }

  } catch (error) {
    console.log('❌ Relationship test failed:', error.message)
  }
}

/**
 * Test unified API compatibility
 */
async function testAPICompatibility() {
  console.log('\n🧪 Testing API compatibility...\n')

  // Test basic queries that the unified API would make
  const testQueries = [
    {
      name: 'Equipment Manufacturers',
      query: { company_type: 'eq.equipment' }
    },
    {
      name: 'Service Providers',
      query: { company_type: 'eq.service' }
    },
    {
      name: 'Companies with websites',
      query: { website: 'not.is.null' }
    }
  ]

  for (const test of testQueries) {
    try {
      const { data, error, count } = await supabase
        .from('companies_unified')
        .select('id, name, company_type, company_role, website', { count: 'exact' })
        .match(test.query)
        .limit(3)

      if (error) {
        console.log(`❌ ${test.name}: ${error.message}`)
      } else {
        console.log(`✅ ${test.name}: ${count || 0} records`)
        if (data && data.length > 0) {
          data.forEach(company => {
            console.log(`   - ${company.name} (${company.company_type}/${company.company_role})`)
          })
        }
      }
    } catch (err) {
      console.log(`❌ ${test.name}: ${err.message}`)
    }
  }
}

/**
 * Compare with legacy data
 */
async function compareLegacyData() {
  console.log('\n🔄 Comparing with legacy vendor data...\n')

  try {
    // Check AM systems manufacturers migration
    const [legacyAM, unifiedAM] = await Promise.all([
      supabase.from('vendor_am_systems_manufacturers').select('*', { count: 'exact' }).limit(0),
      supabase.from('companies_unified').select('*', { count: 'exact' }).eq('company_type', 'equipment').limit(0)
    ])

    console.log(`AM Systems - Legacy: ${legacyAM.count || 0}, Unified: ${unifiedAM.count || 0}`)

    // Check print services migration  
    const [legacyPS, unifiedPS] = await Promise.all([
      supabase.from('vendor_print_services_global').select('*', { count: 'exact' }).limit(0),
      supabase.from('companies_unified').select('*', { count: 'exact' }).eq('company_type', 'service').limit(0)
    ])

    console.log(`Print Services - Legacy: ${legacyPS.count || 0}, Unified: ${unifiedPS.count || 0}`)

    // Check website migration
    const { data: websiteCheck } = await supabase
      .from('companies_unified')
      .select('name, website')
      .not('website', 'is', null)
      .limit(3)

    if (websiteCheck && websiteCheck.length > 0) {
      console.log('\n✅ Website data migrated:')
      websiteCheck.forEach(company => {
        console.log(`   ${company.name}: ${company.website}`)
      })
    }

  } catch (error) {
    console.log('❌ Legacy comparison failed:', error.message)
  }
}

/**
 * Main verification function
 */
async function runVerification() {
  console.log('🔍 Unified Companies Schema Migration Verification')
  console.log('='.repeat(60))

  try {
    // Test connection
    console.log('🔌 Testing Supabase connection...')
    const { data, error } = await supabase.from('companies_unified').select('id').limit(1)
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      if (error.message.includes('does not exist')) {
        console.log('\n💡 It appears the unified schema has not been created yet.')
        console.log('   Please run the migration first:')
        console.log('   1. Execute sql-migrations/020_unified_companies_schema.sql')
        console.log('   2. Execute sql-migrations/021_migrate_vendor_to_unified_companies_manual.sql')
      }
      process.exit(1)
    }
    
    console.log('✅ Connection successful\n')

    // Run all verification steps
    await verifyTables()
    await checkDataDistribution()
    await testRelationships() 
    await testAPICompatibility()
    await compareLegacyData()

    console.log('\n🎉 Verification completed!')
    console.log('='.repeat(60))
    console.log('Next steps:')
    console.log('1. Test the dashboard at /dashboard?dataset=am-systems-manufacturers')
    console.log('2. Test the unified API at /api/companies?companyType=equipment')
    console.log('3. Verify filtering and search functionality')

  } catch (error) {
    console.error('💥 Verification failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run the verification
runVerification().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})