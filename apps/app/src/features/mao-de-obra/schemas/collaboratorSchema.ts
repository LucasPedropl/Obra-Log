import { z } from 'zod';

const documentSchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	url: z.string().optional(),
	type: z.string().optional(),
});

export const PIX_KEY_TYPES = ['CPF', 'CELULAR', 'EMAIL', 'ALEATORIA'] as const;

export const PIX_KEY_TYPE_LABELS: Record<(typeof PIX_KEY_TYPES)[number], string> = {
	CPF: 'CPF',
	CELULAR: 'Celular',
	EMAIL: 'E-mail',
	ALEATORIA: 'Aleatória',
};

export const collaboratorSchema = z.object({
	name: z.string().min(1, 'O nome é obrigatório'),
	role_title: z.string().min(1, 'O cargo/função é obrigatório'),
	daily_rate: z.string().optional(),
	cpf: z.string().optional(),
	rg: z.string().optional(),
	birth_date: z.string().optional(),
	cellphone: z.string().optional(),
	email: z.string().email('Email inválido').optional().or(z.literal('')),
	bank_name: z.string().optional(),
	pix_key_type: z
		.union([z.enum(PIX_KEY_TYPES), z.literal('')])
		.optional(),
	pix_key: z.string().optional(),
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
export type PixKeyType = (typeof PIX_KEY_TYPES)[number];
