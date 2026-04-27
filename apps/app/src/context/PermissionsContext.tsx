'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/config/supabase';

export type PermissionActions = {
	view: boolean;
	create: boolean;
	edit: boolean;
	delete: boolean;
};

export type ResourcePermissions = Record<string, PermissionActions>;

interface PermissionsContextData {
	permissions: ResourcePermissions | null;
	isSuperAdmin: boolean;
	loading: boolean;
	can: (resource: string, action: keyof PermissionActions) => boolean;
}

const PermissionsContext = createContext<PermissionsContextData>({
	permissions: null,
	isSuperAdmin: false,
	loading: true,
	can: () => false,
});

export function PermissionsProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [permissions, setPermissions] = useState<ResourcePermissions | null>(
		null,
	);
	const [isSuperAdmin, setIsSuperAdmin] = useState(false);
	const [loading, setLoading] = useState(true);
	const supabase = createClient();

	useEffect(() => {
		const loadPermissions = async () => {
			try {
				const {
					data: { session },
					error,
				} = await supabase.auth.getSession();
				if (!session?.user) return;

				const companyCookie = document.cookie.match(
					/(^| )selectedCompanyId=([^;]+)/,
				);
				const companyId = companyCookie ? companyCookie[2] : null;

				const [userRes, profileRes] = await Promise.all([
					supabase
						.from('users')
						.select('is_super_admin')
						.eq('id', session.user.id)
						.maybeSingle(),
					companyId
						? supabase
								.from('company_users')
								.select(
									'profile_id, access_profiles(permissions)',
								)
								.eq('user_id', session.user.id)
								.eq('company_id', companyId)
								.maybeSingle()
						: Promise.resolve({ data: null }),
				]);

				setIsSuperAdmin(userRes.data?.is_super_admin || false);

				if (profileRes.data && profileRes.data.access_profiles) {
					// Supabase PostgREST might return an array if not careful, handle it
					const accessProfile = Array.isArray(
						profileRes.data.access_profiles,
					)
						? profileRes.data.access_profiles[0]
						: profileRes.data.access_profiles;

					if (accessProfile && accessProfile.permissions) {
						const perms = accessProfile.permissions;
						if (Array.isArray(perms)) {
							const permMap: ResourcePermissions = {};
							perms.forEach((p: any) => {
								if (p.resource) {
									permMap[p.resource] = p.actions;
								}
							});
							setPermissions(permMap);
						} else {
							setPermissions(perms as ResourcePermissions);
						}
					} else {
						setPermissions({});
					}
				} else {
					setPermissions({});
				}
			} catch (error) {
				console.error('Error loading permissions:', error);
			} finally {
				setLoading(false);
			}
		};

		loadPermissions();
	}, []);

	const can = (
		resource: string,
		action: keyof PermissionActions,
	): boolean => {
		if (isSuperAdmin) return true;
		if (!permissions) return false;

		if (permissions[resource]) {
			return !!permissions[resource][action];
		}

		return false;
	};

	return (
		<PermissionsContext.Provider
			value={{ permissions, isSuperAdmin, loading, can }}
		>
			{children}
		</PermissionsContext.Provider>
	);
}

export function usePermissions() {
	return useContext(PermissionsContext);
}
