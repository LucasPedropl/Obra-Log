'use server';

import { z } from 'zod';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { createServerSupabaseClient } from '@/config/supabaseServer';
import { safeLogError } from '@/lib/safeLog';
import {
	assertCompanyResourcePermission,
	getAuthenticatedUserId,
	getValidatedCompanyId,
} from './_helpers';

const saveUserSchema = z.object({
	id: z.string().uuid().optional(),
	email: z.string().email(),
	fullName: z.string().min(1),
	isCompanyAdmin: z.boolean().optional(),
	profileId: z.string().uuid(),
	siteIds: z.array(z.string().uuid()).optional(),
});

export interface SaveUserResponse {
	success: boolean;
	userId?: string;
	tempPassword?: string | null;
	isNewUser?: boolean;
	error?: string;
}

async function resolveUserIdByEmail(email: string): Promise<string | null> {
	const { data: listData, error: listError } =
		await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });

	if (listError) throw listError;
	const found = listData.users.find(
		(u) => u.email?.toLowerCase() === email.toLowerCase(),
	);
	return found?.id ?? null;
}

async function callerCanPromoteAdmin(
	callerId: string,
	companyId: string,
): Promise<boolean> {
	const { data: member } = await supabaseAdmin
		.from('company_users')
		.select('role')
		.eq('user_id', callerId)
		.eq('company_id', companyId)
		.maybeSingle();

	return member?.role === 'ADMIN';
}

async function countActiveAdmins(companyId: string): Promise<number> {
	const { count } = await supabaseAdmin
		.from('company_users')
		.select('id', { count: 'exact', head: true })
		.eq('company_id', companyId)
		.eq('role', 'ADMIN')
		.eq('status', 'ACTIVE');

	return count ?? 0;
}

/** Lists construction sites for the validated company. */
export async function getCompanySitesAction() {
	try {
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId);
		await assertCompanyResourcePermission(userId, companyId, 'usuarios', 'view');

		const { data, error } = await supabaseAdmin
			.from('construction_sites')
			.select('id, name')
			.eq('company_id', companyId)
			.eq('status', 'ACTIVE')
			.order('name');

		if (error) throw error;
		return { success: true as const, sites: data ?? [] };
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Erro desconhecido';
		return { success: false as const, error: message };
	}
}

/** Saves a user linked to the current company. */
export async function saveGlobalUserAction(
	input: z.infer<typeof saveUserSchema>,
): Promise<SaveUserResponse> {
	const supabase = await createServerSupabaseClient();
	try {
		const data = saveUserSchema.parse(input);
		const authUserId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(authUserId);

		await assertCompanyResourcePermission(
			authUserId,
			companyId,
			'usuarios',
			data.id ? 'edit' : 'create',
		);

		const wantsAdmin = data.isCompanyAdmin === true;
		const canPromote = wantsAdmin
			? await callerCanPromoteAdmin(authUserId, companyId)
			: false;
		const assignAdminRole = wantsAdmin && canPromote;

		let userId = data.id;
		let generatedPassword: string | null = null;
		let isNewUser = false;

		if (!userId) {
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
					},
				});

			if (authError) {
				if (
					authError.message.toLowerCase().includes('already been registered')
				) {
					generatedPassword = null;
					isNewUser = false;
					const existingId = await resolveUserIdByEmail(data.email);
					if (!existingId) throw authError;
					userId = existingId;
				} else {
					throw authError;
				}
			} else {
				userId = authUser.user.id;
				isNewUser = true;
			}

			const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
				id: userId,
				email: data.email,
				full_name: data.fullName,
			});
			if (profileError) throw profileError;
		} else {
			await supabaseAdmin
				.from('profiles')
				.update({ full_name: data.fullName })
				.eq('id', userId);
			isNewUser = false;
		}

		const { error: linkError } = await supabaseAdmin.from('company_users').upsert(
			{
				company_id: companyId,
				user_id: userId,
				role: assignAdminRole ? 'ADMIN' : 'USER',
				profile_id: data.profileId,
				status: 'ACTIVE',
			},
			{ onConflict: 'company_id,user_id' },
		);
		if (linkError) throw linkError;

		if (userId) {
			const { data: existingSites } = await supabase
				.from('construction_sites')
				.select('id')
				.eq('company_id', companyId);

			const siteIdsInCompany = (existingSites ?? []).map((s) => s.id);

			if (siteIdsInCompany.length > 0) {
				await supabase
					.from('user_site_access')
					.delete()
					.eq('user_id', userId)
					.in('site_id', siteIdsInCompany);
			}

			if (data.siteIds && data.siteIds.length > 0) {
				const accessToInsert = data.siteIds.map((siteId) => ({
					user_id: userId,
					site_id: siteId,
				}));
				const { error: accessError } = await supabase
					.from('user_site_access')
					.insert(accessToInsert);
				if (accessError) throw accessError;
			}
		}

		return { success: true, userId, tempPassword: generatedPassword, isNewUser };
	} catch (error: unknown) {
		safeLogError('saveGlobalUserAction', error);
		const message =
			error instanceof z.ZodError
				? (error.issues[0]?.message ?? 'Dados inválidos')
				: error instanceof Error
					? error.message
					: 'Erro ao salvar usuário';
		return { success: false, error: message };
	}
}

/** Lists all users for the validated company. */
export async function getGlobalUsersAction() {
	try {
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId);
		await assertCompanyResourcePermission(userId, companyId, 'usuarios', 'view');

		const { data, error } = await supabaseAdmin
			.from('company_users')
			.select(
				`
				id,
				user_id,
				role,
				profile_id,
				status,
				profiles(id, email, full_name)
			`,
			)
			.eq('company_id', companyId);

		if (error) throw error;

		const profileIds = (data ?? [])
			.map((item) => item.profile_id)
			.filter(Boolean) as string[];
		const profilesMap: Record<string, string> = {};

		if (profileIds.length > 0) {
			const { data: profilesData } = await supabaseAdmin
				.from('access_profiles')
				.select('id, name')
				.in('id', profileIds);

			profilesData?.forEach((p) => {
				profilesMap[p.id] = p.name;
			});
		}

		const users = (data ?? []).map((item) => {
			const profile = Array.isArray(item.profiles)
				? item.profiles[0]
				: item.profiles;
			return {
				id: profile?.id ?? item.user_id,
				company_user_id: item.id,
				email: profile?.email,
				full_name: profile?.full_name,
				profile_id: item.profile_id,
				is_company_admin: item.role === 'ADMIN',
				status: item.status ?? 'ACTIVE',
				profile_name:
					item.role === 'ADMIN'
						? 'Administrador'
						: profilesMap[item.profile_id ?? ''] || 'Sem Perfil',
				assignments:
					item.role === 'ADMIN'
						? []
						: [
								{
									profileId: item.profile_id,
									profileName:
										profilesMap[item.profile_id ?? ''] || 'Sem Perfil',
								},
							],
			};
		});

		return { success: true as const, users };
	} catch (error: unknown) {
		safeLogError('getGlobalUsersAction', error);
		const message = error instanceof Error ? error.message : 'Erro desconhecido';
		return { success: false as const, error: message };
	}
}

/** Lists access profiles for the validated company. */
export async function getAllProfilesAction() {
	try {
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId);
		await assertCompanyResourcePermission(userId, companyId, 'perfis', 'view');

		const { data, error } = await supabaseAdmin
			.from('access_profiles')
			.select('id, name')
			.eq('company_id', companyId)
			.order('name');

		if (error) throw error;
		return { success: true as const, profiles: data ?? [] };
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Erro desconhecido';
		return { success: false as const, error: message };
	}
}

const userIdSchema = z.string().uuid();

/** Returns site IDs linked to a user within the current company. */
export async function getUserSiteAccessAction(userId: string) {
	try {
		const callerId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(callerId);
		const targetUserId = userIdSchema.parse(userId);

		await assertCompanyResourcePermission(callerId, companyId, 'usuarios', 'view');

		const { data: membership } = await supabaseAdmin
			.from('company_users')
			.select('user_id')
			.eq('company_id', companyId)
			.eq('user_id', targetUserId)
			.maybeSingle();

		if (!membership) {
			return { success: false as const, error: 'Usuário não pertence a esta empresa' };
		}

		const { data: companySites } = await supabaseAdmin
			.from('construction_sites')
			.select('id')
			.eq('company_id', companyId);

		const siteIdsInCompany = (companySites ?? []).map((s) => s.id);
		if (siteIdsInCompany.length === 0) {
			return { success: true as const, siteIds: [] as string[] };
		}

		const { data, error } = await supabaseAdmin
			.from('user_site_access')
			.select('site_id')
			.eq('user_id', targetUserId)
			.in('site_id', siteIdsInCompany);

		if (error) throw error;
		return {
			success: true as const,
			siteIds: (data ?? []).map((row) => row.site_id),
		};
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Erro desconhecido';
		return { success: false as const, error: message };
	}
}

/** Toggles user active status within the current company. */
export async function toggleGlobalUserStatusAction(userId: string) {
	try {
		const callerId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(callerId);
		const targetUserId = userIdSchema.parse(userId);

		await assertCompanyResourcePermission(callerId, companyId, 'usuarios', 'delete');

		const { data: current, error: fetchError } = await supabaseAdmin
			.from('company_users')
			.select('status, role')
			.eq('company_id', companyId)
			.eq('user_id', targetUserId)
			.single();

		if (fetchError) throw fetchError;

		const nextStatus = current?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

		if (
			current?.role === 'ADMIN' &&
			current.status === 'ACTIVE' &&
			nextStatus === 'INACTIVE'
		) {
			const adminCount = await countActiveAdmins(companyId);
			if (adminCount <= 1) {
				return {
					success: false as const,
					error: 'Não é possível desativar o último administrador da empresa',
				};
			}
		}

		const { error } = await supabaseAdmin
			.from('company_users')
			.update({ status: nextStatus })
			.eq('company_id', companyId)
			.eq('user_id', targetUserId);

		if (error) throw error;
		return { success: true as const, status: nextStatus };
	} catch (error: unknown) {
		safeLogError('toggleGlobalUserStatusAction', error);
		const message = error instanceof Error ? error.message : 'Erro desconhecido';
		return { success: false as const, error: message };
	}
}
