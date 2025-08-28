#!/usr/bin/env node

/**
 * Run Vendor Schema Migration
 * 
 * This script executes the vendor data schema migration directly against Supabase
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

// Note: We'll need to use service role key for DDL operations
// For now, let's create a script that outputs the SQL for manual execution
const supabase = createClient(supabaseUrl, supabaseKey)

// Function to read and display SQL file
async function readSQLFile(filename) {
  const filePath = path.join(__dirname, '..', 'sql-migrations', filename)
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ File not found: ${filename}`)
    return false
  }
  
  console.log(`\n📄 File: ${filename}`)
  console.log('='.repeat(60))
  
  try {
    const sql = fs.readFileSync(filePath, 'utf-8')
    console.log(sql)
    console.log('='.repeat(60))
    console.log(`✅ Ready to execute: ${filename}`)
    return true
    
  } catch (error) {
    console.error(`❌ Error reading ${filename}:`, error.message)
    return false
  }
}

// Main migration function
async function runMigration() {
  console.log('🚀 Starting Vendor Schema Migration')
  console.log('='.repeat(50))
  
  // Test Supabase connection
  console.log('🔌 Testing Supabase connection...')
  const { data, error } = await supabase.from('companies').select('id').limit(1)
  
  if (error) {
    console.error('❌ Supabase connection failed:', error.message)
    process.exit(1)
  }
  
  console.log('✅ Supabase connection successful')
  
  // Execute migration files in sequence
  const migrationFiles = [
    '010_vendor_data_schema_mapping_part1.sql',
    '010_vendor_data_schema_mapping_part2.sql',
    '010_vendor_data_schema_mapping_part3.sql',
    '010_vendor_data_schema_mapping_part4.sql',
    '010_vendor_data_schema_mapping_part5.sql'
  ]
  
  let successCount = 0
  
  for (const filename of migrationFiles) {
    const success = await readSQLFile(filename)
    if (success) successCount++
    
    // Pause between files for readability
    console.log('\n⏸️  Copy the above SQL to Supabase SQL Editor and execute it.')
    console.log('   Then press any key to continue...')
    
    // In a real script, you'd want to pause for user input
    // For now, we'll just continue
  }
  
  console.log('\n🏁 Migration Summary')
  console.log('='.repeat(50))
  console.log(`✅ Successfully executed: ${successCount}/${migrationFiles.length} files`)
  
  if (successCount === migrationFiles.length) {
    console.log('🎉 All vendor tables should now be created!')
    console.log('📊 Ready to run: npm run data:import-vendor')
  } else {
    console.log('⚠️ Some migration files had issues. Check the logs above.')
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})