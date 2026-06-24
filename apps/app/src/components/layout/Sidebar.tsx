'use client';

import React, { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '../ui/Icon';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '../ui/tooltip';
import { useToast } from '../ui/toaster';
import { usePermissions } from '@/context/PermissionsContext';
import { useActiveObra } from '@/context/ActiveObraContext';
import { SidebarObraSelector } from './SidebarObraSelector';
import { SidebarNavSection } from './SidebarNavSection';
import {
	buildObraNavItems,
	filterNavItemsByPermissions,
	sistemaNavItems,
} from './sidebarNavConfig';

interface SidebarProps {
	isOpen: boolean;
	onToggleSidebar: () => void;
	isMobileOpen?: boolean;
	onMobileClose?: () => void;
	isInObraRoute?: boolean;
}

export function Sidebar({
	isOpen,
	isMobileOpen,
	onMobileClose,
	isInObraRoute,
}: SidebarProps) {
	const pathname = usePathname();
	const { selectedObraId, requestOpenObraSelector } = useActiveObra();
	const { addToast } = useToast();
	const { can, isSuperAdmin, loading: permissionsLoading } = usePermissions();

	const handleDisabledObraClick = useCallback(() => {
		requestOpenObraSelector('sidebar');
		addToast('Selecione uma obra para acessar este menu', 'warning');
	}, [requestOpenObraSelector, addToast]);

	const sistemaItems = useMemo(() => {
		if (permissionsLoading) return [];
		return filterNavItemsByPermissions(sistemaNavItems, can, isSuperAdmin);
	}, [can, isSuperAdmin, permissionsLoading]);

	const obraItems = useMemo(() => {
		if (permissionsLoading) return [];
		const raw = selectedObraId ? buildObraNavItems(selectedObraId) : buildObraNavItems('_');
		return filterNavItemsByPermissions(raw, can, isSuperAdmin);
	}, [can, isSuperAdmin, permissionsLoading, selectedObraId]);

	const hasObraSelected = Boolean(selectedObraId);

	return (
		<>
			{isMobileOpen && (
				<div
					className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden"
					onClick={onMobileClose}
				/>
			)}

			<aside
				className={cn(
					'relative z-[70] flex h-full flex-col bg-[#101828] text-white transition-[width] duration-300 ease-in-out select-none',
					'hidden md:flex',
					isOpen ? 'md:w-64' : 'md:w-20',
					isMobileOpen
						? 'fixed inset-y-0 left-0 flex w-64 translate-x-0'
						: 'fixed inset-y-0 left-0 w-64 -translate-x-full md:relative md:translate-x-0',
					isInObraRoute && !isMobileOpen ? '!hidden md:!flex' : '',
				)}
			>
				<div
					className={cn(
						'flex items-center relative h-[88px] border-b border-gray-800 transition-all px-4 shrink-0',
						isOpen || isMobileOpen ? 'justify-start' : 'justify-center',
					)}
				>
					{isMobileOpen && (
						<button
							onClick={onMobileClose}
							className="absolute right-4 p-2 text-gray-400 hover:text-white md:hidden"
						>
							<Icon name="X" size={20} />
						</button>
					)}

					<div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[5px] bg-white">
						<img
							src="/assets/brand/logo.png"
							alt="ObraLog Logo"
							className="h-full w-full object-contain"
						/>
					</div>

					<div
						className={cn(
							'ml-3 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out flex flex-col justify-center',
							isOpen || isMobileOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 ml-0',
						)}
					>
						<span className="font-bold text-xl leading-none tracking-tight">ObraLog</span>
						<span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mt-1.5 leading-none">
							ERP Manager
						</span>
					</div>
				</div>

				<SidebarObraSelector
					isOpen={isOpen}
					isMobileOpen={!!isMobileOpen}
					onMobileClose={onMobileClose}
				/>

				<TooltipProvider delayDuration={200}>
					<nav
						className={cn(
							'flex-1 flex flex-col space-y-4 px-4 py-4 custom-scrollbar',
							isOpen || isMobileOpen ? 'overflow-y-auto' : 'overflow-visible',
						)}
					>
						<SidebarNavSection
							label="Sistema"
							items={sistemaItems}
							pathname={pathname}
							isOpen={isOpen}
							isMobileOpen={!!isMobileOpen}
							onMobileClose={onMobileClose}
						/>

						<SidebarNavSection
							label="Obra ativa"
							items={obraItems}
							pathname={pathname}
							isOpen={isOpen}
							isMobileOpen={!!isMobileOpen}
							disabled={!hasObraSelected}
							onMobileClose={onMobileClose}
							onDisabledClick={handleDisabledObraClick}
						/>
					</nav>
				</TooltipProvider>

				<div className="border-t border-gray-800 p-4 shrink-0 overflow-visible">
					<div className="relative group">
						<Link href="/configuracoes" className="block">
							<div
								className={cn(
									'flex items-center rounded-none transition-all duration-200',
									isOpen ? 'px-3 py-2.5 justify-start' : 'h-10 w-10 mx-auto justify-center',
									pathname === '/configuracoes' || pathname?.startsWith('/configuracoes')
										? 'bg-white/10 text-white font-medium'
										: 'text-gray-400 hover:bg-white/5 hover:text-gray-200',
								)}
							>
								<Icon
									name="Gear"
									size={20}
									weight={pathname?.startsWith('/configuracoes') ? 'fill' : 'regular'}
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
										isOpen ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 ml-0',
									)}
								>
									Configurações
								</span>
							</div>
						</Link>

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
