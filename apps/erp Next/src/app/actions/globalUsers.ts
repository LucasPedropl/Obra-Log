'use server';

import { supabaseAdmin } from '@/config/supabaseAdmin';
import { cookies } from 'next/headers';

export async function saveGlobalUserAction(data: {
	id?: string;
	email: string;
	fullName: string;
	isSuperAdmin: boolean;
	assignments: Array<{ companyId: string; profileId: string | null }>;
}) {
	try {
		let userId = data.id;

		// 1. Create or Update Auth User
		if (!userId) {
			const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
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
				// Possavelmente o e-mail já existe
				throw new Error(authError.message);
			}

			userId = authUser.user.id;

			// Garante a tabela publica de usuários
			await supabaseAdmin.from('users').upsert({
				id: userId,
				email: data.email,
				full_name: data.fullName,
				is_super_admin: data.isSuperAdmin,
			});
		} else {
			// Atualizando apenas o que for permitido localmente
			await supabaseAdmin
				.from('users')
				.update({
					full_name: data.fullName,
					is_super_admin: data.isSuperAdmin,
				})
				.eq('id', userId);
		}

		// 2. Clean existing assignments
		if (userId) {
			await supabaseAdmin
				.from('company_users')
				.delete()
				.eq('user_id', userId);
		}

		// 3. Add new assignments if not Super Admin
		if (!data.isSuperAdmin && data.assignments.length > 0 && userId) {
			const dbAssignments = data.assignments.map((a) => ({
				company_id: a.companyId,
				user_id: userId,
				profile_id: a.profileId,
				status: 'ACTIVE',
			}));
			const { error: assignError } = await supabaseAdmin
				.from('company_users')
				.insert(dbAssignments);
			if (assignError) throw new Error(assignError.message);
		}

		return { success: true, userId };
	} catch (error: any) {
		console.error('Error saving global user:', error);
		return {
			success: false,
			error: error.message || 'Ocorreu um erro desconhecido.',
		};
	}
}

export async function getGlobalUsersAction() {
	try {
		const cookieStore = await cookies();
		const companyId = cookieStore.get('selectedCompanyId')?.value;
		
		if (!companyId) {
			return { success: false, error: 'Empresa não selecionada' };
		}

		const { data: users, error } = await supabaseAdmin
			.from('users')
			.select(
				`
				id,
				email,
				full_name,
				is_super_admin,
				company_users!inner (
					company_id,
					profile_id,
					companies ( name ),
					access_profiles ( name )
				)
			`,
			)
			.eq('company_users.company_id', companyId)
			.order('full_name', { ascending: true });

		if (error) throw error;
		return { success: true, users };
	} catch (error: any) {
		console.error('Error fetching global users:', error);
		return { success: false, error: error.message };
	}
}
export async function getAllCompaniesAction() {
	const cookieStore = await cookies();
	const companyId = cookieStore.get('selectedCompanyId')?.value;

	if (!companyId) return { success: false, companies: [] };

	const { data, error } = await supabaseAdmin
		.from('companies')
		.select('id, name')
		.eq('id', companyId);
		
	if (error) throw error;
	return { success: true, companies: data };
}
export async function getAllProfilesAction() {
	const cookieStore = await cookies();
	const companyId = cookieStore.get('selectedCompanyId')?.value;

	if (!companyId) return { success: false, profiles: [] };

	const { data, error } = await supabaseAdmin
		.from('access_profiles')
		.select('id, name, company_id')
		.eq('company_id', companyId);
		
	if (error) throw error;
	return { success: true, profiles: data };
}
