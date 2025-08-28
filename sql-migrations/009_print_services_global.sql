-- Migration: Create Print Services Global table
-- File: 009_print_services_global.sql
-- Schema: Company name, Segment, Printer manufacturer, Printer model, Number of printers, Count type, Process, Material type, Material format, Country, Update year

-- ============================================================================
-- PRINT SERVICES GLOBAL TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS print_services_global (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    segment VARCHAR(100) NOT NULL, -- e.g., 'Service Bureau', 'Manufacturing', 'Prototyping', 'Production', 'Medical'
    printer_manufacturer VARCHAR(255) NOT NULL, -- e.g., 'Stratasys', 'EOS', 'HP', 'Formlabs', '3D Systems'
    printer_model VARCHAR(255) NOT NULL, -- e.g., 'Fortus 450mc', 'M400', 'Multi Jet Fusion 5200', 'Form 3L'
    number_of_printers INTEGER NOT NULL CHECK (number_of_printers > 0),
    count_type VARCHAR(50) NOT NULL CHECK (count_type IN ('Exact', 'Estimated', 'Range', 'Minimum')), -- How the count was determined
    process VARCHAR(100) NOT NULL, -- e.g., 'FDM', 'SLA', 'SLS', 'DMLS', 'EBM', 'PolyJet', 'MultiJet Fusion', 'Binder Jetting'
    material_type VARCHAR(100) NOT NULL, -- e.g., 'Thermoplastic', 'Thermoset', 'Metal', 'Ceramic', 'Composite', 'Sand'
    material_format VARCHAR(100) NOT NULL, -- e.g., 'Filament', 'Resin', 'Powder', 'Pellets', 'Wire', 'Sheet'
    country VARCHAR(100) NOT NULL,
    update_year INTEGER NOT NULL CHECK (update_year >= 2020 AND update_year <= EXTRACT(YEAR FROM NOW()) + 1),
    
    -- Additional useful fields for completeness
    website VARCHAR(255),
    headquarters_city VARCHAR(100),
    founded_year INTEGER,
    employee_count_range VARCHAR(50), -- e.g., '1-10', '11-50', '51-200', '201-500', '500+'
    services_offered TEXT[], -- e.g., ['Prototyping', 'Small batch production', 'Finishing services', 'Design consultation']
    industries_served TEXT[], -- e.g., ['Aerospace', 'Automotive', 'Healthcare', 'Consumer goods', 'Industrial']
    certifications TEXT[], -- e.g., ['ISO 9001', 'AS9100', 'ISO 13485', 'FDA registered']
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_print_services_global_country ON print_services_global(country);
CREATE INDEX IF NOT EXISTS idx_print_services_global_segment ON print_services_global(segment);
CREATE INDEX IF NOT EXISTS idx_print_services_global_manufacturer ON print_services_global(printer_manufacturer);
CREATE INDEX IF NOT EXISTS idx_print_services_global_process ON print_services_global(process);
CREATE INDEX IF NOT EXISTS idx_print_services_global_material_type ON print_services_global(material_type);
CREATE INDEX IF NOT EXISTS idx_print_services_global_update_year ON print_services_global(update_year);
CREATE INDEX IF NOT EXISTS idx_print_services_global_company_name ON print_services_global(company_name);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_print_services_global_country_segment ON print_services_global(country, segment);
CREATE INDEX IF NOT EXISTS idx_print_services_global_process_material ON print_services_global(process, material_type);
CREATE INDEX IF NOT EXISTS idx_print_services_global_manufacturer_model ON print_services_global(printer_manufacturer, printer_model);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE print_services_global ENABLE ROW LEVEL SECURITY;

-- Allow public read access (since this is market intelligence data)
CREATE POLICY "Enable read access for all users" ON print_services_global 
FOR SELECT USING (true);

-- Allow authenticated users to insert/update (for admin functions)
CREATE POLICY "Enable write access for authenticated users" ON print_services_global 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON print_services_global 
FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================================================
-- UPDATE TRIGGER
-- ============================================================================

-- Add update timestamp trigger
CREATE TRIGGER update_print_services_global_updated_at 
BEFORE UPDATE ON print_services_global 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA FOR DEVELOPMENT
-- ============================================================================

INSERT INTO print_services_global (
    company_name, 
    segment, 
    printer_manufacturer, 
    printer_model,
    number_of_printers,
    count_type,
    process, 
    material_type, 
    material_format, 
    country,
    update_year,
    website,
    headquarters_city,
    founded_year,
    employee_count_range,
    services_offered,
    industries_served,
    certifications
) VALUES 

-- Large Service Bureaus - United States
('Protolabs', 'Manufacturing', 'Stratasys', 'Fortus 450mc', 25, 'Exact', 'FDM', 'Thermoplastic', 'Filament', 'United States', 2024, 'https://protolabs.com', 'Maple Plain', 1999, '500+', 
 ARRAY['Rapid prototyping', 'Low-volume production', 'CNC machining', 'Injection molding'], 
 ARRAY['Automotive', 'Aerospace', 'Medical', 'Consumer goods'], 
 ARRAY['ISO 9001', 'AS9100', 'ISO 13485']),

('3D Hubs (now Protolabs Network)', 'Service Bureau', 'HP', 'Multi Jet Fusion 5200', 15, 'Estimated', 'MJF', 'Thermoplastic', 'Powder', 'United States', 2024, 'https://3dhubs.com', 'New York', 2013, '201-500',
 ARRAY['On-demand manufacturing', 'Prototyping', 'End-use parts', 'Finishing services'],
 ARRAY['Industrial', 'Automotive', 'Consumer electronics', 'Healthcare'],
 ARRAY['ISO 9001']),

('Shapeways', 'Service Bureau', 'EOS', 'P770', 12, 'Exact', 'SLS', 'Thermoplastic', 'Powder', 'United States', 2023, 'https://shapeways.com', 'New York', 2007, '201-500',
 ARRAY['Custom manufacturing', 'Design services', 'Materials consulting', 'Volume production'],
 ARRAY['Fashion', 'Jewelry', 'Industrial', 'Art and design'],
 ARRAY['ISO 9001']),

-- Metal Service Providers
('GE Additive Services', 'Manufacturing', 'EOS', 'M400-4', 8, 'Exact', 'DMLS', 'Metal', 'Powder', 'United States', 2024, 'https://ge.com/additive', 'Cincinnati', 2016, '500+',
 ARRAY['Metal 3D printing', 'Post-processing', 'Design optimization', 'Certification support'],
 ARRAY['Aerospace', 'Power generation', 'Oil and gas', 'Healthcare'],
 ARRAY['AS9100', 'ISO 9001', 'Nadcap']),

('Morris Technologies (3D Systems)', 'Manufacturing', '3D Systems', 'ProX DMP 320', 18, 'Exact', 'DMLS', 'Metal', 'Powder', 'United States', 2024, 'https://3dsystems.com', 'Cincinnati', 1995, '201-500',
 ARRAY['Direct metal printing', 'Investment casting patterns', 'Tooling', 'End-use parts'],
 ARRAY['Aerospace', 'Automotive', 'Medical', 'Industrial'],
 ARRAY['AS9100', 'ISO 13485', 'ISO 9001']),

-- European Service Providers
('Materialise Manufacturing', 'Manufacturing', 'EOS', 'P396', 22, 'Exact', 'SLS', 'Thermoplastic', 'Powder', 'Belgium', 2024, 'https://materialise.com', 'Leuven', 1990, '500+',
 ARRAY['Medical devices', 'Automotive parts', 'Aerospace components', 'Software services'],
 ARRAY['Medical', 'Automotive', 'Aerospace', 'Consumer goods'],
 ARRAY['ISO 13485', 'ISO 9001', 'AS9100', 'FDA registered']),

('Sculpteo', 'Service Bureau', 'HP', 'Multi Jet Fusion 4200', 10, 'Estimated', 'MJF', 'Thermoplastic', 'Powder', 'France', 2024, 'https://sculpteo.com', 'Paris', 2009, '51-200',
 ARRAY['Online 3D printing', 'Batch production', 'Prototyping', 'Custom manufacturing'],
 ARRAY['Automotive', 'Aerospace', 'Healthcare', 'Education'],
 ARRAY['ISO 9001']),

('3T Additive Manufacturing (now Oerlikon AM)', 'Manufacturing', 'SLM Solutions', 'SLM 500 HL', 6, 'Exact', 'SLM', 'Metal', 'Powder', 'United Kingdom', 2023, 'https://3t-am.com', 'Alfreton', 2012, '51-200',
 ARRAY['Metal additive manufacturing', 'Post-processing', 'Heat treatment', 'Quality inspection'],
 ARRAY['Aerospace', 'Automotive', 'Medical', 'Energy'],
 ARRAY['AS9100', 'ISO 9001', 'Nadcap']),

-- Asian Service Providers
('UnionTech', 'Manufacturing', 'UnionTech', 'RSPro 600', 35, 'Exact', 'SLA', 'Thermoset', 'Resin', 'China', 2024, 'https://uniontech3d.com', 'Shanghai', 2000, '500+',
 ARRAY['Large-format printing', 'Automotive prototyping', 'Consumer goods', 'Industrial parts'],
 ARRAY['Automotive', 'Consumer electronics', 'Industrial', 'Healthcare'],
 ARRAY['ISO 9001']),

('Ricoh 3D', 'Service Bureau', 'Ricoh', 'AM S5500P', 8, 'Exact', 'SLS', 'Thermoplastic', 'Powder', 'Japan', 2023, 'https://ricoh.com/3d', 'Tokyo', 2017, '201-500',
 ARRAY['End-use parts production', 'Prototyping', 'Small batch manufacturing', 'Design consultation'],
 ARRAY['Automotive', 'Electronics', 'Industrial', 'Consumer goods'],
 ARRAY['ISO 9001']),

-- Healthcare Specialists
('3D LifePrints', 'Medical', 'Stratasys', 'J750 Digital Anatomy', 4, 'Exact', 'PolyJet', 'Composite', 'Resin', 'United States', 2024, 'https://3dlifeprints.com', 'Louisville', 2012, '11-50',
 ARRAY['Medical models', 'Surgical planning', 'Patient-specific devices', 'Training models'],
 ARRAY['Healthcare', 'Medical education', 'Research'],
 ARRAY['ISO 13485', 'FDA registered']),

('Formlabs Service Partner Network', 'Medical', 'Formlabs', 'Form 3B+', 12, 'Range', 'SLA', 'Thermoset', 'Resin', 'Germany', 2024, 'https://formlabs.com', 'Berlin', 2018, '11-50',
 ARRAY['Dental applications', 'Medical devices', 'Biocompatible parts', 'Surgical guides'],
 ARRAY['Dental', 'Healthcare', 'Research'],
 ARRAY['ISO 13485', 'FDA registered']),

-- Aerospace Specialists  
('Norsk Titanium', 'Manufacturing', 'Norsk Titanium', 'MERKE IV', 3, 'Exact', 'WAAM', 'Metal', 'Wire', 'United States', 2024, 'https://norsktitanium.com', 'Plattsburgh', 2007, '51-200',
 ARRAY['Titanium components', 'Aerospace structures', 'Large-scale parts', 'Near-net-shape manufacturing'],
 ARRAY['Aerospace', 'Defense'],
 ARRAY['AS9100', 'Nadcap']),

-- Automotive Specialists
('Local Motors', 'Manufacturing', 'Cincinnati Inc.', 'BAAM', 2, 'Exact', 'FDM', 'Composite', 'Pellets', 'United States', 2023, 'https://localmotors.com', 'Phoenix', 2007, '201-500',
 ARRAY['Large-scale printing', 'Automotive bodies', 'Tooling', 'Composite structures'],
 ARRAY['Automotive', 'Transportation'],
 ARRAY['ISO 9001']),

-- Small/Regional Service Providers
('Print3D', 'Prototyping', 'Ultimaker', 'S5 Pro Bundle', 8, 'Exact', 'FDM', 'Thermoplastic', 'Filament', 'Australia', 2024, 'https://print3d.com.au', 'Melbourne', 2014, '11-50',
 ARRAY['Rapid prototyping', 'Small batch production', 'Design services', 'Materials consulting'],
 ARRAY['Industrial', 'Consumer goods', 'Education'],
 ARRAY['ISO 9001']),

('3D Printing Canada', 'Service Bureau', 'Markforged', 'X7', 6, 'Exact', 'FDM', 'Composite', 'Filament', 'Canada', 2024, 'https://3dprintingcanada.com', 'Toronto', 2013, '11-50',
 ARRAY['Carbon fiber parts', 'Metal replacement parts', 'Jigs and fixtures', 'End-use components'],
 ARRAY['Aerospace', 'Automotive', 'Industrial', 'Tooling'],
 ARRAY['ISO 9001']),

-- Sand Casting Services
('ExOne', 'Manufacturing', 'ExOne', 'S-Max Pro', 5, 'Exact', 'Binder Jetting', 'Sand', 'Powder', 'United States', 2024, 'https://exone.com', 'North Huntingdon', 1995, '201-500',
 ARRAY['Sand casting molds', 'Metal cores', 'Foundry tooling', 'Rapid casting'],
 ARRAY['Automotive', 'Aerospace', 'Heavy machinery'],
 ARRAY['ISO 9001']),

-- Ceramic Services
('3DCeram', 'Manufacturing', '3DCeram', 'Ceramaker C900', 3, 'Exact', 'SLA', 'Ceramic', 'Resin', 'France', 2024, 'https://3dceram.com', 'Limoges', 2001, '51-200',
 ARRAY['Technical ceramics', 'High-temperature components', 'Bioceramics', 'Electronic components'],
 ARRAY['Aerospace', 'Electronics', 'Medical', 'Energy'],
 ARRAY['ISO 9001', 'ISO 13485']),

-- Multi-Technology Providers
('Quickparts (3D Systems)', 'Service Bureau', '3D Systems', 'ProJet MJP 5600', 20, 'Estimated', 'MultiJet', 'Composite', 'Resin', 'United States', 2024, 'https://quickparts.com', 'Atlanta', 2005, '201-500',
 ARRAY['Multi-technology printing', 'CNC machining', 'Urethane casting', 'Sheet metal'],
 ARRAY['Automotive', 'Aerospace', 'Medical', 'Electronics'],
 ARRAY['AS9100', 'ISO 9001', 'ISO 13485']),

('Xometry', 'Manufacturing', 'Carbon', 'M2', 15, 'Range', 'CLIP', 'Thermoset', 'Resin', 'United States', 2024, 'https://xometry.com', 'Gaithersburg', 2013, '500+',
 ARRAY['On-demand manufacturing', '3D printing', 'CNC machining', 'Injection molding'],
 ARRAY['Automotive', 'Aerospace', 'Industrial', 'Consumer'],
 ARRAY['AS9100', 'ISO 9001', 'ITAR registered']),

-- Emerging Markets
('SABIC Additive Manufacturing', 'Manufacturing', 'Fused Filament Fabrication', 'Industrial FFF', 10, 'Estimated', 'FDM', 'Thermoplastic', 'Filament', 'Saudi Arabia', 2023, 'https://sabic.com', 'Riyadh', 2018, '201-500',
 ARRAY['Thermoplastic parts', 'Chemical-resistant components', 'High-performance polymers'],
 ARRAY['Chemical', 'Oil and gas', 'Automotive'],
 ARRAY['ISO 9001'])

ON CONFLICT DO NOTHING;

-- ============================================================================
-- VIEWS FOR REPORTING AND ANALYTICS
-- ============================================================================

-- View 1: Print Services by Country and Segment
CREATE OR REPLACE VIEW print_services_by_country_segment AS
SELECT 
    country,
    segment,
    COUNT(*) as service_provider_count,
    SUM(number_of_printers) as total_printers,
    ROUND(AVG(number_of_printers), 1) as avg_printers_per_provider,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage_of_providers
FROM print_services_global
GROUP BY country, segment
ORDER BY country, total_printers DESC;

-- View 2: Printer Manufacturer Market Share
CREATE OR REPLACE VIEW printer_manufacturer_market_share AS
SELECT 
    printer_manufacturer,
    COUNT(DISTINCT company_name) as service_providers,
    SUM(number_of_printers) as total_printers_deployed,
    ROUND(SUM(number_of_printers) * 100.0 / SUM(SUM(number_of_printers)) OVER (), 2) as market_share_percentage,
    STRING_AGG(DISTINCT process, ', ') as processes_supported
FROM print_services_global
GROUP BY printer_manufacturer
ORDER BY total_printers_deployed DESC;

-- View 3: Process and Material Analysis
CREATE OR REPLACE VIEW process_material_analysis AS
SELECT 
    process,
    material_type,
    material_format,
    COUNT(*) as provider_count,
    SUM(number_of_printers) as total_printers,
    ROUND(AVG(number_of_printers), 1) as avg_printers_per_provider
FROM print_services_global
GROUP BY process, material_type, material_format
ORDER BY total_printers DESC;

-- View 4: Market Segment Distribution
CREATE OR REPLACE VIEW segment_distribution AS
SELECT 
    segment,
    COUNT(*) as provider_count,
    SUM(number_of_printers) as total_printers,
    ROUND(AVG(number_of_printers), 1) as avg_printers_per_provider,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage_of_market
FROM print_services_global
GROUP BY segment
ORDER BY total_printers DESC;

-- View 5: Data Freshness Report
CREATE OR REPLACE VIEW data_freshness_report AS
SELECT 
    update_year,
    COUNT(*) as provider_count,
    SUM(number_of_printers) as total_printers,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage_of_data
FROM print_services_global
GROUP BY update_year
ORDER BY update_year DESC;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE print_services_global IS 'Global print service providers data for Wohlers Company Data section';
COMMENT ON COLUMN print_services_global.segment IS 'Service segment: Service Bureau, Manufacturing, Prototyping, Production, Medical';
COMMENT ON COLUMN print_services_global.printer_manufacturer IS 'Equipment manufacturer (e.g., Stratasys, EOS, HP, Formlabs)';
COMMENT ON COLUMN print_services_global.printer_model IS 'Specific printer model and configuration';
COMMENT ON COLUMN print_services_global.number_of_printers IS 'Number of printers of this model at this service provider';
COMMENT ON COLUMN print_services_global.count_type IS 'How the count was determined: Exact, Estimated, Range, Minimum';
COMMENT ON COLUMN print_services_global.process IS 'AM process: FDM, SLA, SLS, DMLS, EBM, PolyJet, MJF, Binder Jetting, etc.';
COMMENT ON COLUMN print_services_global.material_type IS 'Material category: Thermoplastic, Thermoset, Metal, Ceramic, Composite, Sand';
COMMENT ON COLUMN print_services_global.material_format IS 'Physical form: Filament, Resin, Powder, Pellets, Wire, Sheet';
COMMENT ON COLUMN print_services_global.country IS 'Country where service provider is located';
COMMENT ON COLUMN print_services_global.update_year IS 'Year when this data was last updated or verified';