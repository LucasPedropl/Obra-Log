import { z } from 'zod';

export const addEPISchema = z.object({
	selectedIds: z.array(z.string()).min(1, 'Selecione pelo menos um EPI'),
});

export type AddEPIFormData = z.infer<typeof addEPISchema>;
