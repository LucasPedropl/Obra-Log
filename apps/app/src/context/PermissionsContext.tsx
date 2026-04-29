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
				const {
					data: { session },
				} = await supabase.auth.getSession();
				if (!session?.user) return;

				const instanceCookie = document.cookie.match(
					/(^| )selectedCompanyId=([^;]+)/,
				);
				const instanceId = instanceCookie ? instanceCookie[2] : null;

				const accountCookie = document.cookie.match(
					/(^| )parentCompanyId=([^;]+)/,
				);
				const accountId = accountCookie ? accountCookie[2] : null;

				// 1. Verificar Super Admin Global e Admin da Conta
				const [profileRes, accountUserRes] = await Promise.all([
					supabase
						.from('profiles')
						.select('is_super_admin')
						.eq('id', session.user.id)
						.maybeSingle(),
					accountId
						? supabase
								.from('account_users')
								.select('role')
								.eq('user_id', session.user.id)
								.eq('account_id', accountId)
								.eq('role', 'ADMIN')
								.maybeSingle()
						: Promise.resolve({ data: null }),
				]);

				// DETECÇÃO DE USUÁRIO FANTASMA
				if (!profileRes.data && !profileRes.error) {
					console.warn('Usuário autenticado mas sem perfil no banco. Deslogando...');
					await supabase.auth.signOut();
					document.cookie = 'selectedCompanyId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
					window.location.href = '/auth/login';
					return;
				}

				const isGlobalSuper = profileRes.data?.is_super_admin || false;
				const isAccountAdmin = !!accountUserRes.data;
				
				// Se for Admin da Conta ou Super Admin Global, tem permissão total
				if (isGlobalSuper || isAccountAdmin) {
					setIsSuperAdmin(true);
					setPermissions(null); 
					setLoading(false);
					return;
				}

				setIsSuperAdmin(false);

				// 2. Se não é admin, verificar acesso à instância atual
				if (!instanceId) {
					setPermissions({}); 
					setLoading(false);
					return;
				}

				// 3. Buscar perfil na instância atual
				const { data: accessData } = await supabase
					.from('user_instance_access')
					.select('profile_id, access_profiles(permissions)')
					.eq('user_id', session.user.id)
					.eq('instance_id', instanceId)
					.maybeSingle();

				if (!accessData?.access_profiles) {
					setPermissions({});
					setLoading(false);
					return;
				}

				// 4. Carregar permissões do JSONB
				const rawPermissions = accessData.access_profiles.permissions as any;
				const permMap: ResourcePermissions = {};
				
				// O formato do JSONB deve ser { "tasks": { "view": true, "create": true }, ... }
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
				// Em caso de erro crítico (ex: tabela users não existe), deslogar por segurança
				if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116') {
					await supabase.auth.signOut();
					window.location.href = '/auth/login';
				} else {
					setPermissions({});
				}
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
