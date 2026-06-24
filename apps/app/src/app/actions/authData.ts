'use server';

import { z } from 'zod';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { safeLogError } from '@/lib/safeLog';
import {
	getAuthenticatedUserId,
	getValidatedCompanyId,
} from './_helpers';

const companyIdSchema = z.string().uuid('ID da empresa inválido');

const activateCompanySchema = z.object({
	companyId: z.string().uuid(),
	name: z.string().min(1, 'Nome da empresa é obrigatório'),
	cnpj: z.string(),
});

const upgradePlanSchema = z.object({
	companyId: z.string().uuid(),
	newPlanName: z.string().min(1),
	newMaxSites: z.number().int().min(1),
});

const createCompanySchema = z.object({
	planName: z.string().min(1),
	maxSites: z.number().int().min(1),
});

const setupProfileSchema = z.object({
	fullName: z.string().min(1, 'Nome completo é obrigatório'),
	newPassword: z.string().min(6).optional(),
});

type ActionResult<T = undefined> =
	| { success: true } & (T extends undefined ? object : { [K in keyof T]: T[K] })
	| { success: false; error: string };

function zodMessage(error: unknown): string {
	if (error instanceof z.ZodError) {
		return error.issues[0]?.message ?? 'Dados inválidos';
	}
	return error instanceof Error ? error.message : 'Erro desconhecido';
}

/**
 * Retorna as Empresas (Companies) vinculadas ao usuário autenticado.
 */
export async function getUserCompaniesAction() {
	try {
		const userId = await getAuthenticatedUserId();

		const { data: userLinks, error: linkError } = await supabaseAdmin
			.from('company_users')
			.select('company_id, role, profile_id')
			.eq('user_id', userId);

		if (linkError) throw new Error(linkError.message);
		if (!userLinks || userLinks.length === 0) {
			return { success: true, companies: [] };
		}

		const profileIds = userLinks
			.map((l) => l.profile_id)
			.filter((id): id is string => Boolean(id));
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

		const companyIds = userLinks.map((link) => link.company_id);

		const { data: companiesData, error: compError } = await supabaseAdmin
			.from('companies')
			.select('id, name, status, cnpj')
			.in('id', companyIds);

		if (compError) throw new Error(compError.message);

		const companyUserCounts = await Promise.all(
			companyIds.map(async (id) => {
				const { count } = await supabaseAdmin
					.from('company_users')
					.select('*', { count: 'exact', head: true })
					.eq('company_id', id);
				return { id, count: count || 0 };
			}),
		);

		const companySiteCounts = await Promise.all(
			companyIds.map(async (id) => {
				const { count } = await supabaseAdmin
					.from('construction_sites')
					.select('*', { count: 'exact', head: true })
					.eq('company_id', id);
				return { id, count: count || 0 };
			}),
		);

		const usersCountMap = Object.fromEntries(
			companyUserCounts.map((c) => [c.id, c.count]),
		);
		const sitesCountMap = Object.fromEntries(
			companySiteCounts.map((c) => [c.id, c.count]),
		);

		const finalCompanies = companiesData.map((company) => {
			const link = userLinks.find((l) => l.company_id === company.id);
			const role = link?.role || 'USER';
			const profileName = link?.profile_id
				? profilesMap[link.profile_id]
				: null;

			return {
				id: company.id,
				name: company.name,
				status: company.status,
				cnpj: company.cnpj,
				role,
				profile_name: profileName,
				users_count: usersCountMap[company.id] || 0,
				active_sites_count: sitesCountMap[company.id] || 0,
			};
		});

		return { success: true, companies: finalCompanies };
	} catch (error: unknown) {
		safeLogError('getUserCompaniesAction', error);
		return { success: false, error: zodMessage(error) };
	}
}

/**
 * Ativa uma empresa PENDING preenchendo o nome e cnpj (opcional)
 */
export async function activateCompanyAction(
	companyId: string,
	name: string,
	cnpj: string,
): Promise<ActionResult> {
	try {
		const data = activateCompanySchema.parse({ companyId, name, cnpj });
		const userId = await getAuthenticatedUserId();

		const { data: member } = await supabaseAdmin
			.from('company_users')
			.select('role')
			.eq('user_id', userId)
			.eq('company_id', data.companyId)
			.maybeSingle();

		if (!member || member.role !== 'ADMIN') {
			throw new Error('Sem permissão para ativar esta empresa');
		}

		const { error } = await supabaseAdmin
			.from('companies')
			.update({
				name: data.name,
				cnpj: data.cnpj || null,
				status: 'ACTIVE',
			})
			.eq('id', data.companyId);

		if (error) throw new Error(error.message);

		return { success: true };
	} catch (error: unknown) {
		safeLogError('activateCompanyAction', error);
		return { success: false, error: zodMessage(error) };
	}
}

export async function getCompanyPlanDetailsAction(companyId: string) {
	try {
		const parsedCompanyId = companyIdSchema.parse(companyId);
		await getValidatedCompanyId(undefined, parsedCompanyId);

		const { data: company, error } = await supabaseAdmin
			.from('companies')
			.select('id, current_plan, max_sites')
			.eq('id', parsedCompanyId)
			.single();

		if (error) {
			return { success: true, plan: 'Starter', maxSites: 2 };
		}

		return {
			success: true,
			plan: company.current_plan || 'Starter',
			maxSites: company.max_sites || 2,
		};
	} catch (error: unknown) {
		safeLogError('getCompanyPlanDetailsAction', error);
		return { success: false, error: 'Erro ao buscar plano da empresa.' };
	}
}

export async function upgradeCompanyPlanAction(
	companyId: string,
	newPlanName: string,
	newMaxSites: number,
): Promise<ActionResult> {
	try {
		const data = upgradePlanSchema.parse({
			companyId,
			newPlanName,
			newMaxSites,
		});
		const userId = await getAuthenticatedUserId();

		const { data: member } = await supabaseAdmin
			.from('company_users')
			.select('role')
			.eq('user_id', userId)
			.eq('company_id', data.companyId)
			.maybeSingle();

		if (!member || member.role !== 'ADMIN') {
			throw new Error('Sem permissão para alterar o plano');
		}

		const { error } = await supabaseAdmin
			.from('companies')
			.update({
				current_plan: data.newPlanName,
				max_sites: data.newMaxSites,
			})
			.eq('id', data.companyId);

		if (error) throw new Error(error.message);
		return { success: true };
	} catch (error: unknown) {
		safeLogError('upgradeCompanyPlanAction', error);
		return { success: false, error: 'Erro ao atualizar plano da empresa.' };
	}
}

export async function createCompanySelfServiceAction(
	planName: string,
	maxSites: number,
): Promise<ActionResult<{ companyId: string }>> {
	try {
		const data = createCompanySchema.parse({ planName, maxSites });
		const userId = await getAuthenticatedUserId();

		const { data: company, error: companyError } = await supabaseAdmin
			.from('companies')
			.insert({
				name: 'Pendente: Nova Empresa',
				status: 'PENDING',
				current_plan: data.planName,
				max_sites: data.maxSites,
			})
			.select('id')
			.single();

		if (companyError) {
			const { data: companyRetry, error: retryError } = await supabaseAdmin
				.from('companies')
				.insert({
					name: 'Pendente: Nova Empresa',
					status: 'PENDING',
				})
				.select('id')
				.single();

			if (retryError) throw new Error(retryError.message);

			await supabaseAdmin.from('company_users').insert({
				company_id: companyRetry.id,
				user_id: userId,
				role: 'ADMIN',
			});

			return { success: true, companyId: companyRetry.id };
		}

		const { error: linkError } = await supabaseAdmin
			.from('company_users')
			.insert({
				company_id: company.id,
				user_id: userId,
				role: 'ADMIN',
			});

		if (linkError) throw new Error(linkError.message);

		return { success: true, companyId: company.id };
	} catch (error: unknown) {
		safeLogError('createCompanySelfServiceAction', error);
		return { success: false, error: zodMessage(error) };
	}
}

export async function setupInitialProfileAction(
	fullName: string,
	newPassword?: string,
): Promise<ActionResult> {
	try {
		const data = setupProfileSchema.parse({ fullName, newPassword });
		const userId = await getAuthenticatedUserId();

		const updatePayload: {
			user_metadata: Record<string, unknown>;
			password?: string;
		} = {
			user_metadata: {
				full_name: data.fullName,
				require_password_change: false,
			},
		};

		if (data.newPassword) {
			updatePayload.password = data.newPassword;
		}

		const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
			userId,
			updatePayload,
		);
		if (authError) throw new Error(`Erro Auth: ${authError.message}`);

		const { error: profileError } = await supabaseAdmin
			.from('profiles')
			.update({ full_name: data.fullName })
			.eq('id', userId);

		if (profileError) {
			safeLogError('setupInitialProfileAction:profiles', profileError);
		}

		return { success: true };
	} catch (error: unknown) {
		safeLogError('setupInitialProfileAction', error);
		return { success: false, error: zodMessage(error) };
	}
}
