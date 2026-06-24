import { z } from 'zod';

export const loanToolBaseSchema = z.object({
	collaboratorId: z.string().min(1, 'Selecione um colaborador'),
	loanDate: z.string().min(1, 'Data e hora são obrigatórias'),
	quantity: z
		.number({ error: 'Informe uma quantidade válida' })
		.min(1, 'Quantidade mínima é 1'),
	observation: z.string().optional(),
});

export function createLoanToolSchema(availableQuantity: number) {
	return loanToolBaseSchema.refine(
		(data) => data.quantity <= availableQuantity,
		{
			message: `Quantidade máxima disponível é ${availableQuantity}`,
			path: ['quantity'],
		},
	);
}

export type LoanToolFormData = z.infer<typeof loanToolBaseSchema>;
