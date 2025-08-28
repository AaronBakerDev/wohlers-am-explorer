-- Migration: Add market intelligence and financing tables per Data Migration Plan
-- Purpose: Extend schema with categories, investments, M&A, pricing, and market data

-- Add additional company columns if missing
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS parent_company VARCHAR(255);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS subsidiary_info TEXT;
-- Note: stock_ticker already exists; keep existing and add public_stock_ticker for clarity if needed
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS public_stock_ticker VARCHAR(10);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS last_funding_date DATE;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS total_funding_usd DECIMAL(12,2);

-- Company categories/roles
CREATE TABLE IF NOT EXISTS public.company_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, category)
);

-- Investments
CREATE TABLE IF NOT EXISTS public.investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    investment_year INTEGER NOT NULL,
    investment_month VARCHAR(20),
    amount_millions DECIMAL(10,2),
    funding_round VARCHAR(50),
    lead_investor VARCHAR(255),
    country VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mergers & Acquisitions
CREATE TABLE IF NOT EXISTS public.mergers_acquisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acquired_company_name VARCHAR(255) NOT NULL,
    acquiring_company_name VARCHAR(255) NOT NULL,
    acquired_company_id UUID REFERENCES public.companies(id),
    acquiring_company_id UUID REFERENCES public.companies(id),
    announcement_date DATE,
    deal_size_millions DECIMAL(12,2),
    deal_status VARCHAR(50) DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service pricing
CREATE TABLE IF NOT EXISTS public.service_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    material_category VARCHAR(100),
    specific_material VARCHAR(255),
    process VARCHAR(100),
    quantity INTEGER,
    price_usd DECIMAL(10,2),
    lead_time_days INTEGER,
    notes TEXT,
    data_source VARCHAR(100) DEFAULT 'vendor_import_2025',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market intelligence data
CREATE TABLE IF NOT EXISTS public.market_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_type VARCHAR(50) NOT NULL, -- 'revenue', 'forecast', 'industry_breakdown', 'market_size'
    year INTEGER NOT NULL,
    segment VARCHAR(100),
    region VARCHAR(100),
    country VARCHAR(100),
    industry VARCHAR(100),
    value_usd DECIMAL(15,2),
    percentage DECIMAL(5,2),
    unit VARCHAR(50),
    data_source VARCHAR(100) DEFAULT 'vendor_import_2025',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_companies_parent_company ON public.companies(parent_company);
CREATE INDEX IF NOT EXISTS idx_companies_stock_ticker ON public.companies(stock_ticker);
CREATE INDEX IF NOT EXISTS idx_companies_public_stock_ticker ON public.companies(public_stock_ticker);
CREATE INDEX IF NOT EXISTS idx_companies_revenue_range ON public.companies(revenue_range);
CREATE INDEX IF NOT EXISTS idx_companies_employee_count ON public.companies(employee_count_range);

CREATE INDEX IF NOT EXISTS idx_company_categories_company_id ON public.company_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_company_categories_category ON public.company_categories(category);
CREATE INDEX IF NOT EXISTS idx_company_categories_primary ON public.company_categories(company_id, is_primary);

CREATE INDEX IF NOT EXISTS idx_investments_company_id ON public.investments(company_id);
CREATE INDEX IF NOT EXISTS idx_investments_year ON public.investments(investment_year);
CREATE INDEX IF NOT EXISTS idx_investments_amount ON public.investments(amount_millions);
CREATE INDEX IF NOT EXISTS idx_investments_round ON public.investments(funding_round);

CREATE INDEX IF NOT EXISTS idx_ma_acquired_company ON public.mergers_acquisitions(acquired_company_id);
CREATE INDEX IF NOT EXISTS idx_ma_acquiring_company ON public.mergers_acquisitions(acquiring_company_id);
CREATE INDEX IF NOT EXISTS idx_ma_date ON public.mergers_acquisitions(announcement_date);

CREATE INDEX IF NOT EXISTS idx_pricing_company_id ON public.service_pricing(company_id);
CREATE INDEX IF NOT EXISTS idx_pricing_material ON public.service_pricing(material_category);
CREATE INDEX IF NOT EXISTS idx_pricing_process ON public.service_pricing(process);
CREATE INDEX IF NOT EXISTS idx_pricing_price ON public.service_pricing(price_usd);

CREATE INDEX IF NOT EXISTS idx_market_data_type_year ON public.market_data(data_type, year);
CREATE INDEX IF NOT EXISTS idx_market_data_segment ON public.market_data(segment);
CREATE INDEX IF NOT EXISTS idx_market_data_country ON public.market_data(country);

-- Enable RLS on new tables
ALTER TABLE public.company_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mergers_acquisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;

-- Policies (public read; allow inserts for import tooling)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='company_categories' AND policyname='Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON public.company_categories FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='company_categories' AND policyname='Enable insert access for all users'
  ) THEN
    CREATE POLICY "Enable insert access for all users" ON public.company_categories FOR INSERT WITH CHECK (true);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='investments' AND policyname='Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON public.investments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='investments' AND policyname='Enable insert access for all users'
  ) THEN
    CREATE POLICY "Enable insert access for all users" ON public.investments FOR INSERT WITH CHECK (true);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='mergers_acquisitions' AND policyname='Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON public.mergers_acquisitions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='mergers_acquisitions' AND policyname='Enable insert access for all users'
  ) THEN
    CREATE POLICY "Enable insert access for all users" ON public.mergers_acquisitions FOR INSERT WITH CHECK (true);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='service_pricing' AND policyname='Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON public.service_pricing FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='service_pricing' AND policyname='Enable insert access for all users'
  ) THEN
    CREATE POLICY "Enable insert access for all users" ON public.service_pricing FOR INSERT WITH CHECK (true);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='market_data' AND policyname='Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON public.market_data FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='market_data' AND policyname='Enable insert access for all users'
  ) THEN
    CREATE POLICY "Enable insert access for all users" ON public.market_data FOR INSERT WITH CHECK (true);
  END IF;
END$$;

-- Comments for documentation
COMMENT ON TABLE public.company_categories IS 'Company categories/roles (e.g., equipment maker, service bureau)';
COMMENT ON TABLE public.investments IS 'Funding rounds and investment activity';
COMMENT ON TABLE public.mergers_acquisitions IS 'M&A records linking companies with optional IDs';
COMMENT ON TABLE public.service_pricing IS 'Service pricing observations for materials/processes';
COMMENT ON TABLE public.market_data IS 'Market intelligence metrics (revenue, forecasts, etc.)';

