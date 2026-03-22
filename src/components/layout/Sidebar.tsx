import React, { useState, useMemo, useRef, useEffect } from 'react';
import { NavLink, useParams, useLocation, useNavigate } from 'react-router-dom';
import { SidebarMode } from './ERPLayout';
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
	const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
		const saved = localStorage.getItem('erp_expanded_menus');
		return saved ? JSON.parse(saved) : [];
	});

	const [showSettingsMenu, setShowSettingsMenu] = useState(false);
	const settingsMenuRef = useRef<HTMLDivElement>(null);

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
		if (!isOpen && onModeChange && sidebarMode !== 'hover') {
			onModeChange('open');
		}
	};

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				settingsMenuRef.current &&
				!settingsMenuRef.current.contains(event.target as Node)
			) {
				setShowSettingsMenu(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () =>
			document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Determine if we are in a project route
	const isProjectRoute =
		location.pathname.includes('/app/obras/') &&
		location.pathname !== '/app/obras/nova';

	// Extract the ID from the URL if we are in a project route
	const match = location.pathname.match(/\/app\/obras\/([^\/]+)/);
	const projectId = match ? match[1] : null;

	const globalNavItems = [
		{ name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
		{ name: 'Obras', path: '/app/obras/nova', icon: HardHat },
		{ name: 'Mão de Obra', path: '/app/mao-de-obra', icon: Users },
		{
			id: 'config-dados',
			name: 'Cadastros Básicos',
			icon: Database,
			subItems: [
				{
					name: 'Insumos',
					path: '/app/config-dados/insumos',
					icon: FileText,
				},
				{
					name: 'Unid. de Medidas',
					path: '/app/config-dados/unidades',
					icon: Ruler,
				},
				{
					name: 'Categorias',
					path: '/app/config-dados/categorias',
					icon: Tags,
				},
			],
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
				},
				{
					name: 'Perfis de acesso',
					path: '/app/acesso/perfis',
					icon: ShieldCheck,
				},
			],
		},
	];

	const projectNavItems = [
		{
			name: 'Visão Geral',
			path: `/app/obras/${projectId}/visao-geral`,
			icon: LayoutDashboard,
		},
		{
			name: 'Almoxarifado',
			path: `/app/obras/${projectId}/almoxarifado`,
			icon: Package,
		},
		{
			id: 'ferramentas',
			name: 'Ferramentas',
			icon: Wrench,
			subItems: [
				{
					name: 'Disponíveis',
					path: `/app/obras/${projectId}/ferramentas/disponiveis`,
					icon: ClipboardList,
				},
				{
					name: 'Empréstimos',
					path: `/app/obras/${projectId}/ferramentas/emprestimos`,
					icon: ArrowRightLeft,
				},
				{
					name: 'Histórico',
					path: `/app/obras/${projectId}/ferramentas/historico`,
					icon: Clock,
				},
			],
		},
		{
			name: 'Colaboradores',
			path: `/app/obras/${projectId}/colaboradores`,
			icon: Users,
		},
		{
			id: 'epis',
			name: 'EPIs',
			icon: Shield,
			subItems: [
				{
					name: 'Disponíveis',
					path: `/app/obras/${projectId}/epis/disponiveis`,
					icon: ClipboardList,
				},
				{
					name: 'Histórico',
					path: `/app/obras/${projectId}/epis/historico`,
					icon: Clock,
				},
			],
		},
		{
			name: 'Equip. Alugados',
			path: `/app/obras/${projectId}/equip-alugados`,
			icon: Truck,
		},
		{
			name: 'Movimentações',
			path: `/app/obras/${projectId}/movimentacoes`,
			icon: ArrowRightLeft,
		},
	];

	const navItems = isProjectRoute ? projectNavItems : globalNavItems;

	return (
		<aside
			className={`bg-surface border-r border-border h-full transition-all duration-300 flex flex-col relative z-20 ${isOpen ? 'w-64' : 'w-20'}`}
		>
			<div className="h-16 flex items-center justify-center border-b border-border select-none shrink-0 p-4">
				{isOpen ? (
					<div className="flex items-center gap-2 font-bold text-xl text-primary transition-all duration-300">
						<HardHat size={28} className="text-primary" />
						ObraLog
					</div>
				) : (
					<HardHat
						size={28}
						className="text-primary transition-all duration-300"
					/>
				)}
			</div>

			<nav
				className={`flex-1 py-4 px-3 space-y-2 ${isOpen ? 'overflow-y-auto overflow-x-hidden' : 'overflow-visible'}`}
			>
				{navItems.map((item) => (
					<React.Fragment key={item.name}>
						{item.subItems ? (
							<div className="flex flex-col space-y-1">
								<button
									onClick={() =>
										item.id && toggleMenu(item.id)
									}
									className={`group relative flex items-center justify-between p-3 rounded-lg transition-colors w-full text-text-muted hover:text-text-main hover:bg-background ${!isOpen && 'justify-center'}`}
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

									{/* Popout menu for closed state */}
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
																className={({
																	isActive,
																}) =>
																	`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-background transition-colors ${
																		isActive
																			? 'bg-primary/5 text-primary font-medium'
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
																<span className="flex-1">
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
								</button>
								{isOpen &&
									item.id &&
									expandedMenus.includes(item.id) && (
										<div className="pl-6 pr-2 py-1 space-y-1">
											{item.subItems.map((subItem) => (
												<NavLink
													key={subItem.path}
													to={subItem.path}
													className={({ isActive }) =>
														`flex items-center gap-3 py-2 px-3 text-sm rounded-md transition-colors ${
															isActive
																? 'bg-primary/5 text-primary font-medium'
																: 'text-text-muted hover:text-text-main hover:bg-background'
														}`
													}
												>
													{subItem.icon && (
														<subItem.icon
															size={18}
														/>
													)}
													<span>{subItem.name}</span>
												</NavLink>
											))}
										</div>
									)}
							</div>
						) : (
							<NavLink
								key={item.path}
								to={item.path || '#'}
								className={({ isActive }) =>
									`group relative flex items-center gap-3 p-3 rounded-lg transition-colors ${
										isActive
											? 'bg-primary/10 text-primary'
											: 'text-text-muted hover:text-text-main hover:bg-background'
									} ${!isOpen && 'justify-center'}`
								}
							>
								<item.icon size={22} className="shrink-0" />
								{isOpen && (
									<span className="font-medium truncate">
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
				))}
			</nav>

			<div
				className="p-3 border-t border-border relative"
				ref={settingsMenuRef}
			>
				<button
					onClick={() => setShowSettingsMenu((prev) => !prev)}
					className={`group relative flex items-center gap-3 p-3 rounded-lg transition-colors w-full ${
						showSettingsMenu
							? 'bg-background text-primary'
							: 'text-text-muted hover:text-text-main hover:bg-background'
					} ${!isOpen && 'justify-center'}`}
				>
					<Settings size={22} className="shrink-0" />
					{isOpen && (
						<span className="font-medium truncate flex-1 text-left">
							Configurações
						</span>
					)}
					{isOpen && (
						<ChevronDown
							size={16}
							className={`transition-transform duration-200 ${showSettingsMenu ? 'rotate-180' : ''}`}
						/>
					)}

					{/* Tooltip for closed state */}
					{!isOpen && (
						<div className="absolute left-full ml-4 px-3 py-2 bg-surface text-text-main text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-border shadow-xl">
							Configurações
						</div>
					)}
				</button>

				{/* Floating Settings Menu */}
				{showSettingsMenu && (
					<div
						className={`absolute bottom-full mb-2 bg-surface border border-border rounded-lg shadow-xl py-2 z-50 flex flex-col min-w-[200px] ${
							isOpen ? 'left-3 right-3' : 'left-full ml-4'
						}`}
					>
						<div className="px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
							Barra Lateral
						</div>
						<button
							onClick={() => {
								onModeChange('open');
								setShowSettingsMenu(false);
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
								setShowSettingsMenu(false);
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
								setShowSettingsMenu(false);
							}}
							className={`w-full text-left px-4 py-2 text-sm hover:bg-background transition-colors flex items-center justify-between ${sidebarMode === 'hover' ? 'text-primary bg-primary/5' : 'text-text-main'}`}
						>
							Abrir ao passar o mouse
							{sidebarMode === 'hover' && (
								<div className="w-1.5 h-1.5 rounded-full bg-primary" />
							)}
						</button>

						<div className="h-px bg-border my-1" />

						<div className="px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider mt-1">
							Sistema
						</div>
						<NavLink
							to="/app/configuracoes"
							onClick={() => setShowSettingsMenu(false)}
							className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-background transition-colors flex items-center gap-2"
						>
							Todas as configurações
						</NavLink>
					</div>
				)}
			</div>
		</aside>
	);
};
