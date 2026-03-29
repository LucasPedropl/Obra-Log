import React from 'react';
import { NavLink } from 'react-router-dom';
import {
	Settings,
	Home,
	HardHat,
	PanelLeftClose,
	PanelLeftOpen,
	GripVertical,
	LucideIcon,
} from 'lucide-react';

export type SidebarMode = 'open' | 'closed' | 'hover';

export type SidebarItem = {
	title: string;
	href: string;
	icon: LucideIcon;
};

type SidebarProps = {
	isOpen: boolean;
	sidebarMode: SidebarMode;
	onModeChange: (mode: SidebarMode) => void;
	items?: SidebarItem[];
};

export const Sidebar: React.FC<SidebarProps> = ({
	isOpen,
	sidebarMode,
	onModeChange,
	items = [],
}) => {
	const defaultItems = [
		{ title: 'Dashboard', href: '/app/dashboard', icon: Home },
		{ title: 'Obras', href: '/app/obras', icon: HardHat },
		{ title: 'Configurações', href: '/app/configuracoes', icon: Settings },
	];

	const currentItems = items.length > 0 ? items : defaultItems;

	return (
		<aside
			className={`h-full bg-surface-main border-r border-border-main flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-16'}`}
		>
			<div className="h-16 flex items-center justify-between px-4 border-b border-border-main shrink-0">
				{isOpen ? (
					<div className="font-bold text-xl text-brand-primary truncate">
						ObraLog
					</div>
				) : (
					<div className="font-bold text-xl text-brand-primary w-full text-center">
						O
					</div>
				)}
			</div>

			<div className="flex-1 py-4 overflow-y-auto overflow-x-hidden space-y-1">
				{currentItems.map((item) => (
					<NavLink
						key={item.href}
						to={item.href}
						className={({ isActive }) =>
							`flex items-center mx-2 px-2 py-2 rounded-md transition-colors whitespace-nowrap overflow-hidden ${
								isActive
									? 'bg-brand-primary/10 text-brand-primary font-medium'
									: 'text-text-secondary hover:bg-surface-hover hover:text-text-main'
							}`
						}
					>
						<item.icon size={20} className="shrink-0" />
						<span
							className={`ml-3 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
						>
							{item.title}
						</span>
					</NavLink>
				))}
			</div>

			<div className="border-t border-border-main p-2 flex justify-center space-x-1">
				<button
					onClick={() => onModeChange('open')}
					className={`p-1.5 rounded-md ${sidebarMode === 'open' ? 'bg-brand-primary/10 text-brand-primary' : 'text-text-secondary hover:bg-surface-hover'}`}
					title="Fixar menu"
				>
					<PanelLeftOpen size={18} />
				</button>
				<button
					onClick={() => onModeChange('closed')}
					className={`p-1.5 rounded-md ${sidebarMode === 'closed' ? 'bg-brand-primary/10 text-brand-primary' : 'text-text-secondary hover:bg-surface-hover'}`}
					title="Ocultar menu"
				>
					<PanelLeftClose size={18} />
				</button>
				<button
					onClick={() => onModeChange('hover')}
					className={`p-1.5 rounded-md ${sidebarMode === 'hover' ? 'bg-brand-primary/10 text-brand-primary' : 'text-text-secondary hover:bg-surface-hover'}`}
					title="Expandir ao passar o mouse"
				>
					<GripVertical size={18} />
				</button>
			</div>
		</aside>
	);
};
