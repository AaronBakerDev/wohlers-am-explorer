#!/usr/bin/env node

/**
 * Import pricing data from CSV into Supabase
 * Handles the remaining ~3,456 records from Print_services_Pricing_data.csv
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// File paths
const PRICING_CSV = path.join(__dirname, '../../project-documents/04-data/extracted-vendor-data/Print_services_Pricing_data.csv');

/**
 * Parse price string to numeric value
 */
function parsePrice(priceStr) {
  if (!priceStr) return null;
  // Remove currency symbols, commas, and spaces
  const cleaned = priceStr.toString().replace(/[$,\s]/g, '');
  const price = parseFloat(cleaned);
  return isNaN(price) ? null : price;
}

/**
 * Parse lead time to days
 */
function parseLeadTime(leadTimeStr) {
  if (!leadTimeStr) return null;
  // Extract numeric value
  const match = leadTimeStr.toString().match(/\d+/);
  if (match) {
    return parseInt(match[0]);
  }
  return null;
}

/**
 * Parse quantity value
 */
function parseQuantity(qtyStr) {
  if (!qtyStr) return null;
  const cleaned = qtyStr.toString().replace(/,/g, '');
  const qty = parseInt(cleaned);
  return isNaN(qty) ? null : qty;
}

/**
 * Find or create company by name
 */
async function findOrCreateCompany(companyName) {
  if (!companyName || companyName.trim() === '') return null;

  // First try exact match
  const { data: exactMatch } = await supabase
    .from('companies')
    .select('id')
    .ilike('name', companyName.trim())
    .limit(1)
    .single();

  if (exactMatch) return exactMatch.id;

  // Try fuzzy match (simplified - just check if name contains or is contained)
  const { data: fuzzyMatch } = await supabase
    .from('companies')
    .select('id, name')
    .or(`name.ilike.%${companyName.trim()}%,name.ilike.${companyName.trim()}%`)
    .limit(1)
    .single();

  if (fuzzyMatch) return fuzzyMatch.id;

  // Create new company if not found
  console.log(`Creating new company: ${companyName}`);
  const { data: newCompany, error } = await supabase
    .from('companies')
    .insert({
      name: companyName.trim(),
      company_type: 'service',
      description: 'Print service provider (imported from pricing data)',
      country: 'United States' // Default, will be updated if we have country data
    })
    .select('id')
    .single();

  if (error) {
    console.error(`Error creating company ${companyName}:`, error);
    return null;
  }

  return newCompany.id;
}

/**
 * Main import function
 */
async function importPricingData() {
  console.log('Starting pricing data import...');
  
  try {
    // Check if file exists
    if (!fs.existsSync(PRICING_CSV)) {
      console.error(`File not found: ${PRICING_CSV}`);
      return;
    }

    // Read CSV file
    const csvContent = fs.readFileSync(PRICING_CSV, 'utf-8');
    
    // Parse CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true
    });

    console.log(`Found ${records.length} records in CSV`);

    // Check existing records to avoid duplicates
    const { count: existingCount } = await supabase
      .from('service_pricing')
      .select('*', { count: 'exact', head: true });

    console.log(`Existing records in database: ${existingCount}`);

    // Process records in batches
    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, Math.min(i + batchSize, records.length));
      const pricingRecords = [];

      for (const row of batch) {
        // Map CSV columns to database fields based on actual CSV structure
        const companyName = row['Company name'];
        const process = row['Process'];
        const materialType = row['Material type']; // e.g., "Polymer"
        const material = row['Material']; // e.g., "ABS"
        const quantity = parseQuantity(row['Quantity']);
        const price = parsePrice(row['Manufacturing cost']);
        const shippingCost = parsePrice(row['Shipping cost']);
        const leadTime = parseLeadTime(row['Lead time']);
        const country = row['Country'] || 'United States';

        // Skip if essential fields are missing
        if (!companyName && !process && !price) {
          skipCount++;
          continue;
        }

        // Find or create company
        const companyId = companyName ? await findOrCreateCompany(companyName) : null;

        pricingRecords.push({
          company_id: companyId,
          process: process || 'Unknown',
          material_category: materialType || 'Unknown',
          specific_material: material || materialType || 'Unknown',
          quantity: quantity || 1,
          price_usd: price,
          lead_time_days: leadTime,
          notes: shippingCost ? `Shipping cost: $${shippingCost}` : null,
          data_source: 'vendor_import_2025'
        });
      }

      // Insert batch
      if (pricingRecords.length > 0) {
        const { data, error } = await supabase
          .from('service_pricing')
          .insert(pricingRecords)
          .select();

        if (error) {
          console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
          errorCount += pricingRecords.length;
        } else {
          successCount += data.length;
          console.log(`Inserted batch ${i / batchSize + 1}: ${data.length} records`);
        }
      }
    }

    // Final report
    console.log('\n=== Import Complete ===');
    console.log(`✅ Success: ${successCount} records`);
    console.log(`❌ Errors: ${errorCount} records`);
    console.log(`⏭️  Skipped: ${skipCount} records`);
    console.log(`📊 Total processed: ${records.length} records`);

    // Verify final count
    const { count: finalCount } = await supabase
      .from('service_pricing')
      .select('*', { count: 'exact', head: true });

    console.log(`\nTotal records in database: ${finalCount}`);

  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

// Run import
importPricingData()
  .then(() => {
    console.log('\n✅ Import completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });