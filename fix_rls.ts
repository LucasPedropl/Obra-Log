import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function applyRLS() {
	const query = `
    DROP POLICY IF EXISTS "Tenant Isolation - construction_sites" ON public.construction_sites;
    CREATE POLICY "Tenant Isolation - construction_sites" ON public.construction_sites
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM public.company_users WHERE user_id = auth.uid()
        )
    );
  `;

	const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: query });
	console.log('Error executing via rpc:', error); // Probably doesn't exist
}

applyRLS();
