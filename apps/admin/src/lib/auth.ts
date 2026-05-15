import { createServerSupabaseClient } from '@/config/supabaseServer';
import { supabaseAdmin } from '@/config/supabaseAdmin';

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

	// Usamos o supabaseAdmin (Service Role) para evitar erros de RLS (recursão infinita)
	// na tabela de profiles enquanto as políticas não são corrigidas no banco.
	const { data: profile, error } = await supabaseAdmin
		.from('profiles')
		.select('is_super_admin')
		.eq('id', user.id)
		.maybeSingle();

	if (error || !profile?.is_super_admin) {
		console.error('ERRO ensureAdmin:', error?.message || 'Não é Super Admin');
		throw new Error('Acesso negado. Esta operação é restrita a Super-Admins.');
	}

	return user;
}
