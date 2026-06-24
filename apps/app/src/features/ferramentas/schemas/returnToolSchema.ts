import { z } from 'zod';

export const returnToolSchema = z.object({
	returnDate: z.string().min(1, 'Data e hora de devolução são obrigatórias'),
	observation: z.string().optional(),
});

export type ReturnToolFormData = z.infer<typeof returnToolSchema>;
