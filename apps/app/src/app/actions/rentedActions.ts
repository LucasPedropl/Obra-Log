'use server';

import { supabaseAdmin } from '@/config/supabaseAdmin';

interface RegisterRentedEquipmentData {
	siteId: string;
	companyId: string;
	userId: string;
	name: string;
	categoryId: string;
	categoryName: string;
	quantity: number;
	entryDate: string;
	observations: string;
}

/**
 * Registra a chegada de um equipamento alugado no servidor (Server Action).
 * Utiliza o supabaseAdmin para ignorar RLS em operações administrativas complexas.
 */
export async function registerRentedEquipmentAction(
	data: RegisterRentedEquipmentData,
) {
	const {
		siteId,
		companyId,
		userId,
		name,
		categoryId,
		categoryName,
		quantity,
		entryDate,
		observations,
	} = data;

	try {
		// 1. Obter a unidade de medida padrão (UN)
		const { data: units, error: unitsError } = await supabaseAdmin
			.from('measurement_units')
			.select('id')
			.eq('company_id', companyId)
			.eq('abbreviation', 'UN')
			.limit(1);

		if (unitsError) {
			console.error('Erro ao buscar unidade de medida:', unitsError);
		}

		const unitId = units?.[0]?.id || null;

		// 2. Criar o item no Catálogo (Catalogs)
		// Marcamos como is_rented_equipment: true
		const { data: catalogItem, error: catalogError } = await supabaseAdmin
			.from('catalogs')
			.insert({
				company_id: companyId,
				category_id: categoryId,
				unit_id: unitId,
				name: `[ALUGADO] ${name}`,
				is_stock_controlled: true,
				is_rented_equipment: true,
				is_tool: false,
			})
			.select('id')
			.single();

		if (catalogError) {
			console.error('Erro ao criar item no catálogo:', catalogError);
			throw new Error(`Catálogo: ${catalogError.message}`);
		}
		const catalogId = catalogItem.id;

		// 3. Adicionar ao Inventário da Obra (Site Inventory)
		const { data: inventoryItem, error: invError } = await supabaseAdmin
			.from('site_inventory')
			.insert({
				site_id: siteId,
				catalog_id: catalogId,
				quantity: quantity,
			})
			.select('id')
			.single();

		if (invError) {
			console.error('Erro ao criar item no inventário:', invError);
			throw new Error(`Inventário: ${invError.message}`);
		}
		const inventoryId = inventoryItem.id;

		// 4. Registrar Movimentação de Entrada (Site Movements)
		const { error: moveError } = await supabaseAdmin
			.from('site_movements')
			.insert({
				site_id: siteId,
				inventory_id: inventoryId,
				created_by: userId,
				type: 'IN',
				quantity_delta: quantity,
				reason: 'PURCHASE',
			});

		if (moveError) {
			console.error('Erro ao registrar movimentação:', moveError);
			throw new Error(`Movimentação: ${moveError.message}`);
		}

		// 5. Registrar o Equipamento Alugado (Rented Equipments)
		const { error: rentError } = await supabaseAdmin
			.from('rented_equipments')
			.insert({
				site_id: siteId,
				name,
				category: categoryName,
				quantity: quantity,
				entry_date: new Date(entryDate).toISOString(),
				status: 'ACTIVE',
				description: observations,
				inventory_id: inventoryId,
			});

		if (rentError) {
			console.error('Erro ao registrar equipamento alugado:', rentError);
			throw new Error(`Aluguel: ${rentError.message}`);
		}

		return { success: true };
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Falha ao registrar equipamento alugado.';
		console.error('ERRO NA SERVER ACTION (registerRentedEquipment):', error);
		throw new Error(message);
	}
}

interface RentedEquipment {
	id: string;
	site_id: string;
	name: string;
	category: string;
	quantity: number;
	entry_date: string;
	return_date: string | null;
	status: 'ACTIVE' | 'RETURNED';
	description: string | null;
	inventory_id: string | null;
}

/**
 * Busca a lista de equipamentos alugados de uma obra.
 * Utiliza o supabaseAdmin para garantir que os dados sejam retornados independente de RLS no browser.
 */
export async function getRentedEquipmentsAction(siteId: string): Promise<RentedEquipment[]> {
	try {
		const { data, error } = await supabaseAdmin
			.from('rented_equipments')
			.select('*')
			.eq('site_id', siteId)
			.order('entry_date', { ascending: false });

		if (error) {
			console.error('Erro ao buscar equipamentos alugados:', error);
			throw error;
		}

		return (data as unknown as RentedEquipment[]) || [];
	} catch (error: unknown) {
		console.error('ERRO NA SERVER ACTION (getRentedEquipments):', error);
		return [];
	}
}
