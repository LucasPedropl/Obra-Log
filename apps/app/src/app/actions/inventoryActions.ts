'use server';

import { createServerSupabaseClient } from '@/config/supabaseServer';

export async function adjustInventoryStockAction(data: {
	inventoryId: string;
	siteId: string;
	newQuantity: number;
	currentQuantity: number;
	userId: string;
}) {
	const supabase = await createServerSupabaseClient();
	const { inventoryId, siteId, newQuantity, currentQuantity, userId } = data;

	const delta = newQuantity - currentQuantity;
	if (delta === 0) return { success: true };

	try {
		// 1. Atualizar o estoque
		const { error: updateError } = await supabase
			.from('site_inventory')
			.update({ quantity: newQuantity })
			.eq('id', inventoryId);

		if (updateError) throw updateError;

		// 2. Registrar a movimentação
		const { error: moveError } = await supabase
			.from('site_movements')
			.insert({
				site_id: siteId,
				inventory_id: inventoryId,
				created_by: userId,
				type: delta > 0 ? 'IN' : 'OUT',
				quantity_delta: Math.abs(delta),
				reason: 'ADJUSTMENT',
			});

		if (moveError) throw moveError;

		return { success: true };
	} catch (error: any) {
		console.error('Erro ao ajustar estoque:', error);
		return { success: false, error: error.message || 'Erro ao processar o ajuste' };
	}
}
