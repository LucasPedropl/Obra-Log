'use server';

import { z } from 'zod';
import { createServerSupabaseClient } from '@/config/supabaseServer';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { safeLogError } from '@/lib/safeLog';
import { constructionSiteSchema } from '@/features/obras/schemas/constructionSiteSchema';
import {
	assertCompanyResourcePermission,
	assertSiteAccess,
	getAuthenticatedUserId,
	getValidatedCompanyId,
} from './_helpers';

const companyIdSchema = z.string().uuid('ID da empresa inválido');
const siteIdSchema = z.string().uuid('ID da obra inválido');

const createSiteSchema = constructionSiteSchema.extend({
	company_id: z.string().uuid(),
});

const updateSiteSchema = createSiteSchema;

const inventoryItemSchema = z.object({
	catalogId: z.string().uuid(),
	quantity: z.number().min(0),
});

const addCollaboratorsSchema = z.object({
	siteId: z.string().uuid(),
	collaboratorIds: z.array(z.string().uuid()).min(1),
});

function formatZodError(error: unknown): never {
	if (error instanceof z.ZodError) {
		throw new Error(error.issues[0]?.message ?? 'Dados inválidos');
	}
	throw error;
}

export async function createConstructionSiteAdmin(
	data: z.infer<typeof createSiteSchema>,
) {
	try {
		const payload = createSiteSchema.parse(data);
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId, payload.company_id);

		await assertCompanyResourcePermission(userId, companyId, 'obras', 'create');

		const { data: result, error } = await supabaseAdmin
			.from('construction_sites')
			.insert([{ name: payload.name, company_id: companyId }])
			.select()
			.single();

		if (error) throw error;
		return result;
	} catch (error: unknown) {
		safeLogError('createConstructionSiteAdmin', error);
		formatZodError(error);
	}
}

export async function updateConstructionSiteAdmin(
	id: string,
	data: z.infer<typeof updateSiteSchema>,
) {
	try {
		const siteId = siteIdSchema.parse(id);
		const payload = updateSiteSchema.parse(data);
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId, payload.company_id);

		await assertCompanyResourcePermission(userId, companyId, 'obras', 'edit');

		const { data: result, error } = await supabaseAdmin
			.from('construction_sites')
			.update({ name: payload.name })
			.eq('id', siteId)
			.eq('company_id', companyId)
			.select()
			.single();

		if (error) throw error;
		return result;
	} catch (error: unknown) {
		safeLogError('updateConstructionSiteAdmin', error);
		formatZodError(error);
	}
}

export async function deleteConstructionSiteAdmin(
	id: string,
	company_id: string,
) {
	try {
		const siteId = siteIdSchema.parse(id);
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId, companyIdSchema.parse(company_id));

		await assertCompanyResourcePermission(userId, companyId, 'obras', 'delete');

		const { error } = await supabaseAdmin
			.from('construction_sites')
			.delete()
			.eq('id', siteId)
			.eq('company_id', companyId);

		if (error) throw error;
		return true;
	} catch (error: unknown) {
		safeLogError('deleteConstructionSiteAdmin', error);
		formatZodError(error);
	}
}

export async function getConstructionSitesAdmin(company_id: string) {
	try {
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId, companyIdSchema.parse(company_id));
		await assertCompanyResourcePermission(userId, companyId, 'obras', 'view');

		const supabase = await createServerSupabaseClient();
		const { data: sites, error } = await supabase
			.from('construction_sites')
			.select('*')
			.eq('company_id', companyId)
			.order('created_at', { ascending: false });

		if (error) throw error;
		if (!sites || sites.length === 0) return [];

		const siteIds = sites.map((s) => s.id);

		const [colabRows, invRows] = await Promise.all([
			supabaseAdmin
				.from('site_collaborators')
				.select('site_id')
				.in('site_id', siteIds),
			supabaseAdmin
				.from('site_inventory')
				.select('site_id')
				.in('site_id', siteIds),
		]);

		const colabCount = new Map<string, number>();
		const invCount = new Map<string, number>();

		for (const row of colabRows.data ?? []) {
			colabCount.set(row.site_id, (colabCount.get(row.site_id) ?? 0) + 1);
		}
		for (const row of invRows.data ?? []) {
			invCount.set(row.site_id, (invCount.get(row.site_id) ?? 0) + 1);
		}

		return sites.map((site) => ({
			...site,
			collaborators_count: colabCount.get(site.id) ?? 0,
			inventory_count: invCount.get(site.id) ?? 0,
		}));
	} catch (error: unknown) {
		safeLogError('getConstructionSitesAdmin', error);
		formatZodError(error);
	}
}

export async function getSiteCollaboratorsAdmin(siteId: string) {
	try {
		const parsedSiteId = siteIdSchema.parse(siteId);
		const userId = await getAuthenticatedUserId();
		await assertSiteAccess(userId, parsedSiteId);

		const supabase = await createServerSupabaseClient();
		const { data, error } = await supabase
			.from('site_collaborators')
			.select('id, collaborator_id, collaborators(name, role_title, cpf)')
			.eq('site_id', parsedSiteId);
		if (error) throw error;
		return data || [];
	} catch (error: unknown) {
		safeLogError('getSiteCollaboratorsAdmin', error);
		formatZodError(error);
	}
}

export async function addSiteCollaboratorsAdmin(
	siteId: string,
	collaboratorIds: string[],
) {
	try {
		if (!collaboratorIds.length) return true;

		const { siteId: parsedSiteId, collaboratorIds: parsedIds } =
			addCollaboratorsSchema.parse({ siteId, collaboratorIds });
		const userId = await getAuthenticatedUserId();
		await assertSiteAccess(userId, parsedSiteId);

		const payload = parsedIds.map((id) => ({
			site_id: parsedSiteId,
			collaborator_id: id,
		}));

		const supabase = await createServerSupabaseClient();
		const { error } = await supabase.from('site_collaborators').insert(payload);
		if (error) throw error;
		return true;
	} catch (error: unknown) {
		safeLogError('addSiteCollaboratorsAdmin', error);
		formatZodError(error);
	}
}

export async function getSiteInventoryAdmin(siteId: string) {
	try {
		const parsedSiteId = siteIdSchema.parse(siteId);
		const userId = await getAuthenticatedUserId();
		await assertSiteAccess(userId, parsedSiteId);

		const supabase = await createServerSupabaseClient();
		const { data, error } = await supabase
			.from('site_inventory')
			.select(
				'id, catalog_id, quantity, min_threshold, catalogs(name, code, categories(primary_category, secondary_category), measurement_units(abbreviation))',
			)
			.eq('site_id', parsedSiteId);
		if (error) throw error;
		return data || [];
	} catch (error: unknown) {
		safeLogError('getSiteInventoryAdmin', error);
		formatZodError(error);
	}
}

export async function addInventoryItemsAdmin(
	siteId: string,
	items: z.infer<typeof inventoryItemSchema>[],
) {
	try {
		if (!items.length) return true;

		const parsedSiteId = siteIdSchema.parse(siteId);
		const payload = z.array(inventoryItemSchema).min(1).parse(items);
		const userId = await getAuthenticatedUserId();
		await assertSiteAccess(userId, parsedSiteId);

		const inventoryData = payload.map((item) => ({
			site_id: parsedSiteId,
			catalog_id: item.catalogId,
			quantity: item.quantity,
			min_threshold: 0,
		}));

		const supabase = await createServerSupabaseClient();
		const { error } = await supabase
			.from('site_inventory')
			.upsert(inventoryData, { onConflict: 'site_id,catalog_id' })
			.select('id, catalog_id');
		if (error) throw error;
		return true;
	} catch (error: unknown) {
		safeLogError('addInventoryItemsAdmin', error);
		formatZodError(error);
	}
}
