-- Manual Migration: Vendor Data to Unified Companies Schema
-- 
-- Execute these statements one by one in the Supabase SQL Editor
-- This is a simplified version of the automated migration for manual execution.
--
-- PREREQUISITE: Run 020_unified_companies_schema.sql first

-- =============================================================================
-- STEP 1: Populate technologies_unified from vendor data
-- =============================================================================

-- First, let's see what we're working with
-- SELECT DISTINCT process FROM vendor_am_systems_manufacturers WHERE process IS NOT NULL;
-- SELECT DISTINCT process FROM vendor_print_services_global WHERE process IS NOT NULL;

-- Insert common AM technologies
INSERT INTO technologies_unified (name, category, description, process_type)
VALUES 
    ('DMLS', 'Metal Printing', 'Direct Metal Laser Sintering', 'DMLS'),
    ('SLM', 'Metal Printing', 'Selective Laser Melting', 'SLM'),
    ('EBM', 'Metal Printing', 'Electron Beam Melting', 'EBM'),
    ('FDM', 'Material Extrusion', 'Fused Deposition Modeling', 'FDM'),
    ('FFF', 'Material Extrusion', 'Fused Filament Fabrication', 'FFF'),
    ('SLA', 'Vat Photopolymerization', 'Stereolithography', 'SLA'),
    ('SLS', 'Powder Bed Fusion', 'Selective Laser Sintering', 'SLS'),
    ('MJF', 'Powder Bed Fusion', 'Multi Jet Fusion', 'MJF'),
    ('PolyJet', 'Material Jetting', 'PolyJet Technology', 'PolyJet'),
    ('Powder', 'Material Format', 'Powder Material Format', 'Powder'),
    ('Filament', 'Material Format', 'Filament Material Format', 'Filament'),
    ('Resin', 'Material Format', 'Resin Material Format', 'Resin'),
    ('Pellet', 'Material Format', 'Pellet Material Format', 'Pellet')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- STEP 2: Populate materials_unified from vendor data  
-- =============================================================================

-- Insert common AM materials
INSERT INTO materials_unified (name, material_type, material_format, description)
VALUES
    ('Titanium Ti6Al4V', 'Metal', 'Powder', 'Titanium alloy for aerospace applications'),
    ('Stainless Steel 316L', 'Metal', 'Powder', 'Stainless steel for industrial applications'),
    ('Aluminum AlSi10Mg', 'Metal', 'Powder', 'Aluminum alloy for lightweight components'),
    ('PLA', 'Thermoplastic', 'Filament', 'Polylactic acid thermoplastic'),
    ('ABS', 'Thermoplastic', 'Filament', 'Acrylonitrile butadiene styrene thermoplastic'),
    ('Nylon', 'Thermoplastic', 'Powder', 'Polyamide thermoplastic'),
    ('Standard Resin', 'Thermoset', 'Resin', 'Standard photopolymer resin'),
    ('Metal', 'Metal', 'Powder', 'Generic metal materials'),
    ('Thermoplastic', 'Thermoplastic', 'Filament', 'Generic thermoplastic materials'),
    ('Thermoset', 'Thermoset', 'Resin', 'Generic thermoset materials')
ON CONFLICT (name, material_type) DO NOTHING;

-- =============================================================================
-- STEP 3: Migrate AM Systems Manufacturers to companies_unified
-- =============================================================================

INSERT INTO companies_unified (
    name, 
    country, 
    company_type, 
    company_role, 
    segment,
    primary_market,
    is_active,
    data_source,
    created_at,
    updated_at
)
SELECT DISTINCT
    company_name as name,
    country,
    'equipment' as company_type,
    'manufacturer' as company_role,
    CASE 
        WHEN LOWER(segment) = 'industrial' THEN 'industrial'
        WHEN LOWER(segment) = 'professional' THEN 'professional'  
        WHEN LOWER(segment) = 'desktop' THEN 'desktop'
        WHEN LOWER(segment) = 'research' THEN 'research'
        ELSE 'industrial'
    END as segment,
    'manufacturing' as primary_market,
    true as is_active,
    'vendor_am_systems_manufacturers' as data_source,
    NOW() as created_at,
    NOW() as updated_at
FROM vendor_am_systems_manufacturers
WHERE company_name IS NOT NULL
ON CONFLICT (name, company_type, company_role) DO NOTHING;

-- =============================================================================
-- STEP 4: Migrate Print Services Global to companies_unified
-- =============================================================================

INSERT INTO companies_unified (
    name,
    country,
    company_type,
    company_role,
    segment,
    primary_market,
    is_active,
    data_source,
    created_at,
    updated_at
)
SELECT DISTINCT
    company_name as name,
    country,
    'service' as company_type,
    'provider' as company_role,
    CASE 
        WHEN LOWER(segment) = 'industrial' THEN 'industrial'
        WHEN LOWER(segment) = 'professional' THEN 'professional'
        WHEN LOWER(segment) = 'desktop' THEN 'desktop'  
        WHEN LOWER(segment) = 'research' THEN 'research'
        ELSE 'professional'
    END as segment,
    'services' as primary_market,
    true as is_active,
    'vendor_print_services_global' as data_source,
    NOW() as created_at,
    NOW() as updated_at
FROM vendor_print_services_global
WHERE company_name IS NOT NULL
ON CONFLICT (name, company_type, company_role) DO NOTHING;

-- =============================================================================
-- STEP 5: Add website information from vendor_company_information
-- =============================================================================

-- Update companies with website information
UPDATE companies_unified 
SET website = ci.website,
    updated_at = NOW()
FROM vendor_company_information ci
WHERE companies_unified.name = ci.company_name 
  AND ci.website IS NOT NULL
  AND companies_unified.website IS NULL;

-- =============================================================================  
-- STEP 6: Create company-technology relationships
-- =============================================================================

-- Link AM Systems Manufacturers to their technologies based on process
INSERT INTO company_technologies (company_id, technology_id, created_at)
SELECT DISTINCT
    c.id as company_id,
    t.id as technology_id,
    NOW() as created_at
FROM companies_unified c
JOIN vendor_am_systems_manufacturers v ON c.name = v.company_name AND c.company_type = 'equipment'
JOIN technologies_unified t ON t.name = v.process
WHERE v.process IS NOT NULL
ON CONFLICT (company_id, technology_id) DO NOTHING;

-- Link Print Services to their technologies based on process
INSERT INTO company_technologies (company_id, technology_id, created_at)
SELECT DISTINCT
    c.id as company_id,
    t.id as technology_id,
    NOW() as created_at
FROM companies_unified c
JOIN vendor_print_services_global v ON c.name = v.company_name AND c.company_type = 'service'  
JOIN technologies_unified t ON t.name = v.process
WHERE v.process IS NOT NULL
ON CONFLICT (company_id, technology_id) DO NOTHING;

-- =============================================================================
-- STEP 7: Create company-material relationships  
-- =============================================================================

-- Link AM Systems Manufacturers to their materials
INSERT INTO company_materials (company_id, material_id, created_at)
SELECT DISTINCT
    c.id as company_id,
    m.id as material_id,
    NOW() as created_at
FROM companies_unified c
JOIN vendor_am_systems_manufacturers v ON c.name = v.company_name AND c.company_type = 'equipment'
JOIN materials_unified m ON m.material_type = v.material_type 
WHERE v.material_type IS NOT NULL
ON CONFLICT (company_id, material_id) DO NOTHING;

-- Link Print Services to their materials
INSERT INTO company_materials (company_id, material_id, created_at)
SELECT DISTINCT
    c.id as company_id,
    m.id as material_id,
    NOW() as created_at
FROM companies_unified c
JOIN vendor_print_services_global v ON c.name = v.company_name AND c.company_type = 'service'
JOIN materials_unified m ON m.material_type = v.material_type
WHERE v.material_type IS NOT NULL
ON CONFLICT (company_id, material_id) DO NOTHING;

-- =============================================================================
-- STEP 8: Verify migration results
-- =============================================================================

-- Check company counts
SELECT 
    company_type,
    company_role, 
    COUNT(*) as company_count
FROM companies_unified 
GROUP BY company_type, company_role
ORDER BY company_type, company_role;

-- Check technology relationships
SELECT COUNT(*) as tech_relationships FROM company_technologies;

-- Check material relationships  
SELECT COUNT(*) as material_relationships FROM company_materials;

-- Check some sample data
SELECT 
    c.name,
    c.company_type,
    c.company_role,
    c.country,
    c.segment
FROM companies_unified c
LIMIT 10;

-- =============================================================================
-- STEP 9: Create summary view (if materialized view exists)
-- =============================================================================

-- Refresh the materialized view to include migrated data
-- REFRESH MATERIALIZED VIEW company_summaries_unified;

-- =============================================================================
-- VERIFICATION COMPLETE
-- =============================================================================

/* 
After running all statements above, verify:

1. Companies exist in companies_unified:
   SELECT COUNT(*) FROM companies_unified;

2. Technologies and materials were created:
   SELECT COUNT(*) FROM technologies_unified;
   SELECT COUNT(*) FROM materials_unified;

3. Relationships were established:
   SELECT COUNT(*) FROM company_technologies;
   SELECT COUNT(*) FROM company_materials;

4. Test the unified API:
   - Visit: /api/companies?companyType=equipment
   - Visit: /api/companies?companyType=service

5. Test the dashboard:
   - Visit: /dashboard?dataset=am-systems-manufacturers&view=table
   - Visit: /dashboard?dataset=print-services-global&view=table
*/