import React, { useState } from 'react';
import { Sidebar, SidebarMode, SidebarItem } from './Sidebar';
import { Header } from './Header';
import { MobileFooter } from './MobileFooter';

type GlobalLayoutProps = {
	children: React.ReactNode;
	userEmail?: string;
	onLogout?: () => void;
	toggleTheme?: () => void;
	isDarkMode?: boolean;
	sidebarItems?: SidebarItem[];
};

export const GlobalLayout: React.FC<GlobalLayoutProps> = ({
	children,
	userEmail,
	onLogout,
	sidebarItems,
	toggleTheme,
	isDarkMode,
}) => {
	const [sidebarMode, setSidebarMode] = useState<SidebarMode>('open');
	const [isHovered, setIsHovered] = useState(false);

	const handleModeChange = (mode: SidebarMode) => {
		setSidebarMode(mode);
		localStorage.setItem('sidebar_mode', mode);
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
				className="hidden md:flex h-full flex-col shrink-0"
			>
				<Sidebar
					isOpen={getActualIsOpen()}
					sidebarMode={sidebarMode}
					onModeChange={handleModeChange}
					items={sidebarItems}
				/>
			</div>
			<div className="flex-1 flex flex-col min-w-0 h-full pb-[60px] md:pb-0">
				<Header
					userEmail={userEmail}
					onLogout={onLogout}
					toggleTheme={toggleTheme}
					isDarkMode={isDarkMode}
				/>
				<main className="flex-1 p-4 md:p-6 overflow-y-auto">
					{children}
				</main>
			</div>

			<MobileFooter />
		</div>
	);
};
