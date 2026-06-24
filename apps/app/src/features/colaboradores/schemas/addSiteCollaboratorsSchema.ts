import { z } from 'zod';

export const addSiteCollaboratorsSchema = z.object({
	siteId: z.string().uuid('ID da obra inválido'),
	collaboratorIds: z
		.array(z.string().uuid())
		.min(1, 'Selecione ao menos um colaborador'),
});

export type AddSiteCollaboratorsInput = z.infer<
	typeof addSiteCollaboratorsSchema
>;
