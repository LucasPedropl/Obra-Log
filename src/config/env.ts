import { z } from 'zod';

const envSchema = z.object({
	VITE_SUPABASE_URL: z.string().url('A URL do Supabase deve ser válida.'),
	VITE_SUPABASE_ANON_KEY: z
		.string()
		.min(1, 'A chave anônima do Supabase é obrigatória.'),
	VITE_API_URL: z.string().url().default('http://localhost:5005'),
});

// Validação em tempo de execução das variáveis de ambiente
const parsedEnv = envSchema.safeParse({
	VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
	VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
	VITE_API_URL: import.meta.env.VITE_API_URL,
});

if (!parsedEnv.success) {
	console.error(
		'❌ Variáveis de ambiente inválidas:',
		parsedEnv.error.format(),
	);
	throw new Error(
		'Configuração de ambiente inválida. Verifique o arquivo .env',
	);
}

export const env = parsedEnv.data;
