'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
	LogOut,
	RefreshCcw,
	Loader2,
	Building2,
	ChevronDown,
	ArrowLeft,
	Plus,
	Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/config/supabase';
import { Button } from '../ui/button';
import { getConstructionSitesAdmin } from '@/app/actions/adminActions';

interface UserProfile {
	full_name: string;
	email: string;
	role_title?: string;
	avatar_url?: string;
}

export function Header({
	onMobileMenuToggle,
}: {
	onMobileMenuToggle?: () => void;
}) {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isObraDropdownOpen, setIsObraDropdownOpen] = useState(false);
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
	const [obras, setObras] = useState<{ id: string; name: string }[]>([]);
	const [currentObraName, setCurrentObraName] =
		useState<string>('Carregando Obra...');
	const [loading, setLoading] = useState(true);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const obraDropdownRef = useRef<HTMLDivElement>(null);
	const router = useRouter();
	const pathname = usePathname();
	const supabase = createClient();

	const isObraRoute = pathname?.match(/^\/obras\/([^\/]+)(?:\/|$)/);
	const obraId = isObraRoute ? isObraRoute[1] : null;

	useEffect(() => {
		const loadUserProfile = async () => {
			try {
				const {
					data: { user },
				} = await supabase.auth.getUser();
				if (!user) return;

				const { data: dbProfile } = await supabase
					.from('profiles')
					.select('full_name')
					.eq('id', user.id)
					.single();

				// Get selected instance and parent account
				const instanceCookie = document.cookie.match(
					/(^| )selectedCompanyId=([^;]+)/,
				);
				const selectedInstanceId = instanceCookie ? instanceCookie[2] : null;

				const accountCookie = document.cookie.match(
					/(^| )parentCompanyId=([^;]+)/,
				);
				const selectedAccountId = accountCookie ? accountCookie[2] : null;

				let roleTitle = 'Colaborador';

				if (selectedAccountId) {
					// 1. Tentar Admin da Conta
					const { data: accountAdmin } = await supabase
						.from('account_users')
						.select('role')
						.eq('user_id', user.id)
						.eq('account_id', selectedAccountId)
						.eq('role', 'ADMIN')
						.maybeSingle();

					if (accountAdmin) {
						roleTitle = 'Administrador da Conta';
					} else if (selectedInstanceId) {
						// 2. Se não for admin, buscar o perfil na instância
						const { data: accessData } = await supabase
							.from('user_instance_access')
							.select('access_profiles(name)')
							.eq('user_id', user.id)
							.eq('instance_id', selectedInstanceId)
							.maybeSingle();

						const profileName = (accessData?.access_profiles as any)?.name;
						if (profileName) {
							roleTitle = profileName;
						}
					}

					// Load Obras
					if (selectedInstanceId) {
						try {
							const { data: dbObras } = await supabase
								.from('construction_sites')
								.select('id, name')
								.eq('instance_id', selectedInstanceId);

							if (dbObras) {
								setObras(dbObras);
								if (isObraRoute && obraId) {
									const current = dbObras.find(
										(o) => o.id === obraId,
									);
									if (current) setCurrentObraName(current.name);
									else setCurrentObraName('Obra');
								}
							}
						} catch (err) {
							console.error(err);
						}
					}
				}

				setUserProfile({
					full_name:
						dbProfile?.full_name ||
						user.user_metadata?.full_name ||
						'Usuário',
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

		loadUserProfile();
	}, []);

	// Fecha o dropdown ao clicar fora
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsDropdownOpen(false);
			}
			if (
				obraDropdownRef.current &&
				!obraDropdownRef.current.contains(event.target as Node)
			) {
				setIsObraDropdownOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	const handleLogout = async () => {
		await supabase.auth.signOut();
		document.cookie = 'selectedCompanyId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
		router.push('/auth/login');
		router.refresh();
	};

	const handleChangeInstance = () => {
		// Clear remember cookie so we don't get auto-redirected back
		document.cookie =
			'rememberedInstanceId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
		document.cookie =
			'rememberedParentId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
		router.push('/selecionar-instancia');
	};

	const getInitials = (name: string) => {
		if (!name) return 'A';
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.substring(0, 2)
			.toUpperCase();
	};

	return (
		<header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm z-10 transition-all duration-300">
			{/* Mobile Menu Toggle & Área da Obra */}
			<div className="flex items-center gap-3">
				{onMobileMenuToggle && (
					<button
						onClick={onMobileMenuToggle}
						className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-100 focus:outline-none transition-colors"
						aria-label="Abrir Menu"
					>
						<Menu className="w-5 h-5" />
					</button>
				)}

				{obraId && (
					<div className="flex items-center gap-3 bg-gray-50/50 p-1.5 rounded-lg border border-gray-100">
						<div className="relative" ref={obraDropdownRef}>
							<button
								onClick={() =>
									setIsObraDropdownOpen(!isObraDropdownOpen)
								}
								className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all"
							>
								<Building2 className="w-4 h-4 text-blue-600" />
								<span className="max-w-[120px] sm:max-w-[200px] truncate">
									{currentObraName}
								</span>
								<ChevronDown className="w-4 h-4 text-gray-400" />
							</button>

							{isObraDropdownOpen && (
								<div className="absolute left-0 mt-2 w-64 origin-top-left rounded-md bg-white py-1.5 shadow-lg ring-1 ring-black/5 focus:outline-none transition-all duration-200 ease-out z-50 overflow-y-auto max-h-[300px]">
									<div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80 mb-1 border-b border-gray-100">
										Obras Disponíveis
									</div>
									{obras.length === 0 ? (
										<div className="px-4 py-2 text-sm text-gray-500 italic">
											Nenhuma obra encontrada
										</div>
									) : (
										obras.map((obra) => (
											<button
												key={obra.id}
												onClick={() => {
													router.push(
														`/obras/${obra.id}/visao-geral`,
													);
													setIsObraDropdownOpen(
														false,
													);
													setCurrentObraName(
														obra.name,
													);
												}}
												className={cn(
													'flex items-center w-full px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors text-left',
													obra.id === obraId
														? 'bg-blue-50 font-semibold text-blue-700'
														: 'text-gray-700 font-medium',
												)}
											>
												<span className="truncate">
													{obra.name}
												</span>
											</button>
										))
									)}

									<div className="border-t border-gray-100 my-1"></div>

									<button
										onClick={() => {
											router.push('/obras?novo=true');
											setIsObraDropdownOpen(false);
										}}
										className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors font-medium"
									>
										<Plus className="w-4 h-4 mr-2" />
										Nova Obra
									</button>
									<button
										onClick={() => {
											router.push('/obras');
											setIsObraDropdownOpen(false);
										}}
										className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
									>
										<ArrowLeft className="w-4 h-4 mr-2 text-gray-400" />
										Sair da Obra
									</button>
								</div>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Perfil e Ações do Usuário */}
			<div className="relative" ref={dropdownRef}>
				<button
					onClick={() => setIsDropdownOpen(!isDropdownOpen)}
					className="flex items-center gap-3 focus:outline-none hover:bg-gray-50/80 p-1.5 rounded-lg transition-colors border border-transparent hover:border-gray-100"
				>
					<div className="text-right hidden sm:block">
						<p className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">
							{userProfile?.full_name || 'Carregando...'}
						</p>
						<p className="text-xs font-medium text-gray-500 leading-none mt-0.5">
							{userProfile?.role_title || 'Usuário'}
						</p>
					</div>

					<div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors border border-gray-200 shadow-sm overflow-hidden shrink-0">
						{loading ? (
							<Loader2 className="h-4 w-4 animate-spin text-white/70" />
						) : userProfile?.avatar_url ? (
							<img
								src={userProfile.avatar_url}
								alt={userProfile.full_name}
								className="h-full w-full object-cover"
							/>
						) : (
							getInitials(userProfile?.full_name || '')
						)}
					</div>
				</button>

				{/* Dropdown Menu */}
				<div
					className={cn(
						'absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none transition-all duration-200 ease-out z-50',
						isDropdownOpen
							? 'transform opacity-100 scale-100'
							: 'transform opacity-0 scale-95 pointer-events-none',
					)}
				>
					<div className="px-4 py-3 border-b border-gray-100">
						<p className="text-sm font-medium text-gray-900 truncate">
							{userProfile?.full_name || 'Carregando...'}
						</p>
						<p className="text-xs text-gray-500 truncate mt-0.5">
							{userProfile?.email}
						</p>
					</div>
					<div className="flex flex-col py-1">
						<button
							onClick={handleChangeInstance}
							className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
						>
							<RefreshCcw className="mr-2 h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
							Trocar Instância
						</button>
						<div className="border-t border-gray-100 my-1"></div>
						<button
							onClick={handleLogout}
							className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
						>
							<LogOut className="mr-2 h-4 w-4 text-gray-400 group-hover:text-red-600 transition-colors" />
							Sair
						</button>
					</div>
				</div>
			</div>
		</header>
	);
}
