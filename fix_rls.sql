-- Allow Anon (public) access to write to products table
-- WARNING: This allows anyone with the Anon key to modify the products table.
-- Since this is a dashboard, ensure you have other protections or revert this later.

CREATE POLICY "Anon Insert" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon Update" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Anon Delete" ON public.products FOR DELETE USING (true);
