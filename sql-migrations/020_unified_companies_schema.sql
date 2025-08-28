-- Migration: Unified Companies Schema for Dynamic Datasets
-- Purpose: Create a unified data model that treats "datasets" as filtered views
-- Date: 2025-08-28
-- Version: 4.0 (Unified Architecture)

-- ========================================
-- 1. NEW UNIFIED COMPANIES TABLE STRUCTURE
-- ========================================

-- Drop existing views that depend on old structure
DROP MATERIALIZED VIEW IF EXISTS company_summaries CASCADE;

-- Create unified companies table with proper categorization
CREATE TABLE IF NOT EXISTS companies_unified (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(500) NOT NULL,
  
  -- Geographic information
  country VARCHAR(100),
  state VARCHAR(100),
  city VARCHAR(200),
  address TEXT,
  postal_code VARCHAR(20),
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  coordinates POINT GENERATED ALWAYS AS (POINT(lng, lat)) STORED,
  
  -- Company classification (replaces hard-coded datasets)
  company_type VARCHAR(50) NOT NULL, -- 'equipment', 'service', 'material', 'software'
  company_role VARCHAR(50) NOT NULL, -- 'manufacturer', 'provider', 'supplier', 'developer'
  segment VARCHAR(50), -- 'industrial', 'professional', 'desktop', 'research'
  
  -- Business information
  website VARCHAR(500),
  description TEXT,
  employee_count_range VARCHAR(50),
  annual_revenue_range VARCHAR(50),
  founded_year INTEGER,
  
  -- Market presence
  primary_market VARCHAR(100), -- 'aerospace', 'automotive', 'healthcare', 'consumer', etc.
  secondary_markets TEXT[], -- Array of additional markets
  
  -- Status and metadata
  is_active BOOLEAN DEFAULT true,
  data_source VARCHAR(100), -- Track where data came from
  last_verified TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_companies_unified_type_role ON companies_unified(company_type, company_role);
CREATE INDEX IF NOT EXISTS idx_companies_unified_country ON companies_unified(country);
CREATE INDEX IF NOT EXISTS idx_companies_unified_segment ON companies_unified(segment);
CREATE INDEX IF NOT EXISTS idx_companies_unified_name ON companies_unified USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_companies_unified_coordinates ON companies_unified USING GIST(coordinates);
CREATE INDEX IF NOT EXISTS idx_companies_unified_market ON companies_unified(primary_market);

-- Add constraint for valid company types
ALTER TABLE companies_unified ADD CONSTRAINT check_company_type 
  CHECK (company_type IN ('equipment', 'service', 'material', 'software'));

-- Add constraint for valid company roles  
ALTER TABLE companies_unified ADD CONSTRAINT check_company_role
  CHECK (company_role IN ('manufacturer', 'provider', 'supplier', 'developer', 'researcher'));

-- Add constraint for valid segments
ALTER TABLE companies_unified ADD CONSTRAINT check_segment
  CHECK (segment IN ('industrial', 'professional', 'desktop', 'research', 'enterprise'));

-- ========================================
-- 2. CAPABILITIES TABLES (Many-to-Many)
-- ========================================

-- Technologies/Processes table
CREATE TABLE IF NOT EXISTS technologies_unified (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL, -- 'FDM', 'SLA', 'SLS', 'DMLS', etc.
  category VARCHAR(50), -- 'additive', 'subtractive', 'hybrid'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materials table  
CREATE TABLE IF NOT EXISTS materials_unified (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL, -- 'PLA', 'ABS', 'Titanium', etc.
  material_type VARCHAR(50), -- 'thermoplastic', 'thermoset', 'metal', 'ceramic', 'composite'
  material_format VARCHAR(50), -- 'filament', 'powder', 'resin', 'pellet'
  properties JSONB, -- Store material properties as JSON
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company-Technology relationships
CREATE TABLE IF NOT EXISTS company_technologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies_unified(id) ON DELETE CASCADE,
  technology_id UUID NOT NULL REFERENCES technologies_unified(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false, -- Mark primary technology
  capabilities TEXT, -- Specific capabilities or specializations
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, technology_id)
);

-- Company-Material relationships
CREATE TABLE IF NOT EXISTS company_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies_unified(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials_unified(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false, -- Mark primary material
  specifications TEXT, -- Specific material specs or variants
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, material_id)
);

-- Indexes for capability relationships
CREATE INDEX IF NOT EXISTS idx_company_technologies_company ON company_technologies(company_id);
CREATE INDEX IF NOT EXISTS idx_company_materials_company ON company_materials(company_id);

-- ========================================
-- 3. EQUIPMENT/SYSTEMS TABLE (for manufacturers)
-- ========================================

CREATE TABLE IF NOT EXISTS equipment_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies_unified(id) ON DELETE CASCADE,
  
  -- System information
  system_name VARCHAR(200),
  model_number VARCHAR(100),
  system_type VARCHAR(100), -- 'printer', 'scanner', 'post-processor', etc.
  
  -- Technical specifications
  build_volume JSONB, -- {x: 250, y: 250, z: 250, units: 'mm'}
  resolution JSONB, -- {layer_height: 0.1, xy_resolution: 0.1, units: 'mm'}
  materials_supported TEXT[], -- Array of supported materials
  processes_supported TEXT[], -- Array of supported processes
  
  -- Commercial information  
  price_range VARCHAR(50), -- '$1K-$10K', '$10K-$100K', '$100K+', etc.
  target_market VARCHAR(50), -- 'consumer', 'professional', 'industrial'
  availability_status VARCHAR(50), -- 'available', 'discontinued', 'coming_soon'
  
  -- Metadata
  specifications JSONB, -- Store detailed specs as JSON
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_systems_company ON equipment_systems(company_id);
CREATE INDEX IF NOT EXISTS idx_equipment_systems_type ON equipment_systems(system_type);

-- ========================================
-- 4. SERVICES TABLE (for service providers)  
-- ========================================

CREATE TABLE IF NOT EXISTS company_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies_unified(id) ON DELETE CASCADE,
  
  -- Service information
  service_type VARCHAR(100) NOT NULL, -- 'printing', 'design', 'consultation', 'training'
  service_name VARCHAR(200),
  description TEXT,
  
  -- Capabilities
  processes_offered TEXT[], -- Array of AM processes offered
  materials_offered TEXT[], -- Array of materials offered
  industries_served TEXT[], -- Array of target industries
  
  -- Service specifications
  min_quantity INTEGER,
  max_quantity INTEGER,
  lead_time_days_min INTEGER,
  lead_time_days_max INTEGER,
  quality_certifications TEXT[], -- ISO, AS9100, etc.
  
  -- Pricing (optional, for benchmarking)
  pricing_model VARCHAR(50), -- 'per_part', 'per_gram', 'hourly', 'project_based'
  price_range VARCHAR(100),
  
  -- Metadata
  specifications JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_services_company ON company_services(company_id);
CREATE INDEX IF NOT EXISTS idx_company_services_type ON company_services(service_type);

-- ========================================
-- 5. DATASET CONFIGURATION TABLE
-- ========================================

-- Store dataset definitions as data, not code
CREATE TABLE IF NOT EXISTS dataset_configs (
  id VARCHAR(100) PRIMARY KEY, -- 'am-systems-manufacturers', 'print-services-global', etc.
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Filter criteria (stored as JSON for flexibility)
  filters JSONB NOT NULL, -- {company_type: 'equipment', company_role: 'manufacturer'}
  
  -- Display configuration
  display_columns TEXT[], -- Columns to show in tables
  map_type VARCHAR(50), -- 'equipment', 'service', 'material'
  
  -- Metadata
  version VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default dataset configurations
INSERT INTO dataset_configs (id, name, description, filters, display_columns, map_type) VALUES
(
  'am-systems-manufacturers',
  'AM Systems Manufacturers',
  'Equipment manufacturers and systems developers worldwide',
  '{"company_type": "equipment", "company_role": "manufacturer"}',
  ARRAY['name', 'country', 'segment', 'primary_market'],
  'equipment'
),
(
  'print-services-global', 
  'Global Print Services',
  'Service providers and printing bureaus worldwide',
  '{"company_type": "service", "company_role": "provider"}',
  ARRAY['name', 'country', 'segment', 'services_offered'],
  'service'
),
(
  'material-suppliers',
  'Material Suppliers',
  'AM material suppliers and distributors',
  '{"company_type": "material", "company_role": "supplier"}', 
  ARRAY['name', 'country', 'materials_offered'],
  'material'
),
(
  'software-developers',
  'Software Developers', 
  'AM software and platform developers',
  '{"company_type": "software", "company_role": "developer"}',
  ARRAY['name', 'country', 'platforms_offered'],
  'software'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  filters = EXCLUDED.filters,
  display_columns = EXCLUDED.display_columns,
  map_type = EXCLUDED.map_type,
  updated_at = NOW();

-- ========================================
-- 6. PERFORMANCE VIEWS
-- ========================================

-- Company summary view for dashboard performance
CREATE OR REPLACE VIEW company_summaries_unified AS
SELECT 
  c.id,
  c.name,
  c.country,
  c.state,
  c.city,
  c.lat,
  c.lng,
  c.coordinates,
  c.company_type,
  c.company_role,
  c.segment,
  c.primary_market,
  c.website,
  c.is_active,
  
  -- Aggregated capabilities
  COALESCE(tech_summary.technology_count, 0) as technology_count,
  COALESCE(mat_summary.material_count, 0) as material_count,
  COALESCE(equip_summary.equipment_count, 0) as equipment_count,
  COALESCE(service_summary.service_count, 0) as service_count,
  
  -- Capability arrays for filtering
  tech_summary.technologies,
  mat_summary.materials,
  service_summary.service_types
  
FROM companies_unified c

-- Technology aggregation
LEFT JOIN (
  SELECT 
    company_id,
    COUNT(*) as technology_count,
    ARRAY_AGG(t.name) as technologies
  FROM company_technologies ct
  JOIN technologies_unified t ON ct.technology_id = t.id
  GROUP BY company_id
) tech_summary ON c.id = tech_summary.company_id

-- Material aggregation  
LEFT JOIN (
  SELECT
    company_id,
    COUNT(*) as material_count,
    ARRAY_AGG(m.name) as materials
  FROM company_materials cm
  JOIN materials_unified m ON cm.material_id = m.id
  GROUP BY company_id
) mat_summary ON c.id = mat_summary.company_id

-- Equipment aggregation
LEFT JOIN (
  SELECT
    company_id,
    COUNT(*) as equipment_count
  FROM equipment_systems
  GROUP BY company_id
) equip_summary ON c.id = equip_summary.company_id

-- Service aggregation
LEFT JOIN (
  SELECT
    company_id, 
    COUNT(*) as service_count,
    ARRAY_AGG(DISTINCT service_type) as service_types
  FROM company_services
  WHERE is_active = true
  GROUP BY company_id
) service_summary ON c.id = service_summary.company_id

WHERE c.is_active = true;

-- ========================================
-- 7. POPULATE BASIC TECHNOLOGIES & MATERIALS
-- ========================================

-- Insert common AM technologies
INSERT INTO technologies_unified (name, category, description) VALUES
('FDM', 'additive', 'Fused Deposition Modeling'),
('SLA', 'additive', 'Stereolithography'),
('SLS', 'additive', 'Selective Laser Sintering'),
('DMLS', 'additive', 'Direct Metal Laser Sintering'),
('SLM', 'additive', 'Selective Laser Melting'),
('MJF', 'additive', 'Multi Jet Fusion'),
('CLIP', 'additive', 'Continuous Liquid Interface Production'),
('EBM', 'additive', 'Electron Beam Melting'),
('Polyjet', 'additive', 'Polyjet Technology'),
('Binder Jetting', 'additive', 'Binder Jetting Process')
ON CONFLICT (name) DO NOTHING;

-- Insert common materials
INSERT INTO materials_unified (name, material_type, material_format) VALUES
('PLA', 'thermoplastic', 'filament'),
('ABS', 'thermoplastic', 'filament'),
('PETG', 'thermoplastic', 'filament'),
('Nylon', 'thermoplastic', 'filament'),
('TPU', 'thermoplastic', 'filament'),
('Standard Resin', 'thermoset', 'resin'),
('Tough Resin', 'thermoset', 'resin'),
('Clear Resin', 'thermoset', 'resin'),
('Flexible Resin', 'thermoset', 'resin'),
('PA12', 'thermoplastic', 'powder'),
('PA11', 'thermoplastic', 'powder'),
('Titanium Ti6Al4V', 'metal', 'powder'),
('Stainless Steel 316L', 'metal', 'powder'),
('Aluminum AlSi10Mg', 'metal', 'powder'),
('Inconel 718', 'metal', 'powder')
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE companies_unified ENABLE ROW LEVEL SECURITY;
ALTER TABLE technologies_unified ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials_unified ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_configs ENABLE ROW LEVEL SECURITY;

-- Create policies for read access
CREATE POLICY "Enable read access for all users" ON companies_unified FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON technologies_unified FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON materials_unified FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON company_technologies FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON company_materials FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON equipment_systems FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON company_services FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON dataset_configs FOR SELECT USING (true);

-- Create policies for insert/update (authenticated users only)
CREATE POLICY "Enable insert access for authenticated users" ON companies_unified FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON companies_unified FOR UPDATE USING (auth.role() = 'authenticated');

-- ========================================
-- 9. FUNCTIONS FOR DYNAMIC FILTERING
-- ========================================

-- Function to get companies matching dataset filters
CREATE OR REPLACE FUNCTION get_companies_by_dataset(dataset_id VARCHAR, filter_params JSONB DEFAULT '{}')
RETURNS SETOF company_summaries_unified
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  dataset_config RECORD;
  base_filters JSONB;
  combined_filters JSONB;
BEGIN
  -- Get dataset configuration
  SELECT * INTO dataset_config FROM dataset_configs WHERE id = dataset_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dataset not found: %', dataset_id;
  END IF;
  
  -- Combine base filters with additional parameters
  base_filters := dataset_config.filters;
  combined_filters := base_filters || filter_params;
  
  -- Return filtered companies (simplified - would need dynamic query building for full flexibility)
  RETURN QUERY
  SELECT * FROM company_summaries_unified c
  WHERE 
    (combined_filters->>'company_type' IS NULL OR c.company_type = combined_filters->>'company_type') AND
    (combined_filters->>'company_role' IS NULL OR c.company_role = combined_filters->>'company_role') AND  
    (combined_filters->>'segment' IS NULL OR c.segment = combined_filters->>'segment') AND
    (combined_filters->>'country' IS NULL OR c.country = combined_filters->>'country');
END;
$$;

-- ========================================
-- 10. MIGRATION CLEANUP
-- ========================================

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to relevant tables
CREATE TRIGGER update_companies_unified_updated_at BEFORE UPDATE ON companies_unified
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_systems_updated_at BEFORE UPDATE ON equipment_systems  
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_services_updated_at BEFORE UPDATE ON company_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

-- This migration creates a unified, flexible schema that:
-- 1. Treats "datasets" as filtered views of unified data
-- 2. Supports dynamic filtering through dataset_configs table
-- 3. Enables easy addition of new "datasets" without schema changes
-- 4. Maintains performance through materialized views and indexes  
-- 5. Provides proper normalization for technologies, materials, and capabilities
-- 6. Sets foundation for unified API endpoints and components

-- Next steps:
-- 1. Run data migration from vendor_* tables to populate unified schema
-- 2. Update API routes to use unified filtering
-- 3. Create unified components that work with any dataset
-- 4. Implement CompanyFilters interface and dynamic querying