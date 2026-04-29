import { createServerSupabaseClient } from '@/config/supabaseServer';

/**
 * Verifica se o usuário atual está logado e se é um Super Admin.
 * Deve ser usado no início de todas as Server Actions do admin.
 */
export async function ensureAdmin() {
	const supabase = await createServerSupabaseClient();
	const { data: { user } } = await supabase.auth.getUser();

	if (!user) {
		throw new Error('Não autenticado. Por favor, faça login.');
	}

	const { data: profile, error } = await supabase
		.from('profiles')
		.select('is_super_admin')
		.eq('id', user.id)
		.maybeSingle();

	if (error || !profile?.is_super_admin) {
		throw new Error('Acesso negado. Esta operação é restrita a Super-Admins.');
	}

	return user;
}
