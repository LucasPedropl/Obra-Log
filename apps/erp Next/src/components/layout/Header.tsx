'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Settings, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Fecha o dropdown ao clicar fora
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsDropdownOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	return (
		<header className="flex h-16 shrink-0 items-center justify-end border-b border-gray-200 bg-white px-4 shadow-sm z-10 transition-all duration-300">
			{/* Perfil e Ações do Usuário */}
			<div className="flex items-center gap-4">
				<div className="text-right hidden sm:block">
					<p className="text-sm font-medium text-gray-500 leading-none">
						Usuário Logado
					</p>
				</div>

				<div className="relative" ref={dropdownRef}>
					<button
						onClick={() => setIsDropdownOpen(!isDropdownOpen)}
						className="flex items-center gap-2 rounded-full focus:outline-none"
					>
						<img
							src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
							alt="Perfil do Usuário"
							className="h-9 w-9 rounded-full object-cover bg-gray-200"
						/>
					</button>

					{/* Dropdown Menu */}
					<div
						className={cn(
							'absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none transition-all duration-200 ease-out z-50',
							isDropdownOpen
								? 'transform opacity-100 scale-100'
								: 'transform opacity-0 scale-95 pointer-events-none',
						)}
					>
						<div className="px-4 py-3 border-b border-gray-100">
							<p className="text-sm font-medium text-gray-900 truncate">
								Admin Obra
							</p>
							<p className="text-xs text-gray-500 truncate">
								admin@obralog.com
							</p>
						</div>
						<div className="border-t border-gray-100 mt-1 pt-1">
							<button
								onClick={() => {
									// Lógica de logout futuramente
									console.log('Logout');
								}}
								className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
							>
								Sair
							</button>
						</div>
					</div>
				</div>
			</div>
		</header>
	);
}
