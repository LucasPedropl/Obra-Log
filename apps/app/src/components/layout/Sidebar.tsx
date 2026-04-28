'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
	LayoutDashboard,
	Building2,
	PackageOpen,
	Users,
	ChevronLeft,
	ChevronRight,
	Settings,
	Package,
	ArrowRightLeft,
	HardHat,
	Wrench,
	Truck,
	ShieldCheck,
	ChevronDown,
	X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

interface SidebarProps {
	isOpen: boolean;
	onToggleSidebar: () => void;
	isMobileOpen?: boolean;
	onMobileClose?: () => void;
	isInObraRoute?: boolean;
}

type NavItem = {
	name: string;
	icon: React.ElementType;
	href?: string;
	children?: { name: string; href: string }[];
};

const mainNavItems: NavItem[] = [
	{ name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
	{ name: 'Obras', icon: Building2, href: '/obras' },
	{ name: 'Insumos', icon: PackageOpen, href: '/insumos' },
	{ name: 'Colaboradores', icon: Users, href: '/colaboradores' },
	{
		name: 'Acesso ao Sistema',
		icon: ShieldCheck,
		children: [
			{ name: 'Perfis de Acesso', href: '/acesso/perfis' },
			{ name: 'Usuários', href: '/acesso/usuarios' },
		],
	},
];

export function Sidebar({
	isOpen,
	onToggleSidebar,
	isMobileOpen,
	onMobileClose,
	isInObraRoute,
}: SidebarProps) {
	const pathname = usePathname();
	const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
		{},
	);

	const toggleExpand = (name: string) => {
		setExpandedItems((prev) => ({ ...prev, [name]: !prev[name] }));
	};

	// Check if we are inside a specific Obra (e.g. /obras/123/...)
	const isObraRoute = pathname?.match(/^\/obras\/([^\/]+)(?:\/|$)/);
	const obraId = isObraRoute ? isObraRoute[1] : null;

	const navItems: NavItem[] =
		obraId && !isMobileOpen
			? [
					{
						name: 'Visão Geral',
						icon: LayoutDashboard,
						href: `/obras/${obraId}/visao-geral`,
					},
					{
						name: 'Almoxarifado',
						icon: Package,
						href: `/obras/${obraId}/almoxarifado`,
					},
					{
						name: 'Colaboradores (Campo)',
						icon: Users,
						href: `/obras/${obraId}/colaboradores`,
					},

					{
						name: 'Ferramentas',
						icon: Wrench,
						children: [
							{
								name: 'Disponíveis',
								href: `/obras/${obraId}/ferramentas/disponiveis`,
							},
							{
								name: 'Em uso',
								href: `/obras/${obraId}/ferramentas/em-uso`,
							},
							{
								name: 'Histórico',
								href: `/obras/${obraId}/ferramentas/historico`,
							},
						],
					},
					{
						name: 'EPIs',
						icon: HardHat,
						children: [
							{
								name: 'Disponíveis',
								href: `/obras/${obraId}/epis/disponiveis`,
							},
							{
								name: 'Histórico',
								href: `/obras/${obraId}/epis/historico`,
							},
						],
					},
					{
						name: 'Equip. Alugados',
						icon: Truck,
						children: [
							{
								name: 'Ativos',
								href: `/obras/${obraId}/equip-alugados/ativos`,
							},
							{
								name: 'Histórico',
								href: `/obras/${obraId}/equip-alugados/historico`,
							},
						],
					},
					{
						name: 'Movimentações',
						icon: ArrowRightLeft,
						href: `/obras/${obraId}/movimentacoes`,
					},
				]
			: mainNavItems;

	return (
		<>
			{/* Mobile Backdrop */}
			{isMobileOpen && (
				<div
					className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden"
					onClick={onMobileClose}
				/>
			)}

			<aside
				className={cn(
					'relative z-[70] flex h-full flex-col bg-[#101828] text-white transition-all duration-300 ease-in-out select-none',
					// Desktop logic
					'hidden md:flex',
					isOpen ? 'md:w-64' : 'md:w-20',
					// Mobile logic
					isMobileOpen
						? 'fixed inset-y-0 left-0 flex w-64 translate-x-0'
						: 'fixed inset-y-0 left-0 w-64 -translate-x-full md:relative md:translate-x-0',
					// Hide on mobile if inside Obra route (handled by bottom menu)
					isInObraRoute && !isMobileOpen ? '!hidden md:!flex' : '',
				)}
			>
				{/* Logo / Header da Sidebar com altura ampliada e separador */}
				<div
					className={cn(
						'flex items-center relative h-[88px] border-b border-gray-800 transition-all px-4',
						isOpen || isMobileOpen
							? 'justify-start'
							: 'justify-center',
					)}
				>
					{/* Close button on Mobile */}
					{isMobileOpen && (
						<button
							onClick={onMobileClose}
							className="absolute right-4 p-2 text-gray-400 hover:text-white md:hidden"
						>
							<X size={20} />
						</button>
					)}

					{/* Ícone da Empresa */}
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="#F29C1F"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M3 21h18M5 21V7l8-4v18" stroke="#ffffff" />
							<path
								d="M11 21L21 6m0 0v5m0-5h-5"
								stroke="#F29C1F"
							/>
						</svg>
					</div>

					{/* Nome Empresa (oculta se fechado) */}
					<span
						className={cn(
							'ml-3 overflow-hidden whitespace-nowrap font-bold text-lg transition-all duration-300 ease-in-out block tracking-wide',
							isOpen || isMobileOpen
								? 'opacity-100 max-w-full'
								: 'opacity-0 max-w-0 ml-0',
						)}
					>
						Obra-Log
					</span>

					{/* Botão para encolher/expandir centralizado na linha do separador e borda direita */}
					<button
						onClick={onToggleSidebar}
						className="hidden md:flex absolute -right-3 -bottom-3 h-6 w-6 items-center justify-center rounded-[5px] bg-[#101828] border border-gray-700 text-gray-300 hover:bg-[#1b263b] hover:text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#1b263b]/50 z-50"
						aria-label="Toggle Sidebar"
					>
						{isOpen ? (
							<ChevronLeft size={14} strokeWidth={2.5} />
						) : (
							<ChevronRight size={14} strokeWidth={2.5} />
						)}
					</button>
				</div>

				{/* Navegação - overflow visible para garantir que os tooltips escapem */}
				<nav className="flex-1 space-y-1.5 px-4 py-6 overflow-visible">
					{navItems.map((item) => {
						const hasChildren =
							item.children && item.children.length > 0;
						const isActive =
							(item.href &&
								(pathname === item.href ||
									pathname?.startsWith(item.href))) ||
							(hasChildren &&
								item.children?.some(
									(child) =>
										pathname === child.href ||
										pathname?.startsWith(child.href),
								));
						const isExpanded = expandedItems[item.name];

						const buttonContent = (
							<div
								className={cn(
									'flex items-center rounded-md transition-all duration-200 cursor-pointer',
									isOpen || isMobileOpen
										? 'px-3 py-2.5 justify-start'
										: 'h-10 w-10 mx-auto justify-center',
									isActive
										? 'bg-white/10 text-white font-medium'
										: 'text-gray-400 hover:bg-white/5 hover:text-gray-200',
								)}
							>
								<div
									className={cn(
										'flex flex-1 items-center',
										isOpen || isMobileOpen
											? 'justify-between'
											: 'justify-center',
									)}
								>
									<div className="flex items-center justify-center">
										<item.icon
											size={20}
											strokeWidth={isActive ? 2.5 : 2}
											className={cn(
												'shrink-0',
												isActive
													? 'text-white'
													: 'text-gray-400 group-hover:text-gray-200',
											)}
										/>
										<span
											className={cn(
												'ml-3 text-sm overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out',
												isOpen || isMobileOpen
													? 'opacity-100 max-w-[140px]'
													: 'opacity-0 max-w-0 ml-0',
											)}
										>
											{item.name}
										</span>
									</div>

									{hasChildren &&
										(isOpen || isMobileOpen) && (
											<ChevronDown
												size={16}
												className={cn(
													'shrink-0 text-gray-400 transition-transform duration-200',
													isExpanded
														? 'rotate-180'
														: '',
												)}
											/>
										)}
								</div>
							</div>
						);

						return (
							<div key={item.name} className="relative group">
								{hasChildren ? (
									<div
										onClick={() =>
											(isOpen || isMobileOpen) &&
											toggleExpand(item.name)
										}
									>
										{buttonContent}
									</div>
								) : (
									<Link
										href={item.href || '#'}
										className="block"
										onClick={onMobileClose}
									>
										{buttonContent}
									</Link>
								)}

								{/* Submenu Inline (quando a barra está aberta e item expandido) */}
								{hasChildren &&
									(isOpen || isMobileOpen) &&
									isExpanded && (
										<div className="mt-1 ml-6 pl-2 border-l border-gray-800 space-y-1">
											{item.children?.map((child) => {
												const isChildActive =
													pathname === child.href ||
													pathname?.startsWith(
														child.href,
													);
												return (
													<Link
														key={child.name}
														href={child.href}
														className="block"
														onClick={onMobileClose}
													>
														<div
															className={cn(
																'px-3 py-2 rounded-md text-sm transition-colors',
																isChildActive
																	? 'text-white bg-white/5 font-medium'
																	: 'text-gray-400 hover:text-gray-200 hover:bg-white/5',
															)}
														>
															{child.name}
														</div>
													</Link>
												);
											})}
										</div>
									)}

								{/* Floating Menu / Tooltip quando Sidebar Fechado */}
								{!(isOpen || isMobileOpen) && (
									<div
										className={cn(
											'absolute left-full top-1/2 -translate-y-1/2 pl-6 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-[100] min-w-max invisible group-hover:visible transition-none group-hover:transition-all group-hover:duration-300',
										)}
									>
										<div
											className={cn(
												'rounded-md bg-[#1f2937] shadow-xl overflow-hidden ring-1 ring-gray-700/50 pointer-events-auto',
												hasChildren
													? 'py-1'
													: 'px-3 py-1.5',
											)}
										>
											{hasChildren ? (
												<div className="flex flex-col">
													<div className="px-4 py-2 border-b border-gray-700 text-xs font-bold text-gray-400 uppercase tracking-wider">
														{item.name}
													</div>
													{item.children?.map(
														(child) => (
															<Link
																key={child.name}
																href={
																	child.href
																}
																className="block"
															>
																<div className="px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-700 hover:text-white transition-colors">
																	{child.name}
																</div>
															</Link>
														),
													)}
												</div>
											) : (
												<span className="text-xs font-semibold text-white whitespace-nowrap">
													{item.name}
												</span>
											)}
										</div>
									</div>
								)}
							</div>
						);
					})}
				</nav>

				{/* Footer / Configurações */}
				<div className="border-t border-gray-800 p-4 shrink-0 overflow-visible">
					<div className="relative group">
						<Link href="/configuracoes" className="block">
							<div
								className={cn(
									'flex items-center rounded-md transition-all duration-200',
									isOpen
										? 'px-3 py-2.5 justify-start'
										: 'h-10 w-10 mx-auto justify-center',
									pathname === '/configuracoes' ||
										pathname?.startsWith('/configuracoes')
										? 'bg-white/10 text-white font-medium'
										: 'text-gray-400 hover:bg-white/5 hover:text-gray-200',
								)}
							>
								<Settings
									size={20}
									strokeWidth={
										pathname?.startsWith('/configuracoes')
											? 2.5
											: 2
									}
									className={cn(
										'shrink-0',
										pathname?.startsWith('/configuracoes')
											? 'text-white'
											: 'text-gray-400 group-hover:text-gray-200',
									)}
								/>
								<span
									className={cn(
										'ml-3 text-sm overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out',
										isOpen
											? 'opacity-100 max-w-[200px]'
											: 'opacity-0 max-w-0 ml-0',
									)}
								>
									Configurações
								</span>
							</div>
						</Link>

						{/* Tooltip quando Sidebar Fechado */}
						{!isOpen && (
							<div className="absolute left-full top-1/2 -translate-y-1/2 pl-6 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-[100] min-w-max invisible group-hover:visible transition-none group-hover:transition-all group-hover:duration-300">
								<div className="rounded-md bg-[#1f2937] px-3 py-1.5 text-xs font-semibold text-white shadow-xl ring-1 ring-gray-700/50 whitespace-nowrap pointer-events-auto">
									Configurações
								</div>
							</div>
						)}
					</div>
				</div>
			</aside>
		</>
	);
}
