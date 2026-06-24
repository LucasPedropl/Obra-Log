'use server';

import { z } from 'zod';
import { createServerSupabaseClient } from '@/config/supabaseServer';
import { safeLogError } from '@/lib/safeLog';
import { assertSiteAccess, getAuthenticatedUserId } from './_helpers';

const siteIdSchema = z.string().uuid('ID da obra inválido');

interface CatalogSummary {
	name?: string;
}

interface MovementRow {
	id: string;
	type: string;
	quantity_delta: number;
	action_date: string;
	reason: string | null;
	users: { full_name: string | null } | null;
	site_inventory: {
		catalogs: CatalogSummary | CatalogSummary[] | null;
	} | null;
}

interface EquipmentRow {
	id: string;
	name: string | null;
	supplier: string | null;
	entry_date: string;
	status: string;
	catalogs: CatalogSummary | CatalogSummary[] | null;
}

function resolveCatalogName(
	catalog: CatalogSummary | CatalogSummary[] | null | undefined,
): string | undefined {
	if (!catalog) return undefined;
	if (Array.isArray(catalog)) return catalog[0]?.name;
	return catalog.name;
}

export async function getObraOverviewStats(siteId: string) {
	try {
		const parsedSiteId = siteIdSchema.parse(siteId);
		const userId = await getAuthenticatedUserId();
		await assertSiteAccess(userId, parsedSiteId);

		const supabase = await createServerSupabaseClient();

		const { data: inventory } = await supabase
			.from('site_inventory')
			.select('quantity, min_threshold, catalogs(name)')
			.eq('site_id', parsedSiteId);

		let totalItems = 0;
		let lowStockItems = 0;

		if (inventory) {
			totalItems = inventory.length;
			lowStockItems = inventory.filter(
				(item) => (item.quantity ?? 0) <= (item.min_threshold ?? 0),
			).length;
		}

		const { count: toolsInUseCount } = await supabase
			.from('tool_loans')
			.select('*', { count: 'exact', head: true })
			.eq('site_id', parsedSiteId)
			.eq('status', 'OPEN');

		const { count: activeRentedCount } = await supabase
			.from('rented_equipments')
			.select('*', { count: 'exact', head: true })
			.eq('site_id', parsedSiteId)
			.eq('status', 'ACTIVE');

		const { count: activeCollaboratorsCount } = await supabase
			.from('site_collaborators')
			.select('*', { count: 'exact', head: true })
			.eq('site_id', parsedSiteId);

		const { data: recentMovements } = await supabase
			.from('site_movements')
			.select(
				`
				id, 
				type, 
				quantity_delta, 
				action_date, 
				reason, 
				inventory_id,
				users!created_by(full_name),
				site_inventory(catalogs(name))
			`,
			)
			.eq('site_id', parsedSiteId)
			.order('action_date', { ascending: false })
			.limit(5);

		const formattedMovements = (recentMovements as MovementRow[] | null ?? []).map(
			(mov) => {
				const itemCatalog = mov.site_inventory?.catalogs;
				const itemName = resolveCatalogName(itemCatalog);

				return {
					id: mov.id,
					type: mov.type,
					quantity_delta: mov.quantity_delta,
					date: mov.action_date,
					reason: mov.reason,
					user: mov.users?.full_name || 'Desconhecido',
					itemName: itemName || 'Insumo não identificado',
				};
			},
		);

		const { data: recentEquipments } = await supabase
			.from('rented_equipments')
			.select('id, name, supplier, entry_date, status, catalogs(name)')
			.eq('site_id', parsedSiteId)
			.order('entry_date', { ascending: false })
			.limit(3);

		const formattedEquipments = (recentEquipments as EquipmentRow[] | null ?? []).map(
			(equip) => {
				const finalName =
					equip.name || resolveCatalogName(equip.catalogs) || 'Equipamento';
				return {
					id: equip.id,
					name: finalName,
					supplier: equip.supplier || 'N/A',
					date: equip.entry_date,
					status: equip.status,
				};
			},
		);

		return {
			success: true,
			stats: {
				totalInventory: totalItems,
				lowStockInventory: lowStockItems,
				toolsInUse: toolsInUseCount || 0,
				activeRented: activeRentedCount || 0,
				activeCollaborators: activeCollaboratorsCount || 0,
			},
			recentMovements: formattedMovements,
			recentEquipments: formattedEquipments,
		};
	} catch (error: unknown) {
		safeLogError('getObraOverviewStats', error);
		const message =
			error instanceof z.ZodError
				? (error.issues[0]?.message ?? 'Dados inválidos')
				: undefined;
		return {
			success: false,
			error: message,
			stats: null,
			recentMovements: [],
			recentEquipments: [],
		};
	}
}
