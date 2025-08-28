-- Part 5: Create remaining RLS policies and comments (run this fifth and final)

-- Policies for vendor_revenue_by_industry_2024
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

-- Policies for vendor_total_am_market_size
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

-- Policies for vendor_directory
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

-- Policies for vendor_am_systems_manufacturers
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

-- Policies for vendor_print_services_global
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