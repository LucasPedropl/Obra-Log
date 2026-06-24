const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const CPF_PATTERN = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g;

/** Logs errors without leaking PII (email, CPF) in production logs. */
export function safeLogError(context: string, error: unknown): void {
	const message =
		error instanceof Error
			? error.message.replace(EMAIL_PATTERN, '[email]').replace(CPF_PATTERN, '[cpf]')
			: 'Erro desconhecido';
	console.error(`${context}:`, message);
}
