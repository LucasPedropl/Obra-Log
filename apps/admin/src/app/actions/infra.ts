'use server';

import { supabaseAdmin } from '@/config/supabaseAdmin';
import { ensureAdmin } from '@/lib/auth';

/**
 * Apaga todos os dados do banco de dados exceto o usuário super-admin atual.
 * Operação perigosa e irreversível.
 */
export async function deleteDatabaseAction() {
	const adminUser = await ensureAdmin();
	const adminUserId = adminUser.id;

	// 1. Buscar todos os usuários diretamente do Supabase Auth
	const { data: { users: allAuthUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
	
	if (listError) throw new Error(listError.message);

	// 2. Deletar cada auth user via admin API (exceto o admin atual)
	for (const authUser of allAuthUsers || []) {
		if (authUser.id !== adminUserId) {
			await supabaseAdmin.auth.admin.deleteUser(authUser.id);
		}
	}

	// 3. Limpar tabelas locais usando Supabase Admin (delete all)
	// A ordem deve respeitar as foreign keys: deletar dependentes primeiro
	const tablesToClear = [
		'inventory_movements',
		'epi_withdrawals',
		'tool_loans',
		'site_inventory',
		'rented_equipments',
		'site_collaborators',
		'construction_sites',
		'collaborators',
		'catalogs',
		'measurement_units',
		'categories',
		'access_profiles',
		'company_users',
		'companies',
		'user_instance_access', // Legado
		'instances',           // Legado
		'account_users',       // Legado
		'accounts',            // Legado
	];

	for (const table of tablesToClear) {
		const { error } = await supabaseAdmin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
		if (error) {
			console.warn(`Aviso ao limpar tabela ${table}:`, error.message);
		}
	}

	// 4. Limpar dados de profiles exceto o do admin
	await supabaseAdmin
		.from('profiles')
		.delete()
		.neq('id', adminUserId);

	return { success: true, message: 'Banco de dados limpo com sucesso.' };
}
