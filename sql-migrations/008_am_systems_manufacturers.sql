-- Migration: Create AM Systems Manufacturers table
-- File: 008_am_systems_manufacturers.sql
-- Schema: Company name, Segment, Process, Material format, Material type, Country

-- ============================================================================
-- AM SYSTEMS MANUFACTURERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS am_systems_manufacturers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    segment VARCHAR(100) NOT NULL, -- e.g., 'Industrial', 'Desktop', 'Professional', 'Production'
    process VARCHAR(100) NOT NULL, -- e.g., 'FDM', 'SLA', 'SLS', 'DMLS', 'EBM', 'PolyJet', 'MultiJet Fusion'
    material_format VARCHAR(100) NOT NULL, -- e.g., 'Filament', 'Resin', 'Powder', 'Pellets', 'Wire'
    material_type VARCHAR(100) NOT NULL, -- e.g., 'Thermoplastic', 'Thermoset', 'Metal', 'Ceramic', 'Composite'
    country VARCHAR(100) NOT NULL,
    
    -- Additional useful fields for completeness
    website VARCHAR(255),
    headquarters_city VARCHAR(100),
    founded_year INTEGER,
    employee_count_range VARCHAR(50), -- e.g., '1-10', '11-50', '51-200', '201-500', '500+'
    annual_revenue_range VARCHAR(50), -- e.g., '<$1M', '$1M-$10M', '$10M-$50M', '$50M+'
    primary_market VARCHAR(100), -- e.g., 'Aerospace', 'Automotive', 'Healthcare', 'Consumer', 'Industrial'
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_am_systems_manufacturers_country ON am_systems_manufacturers(country);
CREATE INDEX IF NOT EXISTS idx_am_systems_manufacturers_segment ON am_systems_manufacturers(segment);
CREATE INDEX IF NOT EXISTS idx_am_systems_manufacturers_process ON am_systems_manufacturers(process);
CREATE INDEX IF NOT EXISTS idx_am_systems_manufacturers_material_type ON am_systems_manufacturers(material_type);
CREATE INDEX IF NOT EXISTS idx_am_systems_manufacturers_company_name ON am_systems_manufacturers(company_name);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_am_systems_manufacturers_process_material ON am_systems_manufacturers(process, material_type);
CREATE INDEX IF NOT EXISTS idx_am_systems_manufacturers_country_segment ON am_systems_manufacturers(country, segment);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE am_systems_manufacturers ENABLE ROW LEVEL SECURITY;

-- Allow public read access (since this is market intelligence data)
CREATE POLICY "Enable read access for all users" ON am_systems_manufacturers 
FOR SELECT USING (true);

-- Allow authenticated users to insert/update (for admin functions)
CREATE POLICY "Enable write access for authenticated users" ON am_systems_manufacturers 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON am_systems_manufacturers 
FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================================================
-- UPDATE TRIGGER
-- ============================================================================

-- Add update timestamp trigger
CREATE TRIGGER update_am_systems_manufacturers_updated_at 
BEFORE UPDATE ON am_systems_manufacturers 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA FOR DEVELOPMENT
-- ============================================================================

INSERT INTO am_systems_manufacturers (
    company_name, 
    segment, 
    process, 
    material_format, 
    material_type, 
    country,
    website,
    headquarters_city,
    founded_year,
    employee_count_range,
    annual_revenue_range,
    primary_market
) VALUES 
-- Industrial Metal Systems
('EOS GmbH', 'Industrial', 'DMLS', 'Powder', 'Metal', 'Germany', 'https://eos.info', 'Krailling', 1989, '500+', '$50M+', 'Aerospace'),
('SLM Solutions', 'Industrial', 'SLM', 'Powder', 'Metal', 'Germany', 'https://slm-solutions.com', 'Lübeck', 2006, '201-500', '$50M+', 'Automotive'),
('Renishaw', 'Industrial', 'DMLS', 'Powder', 'Metal', 'United Kingdom', 'https://renishaw.com', 'Wotton-under-Edge', 1973, '500+', '$50M+', 'Healthcare'),
('3D Systems ProX', 'Industrial', 'DMLS', 'Powder', 'Metal', 'United States', 'https://3dsystems.com', 'Rock Hill', 1986, '500+', '$50M+', 'Aerospace'),

-- Industrial Polymer Systems
('Stratasys Fortus', 'Industrial', 'FDM', 'Filament', 'Thermoplastic', 'United States', 'https://stratasys.com', 'Eden Prairie', 1988, '500+', '$50M+', 'Automotive'),
('HP Multi Jet Fusion', 'Industrial', 'MJF', 'Powder', 'Thermoplastic', 'United States', 'https://hp.com', 'Palo Alto', 1939, '500+', '$50M+', 'Industrial'),
('Formlabs Form 3L', 'Professional', 'SLA', 'Resin', 'Thermoset', 'United States', 'https://formlabs.com', 'Somerville', 2011, '201-500', '$10M-$50M', 'Healthcare'),
('Carbon M2', 'Industrial', 'CLIP', 'Resin', 'Thermoset', 'United States', 'https://carbon3d.com', 'Redwood City', 2013, '201-500', '$50M+', 'Automotive'),

-- Professional/Desktop Systems  
('Ultimaker S5', 'Professional', 'FDM', 'Filament', 'Thermoplastic', 'Netherlands', 'https://ultimaker.com', 'Geldermalsen', 2011, '201-500', '$10M-$50M', 'Industrial'),
('Prusa i3 MK3S+', 'Desktop', 'FDM', 'Filament', 'Thermoplastic', 'Czech Republic', 'https://prusa3d.com', 'Prague', 2012, '51-200', '$10M-$50M', 'Consumer'),
('Bambu Lab X1 Carbon', 'Desktop', 'FDM', 'Filament', 'Thermoplastic', 'China', 'https://bambulab.com', 'Shenzhen', 2021, '201-500', '$50M+', 'Consumer'),
('Elegoo Mars 3', 'Desktop', 'SLA', 'Resin', 'Thermoset', 'China', 'https://elegoo.com', 'Shenzhen', 2015, '51-200', '$1M-$10M', 'Consumer'),

-- Ceramic Systems
('Lithoz CeraFab', 'Industrial', 'LCM', 'Resin', 'Ceramic', 'Austria', 'https://lithoz.com', 'Vienna', 2011, '51-200', '$10M-$50M', 'Healthcare'),
('3DCeram Ceramaker', 'Industrial', 'SLA', 'Resin', 'Ceramic', 'France', 'https://3dceram.com', 'Limoges', 2001, '51-200', '$1M-$10M', 'Industrial'),

-- Multi-Material Systems
('Stratasys J850', 'Industrial', 'PolyJet', 'Resin', 'Composite', 'United States', 'https://stratasys.com', 'Eden Prairie', 1988, '500+', '$50M+', 'Automotive'),
('Desktop Metal Studio System', 'Professional', 'FDM', 'Filament', 'Metal', 'United States', 'https://desktopmetal.com', 'Burlington', 2015, '201-500', '$10M-$50M', 'Industrial'),
('Markforged Mark Two', 'Professional', 'FDM', 'Filament', 'Composite', 'United States', 'https://markforged.com', 'Watertown', 2013, '201-500', '$50M+', 'Industrial'),

-- Large-Scale Systems
('BigRep ONE', 'Industrial', 'FDM', 'Pellets', 'Thermoplastic', 'Germany', 'https://bigrep.com', 'Berlin', 2014, '51-200', '$10M-$50M', 'Industrial'),
('Modix BIG-180X', 'Professional', 'FDM', 'Filament', 'Thermoplastic', 'Israel', 'https://modix3d.com', 'Tel Aviv', 2016, '11-50', '$1M-$10M', 'Industrial'),

-- Asian Manufacturers
('UnionTech RSPro', 'Industrial', 'SLA', 'Resin', 'Thermoset', 'China', 'https://uniontech3d.com', 'Shanghai', 2000, '201-500', '$10M-$50M', 'Industrial'),
('Raise3D Pro3', 'Professional', 'FDM', 'Filament', 'Thermoplastic', 'China', 'https://raise3d.com', 'Irvine', 2015, '201-500', '$10M-$50M', 'Industrial'),
('Peopoly Phenom', 'Desktop', 'MSLA', 'Resin', 'Thermoset', 'Hong Kong', 'https://peopoly.net', 'Hong Kong', 2016, '11-50', '$1M-$10M', 'Consumer'),
('FlashForge Creator Pro', 'Desktop', 'FDM', 'Filament', 'Thermoplastic', 'China', 'https://flashforge.com', 'Jinhua', 2011, '201-500', '$10M-$50M', 'Consumer'),

-- Emerging Technologies
('Voxeljet VX1000', 'Industrial', 'Binder Jetting', 'Powder', 'Composite', 'Germany', 'https://voxeljet.com', 'Friedberg', 1999, '201-500', '$10M-$50M', 'Automotive'),
('ExOne X1 25Pro', 'Industrial', 'Binder Jetting', 'Powder', 'Metal', 'United States', 'https://exone.com', 'North Huntingdon', 1995, '201-500', '$10M-$50M', 'Aerospace'),
('Nano Dimension DragonFly', 'Professional', 'Inkjet', 'Ink', 'Composite', 'Israel', 'https://nanodimension.com', 'Ness Ziona', 2012, '201-500', '$10M-$50M', 'Electronics')

ON CONFLICT DO NOTHING;

-- ============================================================================
-- VIEWS FOR REPORTING AND ANALYTICS  
-- ============================================================================

-- View 1: Systems Manufacturers by Country and Segment
CREATE OR REPLACE VIEW am_systems_by_country_segment AS
SELECT 
    country,
    segment,
    COUNT(*) as manufacturer_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage_of_total
FROM am_systems_manufacturers
GROUP BY country, segment
ORDER BY country, manufacturer_count DESC;

-- View 2: Process and Material Type Matrix
CREATE OR REPLACE VIEW am_process_material_matrix AS
SELECT 
    process,
    material_type,
    COUNT(*) as system_count,
    STRING_AGG(DISTINCT company_name, ', ') as manufacturers
FROM am_systems_manufacturers
GROUP BY process, material_type
ORDER BY process, material_type;

-- View 3: Market Segment Distribution
CREATE OR REPLACE VIEW am_segment_distribution AS
SELECT 
    segment,
    COUNT(*) as manufacturer_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage,
    STRING_AGG(DISTINCT primary_market, ', ') as target_markets
FROM am_systems_manufacturers
GROUP BY segment
ORDER BY manufacturer_count DESC;

-- View 4: Geographic Distribution Summary
CREATE OR REPLACE VIEW am_geographic_distribution AS
SELECT 
    country,
    COUNT(*) as manufacturer_count,
    COUNT(DISTINCT process) as unique_processes,
    COUNT(DISTINCT material_type) as material_types_offered,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as market_share_percentage
FROM am_systems_manufacturers
GROUP BY country
ORDER BY manufacturer_count DESC;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE am_systems_manufacturers IS 'AM Systems Manufacturers data for Wohlers Company Data section';
COMMENT ON COLUMN am_systems_manufacturers.segment IS 'Market segment: Industrial, Professional, Desktop, Production';
COMMENT ON COLUMN am_systems_manufacturers.process IS 'AM process technology: FDM, SLA, SLS, DMLS, EBM, etc.';
COMMENT ON COLUMN am_systems_manufacturers.material_format IS 'Physical form of material: Filament, Resin, Powder, Pellets, Wire';
COMMENT ON COLUMN am_systems_manufacturers.material_type IS 'Material category: Thermoplastic, Thermoset, Metal, Ceramic, Composite';
COMMENT ON COLUMN am_systems_manufacturers.country IS 'Country where company is headquartered';