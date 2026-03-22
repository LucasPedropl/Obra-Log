import React from 'react';
import {
	LayoutDashboard,
	Building2,
	Users,
	Menu,
	ClipboardList,
	HardHat,
	Hammer,
	Wrench,
	Truck,
} from 'lucide-react';
import { NavLink, useLocation, useParams } from 'react-router-dom';

export const MobileFooter: React.FC = () => {
	const location = useLocation();
	const { projectId } = useParams();

	const isProjectRoute = location.pathname.includes('/app/obras/');
	const currentProject = projectId || localStorage.getItem('lastProjectId');

	const globalNavItems = [
		{ path: '/app/dashboard', label: 'Início', icon: LayoutDashboard },
		{ path: '/app/obras/nova', label: 'Obras', icon: Building2 },
		{ path: '/app/mao-de-obra', label: 'Mão de Obra', icon: Users },
		{ path: '/app/menu', label: 'Menu', icon: Menu },
	];

	const projectNavItems = [
		{
			path: `/app/obras/${currentProject}/visao-geral`,
			label: 'Visão Geral',
			icon: LayoutDashboard,
		},
		{
			path: `/app/obras/${currentProject}/almoxarifado`,
			label: 'Almox.',
			icon: ClipboardList,
		},
		{
			path: `/app/obras/${currentProject}/colaboradores`,
			label: 'Equipe',
			icon: Users,
		},
		{
			path: `/app/obras/${currentProject}/epis`,
			label: 'EPIs',
			icon: HardHat,
		},
		{
			path: `/app/obras/${currentProject}/menu`,
			label: 'Menu',
			icon: Menu,
		},
	];

	const navItems = isProjectRoute ? projectNavItems : globalNavItems;

	return (
		<div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50 px-2 py-2 flex justify-between items-center safe-area-bottom md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] overflow-x-auto custom-scrollbar">
			<div className="flex w-full min-w-max justify-around">
				{navItems.map((item) => (
					<NavLink
						key={item.label}
						to={item.path}
						className={({ isActive }) =>
							`flex flex-col items-center justify-center min-w-[64px] px-2 py-1 rounded-lg transition-colors ${
								isActive
									? 'text-primary'
									: 'text-text-muted hover:text-text-main hover:bg-background'
							}`
						}
					>
						<item.icon size={20} className="mb-1" />
						<span className="text-[10px] font-medium leading-tight text-center">
							{item.label}
						</span>
					</NavLink>
				))}
			</div>
		</div>
	);
};
