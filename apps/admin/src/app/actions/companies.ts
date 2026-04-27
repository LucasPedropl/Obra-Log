'use server';

import { supabaseAdmin } from '@/config/supabaseAdmin';

/** Gera uma senha temporária aleatória de 8 caracteres alfanuméricos */
function generateTempPassword(): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
	let result = '';
	for (let i = 0; i < 8; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

// ───────────────────── Companies ─────────────────────

export interface CompanyRow {
	id: string;
	name: string;
	active: boolean;
	max_instances: number;
	created_at: string;
}

/** Lista todas as empresas cadastradas */
export async function listCompaniesAction(): Promise<CompanyRow[]> {
	const { data, error } = await supabaseAdmin
		.from('companies')
		.select('id, name, active, max_instances, created_at')
		.order('created_at', { ascending: false });

	if (error) throw new Error(error.message);
	return data || [];
}

/** Cria uma nova empresa */
export async function createCompanyAction(name: string, maxInstances: number = 1) {
	const { data, error } = await supabaseAdmin
		.from('companies')
		.insert({ name, max_instances: maxInstances, active: true })
		.select('id')
		.single();

	if (error) throw new Error(error.message);
	return data;
}

/** Atualiza o nome de uma empresa */
export async function updateCompanyAction(companyId: string, name: string) {
	const { error } = await supabaseAdmin
		.from('companies')
		.update({ name })
		.eq('id', companyId);

	if (error) throw new Error(error.message);
}

/** Deleta uma empresa e limpa os usuários vinculados do Supabase Auth */
export async function deleteCompanyAction(companyId: string) {
	// 1. Buscar os IDs dos usuários vinculados a esta empresa
	const { data: users, error: usersError } = await supabaseAdmin
		.from('company_users')
		.select('user_id')
		.eq('company_id', companyId);

	if (usersError) throw new Error(usersError.message);

	// 2. Deletar a empresa (o cascade no banco limpa as tabelas public)
	const { error: deleteError } = await supabaseAdmin
		.from('companies')
		.delete()
		.eq('id', companyId);

	if (deleteError) throw new Error(deleteError.message);

	// 3. Deletar os usuários do Supabase Auth
	// Nota: Fazemos isso DEPOIS de deletar a empresa para garantir que o vínculo público sumiu
	if (users && users.length > 0) {
		for (const u of users) {
			// Só deletamos se o usuário não pertencer a outras empresas (opcional, mas por segurança agora deletamos todos)
			await supabaseAdmin.auth.admin.deleteUser(u.user_id);
		}
	}
}

// ───────────────────── Company Users ─────────────────────

export interface CompanyUserRow {
	id: string;
	full_name: string | null;
	email: string;
	require_password_change: boolean;
	temp_password: string | null;
}

/** Lista os usuários vinculados a uma empresa */
export async function listCompanyUsersAction(companyId: string): Promise<CompanyUserRow[]> {
	const { data, error } = await supabaseAdmin
		.from('company_users')
		.select(`
			id,
			users ( id, full_name, email )
		`)
		.eq('company_id', companyId);

	if (error) throw new Error(error.message);

	// Buscar temp_password e require_password_change da tabela users
	const userIds = (data || []).map((cu: Record<string, unknown>) => {
		const users = cu.users as Record<string, unknown> | null;
		return users?.id as string;
	}).filter(Boolean);

	if (userIds.length === 0) return [];

	const { data: usersData } = await supabaseAdmin
		.from('users')
		.select('id, full_name, email, temp_password, require_password_change')
		.in('id', userIds);

	const usersMap = new Map(
		(usersData || []).map((u: Record<string, unknown>) => [u.id as string, u])
	);

	return (data || []).map((cu: Record<string, unknown>) => {
		const users = cu.users as Record<string, unknown> | null;
		const userId = users?.id as string;
		const fullUser = usersMap.get(userId) as Record<string, unknown> | undefined;
		return {
			id: cu.id as string,
			full_name: (fullUser?.full_name as string | null) || null,
			email: (fullUser?.email as string) || '',
			require_password_change: (fullUser?.require_password_change as boolean) || false,
			temp_password: (fullUser?.temp_password as string | null) || null,
		};
	});
}

/** Cria um novo admin para a empresa (cria o auth user + perfil + vínculo) */
export async function createCompanyAdminAction(companyId: string, email: string) {
	const tempPassword = generateTempPassword();
	let userId: string | null = null;

	try {
		// 1. Criar usuário no Auth
		const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
			email,
			password: tempPassword,
			email_confirm: true,
			user_metadata: {
				require_password_change: true,
				temp_password: tempPassword,
			},
		});

		if (authError) {
			// Se o e-mail já existe, verificamos se é um usuário órfão (sem perfil ou sem vínculos)
			if (authError.message.toLowerCase().includes('already been registered')) {
				const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers();
				const existingAuthUser = allUsers.find(u => u.email === email);

				if (existingAuthUser) {
					// Verificar se ele tem perfil em public.users ou vínculos em company_users
					const { data: profile } = await supabaseAdmin.from('users').select('id').eq('id', existingAuthUser.id).maybeSingle();
					const { data: links } = await supabaseAdmin.from('company_users').select('id').eq('user_id', existingAuthUser.id).limit(1);

					if (!profile && (!links || links.length === 0)) {
						// É um órfão! Removemos para tentar novamente de forma limpa
						await supabaseAdmin.auth.admin.deleteUser(existingAuthUser.id);
						// Tentamos criar novamente após a limpeza
						return createCompanyAdminAction(companyId, email);
					}
				}
			}
			throw new Error(authError.message);
		}

		userId = authData.user.id;

		// 2. Criar perfil na tabela users
		const { error: profileError } = await supabaseAdmin
			.from('users')
			.upsert({
				id: userId,
				email,
				full_name: '',
				temp_password: tempPassword,
				require_password_change: true,
			});

		if (profileError) throw profileError;

		// 3. Vincular à empresa via company_users
		const { error: linkError } = await supabaseAdmin
			.from('company_users')
			.insert({
				company_id: companyId,
				user_id: userId,
				is_company_admin: true,
				status: 'ACTIVE',
			});

		if (linkError) throw linkError;

		return { email, tempPassword };
	} catch (err: unknown) {
		// Rollback: Se criamos no Auth mas algo falhou depois, removemos para não deixar órfão
		if (userId) {
			await supabaseAdmin.auth.admin.deleteUser(userId);
		}
		const message = err instanceof Error ? err.message : 'Erro desconhecido ao criar administrador';
		throw new Error(message);
	}
}
