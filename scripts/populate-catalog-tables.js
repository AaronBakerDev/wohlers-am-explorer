const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Initialize Supabase client with service role for data import
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Using key:', supabaseServiceKey ? 'Found' : 'Missing')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Need NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Set data directory - matches the CSV mode config
const dataDir = process.env.DATA_DIR || path.join(__dirname, '../../project-documents/04-data/extracted-vendor-data')

console.log('Data directory:', dataDir)

function readJsonFile(fileName) {
  const fullPath = path.join(dataDir, fileName)
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Data file not found: ${fullPath}`)
  }
  const content = fs.readFileSync(fullPath, 'utf8')
  return JSON.parse(content)
}

function categorizeTechnology(process) {
  const p = process.toLowerCase()
  if (p.includes('pbf') || p.includes('sls') || p.includes('powder bed')) return 'Powder Bed Fusion'
  if (p.includes('mex') || p.includes('fdm') || p.includes('fff')) return 'Material Extrusion'
  if (p.includes('vpp') || p.includes('sla') || p.includes('dlp')) return 'Vat Photopolymerization'
  if (p.includes('bjt') || p.includes('binder')) return 'Binder Jetting'
  if (p.includes('am-lwc') || p.includes('directed energy')) return 'Directed Energy Deposition'
  return 'Other'
}

function categorizeMaterial(material) {
  const m = material.toLowerCase()
  if (m.includes('pla') || m.includes('abs') || m.includes('petg') || m.includes('nylon') || m.includes('pc') || m.includes('asa') || m.includes('tpu')) return 'Plastics'
  if (m.includes('steel') || m.includes('aluminum') || m.includes('titanium') || m.includes('bronze') || m.includes('brass') || m.includes('316l') || m.includes('inconel')) return 'Metals'
  if (m.includes('resin') || m.includes('photopolymer')) return 'Resins'
  if (m.includes('ceramic') || m.includes('sand')) return 'Ceramics'
  if (m.includes('carbon') || m.includes('glass') || m.includes('kevlar')) return 'Composites'
  return 'Other'
}

async function clearExistingCatalogData() {
  console.log('Skipping catalog data clear (tables may have foreign key references)')
  console.log('Will use upsert logic to handle existing records')
}

async function populateTechnologies() {
  console.log('\\nPopulating technologies from pricing data...')
  
  const pricingData = readJsonFile('Print_services_Pricing_data.json')
  const technologiesSet = new Set()
  
  // Extract unique processes
  for (const row of pricingData) {
    const process = String(row['Process'] || '').trim()
    if (process) {
      technologiesSet.add(process)
    }
  }
  
  const technologies = Array.from(technologiesSet)
    .sort()
    .map(name => ({
      name,
      category: categorizeTechnology(name),
      description: `${name} additive manufacturing process`
    }))
  
  console.log(`Found ${technologies.length} unique technologies:`)
  technologies.forEach(tech => {
    console.log(`  - ${tech.name} (${tech.category})`)
  })
  
  // Insert technologies using upsert
  let inserted = 0
  let updated = 0
  
  for (const tech of technologies) {
    // Try to find existing technology by name
    const { data: existing, error: findError } = await supabase
      .from('technologies')
      .select('id')
      .eq('name', tech.name)
      .limit(1)
    
    if (findError) {
      console.error('Error finding technology:', findError)
      continue
    }
    
    if (existing && existing.length > 0) {
      // Update existing
      const { error: updateError } = await supabase
        .from('technologies')
        .update({
          category: tech.category,
          description: tech.description
        })
        .eq('id', existing[0].id)
      
      if (updateError) {
        console.error('Error updating technology:', updateError)
      } else {
        updated++
      }
    } else {
      // Insert new
      const { error: insertError } = await supabase
        .from('technologies')
        .insert(tech)
      
      if (insertError) {
        console.error('Error inserting technology:', insertError)
      } else {
        inserted++
      }
    }
  }
  
  console.log(`✓ Technologies: ${inserted} inserted, ${updated} updated`)
  return { inserted, updated }
}

async function populateMaterials() {
  console.log('\\nPopulating materials from pricing data...')
  
  const pricingData = readJsonFile('Print_services_Pricing_data.json')
  const materialsSet = new Set()
  
  // Extract unique materials
  for (const row of pricingData) {
    const material = String(row['Material type'] || row['Material'] || '').trim()
    if (material) {
      materialsSet.add(material)
    }
  }
  
  const materials = Array.from(materialsSet)
    .sort()
    .map(name => ({
      name,
      category: categorizeMaterial(name),
      description: `${name} material for additive manufacturing`
    }))
  
  console.log(`Found ${materials.length} unique materials:`)
  const categoryCount = {}
  materials.forEach(mat => {
    categoryCount[mat.category] = (categoryCount[mat.category] || 0) + 1
  })
  Object.entries(categoryCount).forEach(([cat, count]) => {
    console.log(`  - ${cat}: ${count} materials`)
  })
  
  // Insert materials using upsert
  let inserted = 0
  let updated = 0
  
  for (const mat of materials) {
    // Try to find existing material by name
    const { data: existing, error: findError } = await supabase
      .from('materials')
      .select('id')
      .eq('name', mat.name)
      .limit(1)
    
    if (findError) {
      console.error('Error finding material:', findError)
      continue
    }
    
    if (existing && existing.length > 0) {
      // Update existing
      const { error: updateError } = await supabase
        .from('materials')
        .update({
          category: mat.category,
          description: mat.description
        })
        .eq('id', existing[0].id)
      
      if (updateError) {
        console.error('Error updating material:', updateError)
      } else {
        updated++
      }
    } else {
      // Insert new
      const { error: insertError } = await supabase
        .from('materials')
        .insert(mat)
      
      if (insertError) {
        console.error('Error inserting material:', insertError)
      } else {
        inserted++
      }
    }
  }
  
  console.log(`✓ Materials: ${inserted} inserted, ${updated} updated`)
  return { inserted, updated }
}

async function updateServicePricingWithForeignKeys() {
  console.log('\\nSkipping service pricing foreign key updates (schema doesn\'t support technology_id/material_id columns)')
  console.log('✓ Service pricing records will use text-based process and material references')
}

async function main() {
  try {
    console.log('🚀 Starting catalog tables population...')
    console.log('Data source:', dataDir)
    
    await clearExistingCatalogData()
    await populateTechnologies()
    await populateMaterials()
    await updateServicePricingWithForeignKeys()
    
    console.log('\\n✅ Catalog tables population completed successfully!')
    
  } catch (error) {
    console.error('\\n❌ Population failed:', error.message)
    process.exit(1)
  }
}

// Run the population
main()