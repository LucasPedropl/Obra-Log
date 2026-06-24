'use server';

import { z } from 'zod';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import {
	assertInventoryBelongsToSite,
	assertSiteAccess,
	getAuthenticatedUserId,
} from './_helpers';
import { safeLogError } from '@/lib/safeLog';

const giveEPISchema = z.object({
	siteId: z.string().uuid(),
	catalogId: z.string().uuid(),
	inventoryId: z.string().uuid(),
	collaboratorId: z.string().uuid(),
	quantity: z.number().int().positive(),
	withdrawalDate: z.string().min(1),
	notes: z.string().nullable().optional(),
	availableQuantity: z.number().int().nonnegative(),
});

type ActionResult = { success: true } | { success: false; error: string };

/** Records an EPI withdrawal, stock movement and inventory update. */
export async function giveEPIAction(
	input: z.infer<typeof giveEPISchema>,
): Promise<ActionResult> {
	try {
		const data = giveEPISchema.parse(input);
		const userId = await getAuthenticatedUserId();
		await assertSiteAccess(userId, data.siteId);

		if (data.quantity > data.availableQuantity) {
			throw new Error(
				`A quantidade máxima em estoque é ${data.availableQuantity}.`,
			);
		}

		await assertInventoryBelongsToSite(data.inventoryId, data.siteId);

		const withdrawalDate = new Date(data.withdrawalDate).toISOString();

		const { error: insertError } = await supabaseAdmin
			.from('epi_withdrawals')
			.insert({
				site_id: data.siteId,
				catalog_id: data.catalogId,
				collaborator_id: data.collaboratorId,
				withdrawn_by: userId,
				quantity: data.quantity,
				withdrawal_date: withdrawalDate,
				notes: data.notes || null,
			});

		if (insertError) throw new Error(insertError.message);

		const { error: moveError } = await supabaseAdmin
			.from('site_movements')
			.insert({
				site_id: data.siteId,
				inventory_id: data.inventoryId,
				created_by: userId,
				type: 'OUT',
				quantity_delta: -data.quantity,
				action_date: withdrawalDate,
				reason: 'APPLICATION',
			});

		if (moveError) throw new Error(moveError.message);

		const { error: updateError } = await supabaseAdmin
			.from('site_inventory')
			.update({ quantity: data.availableQuantity - data.quantity })
			.eq('id', data.inventoryId)
			.eq('site_id', data.siteId);

		if (updateError) throw new Error(updateError.message);

		return { success: true };
	} catch (error: unknown) {
		console.error('giveEPIAction:', error);
		const message =
			error instanceof z.ZodError
				? error.issues[0]?.message ?? 'Dados inválidos'
				: error instanceof Error
					? error.message
					: 'Erro ao realizar a entrega de EPI';
		return { success: false, error: message };
	}
}
