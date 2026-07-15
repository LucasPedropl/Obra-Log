'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '../ui/Icon';
import { cn } from '@/lib/utils';
import { setSelectedCompanyAction } from '@/app/actions/tenantActions';
import { useTenant } from '@/context/TenantContext';

interface UserProfile {
	full_name: string;
	email: string;
	role_title?: string;
	avatar_url?: string;
}

interface HeaderAccountMenuProps {
	userProfile: UserProfile | null;
	loading: boolean;
	companyName: string;
	myCompanies: { id: string; name: string }[];
	getInitials: (name: string) => string;
	onChangeCompany: () => void;
	onLogout: () => void;
}

export function HeaderAccountMenu({
	userProfile,
	loading,
	companyName,
	myCompanies,
	getInitials,
	onChangeCompany,
	onLogout,
}: HeaderAccountMenuProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [switching, setSwitching] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const router = useRouter();
	const { setCompanyId } = useTenant();
	const hasMultipleCompanies = myCompanies.length > 1;

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center focus:outline-none hover:bg-gray-50/80 p-1.5 rounded-none transition-colors"
			>
				<div className="flex items-center justify-center h-10 w-10 rounded-none bg-blue-600 text-white font-medium border border-gray-200 shadow-sm overflow-hidden shrink-0">
					{loading ? (
						<Icon name="ArrowsClockwise" size={16} className="animate-spin" />
					) : userProfile?.avatar_url ? (
						<img src={userProfile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
					) : (
						getInitials(userProfile?.full_name || '')
					)}
				</div>
			</button>

			<div
				className={cn(
					'absolute right-0 mt-2 w-72 origin-top-right rounded-none bg-white py-1 shadow-2xl ring-1 ring-black/5 z-60 transition-all duration-200 border border-gray-100',
					isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none',
				)}
			>
				<div className="px-4 py-3 border-b border-gray-100">
					<p className="text-sm font-bold text-gray-900 truncate">{userProfile?.full_name}</p>
					<p className="text-xs font-medium text-blue-600 truncate mb-1">{userProfile?.role_title}</p>
					<p className="text-[11px] text-gray-500 truncate">{userProfile?.email}</p>
				</div>

				<div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
					<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none bg-[#F3F4F6] text-[#101828] border border-gray-300 overflow-hidden">
						<span className="text-sm font-bold tracking-wider">
							{getInitials(companyName || 'Obra-Log')}
						</span>
					</div>
					<div className="flex flex-col min-w-0">
						<span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none">
							Workspace Ativo
						</span>
						<span className="text-sm font-semibold text-gray-900 leading-tight tracking-tight truncate mt-0.5">
							{companyName || 'Obra-Log'}
						</span>
					</div>
				</div>

				{hasMultipleCompanies && (
					<div className="px-1.5 py-1.5 border-b border-gray-100">
						<div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
							Trocar de Empresa
						</div>
						<div className="max-h-52 overflow-y-auto custom-scrollbar">
							{myCompanies.map((company) => {
								const isActive = companyName === company.name;
								return (
									<button
										key={company.id}
										disabled={switching}
										onClick={() => switchCompany(company.id)}
										className={cn(
											'w-full flex items-center gap-3 px-2.5 py-2 rounded-none text-sm text-left transition-all mb-0.5',
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
										<span className="flex-1 truncate font-semibold">{company.name}</span>
										{isActive && <Icon name="Check" size={16} />}
									</button>
								);
							})}
						</div>
					</div>
				)}

				<div className="py-1">
					<button
						onClick={onChangeCompany}
						className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
					>
						<Icon name="ArrowsCounterClockwise" size={18} className="mr-2 text-gray-400 group-hover:text-blue-500" />
						Gerenciar Empresas
					</button>
					<div className="border-t border-gray-100 my-1" />
					<button
						onClick={onLogout}
						className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
					>
						<Icon name="SignOut" size={18} className="mr-2 text-gray-400 group-hover:text-red-600" />
						Sair
					</button>
				</div>
			</div>
		</div>
	);
}
