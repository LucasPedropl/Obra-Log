'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MaterialIcon } from '../ui/MaterialIcon';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { createClient } from '@/config/supabase';

interface SidebarProps {
	isOpen: boolean;
	onToggleSidebar: () => void;
	isMobileOpen?: boolean;
	onMobileClose?: () => void;
	isInObraRoute?: boolean;
}

type NavItem = {
	name: string;
	icon: string;
	href?: string;
	children?: { name: string; href: string }[];
};

const mainNavItems: NavItem[] = [
	{ name: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
	{ name: 'Obras', icon: 'apartment', href: '/obras' },
	{ name: 'Insumos', icon: 'package_2', href: '/insumos' },
	{ name: 'Colaboradores', icon: 'group', href: '/colaboradores' },
	{
		name: 'Acesso ao Sistema',
		icon: 'verified_user',
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
	const router = useRouter();
	const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
		{},
	);
	const [companyName, setCompanyName] = useState<string>('Obra-Log');
	const [obras, setObras] = useState<{ id: string; name: string }[]>([]);
	const [currentObraName, setCurrentObraName] = useState<string>('Carregando...');
	const [isObraSelectOpen, setIsObraSelectOpen] = useState(false);
	const obraSelectRef = React.useRef<HTMLDivElement>(null);
	const supabase = createClient();

	const isObraRoute = pathname?.match(/^\/obras\/([^\/]+)(?:\/|$)/);
	const obraId = isObraRoute ? isObraRoute[1] : null;

	React.useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (obraSelectRef.current && !obraSelectRef.current.contains(event.target as Node)) {
				setIsObraSelectOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	React.useEffect(() => {
		const loadData = async () => {
			const companyCookie = document.cookie.match(/(^| )selectedCompanyId=([^;]+)/);
			const companyId = companyCookie ? companyCookie[2] : null;
			
			if (companyId) {
				// Carregar Nome da Empresa
				const { data: comp } = await supabase.from('companies').select('name').eq('id', companyId).maybeSingle();
				if (comp?.name) setCompanyName(comp.name);

				// Carregar Obras
				const { data: dbObras } = await supabase
					.from('construction_sites')
					.select('id, name')
					.eq('company_id', companyId);

				if (dbObras) {
					setObras(dbObras);
					if (obraId) {
						const current = dbObras.find((o) => o.id === obraId);
						setCurrentObraName(current ? current.name : 'Obra');
					}
				}
			}
		};
		loadData();
	}, [obraId]);

	const toggleExpand = (name: string) => {
		setExpandedItems((prev) => ({ ...prev, [name]: !prev[name] }));
	};


	const navItems: NavItem[] =
		obraId && !isMobileOpen
			? [
					{
						name: 'Visão Geral',
						icon: 'dashboard',
						href: `/obras/${obraId}/visao-geral`,
					},
					{
						name: 'Almoxarifado',
						icon: 'inventory_2',
						href: `/obras/${obraId}/almoxarifado`,
					},
					{
						name: 'Colaboradores (Campo)',
						icon: 'group',
						href: `/obras/${obraId}/colaboradores`,
					},

					{
						name: 'Ferramentas',
						icon: 'build',
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
						icon: 'engineering',
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
						icon: 'local_shipping',
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
						icon: 'swap_horiz',
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
					'relative z-[70] flex h-full flex-col bg-[#101828] text-white transition-[width] duration-300 ease-in-out select-none',
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
						'flex items-center relative h-[88px] border-b border-gray-800 transition-all px-4 shrink-0',
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
							<MaterialIcon icon="close" size={20} />
						</button>
					)}

					{/* Ícone da Empresa */}
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-orange-500/10">
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

					{/* Logo do Sistema */}
					<div
						className={cn(
							'ml-3 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out flex flex-col justify-center',
							isOpen || isMobileOpen
								? 'opacity-100 max-w-full'
								: 'opacity-0 max-w-0 ml-0',
						)}
					>
						<span className="font-bold text-xl leading-none tracking-tight">
							ObraLog
						</span>
						<span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mt-1.5 leading-none">
							ERP Manager
						</span>
					</div>
				</div>

				{/* Seletor de Obra - Estilo Card Premium */}
				{obraId && (
					<div className="relative px-4 mt-6 mb-2 shrink-0" ref={obraSelectRef}>
						<div
							onClick={() => setIsObraSelectOpen(!isObraSelectOpen)}
							className={cn(
								'flex items-center gap-3 border border-gray-800 rounded-none transition-all cursor-pointer hover:bg-white/5 active:scale-[0.98] group',
								isOpen || isMobileOpen ? 'p-2.5' : 'h-12 w-12 mx-auto justify-center p-0'
							)}
						>
							<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none bg-gray-800 text-white font-bold text-xs shadow-inner">
								{currentObraName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
							</div>

							{(isOpen || isMobileOpen) && (
								<>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-bold text-white truncate leading-tight">
											{currentObraName}
										</p>
										<p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
											Obra Ativa
										</p>
									</div>
									<MaterialIcon icon="unfold_more" size={16} className="text-gray-500 group-hover:text-gray-300" />
								</>
							)}
						</div>

						{/* Dropdown do Seletor */}
						{isObraSelectOpen && (
							<div 
								className={cn(
									"absolute mt-2 bg-[#1f2937] border border-gray-700 rounded-none shadow-2xl z-[100] overflow-hidden transition-all animate-in fade-in zoom-in duration-200",
									isOpen || isMobileOpen ? "left-4 right-4" : "left-full ml-2 w-64 top-0"
								)}
							>
								<div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-800/50 border-b border-gray-700">
									Minhas Obras
								</div>
								<div className="max-h-60 overflow-y-auto custom-scrollbar">
									{obras.map((obra) => (
										<button
											key={obra.id}
											onClick={() => {
												router.push(`/obras/${obra.id}/visao-geral`);
												setIsObraSelectOpen(false);
											}}
											className={cn(
												"w-full flex items-center px-4 py-3 text-sm text-left transition-colors hover:bg-blue-600 hover:text-white",
												obra.id === obraId ? "bg-blue-600/10 text-blue-400 font-bold" : "text-gray-300"
											)}
										>
											<span className="truncate">{obra.name}</span>
										</button>
									))}
								</div>
								<div className="border-t border-gray-700 p-1.5 flex flex-col gap-1 bg-gray-800/20">
									<button
										onClick={() => { router.push('/obras?novo=true'); setIsObraSelectOpen(false); }}
										className="flex items-center px-3 py-2 text-xs font-bold text-blue-400 hover:bg-blue-600/10 rounded-none transition-colors"
									>
										<MaterialIcon icon="add" size={14} className="mr-2" /> Adicionar Obra
									</button>
									<button
										onClick={() => { router.push('/obras'); setIsObraSelectOpen(false); }}
										className="flex items-center px-3 py-2 text-xs font-bold text-gray-400 hover:bg-gray-700 rounded-none transition-colors"
									>
										<MaterialIcon icon="apps" size={14} className="mr-2" /> Ver Tudo
									</button>
								</div>
							</div>
						)}
					</div>
				)}

				{/* Navegação - overflow-y-auto para que apenas o menu role */}
				<nav className="flex-1 flex flex-col space-y-1.5 px-4 py-6 overflow-y-auto custom-scrollbar">
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
									'flex items-center rounded-none transition-all duration-200 cursor-pointer',
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
										<MaterialIcon
											icon={item.icon}
											size={20}
											fill={isActive}
											weight={isActive ? 600 : 400}
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
											<MaterialIcon
												icon="expand_more"
												size={18}
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
																'px-3 py-2 rounded-none text-sm transition-colors',
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
												'rounded-none bg-[#1f2937] shadow-xl overflow-hidden ring-1 ring-gray-700/50 pointer-events-auto',
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
									'flex items-center rounded-none transition-all duration-200',
									isOpen
										? 'px-3 py-2.5 justify-start'
										: 'h-10 w-10 mx-auto justify-center',
									pathname === '/configuracoes' ||
										pathname?.startsWith('/configuracoes')
										? 'bg-white/10 text-white font-medium'
										: 'text-gray-400 hover:bg-white/5 hover:text-gray-200',
								)}
							>
								<MaterialIcon
									icon="settings"
									size={20}
									fill={pathname?.startsWith('/configuracoes')}
									weight={pathname?.startsWith('/configuracoes') ? 600 : 400}
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
								<div className="rounded-none bg-[#1f2937] px-3 py-1.5 text-xs font-semibold text-white shadow-xl ring-1 ring-gray-700/50 whitespace-nowrap pointer-events-auto">
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
