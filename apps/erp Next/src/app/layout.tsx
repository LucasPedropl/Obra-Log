import type { Metadata } from 'next';
import { Poppins, Geist } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { ToastProvider } from '@/components/ui/toaster';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const poppins = Poppins({
	subsets: ['latin'],
	weight: ['300', '400', '500', '600', '700'],
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
		<html lang="pt-BR" className={cn('font-sans', geist.variable)}>
			<body
				className={`${poppins.className} min-h-screen bg-background antialiased`}
			>
				<ToastProvider>{children}</ToastProvider>
			</body>
		</html>
	);
}
