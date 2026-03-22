import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'bw' | 'supabase' | 'green';

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
			'theme-bw',
			'theme-supabase',
			'theme-green',
		);

		// Add the new theme class
		if (theme === 'dark') {
			root.classList.add('dark');
		} else if (theme === 'bw') {
			root.classList.add('theme-bw');
		} else if (theme === 'supabase') {
			root.classList.add('dark'); // base for dark theme
			root.classList.add('theme-supabase');
		} else if (theme === 'green') {
			root.classList.add('theme-green');
		} else {
			root.classList.add('light'); // if needed
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
