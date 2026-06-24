import { z } from 'zod';

export const giveEPIBaseSchema = z.object({
	collaboratorId: z.string().min(1, 'Selecione um colaborador'),
	withdrawalDate: z.string().min(1, 'Data da entrega é obrigatória'),
	quantity: z
		.number({ error: 'Informe uma quantidade válida' })
		.min(1, 'Quantidade mínima é 1'),
	notes: z.string().optional(),
});

export function createGiveEPISchema(availableQuantity: number) {
	return giveEPIBaseSchema.refine(
		(data) => data.quantity <= availableQuantity,
		{
			message: `A quantidade máxima em estoque é ${availableQuantity}`,
			path: ['quantity'],
		},
	);
}

export type GiveEPIFormData = z.infer<typeof giveEPIBaseSchema>;
