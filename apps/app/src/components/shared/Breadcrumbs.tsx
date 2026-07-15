'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveObra } from '@/context/ActiveObraContext';
import { isObraContext, resolveModuleLabel } from '@/lib/breadcrumbConfig';

export interface BreadcrumbItem {
	label: string;
	href?: string;
}

interface BreadcrumbsProps {
	companyName?: string;
	className?: string;
}

export function Breadcrumbs({ companyName, className }: BreadcrumbsProps) {
	const pathname = usePathname();
	const { selectedObraName } = useActiveObra();
	const moduleLabel = resolveModuleLabel(pathname ?? '');

	const items: BreadcrumbItem[] = [];

	if (companyName) {
		items.push({ label: companyName, href: '/empresas' });
	}

	if (isObraContext(pathname ?? '') && selectedObraName) {
		const obraId = pathname?.match(/^\/obras\/([^/]+)/)?.[1];
		items.push({
			label: selectedObraName,
			href: obraId ? `/obras/${obraId}/visao-geral` : undefined,
		});
	}

	if (moduleLabel) {
		items.push({ label: moduleLabel });
	}

	if (items.length <= 1) return null;

	return (
		<nav
			aria-label="Breadcrumb"
			className={cn('hidden md:flex items-center gap-1 min-w-0', className)}
		>
			{items.map((item, index) => {
				const isLast = index === items.length - 1;
				return (
					<div key={`${item.label}-${index}`} className="flex items-center gap-1 min-w-0">
						{index > 0 && (
							<ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
						)}
						{item.href && !isLast ? (
							<Link
								href={item.href}
								className="text-xs font-medium text-gray-500 hover:text-gray-900 truncate max-w-[140px] transition-colors"
							>
								{item.label}
							</Link>
						) : (
							<span
								className={cn(
									'text-xs truncate max-w-[160px]',
									isLast
										? 'font-semibold text-gray-900'
										: 'font-medium text-gray-500',
								)}
							>
								{item.label}
							</span>
						)}
					</div>
				);
			})}
		</nav>
	);
}
