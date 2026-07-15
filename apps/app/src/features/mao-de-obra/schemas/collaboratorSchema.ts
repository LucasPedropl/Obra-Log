import { z } from 'zod';

const documentSchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	url: z.string().optional(),
	type: z.string().optional(),
});

export const collaboratorSchema = z.object({
	name: z.string().min(1, 'O nome é obrigatório'),
	role_title: z.string().min(1, 'O cargo/função é obrigatório'),
	cpf: z.string().optional(),
	rg: z.string().optional(),
	birth_date: z.string().optional(),
	cellphone: z.string().optional(),
	email: z.string().email('Email inválido').optional().or(z.literal('')),
	cep: z.string().optional(),
	street: z.string().optional(),
	number: z.string().optional(),
	neighborhood: z.string().optional(),
	complement: z.string().optional(),
	city: z.string().optional(),
	state: z.string().optional(),
	profile_id: z.string().optional(),
	documents_json: z.array(documentSchema).optional(),
});

export type CollaboratorFormData = z.infer<typeof collaboratorSchema>;
