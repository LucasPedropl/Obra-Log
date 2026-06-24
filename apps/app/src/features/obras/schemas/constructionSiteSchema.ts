import { z } from 'zod';

export const constructionSiteSchema = z.object({
	name: z.string().min(1, 'O nome da obra é obrigatório'),
});

export type ConstructionSiteFormData = z.infer<typeof constructionSiteSchema>;
