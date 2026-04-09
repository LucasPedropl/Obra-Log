'use client';

import React from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

interface SidebarProps {
	isOpen: boolean;
	onToggleSidebar: () => void;
}

const navItems = [
	{ name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
	{ name: 'Obras', icon: Building2, href: '/obras' },
	{ name: 'Insumos', icon: PackageOpen, href: '/insumos' },
	{ name: 'Colaboradores', icon: Users, href: '/colaboradores' },
];

export function Sidebar({ isOpen, onToggleSidebar }: SidebarProps) {
	const pathname = usePathname();

	return (
		<aside
			className={cn(
				'relative z-20 flex h-full flex-col bg-[#101828] text-white transition-all duration-300 ease-in-out',
				isOpen ? 'w-64' : 'w-20',
			)}
		>
			{/* Logo / Header da Sidebar com altura ampliada e separador */}
			<div
				className={cn(
					'flex items-center relative h-[88px] border-b border-gray-800 transition-all px-4',
					isOpen ? 'justify-start' : 'justify-center',
				)}
			>
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
						<path d="M11 21L21 6m0 0v5m0-5h-5" stroke="#F29C1F" />
					</svg>
				</div>

				{/* Nome Empresa (oculta se fechado) */}
				<span
					className={cn(
						'ml-3 overflow-hidden whitespace-nowrap font-bold text-lg transition-all duration-300 ease-in-out block tracking-wide',
						isOpen
							? 'opacity-100 max-w-full'
							: 'opacity-0 max-w-0 ml-0',
					)}
				>
					Obra-Log
				</span>

				{/* Botão para encolher/expandir centralizado na linha do separador e borda direita */}
				<button
					onClick={onToggleSidebar}
					className="absolute -right-3 -bottom-3 flex h-6 w-6 items-center justify-center rounded-md bg-white border border-gray-200 text-gray-500 hover:text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 z-50"
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
					const isActive =
						pathname === item.href ||
						pathname?.startsWith(item.href);
					return (
						<div key={item.name} className="relative group">
							<Link href={item.href} className="block">
								<div
									className={cn(
										'flex items-center rounded-md transition-all duration-200',
										isOpen
											? 'px-3 py-2.5 justify-start'
											: 'h-10 w-10 mx-auto justify-center',
										isActive
											? 'bg-white/10 text-white font-medium'
											: 'text-gray-400 hover:bg-white/5 hover:text-gray-200',
									)}
								>
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
											isOpen
												? 'opacity-100 max-w-[200px]'
												: 'opacity-0 max-w-0 ml-0',
										)}
									>
										{item.name}
									</span>
								</div>
							</Link>

							{/* Tooltip quando Sidebar Fechado */}
							{!isOpen && (
								<div className="absolute left-[110%] top-1/2 -translate-y-1/2 ml-2 rounded-md bg-gray-800 px-3 py-1.5 text-xs font-semibold text-white shadow-xl opacity-0 transition-opacity duration-200 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto whitespace-nowrap z-[100]">
									{item.name}
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
						<div className="absolute left-[110%] top-1/2 -translate-y-1/2 ml-2 rounded-md bg-gray-800 px-3 py-1.5 text-xs font-semibold text-white shadow-xl opacity-0 transition-opacity duration-200 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto whitespace-nowrap z-[100]">
							Configurações
						</div>
					)}
				</div>
			</div>
		</aside>
	);
}
