'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Icon } from '../ui/Icon';
import { cn } from '@/lib/utils';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '../ui/tooltip';
import type { NavItem } from './sidebarNavConfig';

const DISABLED_TOOLTIP = 'Selecione uma obra primeiro';

interface SidebarNavSectionProps {
	label: string;
	items: NavItem[];
	pathname: string | null;
	isOpen: boolean;
	isMobileOpen: boolean;
	disabled?: boolean;
	onMobileClose?: () => void;
	onDisabledClick?: () => void;
}

function DisabledWrapper({
	disabled,
	children,
	side = 'right',
	onDisabledClick,
}: {
	disabled: boolean;
	children: React.ReactNode;
	side?: 'top' | 'right' | 'bottom' | 'left';
	onDisabledClick?: () => void;
}) {
	if (!disabled) return <>{children}</>;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div
					className="cursor-pointer"
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onDisabledClick?.();
					}}
				>
					{children}
				</div>
			</TooltipTrigger>
			<TooltipContent side={side} className="rounded-none bg-[#1f2937] text-white border border-gray-700">
				{DISABLED_TOOLTIP}
			</TooltipContent>
		</Tooltip>
	);
}

export function SidebarNavSection({
	label,
	items,
	pathname,
	isOpen,
	isMobileOpen,
	disabled = false,
	onMobileClose,
	onDisabledClick,
}: SidebarNavSectionProps) {
	const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
	const isExpanded = isOpen || isMobileOpen;

	const toggleExpand = (name: string) => {
		if (disabled) {
			onDisabledClick?.();
			return;
		}
		setExpandedItems((prev) => ({ ...prev, [name]: !prev[name] }));
	};

	if (items.length === 0) return null;

	return (
		<div className="space-y-1.5">
			{isExpanded && (
				<p className="px-3 pt-2 pb-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
					{label}
				</p>
			)}

			{items.map((item) => {
				const hasChildren = item.children && item.children.length > 0;
				const isActive =
					!disabled &&
					((item.href &&
						(pathname === item.href || pathname?.startsWith(item.href))) ||
						(hasChildren &&
							item.children?.some(
								(child) =>
									pathname === child.href || pathname?.startsWith(child.href),
							)));
				const isItemExpanded = expandedItems[item.name];

				const buttonContent = (
					<div
						className={cn(
							'flex items-center rounded-none transition-all duration-200',
							isExpanded ? 'px-3 py-2.5 justify-start' : 'h-10 w-10 mx-auto justify-center',
							disabled
								? 'opacity-40 cursor-pointer text-gray-500'
								: 'cursor-pointer',
							!disabled &&
								(isActive
									? 'bg-white/10 text-white font-medium'
									: 'text-gray-400 hover:bg-white/5 hover:text-gray-200'),
						)}
					>
						<div
							className={cn(
								'flex flex-1 items-center',
								isExpanded ? 'justify-between' : 'justify-center',
							)}
						>
							<div className="flex items-center justify-center">
								<Icon
									name={item.icon}
									size={20}
									weight={isActive ? 'fill' : 'regular'}
									className={cn(
										'shrink-0',
										isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200',
									)}
								/>
								<span
									className={cn(
										'ml-3 text-sm overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out',
										isExpanded ? 'opacity-100 max-w-[140px]' : 'opacity-0 max-w-0 ml-0',
									)}
								>
									{item.name}
								</span>
							</div>

							{hasChildren && isExpanded && (
								<Icon
									name="CaretDown"
									size={16}
									className={cn(
										'shrink-0 text-gray-400 transition-transform duration-200',
										isItemExpanded ? 'rotate-180' : '',
									)}
								/>
							)}
						</div>
					</div>
				);

				return (
					<div key={item.name} className="relative group">
						<DisabledWrapper
							disabled={disabled}
							side={isExpanded ? 'right' : 'right'}
							onDisabledClick={onDisabledClick}
						>
							{hasChildren ? (
								<div onClick={() => isExpanded && toggleExpand(item.name)}>
									{buttonContent}
								</div>
							) : disabled ? (
								<div className="block">{buttonContent}</div>
							) : (
								<Link
									href={item.href || '#'}
									className="block"
									onClick={onMobileClose}
								>
									{buttonContent}
								</Link>
							)}
						</DisabledWrapper>

						{hasChildren && isExpanded && isItemExpanded && !disabled && (
							<div className="mt-1 ml-6 pl-2 border-l border-gray-800 space-y-1">
								{item.children?.map((child) => {
									const isChildActive =
										pathname === child.href || pathname?.startsWith(child.href);
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

						{!isExpanded && (
							<div
								className={cn(
									'absolute left-full top-1/2 -translate-y-1/2 pl-6 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-[100] min-w-max invisible group-hover:visible transition-none group-hover:transition-all group-hover:duration-300',
								)}
							>
								<div
									className={cn(
										'rounded-none bg-[#1f2937] shadow-xl overflow-hidden ring-1 ring-gray-700/50 pointer-events-auto',
										hasChildren ? 'py-1' : 'px-3 py-1.5',
									)}
								>
									{disabled ? (
										<span className="px-3 py-1.5 text-xs text-gray-300 whitespace-nowrap">
											{DISABLED_TOOLTIP}
										</span>
									) : hasChildren ? (
										<div className="flex flex-col">
											<div className="px-4 py-2 border-b border-gray-700 text-xs font-bold text-gray-400 uppercase tracking-wider">
												{item.name}
											</div>
											{item.children?.map((child) => (
												<Link key={child.name} href={child.href} className="block">
													<div className="px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-700 hover:text-white transition-colors">
														{child.name}
													</div>
												</Link>
											))}
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
		</div>
	);
}
