import { z } from 'zod';

export const stockAdjustmentSchema = z.object({
	quantity: z
		.number({ error: 'Informe uma quantidade válida' })
		.min(0, 'Quantidade não pode ser negativa'),
});

export type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>;
