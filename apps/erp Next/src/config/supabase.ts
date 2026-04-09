import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error(
			'As variáveis de ambiente do Supabase estão ausentes. Verifique o seu .env.local.',
		);
	}

	return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
