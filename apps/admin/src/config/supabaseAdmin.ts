import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

/** Cliente Supabase com service role — uso exclusivo em Server Actions/API. */
export function getSupabaseAdmin(): SupabaseClient {
	if (adminClient) return adminClient;

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !supabaseServiceRoleKey) {
		throw new Error(
			'SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL ausentes. Configure apps/admin/.env.local.',
		);
	}

	adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});

	return adminClient;
}

/** @deprecated Use getSupabaseAdmin() — mantido para imports existentes. */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
	get(_target, prop) {
		const client = getSupabaseAdmin();
		const value = Reflect.get(client, prop, client);
		return typeof value === 'function'
			? (value as (...args: unknown[]) => unknown).bind(client)
			: value;
	},
});
