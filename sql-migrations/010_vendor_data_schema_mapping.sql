-- Migration: Create tables that EXACTLY match extracted vendor data structure (1:1 mapping)
-- Purpose: Ensure ALL vendor data CSV/JSON files can be imported to Supabase with exact column mapping
-- Data Files: Company_information.json, Fundings_and_investments.json, Print_services_Pricing_data.json,
--             AM_market_revenue_2024.json, M_A.json, Company_roles.json, Revenue_by_industry_2024.json, 
--             Total_AM_market_size.json, Directory.json, COMPANY___AM_systems_mfrs.json, COMPANY___Print_services_global.json

-- 1. EXACT mapping for Company_information.json
-- Fields: "Company name", "Website", "Headquarters"
CREATE TABLE IF NOT EXISTS public.vendor_company_information (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(500) NOT NULL, -- Maps to "Company name"
    website VARCHAR(1000), -- Maps to "Website"
    headquarters VARCHAR(200), -- Maps to "Headquarters"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_name)
);

-- 2. EXACT mapping for Fundings_and_investments.json
-- Fields: "Year", "Month", "Company name", "Country", "Amount (in millions USD)", "Funding round", "Lead investor", "__EMPTY_2"
CREATE TABLE IF NOT EXISTS public.vendor_fundings_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER, -- Maps to "Year"
    month VARCHAR(20), -- Maps to "Month"
    company_name VARCHAR(500), -- Maps to "Company name"
    country VARCHAR(100), -- Maps to "Country"
    amount_millions_usd DECIMAL(10,2), -- Maps to "Amount (in millions USD)"
    funding_round VARCHAR(100), -- Maps to "Funding round"
    lead_investor VARCHAR(500), -- Maps to "Lead investor"
    notes TEXT, -- Maps to "__EMPTY_2" (notes field)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EXACT mapping for Print_services_Pricing_data.json
-- Fields: "Company name", "Material type", "Material", "Process", "Quantity", "Manufacturing cost", "Day ordered", "Delivery date", "Lead time", "Country", "Scattered plot with manufacturing cost vs delivery time"
CREATE TABLE IF NOT EXISTS public.vendor_print_service_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(500), -- Maps to "Company name"
    material_type VARCHAR(100), -- Maps to "Material type"
    material VARCHAR(200), -- Maps to "Material"
    process VARCHAR(100), -- Maps to "Process"
    quantity INTEGER, -- Maps to "Quantity"
    manufacturing_cost DECIMAL(10,2), -- Maps to "Manufacturing cost"
    day_ordered INTEGER, -- Maps to "Day ordered"
    delivery_date INTEGER, -- Maps to "Delivery date"
    lead_time INTEGER, -- Maps to "Lead time"
    country VARCHAR(100), -- Maps to "Country"
    scattered_plot_info TEXT, -- Maps to "Scattered plot with manufacturing cost vs delivery time"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EXACT mapping for AM_market_revenue_2024.json
-- Fields: " Revenue (USD) ", "Country", "Segment", "__EMPTY_1", "__EMPTY_2", "__EMPTY_3", "__EMPTY_4"
CREATE TABLE IF NOT EXISTS public.vendor_am_market_revenue_2024 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    revenue_usd BIGINT, -- Maps to " Revenue (USD) "
    country VARCHAR(100), -- Maps to "Country"
    segment VARCHAR(100), -- Maps to "Segment"
    filter_info_1 VARCHAR(200), -- Maps to "__EMPTY_1"
    filter_info_2 VARCHAR(200), -- Maps to "__EMPTY_2"  
    filter_info_3 VARCHAR(200), -- Maps to "__EMPTY_3"
    filter_info_4 VARCHAR(200), -- Maps to "__EMPTY_4"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. EXACT mapping for M_A.json
-- Fields: "Deal date  ", "Acquired company  ", "Acquiring company  ", "Deal size ($M)   ", "Country  "
CREATE TABLE IF NOT EXISTS public.vendor_mergers_acquisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_date VARCHAR(20), -- Maps to "Deal date  " (note the trailing spaces in source)
    acquired_company VARCHAR(500), -- Maps to "Acquired company  "
    acquiring_company VARCHAR(500), -- Maps to "Acquiring company  "
    deal_size_millions DECIMAL(12,2), -- Maps to "Deal size ($M)   "
    country VARCHAR(100), -- Maps to "Country  "
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. EXACT mapping for Company_roles.json
-- Fields: "Company name", "Category"
CREATE TABLE IF NOT EXISTS public.vendor_company_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(500), -- Maps to "Company name"
    category VARCHAR(200), -- Maps to "Category"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_name, category)
);

-- 7. EXACT mapping for Revenue_by_industry_2024.json
-- Fields: "Industry", "Share of revenue (%)", "Revenue (USD)", "Region", "Material", "__EMPTY_1", "__EMPTY_2", "__EMPTY_3", "__EMPTY_4"
CREATE TABLE IF NOT EXISTS public.vendor_revenue_by_industry_2024 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry VARCHAR(100), -- Maps to "Industry"
    share_of_revenue_percent DECIMAL(5,2), -- Maps to "Share of revenue (%)"
    revenue_usd BIGINT, -- Maps to "Revenue (USD)"
    region VARCHAR(100), -- Maps to "Region"
    material VARCHAR(100), -- Maps to "Material"
    filter_info_1 VARCHAR(200), -- Maps to "__EMPTY_1"
    filter_info_2 VARCHAR(200), -- Maps to "__EMPTY_2"
    filter_info_3 VARCHAR(200), -- Maps to "__EMPTY_3"
    filter_info_4 VARCHAR(200), -- Maps to "__EMPTY_4"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. EXACT mapping for Total_AM_market_size.json
-- Fields: "Year", "Type", "Segment", " Past revenue (USD) ", "__EMPTY_1", "__EMPTY_2", "__EMPTY_3"
CREATE TABLE IF NOT EXISTS public.vendor_total_am_market_size (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER, -- Maps to "Year"
    forecast_type VARCHAR(50), -- Maps to "Type"
    segment VARCHAR(100), -- Maps to "Segment"
    revenue_usd BIGINT, -- Maps to " Past revenue (USD) " (note the leading space)
    filter_info_1 VARCHAR(200), -- Maps to "__EMPTY_1"
    filter_info_2 VARCHAR(200), -- Maps to "__EMPTY_2"
    filter_info_3 VARCHAR(200), -- Maps to "__EMPTY_3"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(year, forecast_type, segment)
);

-- 9. EXACT mapping for Directory.json 
-- Fields: "Figure name", "Sheet name and link", "V1", "Notes"
CREATE TABLE IF NOT EXISTS public.vendor_directory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    figure_name VARCHAR(500), -- Maps to "Figure name"
    sheet_name_and_link VARCHAR(500), -- Maps to "Sheet name and link"
    v1 TEXT, -- Maps to "V1" (can be number or text)
    notes TEXT, -- Maps to "Notes"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. EXACT mapping for COMPANY___AM_systems_mfrs.json
-- Fields: "Company name", "Segment", "Material type", "Material format", "Country"
CREATE TABLE IF NOT EXISTS public.vendor_am_systems_manufacturers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(500), -- Maps to "Company name"
    segment VARCHAR(200), -- Maps to "Segment"
    material_type VARCHAR(100), -- Maps to "Material type" 
    material_format VARCHAR(100), -- Maps to "Material format"
    country VARCHAR(100), -- Maps to "Country"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. EXACT mapping for COMPANY___Print_services_global.json (need to check actual structure)
CREATE TABLE IF NOT EXISTS public.vendor_print_services_global (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(500),
    segment VARCHAR(200),
    material_type VARCHAR(100),
    material_format VARCHAR(100), 
    country VARCHAR(100),
    additional_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for new vendor tables
CREATE INDEX IF NOT EXISTS idx_vendor_company_information_name ON public.vendor_company_information(company_name);
CREATE INDEX IF NOT EXISTS idx_vendor_company_information_headquarters ON public.vendor_company_information(headquarters);

CREATE INDEX IF NOT EXISTS idx_vendor_fundings_year ON public.vendor_fundings_investments(year);
CREATE INDEX IF NOT EXISTS idx_vendor_fundings_company ON public.vendor_fundings_investments(company_name);
CREATE INDEX IF NOT EXISTS idx_vendor_fundings_country ON public.vendor_fundings_investments(country);
CREATE INDEX IF NOT EXISTS idx_vendor_fundings_amount ON public.vendor_fundings_investments(amount_millions_usd);

CREATE INDEX IF NOT EXISTS idx_vendor_pricing_company ON public.vendor_print_service_pricing(company_name);
CREATE INDEX IF NOT EXISTS idx_vendor_pricing_material ON public.vendor_print_service_pricing(material);
CREATE INDEX IF NOT EXISTS idx_vendor_pricing_process ON public.vendor_print_service_pricing(process);
CREATE INDEX IF NOT EXISTS idx_vendor_pricing_country ON public.vendor_print_service_pricing(country);

CREATE INDEX IF NOT EXISTS idx_vendor_am_revenue_country ON public.vendor_am_market_revenue_2024(country);
CREATE INDEX IF NOT EXISTS idx_vendor_am_revenue_segment ON public.vendor_am_market_revenue_2024(segment);

CREATE INDEX IF NOT EXISTS idx_vendor_ma_acquired ON public.vendor_mergers_acquisitions(acquired_company);
CREATE INDEX IF NOT EXISTS idx_vendor_ma_acquiring ON public.vendor_mergers_acquisitions(acquiring_company);
CREATE INDEX IF NOT EXISTS idx_vendor_ma_country ON public.vendor_mergers_acquisitions(country);

CREATE INDEX IF NOT EXISTS idx_vendor_company_roles_name ON public.vendor_company_roles(company_name);
CREATE INDEX IF NOT EXISTS idx_vendor_company_roles_category ON public.vendor_company_roles(category);

CREATE INDEX IF NOT EXISTS idx_vendor_revenue_industry_industry ON public.vendor_revenue_by_industry_2024(industry);
CREATE INDEX IF NOT EXISTS idx_vendor_revenue_industry_region ON public.vendor_revenue_by_industry_2024(region);

CREATE INDEX IF NOT EXISTS idx_vendor_market_size_year ON public.vendor_total_am_market_size(year);
CREATE INDEX IF NOT EXISTS idx_vendor_market_size_type ON public.vendor_total_am_market_size(forecast_type);
CREATE INDEX IF NOT EXISTS idx_vendor_market_size_segment ON public.vendor_total_am_market_size(segment);

CREATE INDEX IF NOT EXISTS idx_vendor_directory_figure ON public.vendor_directory(figure_name);

CREATE INDEX IF NOT EXISTS idx_vendor_am_mfrs_company ON public.vendor_am_systems_manufacturers(company_name);
CREATE INDEX IF NOT EXISTS idx_vendor_am_mfrs_country ON public.vendor_am_systems_manufacturers(country);
CREATE INDEX IF NOT EXISTS idx_vendor_am_mfrs_material ON public.vendor_am_systems_manufacturers(material_type);

CREATE INDEX IF NOT EXISTS idx_vendor_print_global_company ON public.vendor_print_services_global(company_name);
CREATE INDEX IF NOT EXISTS idx_vendor_print_global_country ON public.vendor_print_services_global(country);

-- Enable RLS on all new vendor tables
ALTER TABLE public.vendor_company_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_fundings_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_print_service_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_am_market_revenue_2024 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_mergers_acquisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_company_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_revenue_by_industry_2024 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_total_am_market_size ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_am_systems_manufacturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_print_services_global ENABLE ROW LEVEL SECURITY;

-- Policies for all new vendor tables (public read/write access)
-- vendor_company_information
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_company_information' AND policyname='Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON public.vendor_company_information FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_company_information' AND policyname='Enable insert access for all users'
  ) THEN
    CREATE POLICY "Enable insert access for all users" ON public.vendor_company_information FOR INSERT WITH CHECK (true);
  END IF;
END$$;

-- vendor_fundings_investments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_fundings_investments' AND policyname='Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON public.vendor_fundings_investments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_fundings_investments' AND policyname='Enable insert access for all users'
  ) THEN
    CREATE POLICY "Enable insert access for all users" ON public.vendor_fundings_investments FOR INSERT WITH CHECK (true);
  END IF;
END$$;

-- vendor_print_service_pricing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_print_service_pricing' AND policyname='Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON public.vendor_print_service_pricing FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_print_service_pricing' AND policyname='Enable insert access for all users'
  ) THEN
    CREATE POLICY "Enable insert access for all users" ON public.vendor_print_service_pricing FOR INSERT WITH CHECK (true);
  END IF;
END$$;

-- vendor_am_market_revenue_2024
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_am_market_revenue_2024' AND policyname='Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON public.vendor_am_market_revenue_2024 FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_am_market_revenue_2024' AND policyname='Enable insert access for all users'
  ) THEN
    CREATE POLICY "Enable insert access for all users" ON public.vendor_am_market_revenue_2024 FOR INSERT WITH CHECK (true);
  END IF;
END$$;

-- vendor_mergers_acquisitions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_mergers_acquisitions' AND policyname='Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON public.vendor_mergers_acquisitions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_mergers_acquisitions' AND policyname='Enable insert access for all users'
  ) THEN
    CREATE POLICY "Enable insert access for all users" ON public.vendor_mergers_acquisitions FOR INSERT WITH CHECK (true);
  END IF;
END$$;

-- vendor_company_roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_company_roles' AND policyname='Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON public.vendor_company_roles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_company_roles' AND policyname='Enable insert access for all users'
  ) THEN
    CREATE POLICY "Enable insert access for all users" ON public.vendor_company_roles FOR INSERT WITH CHECK (true);
  END IF;
END$$;

-- vendor_revenue_by_industry_2024
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_revenue_by_industry_2024' AND policyname='Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON public.vendor_revenue_by_industry_2024 FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_revenue_by_industry_2024' AND policyname='Enable insert access for all users'
  ) THEN
    CREATE POLICY "Enable insert access for all users" ON public.vendor_revenue_by_industry_2024 FOR INSERT WITH CHECK (true);
  END IF;
END$$;

-- vendor_total_am_market_size
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_total_am_market_size' AND policyname='Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON public.vendor_total_am_market_size FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_total_am_market_size' AND policyname='Enable insert access for all users'
  ) THEN
    CREATE POLICY "Enable insert access for all users" ON public.vendor_total_am_market_size FOR INSERT WITH CHECK (true);
  END IF;
END$$;

-- vendor_directory
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_directory' AND policyname='Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON public.vendor_directory FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_directory' AND policyname='Enable insert access for all users'
  ) THEN
    CREATE POLICY "Enable insert access for all users" ON public.vendor_directory FOR INSERT WITH CHECK (true);
  END IF;
END$$;

-- vendor_am_systems_manufacturers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_am_systems_manufacturers' AND policyname='Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON public.vendor_am_systems_manufacturers FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_am_systems_manufacturers' AND policyname='Enable insert access for all users'
  ) THEN
    CREATE POLICY "Enable insert access for all users" ON public.vendor_am_systems_manufacturers FOR INSERT WITH CHECK (true);
  END IF;
END$$;

-- vendor_print_services_global
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_print_services_global' AND policyname='Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON public.vendor_print_services_global FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_print_services_global' AND policyname='Enable insert access for all users'
  ) THEN
    CREATE POLICY "Enable insert access for all users" ON public.vendor_print_services_global FOR INSERT WITH CHECK (true);
  END IF;
END$$;

-- Comments for documentation
COMMENT ON TABLE public.vendor_company_information IS 'One-to-one mapping: Company_information.json - basic company info (name, website, headquarters)';
COMMENT ON TABLE public.vendor_fundings_investments IS 'One-to-one mapping: Fundings_and_investments.json - funding rounds and investment data';
COMMENT ON TABLE public.vendor_print_service_pricing IS 'One-to-one mapping: Print_services_Pricing_data.json - service pricing and lead time data';
COMMENT ON TABLE public.vendor_am_market_revenue_2024 IS 'One-to-one mapping: AM_market_revenue_2024.json - 2024 market revenue by country/segment';
COMMENT ON TABLE public.vendor_mergers_acquisitions IS 'One-to-one mapping: M_A.json - mergers and acquisitions data';
COMMENT ON TABLE public.vendor_company_roles IS 'One-to-one mapping: Company_roles.json - company categories and roles';
COMMENT ON TABLE public.vendor_revenue_by_industry_2024 IS 'One-to-one mapping: Revenue_by_industry_2024.json - industry revenue breakdown';
COMMENT ON TABLE public.vendor_total_am_market_size IS 'One-to-one mapping: Total_AM_market_size.json - market size forecasts by segment';
COMMENT ON TABLE public.vendor_directory IS 'One-to-one mapping: Directory.json - figure directory with sheet references';
COMMENT ON TABLE public.vendor_am_systems_manufacturers IS 'One-to-one mapping: COMPANY___AM_systems_mfrs.json - AM system manufacturers';
COMMENT ON TABLE public.vendor_print_services_global IS 'One-to-one mapping: COMPANY___Print_services_global.json - global print service providers';