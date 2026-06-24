import { z } from 'zod';

export const returnRentedSchema = z.object({
	exitDate: z.string().min(1, 'Data e hora da devolução são obrigatórias'),
	observations: z.string().optional(),
});

export type ReturnRentedFormData = z.infer<typeof returnRentedSchema>;
