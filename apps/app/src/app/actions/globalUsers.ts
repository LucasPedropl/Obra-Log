'use server';

import { supabaseAdmin } from '@/config/supabaseAdmin';
import { createServerSupabaseClient } from '@/config/supabaseServer';
import { cookies } from 'next/headers';

export interface SaveUserResponse {
	success: boolean;
	userId?: string;
	tempPassword?: string | null;
	error?: string;
}

/**
 * Salva um usuário no nível da conta (Global Admin ou com acessos específicos).
 */
export async function saveGlobalUserAction(
	data: {
		id?: string;
		email: string;
		fullName: string;
		isCompanyAdmin: boolean;
		assignments: Array<{ instanceId: string; profileId: string }>;
	}
): Promise<SaveUserResponse> {
	const supabase = await createServerSupabaseClient();
	try {
		const cookieStore = await cookies();
		const accountId = cookieStore.get('parentCompanyId')?.value;
		if (!accountId) return { success: false, error: 'Conta não selecionada' };

		let userId = data.id;
		let generatedPassword: string | null = null;

		// 1. Criar ou Atualizar Usuário no Auth e Profile
		if (!userId) {
			try {
				const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
				generatedPassword = tempPassword;
				const { data: authUser, error: authError } =
					await supabaseAdmin.auth.admin.createUser({
						email: data.email,
						password: tempPassword,
						email_confirm: true,
						user_metadata: {
							require_password_change: true,
							full_name: data.fullName,
							temp_password: tempPassword,
						},
					});

				if (authError) {
					// Detectar se o usuário já existe no auth mas está órfão no DB
					if (authError.message.toLowerCase().includes('already been registered')) {
						const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers();
						const existingAuthUser = allUsers.find(u => u.email === data.email);

						if (existingAuthUser) {
							// Verifica se tem perfil ou vínculos
							const { data: profile } = await supabase.from('profiles').select('id').eq('id', existingAuthUser.id).maybeSingle();
							const { data: adminLinks } = await supabase.from('account_users').select('id').eq('user_id', existingAuthUser.id).limit(1);
							const { data: instanceLinks } = await supabase.from('user_instance_access').select('id').eq('user_id', existingAuthUser.id).limit(1);

							if (!profile && !adminLinks?.length && !instanceLinks?.length) {
								await supabaseAdmin.auth.admin.deleteUser(existingAuthUser.id);
								return saveGlobalUserAction(data); // Tentar novamente
							}
						}
					}
					throw new Error(authError.message);
				}

				userId = authUser.user.id;

				// Criar perfil público
				const { error: profileError } = await supabase.from('profiles').upsert({
					id: userId,
					email: data.email,
					full_name: data.fullName,
					is_super_admin: false,
				});

				if (profileError) {
					await supabaseAdmin.auth.admin.deleteUser(userId);
					throw profileError;
				}
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Erro ao criar usuário no Auth';
				throw new Error(message);
			}
		} else {
			// Atualizar perfil existente
			await supabase
				.from('profiles')
				.update({ full_name: data.fullName })
				.eq('id', userId);
		}

		// 2. Gerenciar Vínculo de Admin da Conta
		if (data.isCompanyAdmin) {
			await supabaseAdmin
				.from('account_users')
				.upsert({
					account_id: accountId,
					user_id: userId,
					role: 'ADMIN'
				}, { onConflict: 'account_id,user_id' });
			
			// Se é Admin da Conta, remove acessos granulares (já tem acesso a tudo)
			await supabaseAdmin
				.from('user_instance_access')
				.delete()
				.eq('user_id', userId)
				.in('instance_id', (
					await supabaseAdmin.from('instances').select('id').eq('account_id', accountId)
				).data?.map(i => i.id) || []);

		} else {
			// Remove vínculo de admin se existir
			await supabaseAdmin
				.from('account_users')
				.delete()
				.eq('account_id', accountId)
				.eq('user_id', userId);

			// 3. Atualizar Acessos de Instância
			// Limpa acessos atuais nesta conta
			const { data: accountInstances } = await supabaseAdmin
				.from('instances')
				.select('id')
				.eq('account_id', accountId);
			
			const instanceIds = accountInstances?.map(i => i.id) || [];
			
			if (instanceIds.length > 0) {
				await supabaseAdmin
					.from('user_instance_access')
					.delete()
					.eq('user_id', userId)
					.in('instance_id', instanceIds);
			}

			// Adiciona novos acessos
			if (data.assignments.length > 0) {
				const dbAssignments = data.assignments.map((a) => ({
					user_id: userId,
					instance_id: a.instanceId,
					profile_id: a.profileId,
				}));
				const { error: assignError } = await supabaseAdmin
					.from('user_instance_access')
					.insert(dbAssignments);
				if (assignError) throw new Error(assignError.message);
			}
		}

		return { success: true, userId, tempPassword: generatedPassword };
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
		console.error('Error saving global user:', error);
		return { success: false, error: message };
	}
}

export async function getGlobalUsersAction() {
	const supabase = await createServerSupabaseClient();
	try {
		const cookieStore = await cookies();
		const accountId = cookieStore.get('parentCompanyId')?.value;
		
		if (!accountId) return { success: false, error: 'Conta não selecionada' };

		// 1. Buscar Admins da Conta
		const { data: admins, error: adminErr } = await supabaseAdmin
			.from('account_users')
			.select('user_id, profiles(id, email, full_name)')
			.eq('account_id', accountId);

		if (adminErr) throw adminErr;

		// 2. Buscar Usuários com acesso a instâncias
		const { data: instanceAccess, error: accessErr } = await supabaseAdmin
			.from('user_instance_access')
			.select(`
				user_id,
				instance_id,
				profile_id,
				instances!inner(name, account_id),
				access_profiles(name),
				profiles(id, email, full_name)
			`)
			.eq('instances.account_id', accountId);

		if (accessErr) throw accessErr;

		// 3. Consolidar lista única de usuários
		const usersMap = new Map();

		// Adicionar admins
		admins?.forEach((a: any) => {
			const p = a.profiles;
			if (!p) return;
			usersMap.set(p.id, {
				id: p.id,
				email: p.email,
				full_name: p.full_name,
				is_company_admin: true,
				assignments: []
			});
		});

		// Adicionar usuários de instância
		instanceAccess?.forEach((ia: any) => {
			const p = ia.profiles;
			if (!p) return;
			
			if (!usersMap.has(p.id)) {
				usersMap.set(p.id, {
					id: p.id,
					email: p.email,
					full_name: p.full_name,
					is_company_admin: false,
					assignments: []
				});
			}

			const userData = usersMap.get(p.id);
			userData.assignments.push({
				instanceId: ia.instance_id,
				instanceName: ia.instances?.name,
				profileId: ia.profile_id,
				profileName: ia.access_profiles?.name
			});
		});

		const users = Array.from(usersMap.values()).sort((a, b) => 
			(a.full_name || '').localeCompare(b.full_name || '')
		);

		return { success: true, users };
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Erro ao buscar usuários';
		console.error('Error fetching global users:', error);
		return { success: false, error: message };
	}
}

export async function getInstancesAction() {
	const supabase = await createServerSupabaseClient();
	const cookieStore = await cookies();
	const accountId = cookieStore.get('parentCompanyId')?.value;
	if (!accountId) return { success: false, error: 'Conta não selecionada' };

	const { data, error } = await supabase
		.from('instances')
		.select('id, name')
		.eq('account_id', accountId)
		.order('name', { ascending: true });
		
	if (error) return { success: false, error: error.message };
	return { success: true, instances: data || [] };
}

export async function getAllProfilesAction() {
	const supabase = await createServerSupabaseClient();
	const cookieStore = await cookies();
	const accountId = cookieStore.get('parentCompanyId')?.value;
	if (!accountId) return { success: false, error: 'Conta não selecionada' };

	const { data, error } = await supabase
		.from('access_profiles')
		.select('id, name')
		.eq('account_id', accountId)
		.order('name', { ascending: true });
		
	if (error) return { success: false, error: error.message };
	return { success: true, profiles: data || [] };
}
