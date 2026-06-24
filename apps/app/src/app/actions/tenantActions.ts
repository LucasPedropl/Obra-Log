'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import {
	assertSiteAccess,
	getAuthenticatedUserId,
} from './_helpers';

type ActionResult<T = undefined> =
	| { success: true; data?: T }
	| { success: false; error: string };

const companyIdSchema = z.string().uuid();
const obraIdSchema = z.string().uuid();

function tenantCookieOptions(maxAge: number) {
	return {
		path: '/',
		maxAge,
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax' as const,
	};
}

async function assertCompanyMembership(
	userId: string,
	companyId: string,
): Promise<void> {
	const { data: member } = await supabaseAdmin
		.from('company_users')
		.select('company_id')
		.eq('user_id', userId)
		.eq('company_id', companyId)
		.maybeSingle();

	if (!member) throw new Error('Sem acesso a esta empresa');
}

/** Sets selectedCompanyId after validating company_users membership. */
export async function setSelectedCompanyAction(
	companyId: string,
	remember = false,
): Promise<ActionResult> {
	try {
		const parsed = companyIdSchema.parse(companyId);
		const userId = await getAuthenticatedUserId();
		await assertCompanyMembership(userId, parsed);

		const cookieStore = await cookies();
		const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24;

		cookieStore.set(
			'selectedCompanyId',
			parsed,
			tenantCookieOptions(maxAge),
		);

		if (remember) {
			cookieStore.set(
				'rememberedCompanyId',
				parsed,
				tenantCookieOptions(60 * 60 * 24 * 30),
			);
		}

		return { success: true };
	} catch (error: unknown) {
		console.error('setSelectedCompanyAction:', error);
		const message =
			error instanceof z.ZodError
				? 'ID de empresa inválido'
				: error instanceof Error
					? error.message
					: 'Erro ao selecionar empresa';
		return { success: false, error: message };
	}
}

/** Sets or clears selectedObraId after assertSiteAccess. */
export async function setSelectedObraAction(
	obraId: string | null,
): Promise<ActionResult> {
	try {
		const userId = await getAuthenticatedUserId();
		const cookieStore = await cookies();

		if (!obraId) {
			cookieStore.set('selectedObraId', '', {
				...tenantCookieOptions(0),
				maxAge: 0,
			});
			return { success: true };
		}

		const parsed = obraIdSchema.parse(obraId);
		await assertSiteAccess(userId, parsed);

		cookieStore.set(
			'selectedObraId',
			parsed,
			tenantCookieOptions(60 * 60 * 24 * 30),
		);

		return { success: true };
	} catch (error: unknown) {
		console.error('setSelectedObraAction:', error);
		const message =
			error instanceof z.ZodError
				? 'ID de obra inválido'
				: error instanceof Error
					? error.message
					: 'Erro ao selecionar obra';
		return { success: false, error: message };
	}
}

/** Applies rememberedCompanyId cookie if valid membership exists. */
export async function applyRememberedCompanyAction(): Promise<
	ActionResult<{ applied: boolean }>
> {
	try {
		const cookieStore = await cookies();
		const remembered = cookieStore.get('rememberedCompanyId')?.value;

		if (!remembered) {
			return { success: true, data: { applied: false } };
		}

		const result = await setSelectedCompanyAction(remembered, true);
		if (!result.success) {
			cookieStore.set('rememberedCompanyId', '', {
				...tenantCookieOptions(0),
				maxAge: 0,
			});
			return { success: true, data: { applied: false } };
		}

		return { success: true, data: { applied: true } };
	} catch (error: unknown) {
		console.error('applyRememberedCompanyAction:', error);
		return { success: true, data: { applied: false } };
	}
}

/** Clears tenant selection cookies (logout / trocar empresa). */
export async function clearTenantCookiesAction(): Promise<void> {
	const cookieStore = await cookies();
	const cleared = { ...tenantCookieOptions(0), maxAge: 0 };

	for (const name of [
		'selectedCompanyId',
		'selectedObraId',
		'rememberedCompanyId',
	]) {
		cookieStore.set(name, '', cleared);
	}
}
