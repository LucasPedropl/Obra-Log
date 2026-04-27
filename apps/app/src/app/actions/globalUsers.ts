'use server';

import { supabaseAdmin } from '@/config/supabaseAdmin';
import { cookies } from 'next/headers';

export interface SaveUserResponse {
	success: boolean;
	userId?: string;
	tempPassword?: string | null;
	error?: string;
}

export async function saveGlobalUserAction(
	data: {
		id?: string;
		email: string;
		fullName: string;
		isCompanyAdmin: boolean;
		assignments: Array<{ instanceId: string; profileId: string }>;
	}
): Promise<SaveUserResponse> {
	try {
		const cookieStore = await cookies();
		const companyId = cookieStore.get('selectedCompanyId')?.value;
		if (!companyId) return { success: false, error: 'Empresa não selecionada' };

		let userId = data.id;
		let generatedPassword: string | null = null;

		// 1. Create or Update Auth User
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
					// Detectar órfão
					if (authError.message.toLowerCase().includes('already been registered')) {
						const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers();
						const existingAuthUser = allUsers.find(u => u.email === data.email);

						if (existingAuthUser) {
							const { data: profile } = await supabaseAdmin.from('users').select('id').eq('id', existingAuthUser.id).maybeSingle();
							const { data: links } = await supabaseAdmin.from('company_users').select('id').eq('user_id', existingAuthUser.id).limit(1);

							if (!profile && (!links || links.length === 0)) {
								await supabaseAdmin.auth.admin.deleteUser(existingAuthUser.id);
								return saveGlobalUserAction(data); // Tentar novamente
							}
						}
					}
					throw new Error(authError.message);
				}

				userId = authUser.user.id;

				// Garante a tabela publica de usuários
				const { error: profileError } = await supabaseAdmin.from('users').upsert({
					id: userId,
					email: data.email,
					full_name: data.fullName,
					is_super_admin: false,
					require_password_change: true,
					temp_password: tempPassword,
				});

				if (profileError) {
					// Rollback Auth user on profile failure
					await supabaseAdmin.auth.admin.deleteUser(userId);
					throw profileError;
				}
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Erro ao criar usuário no Auth';
				throw new Error(message);
			}
		} else {
			// Atualizando apenas o que for permitido localmente
			await supabaseAdmin
				.from('users')
				.update({
					full_name: data.fullName,
				})
				.eq('id', userId);
		}

		// 2. Garantir vínculo com a Empresa (Tenant) e definir se é Admin Global da Empresa
		if (userId) {
			await supabaseAdmin
				.from('company_users')
				.upsert({
					company_id: companyId,
					user_id: userId,
					is_company_admin: data.isCompanyAdmin,
					status: 'ACTIVE',
				}, { onConflict: 'user_id,company_id' }); // Supondo que a constraint exista ou atualiza
		}

		// 3. Clean existing instance assignments para esta empresa
		if (userId) {
			// Precisamos deletar apenas os acessos das instâncias desta empresa
			const { data: companyInstances } = await supabaseAdmin
				.from('construction_sites')
				.select('id')
				.eq('company_id', companyId);
			
			const instanceIds = companyInstances?.map(i => i.id) || [];
			
			if (instanceIds.length > 0) {
				await supabaseAdmin
					.from('instance_users')
					.delete()
					.eq('user_id', userId)
					.in('instance_id', instanceIds);
			}
		}

		// 4. Add new instance assignments se NÃO for Admin
		if (!data.isCompanyAdmin && data.assignments.length > 0 && userId) {
			const dbAssignments = data.assignments.map((a) => ({
				user_id: userId,
				instance_id: a.instanceId,
				profile_id: a.profileId,
				status: 'ACTIVE',
			}));
			const { error: assignError } = await supabaseAdmin
				.from('instance_users')
				.insert(dbAssignments);
			if (assignError) throw new Error(assignError.message);
		}

		return { success: true, userId, tempPassword: generatedPassword };
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
		console.error('Error saving global user:', error);
		return {
			success: false,
			error: message,
		};
	}
}

interface RawInstanceUserData {
	user_id: string;
	instance_id: string;
	profile_id: string;
	construction_sites: {
		company_id: string;
		name: string;
	} | null;
	access_profiles: {
		name: string;
	} | null;
}

export async function getGlobalUsersAction() {
	try {
		const cookieStore = await cookies();
		const companyId = cookieStore.get('selectedCompanyId')?.value;
		
		if (!companyId) {
			return { success: false, error: 'Empresa não selecionada' };
		}

		// Busca os company_users desta empresa com os dados do usuário e seus acessos de instância
		const { data: companyUsers, error } = await supabaseAdmin
			.from('company_users')
			.select(`
				id,
				is_company_admin,
				users ( id, email, full_name, is_super_admin ),
				user_id
			`)
			.eq('company_id', companyId);

		if (error) throw error;

		// Busca instâncias e perfis para montar a resposta
		const userIds = companyUsers?.map(cu => cu.user_id) || [];
		
		let instanceUsersData: RawInstanceUserData[] = [];
		if (userIds.length > 0) {
			const { data: iuData } = await supabaseAdmin
				.from('instance_users')
				.select(`
					user_id,
					instance_id,
					profile_id,
					construction_sites!inner(company_id, name),
					access_profiles(name)
				`)
				.in('user_id', userIds)
				.eq('construction_sites.company_id', companyId);
			instanceUsersData = (iuData as unknown as RawInstanceUserData[]) || [];
		}

		// Mapear tudo para um formato limpo para a UI
		const formattedUsers = (companyUsers || []).map(cu => {
			const user: any = Array.isArray(cu.users) ? cu.users[0] : cu.users;
			const assignments = instanceUsersData.filter(iu => iu.user_id === cu.user_id).map(iu => ({
				instanceId: iu.instance_id,
				instanceName: iu.construction_sites?.name || 'Obra',
				profileId: iu.profile_id,
				profileName: iu.access_profiles?.name || 'Sem Perfil'
			}));

			return {
				id: user?.id,
				email: user?.email,
				full_name: user?.full_name,
				is_super_admin: user?.is_super_admin,
				is_company_admin: cu.is_company_admin,
				assignments: assignments
			};
		}).sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

		return { success: true, users: formattedUsers };
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Erro ao buscar usuários';
		console.error('Error fetching global users:', error);
		return { success: false, error: message };
	}
}

export async function getInstancesAction() {
	const cookieStore = await cookies();
	const companyId = cookieStore.get('selectedCompanyId')?.value;
	if (!companyId) return { success: false, error: 'Empresa não selecionada' };

	const { data, error } = await supabaseAdmin
		.from('construction_sites')
		.select('id, name')
		.eq('company_id', companyId)
		.order('name', { ascending: true });
		
	if (error) throw error;
	return { success: true, instances: data };
}

export async function getAllProfilesAction() {
	const cookieStore = await cookies();
	const companyId = cookieStore.get('selectedCompanyId')?.value;
	if (!companyId) return { success: false, error: 'Empresa não selecionada' };

	const { data, error } = await supabaseAdmin
		.from('access_profiles')
		.select('id, name')
		.eq('company_id', companyId)
		.order('name', { ascending: true });
		
	if (error) throw error;
	return { success: true, profiles: data };
}
