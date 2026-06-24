'use server';

import { z } from 'zod';
import { createServerSupabaseClient } from '@/config/supabaseServer';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import {
	assertInventoryBelongsToSite,
	assertSiteAccess,
	getAuthenticatedUserId,
	getValidatedCompanyId,
} from './_helpers';

const registerRentedSchema = z.object({
	siteId: z.string().uuid(),
	name: z.string().min(1),
	categoryId: z.string().uuid(),
	categoryName: z.string().min(1),
	quantity: z.number().int().positive(),
	entryDate: z.string().min(1),
	observations: z.string().optional(),
	entryPhotosUrl: z.string().optional(),
});

const returnRentedSchema = z.object({
	siteId: z.string().uuid(),
	equipmentId: z.string().uuid(),
	inventoryId: z.string().uuid().nullable().optional(),
	quantity: z.number().int().positive(),
	exitDate: z.string().min(1),
	observations: z.string().optional(),
	currentDescription: z.string().nullable().optional(),
});

type ActionResult = { success: true } | { success: false; error: string };

interface RentedEquipment {
	id: string;
	site_id: string;
	name: string;
	category: string;
	supplier: string | null;
	quantity: number;
	entry_date: string;
	exit_date: string | null;
	status: 'ACTIVE' | 'RETURNED';
	description: string | null;
	inventory_id: string | null;
	entry_photos_url: string | null;
	exit_photos_url: string | null;
}

/**
 * Registra a chegada de um equipamento alugado no servidor (Server Action).
 */
export async function registerRentedEquipmentAction(
	input: z.infer<typeof registerRentedSchema>,
): Promise<ActionResult> {
	try {
		const data = registerRentedSchema.parse(input);
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId);
		await assertSiteAccess(userId, data.siteId);

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

		const { data: catalogItem, error: catalogError } = await supabaseAdmin
			.from('catalogs')
			.insert({
				company_id: companyId,
				category_id: data.categoryId,
				unit_id: unitId,
				name: `[ALUGADO] ${data.name}`,
				is_stock_controlled: true,
				is_rented_equipment: true,
				is_tool: false,
			})
			.select('id')
			.single();

		if (catalogError) {
			throw new Error(`Catálogo: ${catalogError.message}`);
		}

		const { data: inventoryItem, error: invError } = await supabaseAdmin
			.from('site_inventory')
			.insert({
				site_id: data.siteId,
				catalog_id: catalogItem.id,
				quantity: data.quantity,
			})
			.select('id')
			.single();

		if (invError) {
			throw new Error(`Inventário: ${invError.message}`);
		}

		const { error: moveError } = await supabaseAdmin
			.from('site_movements')
			.insert({
				site_id: data.siteId,
				inventory_id: inventoryItem.id,
				created_by: userId,
				type: 'IN',
				quantity_delta: data.quantity,
				reason: 'PURCHASE',
			});

		if (moveError) {
			throw new Error(`Movimentação: ${moveError.message}`);
		}

		const { error: rentError } = await supabaseAdmin
			.from('rented_equipments')
			.insert({
				site_id: data.siteId,
				name: data.name,
				category: data.categoryName,
				quantity: data.quantity,
				entry_date: new Date(data.entryDate).toISOString(),
				status: 'ACTIVE',
				description: data.observations ?? null,
				inventory_id: inventoryItem.id,
				entry_photos_url: data.entryPhotosUrl ?? null,
			});

		if (rentError) {
			throw new Error(`Aluguel: ${rentError.message}`);
		}

		return { success: true };
	} catch (error: unknown) {
		console.error('registerRentedEquipmentAction:', error);
		const message =
			error instanceof z.ZodError
				? error.issues[0]?.message ?? 'Dados inválidos'
				: error instanceof Error
					? error.message
					: 'Falha ao registrar equipamento alugado';
		return { success: false, error: message };
	}
}

/** Registers return of a rented equipment and adjusts inventory. */
export async function returnRentedEquipmentAction(
	input: z.infer<typeof returnRentedSchema>,
): Promise<ActionResult> {
	try {
		const data = returnRentedSchema.parse(input);
		const userId = await getAuthenticatedUserId();
		await assertSiteAccess(userId, data.siteId);

		const { data: equipment, error: fetchError } = await supabaseAdmin
			.from('rented_equipments')
			.select('id, site_id, status, inventory_id')
			.eq('id', data.equipmentId)
			.maybeSingle();

		if (fetchError) throw new Error(fetchError.message);
		if (!equipment || equipment.site_id !== data.siteId) {
			throw new Error('Equipamento não encontrado');
		}

		const description = data.observations
			? `${data.currentDescription || ''}\n[Devolução]: ${data.observations}`
			: data.currentDescription ?? null;

		const { error: rentError } = await supabaseAdmin
			.from('rented_equipments')
			.update({
				status: 'RETURNED',
				exit_date: new Date(data.exitDate).toISOString(),
				description,
			})
			.eq('id', data.equipmentId);

		if (rentError) throw new Error(rentError.message);

		const inventoryId = data.inventoryId ?? equipment.inventory_id;
		if (inventoryId && data.quantity > 0) {
			await assertInventoryBelongsToSite(inventoryId, data.siteId);

			const { data: invData, error: invFetchError } = await supabaseAdmin
				.from('site_inventory')
				.select('quantity')
				.eq('id', inventoryId)
				.eq('site_id', data.siteId)
				.single();

			if (invFetchError) throw new Error(invFetchError.message);

			const newQuantity = Math.max(0, invData.quantity - data.quantity);

			const { error: invUpdateError } = await supabaseAdmin
				.from('site_inventory')
				.update({ quantity: newQuantity })
				.eq('id', inventoryId)
				.eq('site_id', data.siteId);

			if (invUpdateError) throw new Error(invUpdateError.message);

			const { error: moveError } = await supabaseAdmin
				.from('site_movements')
				.insert({
					site_id: data.siteId,
					inventory_id: inventoryId,
					created_by: userId,
					type: 'OUT',
					quantity_delta: data.quantity,
					reason: 'TRANSFER',
				});

			if (moveError) throw new Error(moveError.message);
		}

		return { success: true };
	} catch (error: unknown) {
		console.error('returnRentedEquipmentAction:', error);
		const message =
			error instanceof z.ZodError
				? error.issues[0]?.message ?? 'Dados inválidos'
				: error instanceof Error
					? error.message
					: 'Erro ao registrar devolução';
		return { success: false, error: message };
	}
}

/**
 * Busca a lista de equipamentos alugados de uma obra.
 */
export async function getRentedEquipmentsAction(
	siteId: string,
): Promise<RentedEquipment[]> {
	try {
		const userId = await getAuthenticatedUserId();
		await assertSiteAccess(userId, siteId);

		const supabase = await createServerSupabaseClient();
		const { data, error } = await supabase
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
		console.error('getRentedEquipmentsAction:', error);
		return [];
	}
}
