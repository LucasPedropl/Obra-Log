import { maskCPF, maskPhone } from '@/lib/maskUtils';
import {
	PIX_KEY_TYPE_LABELS,
	type PixKeyType,
} from '@/features/mao-de-obra/schemas/collaboratorSchema';

/**
 * Builds the "Dados Bancários" cell text used in the payment summary table.
 * Example: `Banco Caixa Econômica Federal, Chave Pix (CPF): 005.266.997-10`
 */
export function formatBankDataLabel(
	bankName: string | null | undefined,
	pixKeyType: string | null | undefined,
	pixKey: string | null | undefined,
): string {
	const parts: string[] = [];

	if (bankName?.trim()) {
		const name = bankName.trim();
		parts.push(name.toLowerCase().startsWith('banco ') ? name : `Banco ${name}`);
	}

	if (pixKey?.trim() && pixKeyType) {
		const type = pixKeyType as PixKeyType;
		const typeLabel = PIX_KEY_TYPE_LABELS[type] ?? pixKeyType;
		parts.push(`Chave Pix (${typeLabel}): ${formatPixKeyDisplay(pixKey, pixKeyType)}`);
	}

	return parts.join(', ');
}

export function formatPixKeyDisplay(
	pixKey: string | null | undefined,
	pixKeyType: string | null | undefined,
): string {
	if (!pixKey) return '';
	if (pixKeyType === 'CPF') return maskCPF(pixKey);
	if (pixKeyType === 'CELULAR') return maskPhone(pixKey);
	return pixKey;
}

/** Raw Pix key for the dedicated column (digits for CPF/celular). */
export function formatPixKeyRaw(
	pixKey: string | null | undefined,
	pixKeyType: string | null | undefined,
): string {
	if (!pixKey) return '';
	if (pixKeyType === 'CPF' || pixKeyType === 'CELULAR') {
		return pixKey.replace(/\D/g, '');
	}
	return pixKey;
}

export function formatContactPhone(cellphone: string | null | undefined): string {
	if (!cellphone) return '';
	return maskPhone(cellphone);
}
