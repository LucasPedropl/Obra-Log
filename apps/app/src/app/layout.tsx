import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { ToastProvider } from '@/components/ui/toaster';

const inter = Inter({
	subsets: ['latin'],
	variable: '--font-sans',
	display: 'swap',
});

export const metadata: Metadata = {
	title: 'Obra-Log ERP',
	description: 'Gestão Inteligente de Obras - ERP Multi-Tenant',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="pt-BR" className={cn('font-sans', inter.variable)}>
			<head>
				<link
					rel="stylesheet"
					href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
				/>
			</head>
			<body
				className={`${inter.className} min-h-screen bg-background antialiased`}
			>
				<ToastProvider>{children}</ToastProvider>
			</body>
		</html>
	);
}
