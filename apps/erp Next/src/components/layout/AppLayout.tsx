'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout({ children }: { children: React.ReactNode }) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);

	const toggleSidebar = () => {
		setIsSidebarOpen(!isSidebarOpen);
	};

	return (
		<div className="flex h-screen w-full overflow-hidden bg-[#f3f4f6]">
			{/* Sidebar Component */}
			<Sidebar isOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />

			{/* Main Content Area */}
			<div className="flex flex-1 flex-col overflow-hidden">
				{/* Header Component */}
				<Header />

				{/* Page Content */}
				<main className="flex-1 overflow-y-auto p-6 md:p-8">
					{children}
				</main>
			</div>
		</div>
	);
}
