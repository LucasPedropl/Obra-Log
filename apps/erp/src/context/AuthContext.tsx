import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { User } from '@supabase/supabase-js';

// Types representing our permissions JSON structure
interface PermissionActions {
	view: boolean;
	create: boolean;
	edit: boolean;
	delete: boolean;
}

interface ObraPermission extends PermissionActions {
	access_type: 'all' | 'specific';
}

export interface PermissionsJSON {
	obras: ObraPermission;
	colaboradores: PermissionActions;
	ferramentas: PermissionActions;
	epis: PermissionActions;
	equip_alugados: PermissionActions;
	movimentacoes: PermissionActions;
	insumos: PermissionActions;
	mao_de_obra: PermissionActions;
	relatorios: PermissionActions;
	usuarios: PermissionActions;
	perfis: PermissionActions;
}

interface AuthContextType {
	user: User | null;
	companyId: string | null;
	profileId: string | null;
	permissions: PermissionsJSON | null;
	allowedSites: string[]; // List of specific UUIDs if access_type is specific
	isLoading: boolean;

	// Helper functions to check limits
	isAllowed: (resource: string, action: keyof PermissionActions) => boolean;
	canAccessSpecificSite: (siteId: string) => boolean;
	refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [companyId, setCompanyId] = useState<string | null>(null);
	const [profileId, setProfileId] = useState<string | null>(null);
	const [permissions, setPermissions] = useState<PermissionsJSON | null>(
		null,
	);
	const [allowedSites, setAllowedSites] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchAuthData = async () => {
		try {
			setIsLoading(true);

			const {
				data: { session },
				error: sessionError,
			} = await supabase.auth.getSession();
			if (sessionError) throw sessionError;

			if (!session || !session.user) {
				setUser(null);
				setCompanyId(null);
				setProfileId(null);
				setPermissions(null);
				setAllowedSites([]);
				setIsLoading(false);
				return;
			}

			setUser(session.user);

			// Pega o companyId ativo do storage (setado no SelectCompany.tsx)
			const currentCompanyId = localStorage.getItem('selectedCompanyId');
			setCompanyId(currentCompanyId);

			if (currentCompanyId) {
				// 1. Busca detalhes da empresa para saber se é uma instância filha
				const { data: companyRecord } = await supabase
					.from('companies')
					.select('parent_id')
					.eq('id', currentCompanyId)
					.single();

				const parentId = companyRecord?.parent_id;

				// 2. Tenta buscar a vinculação específica na Instância atual
				let { data: companyUser, error: cuError } = await supabase
					.from('company_users')
					.select('profile_id')
					.eq('user_id', session.user.id)
					.eq('company_id', currentCompanyId)
					.single();

				// 3. Se NÃO ACHOU na instância, e existe uma Empresa Pai, tenta herdar o acesso da Empresa Pai
				if ((cuError || !companyUser) && parentId) {
					const { data: parentUser, error: puError } = await supabase
						.from('company_users')
						.select('profile_id')
						.eq('user_id', session.user.id)
						.eq('company_id', parentId)
						.single();

					if (!puError && parentUser) {
						companyUser = parentUser;
						cuError = null;
					}
				}

				if (!cuError && companyUser) {
					if (companyUser.profile_id) {
						setProfileId(companyUser.profile_id);

						// Busca as permissões no `access_profiles`
						const { data: profile, error: profileError } =
							await supabase
								.from('access_profiles')
								.select('permissions, allowed_sites')
								.eq('id', companyUser.profile_id)
								.single();

						if (!profileError && profile) {
							setPermissions(
								profile.permissions as PermissionsJSON,
							);
							setAllowedSites(profile.allowed_sites || []);
						}
					} else {
						// Se não tem perfil associado, assumimos temporariamente permissões totais
						// para não travar contas antigas ou administradores que ainda não têm perfil setado.
						const fullPerms = {
							dashboard: {
								view: true,
								create: true,
								edit: true,
								delete: true,
							},
							acesso: {
								view: true,
								create: true,
								edit: true,
								delete: true,
							},
							config_dados: {
								view: true,
								create: true,
								edit: true,
								delete: true,
							},
							mao_de_obra: {
								view: true,
								create: true,
								edit: true,
								delete: true,
							},
							obras: {
								view: true,
								create: true,
								edit: true,
								delete: true,
								access_type: 'all',
								pages: {
									visao_geral: {
										view: true,
										create: true,
										edit: true,
										delete: true,
									},
									almoxarifado: {
										view: true,
										create: true,
										edit: true,
										delete: true,
									},
									ferramentas: {
										disponiveis: {
											view: true,
											create: true,
											edit: true,
											delete: true,
										},
										emprestimos: {
											view: true,
											create: true,
											edit: true,
											delete: true,
										},
										historico: {
											view: true,
											create: true,
											edit: true,
											delete: true,
										},
									},
									epis: {
										disponiveis: {
											view: true,
											create: true,
											edit: true,
											delete: true,
										},
										historico: {
											view: true,
											create: true,
											edit: true,
											delete: true,
										},
									},
									equip_alugados: {
										ativos: {
											view: true,
											create: true,
											edit: true,
											delete: true,
										},
										historico: {
											view: true,
											create: true,
											edit: true,
											delete: true,
										},
									},
									movimentacoes: {
										view: true,
										create: true,
										edit: true,
										delete: true,
									},
									colaboradores: {
										view: true,
										create: true,
										edit: true,
										delete: true,
									},
								},
							},
							colaboradores: {
								view: true,
								create: true,
								edit: true,
								delete: true,
							},
							ferramentas: {
								view: true,
								create: true,
								edit: true,
								delete: true,
							},
							epis: {
								view: true,
								create: true,
								edit: true,
								delete: true,
							},
							equip_alugados: {
								view: true,
								create: true,
								edit: true,
								delete: true,
							},
							movimentacoes: {
								view: true,
								create: true,
								edit: true,
								delete: true,
							},
							insumos: {
								view: true,
								create: true,
								edit: true,
								delete: true,
							},
							relatorios: {
								view: true,
								create: true,
								edit: true,
								delete: true,
							},
							usuarios: {
								view: true,
								create: true,
								edit: true,
								delete: true,
							},
							perfis: {
								view: true,
								create: true,
								edit: true,
								delete: true,
							},
						};
						setPermissions(fullPerms as PermissionsJSON);
						setAllowedSites([]);
					}
				}
			}
		} catch (error) {
			console.error('Error fetching auth state:', error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchAuthData();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			if (!session) {
				setUser(null);
				setCompanyId(null);
				setProfileId(null);
				setPermissions(null);
				setAllowedSites([]);
				setIsLoading(false);
			} else {
				// Re-fetch to adapt user
				fetchAuthData();
			}
		});

		window.addEventListener('storage', (e) => {
			if (!e.key || e.key === 'selectedCompanyId') {
				fetchAuthData();
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	const isAllowed = (
		resourcePath: string,
		action: keyof PermissionActions,
	): boolean => {
		if (!permissions) {
			return false; // Fail secure
		}

		const pathParts = resourcePath.split('.');
		if (pathParts.length > 1) {
			let current: any = permissions;
			let parentHasAccess = false;

			for (const part of pathParts) {
				if (!current || typeof current !== 'object') {
					current = undefined;
					break;
				}

				// Confere se algum nó "pai" mais alto já concede o acesso livre
				if (current[action] === true) {
					parentHasAccess = true;
				}

				if (part in current) {
					current = current[part];
				} else {
					current = undefined;
					break;
				}
			}

			if (
				current &&
				typeof current === 'object' &&
				current[action] === true
			) {
				return true;
			}

			if (parentHasAccess) {
				return true;
			}

			return false;
		}

		// Faz busca profunda em todo o objeto permissions procurando pelo 'resource' e validando se tem a 'action' === true.
		const checkPermission = (
			obj: any,
			resKey: string,
			act: string,
		): boolean => {
			if (!obj || typeof obj !== 'object') return false;

			if (resKey in obj) {
				const target = obj[resKey];
				// Permitir que target seja true flat
				if (target === true) return true;
				if (target[act] === true) return true;

				const checkAnyTrue = (node: any): boolean => {
					if (!node || typeof node !== 'object') return false;
					if (node[act] === true) return true;
					for (const k in node) {
						if (checkAnyTrue(node[k])) return true;
					}
					return false;
				};

				if (checkAnyTrue(target)) return true;
			}

			for (const key in obj) {
				if (typeof obj[key] === 'object') {
					if (checkPermission(obj[key], resKey, act)) {
						return true;
					}
				}
			}

			return false;
		};

		return checkPermission(permissions, resourcePath, action);
	};

	const canAccessSpecificSite = (siteId: string): boolean => {
		if (!permissions) return false;

		const obrasPerms = permissions.obras;
		if (!obrasPerms || !isAllowed('obras', 'view')) return false;

		if (obrasPerms.access_type === 'all') return true;

		// If specific, check if array includes siteId
		return allowedSites.includes(siteId);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				companyId,
				profileId,
				permissions,
				allowedSites,
				isLoading,
				isAllowed,
				canAccessSpecificSite,
				refreshAuth: fetchAuthData,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
