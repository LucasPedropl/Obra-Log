import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export type SidebarMode = 'open' | 'closed' | 'hover';

export const ERPLayout: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [sidebarMode, setSidebarMode] = useState<SidebarMode>(() => {
		const saved = localStorage.getItem('erp_sidebar_mode');
		return saved ? (saved as SidebarMode) : 'open';
	});

	const [isHovered, setIsHovered] = useState(false);

	const handleModeChange = (mode: SidebarMode) => {
		setSidebarMode(mode);
		localStorage.setItem('erp_sidebar_mode', mode);
	};

	const getActualIsOpen = () => {
		if (sidebarMode === 'open') return true;
		if (sidebarMode === 'closed') return false;
		return isHovered;
	};

	return (
		<div className="h-screen overflow-hidden bg-background text-text-main flex transition-colors duration-200">
			<div
				onMouseEnter={() =>
					sidebarMode === 'hover' && setIsHovered(true)
				}
				onMouseLeave={() =>
					sidebarMode === 'hover' && setIsHovered(false)
				}
				className="h-full flex flex-col shrink-0"
			>
				<Sidebar
					isOpen={getActualIsOpen()}
					sidebarMode={sidebarMode}
					onModeChange={handleModeChange}
				/>
			</div>
			<div className="flex-1 flex flex-col min-w-0 h-full">
				<Header />
				<main className="flex-1 p-6 overflow-y-auto">{children}</main>
			</div>
		</div>
	);
};
