import { z } from 'zod';

export const supplyItemSchema = z.object({
	name: z.string().min(1, 'O nome do insumo é obrigatório'),
	category_id: z.string().min(1, 'Categoria é obrigatória'),
	unit_id: z.string().min(1, 'Unidade de medida é obrigatória'),
	min_threshold: z.number().min(0, 'O estoque mínimo deve ser positivo'),
	is_stock_controlled: z.boolean(),
});

export type SupplyItemFormData = z.infer<typeof supplyItemSchema>;
