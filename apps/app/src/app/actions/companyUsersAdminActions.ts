'use server';

import { z } from 'zod';
import { createServerSupabaseClient } from '@/config/supabaseServer';
import { safeLogError } from '@/lib/safeLog';
import {
	assertCompanyResourcePermission,
	getAuthenticatedUserId,
	getValidatedCompanyId,
} from './_helpers';

const companyIdSchema = z.string().uuid('ID da empresa inválido');

const permissionsSchema = z.record(
	z.string(),
	z.object({
		view: z.boolean(),
		create: z.boolean(),
		edit: z.boolean(),
		delete: z.boolean(),
	}),
);

const createAccessProfileSchema = z.object({
	company_id: z.string().uuid(),
	name: z.string().min(1, 'Nome é obrigatório'),
	permissions: permissionsSchema.optional(),
});

interface RawCompanyUser {
	id: string;
	status: string;
	role: string;
	profile_id: string | null;
	profiles: {
		full_name: string | null;
		email: string;
		last_login: string | null;
	} | null;
}

function formatZodError(error: unknown): never {
	if (error instanceof z.ZodError) {
		throw new Error(error.issues[0]?.message ?? 'Dados inválidos');
	}
	throw error;
}

export async function getAccessProfilesAdmin(company_id: string) {
	try {
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId, companyIdSchema.parse(company_id));
		await assertCompanyResourcePermission(userId, companyId, 'perfis', 'view');

		const supabase = await createServerSupabaseClient();
		const { data, error } = await supabase
			.from('access_profiles')
			.select('*')
			.eq('company_id', companyId)
			.order('name', { ascending: true });
		if (error) throw error;
		return data;
	} catch (error: unknown) {
		safeLogError('getAccessProfilesAdmin', error);
		formatZodError(error);
	}
}

export async function createAccessProfileAdmin(
	data: z.infer<typeof createAccessProfileSchema>,
) {
	try {
		const payload = createAccessProfileSchema.parse(data);
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId, payload.company_id);
		await assertCompanyResourcePermission(userId, companyId, 'perfis', 'create');

		const supabase = await createServerSupabaseClient();
		const { data: result, error } = await supabase
			.from('access_profiles')
			.insert([{ ...payload, company_id: companyId }])
			.select()
			.single();

		if (error) throw error;
		return result;
	} catch (error: unknown) {
		safeLogError('createAccessProfileAdmin', error);
		formatZodError(error);
	}
}

/** Busca usuários da empresa (sem auto-criar perfil Administrador). */
export async function ensureAdminProfileAndFetchUsers(companyId: string) {
	try {
		const parsedCompanyId = companyIdSchema.parse(companyId);
		const userId = await getAuthenticatedUserId();
		const validatedCompanyId = await getValidatedCompanyId(userId, parsedCompanyId);
		await assertCompanyResourcePermission(userId, validatedCompanyId, 'usuarios', 'view');

		const supabase = await createServerSupabaseClient();

		const { data: companyUsers, error } = await supabase
			.from('company_users')
			.select(
				`
				id,
                status,
                role,
                profile_id,
                profiles(full_name, email, last_login)
			`,
			)
			.eq('company_id', validatedCompanyId);

		if (error) throw error;

		const profileIds = (companyUsers || [])
			.map((cu) => cu.profile_id)
			.filter((id): id is string => Boolean(id));
		const profilesMap: Record<string, string> = {};

		if (profileIds.length > 0) {
			const { data: profilesData } = await supabase
				.from('access_profiles')
				.select('id, name')
				.in('id', profileIds);

			profilesData?.forEach((p) => {
				profilesMap[p.id] = p.name;
			});
		}

		return (companyUsers as unknown as RawCompanyUser[]).map((cu) => ({
			id: cu.id,
			status: cu.status,
			role: cu.role,
			full_name: cu.profiles?.full_name || '',
			email: cu.profiles?.email || '',
			last_login: cu.profiles?.last_login || null,
			profile_name:
				cu.role === 'ADMIN'
					? 'Administrador da Empresa'
					: (cu.profile_id ? profilesMap[cu.profile_id] : undefined) || 'Sem Perfil',
		}));
	} catch (error: unknown) {
		safeLogError('ensureAdminProfileAndFetchUsers', error);
		return [];
	}
}
