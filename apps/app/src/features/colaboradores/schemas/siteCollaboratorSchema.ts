import { z } from 'zod';

export const siteCollaboratorSchema = z.object({
	selectedIds: z
		.array(z.string())
		.min(1, 'Selecione pelo menos um colaborador'),
});

export type SiteCollaboratorFormData = z.infer<typeof siteCollaboratorSchema>;
