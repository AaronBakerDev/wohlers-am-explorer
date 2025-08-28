-- Part 4: Create RLS policies (run this fourth)

-- Policies for vendor_company_information
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

-- Policies for vendor_fundings_investments
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

-- Policies for vendor_print_service_pricing
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

-- Policies for vendor_am_market_revenue_2024
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

-- Policies for vendor_mergers_acquisitions
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

-- Policies for vendor_company_roles
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