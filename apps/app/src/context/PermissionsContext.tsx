'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createClient } from '@/config/supabase';
import { usePathname } from 'next/navigation';

export type PermissionActions = {
	view: boolean;
	create: boolean;
	edit: boolean;
	delete: boolean;
};

export type ResourcePermissions = Record<string, PermissionActions>;

export type ObraScope = 'ALL' | 'SELECTED' | null;

interface PermissionsContextData {
	permissions: ResourcePermissions | null;
	isSuperAdmin: boolean;
	obraScope: ObraScope;
	allowedSites: string[];
	loading: boolean;
	can: (resource: string, action: keyof PermissionActions) => boolean;
	canAccessSite: (siteId: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextData>({
	permissions: null,
	isSuperAdmin: false,
	obraScope: null,
	allowedSites: [],
	loading: true,
	can: () => false,
	canAccessSite: () => false,
});

function parseAllowedSitesFromProfile(
	profile: Record<string, unknown> | null | undefined,
): string[] {
	if (!profile) return [];

	const fromColumn = profile.allowed_sites;
	if (Array.isArray(fromColumn)) {
		return fromColumn.filter((id): id is string => typeof id === 'string');
	}

	const permissions = profile.permissions as
		| Record<string, unknown>
		| null
		| undefined;
	const fromPermissions = permissions?._allowed_sites;
	if (Array.isArray(fromPermissions)) {
		return fromPermissions.filter((id): id is string => typeof id === 'string');
	}

	return [];
}

export function PermissionsProvider({
	children,
	initialCompanyId = null,
}: {
	children: React.ReactNode;
	initialCompanyId?: string | null;
}) {
	const [permissions, setPermissions] = useState<ResourcePermissions | null>(
		null,
	);
	const [isSuperAdmin, setIsSuperAdmin] = useState(false);
	const [obraScope, setObraScope] = useState<ObraScope>(null);
	const [allowedSites, setAllowedSites] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const supabase = createClient();

	const pathname = usePathname();

	useEffect(() => {
		const loadPermissions = async () => {
			try {
				const { data: { session } } = await supabase.auth.getSession();
				if (!session?.user) return;

				const companyId =
					initialCompanyId ??
					document.cookie.match(/(^| )selectedCompanyId=([^;]+)/)?.[2] ??
					null;

				if (!companyId) {
					setPermissions({});
					setObraScope(null);
					setAllowedSites([]);
					setLoading(false);
					return;
				}

				const { data: profileData } = await supabase
					.from('profiles')
					.select('is_super_admin')
					.eq('id', session.user.id)
					.maybeSingle();

				if (profileData?.is_super_admin) {
					setIsSuperAdmin(true);
					setPermissions(null);
					setObraScope('ALL');
					setAllowedSites([]);
					setLoading(false);
					return;
				}

				const { data: accessData } = await supabase
					.from('company_users')
					.select('role, profile_id')
					.eq('user_id', session.user.id)
					.eq('company_id', companyId)
					.maybeSingle();

				if (accessData?.role === 'ADMIN') {
					setIsSuperAdmin(true);
					setPermissions(null);
					setObraScope('ALL');
					setAllowedSites([]);
					setLoading(false);
					return;
				}

				setIsSuperAdmin(false);

				if (!accessData?.profile_id) {
					setPermissions({});
					setObraScope(null);
					setAllowedSites([]);
					setLoading(false);
					return;
				}

				const { data: profilePermissions } = await supabase
					.from('access_profiles')
					.select('permissions, obra_scope, allowed_sites')
					.eq('id', accessData.profile_id)
					.single();

				const rawPermissions = profilePermissions?.permissions as
					| Record<string, Partial<PermissionActions>>
					| null
					| undefined;
				const permMap: ResourcePermissions = {};

				if (rawPermissions && typeof rawPermissions === 'object') {
					Object.keys(rawPermissions).forEach((resource) => {
						if (resource.startsWith('_')) return;

						permMap[resource] = {
							view: !!rawPermissions[resource]?.view,
							create: !!rawPermissions[resource]?.create,
							edit: !!rawPermissions[resource]?.edit,
							delete: !!rawPermissions[resource]?.delete,
						};
					});
				}

				const scope = profilePermissions?.obra_scope as string | null | undefined;
				setObraScope(scope === 'ALL' || !scope ? 'ALL' : 'SELECTED');
				setAllowedSites(
					parseAllowedSitesFromProfile(
						profilePermissions as Record<string, unknown> | null,
					),
				);
				setPermissions(permMap);
			} catch (error) {
				console.error('Error loading permissions:', error);
				setPermissions({});
				setObraScope(null);
				setAllowedSites([]);
			} finally {
				setLoading(false);
			}
		};

		loadPermissions();
	}, [pathname, initialCompanyId]);

	const can = useCallback(
		(resource: string, action: keyof PermissionActions): boolean => {
			if (isSuperAdmin) return true;
			if (!permissions) return false;

			if (permissions[resource]) {
				return !!permissions[resource][action];
			}

			return false;
		},
		[isSuperAdmin, permissions],
	);

	const canAccessSite = useCallback(
		(siteId: string): boolean => {
			if (isSuperAdmin) return true;
			if (!siteId || obraScope === null) return false;
			if (obraScope === 'ALL') return true;
			return allowedSites.includes(siteId);
		},
		[isSuperAdmin, obraScope, allowedSites],
	);

	return (
		<PermissionsContext.Provider
			value={{
				permissions,
				isSuperAdmin,
				obraScope,
				allowedSites,
				loading,
				can,
				canAccessSite,
			}}
		>
			{children}
		</PermissionsContext.Provider>
	);
}

export function usePermissions() {
	return useContext(PermissionsContext);
}
