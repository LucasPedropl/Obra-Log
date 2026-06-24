'use client';

import { useRef, useState, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { cn } from '@/lib/utils';

interface HeaderUserMenuProps {
	userProfile: {
		full_name: string;
		email: string;
		role_title?: string;
		avatar_url?: string;
	} | null;
	loading: boolean;
	getInitials: (name: string) => string;
	onChangeCompany: () => void;
	onLogout: () => void;
}

export function HeaderUserMenu({
	userProfile,
	loading,
	getInitials,
	onChangeCompany,
	onLogout,
}: HeaderUserMenuProps) {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

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
					'absolute right-0 mt-2 w-64 origin-top-right rounded-none bg-white py-1 shadow-lg ring-1 ring-black/5 z-50 transition-all duration-200',
					isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none',
				)}
			>
				<div className="px-4 py-3 border-b border-gray-100">
					<p className="text-sm font-bold text-gray-900 truncate">{userProfile?.full_name}</p>
					<p className="text-xs font-medium text-blue-600 truncate mb-1">{userProfile?.role_title}</p>
					<p className="text-[11px] text-gray-500 truncate">{userProfile?.email}</p>
				</div>
				<div className="py-1">
					<button
						onClick={onChangeCompany}
						className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
					>
						<Icon name="ArrowsCounterClockwise" size={18} className="mr-2 text-gray-400 group-hover:text-blue-500" />
						Trocar Empresa
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
