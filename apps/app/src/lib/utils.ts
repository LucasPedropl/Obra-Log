import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getActiveCompanyId(): string | null {
	if (typeof document === 'undefined') return null;
	const match = document.cookie.match(/(^| )selectedCompanyId=([^;]+)/);
	return match ? match[2] : null;
}

export function getParentCompanyId(): string | null {
	if (typeof document === 'undefined') return null;
	const match = document.cookie.match(/(^| )parentCompanyId=([^;]+)/);
	return match ? match[2] : null;
}
