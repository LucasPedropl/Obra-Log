import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import { ToastProvider } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/providers/AuthContext';

const inter = Inter({
	variable: '--font-sans',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'ObraLog Admin',
	description: 'Painel Super-Admin do sistema ObraLog.',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
			<body className="min-h-full flex flex-col font-sans">
				<AuthProvider>
					<ToastProvider>
						{children}
					</ToastProvider>
				</AuthProvider>
			</body>
		</html>
	);
}
