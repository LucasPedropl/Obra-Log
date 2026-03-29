import React from 'react';
import { LogOut, Sun, Moon } from 'lucide-react';

type HeaderProps = {
	userEmail?: string;
	onLogout?: () => void;
	toggleTheme?: () => void;
	isDarkMode?: boolean;
};

export const Header: React.FC<HeaderProps> = ({
	userEmail,
	onLogout,
	toggleTheme,
	isDarkMode,
}) => {
	return (
		<header className="h-16 border-b border-border-main bg-background flex items-center justify-between px-4 md:px-6 shrink-0 z-10">
			<div>{/* Breadcrumbs or Title */}</div>
			<div className="flex items-center gap-4">
				<span className="text-sm text-text-secondary hidden sm:block">
					{userEmail}
				</span>
				{toggleTheme && (
					<button
						onClick={toggleTheme}
						className="p-2 rounded-md hover:bg-surface-hover"
					>
						{isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
					</button>
				)}
				{onLogout && (
					<button
						onClick={onLogout}
						className="p-2 rounded-md hover:bg-danger/10 text-danger"
						title="Sair"
					>
						<LogOut size={20} />
					</button>
				)}
			</div>
		</header>
	);
};
