-- Migration: 021 - Migrate Vendor Data to Unified Companies Schema
-- 
-- This migration transforms data from the legacy vendor_* tables into the new
-- unified companies schema created by migration 020.
--
-- Key Transformations:
-- 1. vendor_am_systems_manufacturers → companies_unified (companyType: 'equipment')
-- 2. vendor_print_services_global → companies_unified (companyType: 'service')  
-- 3. vendor_company_information → companies_unified (base company info)
-- 4. Process/technology mapping to technologies_unified
-- 5. Material mapping to materials_unified
--
-- Run this migration after:
-- - 020_unified_companies_schema.sql (creates the new schema)
-- - Ensuring vendor data has been imported via import-vendor-csv-data.js

BEGIN;

-- =============================================================================
-- STEP 1: Populate technologies_unified from vendor data
-- =============================================================================

INSERT INTO technologies_unified (name, category, description, process_type)
SELECT DISTINCT 
    COALESCE(process, material_format) as name,
    CASE 
        WHEN process IN ('DMLS', 'SLM', 'EBM', 'DED') THEN 'Metal Printing'
        WHEN process IN ('FDM', 'FFF', 'FGF') THEN 'Material Extrusion'  
        WHEN process IN ('SLA', 'DLP', 'LCD', 'MSLA') THEN 'Vat Photopolymerization'
        WHEN process IN ('SLS', 'MJF', 'HSS') THEN 'Powder Bed Fusion'
        WHEN process IN ('PolyJet', 'MJ', 'DOD') THEN 'Material Jetting'
        WHEN process IN ('BJ', 'BJP') THEN 'Binder Jetting'
        WHEN process IN ('LOM', 'UAM', 'SDL') THEN 'Sheet Lamination'
        WHEN material_format IN ('Powder', 'Filament', 'Resin', 'Pellet', 'Wire', 'Sheet') THEN 'Material Format'
        ELSE 'Other'
    END as category,
    CASE 
        WHEN process = 'DMLS' THEN 'Direct Metal Laser Sintering'
        WHEN process = 'SLM' THEN 'Selective Laser Melting'
        WHEN process = 'EBM' THEN 'Electron Beam Melting'
        WHEN process = 'FDM' THEN 'Fused Deposition Modeling'
        WHEN process = 'SLA' THEN 'Stereolithography'
        WHEN process = 'SLS' THEN 'Selective Laser Sintering'
        WHEN process = 'MJF' THEN 'Multi Jet Fusion'
        WHEN process = 'PolyJet' THEN 'PolyJet Technology'
        ELSE COALESCE(process, material_format)
    END as description,
    COALESCE(process, material_format) as process_type
FROM (
    SELECT DISTINCT process FROM vendor_am_systems_manufacturers WHERE process IS NOT NULL
    UNION 
    SELECT DISTINCT process FROM vendor_print_services_global WHERE process IS NOT NULL
    UNION
    SELECT DISTINCT material_format FROM vendor_am_systems_manufacturers WHERE material_format IS NOT NULL
    UNION
    SELECT DISTINCT material_format FROM vendor_print_services_global WHERE material_format IS NOT NULL
) tech_data
WHERE COALESCE(process, material_format) IS NOT NULL
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- STEP 2: Populate materials_unified from vendor data
-- =============================================================================

INSERT INTO materials_unified (name, material_type, material_format, description, properties)
SELECT DISTINCT
    material_type as name,
    material_type,
    material_format,
    CASE 
        WHEN material_type = 'Metal' THEN 'Metallic materials for industrial applications'
        WHEN material_type = 'Thermoplastic' THEN 'Thermoplastic polymers for FDM/FFF printing'  
        WHEN material_type = 'Thermoset' THEN 'Thermoset polymers for resin-based printing'
        WHEN material_type = 'Ceramic' THEN 'Ceramic materials for high-temperature applications'
        WHEN material_type = 'Composite' THEN 'Composite materials with reinforced properties'
        ELSE material_type
    END as description,
    json_build_object(
        'material_type', material_type,
        'material_format', material_format,
        'source', 'vendor_data_migration'
    ) as properties
FROM (
    SELECT DISTINCT material_type, material_format 
    FROM vendor_am_systems_manufacturers 
    WHERE material_type IS NOT NULL
    UNION 
    SELECT DISTINCT material_type, material_format 
    FROM vendor_print_services_global 
    WHERE material_type IS NOT NULL
    UNION
    -- Add common AM materials
    SELECT 'Titanium Ti6Al4V' as material_type, 'Powder' as material_format
    UNION SELECT 'Stainless Steel 316L', 'Powder'
    UNION SELECT 'Aluminum AlSi10Mg', 'Powder'
    UNION SELECT 'PLA', 'Filament'
    UNION SELECT 'ABS', 'Filament'  
    UNION SELECT 'Nylon', 'Powder'
    UNION SELECT 'Standard Resin', 'Resin'
) material_data
WHERE material_type IS NOT NULL
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
-- STEP 5: Enhance companies with vendor_company_information data
-- =============================================================================

-- Update companies with website information from vendor_company_information
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

-- Link AM Systems Manufacturers to their technologies
INSERT INTO company_technologies (company_id, technology_id, created_at)
SELECT DISTINCT
    c.id as company_id,
    t.id as technology_id,
    NOW() as created_at
FROM companies_unified c
JOIN vendor_am_systems_manufacturers v ON c.name = v.company_name AND c.company_type = 'equipment'
JOIN technologies_unified t ON (t.name = v.process OR t.name = v.material_format)
WHERE v.process IS NOT NULL OR v.material_format IS NOT NULL
ON CONFLICT (company_id, technology_id) DO NOTHING;

-- Link Print Services to their technologies  
INSERT INTO company_technologies (company_id, technology_id, created_at)
SELECT DISTINCT
    c.id as company_id,
    t.id as technology_id,
    NOW() as created_at
FROM companies_unified c
JOIN vendor_print_services_global v ON c.name = v.company_name AND c.company_type = 'service'
JOIN technologies_unified t ON (t.name = v.process OR t.name = v.material_format)
WHERE v.process IS NOT NULL OR v.material_format IS NOT NULL
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
-- STEP 8: Create summary view data for performance
-- =============================================================================

-- Refresh the materialized view to include migrated data
REFRESH MATERIALIZED VIEW IF EXISTS company_summaries_unified;

-- =============================================================================
-- STEP 9: Create dataset configurations in database
-- =============================================================================

-- Insert dataset configurations that match the TypeScript configs
INSERT INTO dataset_configs (
    id, 
    name, 
    description, 
    config_json,
    is_active,
    version,
    created_at,
    updated_at
) VALUES 
(
    'am-systems-manufacturers',
    'AM Systems Manufacturers', 
    'Comprehensive directory of additive manufacturing systems and equipment manufacturers worldwide. This dataset includes detailed information about production systems, technology capabilities, and manufacturing specifications.',
    jsonb_build_object(
        'id', 'am-systems-manufacturers',
        'filters', jsonb_build_object(
            'companyType', array['equipment'],
            'companyRole', array['manufacturer'],
            'isActive', true
        ),
        'displayColumns', array['name', 'country', 'segment', 'technologies', 'materials', 'website'],
        'mapType', 'equipment',
        'icon', 'Building2',
        'color', '#3B82F6',
        'enableMap', true,
        'enableAnalytics', true,
        'enableExport', true
    ),
    true,
    'v1.5.0',
    NOW(),
    NOW()
),
(
    'print-services-global',
    'Global Printing Services',
    'Global directory of additive manufacturing print service providers and bureaus. This comprehensive database covers service capabilities, materials offered, geographic reach, and pricing models across the worldwide AM services market.',
    jsonb_build_object(
        'id', 'print-services-global',
        'filters', jsonb_build_object(
            'companyType', array['service'],
            'companyRole', array['provider'],
            'isActive', true
        ),
        'displayColumns', array['name', 'country', 'segment', 'serviceTypes', 'materials', 'website'],
        'mapType', 'service',
        'icon', 'Globe',
        'color', '#10B981',
        'enableMap', true,
        'enableAnalytics', true,
        'enableExport', true
    ),
    true,
    'v1.3.0',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    config_json = EXCLUDED.config_json,
    updated_at = NOW();

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify migration results
DO $$ 
DECLARE
    company_count INTEGER;
    tech_count INTEGER;
    material_count INTEGER;
    company_tech_count INTEGER;
    company_material_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO company_count FROM companies_unified;
    SELECT COUNT(*) INTO tech_count FROM technologies_unified;  
    SELECT COUNT(*) INTO material_count FROM materials_unified;
    SELECT COUNT(*) INTO company_tech_count FROM company_technologies;
    SELECT COUNT(*) INTO company_material_count FROM company_materials;
    
    RAISE NOTICE 'MIGRATION SUMMARY:';
    RAISE NOTICE '- Companies migrated: %', company_count;
    RAISE NOTICE '- Technologies created: %', tech_count;
    RAISE NOTICE '- Materials created: %', material_count;
    RAISE NOTICE '- Company-Technology links: %', company_tech_count;
    RAISE NOTICE '- Company-Material links: %', company_material_count;
    
    -- Verify data distribution
    RAISE NOTICE 'COMPANY BREAKDOWN:';
    FOR rec IN 
        SELECT company_type, company_role, COUNT(*) as count 
        FROM companies_unified 
        GROUP BY company_type, company_role 
        ORDER BY company_type, company_role
    LOOP
        RAISE NOTICE '- % %: %', rec.company_type, rec.company_role, rec.count;
    END LOOP;
END $$;

COMMIT;

-- =============================================================================
-- POST-MIGRATION NOTES
-- =============================================================================

/*
After running this migration:

1. Test the unified API endpoint:
   GET /api/companies?companyType=equipment
   GET /api/companies?companyType=service

2. Verify dataset configurations:
   - Check that dataset filters work correctly
   - Confirm display columns show appropriate data
   - Test filtering by technologies and materials

3. Update any application code that references vendor_* tables directly
   
4. Consider creating additional datasets for:
   - Material suppliers (companyType: 'material')
   - Software developers (companyType: 'software')

5. The legacy vendor_* tables are preserved for backup purposes
   but the application should now use the unified schema exclusively.

6. If coordinate data is available, consider running geocoding
   to populate lat/lng fields for map visualization.
*/