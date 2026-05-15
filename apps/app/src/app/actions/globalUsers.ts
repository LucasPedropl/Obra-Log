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
 * Salva um usuário vinculado à empresa atual.
 */
export async function saveGlobalUserAction(
	data: {
		id?: string;
		email: string;
		fullName: string;
		isCompanyAdmin: boolean;
		profileId?: string | null;
	}
): Promise<SaveUserResponse> {
	const supabase = await createServerSupabaseClient();
	try {
		const cookieStore = await cookies();
		const companyId = cookieStore.get('selectedCompanyId')?.value;
		if (!companyId) return { success: false, error: 'Empresa não selecionada' };

		let userId = data.id;
		let generatedPassword: string | null = null;

		// 1. Criar ou Atualizar Usuário no Auth e Profile
		if (!userId) {
			const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
			generatedPassword = tempPassword;
			
			const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
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
				// Lógica para recuperar usuário se ele já existe no Auth mas não no Profile (usuário órfão)
				if (authError.message.toLowerCase().includes('already been registered')) {
					const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
					const existing = users.find(u => u.email === data.email);
					if (existing) {
						userId = existing.id;
					} else {
						throw authError;
					}
				} else {
					throw authError;
				}
			} else {
				userId = authUser.user.id;
			}

			// Upsert Profile
			const { error: profileError } = await supabase.from('profiles').upsert({
				id: userId,
				email: data.email,
				full_name: data.fullName,
			});

			if (profileError) throw profileError;
		} else {
			// Atualizar apenas o nome se já existe
			await supabase.from('profiles').update({ full_name: data.fullName }).eq('id', userId);
		}

		// 2. Gerenciar Vínculo com a Empresa (company_users)
		const { error: linkError } = await supabaseAdmin
			.from('company_users')
			.upsert({
				company_id: companyId,
				user_id: userId,
				role: data.isCompanyAdmin ? 'ADMIN' : 'USER',
				profile_id: data.isCompanyAdmin ? null : (data.profileId || null),
			}, { onConflict: 'company_id,user_id' });

		if (linkError) throw linkError;

		return { success: true, userId, tempPassword: generatedPassword };
	} catch (error: any) {
		console.error('Error saving user:', error);
		return { success: false, error: error.message || 'Erro ao salvar usuário' };
	}
}

/**
 * Lista todos os usuários da empresa selecionada.
 */
export async function getGlobalUsersAction() {
	const supabase = await createServerSupabaseClient();
	try {
		const cookieStore = await cookies();
		const companyId = cookieStore.get('selectedCompanyId')?.value;
		if (!companyId) return { success: false, error: 'Empresa não selecionada' };

		const { data, error } = await supabaseAdmin
			.from('company_users')
			.select(`
				user_id,
				role,
				profile_id,
				profiles(id, email, full_name)
			`)
			.eq('company_id', companyId);

		if (error) throw error;

		// Buscar nomes dos perfis separadamente
		const profileIds = (data || []).map(item => item.profile_id).filter(Boolean) as string[];
		const profilesMap: Record<string, string> = {};

		if (profileIds.length > 0) {
			const { data: profilesData } = await supabaseAdmin
				.from('access_profiles')
				.select('id, name')
				.in('id', profileIds);
			
			profilesData?.forEach(p => {
				profilesMap[p.id] = p.name;
			});
		}

		const users = (data || []).map((item: any) => ({
			id: item.profiles?.id,
			email: item.profiles?.email,
			full_name: item.profiles?.full_name,
			is_company_admin: item.role === 'ADMIN',
			profile_name: item.role === 'ADMIN' ? 'Administrador' : (profilesMap[item.profile_id] || 'Sem Perfil'),
			// Mantendo compatibilidade com a tipagem anterior se necessário
			assignments: item.role === 'ADMIN' ? [] : [{
				profileId: item.profile_id,
				profileName: profilesMap[item.profile_id] || 'Sem Perfil'
			}]
		}));

		return { success: true, users };
	} catch (error: any) {
		console.error('Error fetching users:', error);
		return { success: false, error: error.message };
	}
}

/**
 * Lista os perfis de acesso da empresa.
 */
export async function getAllProfilesAction() {
	const supabase = await createServerSupabaseClient();
	try {
		const cookieStore = await cookies();
		const companyId = cookieStore.get('selectedCompanyId')?.value;
		if (!companyId) return { success: false, error: 'Empresa não selecionada' };

		const { data, error } = await supabase
			.from('access_profiles')
			.select('id, name')
			.eq('company_id', companyId)
			.order('name');

		if (error) throw error;
		return { success: true, profiles: data || [] };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}
