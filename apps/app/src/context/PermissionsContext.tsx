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

				const companyCookie = document.cookie.match(
					/(^| )selectedCompanyId=([^;]+)/,
				);
				const companyId = companyCookie ? companyCookie[2] : null;

				// 1. Verificar Super Admin Global e Company Admin
				const [userRes, companyUserRes] = await Promise.all([
					supabase
						.from('users')
						.select('is_super_admin')
						.eq('id', session.user.id)
						.maybeSingle(),
					companyId
						? supabase
								.from('company_users')
								.select('is_company_admin')
								.eq('user_id', session.user.id)
								.eq('company_id', companyId)
								.maybeSingle()
						: Promise.resolve({ data: null }),
				]);

				// DETECÇÃO DE USUÁRIO FANTASMA (Auth OK, mas DB resetado)
				// Se o usuário não existe na tabela pública, deslogamos ele
				if (!userRes.data && !userRes.error) {
					console.warn('Usuário autenticado mas sem perfil no banco. Deslogando...');
					await supabase.auth.signOut();
					window.location.href = '/auth/login';
					return;
				}

				const isSysSuper = userRes.data?.is_super_admin || false;
				const isCompAdmin = companyUserRes.data?.is_company_admin || false;
				
				// Se for Admin da Empresa ou Super Admin, tem permissão total
				if (isSysSuper || isCompAdmin) {
					setIsSuperAdmin(true);
					setPermissions(null); // Null significa acesso irrestrito na nossa lógica
					setLoading(false);
					return;
				}

				setIsSuperAdmin(false);

				// 2. Se não é admin, verificar se está dentro de uma obra (URL: /obras/[siteId]/...)
				const match = pathname?.match(/\/obras\/([a-f0-9\-]+)/i);
				const siteId = match ? match[1] : null;

				if (!siteId) {
					setPermissions({}); // Sem permissões se não estiver numa obra e não for admin
					setLoading(false);
					return;
				}

				// 3. Buscar perfil na instância atual
				const { data: instanceUser } = await supabase
					.from('instance_users')
					.select('profile_id')
					.eq('user_id', session.user.id)
					.eq('instance_id', siteId)
					.eq('status', 'ACTIVE')
					.maybeSingle();

				if (!instanceUser?.profile_id) {
					setPermissions({});
					setLoading(false);
					return;
				}

				// 4. Buscar permissões granulares da nova tabela
				const { data: permsData } = await supabase
					.from('profile_permissions')
					.select('permission_key')
					.eq('profile_id', instanceUser.profile_id);

				const permMap: ResourcePermissions = {};
				
				if (permsData) {
					permsData.forEach((p: { permission_key: string }) => {
						const parts = p.permission_key.split('.');
						if (parts.length === 2) {
							const resource = parts[0];
							const action = parts[1] as keyof PermissionActions;
							if (!permMap[resource]) {
								permMap[resource] = { view: false, create: false, edit: false, delete: false };
							}
							permMap[resource][action] = true;
						}
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
