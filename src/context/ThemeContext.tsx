import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'ocean' | 'monochrome';

interface ThemeContextType {
	theme: Theme;
	setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [theme, setTheme] = useState<Theme>(() => {
		return (localStorage.getItem('obralog-theme') as Theme) || 'light';
	});

	useEffect(() => {
		const root = window.document.documentElement;

		// Remove all old theme classes
		root.classList.remove(
			'light',
			'dark',
			'theme-ocean',
			'theme-monochrome',
		);

		// Add the new theme class
		if (theme === 'light') {
			root.classList.add('light'); // if needed, although tailwind default is light
		} else if (theme === 'dark') {
			root.classList.add('dark');
		} else {
			root.classList.add('dark'); // base for custom themes
			root.classList.add(`theme-${theme}`);
		}

		localStorage.setItem('obralog-theme', theme);
	}, [theme]);

	return (
		<ThemeContext.Provider value={{ theme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
};

export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
};
