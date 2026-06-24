import { z } from 'zod';

export const addRentedSchema = z.object({
	name: z.string().min(1, 'Nome do equipamento é obrigatório'),
	categoryId: z.string().min(1, 'Selecione uma categoria'),
	quantity: z
		.number({ error: 'Informe uma quantidade válida' })
		.min(1, 'Quantidade mínima é 1'),
	entryDate: z.string().min(1, 'Data de chegada é obrigatória'),
	observations: z.string().optional(),
});

export type AddRentedFormData = z.infer<typeof addRentedSchema>;
