'use server';

import { supabaseAdmin } from '@/config/supabaseAdmin';
import { ensureAdmin } from '@/lib/auth';

/** Gera uma senha temporária aleatória de 8 caracteres alfanuméricos */
function generateTempPassword(): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
	let result = '';
	for (let i = 0; i < 8; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

// ───────────────────── Accounts ─────────────────────

export interface AccountRow {
	id: string;
	company_name: string;
	status: string;
	max_instances: number;
	created_at: string;
	owner_id: string | null;
}

/** Lista todas as contas (empresas) cadastradas */
export async function listAccountsAction(): Promise<AccountRow[]> {
	await ensureAdmin();

	const { data, error } = await supabaseAdmin
		.from('accounts')
		.select('id, company_name, status, max_instances, created_at, owner_id')
		.order('created_at', { ascending: false });

	if (error) throw new Error(error.message);
	return data || [];
}

/** Cria uma nova conta com o usuário titular pendente */
export async function createAccountAction(email: string, maxInstances: number = 1) {
	await ensureAdmin();

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
			if (authError.message.toLowerCase().includes('already been registered')) {
				const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers();
				const existingAuthUser = allUsers.find(u => u.email === email);

				if (existingAuthUser) {
					// Verifica se tem profile e conta
					const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('id', existingAuthUser.id).maybeSingle();
					const { data: links } = await supabaseAdmin.from('account_users').select('id').eq('user_id', existingAuthUser.id).limit(1);

					if (!profile && (!links || links.length === 0)) {
						// Órfão: Deleta e tenta denovo
						await supabaseAdmin.auth.admin.deleteUser(existingAuthUser.id);
						return createAccountAction(email, maxInstances);
					}
					throw new Error('Este email já está vinculado a uma conta existente.');
				}
			}
			throw new Error(authError.message);
		}

		userId = authData.user.id;

		// 2. Criar perfil na tabela profiles
		const { error: profileError } = await supabaseAdmin
			.from('profiles')
			.upsert({
				id: userId,
				email,
				full_name: '',
				is_super_admin: false,
			});

		if (profileError) throw profileError;

		// 3. Criar a Conta pendente
		const { data: account, error: accountError } = await supabaseAdmin
			.from('accounts')
			.insert({
				company_name: 'Pendente: ' + email,
				status: 'PENDING',
				max_instances: maxInstances,
				owner_id: userId,
			})
			.select('id')
			.single();

		if (accountError) throw accountError;

		// 4. Vincular o usuário como ADMIN da conta
		const { error: linkError } = await supabaseAdmin
			.from('account_users')
			.insert({
				account_id: account.id,
				user_id: userId,
				role: 'ADMIN',
			});

		if (linkError) throw linkError;

		return { email, tempPassword, accountId: account.id };
	} catch (err: unknown) {
		// Rollback Auth user se falhou
		if (userId) {
			await supabaseAdmin.auth.admin.deleteUser(userId);
		}
		const message = err instanceof Error ? err.message : 'Erro desconhecido ao criar conta';
		throw new Error(message);
	}
}

/** Atualiza a conta (ex: limite de instâncias ou nome) */
export async function updateAccountAction(accountId: string, data: { company_name?: string; max_instances?: number; status?: string }) {
	await ensureAdmin();

	const { error } = await supabaseAdmin
		.from('accounts')
		.update(data)
		.eq('id', accountId);

	if (error) throw new Error(error.message);
}

/** Deleta uma conta (A exclusão em cascata cuidará do banco, mas precisamos limpar o Auth) */
export async function deleteAccountAction(accountId: string) {
	await ensureAdmin();

	// 1. Buscar os IDs dos usuários vinculados a esta conta
	const { data: users, error: usersError } = await supabaseAdmin
		.from('account_users')
		.select('user_id')
		.eq('account_id', accountId);

	if (usersError) throw new Error(usersError.message);

	// 2. Deletar a conta (o cascade limpa as tabelas)
	const { error: deleteError } = await supabaseAdmin
		.from('accounts')
		.delete()
		.eq('id', accountId);

	if (deleteError) throw new Error(deleteError.message);

	// 3. Deletar os usuários do Auth (opcional, mas recomendado para isolamento total)
	if (users && users.length > 0) {
		for (const u of users) {
			await supabaseAdmin.auth.admin.deleteUser(u.user_id);
		}
	}
}

// ───────────────────── Account Users (Admins) ─────────────────────

export interface AccountUserRow {
	id: string;
	full_name: string | null;
	email: string;
	role: string;
}

/** Lista os admins vinculados a uma conta */
export async function listAccountAdminsAction(accountId: string): Promise<AccountUserRow[]> {
	await ensureAdmin();

	const { data, error } = await supabaseAdmin
		.from('account_users')
		.select(`
			id,
			role,
			profiles ( id, full_name, email )
		`)
		.eq('account_id', accountId)
		.eq('role', 'ADMIN');

	if (error) throw new Error(error.message);

	return (data || []).map((au: any) => ({
		id: au.profiles?.id as string, // Id do usuário para deleção no auth
		link_id: au.id, // Id da relação
		full_name: au.profiles?.full_name || null,
		email: au.profiles?.email || '',
		role: au.role,
	}));
}

/** Deleta um ADMIN de uma conta */
export async function deleteAccountAdminAction(userId: string, accountId: string) {
	await ensureAdmin();

	// Remover o vínculo
	const { error: linkError } = await supabaseAdmin
		.from('account_users')
		.delete()
		.eq('user_id', userId)
		.eq('account_id', accountId);

	if (linkError) throw new Error(linkError.message);

	// Opcionalmente deletar o usuário do Auth também
	await supabaseAdmin.auth.admin.deleteUser(userId);
}
