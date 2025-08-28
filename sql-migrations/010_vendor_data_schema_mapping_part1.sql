-- Part 1: Create vendor tables (run this first)

-- 1. EXACT mapping for Company_information.json
CREATE TABLE IF NOT EXISTS public.vendor_company_information (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(500) NOT NULL,
    website VARCHAR(1000),
    headquarters VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_name)
);

-- 2. EXACT mapping for Fundings_and_investments.json
CREATE TABLE IF NOT EXISTS public.vendor_fundings_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER,
    month VARCHAR(20),
    company_name VARCHAR(500),
    country VARCHAR(100),
    amount_millions_usd DECIMAL(10,2),
    funding_round VARCHAR(100),
    lead_investor VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EXACT mapping for Print_services_Pricing_data.json
CREATE TABLE IF NOT EXISTS public.vendor_print_service_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(500),
    material_type VARCHAR(100),
    material VARCHAR(200),
    process VARCHAR(100),
    quantity INTEGER,
    manufacturing_cost DECIMAL(10,2),
    day_ordered INTEGER,
    delivery_date INTEGER,
    lead_time INTEGER,
    country VARCHAR(100),
    scattered_plot_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EXACT mapping for AM_market_revenue_2024.json
CREATE TABLE IF NOT EXISTS public.vendor_am_market_revenue_2024 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    revenue_usd BIGINT,
    country VARCHAR(100),
    segment VARCHAR(100),
    filter_info_1 VARCHAR(200),
    filter_info_2 VARCHAR(200),
    filter_info_3 VARCHAR(200),
    filter_info_4 VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. EXACT mapping for M_A.json
CREATE TABLE IF NOT EXISTS public.vendor_mergers_acquisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_date VARCHAR(20),
    acquired_company VARCHAR(500),
    acquiring_company VARCHAR(500),
    deal_size_millions DECIMAL(12,2),
    country VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. EXACT mapping for Company_roles.json
CREATE TABLE IF NOT EXISTS public.vendor_company_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(500),
    category VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_name, category)
);