'use server';

import { z } from 'zod';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import {
	assertInventoryBelongsToSite,
	assertSiteAccess,
	getAuthenticatedUserId,
} from './_helpers';
import { safeLogError } from '@/lib/safeLog';

const inventoryItemSchema = z.object({
	catalogId: z.string().uuid(),
	quantity: z.number().min(0),
	category: z.enum(['NONE', 'TOOL', 'EPI']),
});

const adjustStockSchema = z.object({
	inventoryId: z.string().uuid(),
	siteId: z.string().uuid(),
	newQuantity: z.number().min(0),
	currentQuantity: z.number().min(0),
});

type ActionResult = { success: true } | { success: false; error: string };

export async function adjustInventoryStockAction(
	input: z.infer<typeof adjustStockSchema>,
): Promise<ActionResult> {
	try {
		const data = adjustStockSchema.parse(input);
		const userId = await getAuthenticatedUserId();
		await assertSiteAccess(userId, data.siteId);

		const delta = data.newQuantity - data.currentQuantity;
		if (delta === 0) return { success: true };

		await assertInventoryBelongsToSite(data.inventoryId, data.siteId);

		const { error: updateError } = await supabaseAdmin
			.from('site_inventory')
			.update({ quantity: data.newQuantity })
			.eq('id', data.inventoryId)
			.eq('site_id', data.siteId);

		if (updateError) throw new Error(updateError.message);

		const { error: moveError } = await supabaseAdmin
			.from('site_movements')
			.insert({
				site_id: data.siteId,
				inventory_id: data.inventoryId,
				created_by: userId,
				type: delta > 0 ? 'IN' : 'OUT',
				quantity_delta: Math.abs(delta),
				reason: 'ADJUSTMENT',
			});

		if (moveError) throw new Error(moveError.message);

		return { success: true };
	} catch (error: unknown) {
		safeLogError('adjustInventoryStockAction', error);
		const message =
			error instanceof z.ZodError
				? error.issues[0]?.message ?? 'Dados inválidos'
				: error instanceof Error
					? error.message
					: 'Erro ao processar o ajuste';
		return { success: false, error: message };
	}
}

/** Adds catalog items to site inventory with optional EPI/tool classification. */
export async function addSiteInventoryItemsAction(
	siteId: string,
	items: z.infer<typeof inventoryItemSchema>[],
): Promise<ActionResult> {
	try {
		const userId = await getAuthenticatedUserId();
		await assertSiteAccess(userId, siteId);

		const payload = z.array(inventoryItemSchema).min(1).parse(items);

		const inventoryData = payload.map((item) => ({
			site_id: siteId,
			catalog_id: item.catalogId,
			quantity: item.quantity,
			min_threshold: 0,
		}));

		const { data: inventoryResults, error: inventoryError } =
			await supabaseAdmin
				.from('site_inventory')
				.upsert(inventoryData, { onConflict: 'site_id,catalog_id' })
				.select('id, catalog_id');

		if (inventoryError) throw new Error(inventoryError.message);

		const epiData: { site_id: string; inventory_id: string }[] = [];
		const toolData: { site_id: string; inventory_id: string }[] = [];

		for (const invRow of inventoryResults ?? []) {
			const originalItem = payload.find(
				(i) => i.catalogId === invRow.catalog_id,
			);
			if (originalItem?.category === 'EPI') {
				epiData.push({ site_id: siteId, inventory_id: invRow.id });
			} else if (originalItem?.category === 'TOOL') {
				toolData.push({ site_id: siteId, inventory_id: invRow.id });
			}
		}

		if (epiData.length > 0) {
			const inventoryIds = epiData.map((e) => e.inventory_id);
			const { data: existingEpis } = await supabaseAdmin
				.from('site_epis')
				.select('inventory_id')
				.in('inventory_id', inventoryIds);

			const existingEpiIds = new Set(
				existingEpis?.map((e) => e.inventory_id) ?? [],
			);
			const newEpis = epiData.filter(
				(e) => !existingEpiIds.has(e.inventory_id),
			);

			if (newEpis.length > 0) {
				const { error: epiError } = await supabaseAdmin
					.from('site_epis')
					.insert(newEpis);
				if (epiError) throw new Error(epiError.message);
			}
		}

		if (toolData.length > 0) {
			const inventoryIds = toolData.map((t) => t.inventory_id);
			const { data: existingTools } = await supabaseAdmin
				.from('site_tools')
				.select('inventory_id')
				.in('inventory_id', inventoryIds);

			const existingToolIds = new Set(
				existingTools?.map((t) => t.inventory_id) ?? [],
			);
			const newTools = toolData.filter(
				(t) => !existingToolIds.has(t.inventory_id),
			);

			if (newTools.length > 0) {
				const { error: toolError } = await supabaseAdmin
					.from('site_tools')
					.insert(newTools);
				if (toolError) throw new Error(toolError.message);
			}
		}

		return { success: true };
	} catch (error: unknown) {
		console.error('addSiteInventoryItemsAction:', error);
		const message =
			error instanceof z.ZodError
				? error.issues[0]?.message ?? 'Dados inválidos'
				: error instanceof Error
					? error.message
					: 'Erro ao salvar inventário';
		return { success: false, error: message };
	}
}
