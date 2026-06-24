'use server';

import { z } from 'zod';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import {
	assertCompanyResourcePermission,
	getAuthenticatedUserId,
	getValidatedCompanyId,
} from './_helpers';

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
	scope: z.enum(['ALL_SITES', 'SPECIFIC_SITES']),
	allowed_sites: z.array(z.string().uuid()).optional().default([]),
});

const updateAccessProfileSchema = z.object({
	name: z.string().min(1).optional(),
	permissions: permissionsSchema.optional(),
	scope: z.enum(['ALL_SITES', 'SPECIFIC_SITES']).optional(),
	allowed_sites: z.array(z.string().uuid()).optional(),
});

type ActionResult<T = undefined> =
	| { success: true; data?: T }
	| { success: false; error: string };

function parseAllowedSites(profile: Record<string, unknown>): string[] {
	const fromColumn = profile.allowed_sites;
	if (Array.isArray(fromColumn)) {
		return fromColumn.filter((id): id is string => typeof id === 'string');
	}

	const permissions = profile.permissions as
		| Record<string, unknown>
		| null
		| undefined;
	const fromPermissions = permissions?._allowed_sites;
	if (Array.isArray(fromPermissions)) {
		return fromPermissions.filter((id): id is string => typeof id === 'string');
	}

	return [];
}

function isAllowedSitesColumnError(error: { message?: string; code?: string }) {
	return (
		error.code === '42703' ||
		(error.message?.toLowerCase().includes('allowed_sites') ?? false)
	);
}

function embedAllowedSitesInPermissions(
	permissions: Record<string, unknown> | undefined,
	allowedSites: string[],
): Record<string, unknown> {
	const base = { ...(permissions ?? {}) };
	if (allowedSites.length > 0) {
		base._allowed_sites = allowedSites;
	} else {
		delete base._allowed_sites;
	}
	return base;
}

function mapProfileRow(profile: Record<string, unknown>) {
	const permissions = (profile.permissions || {}) as Record<string, unknown>;
	const { _allowed_sites: _ignored, ...cleanPermissions } = permissions;

	return {
		...profile,
		permissions: cleanPermissions,
		scope:
			profile.obra_scope === 'ALL' ? 'ALL_SITES' : 'SPECIFIC_SITES',
		allowed_sites: parseAllowedSites(profile),
	};
}

function resolveAllowedSitesForScope(
	scope: 'ALL_SITES' | 'SPECIFIC_SITES',
	allowedSites?: string[],
): string[] {
	if (scope === 'ALL_SITES') return [];
	return allowedSites ?? [];
}

/** Creates an access profile for the validated company. */
export async function createAccessProfileAction(
	input: z.infer<typeof createAccessProfileSchema>,
): Promise<ActionResult<ReturnType<typeof mapProfileRow>>> {
	try {
		const data = createAccessProfileSchema.parse(input);
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId, data.company_id);

		await assertCompanyResourcePermission(userId, companyId, 'perfis', 'create');

		const allowedSites = resolveAllowedSitesForScope(
			data.scope,
			data.allowed_sites,
		);
		const obraScope = data.scope === 'ALL_SITES' ? 'ALL' : 'SELECTED';

		let profile: Record<string, unknown> | null = null;
		let insertError: { message?: string; code?: string } | null = null;

		const primaryInsert = await supabaseAdmin
			.from('access_profiles')
			.insert({
				company_id: companyId,
				name: data.name,
				permissions: data.permissions || {},
				obra_scope: obraScope,
				allowed_sites: allowedSites,
			})
			.select()
			.single();

		profile = primaryInsert.data;
		insertError = primaryInsert.error;

		if (insertError && isAllowedSitesColumnError(insertError)) {
			const fallbackInsert = await supabaseAdmin
				.from('access_profiles')
				.insert({
					company_id: companyId,
					name: data.name,
					permissions: embedAllowedSitesInPermissions(
						data.permissions,
						allowedSites,
					),
					obra_scope: obraScope,
				})
				.select()
				.single();

			profile = fallbackInsert.data;
			insertError = fallbackInsert.error;
		}

		if (insertError) throw new Error(insertError.message);
		if (!profile) throw new Error('Erro ao criar perfil');

		return { success: true, data: mapProfileRow(profile) };
	} catch (error: unknown) {
		console.error('createAccessProfileAction:', error);
		const message =
			error instanceof z.ZodError
				? error.issues[0]?.message ?? 'Dados inválidos'
				: error instanceof Error
					? error.message
					: 'Erro ao criar perfil';
		return { success: false, error: message };
	}
}

/** Updates an existing access profile. */
export async function updateAccessProfileAction(
	id: string,
	input: z.infer<typeof updateAccessProfileSchema>,
): Promise<ActionResult<ReturnType<typeof mapProfileRow>>> {
	try {
		const data = updateAccessProfileSchema.parse(input);
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId);

		await assertCompanyResourcePermission(userId, companyId, 'perfis', 'edit');

		const { data: existing } = await supabaseAdmin
			.from('access_profiles')
			.select('company_id, permissions, obra_scope')
			.eq('id', id)
			.maybeSingle();

		if (!existing || existing.company_id !== companyId) {
			throw new Error('Perfil não encontrado');
		}

		const updateData: Record<string, unknown> = {};
		if (data.name) updateData.name = data.name;
		if (data.permissions) updateData.permissions = data.permissions;

		const resolvedScope =
			data.scope ??
			(data.allowed_sites !== undefined
				? existing.obra_scope === 'ALL'
					? 'ALL_SITES'
					: 'SPECIFIC_SITES'
				: undefined);

		if (resolvedScope) {
			updateData.obra_scope =
				resolvedScope === 'ALL_SITES' ? 'ALL' : 'SELECTED';
		}

		const allowedSites =
			resolvedScope !== undefined
				? resolveAllowedSitesForScope(
						resolvedScope,
						data.allowed_sites,
					)
				: data.allowed_sites;

		if (allowedSites !== undefined) {
			updateData.allowed_sites = allowedSites;
		}

		let profile: Record<string, unknown> | null = null;
		let updateError: { message?: string; code?: string } | null = null;

		const primaryUpdate = await supabaseAdmin
			.from('access_profiles')
			.update(updateData)
			.eq('id', id)
			.select()
			.single();

		profile = primaryUpdate.data;
		updateError = primaryUpdate.error;

		if (updateError && isAllowedSitesColumnError(updateError)) {
			const fallbackData = { ...updateData };
			delete fallbackData.allowed_sites;

			if (allowedSites !== undefined) {
				const currentPermissions =
					(data.permissions as Record<string, unknown> | undefined) ??
					((existing.permissions || {}) as Record<string, unknown>);
				fallbackData.permissions = embedAllowedSitesInPermissions(
					currentPermissions,
					allowedSites,
				);
			}

			const fallbackUpdate = await supabaseAdmin
				.from('access_profiles')
				.update(fallbackData)
				.eq('id', id)
				.select()
				.single();

			profile = fallbackUpdate.data;
			updateError = fallbackUpdate.error;
		}

		if (updateError) throw new Error(updateError.message);
		if (!profile) throw new Error('Erro ao atualizar perfil');

		return { success: true, data: mapProfileRow(profile) };
	} catch (error: unknown) {
		console.error('updateAccessProfileAction:', error);
		const message =
			error instanceof z.ZodError
				? error.issues[0]?.message ?? 'Dados inválidos'
				: error instanceof Error
					? error.message
					: 'Erro ao atualizar perfil';
		return { success: false, error: message };
	}
}

/** Deletes an access profile. */
export async function deleteAccessProfileAction(
	id: string,
): Promise<ActionResult> {
	try {
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId);

		await assertCompanyResourcePermission(userId, companyId, 'perfis', 'delete');

		const { data: existing } = await supabaseAdmin
			.from('access_profiles')
			.select('company_id')
			.eq('id', id)
			.maybeSingle();

		if (!existing || existing.company_id !== companyId) {
			throw new Error('Perfil não encontrado');
		}

		const { error } = await supabaseAdmin
			.from('access_profiles')
			.delete()
			.eq('id', id);

		if (error) throw new Error(error.message);

		return { success: true };
	} catch (error: unknown) {
		console.error('deleteAccessProfileAction:', error);
		const message =
			error instanceof Error ? error.message : 'Erro ao excluir perfil';
		return { success: false, error: message };
	}
}
