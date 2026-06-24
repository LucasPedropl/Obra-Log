import { z } from 'zod';

export const inventoryCategorySchema = z.enum(['NONE', 'TOOL', 'EPI']);

export const inventoryItemConfigSchema = z.object({
	catalogId: z.string(),
	quantity: z.number().min(0, 'Quantidade deve ser zero ou maior'),
	category: inventoryCategorySchema,
});

export const addInventoryStep1Schema = z.object({
	selectedIds: z
		.array(z.string())
		.min(1, 'Selecione pelo menos um insumo'),
});

export const addInventorySchema = z.object({
	selectedIds: z.array(z.string()).min(1),
	items: z.array(inventoryItemConfigSchema).min(1),
});

export type InventoryCategory = z.infer<typeof inventoryCategorySchema>;
export type InventoryItemConfig = z.infer<typeof inventoryItemConfigSchema>;
export type AddInventoryStep1Data = z.infer<typeof addInventoryStep1Schema>;
export type AddInventoryFormData = z.infer<typeof addInventorySchema>;
