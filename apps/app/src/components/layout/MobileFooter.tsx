'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Wrench, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileFooterProps {
	obraId: string;
}

export function MobileFooter({ obraId }: MobileFooterProps) {
	const pathname = usePathname();

	const items = [
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
			name: 'Ferramentas',
			icon: Wrench,
			href: `/obras/${obraId}/ferramentas/disponiveis`,
		},
		{
			name: 'Menu',
			icon: Menu,
			href: `/obras/${obraId}/menu`,
		},
	];

	return (
		<nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 w-full items-center justify-around border-t border-gray-200 bg-white px-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:hidden">
			{items.map((item) => {
				const isActive =
					pathname === item.href ||
					(item.name === 'Ferramentas' &&
						pathname?.includes('/ferramentas'));

				return (
					<Link
						key={item.name}
						href={item.href}
						className={cn(
							'flex flex-col items-center justify-center w-full h-full gap-1 px-1 transition-colors',
							isActive
								? 'text-[#F29C1F]'
								: 'text-gray-500 hover:text-gray-900',
						)}
					>
						<item.icon
							size={20}
							className={cn(
								'mb-0.5',
								isActive && 'stroke-[2.5px]',
							)}
						/>
						<span className="text-[10px] font-medium text-center leading-none">
							{item.name}
						</span>
					</Link>
				);
			})}
		</nav>
	);
}
