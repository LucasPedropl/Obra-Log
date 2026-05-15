'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { MaterialIcon } from '../ui/MaterialIcon';
import { cn } from '@/lib/utils';
import { createClient } from '@/config/supabase';
import { Button } from '../ui/button';

interface UserProfile {
	full_name: string;
	email: string;
	role_title?: string;
	avatar_url?: string;
}

export function Header({
	onMobileMenuToggle,
	onToggleSidebar,
}: {
	onMobileMenuToggle?: () => void;
	onToggleSidebar?: () => void;
}) {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
	const [companyName, setCompanyName] = useState<string>('');
	const [myCompanies, setMyCompanies] = useState<{ id: string, name: string }[]>([]);
	const [loading, setLoading] = useState(true);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const companyDropdownRef = useRef<HTMLDivElement>(null);
	const router = useRouter();
	const pathname = usePathname();
	const supabase = createClient();

	useEffect(() => {
		const loadData = async () => {
			try {
				const { data: { user } } = await supabase.auth.getUser();
				if (!user) return;

				// Carregar Perfil
				const { data: dbProfile } = await supabase
					.from('profiles')
					.select('full_name')
					.eq('id', user.id)
					.single();

				const companyCookie = document.cookie.match(/(^| )selectedCompanyId=([^;]+)/);
				const companyId = companyCookie ? companyCookie[2] : null;

				// Carregar Minhas Empresas
				const { data: userCompanies } = await supabase
					.from('company_users')
					.select('company_id, companies(id, name)')
					.eq('user_id', user.id);

				if (userCompanies) {
					const formatted = userCompanies
						.map((uc: any) => uc.companies)
						.filter(Boolean);
					setMyCompanies(formatted);

					if (companyId) {
						const current = formatted.find((c: any) => c.id === companyId);
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
							
							if (profileData?.name) {
								roleTitle = profileData.name;
							}
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
	}, [pathname]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsDropdownOpen(false);
			}
			if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
				setIsCompanyDropdownOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleLogout = async () => {
		await supabase.auth.signOut();
		document.cookie = 'selectedCompanyId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
		document.cookie = 'rememberedCompanyId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
		router.push('/auth/login');
		router.refresh();
	};

	const handleChangeCompany = () => {
		document.cookie = 'rememberedCompanyId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
		document.cookie = 'selectedCompanyId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
		router.push('/empresas');
	};

	const switchCompany = (id: string) => {
		document.cookie = `selectedCompanyId=${id}; path=/; max-age=31536000`;
		setIsCompanyDropdownOpen(false);
		router.push('/dashboard');
		router.refresh();
	};

	const getInitials = (name: string) => {
		if (!name) return 'U';
		return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
	};

	const hasMultipleCompanies = myCompanies.length > 1;

	return (
		<header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 z-10 transition-all duration-300">
			{/* Lado Esquerdo: Toggle Menu e Identidade da Empresa */}
			<div className="flex items-center gap-2">
				<div className="flex items-center">
					{onToggleSidebar && (
						<button
							onClick={onToggleSidebar}
							className="hidden md:flex p-2 text-gray-500 hover:text-gray-900 rounded-none hover:bg-gray-100 focus:outline-none transition-colors"
						>
							<MaterialIcon icon="menu" size={20} />
						</button>
					)}

					{onMobileMenuToggle && (
						<button
							onClick={onMobileMenuToggle}
							className="md:hidden p-2 text-gray-500 hover:text-gray-900 rounded-none hover:bg-gray-100 focus:outline-none transition-colors"
						>
							<MaterialIcon icon="menu" size={20} />
						</button>
					)}
				</div>

				{/* Divisor vertical sutil entre menu e logo */}
				<div className="h-6 w-px bg-gray-200 mx-1 hidden md:block"></div>

				{/* Identidade da Empresa / Seletor */}
				<div className="relative" ref={companyDropdownRef}>
					<div 
						onClick={() => hasMultipleCompanies && setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
						className={cn(
							"flex items-center gap-2.5 px-2 py-1.5 rounded-none transition-all group",
							hasMultipleCompanies ? "cursor-pointer hover:bg-gray-50 active:scale-[0.98]" : "cursor-default"
						)}
					>
						<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none bg-[#F3F4F6] text-[#101828] border border-gray-300 transition-colors overflow-hidden">
							<span className="text-sm font-bold tracking-wider">
								{getInitials(companyName || 'Obra-Log')}
							</span>
						</div>
						<div className="flex flex-col">
							<div className="flex items-center gap-1">
								<span className="text-[16px] font-semibold text-gray-900 leading-tight tracking-tight">
									{companyName || 'Obra-Log'}
								</span>
								{hasMultipleCompanies && (
									<MaterialIcon icon="expand_more" size={14} className={cn(
										"text-gray-400 transition-transform duration-200",
										isCompanyDropdownOpen ? "rotate-180" : ""
									)} />
								)}
							</div>
							<span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.05em] leading-none mt-0.5">
								Workspace Ativo
							</span>
						</div>
					</div>

					{/* Dropdown de Troca de Empresa */}
					{isCompanyDropdownOpen && (
						<div className="absolute left-0 mt-2 w-72 origin-top-left rounded-none bg-white p-1.5 shadow-2xl ring-1 ring-black/5 z-[60] animate-in fade-in zoom-in duration-200 border border-gray-100">
							<div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
								Trocar de Empresa
							</div>
							<div className="max-h-60 overflow-y-auto custom-scrollbar">
								{myCompanies.map((company) => {
									const isActive = companyName === company.name;
									return (
										<button
											key={company.id}
											onClick={() => switchCompany(company.id)}
											className={cn(
												"w-full flex items-center gap-3 px-3 py-2.5 rounded-none text-sm text-left transition-all mb-0.5 group/item",
												isActive 
													? "bg-blue-600 text-white shadow-md shadow-blue-200" 
													: "text-gray-700 hover:bg-gray-50"
											)}
										>
											<div className={cn(
												"flex h-8 w-8 shrink-0 items-center justify-center rounded-none text-[10px] font-bold border transition-colors",
												isActive 
													? "bg-white/20 border-white/30 text-white" 
													: "bg-gray-100 border-gray-200 text-gray-500 group-hover/item:bg-white"
											)}>
												{getInitials(company.name)}
											</div>
											<span className="flex-1 truncate font-semibold">{company.name}</span>
											{isActive && <MaterialIcon icon="check" size={16} />}
										</button>
									);
								})}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Lado Direito: Pesquisa, Ícones e Perfil */}
			<div className="flex items-center flex-1 justify-end gap-4">
				{/* Barra de Pesquisa */}
				<div className="max-w-xs hidden md:block">
					<div className="relative group">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
							<MaterialIcon icon="search" size={20} />
						</div>
						<input
							type="text"
							placeholder="Pesquisar..."
							className="block w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-none bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
						/>
					</div>
				</div>

				{/* Divisor Vertical */}
				<div className="hidden md:block h-8 w-px bg-gray-200 mx-2"></div>

				{/* Área de Ícones */}
				<div className="flex items-center gap-2">
					<button title="Ajuda" className="p-2 text-gray-500 hover:text-gray-900 rounded-none hover:bg-gray-100 transition-colors">
						<MaterialIcon icon="help_outline" size={22} />
					</button>

					<button title="Configurações" className="p-2 text-gray-500 hover:text-gray-900 rounded-none hover:bg-gray-100 transition-colors">
						<MaterialIcon icon="settings" size={22} />
					</button>

					<button title="Notificações" className="p-2 text-gray-500 hover:text-gray-900 rounded-none hover:bg-gray-100 transition-colors relative mr-2 group">
						<MaterialIcon icon="notifications" size={22} className="group-hover:shake transition-transform" />
						<span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-none border-2 border-white shadow-sm"></span>
					</button>

					{/* Perfil do Usuário */}
					<div className="relative" ref={dropdownRef}>
						<button
							onClick={() => setIsDropdownOpen(!isDropdownOpen)}
							className="flex items-center focus:outline-none hover:bg-gray-50/80 p-1.5 rounded-none transition-colors"
						>
							<div className="flex items-center justify-center h-10 w-10 rounded-none bg-blue-600 text-white font-medium border border-gray-200 shadow-sm overflow-hidden shrink-0">
								{loading ? (
									<MaterialIcon icon="autorenew" size={16} className="animate-spin" />
								) : userProfile?.avatar_url ? (
									<img src={userProfile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
								) : (
									getInitials(userProfile?.full_name || '')
								)}
							</div>
						</button>

						{/* Dropdown de Perfil */}
						<div
							className={cn(
								'absolute right-0 mt-2 w-64 origin-top-right rounded-none bg-white py-1 shadow-lg ring-1 ring-black/5 z-50 transition-all duration-200',
								isDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
							)}
						>
							<div className="px-4 py-3 border-b border-gray-100">
								<p className="text-sm font-bold text-gray-900 truncate">{userProfile?.full_name}</p>
								<p className="text-xs font-medium text-blue-600 truncate mb-1">{userProfile?.role_title}</p>
								<p className="text-[11px] text-gray-500 truncate">{userProfile?.email}</p>
							</div>
							<div className="py-1">
								<button
									onClick={handleChangeCompany}
									className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
								>
									<MaterialIcon icon="sync" size={18} className="mr-2 text-gray-400 group-hover:text-blue-500" />
									Trocar Empresa
								</button>
								<div className="border-t border-gray-100 my-1"></div>
								<button
									onClick={handleLogout}
									className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
								>
									<MaterialIcon icon="logout" size={18} className="mr-2 text-gray-400 group-hover:text-red-600" />
									Sair
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</header>
	);
}
