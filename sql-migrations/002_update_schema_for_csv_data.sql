-- Migration: Update AM Companies Schema to Match CSV Data Structure
-- Purpose: Add missing fields and standardize process codes

-- Add missing fields to companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS printer_manufacturer VARCHAR(100);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS printer_model VARCHAR(100);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS number_of_printers INTEGER;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS count_type VARCHAR(20) CHECK (count_type IN ('Minimum', 'Actual', 'Estimated'));

-- Update technologies table with standardized AM process codes
-- First, clear existing data
TRUNCATE TABLE public.company_technologies;
TRUNCATE TABLE public.technologies;

-- Insert standardized AM process codes from CSV
INSERT INTO public.technologies (name, category, description) VALUES
('SHL', 'Hybrid', 'Sonic Layer - Ultrasonic additive manufacturing'),
('PBF-LB', 'Powder Bed Fusion', 'Powder Bed Fusion - Laser Beam (includes SLS, DMLS, SLM)'),
('BJT', 'Binder Jetting', 'Binder Jet Technology - Powder and binder process'),
('MEX', 'Material Extrusion', 'Material Extrusion (FDM/FFF) - Thermoplastic extrusion'),
('MJT', 'Material Jetting', 'Multi Jet Technology - Inkjet-like material deposition'),
('VPP', 'Vat Photopolymerization', 'Vat Photopolymerization (SLA/DLP) - Light-cured resin'),
('PBF-EB', 'Powder Bed Fusion', 'Powder Bed Fusion - Electron Beam (EBM)'),
('DED', 'Directed Energy Deposition', 'Directed Energy Deposition - Wire/powder fed processes'),
('SHL-US', 'Hybrid', 'Sonic Layer - Ultrasonic metal welding'),
('LOM', 'Sheet Lamination', 'Laminated Object Manufacturing'),
('NPJ', 'Material Jetting', 'NanoParticle Jetting - Metal inkjet printing');

-- Update materials table with standardized categories from CSV
TRUNCATE TABLE public.company_materials;
TRUNCATE TABLE public.materials;

-- Insert standardized material categories from CSV
INSERT INTO public.materials (name, category, description) VALUES
('Metal', 'Metal', 'Metallic materials including titanium, aluminum, steel, etc.'),
('Polymer', 'Polymer', 'Thermoplastic and thermoset polymers'),
('Ceramic', 'Ceramic', 'Ceramic and glass materials'),
('Composite', 'Composite', 'Multi-material composites including carbon fiber'),
('Bio-material', 'Bio-material', 'Biocompatible and medical-grade materials'),
('Sand', 'Sand', 'Sand casting materials'),
('Wax', 'Support', 'Wax support and investment casting materials'),
('Multi-material', 'Multi-material', 'Multiple material types in single process');

-- Create indexes for new fields
CREATE INDEX idx_companies_printer_manufacturer ON public.companies(printer_manufacturer);
CREATE INDEX idx_companies_printer_model ON public.companies(printer_model);
CREATE INDEX idx_companies_number_of_printers ON public.companies(number_of_printers);
CREATE INDEX idx_companies_count_type ON public.companies(count_type);

-- Add comments for new fields
COMMENT ON COLUMN public.companies.printer_manufacturer IS 'Manufacturer of the 3D printer/AM system';
COMMENT ON COLUMN public.companies.printer_model IS 'Model name of the 3D printer/AM system';
COMMENT ON COLUMN public.companies.number_of_printers IS 'Number of printers/systems the company has';
COMMENT ON COLUMN public.companies.count_type IS 'Type of count: Minimum, Actual, or Estimated';

-- Update table comments
COMMENT ON TABLE public.technologies IS 'Standardized AM process codes and categories';
COMMENT ON TABLE public.materials IS 'Standardized AM material categories';

-- Add INSERT policies for data import (temporarily allow anonymous inserts)
CREATE POLICY "Enable insert access for all users" ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert access for all users" ON public.company_technologies FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert access for all users" ON public.company_materials FOR INSERT WITH CHECK (true);