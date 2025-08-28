-- Part 2: Create remaining vendor tables (run this second)

-- 7. EXACT mapping for Revenue_by_industry_2024.json
CREATE TABLE IF NOT EXISTS public.vendor_revenue_by_industry_2024 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry VARCHAR(100),
    share_of_revenue_percent DECIMAL(5,2),
    revenue_usd BIGINT,
    region VARCHAR(100),
    material VARCHAR(100),
    filter_info_1 VARCHAR(200),
    filter_info_2 VARCHAR(200),
    filter_info_3 VARCHAR(200),
    filter_info_4 VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. EXACT mapping for Total_AM_market_size.json
CREATE TABLE IF NOT EXISTS public.vendor_total_am_market_size (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER,
    forecast_type VARCHAR(50),
    segment VARCHAR(100),
    revenue_usd BIGINT,
    filter_info_1 VARCHAR(200),
    filter_info_2 VARCHAR(200),
    filter_info_3 VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(year, forecast_type, segment)
);

-- 9. EXACT mapping for Directory.json
CREATE TABLE IF NOT EXISTS public.vendor_directory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    figure_name VARCHAR(500),
    sheet_name_and_link VARCHAR(500),
    v1 TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. EXACT mapping for COMPANY___AM_systems_mfrs.json
CREATE TABLE IF NOT EXISTS public.vendor_am_systems_manufacturers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(500),
    segment VARCHAR(200),
    material_type VARCHAR(100),
    material_format VARCHAR(100),
    country VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. EXACT mapping for COMPANY___Print_services_global.json
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