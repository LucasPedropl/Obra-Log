'use server';

import { supabaseAdmin } from '@/config/supabaseAdmin';
import { ensureAdmin } from '@/lib/auth';

/** Gera uma senha temporária aleatória */
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
	status: string;
	cnpj: string | null;
	created_at: string;
}

/** Lista todas as empresas cadastradas */
export async function listCompaniesAction(): Promise<CompanyRow[]> {
	await ensureAdmin();

	const { data, error } = await supabaseAdmin
		.from('companies')
		.select('id, name, status, cnpj, created_at')
		.order('created_at', { ascending: false });

	if (error) throw new Error(error.message);
	return data || [];
}

/** Cria uma nova empresa com um usuário administrador titular */
export async function createCompanyAction(email: string) {
	await ensureAdmin();

	let userId: string | null = null;
	let isNewUser = false;

	try {
		let tempPassword: string | null = null;

		// 1. Verificar se o usuário já existe no profiles (ou Auth)
		const { data: existingProfile } = await supabaseAdmin
			.from('profiles')
			.select('id')
			.eq('email', email)
			.maybeSingle();

		if (existingProfile) {
			userId = existingProfile.id;
		} else {
			// Se não existe, cria no Auth
			tempPassword = generateTempPassword();
			const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
				email,
				password: tempPassword,
				email_confirm: true,
				user_metadata: {
					require_password_change: true,
					temp_password: tempPassword,
				},
			});

			if (authError) throw new Error(authError.message);
			userId = authData.user.id;
			isNewUser = true;

			// Criar perfil público apenas para novos usuários
			const { error: profileError } = await supabaseAdmin
				.from('profiles')
				.upsert({
					id: userId,
					email,
					full_name: '',
					is_super_admin: false,
				});

			if (profileError) throw profileError;
		}

		// 2. Criar a Empresa (PENDING até o primeiro acesso)
		const { data: company, error: companyError } = await supabaseAdmin
			.from('companies')
			.insert({
				name: 'Pendente: ' + email,
				status: 'PENDING',
			})
			.select('id')
			.single();

		if (companyError) throw companyError;

		// 3. Vincular o usuário como ADMIN da empresa
		const { error: linkError } = await supabaseAdmin
			.from('company_users')
			.insert({
				company_id: company.id,
				user_id: userId,
				role: 'ADMIN',
			});

		if (linkError) throw linkError;

		return { 
			email, 
			companyId: company.id,
			isNewUser,
			tempPassword // Retorna a senha gerada
		};
	} catch (err: any) {
		// Só deleta o usuário se ele foi criado NESTA tentativa e algo falhou depois
		if (userId && isNewUser) await supabaseAdmin.auth.admin.deleteUser(userId);
		throw new Error(err.message || 'Erro ao criar empresa');
	}
}

/** Atualiza dados da empresa */
export async function updateCompanyAction(companyId: string, data: { name?: string; status?: string; cnpj?: string }) {
	await ensureAdmin();

	const { error } = await supabaseAdmin
		.from('companies')
		.update(data)
		.eq('id', companyId);

	if (error) throw new Error(error.message);
}

/** Deleta uma empresa e seus usuários do Auth (apenas se não tiverem outros vínculos) */
export async function deleteCompanyAction(companyId: string) {
	await ensureAdmin();

	// 1. Buscar IDs dos usuários vinculados a ESTA empresa
	const { data: linkedUsers } = await supabaseAdmin
		.from('company_users')
		.select('user_id')
		.eq('company_id', companyId);

	// 2. Deletar empresa (Cascade no banco limpa a tabela company_users)
	const { error } = await supabaseAdmin
		.from('companies')
		.delete()
		.eq('id', companyId);

	if (error) throw new Error(error.message);

	// 3. Limpar usuários do Auth apenas se eles não estiverem em NENHUMA outra empresa
	if (linkedUsers && linkedUsers.length > 0) {
		for (const u of linkedUsers) {
			const { count } = await supabaseAdmin
				.from('company_users')
				.select('*', { count: 'exact', head: true })
				.eq('user_id', u.user_id);

			// Se o contador for 0, significa que ele não pertence a mais nenhuma empresa
			if (count === 0) {
				await supabaseAdmin.auth.admin.deleteUser(u.user_id).catch(() => {});
			}
		}
	}
}

// ───────────────────── Company Users ─────────────────────

export interface CompanyUserRow {
	id: string;
	full_name: string | null;
	email: string;
	role: string;
}

/** Lista administradores de uma empresa */
export async function listCompanyAdminsAction(companyId: string): Promise<CompanyUserRow[]> {
	await ensureAdmin();

	const { data, error } = await supabaseAdmin
		.from('company_users')
		.select(`
			user_id,
			role,
			profiles ( full_name, email )
		`)
		.eq('company_id', companyId)
		.eq('role', 'ADMIN');

	if (error) throw new Error(error.message);

	return (data || []).map((cu: any) => ({
		id: cu.user_id,
		full_name: cu.profiles?.full_name || null,
		email: cu.profiles?.email || '',
		role: cu.role,
	}));
}
