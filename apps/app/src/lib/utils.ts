import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

let cachedCompanyId: string | null = null;

/** Syncs tenant company id from server-hydrated TenantProvider. */
export function setCachedCompanyId(id: string | null): void {
	cachedCompanyId = id;
}

export function getActiveCompanyId(): string | null {
	if (cachedCompanyId) return cachedCompanyId;
	if (typeof document === 'undefined') return null;
	const match = document.cookie.match(/(^| )selectedCompanyId=([^;]+)/);
	return match ? match[2] : null;
}
