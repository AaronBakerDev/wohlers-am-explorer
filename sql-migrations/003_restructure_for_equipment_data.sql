-- Migration: Restructure Database for Equipment-Level Granular Data
-- Purpose: Redesign schema to capture individual printer/equipment records per company

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON public.companies;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.companies;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.company_technologies;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.company_technologies;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.company_materials;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.company_materials;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.technologies;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.materials;

-- Drop existing junction tables (we'll replace with equipment table)
DROP TABLE IF EXISTS public.company_technologies CASCADE;
DROP TABLE IF EXISTS public.company_materials CASCADE;

-- Simplify companies table - remove printer-specific fields
ALTER TABLE public.companies DROP COLUMN IF EXISTS printer_manufacturer;
ALTER TABLE public.companies DROP COLUMN IF EXISTS printer_model;
ALTER TABLE public.companies DROP COLUMN IF EXISTS number_of_printers;
ALTER TABLE public.companies DROP COLUMN IF EXISTS count_type;

-- Create new equipment table for granular printer/machine data
CREATE TABLE public.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    manufacturer VARCHAR(100), -- Stratasys, EOS, HP, etc.
    model VARCHAR(100), -- Fortus, M290, MJF, etc.
    process VARCHAR(50), -- MEX, PBF-LB, VPP, etc.
    material VARCHAR(50), -- Metal, Polymer, Ceramic, etc.
    count INTEGER DEFAULT 1, -- Number of machines
    count_type VARCHAR(20) CHECK (count_type IN ('Minimum', 'Actual', 'Estimated')) DEFAULT 'Minimum',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for equipment table
CREATE INDEX idx_equipment_company_id ON public.equipment(company_id);
CREATE INDEX idx_equipment_manufacturer ON public.equipment(manufacturer);
CREATE INDEX idx_equipment_process ON public.equipment(process);
CREATE INDEX idx_equipment_material ON public.equipment(material);
CREATE INDEX idx_equipment_count ON public.equipment(count);

-- Add equipment updated_at trigger
CREATE TRIGGER update_equipment_updated_at 
    BEFORE UPDATE ON public.equipment 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on equipment table
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- Create policies for equipment table
CREATE POLICY "Enable read access for all users" ON public.equipment FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.equipment FOR INSERT WITH CHECK (true);

-- Recreate policies for existing tables
CREATE POLICY "Enable read access for all users" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read access for all users" ON public.technologies FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.materials FOR SELECT USING (true);

-- Add comments for new equipment table
COMMENT ON TABLE public.equipment IS 'Individual printer/equipment records for each company';
COMMENT ON COLUMN public.equipment.company_id IS 'Reference to the company that owns this equipment';
COMMENT ON COLUMN public.equipment.manufacturer IS 'Manufacturer of the 3D printer/AM system (e.g., Stratasys, EOS)';
COMMENT ON COLUMN public.equipment.model IS 'Model name of the 3D printer/AM system (e.g., Fortus, M290)';
COMMENT ON COLUMN public.equipment.process IS 'AM process/technology code (e.g., MEX, PBF-LB, VPP)';
COMMENT ON COLUMN public.equipment.material IS 'Material type (e.g., Metal, Polymer, Ceramic)';
COMMENT ON COLUMN public.equipment.count IS 'Number of machines of this type';
COMMENT ON COLUMN public.equipment.count_type IS 'Type of count: Minimum, Actual, or Estimated';

-- Create view for company summaries with aggregated equipment data
CREATE OR REPLACE VIEW public.company_summaries AS
SELECT 
    c.id,
    c.name,
    c.website,
    c.city,
    c.state,
    c.country,
    c.latitude,
    c.longitude,
    c.company_type,
    c.description,
    c.founded_year,
    c.employee_count_range,
    c.revenue_range,
    c.is_public_company,
    c.stock_ticker,
    c.created_at,
    c.updated_at,
    -- Aggregated equipment statistics
    COALESCE(SUM(e.count), 0) as total_machines,
    COUNT(DISTINCT e.process) as unique_processes,
    COUNT(DISTINCT e.material) as unique_materials,
    COUNT(DISTINCT e.manufacturer) as unique_manufacturers,
    -- Array of unique processes and materials
    ARRAY_AGG(DISTINCT e.process) FILTER (WHERE e.process IS NOT NULL) as processes,
    ARRAY_AGG(DISTINCT e.material) FILTER (WHERE e.material IS NOT NULL) as materials
FROM public.companies c
LEFT JOIN public.equipment e ON c.id = e.company_id
GROUP BY c.id, c.name, c.website, c.city, c.state, c.country, c.latitude, c.longitude, 
         c.company_type, c.description, c.founded_year, c.employee_count_range, 
         c.revenue_range, c.is_public_company, c.stock_ticker, c.created_at, c.updated_at;

-- Grant access to the view
CREATE POLICY "Enable read access for all users" ON public.company_summaries FOR SELECT USING (true);

-- Create indexes for better performance on common queries
CREATE INDEX idx_equipment_company_process ON public.equipment(company_id, process);
CREATE INDEX idx_equipment_company_material ON public.equipment(company_id, material);
CREATE INDEX idx_equipment_process_material ON public.equipment(process, material);