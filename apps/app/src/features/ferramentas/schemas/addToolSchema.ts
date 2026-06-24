import { z } from 'zod';

export const addToolSchema = z.object({
	selectedIds: z
		.array(z.string())
		.min(1, 'Selecione pelo menos uma ferramenta'),
});

export type AddToolFormData = z.infer<typeof addToolSchema>;
