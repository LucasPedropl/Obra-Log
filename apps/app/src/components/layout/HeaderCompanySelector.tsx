'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '../ui/Icon';
import { cn } from '@/lib/utils';
import { setSelectedCompanyAction } from '@/app/actions/tenantActions';
import { useTenant } from '@/context/TenantContext';

interface HeaderCompanySelectorProps {
	companyName: string;
	myCompanies: { id: string; name: string }[];
	getInitials: (name: string) => string;
}

export function HeaderCompanySelector({
	companyName,
	myCompanies,
	getInitials,
}: HeaderCompanySelectorProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [switching, setSwitching] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const router = useRouter();
	const { setCompanyId } = useTenant();
	const hasMultipleCompanies = myCompanies.length > 1;

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const switchCompany = async (id: string) => {
		setSwitching(true);
		try {
			const result = await setSelectedCompanyAction(id, true);
			if (!result.success) {
				console.error('switchCompany:', result.error);
				return;
			}
			setCompanyId(id);
			setIsOpen(false);
			router.push('/dashboard');
			router.refresh();
		} finally {
			setSwitching(false);
		}
	};

	return (
		<div className="relative" ref={dropdownRef}>
			<div
				onClick={() => hasMultipleCompanies && setIsOpen(!isOpen)}
				className={cn(
					'flex items-center gap-2.5 px-2 py-1.5 rounded-none transition-all group',
					hasMultipleCompanies
						? 'cursor-pointer hover:bg-gray-50 active:scale-[0.98]'
						: 'cursor-default',
				)}
			>
				<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none bg-[#F3F4F6] text-[#101828] border border-gray-300 overflow-hidden">
					<span className="text-sm font-bold tracking-wider">
						{getInitials(companyName || 'Obra-Log')}
					</span>
				</div>
				<div className="flex flex-col min-w-0">
					<div className="flex items-center gap-1">
						<span className="text-[16px] font-semibold text-gray-900 leading-tight tracking-tight truncate max-w-[180px]">
							{companyName || 'Obra-Log'}
						</span>
						{hasMultipleCompanies && (
							<Icon
								name="CaretDown"
								size={14}
								className={cn(
									'text-gray-400 transition-transform duration-200 shrink-0',
									isOpen ? 'rotate-180' : '',
								)}
							/>
						)}
					</div>
					<span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.05em] leading-none mt-0.5">
						Workspace Ativo
					</span>
				</div>
			</div>

			{isOpen && (
				<div className="absolute left-0 mt-2 w-72 origin-top-left rounded-none bg-white p-1.5 shadow-2xl ring-1 ring-black/5 z-[60] animate-in fade-in zoom-in duration-200 border border-gray-100">
					<div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
						Trocar de Empresa
					</div>
					<div className="max-h-60 overflow-y-auto custom-scrollbar">
						{myCompanies.map((company) => {
							const isActive = companyName === company.name;
							return (
								<button
									key={company.id}
									disabled={switching}
									onClick={() => switchCompany(company.id)}
									className={cn(
										'w-full flex items-center gap-3 px-3 py-2.5 rounded-none text-sm text-left transition-all mb-0.5',
										isActive
											? 'bg-blue-600 text-white shadow-md shadow-blue-200'
											: 'text-gray-700 hover:bg-gray-50',
									)}
								>
									<div
										className={cn(
											'flex h-8 w-8 shrink-0 items-center justify-center rounded-none text-[10px] font-bold border',
											isActive
												? 'bg-white/20 border-white/30 text-white'
												: 'bg-gray-100 border-gray-200 text-gray-500',
										)}
									>
										{getInitials(company.name)}
									</div>
									<span className="flex-1 truncate font-semibold">
										{company.name}
									</span>
									{isActive && <Icon name="Check" size={16} />}
								</button>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
