import React, { useState, useMemo, useRef, useEffect } from 'react';
import { NavLink, useParams, useLocation, useNavigate } from 'react-router-dom';
import { SidebarMode } from './ERPLayout';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { env } from '../../config/env';
import { useToast } from '../../context/ToastContext';
import {
	LayoutDashboard,
	HardHat,
	Settings,
	ChevronLeft,
	ChevronRight,
	Package,
	Wrench,
	Shield,
	Truck,
	ArrowRightLeft,
	ArrowLeft,
	Database,
	Users,
	KeyRound,
	ChevronDown,
	FileText,
	Ruler,
	Tags,
	UserCheck,
	ShieldCheck,
	Clock,
	ClipboardList,
	MonitorCog,
	Building2,
	Plus,
	LayoutDashboard as DashIcon,
} from 'lucide-react';

interface SidebarProps {
	isOpen: boolean;
	sidebarMode: SidebarMode;
	onModeChange: (mode: SidebarMode) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
	isOpen,
	sidebarMode,
	onModeChange,
}) => {
	const location = useLocation();
	const navigate = useNavigate();

	const { showToast } = useToast();
	const [showProjectMenu, setShowProjectMenu] = useState(false);
	const [projects, setProjects] = useState<any[]>([]);
	const [projectName, setProjectName] = useState<string | null>(null);
	const projectMenuRef = useRef<HTMLDivElement>(null);

	const companyId = localStorage.getItem('selectedCompanyId');

	const isProjectRoute =
		location.pathname.includes('/app/obras/') &&
		location.pathname !== '/app/obras/nova';

	const match = location.pathname.match(/\/app\/obras\/([^\/]+)/);
	const projectId = match ? match[1] : null;

	useEffect(() => {
		async function fetchProjectsList() {
			if (!companyId) return;
			try {
				const { data, error } = await supabase
					.from('construction_sites')
					.select('id, name')
					.eq('company_id', companyId);

				if (error) throw error;
				if (data) {
					setProjects(data);
				}
			} catch (error) {
				console.error('Error fetching projects list:', error);
			}
		}

		async function fetchCurrentProject() {
			if (projectId && isProjectRoute) {
				try {
					const { data, error } = await supabase
						.from('construction_sites')
						.select('name')
						.eq('id', projectId)
						.maybeSingle();

					if (error) throw error;
					if (data) {
						setProjectName(data.name);
					} else {
						setProjectName(null);
					}
				} catch (error) {
					console.error('Error fetching project:', error);
					setProjectName(null);
				}
			} else {
				setProjectName(null);
			}
		}

		fetchCurrentProject();
		fetchProjectsList();
	}, [projectId, isProjectRoute, companyId]);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				projectMenuRef.current &&
				!projectMenuRef.current.contains(event.target as Node)
			) {
				setShowProjectMenu(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () =>
			document.removeEventListener('mousedown', handleClickOutside);
	}, []);
	const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
		const saved = localStorage.getItem('erp_expanded_menus');
		return saved ? JSON.parse(saved) : [];
	});

	const [contextMenuPos, setContextMenuPos] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const contextMenuRef = useRef<HTMLDivElement>(null);

	const toggleMenu = (menuId: string) => {
		setExpandedMenus((prev) => {
			const newState = prev.includes(menuId)
				? prev.filter((id) => id !== menuId)
				: [...prev, menuId];
			localStorage.setItem(
				'erp_expanded_menus',
				JSON.stringify(newState),
			);
			return newState;
		});
	};

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				contextMenuRef.current &&
				!contextMenuRef.current.contains(event.target as Node)
			) {
				setContextMenuPos(null);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () =>
			document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		// Only show menu if they right-click the actual empty space (e.currentTarget === e.target)
		// or if we attach it to the entire aside
		setContextMenuPos({ x: e.clientX, y: e.clientY });
	};

	const { isAllowed } = useAuth();

	console.log('[Sidebar] isAllowed obras?', isAllowed('obras', 'view'));
	console.log('[Sidebar] isAllowed usuarios?', isAllowed('usuarios', 'view'));

	const globalNavItemsRaw = [
		{
			name: 'Dashboard',
			path: '/app/dashboard',
			icon: LayoutDashboard,
			alwaysShow: true,
		},
		{
			name: 'Obras',
			path: '/app/obras/nova',
			icon: HardHat,
			resource: 'obras' as const,
		},
		{
			name: 'Insumos',
			path: '/app/config-dados/insumos',
			icon: Package,
			resource: 'insumos' as const,
		},
		{
			name: 'Colaboradores',
			path: '/app/mao-de-obra',
			icon: Users,
			resource: 'mao_de_obra' as const,
		},
		{
			id: 'acesso',
			name: 'Acesso ao sistema',
			icon: KeyRound,
			subItems: [
				{
					name: 'Usuários',
					path: '/app/acesso/usuarios',
					icon: UserCheck,
					resource: 'usuarios' as const,
				},
				{
					name: 'Perfis de acesso',
					path: '/app/acesso/perfis',
					icon: ShieldCheck,
					resource: 'perfis' as const,
				},
			],
		},
	];

	const globalNavItems = globalNavItemsRaw
		.map((item) => {
			if (item.alwaysShow) return item;
			if (item.subItems) {
				const filSubItems = item.subItems.filter((s) =>
					s.resource ? isAllowed(s.resource, 'view') : true,
				);
				if (filSubItems.length > 0) {
					return { ...item, subItems: filSubItems };
				}
				return null;
			}
			if (item.resource && isAllowed(item.resource, 'view')) return item;
			return null;
		})
		.filter(Boolean) as any[];

	const projectNavItemsRaw = [
		{
			name: 'Visão Geral',
			path: `/app/obras/${projectId}/visao-geral`,
			icon: LayoutDashboard,
			alwaysShow: true,
		},
		{
			name: 'Almoxarifado',
			path: `/app/obras/${projectId}/almoxarifado`,
			icon: Package,
			alwaysShow: true,
		},
		{
			id: 'ferramentas',
			name: 'Ferramentas',
			icon: Wrench,
			resource: 'ferramentas' as const,
			subItems: [
				{
					name: 'Disponíveis',
					path: `/app/obras/${projectId}/ferramentas/disponiveis`,
					icon: ClipboardList,
					resource: 'obras.pages.ferramentas.disponiveis' as const,
				},
				{
					name: 'Empréstimos',
					path: `/app/obras/${projectId}/ferramentas/emprestimos`,
					icon: ArrowRightLeft,
					resource: 'obras.pages.ferramentas.emprestimos' as const,
				},
				{
					name: 'Histórico',
					path: `/app/obras/${projectId}/ferramentas/historico`,
					icon: Clock,
					resource: 'obras.pages.ferramentas.historico' as const,
				},
			],
		},
		{
			name: 'Colaboradores',
			path: `/app/obras/${projectId}/colaboradores`,
			icon: Users,
			resource: 'colaboradores' as const,
		},
		{
			id: 'epis',
			name: 'EPIs',
			icon: Shield,
			resource: 'epis' as const,
			subItems: [
				{
					name: 'Disponíveis',
					path: `/app/obras/${projectId}/epis/disponiveis`,
					icon: ClipboardList,
					resource: 'obras.pages.epis.disponiveis' as const,
				},
				{
					name: 'Histórico',
					path: `/app/obras/${projectId}/epis/historico`,
					icon: Clock,
					resource: 'obras.pages.epis.historico' as const,
				},
			],
		},
		{
			id: 'equip-alugados',
			name: 'Equip. Alugados',
			icon: Truck,
			resource: 'equip_alugados' as const,
			subItems: [
				{
					name: 'Ativos',
					path: `/app/obras/${projectId}/equip-alugados/ativos`,
					icon: ClipboardList,
					resource: 'obras.pages.equip_alugados.ativos' as const,
				},
				{
					name: 'Histórico',
					path: `/app/obras/${projectId}/equip-alugados/historico`,
					icon: Clock,
					resource: 'obras.pages.equip_alugados.historico' as const,
				},
			],
		},
		{
			name: 'Movimentações',
			path: `/app/obras/${projectId}/movimentacoes`,
			icon: ArrowRightLeft,
			resource: 'movimentacoes' as const,
		},
	];

	const projectNavItems = projectNavItemsRaw
		.map((item) => {
			if (item.alwaysShow) return item;
			if (item.subItems) {
				const filSubItems = item.subItems.filter((s) =>
					s.resource ? isAllowed(s.resource, 'view') : true,
				);
				if (filSubItems.length > 0) {
					return { ...item, subItems: filSubItems };
				}
				return null;
			}
			if (item.resource && isAllowed(item.resource as any, 'view'))
				return item;
			return null;
		})
		.filter(Boolean) as any[];

	const navItems = isProjectRoute ? projectNavItems : globalNavItems;

	return (
		<aside
			onContextMenu={(e) => {
				// Prevent default if right clicking on the empty background of sidebar
				if (
					e.target === e.currentTarget ||
					(e.target as HTMLElement).tagName === 'ASIDE'
				) {
					handleContextMenu(e);
				}
			}}
			className={`bg-surface border-r border-border h-full transition-all duration-300 flex flex-col relative z-20 hidden md:flex ${isOpen ? 'w-64' : 'w-20'} select-none`}
		>
			<div className="h-20 flex items-center justify-center border-b border-border select-none shrink-0 p-4 relative">
				{isOpen ? (
					<div className="flex items-center gap-3 font-bold text-2xl text-text-main transition-all duration-300">
						<img
							src="/logo.png"
							alt="Logo"
							className="w-[42px] h-[42px] object-contain"
							draggable="false"
						/>
						ObraLog
					</div>
				) : (
					<img
						src="/logo.png"
						alt="Logo"
						className="w-[42px] h-[42px] object-contain transition-all duration-300"
						draggable="false"
					/>
				)}

				{/* Botão no encontro do logo com os menus */}
				<button
					onContextMenu={(e) => {
						e.stopPropagation();
						handleContextMenu(e);
					}}
					onClick={(e) => {
						if (sidebarMode !== 'hover') {
							onModeChange(isOpen ? 'closed' : 'open');
						}
					}}
					className="absolute -bottom-4 -right-4 w-8 h-8 bg-surface border border-border rounded-xl shadow-sm z-30 flex items-center justify-center text-text-muted hover:text-text-main transition-colors hover:bg-background"
					title="Alternar fixação (Clique direito para mais opções)"
				>
					{isOpen ? (
						<ChevronLeft size={18} />
					) : (
						<ChevronRight size={18} />
					)}
				</button>
			</div>

			<nav
				onContextMenu={(e) => {
					// Allow right click if it's on the nav area background
					if (e.target === e.currentTarget) handleContextMenu(e);
				}}
				className={`flex-1 py-4 px-3 space-y-2 ${isOpen ? 'overflow-y-auto overflow-x-hidden' : 'overflow-visible'}`}
			>
				{navItems.map((item) => {
					const isGroupActive =
						item.subItems &&
						item.subItems.some((sub) =>
							location.pathname.startsWith(sub.path),
						);
					return (
						<React.Fragment key={item.name}>
							{item.subItems ? (
								<div className="flex flex-col space-y-1 relative group">
									<button
										onClick={() =>
											item.id && toggleMenu(item.id)
										}
										className={`relative flex items-center justify-between p-3 rounded-lg transition-colors w-full ${
											isGroupActive
												? 'bg-secondary text-white font-medium'
												: 'text-text-muted hover:text-text-main hover:bg-background'
										} ${!isOpen && 'justify-center'}`}
									>
										<div className="flex items-center gap-3">
											<item.icon
												size={22}
												className="shrink-0"
											/>
											{isOpen && (
												<span className="font-medium truncate">
													{item.name}
												</span>
											)}
										</div>
										{isOpen && (
											<ChevronDown
												size={16}
												className={`transition-transform duration-200 ${item.id && expandedMenus.includes(item.id) ? 'rotate-180' : ''}`}
											/>
										)}
									</button>

									{/* Popout menu for closed state - OUTSIDE the button */}
									{!isOpen && (
										<div className="absolute left-full top-0 pl-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 text-left">
											<div className="bg-surface text-text-main text-sm rounded-xl border border-border shadow-xl min-w-[200px] overflow-hidden flex flex-col">
												<div className="px-4 py-3 font-semibold border-b border-border bg-background/50 text-left">
													{item.name}
												</div>
												<div className="py-2 flex flex-col gap-1 px-2">
													{item.subItems.map(
														(subItem) => (
															<NavLink
																key={
																	subItem.path
																}
																to={
																	subItem.path
																}
																draggable={
																	false
																}
																onDragStart={(
																	e,
																) =>
																	e.preventDefault()
																}
																className={({
																	isActive,
																}) =>
																	`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-background transition-colors relative ${
																		isActive
																			? 'bg-secondary/50 text-white font-medium'
																			: 'text-text-muted hover:text-text-main'
																	}`
																}
															>
																{subItem.icon && (
																	<subItem.icon
																		size={
																			16
																		}
																	/>
																)}
																<span className="flex-1 select-none">
																	{
																		subItem.name
																	}
																</span>
															</NavLink>
														),
													)}
												</div>
											</div>
										</div>
									)}

									{isOpen &&
										item.id &&
										expandedMenus.includes(item.id) && (
											<div className="pl-6 pr-2 py-1 space-y-1">
												{item.subItems.map(
													(subItem) => (
														<NavLink
															key={subItem.path}
															to={subItem.path}
															draggable={false}
															onDragStart={(e) =>
																e.preventDefault()
															}
															className={({
																isActive,
															}) =>
																`flex items-center gap-3 py-2 px-3 text-sm rounded-md transition-colors relative ${
																	isActive
																		? 'bg-secondary/50 text-white font-medium'
																		: 'text-text-muted hover:text-text-main hover:bg-background'
																}`
															}
														>
															{subItem.icon && (
																<subItem.icon
																	size={18}
																/>
															)}
															<span className="select-none">
																{subItem.name}
															</span>
														</NavLink>
													),
												)}
											</div>
										)}
								</div>
							) : (
								<NavLink
									key={item.path}
									to={item.path || '#'}
									draggable={false}
									onDragStart={(e) => e.preventDefault()}
									className={({ isActive }) =>
										`group relative flex items-center gap-3 p-3 rounded-lg transition-colors ${
											isActive ||
											(item.path &&
												location.pathname === item.path)
												? 'bg-secondary text-white font-medium'
												: 'text-text-muted hover:text-text-main hover:bg-background'
										} ${!isOpen && 'justify-center'}`
									}
								>
									<item.icon size={22} className="shrink-0" />
									{isOpen && (
										<span className="font-medium truncate select-none">
											{item.name}
										</span>
									)}

									{/* Tooltip for closed state */}
									{!isOpen && (
										<div className="absolute left-full ml-4 px-3 py-2 bg-surface text-text-main text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-border shadow-xl">
											{item.name}
										</div>
									)}
								</NavLink>
							)}
						</React.Fragment>
					);
				})}
			</nav>

			<div className="p-3 border-t border-border relative mt-auto">
				{isProjectRoute && companyId && (
					<div
						className={`transition-all duration-300 ${!isOpen && 'flex justify-center'}`}
					>
						<div className="relative" ref={projectMenuRef}>
							<button
								onClick={() =>
									setShowProjectMenu(!showProjectMenu)
								}
								className={`flex items-center ${isOpen ? 'gap-2 justify-between w-full' : 'justify-center w-10'} hover:bg-background p-2 rounded-lg transition-colors border border-transparent hover:border-border select-none`}
							>
								<div className="flex items-center gap-2 overflow-hidden">
									<div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
										<Building2 size={16} />
									</div>
									{isOpen && (
										<span className="font-semibold text-text-main truncate text-sm">
											{projectName || 'Selecione...'}
										</span>
									)}
								</div>
								{isOpen && (
									<ChevronDown
										size={14}
										className={`text-text-muted transition-transform shrink-0 ${showProjectMenu ? 'rotate-180' : ''}`}
									/>
								)}
							</button>

							{showProjectMenu && (
								<div
									className={`absolute bottom-full mb-2 ${isOpen ? 'left-0 w-64' : 'left-full ml-2 w-56'} bg-surface border border-border shadow-xl rounded-xl overflow-hidden z-50 flex flex-col`}
								>
									<div className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider bg-background border-b border-border">
										Ir para a Obra
									</div>
									<div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col py-1">
										{projects.length > 0 ? (
											projects.map((proj) => (
												<button
													key={proj.id}
													onClick={() => {
														setShowProjectMenu(
															false,
														);
														navigate(
															`/app/obras/${proj.id}/visao-geral`,
														);
													}}
													className={`flex items-center text-left gap-3 px-4 py-2 text-sm hover:bg-background transition-colors ${proj.id === projectId ? 'text-primary font-medium bg-primary/5' : 'text-text-main'}`}
												>
													<HardHat
														size={16}
														className={
															proj.id ===
															projectId
																? 'text-primary'
																: 'text-text-muted shrink-0'
														}
													/>
													<span className="truncate">
														{proj.name}
													</span>
												</button>
											))
										) : (
											<div className="px-4 py-3 text-sm text-text-muted text-center">
												Nenhuma obra cadastrada
											</div>
										)}
									</div>
									<div className="border-t border-border flex flex-col py-1 bg-background/50">
										<button
											onClick={() => {
												setShowProjectMenu(false);
												navigate('/app/obras/nova');
											}}
											className="flex items-center gap-3 px-4 py-2 w-full text-left text-sm text-text-main hover:bg-surface transition-colors"
										>
											<div className="w-5 h-5 rounded flex items-center justify-center bg-primary text-white shrink-0">
												<Plus size={14} />
											</div>
											<span>Nova Obra</span>
										</button>
										<button
											onClick={() => {
												setShowProjectMenu(false);
												navigate('/app/dashboard');
											}}
											className="flex items-center gap-3 px-4 py-2 text-sm text-center text-text-main hover:bg-surface transition-colors border-t border-border/50 mt-1 pt-2"
										>
											<DashIcon
												size={16}
												className="text-text-muted shrink-0"
											/>
											<span>Menu Principal</span>
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Context Menu flutuante */}
			{contextMenuPos && (
				<div
					ref={contextMenuRef}
					style={{
						position: 'fixed',
						top: contextMenuPos.y,
						left: contextMenuPos.x,
					}}
					className="bg-surface border border-border rounded-lg shadow-xl py-2 z-[9999] flex flex-col min-w-[200px]"
				>
					<div className="px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
						Barra Lateral
					</div>
					<button
						onClick={() => {
							onModeChange('open');
							setContextMenuPos(null);
						}}
						className={`w-full text-left px-4 py-2 text-sm hover:bg-background transition-colors flex items-center justify-between ${sidebarMode === 'open' ? 'text-primary bg-primary/5' : 'text-text-main'}`}
					>
						Sempre aberto
						{sidebarMode === 'open' && (
							<div className="w-1.5 h-1.5 rounded-full bg-primary" />
						)}
					</button>
					<button
						onClick={() => {
							onModeChange('closed');
							setContextMenuPos(null);
						}}
						className={`w-full text-left px-4 py-2 text-sm hover:bg-background transition-colors flex items-center justify-between ${sidebarMode === 'closed' ? 'text-primary bg-primary/5' : 'text-text-main'}`}
					>
						Sempre fechado
						{sidebarMode === 'closed' && (
							<div className="w-1.5 h-1.5 rounded-full bg-primary" />
						)}
					</button>
					<button
						onClick={() => {
							onModeChange('hover');
							setContextMenuPos(null);
						}}
						className={`w-full text-left px-4 py-2 text-sm hover:bg-background transition-colors flex items-center justify-between ${sidebarMode === 'hover' ? 'text-primary bg-primary/5' : 'text-text-main'}`}
					>
						Abrir ao passar o mouse
						{sidebarMode === 'hover' && (
							<div className="w-1.5 h-1.5 rounded-full bg-primary" />
						)}
					</button>
				</div>
			)}
		</aside>
	);
};
