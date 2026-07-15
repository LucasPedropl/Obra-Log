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

/** Masks a monetary input (BRL) from raw digits, e.g. "15000" -> "150,00". */
export const maskCurrency = (value: string) => {
	const digits = value.replace(/\D/g, '');
	if (!digits) return '';
	const cents = Number(digits);
	return (cents / 100).toLocaleString('pt-BR', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
};

/** Converts a masked BRL string ("1.234,56") into a number (1234.56). */
export const parseCurrencyToNumber = (value: string | null | undefined): number | null => {
	if (!value) return null;
	const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
	if (!normalized) return null;
	const parsed = Number(normalized);
	return Number.isFinite(parsed) ? parsed : null;
};

/** Formats a number as BRL currency for display, e.g. 150 -> "R$ 150,00". */
export const formatCurrencyDisplay = (value: number | null | undefined): string => {
	if (value == null || Number.isNaN(value)) return '—';
	return value.toLocaleString('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	});
};

/** Masks CPF for display (LGPD) — shows only last 5 digits. */
export function maskCpfDisplay(cpf: string | null | undefined): string {
	if (!cpf || cpf === 'Sem CPF') return 'Sem CPF';

	const digits = cpf.replace(/\D/g, '');
	if (digits.length !== 11) return '***.***.***-**';

	return `***.***.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}
