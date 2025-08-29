#!/usr/bin/env node

/**
 * Import Mergers & Acquisitions Data Script
 * 
 * This script imports M&A data from CSV into the mergers_acquisitions table
 * and attempts to link companies by name to existing company records.
 * 
 * CSV Format: Deal date, Acquired company, Acquiring company, Deal size ($M), Country
 * DB Schema: announcement_date, acquired_company_name, acquiring_company_name, 
 *           deal_size_millions, acquired_company_id, acquiring_company_id
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Parse date from "MMM YY" format to proper date
 * @param {string} dateStr - Date string like "Feb 24", "Jan 24"
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  
  const [month, year] = dateStr.trim().split(' ');
  const monthMap = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };
  
  const fullYear = parseInt(year) < 50 ? `20${year}` : `19${year}`;
  const monthNum = monthMap[month];
  
  if (!monthNum) {
    console.warn(`⚠️  Could not parse date: ${dateStr}`);
    return null;
  }
  
  // Use first day of month since we don't have specific dates
  return `${fullYear}-${monthNum}-01`;
}

/**
 * Parse deal size from string to number
 * @param {string} dealSize - Deal size string like "86.34", "0"
 * @returns {number|null} Deal size in millions
 */
function parseDealSize(dealSize) {
  if (!dealSize || dealSize.trim() === '' || dealSize.trim() === '0') {
    return null;
  }
  
  const parsed = parseFloat(dealSize.trim());
  return isNaN(parsed) ? null : parsed;
}

/**
 * Clean company name for better matching
 * @param {string} name - Company name
 * @returns {string} Cleaned company name
 */
function cleanCompanyName(name) {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/['"]/g, '') // Remove quotes
    .replace(/\s*\([^)]*\)\s*$/, '') // Remove trailing parentheses like "(NAS: ALGN)"
    .replace(/\s*,.*$/, '') // Remove trailing commas and everything after
    .trim();
}

/**
 * Find company ID by name in the companies table
 * @param {string} companyName - Company name to search for
 * @returns {Promise<string|null>} Company ID or null if not found
 */
async function findCompanyId(companyName) {
  if (!companyName) return null;
  
  const cleanName = cleanCompanyName(companyName);
  
  // Try exact match first
  const { data: exactMatch } = await supabase
    .from('companies')
    .select('id, name')
    .ilike('name', cleanName)
    .limit(1);
  
  if (exactMatch && exactMatch.length > 0) {
    return exactMatch[0].id;
  }
  
  // Try partial match (case-insensitive contains)
  const { data: partialMatch } = await supabase
    .from('companies')
    .select('id, name')
    .ilike('name', `%${cleanName}%`)
    .limit(1);
  
  if (partialMatch && partialMatch.length > 0) {
    console.log(`📝 Partial match found: "${cleanName}" → "${partialMatch[0].name}"`);
    return partialMatch[0].id;
  }
  
  console.log(`❌ No company found for: "${cleanName}"`);
  return null;
}

/**
 * Process and import M&A data
 */
async function importMergersAcquisitions() {
  console.log('🚀 Starting Mergers & Acquisitions data import...');
  
  const csvPath = path.join(process.cwd(), 'docs/project-documents/04-data/market-data/M_A.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }
  
  const csvData = fs.readFileSync(csvPath, 'utf-8')
    // Clean Unicode non-breaking spaces and other special characters
    .replace(/[\u2009\u200A\u200B\u202F\u205F\u00A0]/g, ' ')
    .replace(/\u2060/g, '') // Word joiner
    .replace(/[\u200E\u200F]/g, ''); // Left-to-right/Right-to-left mark
  
  return new Promise((resolve, reject) => {
    const records = [];
    
    parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }, async (err, data) => {
      if (err) {
        console.error('❌ Error parsing CSV:', err);
        reject(err);
        return;
      }
      
      console.log(`📊 Processing ${data.length} M&A records...`);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const row of data) {
        try {
          // Handle the Unicode spaces in column names by trying multiple variations
          const headers = Object.keys(row);
          const dealDateHeader = headers.find(h => h.toLowerCase().includes('deal date'));
          const acquiredHeader = headers.find(h => h.toLowerCase().includes('acquired company'));
          const acquiringHeader = headers.find(h => h.toLowerCase().includes('acquiring company'));
          const dealSizeHeader = headers.find(h => h.toLowerCase().includes('deal size'));
          const countryHeader = headers.find(h => h.toLowerCase().includes('country'));
          
          const dealDate = parseDate(row[dealDateHeader]);
          const acquiredCompany = row[acquiredHeader]?.trim();
          const acquiringCompany = row[acquiringHeader]?.trim();
          const dealSize = parseDealSize(row[dealSizeHeader]);
          const country = row[countryHeader]?.trim();
          
          console.log(`🔍 Processing: ${acquiredCompany} ← ${acquiringCompany}`);
          
          if (!acquiredCompany || !acquiringCompany) {
            console.warn(`⚠️  Skipping record with missing company names`);
            continue;
          }
          
          // Try to find company IDs
          const [acquiredCompanyId, acquiringCompanyId] = await Promise.all([
            findCompanyId(acquiredCompany),
            findCompanyId(acquiringCompany)
          ]);
          
          const record = {
            acquired_company_name: acquiredCompany,
            acquiring_company_name: acquiringCompany,
            announcement_date: dealDate,
            deal_size_millions: dealSize,
            acquired_company_id: acquiredCompanyId,
            acquiring_company_id: acquiringCompanyId,
            deal_status: 'completed', // Default status
            notes: country ? `Country: ${country}` : null
          };
          
          const { error } = await supabase
            .from('mergers_acquisitions')
            .insert(record);
          
          if (error) {
            console.error(`❌ Error inserting record for ${acquiredCompany}:`, error.message);
            errorCount++;
          } else {
            console.log(`✅ Imported: ${acquiredCompany} ← ${acquiringCompany}`);
            successCount++;
          }
          
          // Small delay to avoid overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`❌ Error processing record:`, error);
          errorCount++;
        }
      }
      
      console.log('\n📈 Import Summary:');
      console.log(`✅ Successfully imported: ${successCount} records`);
      console.log(`❌ Failed imports: ${errorCount} records`);
      console.log(`📊 Total processed: ${successCount + errorCount} records`);
      
      resolve();
    });
  });
}

// Run the import
if (import.meta.url === `file://${process.argv[1]}`) {
  importMergersAcquisitions()
    .then(() => {
      console.log('🎉 Mergers & Acquisitions import completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Import failed:', error);
      process.exit(1);
    });
}

export default importMergersAcquisitions;