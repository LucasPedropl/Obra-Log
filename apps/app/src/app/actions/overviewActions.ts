'use server';

import { createServerSupabaseClient } from '@/config/supabaseServer';

export async function getObraOverviewStats(siteId: string) {
	const supabase = await createServerSupabaseClient();
	try {
		// 1. Estoque Baixo (Quantidade <= Min_threshold) E Quantidade real
		const { data: inventory } = await supabase
			.from('site_inventory')
			.select('quantity, min_threshold, catalogs(name)')
			.eq('site_id', siteId);

		let totalItems = 0;
		let lowStockItems = 0;

		if (inventory) {
			totalItems = inventory.length;
			lowStockItems = inventory.filter(
				(item) => (item.quantity ?? 0) <= (item.min_threshold ?? 0),
			).length;
		}

		// 2. Ferramentas Em Uso (tool_loans com status = 'OPEN')
		const { count: toolsInUseCount } = await supabase
			.from('tool_loans')
			.select('*', { count: 'exact', head: true })
			.eq('site_id', siteId)
			.eq('status', 'OPEN');

		// 3. Equipamentos Alugados Ativos (rented_equipments com status = 'ACTIVE')
		const { count: activeRentedCount } = await supabase
			.from('rented_equipments')
			.select('*', { count: 'exact', head: true })
			.eq('site_id', siteId)
			.eq('status', 'ACTIVE');

		// 4. Colaboradores na Obra (site_collaborators)
		const { count: activeCollaboratorsCount } = await supabase
			.from('site_collaborators')
			.select('*', { count: 'exact', head: true })
			.eq('site_id', siteId);

		// 5. Últimas Movimentações (site_movements)
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
			.eq('site_id', siteId)
			.order('action_date', { ascending: false })
			.limit(5);

		// Transformar para um formato limpo
		const formattedMovements = (recentMovements || []).map((mov: any) => {
			// Extracting correctly since site_inventory is a single object linked
			const itemCatalog = mov.site_inventory?.catalogs;
			const itemName = Array.isArray(itemCatalog)
				? itemCatalog[0]?.name
				: itemCatalog?.name;

			return {
				id: mov.id,
				type: mov.type,
				quantity_delta: mov.quantity_delta,
				date: mov.action_date,
				reason: mov.reason,
				user: mov.users?.full_name || 'Desconhecido',
				itemName: itemName || 'Insumo não identificado',
			};
		});

		// 5. Entradas Recentes de Equipamentos (rented_equipments ordenados por entry_date DESC limit 3)
		const { data: recentEquipments } = await supabase
			.from('rented_equipments')
			.select('id, name, supplier, entry_date, status, catalogs(name)')
			.eq('site_id', siteId)
			.order('entry_date', { ascending: false })
			.limit(3);

		const formattedEquipments = (recentEquipments || []).map(
			(equip: any) => {
				const cat = equip.catalogs;
				const finalName =
					equip.name ||
					(Array.isArray(cat) ? cat[0]?.name : cat?.name) ||
					'Equipamento';
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
	} catch (error) {
		console.error('Error fetching overview stats:', error);
		return {
			success: false,
			stats: null,
			recentMovements: [],
			recentEquipments: [],
		};
	}
}
