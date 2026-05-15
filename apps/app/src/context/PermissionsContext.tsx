'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/config/supabase';
import { usePathname } from 'next/navigation';

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

	const pathname = usePathname();

	useEffect(() => {
		const loadPermissions = async () => {
			try {
				const { data: { session } } = await supabase.auth.getSession();
				if (!session?.user) return;

				const companyCookie = document.cookie.match(/(^| )selectedCompanyId=([^;]+)/);
				const companyId = companyCookie ? companyCookie[2] : null;

				if (!companyId) {
					setPermissions({});
					setLoading(false);
					return;
				}

				// 1. Verificar Perfil Global (Super Admin do Sistema)
				const { data: profileData } = await supabase
					.from('profiles')
					.select('is_super_admin')
					.eq('id', session.user.id)
					.maybeSingle();

				if (profileData?.is_super_admin) {
					setIsSuperAdmin(true);
					setPermissions(null);
					setLoading(false);
					return;
				}

				// 2. Buscar vínculo do usuário com a empresa selecionada
				const { data: accessData } = await supabase
					.from('company_users')
					.select('role, profile_id')
					.eq('user_id', session.user.id)
					.eq('company_id', companyId)
					.maybeSingle();

				// Se for Admin da Empresa, tem permissão total dentro dela
				if (accessData?.role === 'ADMIN') {
					setIsSuperAdmin(true);
					setPermissions(null);
					setLoading(false);
					return;
				}

				setIsSuperAdmin(false);

				// 3. Se for usuário restrito, carregar permissões do perfil
				if (!accessData?.profile_id) {
					setPermissions({});
					setLoading(false);
					return;
				}

				const { data: profilePermissions } = await supabase
					.from('access_profiles')
					.select('permissions')
					.eq('id', accessData.profile_id)
					.single();

				const rawPermissions = profilePermissions?.permissions as any;
				const permMap: ResourcePermissions = {};
				
				if (rawPermissions && typeof rawPermissions === 'object') {
					Object.keys(rawPermissions).forEach(resource => {
						permMap[resource] = {
							view: !!rawPermissions[resource]?.view,
							create: !!rawPermissions[resource]?.create,
							edit: !!rawPermissions[resource]?.edit,
							delete: !!rawPermissions[resource]?.delete,
						};
					});
				}

				setPermissions(permMap);

			} catch (error) {
				console.error('Error loading permissions:', error);
				setPermissions({});
			} finally {
				setLoading(false);
			}
		};

		loadPermissions();
	}, [pathname]);

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
