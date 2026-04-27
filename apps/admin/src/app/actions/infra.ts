'use server';

import { supabaseAdmin } from '@/config/supabaseAdmin';

/**
 * Apaga todos os dados do banco de dados exceto o usuário super-admin.
 * Operação perigosa e irreversível.
 */
export async function deleteDatabaseAction(adminUserId: string) {
	if (!adminUserId) throw new Error('Admin user ID é obrigatório.');

	// Verificar se o usuário é realmente super admin
	const { data: user, error: userError } = await supabaseAdmin
		.from('users')
		.select('is_super_admin')
		.eq('id', adminUserId)
		.single();

	if (userError || !user?.is_super_admin) {
		throw new Error('Acesso negado. Operação restrita a Super-Admin.');
	}

	// 1. Buscar todos os usuários diretamente do Supabase Auth
	const { data: { users: allAuthUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
	
	if (listError) throw new Error(listError.message);

	// 2. Deletar cada auth user via admin API (exceto o admin atual)
	for (const authUser of allAuthUsers || []) {
		if (authUser.id !== adminUserId) {
			await supabaseAdmin.auth.admin.deleteUser(authUser.id);
		}
	}

	// 3. Limpar tabelas de negócio (a ordem importa por causa das FKs)
	const tablesToClear = [
		'tool_loans',
		'site_movements',
		'site_tools',
		'site_epis',
		'site_inventory',
		'rented_equipments',
		'site_collaborators',
		'collaborators',
		'instance_users',
		'company_users',
		'construction_sites',
		'catalogs',
		'categories',
		'measurement_units',
		'access_profiles',
		'companies',
	];

	for (const table of tablesToClear) {
		const { error } = await supabaseAdmin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
		if (error) {
			console.warn(`Aviso ao limpar tabela ${table}:`, error.message);
		}
	}

	// 4. Limpar dados do próprio admin user (exceto id e is_super_admin)
	await supabaseAdmin
		.from('users')
		.delete()
		.neq('id', adminUserId);

	return { success: true, message: 'Banco de dados limpo com sucesso.' };
}
