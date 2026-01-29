-- Allow Anon (public) access to write to products table
-- WARNING: This allows anyone with the AnON "Parser".key to modify the products table.
-- Since this is a dashboard, ensure you have other protections or revert this later.

CREATE POLICY "AnON "Parser".Insert" ON "Parser".products FOR INSERT WITH CHECK (true);
CREATE POLICY "AnON "Parser".Update" ON "Parser".products FOR UPDATE "Parser".USING (true);
CREATE POLICY "AnON "Parser".Delete" ON "Parser".products FOR DELETE USING (true);
