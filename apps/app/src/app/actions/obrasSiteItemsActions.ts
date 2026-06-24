'use server';

import { z } from 'zod';
import { createServerSupabaseClient } from '@/config/supabaseServer';
import { safeLogError } from '@/lib/safeLog';
import {
	assertInventoryBelongsToSite,
	assertSiteAccess,
	getAuthenticatedUserId,
} from './_helpers';
import { getSiteInventoryAdmin } from './obrasActions';

const siteIdSchema = z.string().uuid('ID da obra inválido');
const inventoryIdsSchema = z.array(z.string().uuid()).min(1);

type SiteInventoryEntry = Awaited<
	ReturnType<typeof getSiteInventoryAdmin>
>[number];

interface CatalogSummary {
	name?: string;
	code?: string | null;
	categories?: { primary_category?: string } | null;
}

function formatZodError(error: unknown): never {
	if (error instanceof z.ZodError) {
		throw new Error(error.issues[0]?.message ?? 'Dados inválidos');
	}
	throw error;
}

export async function getSiteToolsAdmin(siteId: string) {
	try {
		const parsedSiteId = siteIdSchema.parse(siteId);
		const userId = await getAuthenticatedUserId();
		await assertSiteAccess(userId, parsedSiteId);

		const supabase = await createServerSupabaseClient();
		const { data, error } = await supabase
			.from('site_tools')
			.select('inventory_id')
			.eq('site_id', parsedSiteId);
		if (error) throw error;
		return data || [];
	} catch (error: unknown) {
		safeLogError('getSiteToolsAdmin', error);
		formatZodError(error);
	}
}

export async function addSiteToolsAdmin(
	siteId: string,
	inventoryIds: string[],
) {
	try {
		if (!inventoryIds.length) return true;

		const parsedSiteId = siteIdSchema.parse(siteId);
		const parsedIds = inventoryIdsSchema.parse(inventoryIds);
		const userId = await getAuthenticatedUserId();
		await assertSiteAccess(userId, parsedSiteId);

		for (const inventoryId of parsedIds) {
			await assertInventoryBelongsToSite(inventoryId, parsedSiteId);
		}

		const payload = parsedIds.map((id) => ({
			site_id: parsedSiteId,
			inventory_id: id,
		}));

		const supabase = await createServerSupabaseClient();
		const { error } = await supabase.from('site_tools').insert(payload);
		if (error) throw error;
		return true;
	} catch (error: unknown) {
		safeLogError('addSiteToolsAdmin', error);
		formatZodError(error);
	}
}

export async function getSiteEpisAdmin(siteId: string) {
	try {
		const parsedSiteId = siteIdSchema.parse(siteId);
		const userId = await getAuthenticatedUserId();
		await assertSiteAccess(userId, parsedSiteId);

		const supabase = await createServerSupabaseClient();
		const { data, error } = await supabase
			.from('site_epis')
			.select('inventory_id')
			.eq('site_id', parsedSiteId);
		if (error) throw error;
		return data || [];
	} catch (error: unknown) {
		safeLogError('getSiteEpisAdmin', error);
		formatZodError(error);
	}
}

export async function addSiteEpisAdmin(
	siteId: string,
	inventoryIds: string[],
) {
	try {
		if (!inventoryIds.length) return true;

		const parsedSiteId = siteIdSchema.parse(siteId);
		const parsedIds = inventoryIdsSchema.parse(inventoryIds);
		const userId = await getAuthenticatedUserId();
		await assertSiteAccess(userId, parsedSiteId);

		for (const inventoryId of parsedIds) {
			await assertInventoryBelongsToSite(inventoryId, parsedSiteId);
		}

		const payload = parsedIds.map((id) => ({
			site_id: parsedSiteId,
			inventory_id: id,
		}));

		const supabase = await createServerSupabaseClient();
		const { error } = await supabase.from('site_epis').insert(payload);
		if (error) throw error;
		return true;
	} catch (error: unknown) {
		safeLogError('addSiteEpisAdmin', error);
		formatZodError(error);
	}
}

export async function getEPIItemsAdmin(siteId: string) {
	try {
		const parsedSiteId = siteIdSchema.parse(siteId);
		const userId = await getAuthenticatedUserId();
		await assertSiteAccess(userId, parsedSiteId);

		const supabase = await createServerSupabaseClient();

		const { data: siteEpisData, error: episErr } = await supabase
			.from('site_epis')
			.select('*')
			.eq('site_id', parsedSiteId);

		if (episErr) throw episErr;

		const inventoryData = await getSiteInventoryAdmin(parsedSiteId);
		const inventoryMap = new Map(
			inventoryData.map((item: SiteInventoryEntry) => [item.id, item]),
		);

		return (siteEpisData || []).map((se) => {
			const inv = inventoryMap.get(se.inventory_id);
			const cat = inv?.catalogs as CatalogSummary | null | undefined;
			return {
				id: se.id,
				inventoryId: se.inventory_id,
				catalogId: inv?.catalog_id,
				name: cat?.name || 'EPI sem nome',
				category: cat?.categories?.primary_category || 'Sem Categoria',
				code: cat?.code || 'S/C',
				totalQuantity: inv?.quantity || 0,
				minThreshold: inv?.min_threshold || 0,
			};
		});
	} catch (error: unknown) {
		safeLogError('getEPIItemsAdmin', error);
		formatZodError(error);
	}
}

export async function getToolItemsAdmin(siteId: string) {
	try {
		const parsedSiteId = siteIdSchema.parse(siteId);
		const userId = await getAuthenticatedUserId();
		await assertSiteAccess(userId, parsedSiteId);

		const supabase = await createServerSupabaseClient();

		const { data: siteToolsData, error: toolsErr } = await supabase
			.from('site_tools')
			.select('*')
			.eq('site_id', parsedSiteId);

		if (toolsErr) throw toolsErr;

		const inventoryData = await getSiteInventoryAdmin(parsedSiteId);
		const inventoryMap = new Map(
			inventoryData.map((item: SiteInventoryEntry) => [item.id, item]),
		);

		const { data: loansData, error: loansErr } = await supabase
			.from('tool_loans')
			.select('inventory_id, quantity')
			.eq('site_id', parsedSiteId)
			.eq('status', 'OPEN');

		if (loansErr) throw loansErr;

		const borrowedMap: Record<string, number> = {};
		for (const loan of loansData ?? []) {
			const invId = loan.inventory_id;
			borrowedMap[invId] = (borrowedMap[invId] || 0) + (loan.quantity || 0);
		}

		return (siteToolsData || []).map((st) => {
			const inv = inventoryMap.get(st.inventory_id);
			const cat = inv?.catalogs as CatalogSummary | null | undefined;
			const totalQty = inv?.quantity || 0;
			const borrowedQty = borrowedMap[st.inventory_id] || 0;

			return {
				id: st.id,
				inventoryId: st.inventory_id,
				name: cat?.name || 'Ferramenta sem nome',
				category: cat?.categories?.primary_category || 'Sem Categoria',
				code: cat?.code || 'S/C',
				totalQuantity: totalQty,
				availableQuantity: Math.max(0, totalQty - borrowedQty),
			};
		});
	} catch (error: unknown) {
		safeLogError('getToolItemsAdmin', error);
		formatZodError(error);
	}
}
