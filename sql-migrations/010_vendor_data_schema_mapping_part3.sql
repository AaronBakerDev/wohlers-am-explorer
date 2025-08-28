-- Part 3: Create indexes and enable RLS (run this third)

-- Indexes for performance
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