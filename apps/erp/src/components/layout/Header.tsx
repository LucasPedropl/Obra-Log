import React, { useState, useEffect, useRef } from 'react';
import {
	Settings,
	User,
	LogOut,
	ChevronDown,
	Menu,
	Package,
	Users,
	KeyRound,
	FileText,
	LayoutDashboard,
	HardHat,
	X,
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../config/supabase';

export const Header: React.FC = () => {
	const [showDropdown, setShowDropdown] = useState(false);
	const [showMobileGlobalMenu, setShowMobileGlobalMenu] = useState(false);

	const navigate = useNavigate();
	const location = useLocation();
	const [userProfile, setUserProfile] = useState<{
		displayName: string;
		role: string;
	} | null>(null);

	const companyId = localStorage.getItem('selectedCompanyId');

	useEffect(() => {
		async function fetchUserProfile() {
			try {
				const {
					data: { user },
				} = await supabase.auth.getUser();
				if (!user) return;

				// Buscando no banco para ver o nome e o perfil do usuário
				const { data } = await supabase
					.from('users')
					.select('full_name, is_super_admin')
					.eq('id', user.id)
					.maybeSingle();

				let displayName =
					data?.full_name || user.email?.split('@')[0] || 'Usuário';
				let role = data?.is_super_admin ? 'Super Admin' : 'Admin'; // Todo: Adjust based on your role rules later

				setUserProfile({ displayName, role });
			} catch (error) {
				console.error('Error fetching user profile:', error);
			}
		}

		fetchUserProfile();
	}, []);

	const handleLogout = async () => {
		await supabase.auth.signOut();
		localStorage.removeItem('selectedCompanyId');
		navigate('/app/login');
	};

	return (
		<>
			<header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 md:px-6 z-40 relative shrink-0">
				<div className="flex items-center gap-2 md:gap-4">
					<button
								className="md:hidden p-2 text-text-main hover:bg-background rounded-lg transition-colors"
								onClick={() => setShowMobileGlobalMenu(true)}
							>
								<Menu size={24} />
							</button>
				</div>

				<div className="flex items-center gap-2 md:gap-4 text-text-muted">
					<div className="relative">
						<button
							onClick={() => setShowDropdown(!showDropdown)}
							className="flex items-center gap-2 md:gap-3 hover:bg-background p-2 rounded-lg transition-colors text-text-main"
						>
							<div className="text-right hidden sm:block">
								<div className="text-sm font-medium capitalize">
									{userProfile?.displayName ||
										'Carregando...'}
								</div>
								<div className="text-xs opacity-70">
									{userProfile?.role || ''}
								</div>
							</div>
							<div className="w-8 h-8 rounded-full bg-border flex items-center justify-center">
								<User size={16} />
							</div>
						</button>

						{showDropdown && (
							<div className="absolute right-0 mt-2 w-48 bg-surface border border-border shadow-lg rounded-lg overflow-hidden z-50">
								<button
									onClick={handleLogout}
									className="w-full flex items-center gap-2 px-4 py-3 text-red-500 hover:bg-background transition-colors text-sm font-medium"
								>
									<LogOut size={16} />
									<span>Sair do sistema</span>
								</button>
							</div>
						)}
					</div>
					<Link
						to="/app/configuracoes"
						className="hover:text-primary transition-colors text-text-main"
					>
						<Settings size={20} />
					</Link>
				</div>
			</header>

			{/* Mobile Global Menu Drawer */}
			{showMobileGlobalMenu && (
				<div
					className="fixed inset-0 z-[100] flex bg-black/60 backdrop-blur-sm"
					onClick={() => setShowMobileGlobalMenu(false)}
				>
					<div
						className="w-64 bg-surface h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-200"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between p-4 border-b border-border bg-background/50">
							<h2 className="font-bold text-text-main flex items-center gap-2">
								<LayoutDashboard
									size={20}
									className="text-primary"
								/>
								Menu Principal
							</h2>
							<button
								onClick={() => setShowMobileGlobalMenu(false)}
								className="p-2 text-text-muted hover:text-text-main bg-background rounded-lg"
							>
								<X size={18} />
							</button>
						</div>
						<div className="flex-1 overflow-y-auto py-2">
							<Link
								to="/app/dashboard"
								onClick={() => setShowMobileGlobalMenu(false)}
								className="flex items-center gap-3 px-4 py-3 text-sm text-text-main hover:bg-background transition-colors"
							>
								<div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-text-muted shrink-0">
									<LayoutDashboard size={16} />
								</div>
								Dashboard
							</Link>
							<Link
								to="/app/obras/nova"
								onClick={() => setShowMobileGlobalMenu(false)}
								className="flex items-center gap-3 px-4 py-3 text-sm text-text-main hover:bg-background transition-colors"
							>
								<div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-text-muted shrink-0">
									<HardHat size={16} />
								</div>
								Obras
							</Link>
							<Link
								to="/app/mao-de-obra"
								onClick={() => setShowMobileGlobalMenu(false)}
								className="flex items-center gap-3 px-4 py-3 text-sm text-text-main hover:bg-background transition-colors"
							>
								<div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-text-muted shrink-0">
									<Users size={16} />
								</div>
								Mão de Obra
							</Link>
							<Link
								to="/app/config-dados/insumos"
								onClick={() => setShowMobileGlobalMenu(false)}
								className="flex items-center gap-3 px-4 py-3 text-sm text-text-main hover:bg-background transition-colors"
							>
								<div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-text-muted shrink-0">
									<Package size={16} />
								</div>
								Insumos
							</Link>

							<div className="mt-4 px-4 pb-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
								Configurações e Acesso
							</div>
							<Link
								to="/app/acesso/usuarios"
								onClick={() => setShowMobileGlobalMenu(false)}
								className="flex items-center gap-3 px-4 py-3 text-sm text-text-main hover:bg-background transition-colors"
							>
								<div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-text-muted shrink-0">
									<KeyRound size={16} />
								</div>
								Usuários
							</Link>
							<Link
								to="/app/configuracoes"
								onClick={() => setShowMobileGlobalMenu(false)}
								className="flex items-center gap-3 px-4 py-3 text-sm text-text-main hover:bg-background transition-colors"
							>
								<div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-text-muted shrink-0">
									<Settings size={16} />
								</div>
								Configurações
							</Link>
						</div>
					</div>
				</div>
			)}
		</>
	);
};
