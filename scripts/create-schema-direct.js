#!/usr/bin/env node

/**
 * Direct Schema Creation
 * 
 * This script attempts to create the unified schema directly using SQL commands
 * that are compatible with Supabase's query interface.
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
 * Create unified schema step by step
 */
async function createUnifiedSchema() {
  console.log('🚀 Creating Unified Companies Schema Directly')
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

    console.log('\n⚠️  IMPORTANT: This script will attempt to create tables directly.')
    console.log('   If this fails, you will need to run the SQL manually in Supabase SQL Editor.')
    console.log('   File: sql-migrations/020_unified_companies_schema.sql\n')

    // Step 1: Try to create companies_unified table
    console.log('🔧 Step 1: Creating companies_unified table...')
    
    // Use Supabase's rpc function to execute raw SQL
    const createCompaniesTableSQL = `
      CREATE TABLE IF NOT EXISTS companies_unified (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(500) NOT NULL,
        website VARCHAR(500),
        description TEXT,
        country VARCHAR(100),
        state VARCHAR(100),
        city VARCHAR(100), 
        lat DECIMAL(10,8),
        lng DECIMAL(11,8),
        company_type VARCHAR(50) NOT NULL CHECK (company_type IN ('equipment', 'service', 'material', 'software')),
        company_role VARCHAR(50) NOT NULL CHECK (company_role IN ('manufacturer', 'provider', 'supplier', 'developer', 'researcher')),
        segment VARCHAR(50) CHECK (segment IN ('industrial', 'professional', 'desktop', 'research', 'enterprise')),
        primary_market VARCHAR(100),
        secondary_markets TEXT[],
        employee_count_range VARCHAR(50),
        annual_revenue_range VARCHAR(50),
        founded_year INTEGER,
        is_public_company BOOLEAN DEFAULT FALSE,
        stock_ticker VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        data_source VARCHAR(100),
        last_verified TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(name, company_type, company_role)
      );
    `

    try {
      // Try executing via RPC - this might not work depending on Supabase setup
      const { error: rpcError } = await supabase.rpc('exec', { sql: createCompaniesTableSQL })
      
      if (rpcError) {
        console.log('⚠️  RPC method failed, trying alternative approach...')
        
        // Alternative: Try creating via direct query (this likely won't work for CREATE TABLE)
        const { error: queryError } = await supabase.from('companies_unified').select('id').limit(1)
        
        if (queryError && queryError.message.includes('does not exist')) {
          console.log('❌ Cannot create tables programmatically.')
          console.log('\n📋 MANUAL SCHEMA CREATION REQUIRED:')
          console.log('   1. Open Supabase Dashboard → SQL Editor')
          console.log('   2. Copy and paste the contents of:')
          console.log('      sql-migrations/020_unified_companies_schema.sql')
          console.log('   3. Execute the SQL')
          console.log('   4. Re-run: npm run setup:unified')
          console.log('\n💡 This creates all necessary tables and relationships.')
          process.exit(0)
        } else if (!queryError) {
          console.log('✅ companies_unified table already exists')
        }
      } else {
        console.log('✅ companies_unified table created successfully')
      }
    } catch (err) {
      console.log('❌ Table creation failed:', err.message)
      console.log('\n📋 Please create the schema manually using the SQL file.')
      process.exit(0)
    }

    // If we get here, let's try to run the migration
    console.log('\n🔄 Schema appears to exist. Running data migration...')
    
    // Import and run the migration logic from our other script
    const { execSync } = require('child_process')
    
    try {
      execSync('npm run setup:unified', { stdio: 'inherit', cwd: process.cwd() })
    } catch (migrationError) {
      console.log('⚠️  Migration step needs to be run separately')
      console.log('   Run: npm run setup:unified')
    }
    
  } catch (error) {
    console.error('💥 Schema creation failed:', error.message)
    
    console.log('\n📋 FALLBACK INSTRUCTIONS:')
    console.log('1. Open Supabase Dashboard → SQL Editor')
    console.log('2. Execute: sql-migrations/020_unified_companies_schema.sql')
    console.log('3. Run: npm run setup:unified')
    console.log('4. Verify: npm run verify:unified')
    
    process.exit(1)
  }
}

// Run schema creation
createUnifiedSchema().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})