import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileFooter } from './MobileFooter';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../config/supabase';

export type SidebarMode = 'open' | 'closed' | 'hover';

export const ERPLayout: React.FC<{
	children: React.ReactNode;
	title?: string;
}> = ({ children, title }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const [isLoading, setIsLoading] = useState(true);

	const [sidebarMode, setSidebarMode] = useState<SidebarMode>(() => {
		const saved = localStorage.getItem('erp_sidebar_mode');
		return saved ? (saved as SidebarMode) : 'open';
	});

	useEffect(() => {
		let mounted = true;

		const checkAuth = async () => {
			try {
				const {
					data: { session },
				} = await supabase.auth.getSession();

				if (!session && mounted) {
					// Ignora as rotas de login
					if (
						location.pathname !== '/app/login' &&
						location.pathname !== '/admin/login'
					) {
						navigate('/app/login', { replace: true });
					}
				}
			} catch (error) {
				console.error('Error checking auth:', error);
			} finally {
				if (mounted) setIsLoading(false);
			}
		};

		checkAuth();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			if (!session && mounted) {
				if (
					location.pathname !== '/app/login' &&
					location.pathname !== '/admin/login'
				) {
					navigate('/app/login', { replace: true });
				}
			}
		});

		return () => {
			mounted = false;
			subscription.unsubscribe();
		};
	}, [navigate, location.pathname]);

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

	if (isLoading) {
		return (
			<div className="h-screen w-screen flex items-center justify-center bg-background">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
			</div>
		);
	}

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
				/>
			</div>
			<div className="flex-1 flex flex-col min-w-0 h-full pb-[60px] md:pb-0">
				<Header title={title} />
				<main className="flex-1 p-4 md:p-6 overflow-y-auto">
					{children}
				</main>
			</div>

			<MobileFooter />
		</div>
	);
};
