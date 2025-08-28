-- Migration: Create AM Companies Database Schema
-- Purpose: Set up tables for additive manufacturing companies, technologies, materials, and locations

-- Create companies table
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    website VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(50),
    country VARCHAR(50) DEFAULT 'United States',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    company_type VARCHAR(50) CHECK (company_type IN ('equipment', 'service', 'software', 'material', 'other')),
    description TEXT,
    founded_year INTEGER,
    employee_count_range VARCHAR(50),
    revenue_range VARCHAR(50),
    is_public_company BOOLEAN DEFAULT false,
    stock_ticker VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create technologies table
CREATE TABLE public.technologies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create materials table  
CREATE TABLE public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create company_technologies junction table
CREATE TABLE public.company_technologies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    technology_id UUID REFERENCES public.technologies(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, technology_id)
);

-- Create company_materials junction table
CREATE TABLE public.company_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, material_id)
);

-- Create indexes for better performance
CREATE INDEX idx_companies_location ON public.companies(latitude, longitude);
CREATE INDEX idx_companies_state ON public.companies(state);
CREATE INDEX idx_companies_type ON public.companies(company_type);
CREATE INDEX idx_companies_name ON public.companies(name);
CREATE INDEX idx_company_technologies_company ON public.company_technologies(company_id);
CREATE INDEX idx_company_materials_company ON public.company_materials(company_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON public.companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial technology data
INSERT INTO public.technologies (name, category, description) VALUES
('FDM', 'Extrusion', 'Fused Deposition Modeling - Material extrusion process'),
('SLA', 'Photopolymerization', 'Stereolithography - Light-based curing process'),
('SLS', 'Powder Bed Fusion', 'Selective Laser Sintering - Laser-based powder fusion'),
('DMLS', 'Powder Bed Fusion', 'Direct Metal Laser Sintering - Metal powder fusion'),
('EBM', 'Powder Bed Fusion', 'Electron Beam Melting - Electron beam metal fusion'),
('PolyJet', 'Photopolymerization', 'Multi-material jetting technology'),
('MJF', 'Powder Bed Fusion', 'Multi Jet Fusion - HP''s powder bed technology'),
('DLS', 'Photopolymerization', 'Digital Light Synthesis - Carbon''s continuous process'),
('BJT', 'Binder Jetting', 'Binder Jet Technology - Powder and binder process'),
('LOM', 'Sheet Lamination', 'Laminated Object Manufacturing'),
('WAAM', 'Directed Energy Deposition', 'Wire Arc Additive Manufacturing'),
('LMD', 'Directed Energy Deposition', 'Laser Metal Deposition');

-- Insert initial material data
INSERT INTO public.materials (name, category, description) VALUES
('PLA', 'Thermoplastic', 'Polylactic Acid - Biodegradable thermoplastic'),
('ABS', 'Thermoplastic', 'Acrylonitrile Butadiene Styrene'),
('PETG', 'Thermoplastic', 'Polyethylene Terephthalate Glycol'),
('Nylon', 'Thermoplastic', 'Polyamide engineering plastic'),
('TPU', 'Elastomer', 'Thermoplastic Polyurethane - Flexible material'),
('Resin', 'Thermoset', 'Photopolymer resin for SLA/DLP'),
('Titanium', 'Metal', 'Titanium alloys for aerospace and medical'),
('Aluminum', 'Metal', 'Aluminum alloys for lightweight applications'),
('Steel', 'Metal', 'Stainless steel and tool steels'),
('Inconel', 'Metal', 'Nickel-chromium superalloy'),
('Ceramic', 'Ceramic', 'Advanced ceramic materials'),
('Carbon Fiber', 'Composite', 'Carbon fiber reinforced materials'),
('Glass Fiber', 'Composite', 'Glass fiber reinforced materials'),
('Medical Grade', 'Specialty', 'FDA approved biocompatible materials'),
('Conductive', 'Specialty', 'Electrically conductive materials'),
('Dissolvable', 'Support', 'Water-soluble support materials');

-- Enable Row Level Security (RLS) 
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_materials ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (since this is market intelligence data)
CREATE POLICY "Enable read access for all users" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.technologies FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.materials FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.company_technologies FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.company_materials FOR SELECT USING (true);

-- Comments for documentation
COMMENT ON TABLE public.companies IS 'Additive manufacturing companies database';
COMMENT ON TABLE public.technologies IS 'AM technologies and processes';
COMMENT ON TABLE public.materials IS 'Materials used in additive manufacturing';
COMMENT ON TABLE public.company_technologies IS 'Junction table linking companies to technologies';
COMMENT ON TABLE public.company_materials IS 'Junction table linking companies to materials';