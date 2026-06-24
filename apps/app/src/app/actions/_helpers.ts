'use server';

import { createServerSupabaseClient } from '@/config/supabaseServer';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { cookies } from 'next/headers';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

type ResourcePermissionMap = Record<
	string,
	Partial<Record<PermissionAction, boolean>>
>;

interface CompanyMember {
	role: string;
	profile_id: string | null;
}

/** Returns authenticated user id from server session. */
export async function getAuthenticatedUserId(): Promise<string> {
	const supabase = await createServerSupabaseClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error('Não autenticado');
	return user.id;
}

/** Validates selectedCompanyId cookie against company_users membership. */
export async function getValidatedCompanyId(
	userId?: string,
	fallback?: string,
): Promise<string> {
	const uid = userId ?? (await getAuthenticatedUserId());
	const cookieStore = await cookies();
	const companyId =
		cookieStore.get('selectedCompanyId')?.value ?? fallback ?? null;

	if (!companyId) throw new Error('Empresa não selecionada');

	const { data: member } = await supabaseAdmin
		.from('company_users')
		.select('company_id')
		.eq('user_id', uid)
		.eq('company_id', companyId)
		.maybeSingle();

	if (!member) throw new Error('Sem acesso a esta empresa');

	return companyId;
}

async function getCompanyMember(
	userId: string,
	companyId: string,
): Promise<CompanyMember | null> {
	const { data: profile } = await supabaseAdmin
		.from('profiles')
		.select('is_super_admin')
		.eq('id', userId)
		.maybeSingle();

	if (profile?.is_super_admin) return { role: 'SUPER_ADMIN', profile_id: null };

	const { data: member } = await supabaseAdmin
		.from('company_users')
		.select('role, profile_id')
		.eq('user_id', userId)
		.eq('company_id', companyId)
		.maybeSingle();

	return member;
}

/** Asserts resource permission for the given company and action. */
export async function assertCompanyResourcePermission(
	userId: string,
	companyId: string,
	resourceKey: string,
	action: PermissionAction = 'create',
): Promise<void> {
	const member = await getCompanyMember(userId, companyId);

	if (!member) throw new Error('Sem acesso a esta empresa');
	if (member.role === 'SUPER_ADMIN' || member.role === 'ADMIN') return;

	if (!member.profile_id) {
		throw new Error('Sem permissão para esta operação');
	}

	const { data: accessProfile } = await supabaseAdmin
		.from('access_profiles')
		.select('permissions')
		.eq('id', member.profile_id)
		.maybeSingle();

	const permissions = accessProfile?.permissions as ResourcePermissionMap | null;
	if (!permissions?.[resourceKey]?.[action]) {
		throw new Error('Sem permissão para esta operação');
	}
}

/** Asserts user has access to a construction site within their company. */
export async function assertSiteAccess(
	userId: string,
	siteId: string,
): Promise<void> {
	const companyId = await getValidatedCompanyId(userId);

	const { data: site } = await supabaseAdmin
		.from('construction_sites')
		.select('id, company_id')
		.eq('id', siteId)
		.maybeSingle();

	if (!site || site.company_id !== companyId) {
		throw new Error('Obra não encontrada ou sem acesso');
	}

	const member = await getCompanyMember(userId, companyId);
	if (!member) throw new Error('Sem acesso a esta empresa');
	if (member.role === 'SUPER_ADMIN' || member.role === 'ADMIN') return;

	if (!member.profile_id) {
		throw new Error('Sem permissão para esta obra');
	}

	const { data: accessProfile } = await supabaseAdmin
		.from('access_profiles')
		.select('permissions, obra_scope, allowed_sites')
		.eq('id', member.profile_id)
		.maybeSingle();

	if (!accessProfile) throw new Error('Sem permissão para esta obra');

	const scope = accessProfile.obra_scope as string | null;
	if (scope === 'ALL' || !scope) return;

	const { data: siteAccess } = await supabaseAdmin
		.from('user_site_access')
		.select('site_id')
		.eq('user_id', userId)
		.eq('site_id', siteId)
		.maybeSingle();

	if (!siteAccess) {
		throw new Error('Sem permissão para esta obra');
	}
}

/** Validates that an inventory row belongs to the given site (IDOR guard). */
export async function assertInventoryBelongsToSite(
	inventoryId: string,
	siteId: string,
): Promise<void> {
	const { data: row } = await supabaseAdmin
		.from('site_inventory')
		.select('id, site_id')
		.eq('id', inventoryId)
		.maybeSingle();

	if (!row || row.site_id !== siteId) {
		throw new Error('Item de inventário não encontrado nesta obra');
	}
}
