import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
	throw new Error('Supabase env vars ausentes para o cliente admin.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});
