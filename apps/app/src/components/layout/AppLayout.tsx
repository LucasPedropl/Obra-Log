'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileFooter } from './MobileFooter';

export function AppLayout({ children }: { children: React.ReactNode }) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const pathname = usePathname();

	const toggleSidebar = () => {
		setIsSidebarOpen(!isSidebarOpen);
	};

	const isInObraRoute = pathname?.match(/^\/obras\/([^\/]+)(?:\/|$)/);
	const obraId = isInObraRoute ? isInObraRoute[1] : null;

	// Close mobile menu when route changes
	useEffect(() => {
		setIsMobileMenuOpen(false);
	}, [pathname]);

	return (
		<div className="flex h-screen w-full overflow-hidden bg-[#f3f4f6]">
			{/* Sidebar Component */}
			<Sidebar
				isOpen={isSidebarOpen}
				onToggleSidebar={toggleSidebar}
				isMobileOpen={isMobileMenuOpen}
				onMobileClose={() => setIsMobileMenuOpen(false)}
				isInObraRoute={!!isInObraRoute}
			/>

			{/* Main Content Area */}
			<div className="flex flex-1 flex-col overflow-hidden w-full relative">
				{/* Header Component */}
				<Header
					onMobileMenuToggle={() =>
						setIsMobileMenuOpen(!isMobileMenuOpen)
					}
				/>

				{/* Page Content */}
				<main
					className={`flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 ${isInObraRoute ? 'pb-20 md:pb-8' : ''}`}
				>
					{children}
				</main>

				{/* Mobile Footer for Obra */}
				{isInObraRoute && obraId && <MobileFooter obraId={obraId} />}
			</div>
		</div>
	);
}
