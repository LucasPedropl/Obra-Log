'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	LogOut,
	Building2,
	Plus,
	Loader2,
	Edit,
	Settings,
	MoreVertical,
	Globe,
} from 'lucide-react';
import { createClient } from '@/config/supabase';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';

interface Company {
	id: string;
	name: string;
	fantasy_name: string;
	cnpj: string;
	parent_tenant_id?: string | null;
	parent_id?: string | null;
	max_instances?: number;
}

interface Instance {
	id: string;
	name: string;
	cnpj: string;
}

export function SelectInstanceClient() {
	const router = useRouter();
	const supabase = createClient();

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [userId, setUserId] = useState<string | null>(null);
	const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
	const [companies, setCompanies] = useState<Company[]>([]);
	const [selectedParentCompany, setSelectedParentCompany] =
		useState<Company | null>(null);
	const [instances, setInstances] = useState<Instance[]>([]);
	const [loadingInstances, setLoadingInstances] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [newInstanceName, setNewInstanceName] = useState('');
	const [editingInstance, setEditingInstance] = useState<Instance | null>(
		null,
	);
	const [editInstanceName, setEditInstanceName] = useState('');
	const [savingInstance, setSavingInstance] = useState(false);
	const [contextMenuOpen, setContextMenuOpen] = useState<string | null>(null);
	const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
	const [defaultInstanceId, setDefaultInstanceId] = useState<string | null>(
		null,
	);

	useEffect(() => {
		const loadUserAndCompanies = async () => {
			try {
				// Checar auto-login primeiro
				const matchInstance = document.cookie.match(
					/(^| )rememberedInstanceId=([^;]+)/,
				);
				const matchParent = document.cookie.match(
					/(^| )rememberedParentId=([^;]+)/,
				);

				if (matchInstance) {
					setDefaultInstanceId(matchInstance[2]);
				}

				if (matchInstance && matchParent) {
					document.cookie = `selectedCompanyId=${matchInstance[2]}; path=/; max-age=86400; SameSite=Lax`;
					document.cookie = `parentCompanyId=${matchParent[2]}; path=/; max-age=86400; SameSite=Lax`;
					router.push('/dashboard');
					router.refresh();
					return; // Para o fluxo de tela e transita
				}

				const {
					data: { session },
				} = await supabase.auth.getSession();
				if (!session?.user) {
					router.push('/auth/login');
					return;
				}

				const currentUserId = session.user.id;
				setUserId(currentUserId);

				// Verifica se é Super Admin
				const { data: userData } = await supabase
					.from('users')
					.select('is_super_admin')
					.eq('id', currentUserId)
					.maybeSingle();

				if (userData) {
					setIsSuperAdmin(userData.is_super_admin);
				}

				const response = await fetch(
					`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005'}/api/users/${currentUserId}/companies`,
					{
						headers: {
							Authorization: `Bearer ${session.access_token}`,
						},
					},
				);

				if (!response.ok) {
					console.error(
						'Erro na resposta da API:',
						response.status,
						response.statusText,
					);
					throw new Error('Falha ao buscar empresas');
				}

				const data = await response.json();

				// Extraí a empresa (`companies`) do join do banco se vier aninhado, caso contrário usa o próprio objeto
				const mappedCompanies: Company[] = data.map(
					(item: Company | { companies: Company }) =>
						'companies' in item ? item.companies : item,
				);

				// Filtra valores nulos/vazios
				const validCompanies = mappedCompanies.filter(Boolean);

				setCompanies(validCompanies);

				// Se tiver pelo menos uma empresa raiz, seleciona automaticamente a primeira
				const parentCompanies = validCompanies.filter(
					(c) => !c.parent_tenant_id,
				);
				if (parentCompanies.length > 0) {
					handleSelectCompany(parentCompanies[0]);
				}
			} catch (err: unknown) {
				console.error(err);
				setError('Não foi possível carregar as empresas vinculadas.');
			} finally {
				setLoading(false);
			}
		};

		loadUserAndCompanies();
	}, []);

	const handleSelectCompany = async (company: Company) => {
		setSelectedParentCompany(company);
		setLoadingInstances(true);
		try {
			const {
				data: { session },
			} = await supabase.auth.getSession();

			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005'}/api/companies/${company.id}/instances`,
				{
					headers: {
						Authorization: `Bearer ${session?.access_token}`,
					},
				},
			);
			if (!response.ok) throw new Error('Falha ao buscar instâncias');

			const data = await response.json();
			setInstances(data);
			if (data.length === 0) {
				setIsCreating(true);
			}
		} catch (err: unknown) {
			console.error(err);
			// Fallback ou erro
		} finally {
			setLoadingInstances(false);
		}
	};

	const handleCreateInstance = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedParentCompany || !newInstanceName.trim()) return;

		setSavingInstance(true);
		try {
			const {
				data: { session },
			} = await supabase.auth.getSession();

			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005'}/api/companies/${selectedParentCompany.id}/instances`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${session?.access_token}`,
					},
					body: JSON.stringify({ name: newInstanceName }),
				},
			);

			if (!response.ok)
				throw new Error('Erro ao criar instância da empresa');

			const data = await response.json();
			setNewInstanceName('');
			setIsCreating(false);

			// Reload instances
			handleSelectCompany(selectedParentCompany);
		} catch (err: unknown) {
			console.error(err);
			setError((err as Error).message || 'Erro ao criar instância');
		} finally {
			setSavingInstance(false);
		}
	};

	const handleSelectInstance = async (
		instanceId: string,
		companyId: string,
		remember: boolean = false,
	) => {
		document.cookie = `selectedCompanyId=${instanceId}; path=/; max-age=86400; SameSite=Lax`;
		document.cookie = `parentCompanyId=${companyId}; path=/; max-age=86400; SameSite=Lax`;

		if (remember || defaultInstanceId === instanceId) {
			document.cookie = `rememberedInstanceId=${instanceId}; path=/; max-age=2592000; SameSite=Lax`; // Salva por 30 dias
			document.cookie = `rememberedParentId=${companyId}; path=/; max-age=2592000; SameSite=Lax`;
		}

		router.push('/dashboard');
		router.refresh();
	};

	const handleSetDefaultCompany = (
		instanceId: string,
		companyId: string,
		checked: boolean,
	) => {
		if (checked) {
			setDefaultInstanceId(instanceId);
			document.cookie = `rememberedInstanceId=${instanceId}; path=/; max-age=2592000; SameSite=Lax`;
			document.cookie = `rememberedParentId=${companyId}; path=/; max-age=2592000; SameSite=Lax`;
		} else {
			if (defaultInstanceId === instanceId) {
				setDefaultInstanceId(null);
			}
			document.cookie = `rememberedInstanceId=; path=/; max-age=0; SameSite=Lax`;
			document.cookie = `rememberedParentId=; path=/; max-age=0; SameSite=Lax`;
		}
	};

	const handleEditInstance = async (e: React.FormEvent) => {
		e.preventDefault();
		if (
			!editingInstance ||
			!editInstanceName.trim() ||
			!selectedParentCompany
		)
			return;

		setSavingInstance(true);
		try {
			// Atualizando diretamente via cliente (admin possui RLS) ou pela API
			const { error: sbError } = await supabase
				.from('companies')
				.update({ name: editInstanceName })
				.eq('id', editingInstance.id);

			if (sbError) throw new Error(sbError.message);

			setEditingInstance(null);
			setEditInstanceName('');

			// Recarregar lista de instâncias perfeitamente baseada no pai
			handleSelectCompany(selectedParentCompany);
		} catch (err: unknown) {
			console.error(err);
			setError((err as Error).message || 'Erro ao editar instância');
		} finally {
			setSavingInstance(false);
		}
	};

	const handleLogout = async () => {
		await supabase.auth.signOut();
		router.push('/auth/login');
		router.refresh();
	};

	const getInitials = (name: string) => {
		if (!name) return 'EX';
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.substring(0, 2)
			.toUpperCase();
	};

	if (isCreating) {
		return (
			<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
				<div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-300">
					<div className="flex flex-col items-center mb-8">
						<div className="w-16 h-16 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
							<Building2 size={32} />
						</div>
						<h1 className="text-2xl font-bold text-foreground">
							{instances.length === 0
								? 'Bem-vindo ao ObraLog'
								: 'Nova Instância'}
						</h1>
						<p className="text-muted-foreground text-sm mt-2">
							{instances.length === 0
								? 'Para começar, cadastre o nome da primeira instância no sistema.'
								: 'Adicione o nome da nova instância (empresa) que utilizará o sistema.'}
						</p>
					</div>

					{error && (
						<div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 text-left">
							{error}
						</div>
					)}

					<form onSubmit={handleCreateInstance} className="space-y-6">
						<div className="space-y-2 text-left">
							<label className="block text-sm font-medium text-foreground">
								Nome da Instância
							</label>
							<input
								type="text"
								value={newInstanceName}
								onChange={(e) =>
									setNewInstanceName(e.target.value)
								}
								required
								className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground"
								placeholder="Construtora Exemplo Ltda."
							/>
						</div>

						<div className="flex gap-3 mt-8">
							{instances.length > 0 && (
								<button
									type="button"
									onClick={() => setIsCreating(false)}
									className="flex-1 bg-transparent border border-input hover:bg-accent text-foreground font-medium h-10 px-4 py-2 rounded-md transition-colors flex items-center justify-center text-sm"
								>
									Cancelar
								</button>
							)}
							<button
								type="submit"
								disabled={savingInstance}
								className={`flex-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-medium h-10 px-4 py-2 rounded-md transition-colors flex items-center justify-center text-sm ${instances.length === 0 ? 'w-full' : ''}`}
							>
								{savingInstance ? (
									<Loader2 className="animate-spin w-5 h-5" />
								) : instances.length === 0 ? (
									'Salvar e Continuar'
								) : (
									'Adicionar'
								)}
							</button>
						</div>
					</form>

					{instances.length === 0 && (
						<button
							onClick={handleLogout}
							className="mt-6 w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
						>
							<LogOut size={16} /> Sair
						</button>
					)}
				</div>
			</div>
		);
	}

	if (editingInstance) {
		return (
			<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
				<div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-300">
					<div className="flex flex-col items-center mb-8">
						<div className="w-16 h-16 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
							<Edit size={32} />
						</div>
						<h1 className="text-2xl font-bold text-foreground">
							Editar Instância
						</h1>
						<p className="text-muted-foreground text-sm mt-2">
							Modifique o nome da sua filial de sistema
						</p>
					</div>

					{error && (
						<div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 text-left">
							{error}
						</div>
					)}

					<form onSubmit={handleEditInstance} className="space-y-6">
						<div className="space-y-2 text-left">
							<label className="block text-sm font-medium text-foreground">
								Novo Nome da Instância
							</label>
							<input
								type="text"
								value={editInstanceName}
								onChange={(e) =>
									setEditInstanceName(e.target.value)
								}
								required
								autoFocus
								className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground"
								placeholder="Use um nome descritivo"
							/>
						</div>

						<div className="flex gap-3 mt-8">
							<button
								type="button"
								onClick={() => {
									setEditingInstance(null);
									setEditInstanceName('');
								}}
								className="flex-1 bg-transparent border border-input hover:bg-accent text-foreground font-medium h-10 px-4 py-2 rounded-md transition-colors flex items-center justify-center text-sm"
							>
								Cancelar
							</button>
							<button
								type="submit"
								disabled={savingInstance}
								className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-medium h-10 px-4 py-2 rounded-md transition-colors flex items-center justify-center text-sm"
							>
								{savingInstance ? (
									<Loader2 className="animate-spin w-5 h-5" />
								) : (
									'Salvar Alterações'
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
			<div className="absolute top-8 left-8 flex items-center gap-2">
				<img
					src="/logo.png"
					alt="Obra-Log"
					className="h-10 opacity-90 transition-all hover:opacity-100"
					onError={(e) => (e.currentTarget.style.display = 'none')}
				/>
				<h1 className="text-2xl font-bold tracking-tighter text-foreground">
					Obra
					<span className="text-blue-600 dark:text-blue-500">
						Log
					</span>
				</h1>
			</div>

			<div className="absolute top-8 right-8 flex items-center gap-4">
				<Button
					variant="outline"
					className="text-muted-foreground hover:text-foreground rounded-full px-5 shadow-sm transition-all"
					onClick={handleLogout}
				>
					Sair
					<LogOut className="h-4 w-4 ml-2" />
				</Button>
			</div>

			<div className="w-full max-w-5xl text-center space-y-12 animate-in fade-in duration-700 zoom-in-95">
				<div className="space-y-4">
					<h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground">
						{!selectedParentCompany
							? 'Carregando instâncias...'
							: `Selecione a filial de ${selectedParentCompany.fantasy_name || selectedParentCompany.name}`}
					</h2>
					<p className="text-muted-foreground text-lg max-w-xl mx-auto">
						{!selectedParentCompany
							? 'Aguarde um momento.'
							: 'Escolha a instância (filial ou matriz) que deseja acessar para iniciar sua sessão.'}
					</p>
				</div>

				{loading && (
					<div className="flex justify-center gap-8 flex-wrap">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="flex flex-col items-center gap-4 animate-pulse"
							>
								<Skeleton className="h-32 w-32 md:h-40 md:w-40 rounded-2xl bg-muted/60" />
								<Skeleton className="h-4 w-24 bg-muted/60" />
							</div>
						))}
					</div>
				)}

				{/* Automatic selection implies we just show loading or instances directly, so no need for company selection list if we only ever have 1 */}
				{!loading &&
					!selectedParentCompany &&
					companies.length === 0 &&
					!error && (
						<div className="text-muted-foreground">
							Nenhuma empresa encontrada para este usuário.
						</div>
					)}

				{selectedParentCompany && (
					<div className="flex flex-col items-center gap-10">
						{loadingInstances ? (
							<div className="flex justify-center gap-8 flex-wrap">
								<Skeleton className="h-32 w-32 md:h-40 md:w-40 rounded-2xl bg-muted/60 animate-pulse" />
							</div>
						) : (
							<div className="flex flex-col items-center gap-12 w-full max-w-4xl mx-auto">
								<div className="grid grid-cols-2 gap-4 sm:gap-6 md:flex md:flex-wrap md:gap-8 justify-center items-start w-full px-4 md:px-0">
									{/* Lista de Filiais */}
									{instances.map((instance, index) => (
										<div
											key={instance.id}
											className="group flex flex-col items-center gap-2 sm:gap-5 transition-all duration-500 hover:-translate-y-2 relative"
											style={{
												animationDelay: `${index * 50}ms`,
											}}
											onContextMenu={(e) => {
												e.preventDefault();
												setMenuPosition({
													x: e.clientX,
													y: e.clientY,
												});
												setContextMenuOpen(instance.id);
											}}
										>
											<div className="relative h-32 w-32 md:h-48 md:w-48 rounded-3xl bg-card flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border-2 border-border/80 hover:shadow-2xl hover:border-blue-500/60 dark:border-border/60 transition-all duration-500 overflow-hidden">
												{/* Ação principal (Entrar) */}
												<button
													onClick={(e) => {
														if (
															window.innerWidth <
															768
														) {
															e.preventDefault();
															const rect =
																e.currentTarget.getBoundingClientRect();
															setMenuPosition({
																x:
																	rect.left +
																	rect.width /
																		2,
																y:
																	rect.top +
																	rect.height /
																		2,
															});
															setContextMenuOpen(
																instance.id,
															);
														} else {
															handleSelectInstance(
																instance.id,
																selectedParentCompany.id,
															);
														}
													}}
													className="absolute inset-0 flex flex-col items-center justify-center w-full h-full z-10 focus:outline-none bg-gradient-to-b from-transparent to-background/5 p-4"
												>
													<div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform duration-500 ease-out shadow-inner">
														<span className="text-2xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
															{getInitials(
																instance.name,
															)}
														</span>
													</div>
												</button>

												{/* Ações Rápidas (Hover) */}
												<div className="absolute top-2 left-2 right-2 flex justify-between z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-1 pointer-events-none">
													<div className="flex gap-1 pointer-events-auto">
														<button
															onClick={(e) => {
																e.stopPropagation();
																setEditInstanceName(
																	instance.name,
																);
																setEditingInstance(
																	instance,
																);
															}}
															className="p-1.5 bg-blue-600/90 hover:bg-blue-500 rounded-md text-white transition-colors backdrop-blur-sm"
															title="Editar Instância"
														>
															<Edit size={14} />
														</button>
														<button
															onClick={(e) => {
																e.stopPropagation();
																// Todo: Lógica de configuração
															}}
															className="p-1.5 bg-slate-600/90 hover:bg-slate-500 rounded-md text-white transition-colors backdrop-blur-sm"
															title="Configurar Instância"
														>
															<Settings
																size={14}
															/>
														</button>
													</div>

													<div className="pointer-events-auto">
														<button
															onClick={(e) => {
																e.stopPropagation();
																setMenuPosition(
																	{
																		x: e.clientX,
																		y: e.clientY,
																	},
																);
																setContextMenuOpen(
																	instance.id,
																);
															}}
															className="h-8 w-8 rounded-full bg-white/90 dark:bg-black/80 hover:bg-white dark:hover:bg-black shadow-sm flex items-center justify-center text-slate-700 dark:text-slate-300 transition-colors backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50"
														>
															<MoreVertical
																size={14}
															/>
														</button>
													</div>
												</div>
											</div>
											<div className="flex flex-col items-center">
												<span className="text-foreground/90 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-semibold text-sm md:text-base transition-colors max-w-[140px] md:max-w-[160px] truncate text-center">
													{instance.name}
												</span>
												{instance.cnpj && (
													<span className="text-muted-foreground/60 font-medium text-[10px] md:text-xs mt-1 bg-secondary/50 px-2 py-0.5 rounded-full border border-border/40">
														{instance.cnpj}
													</span>
												)}
											</div>
										</div>
									))}

									{/* Botão de Adicionar (se limite permitir) */}
									{(!selectedParentCompany.max_instances ||
										instances.length <
											selectedParentCompany.max_instances) && (
										<button
											onClick={() => setIsCreating(true)}
											className="group flex flex-col items-center gap-5 transition-all duration-500 hover:-translate-y-2"
										>
											<div className="h-32 w-32 md:h-48 md:w-48 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-border/80 hover:border-blue-500/60 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all bg-card/30 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-2xl duration-500">
												<div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-secondary/80 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 flex items-center justify-center transition-colors mb-2">
													<Plus
														size={32}
														className="text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
													/>
												</div>
												<span className="text-sm md:text-base font-medium text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors font-semibold">
													Nova Filial
												</span>
											</div>
											<div className="flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
												<span className="text-transparent font-medium text-base h-6">
													{/* Espaçamento compensatório para alinhar */}
												</span>
											</div>
										</button>
									)}
								</div>

								{/* Botão de Configurações Globais apenas para Super Admins */}
								{isSuperAdmin && (
									<div className="mt-8 pt-8 w-full flex justify-center">
										<button
											onClick={() =>
												router.push('/admin/usuarios')
											}
											className="flex items-center gap-3 px-6 py-2.5 bg-card hover:bg-accent rounded-full border border-border shadow-sm text-muted-foreground hover:text-foreground transition-all font-medium focus:outline-none group"
										>
											<Settings
												size={18}
												className="text-primary/70 group-hover:text-primary transition-colors"
											/>
											<span>
												Painel de Administração Global
											</span>
										</button>
									</div>
								)}
							</div>
						)}
					</div>
				)}

				{error && (
					<div className="text-destructive mt-4 p-4 bg-destructive/10 rounded-lg inline-block">
						{error}
					</div>
				)}

				{/* Menu de Contexto Global */}
				<div
					style={{
						position: 'fixed',
						top: menuPosition.y,
						left: menuPosition.x,
						pointerEvents: 'none',
						width: 0,
						height: 0,
						zIndex: 9999,
					}}
				/>
				<DropdownMenu
					open={!!contextMenuOpen}
					onOpenChange={(open) => !open && setContextMenuOpen(null)}
				>
					<DropdownMenuTrigger asChild>
						{/* O Trigger Invisível ficará atrelado ao próprio root ou usando as props absolute de portal */}
						<div
							style={{
								position: 'fixed',
								top: menuPosition.y,
								left: menuPosition.x,
								width: 0,
								height: 0,
								pointerEvents: 'none',
							}}
						/>
					</DropdownMenuTrigger>
					{instances.find((i) => i.id === contextMenuOpen) &&
						selectedParentCompany && (
							<DropdownMenuContent
								className="w-56 bg-popover/95 backdrop-blur-xl border-border/60 text-popover-foreground shadow-2xl rounded-xl p-1.5"
								align="start"
							>
								<DropdownMenuItem
									className="cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium"
									onClick={() => {
										setContextMenuOpen(null);
										handleSelectInstance(
											contextMenuOpen!,
											selectedParentCompany.id,
										);
									}}
								>
									Acessar Instância
								</DropdownMenuItem>

								<DropdownMenuCheckboxItem
									className="cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium"
									checked={
										defaultInstanceId === contextMenuOpen
									}
									onCheckedChange={(checked) => {
										handleSetDefaultCompany(
											contextMenuOpen!,
											selectedParentCompany.id,
											checked,
										);
									}}
									onClick={(e) => e.preventDefault()}
								>
									Lembrar como Padrão
								</DropdownMenuCheckboxItem>

								<DropdownMenuSeparator className="bg-border/60 my-1.5" />

								<DropdownMenuItem
									className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium"
									onClick={() => {
										const inst = instances.find(
											(i) => i.id === contextMenuOpen,
										);
										setContextMenuOpen(null);
										if (inst) {
											setEditInstanceName(inst.name);
											setEditingInstance(inst);
										}
									}}
								>
									<Edit className="mr-2.5 h-4 w-4 opacity-70" />{' '}
									Editar Instância
								</DropdownMenuItem>

								<DropdownMenuItem
									className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium"
									onClick={() => {
										setContextMenuOpen(null);
									}}
								>
									<Settings className="mr-2.5 h-4 w-4 opacity-70" />{' '}
									Configurar Instância
								</DropdownMenuItem>
							</DropdownMenuContent>
						)}
				</DropdownMenu>
			</div>
		</div>
	);
}
