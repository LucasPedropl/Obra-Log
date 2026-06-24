/**
 * Utilitários para máscaras de input
 */

export const maskCPF = (value: string) => {
	return value
		.replace(/\D/g, '')
		.replace(/(\d{3})(\d)/, '$1.$2')
		.replace(/(\d{3})(\d)/, '$1.$2')
		.replace(/(\d{3})(\d{1,2})/, '$1-$2')
		.replace(/(-\d{2})\d+?$/, '$1');
};

export const maskPhone = (value: string) => {
	return value
		.replace(/\D/g, '')
		.replace(/(\d{2})(\d)/, '($1) $2')
		.replace(/(\d{5})(\d)/, '$1-$2')
		.replace(/(-\d{4})\d+?$/, '$1');
};

export const maskCEP = (value: string) => {
	return value
		.replace(/\D/g, '')
		.replace(/(\d{5})(\d)/, '$1-$2')
		.replace(/(-\d{3})\d+?$/, '$1');
};

export const maskDate = (value: string) => {
	return value
		.replace(/\D/g, '')
		.replace(/(\d{2})(\d)/, '$1/$2')
		.replace(/(\d{2})(\d)/, '$1/$2')
		.replace(/(\/\d{4})\d+?$/, '$1');
};

export const unmask = (value: string) => {
	return value.replace(/\D/g, '');
};

/** Masks CPF for display (LGPD) — shows only last 5 digits. */
export function maskCpfDisplay(cpf: string | null | undefined): string {
	if (!cpf || cpf === 'Sem CPF') return 'Sem CPF';

	const digits = cpf.replace(/\D/g, '');
	if (digits.length !== 11) return '***.***.***-**';

	return `***.***.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}
