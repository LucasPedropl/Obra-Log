import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
	LayoutDashboard,
	Users,
	Settings,
	Server,
	ChevronLeft,
	ChevronRight,
} from 'lucide-react';
import { supabase } from '../../config/supabase';

const navItems = [
	{ icon: LayoutDashboard, label: 'Visão Geral', path: '/admin/dashboard' },
	{ icon: Users, label: 'Empresas', path: '/admin/empresas' },
];

const adminItems = [
	{ icon: Server, label: 'Infraestrutura', path: '/admin/infraestrutura' },
	{ icon: Settings, label: 'Configurações', path: '/admin/configuracoes' },
];

export const Sidebar = ({ isOpen = true, sidebarMode, onModeChange }: any) => {
	const [userProfile, setUserProfile] = useState<{
		displayName: string;
		role: string;
	} | null>(null);

	useEffect(() => {
		const fetchUser = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (session?.user) {
				const { data } = await supabase
					.from('users')
					.select('full_name, is_super_admin')
					.eq('id', session.user.id)
					.maybeSingle();
				setUserProfile({
					displayName:
						data?.full_name ||
						session.user.email?.split('@')[0] ||
						'Usuário',
					role: data?.is_super_admin ? 'Super Admin' : 'Admin',
				});
			}
		};
		fetchUser();
	}, []);

	const toggleSidebar = () => {
		onModeChange(isOpen ? 'closed' : 'open');
	};

	return (
		<aside
			className={`relative h-screen bg-[#0f172a] text-slate-300 flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-20'}`}
		>
			{/* Botão de abrir/fechar */}
			<button
				onClick={toggleSidebar}
				className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-white border border-slate-700 hover:bg-blue-600 hover:border-blue-600 transition-colors z-50 shadow-md"
			>
				{isOpen ? (
					<ChevronLeft size={14} />
				) : (
					<ChevronRight size={14} />
				)}
			</button>

			<div
				className={`flex items-center ${isOpen ? 'justify-start px-6' : 'justify-center'} py-6 min-h-[80px]`}
			>
				<div className="w-8 h-8 shrink-0 bg-blue-600 rounded flex items-center justify-center">
					<div className="w-3 h-3 bg-white rotate-45" />
				</div>
				{isOpen && (
					<span className="ml-3 text-white text-xl font-bold tracking-wide transition-opacity duration-300">
						Obralog
					</span>
				)}
			</div>

			<nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto overflow-x-hidden">
				{navItems.map((item) => (
					<NavLink
						key={item.path}
						to={item.path}
						className={({ isActive }) =>
							`flex items-center ${isOpen ? 'px-4 justify-start' : 'justify-center'} py-3 rounded-lg transition-colors ${
								isActive
									? 'bg-blue-600 text-white font-medium'
									: 'hover:bg-slate-800 hover:text-white'
							}`
						}
						title={!isOpen ? item.label : undefined}
					>
						<item.icon className="w-5 h-5 shrink-0" />
						{isOpen && <span className="ml-3">{item.label}</span>}
					</NavLink>
				))}

				<div className="pt-6 pb-2">
					{isOpen ? (
						<p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
							Administração
						</p>
					) : (
						<div className="w-full flex justify-center">
							<div className="w-8 h-px bg-slate-700"></div>
						</div>
					)}
				</div>

				{adminItems.map((item) => (
					<NavLink
						key={item.path}
						to={item.path}
						className={({ isActive }) =>
							`flex items-center ${isOpen ? 'px-4 justify-start' : 'justify-center'} py-3 rounded-lg transition-colors ${
								isActive
									? 'bg-blue-600 text-white font-medium'
									: 'hover:bg-slate-800 hover:text-white'
							}`
						}
						title={!isOpen ? item.label : undefined}
					>
						<item.icon className="w-5 h-5 shrink-0" />
						{isOpen && <span className="ml-3">{item.label}</span>}
					</NavLink>
				))}
			</nav>

			<div className="p-4 mt-auto">
				<div
					className={`flex items-center ${isOpen ? 'px-4 justify-start gap-3' : 'justify-center'} py-3 bg-slate-800/50 rounded-lg overflow-hidden`}
				>
					<div className="w-10 h-10 shrink-0 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
						{userProfile?.displayName?.charAt(0)?.toUpperCase() ||
							'U'}
					</div>
					{isOpen && (
						<div className="min-w-0">
							<p className="text-sm font-medium text-white truncate capitalize">
								{userProfile?.displayName || 'Carregando...'}
							</p>
							<p className="text-xs text-slate-400 truncate">
								{userProfile?.role || ''}
							</p>
						</div>
					)}
				</div>
			</div>
		</aside>
	);
};
