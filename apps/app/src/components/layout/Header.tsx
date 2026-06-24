'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Icon } from '../ui/Icon';
import { createClient } from '@/config/supabase';
import { Breadcrumbs } from '../shared/Breadcrumbs';
import { HeaderCompanySelector } from './HeaderCompanySelector';
import { HeaderObraSelector } from './HeaderObraSelector';
import { HeaderUserMenu } from './HeaderUserMenu';
import { clearTenantCookiesAction } from '@/app/actions/tenantActions';
import { useTenant } from '@/context/TenantContext';

interface UserProfile {
	full_name: string;
	email: string;
	role_title?: string;
	avatar_url?: string;
}

interface CompanyOption {
	id: string;
	name: string;
}

export function Header({
	onMobileMenuToggle,
	onToggleSidebar,
}: {
	onMobileMenuToggle?: () => void;
	onToggleSidebar?: () => void;
}) {
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
	const [companyName, setCompanyName] = useState('');
	const [myCompanies, setMyCompanies] = useState<CompanyOption[]>([]);
	const [loading, setLoading] = useState(true);
	const router = useRouter();
	const pathname = usePathname();
	const supabase = createClient();
	const { companyId: tenantCompanyId } = useTenant();

	useEffect(() => {
		const loadData = async () => {
			try {
				const { data: { user } } = await supabase.auth.getUser();
				if (!user) return;

				const { data: dbProfile } = await supabase
					.from('profiles')
					.select('full_name')
					.eq('id', user.id)
					.single();

				const companyId =
					tenantCompanyId ??
					document.cookie.match(/(^| )selectedCompanyId=([^;]+)/)?.[2] ??
					null;

				const { data: userCompanies } = await supabase
					.from('company_users')
					.select('company_id, companies(id, name)')
					.eq('user_id', user.id);

				if (userCompanies) {
					const formatted = userCompanies
						.map((uc) => {
							const company = uc.companies as CompanyOption | CompanyOption[] | null;
							return Array.isArray(company) ? company[0] : company;
						})
						.filter(Boolean) as CompanyOption[];
					setMyCompanies(formatted);

					if (companyId) {
						const current = formatted.find((c) => c.id === companyId);
						if (current) setCompanyName(current.name);
					}
				}

				let roleTitle = 'Colaborador';
				if (companyId) {
					const { data: accessData } = await supabase
						.from('company_users')
						.select('role, profile_id')
						.eq('user_id', user.id)
						.eq('company_id', companyId)
						.maybeSingle();

					if (accessData) {
						if (accessData.role === 'ADMIN') {
							roleTitle = 'Administrador';
						} else if (accessData.profile_id) {
							const { data: profileData } = await supabase
								.from('access_profiles')
								.select('name')
								.eq('id', accessData.profile_id)
								.single();
							if (profileData?.name) roleTitle = profileData.name;
						}
					}
				}

				setUserProfile({
					full_name: dbProfile?.full_name || user.user_metadata?.full_name || 'Usuário',
					email: user.email || '',
					role_title: roleTitle,
					avatar_url: user.user_metadata?.avatar_url || '',
				});
			} catch (error) {
				console.error('Error loading user profile', error);
			} finally {
				setLoading(false);
			}
		};
		loadData();
	}, [pathname, tenantCompanyId]);

	const handleLogout = async () => {
		await supabase.auth.signOut();
		await clearTenantCookiesAction();
		router.push('/auth/login');
		router.refresh();
	};

	const handleChangeCompany = async () => {
		await clearTenantCookiesAction();
		router.push('/empresas');
	};

	const getInitials = (name: string) => {
		if (!name) return 'U';
		return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
	};

	return (
		<header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 z-10 transition-all duration-300">
			<div className="flex items-center gap-2 min-w-0 flex-1">
				<div className="flex items-center shrink-0">
					{onToggleSidebar && (
						<button
							onClick={onToggleSidebar}
							className="hidden md:flex p-2 text-gray-500 hover:text-gray-900 rounded-none hover:bg-gray-100 focus:outline-none transition-colors"
						>
							<Icon name="List" size={20} />
						</button>
					)}
					{onMobileMenuToggle && (
						<button
							onClick={onMobileMenuToggle}
							className="md:hidden p-2 text-gray-500 hover:text-gray-900 rounded-none hover:bg-gray-100 focus:outline-none transition-colors"
						>
							<Icon name="List" size={20} />
						</button>
					)}
				</div>

				<div className="h-6 w-px bg-gray-200 mx-1 hidden md:block shrink-0" />

				<HeaderCompanySelector
					companyName={companyName}
					myCompanies={myCompanies}
					getInitials={getInitials}
				/>

				<div className="h-6 w-px bg-gray-200 mx-2 hidden md:block shrink-0" />

				<HeaderObraSelector />

				<div className="h-6 w-px bg-gray-200 mx-2 hidden lg:block shrink-0" />

				<Breadcrumbs companyName={companyName} className="hidden lg:flex" />
			</div>

			<div className="flex items-center justify-end gap-4 shrink-0">
				<div className="max-w-xs hidden md:block">
					<div className="relative group">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
							<Icon name="MagnifyingGlass" size={20} />
						</div>
						<input
							type="text"
							placeholder="Pesquisar..."
							className="block w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-none bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
						/>
					</div>
				</div>

				<div className="hidden md:block h-8 w-px bg-gray-200 mx-2" />

				<div className="flex items-center gap-2">
					<button title="Ajuda" className="p-2 text-gray-500 hover:text-gray-900 rounded-none hover:bg-gray-100 transition-colors">
						<Icon name="Question" size={22} />
					</button>
					<button title="Configurações" className="p-2 text-gray-500 hover:text-gray-900 rounded-none hover:bg-gray-100 transition-colors">
						<Icon name="Gear" size={22} />
					</button>
					<button title="Notificações" className="p-2 text-gray-500 hover:text-gray-900 rounded-none hover:bg-gray-100 transition-colors relative mr-2 group">
						<Icon name="Bell" size={22} className="group-hover:shake transition-transform" />
						<span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-none border-2 border-white shadow-sm" />
					</button>

					<HeaderUserMenu
						userProfile={userProfile}
						loading={loading}
						getInitials={getInitials}
						onChangeCompany={handleChangeCompany}
						onLogout={handleLogout}
					/>
				</div>
			</div>
		</header>
	);
}
