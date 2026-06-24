'use server';

import { z } from 'zod';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { safeLogError } from '@/lib/safeLog';
import { getAuthenticatedUserId, getValidatedCompanyId } from './_helpers';

export interface DashboardKpis {
	activeSites: number;
	collaborators: number;
	lowStockItems: number;
	totalInventoryItems: number;
}

export async function getDashboardKpisAction(): Promise<{
	success: boolean;
	kpis?: DashboardKpis;
	error?: string;
}> {
	try {
		await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId();

		const [sitesRes, collaboratorsRes, catalogRes] = await Promise.all([
			supabaseAdmin
				.from('construction_sites')
				.select('id', { count: 'exact', head: true })
				.eq('company_id', companyId),
			supabaseAdmin
				.from('collaborators')
				.select('id', { count: 'exact', head: true })
				.eq('company_id', companyId),
			supabaseAdmin
				.from('supply_catalog')
				.select('id, min_threshold')
				.eq('company_id', companyId),
		]);

		const siteIds =
			(
				await supabaseAdmin
					.from('construction_sites')
					.select('id')
					.eq('company_id', companyId)
			).data?.map((s) => s.id) ?? [];

		let totalInventoryItems = 0;
		let lowStockItems = 0;

		if (siteIds.length > 0) {
			const { data: inventory } = await supabaseAdmin
				.from('site_inventory')
				.select('quantity, catalog_id')
				.in('site_id', siteIds);

			totalInventoryItems = inventory?.length ?? 0;

			const catalogMap = new Map(
				(catalogRes.data ?? []).map((c) => [c.id, c.min_threshold ?? 0]),
			);

			lowStockItems =
				inventory?.filter((inv) => {
					const threshold = catalogMap.get(inv.catalog_id) ?? 0;
					return threshold > 0 && (inv.quantity ?? 0) <= threshold;
				}).length ?? 0;
		}

		return {
			success: true,
			kpis: {
				activeSites: sitesRes.count ?? 0,
				collaborators: collaboratorsRes.count ?? 0,
				lowStockItems,
				totalInventoryItems,
			},
		};
	} catch (error: unknown) {
		safeLogError('getDashboardKpisAction', error);
		const message =
			error instanceof z.ZodError
				? (error.issues[0]?.message ?? 'Dados inválidos')
				: error instanceof Error
					? error.message
					: 'Erro ao carregar KPIs';
		return { success: false, error: message };
	}
}
