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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/config/supabase';
import { Button } from '../ui/button';

interface UserProfile {
	full_name: string;
	email: string;
	role_title?: string;
}

export function Header() {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isObraDropdownOpen, setIsObraDropdownOpen] = useState(false);
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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

				// Fetch user name and role from companies or users tables
				// First check users table for full name
				const { data: dbUser } = await supabase
					.from('users')
					.select('full_name')
					.eq('id', user.id)
					.single();

				// Get selected company
				const match = document.cookie.match(
					/(^| )selectedCompanyId=([^;]+)/,
				);
				const selectedCompanyId = match ? match[2] : null;

				let roleTitle = 'Administrador';

				if (selectedCompanyId) {
					// Fetch role in this specific company (collaborators table or company_users)
					const { data: collab } = await supabase
						.from('company_users')
						.select('access_profiles(name)')
						.eq('user_id', user.id)
						.eq('company_id', selectedCompanyId)
						.limit(1)
						.maybeSingle();

					const accessProfile = Array.isArray(collab?.access_profiles)
						? collab.access_profiles[0]
						: collab?.access_profiles;

					if (accessProfile && 'name' in accessProfile) {
						roleTitle = (accessProfile as any).name;
					}
				}

				setUserProfile({
					full_name:
						dbUser?.full_name ||
						user.user_metadata?.full_name ||
						'Usuário',
					email: user.email || '',
					role_title: roleTitle,
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
			{/* Área da Obra (visível apenas dentro de uma obra) */}
			<div className="flex items-center gap-3">
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
									Obra em andamento
								</span>
								<ChevronDown className="w-4 h-4 text-gray-400" />
							</button>

							{isObraDropdownOpen && (
								<div className="absolute left-0 mt-2 w-64 origin-top-left rounded-md bg-white py-1.5 shadow-lg ring-1 ring-black/5 focus:outline-none transition-all duration-200 ease-out z-50">
									<div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80 mb-1 border-b border-gray-100">
										Trocar de Obra
									</div>
									<button
										onClick={() => {
											router.push('/obras');
											setIsObraDropdownOpen(false);
										}}
										className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium"
									>
										Obra Principal
									</button>
									<button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium">
										Residencial Torres
									</button>
								</div>
							)}
						</div>

						<div className="h-4 w-px bg-gray-300 mx-1"></div>

						<Button
							variant="outline"
							size="sm"
							onClick={() => router.push('/obras')}
							className="h-8 shadow-none bg-white text-gray-600 hover:text-gray-900 border-gray-200 hover:bg-gray-50 hidden sm:flex"
						>
							<ArrowLeft className="w-3.5 h-3.5 mr-2" />
							Sair da Obra
						</Button>

						<Button
							variant="default"
							size="sm"
							onClick={() => router.push('/obras?novo=true')}
							className="h-8 shadow-none bg-blue-600 hover:bg-blue-700 text-white rounded-[5px]"
						>
							<Plus className="w-3.5 h-3.5 sm:mr-1.5" />
							<span className="hidden sm:inline">Nova Obra</span>
						</Button>
					</div>
				)}
			</div>

			{/* Perfil e Ações do Usuário */}
			<div className="flex items-center gap-4">
				<div className="text-right hidden sm:block">
					<p className="text-sm font-medium text-gray-500 leading-none">
						{userProfile?.role_title || 'Usuário Logado'}
					</p>
				</div>

				<div className="relative" ref={dropdownRef}>
					<button
						onClick={() => setIsDropdownOpen(!isDropdownOpen)}
						className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
					>
						{loading ? (
							<Loader2 className="h-4 w-4 animate-spin text-white/70" />
						) : (
							getInitials(userProfile?.full_name || '')
						)}
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
			</div>
		</header>
	);
}
