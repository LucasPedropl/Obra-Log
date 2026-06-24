'use server';

import { z } from 'zod';
import { createServerSupabaseClient } from '@/config/supabaseServer';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import {
	getAuthenticatedUserId,
	getValidatedCompanyId,
} from './_helpers';

const updateProfileSchema = z.object({
	fullName: z.string().min(1, 'Nome é obrigatório'),
});

const updateCompanySchema = z.object({
	name: z.string().min(1, 'Nome da empresa é obrigatório'),
	cnpj: z.string().optional(),
});

type ActionResult<T = undefined> =
	| { success: true; data?: T }
	| { success: false; error: string };

/** Loads profile and active company data for the settings page. */
export async function getSettingsDataAction(): Promise<
	ActionResult<{
		profile: {
			id: string;
			full_name: string;
			email: string;
			avatar_url: string;
		};
		company: { id: string; name: string; cnpj: string };
	}>
> {
	try {
		const userId = await getAuthenticatedUserId();
		const supabase = await createServerSupabaseClient();

		const { data: dbProfile, error: profileError } = await supabase
			.from('profiles')
			.select('id, full_name, email, avatar_url')
			.eq('id', userId)
			.single();

		if (profileError) throw new Error(profileError.message);

		let company = { id: '', name: '', cnpj: '' };

		try {
			const companyId = await getValidatedCompanyId(userId);
			const { data: dbCompany } = await supabaseAdmin
				.from('companies')
				.select('id, name, cnpj')
				.eq('id', companyId)
				.maybeSingle();

			if (dbCompany) {
				company = {
					id: dbCompany.id,
					name: dbCompany.name ?? '',
					cnpj: dbCompany.cnpj ?? '',
				};
			}
		} catch {
			// Company cookie may be unset — profile tab still works
		}

		return {
			success: true,
			data: {
				profile: {
					id: dbProfile.id,
					full_name: dbProfile.full_name ?? '',
					email: dbProfile.email ?? '',
					avatar_url: dbProfile.avatar_url ?? '',
				},
				company,
			},
		};
	} catch (error: unknown) {
		console.error('getSettingsDataAction:', error);
		const message =
			error instanceof Error
				? error.message
				: 'Erro ao carregar configurações';
		return { success: false, error: message };
	}
}

/** Updates the authenticated user's profile name. */
export async function updateProfileSettingsAction(
	input: z.infer<typeof updateProfileSchema>,
): Promise<ActionResult> {
	try {
		const data = updateProfileSchema.parse(input);
		const userId = await getAuthenticatedUserId();

		const { error } = await supabaseAdmin
			.from('profiles')
			.update({ full_name: data.fullName })
			.eq('id', userId);

		if (error) throw new Error(error.message);

		return { success: true };
	} catch (error: unknown) {
		console.error('updateProfileSettingsAction:', error);
		const message =
			error instanceof z.ZodError
				? error.issues[0]?.message ?? 'Dados inválidos'
				: error instanceof Error
					? error.message
					: 'Erro ao salvar perfil';
		return { success: false, error: message };
	}
}

/** Updates company data — requires ADMIN role on the active company. */
export async function updateCompanySettingsAction(
	input: z.infer<typeof updateCompanySchema>,
): Promise<ActionResult> {
	try {
		const data = updateCompanySchema.parse(input);
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId);

		const { data: member } = await supabaseAdmin
			.from('company_users')
			.select('role')
			.eq('user_id', userId)
			.eq('company_id', companyId)
			.maybeSingle();

		if (!member || member.role !== 'ADMIN') {
			throw new Error('Sem permissão para alterar dados da empresa');
		}

		const { error } = await supabaseAdmin
			.from('companies')
			.update({ name: data.name, cnpj: data.cnpj || null })
			.eq('id', companyId);

		if (error) throw new Error(error.message);

		return { success: true };
	} catch (error: unknown) {
		console.error('updateCompanySettingsAction:', error);
		const message =
			error instanceof z.ZodError
				? error.issues[0]?.message ?? 'Dados inválidos'
				: error instanceof Error
					? error.message
					: 'Erro ao salvar empresa';
		return { success: false, error: message };
	}
}
