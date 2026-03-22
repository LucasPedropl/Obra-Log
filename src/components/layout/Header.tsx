import React, { useState, useEffect, useRef } from 'react';
import {
	Settings,
	User,
	LogOut,
	ChevronDown,
	Building2,
	HardHat,
	Plus,
	LayoutDashboard,
	X,
	Loader2,
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { env } from '../../config/env';
import { useToast } from '../../context/ToastContext';

export const Header: React.FC = () => {
	const [showDropdown, setShowDropdown] = useState(false);
	const [showProjectMenu, setShowProjectMenu] = useState(false);
	const [projects, setProjects] = useState<any[]>([]);
	const projectMenuRef = useRef<HTMLDivElement>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [newProjectName, setNewProjectName] = useState('');
	const [isCreating, setIsCreating] = useState(false);
	const { showToast } = useToast();

	const navigate = useNavigate();
	const location = useLocation();
	const [projectName, setProjectName] = useState<string | null>(null);

	const isProjectRoute =
		location.pathname.includes('/app/obras/') &&
		!location.pathname.includes('/app/obras/nova');
	const match = location.pathname.match(/\/app\/obras\/([^\/]+)/);
	const projectId = match ? match[1] : null;
	const companyId = localStorage.getItem('selectedCompanyId');

	const fetchProjectsList = async () => {
		if (!companyId) return;
		try {
			const res = await fetch(
				`${env.VITE_API_URL}/api/construction_sites?company_id=${companyId}`,
				{
					headers: {
						Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
					},
				},
			);
			if (res.ok) {
				const listData = await res.json();
				setProjects(listData);
			}
		} catch (error) {
			console.error('Error fetching projects list:', error);
		}
	};

	useEffect(() => {
		async function fetchCurrentProject() {
			if (projectId && isProjectRoute) {
				try {
					const projRes = await fetch(
						`${env.VITE_API_URL}/api/construction_sites/${projectId}`,
						{
							headers: {
								Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
							},
						},
					);

					if (projRes.ok) {
						const data = await projRes.json();
						setProjectName(data.name);
					} else {
						// Fallback quietly if project not found
						setProjectName(null);
					}
				} catch (error) {
					console.error('Error fetching project:', error);
					setProjectName(null);
				}
			} else {
				setProjectName(null);
			}
		}

		fetchCurrentProject();
		fetchProjectsList();
	}, [projectId, isProjectRoute, companyId]);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				projectMenuRef.current &&
				!projectMenuRef.current.contains(event.target as Node)
			) {
				setShowProjectMenu(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () =>
			document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleLogout = async () => {
		await supabase.auth.signOut();
		localStorage.removeItem('selectedCompanyId');
		navigate('/app/login');
	};

	const handleCreateProject = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newProjectName.trim() || !companyId) return;
		setIsCreating(true);

		try {
			const res = await fetch(
				`${env.VITE_API_URL}/api/construction_sites`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
					},
					body: JSON.stringify({
						name: newProjectName.trim(),
						company_id: companyId,
						status: 'ACTIVE',
					}),
				},
			);

			if (!res.ok) {
				throw new Error('Erro ao cadastrar obra');
			}

			const newProject = await res.json();
			showToast('Obra cadastrada com sucesso!', 'success');
			setNewProjectName('');
			setShowCreateModal(false);
			await fetchProjectsList();
			navigate(`/app/obras/${newProject.id}/visao-geral`);
		} catch (err: any) {
			showToast(err.message || 'Erro ao cadastrar obra', 'error');
		} finally {
			setIsCreating(false);
		}
	};

	return (
		<>
			<header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 z-40 relative">
				<div className="flex items-center gap-4">
					{companyId && (
						<div className="relative" ref={projectMenuRef}>
							<button
								onClick={() =>
									setShowProjectMenu(!showProjectMenu)
								}
								className="flex items-center gap-2 hover:bg-background p-2 rounded-lg transition-colors border border-transparent hover:border-border -ml-2 select-none"
							>
								<div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
									<Building2 size={14} />
								</div>
								<span className="font-semibold text-text-main pr-2 truncate max-w-[200px]">
									{projectName || 'Selecione uma obra...'}
								</span>
								<ChevronDown
									size={14}
									className={`text-text-muted transition-transform shrink-0 ${showProjectMenu ? 'rotate-180' : ''}`}
								/>
							</button>

							{showProjectMenu && (
								<div className="absolute left-0 mt-2 w-64 bg-surface border border-border shadow-xl rounded-xl overflow-hidden z-50 flex flex-col">
									<div className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider bg-background border-b border-border">
										Ir para a Obra
									</div>
									<div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col py-1">
										{projects.length > 0 ? (
											projects.map((proj) => (
												<Link
													key={proj.id}
													to={`/app/obras/${proj.id}/visao-geral`}
													onClick={() =>
														setShowProjectMenu(
															false,
														)
													}
													className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-background transition-colors ${proj.id === projectId ? 'text-primary font-medium bg-primary/5' : 'text-text-main'}`}
												>
													<HardHat
														size={16}
														className={
															proj.id ===
															projectId
																? 'text-primary'
																: 'text-text-muted shrink-0'
														}
													/>
													<span className="truncate">
														{proj.name}
													</span>
												</Link>
											))
										) : (
											<div className="px-4 py-3 text-sm text-text-muted text-center">
												Nenhuma obra cadastrada
											</div>
										)}
									</div>
									<div className="border-t border-border flex flex-col py-1 bg-background/50">
										<button
											onClick={() => {
												setShowProjectMenu(false);
												setShowCreateModal(true);
											}}
											className="flex items-center gap-3 px-4 py-2 w-full text-left text-sm text-text-main hover:bg-surface transition-colors"
										>
											<div className="w-5 h-5 rounded flex items-center justify-center bg-primary text-white shrink-0">
												<Plus size={14} />
											</div>
											<span>Nova Obra</span>
										</button>
										<Link
											to="/app/dashboard"
											onClick={() =>
												setShowProjectMenu(false)
											}
											className="flex items-center gap-3 px-4 py-2 text-sm text-text-main hover:bg-surface transition-colors border-t border-border/50 mt-1 pt-2"
										>
											<LayoutDashboard
												size={16}
												className="text-text-muted shrink-0"
											/>
											<span>Menu Principal</span>
										</Link>
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				<div className="flex items-center gap-4 text-text-muted">
					<div className="relative">
						<button
							onClick={() => setShowDropdown(!showDropdown)}
							className="flex items-center gap-3 hover:bg-background p-2 rounded-lg transition-colors text-text-main"
						>
							<div className="text-right">
								<div className="text-sm font-medium">
									Usuário
								</div>
								<div className="text-xs opacity-70">Admin</div>
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

			{/* Create Project Modal */}
			{showCreateModal && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div
						className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-lg mb-[10vh]"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between p-5 border-b border-border">
							<h2 className="text-xl font-bold text-text-main">
								Cadastrar Nova Obra
							</h2>
							<button
								onClick={() => setShowCreateModal(false)}
								className="p-2 text-text-muted hover:text-text-main hover:bg-background rounded-lg transition-colors"
							>
								<X size={20} />
							</button>
						</div>

						<form
							onSubmit={handleCreateProject}
							className="p-5 space-y-5"
						>
							<div>
								<label className="block text-sm font-medium text-text-main mb-1">
									Nome da Obra
								</label>
								<input
									type="text"
									value={newProjectName}
									onChange={(e) =>
										setNewProjectName(e.target.value)
									}
									required
									autoFocus
									className="w-full px-4 py-2.5 bg-background border border-border text-text-main rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-text-muted"
									placeholder="Ex: Residencial Alphaville"
								/>
							</div>

							<div className="flex justify-end pt-4 gap-3">
								<button
									type="button"
									onClick={() => setShowCreateModal(false)}
									className="px-4 py-2 text-text-muted hover:text-text-main font-medium transition-colors"
								>
									Cancelar
								</button>
								<button
									disabled={isCreating}
									type="submit"
									className="bg-primary hover:bg-primary-hover disabled:opacity-70 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
								>
									{isCreating ? (
										<Loader2 className="animate-spin w-4 h-4" />
									) : (
										<Plus size={18} />
									)}
									{isCreating
										? 'Cadastrando...'
										: 'Cadastrar Obra'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	);
};
