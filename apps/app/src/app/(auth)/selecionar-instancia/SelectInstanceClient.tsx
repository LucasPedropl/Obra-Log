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
import { 
	getUserAccountsAction, 
	getAccountInstancesAction, 
	createInstanceAction,
	activateAccountAction
} from '@/app/actions/authData';
import { SetupProfileModal } from '@/features/auth/components/SetupProfileModal';
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

interface Account {
	id: string;
	company_name: string;
	status: string;
	max_instances?: number;
}

interface Instance {
	id: string;
	name: string;
}

export function SelectInstanceClient() {
	const router = useRouter();
	const supabase = createClient();

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [userId, setUserId] = useState<string | null>(null);
	const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
	const [isGlobalAdmin, setIsGlobalAdmin] = useState<boolean>(false);
	const [accounts, setAccounts] = useState<Account[]>([]);
	const [selectedParentAccount, setSelectedParentAccount] =
		useState<Account | null>(null);
	
	// Onboarding state
	const [pendingAccount, setPendingAccount] = useState<Account | null>(null);
	const [onboardingCompanyName, setOnboardingCompanyName] = useState('');
	const [onboardingCnpj, setOnboardingCnpj] = useState('');
	const [isActivating, setIsActivating] = useState(false);
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
	const [requireSetup, setRequireSetup] = useState(false);
	const [authUser, setAuthUser] = useState<any | null>(null);

	useEffect(() => {
		const loadUserAndAccounts = async () => {
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
					return;
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
				setAuthUser(session.user);

				// Verifica se precisa configurar perfil (trocar senha temporária)
				if (session.user.user_metadata?.require_password_change) {
					setRequireSetup(true);
					setLoading(false);
					return;
				}

				// Paraleliza a busca de dados do usuário e das contas
				const [userDataResult, accountsResult] = await Promise.all([
					supabase
						.from('profiles')
						.select('is_super_admin')
						.eq('id', currentUserId)
						.maybeSingle(),
					getUserAccountsAction(currentUserId)
				]);

				if (userDataResult.data) {
					setIsSuperAdmin(userDataResult.data.is_super_admin);
				}

				if (!accountsResult.success) throw new Error(accountsResult.error);

				setIsGlobalAdmin(accountsResult.isGlobalAdmin || false);
				const mappedAccounts = (accountsResult.accounts as Account[]) || [];
				setAccounts(mappedAccounts);

				// Se houver uma conta PENDING e o usuário for Global Admin da conta, força onboarding
				const pending = mappedAccounts.find(acc => acc.status === 'PENDING');
				if (pending && accountsResult.isGlobalAdmin) {
					setPendingAccount(pending);
					setLoading(false);
					return;
				}

				if (mappedAccounts.length > 0) {
					await handleSelectAccount(mappedAccounts[0], currentUserId, accountsResult.isGlobalAdmin || false);
				}
			} catch (err: unknown) {
				console.error(err);
				setError('Não foi possível carregar as contas vinculadas.');
			} finally {
				setLoading(false);
			}
		};

		loadUserAndAccounts();
	}, []);

	const handleSelectAccount = async (account: Account, overrideUserId?: string, overrideIsGlobalAdmin?: boolean) => {
		setSelectedParentAccount(account);
		setLoadingInstances(true);
		try {
			const effectiveUserId = overrideUserId || userId;
			if (!effectiveUserId) return;

			// Usa o valor passado ou o estado (se disponível)
			const effectiveIsGlobal = overrideIsGlobalAdmin !== undefined ? overrideIsGlobalAdmin : isGlobalAdmin;

			const result = await getAccountInstancesAction(account.id, effectiveUserId, effectiveIsGlobal);

			if (!result.success) throw new Error(result.error);
			
			const instancesData = result.instances || [];
			setInstances(instancesData);
			
			// Se não houver instâncias, ativa o modo de criação imediatamente
			if (instancesData.length === 0) {
				setIsCreating(true);
			} else {
				setIsCreating(false);
			}
		} catch (err: unknown) {
			console.error(err);
		} finally {
			setLoadingInstances(false);
		}
	};

	const handleActivateAccount = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!pendingAccount || !onboardingCompanyName.trim()) return;

		setIsActivating(true);
		try {
			const result = await activateAccountAction(
				pendingAccount.id,
				onboardingCompanyName,
				onboardingCnpj
			);

			if (!result.success) throw new Error(result.error);

			// Recarrega as contas após ativação
			const accountsResult = await getUserAccountsAction(userId!);
			if (accountsResult.success) {
				const mappedAccounts = (accountsResult.accounts as Account[]) || [];
				setAccounts(mappedAccounts);
				setPendingAccount(null);
				
				// Seleciona a conta recém-ativada
				const activated = mappedAccounts.find(acc => acc.id === pendingAccount.id);
				if (activated) {
					await handleSelectAccount(activated);
				}
			}
		} catch (err: unknown) {
			console.error(err);
			setError((err as Error).message || 'Erro ao ativar conta');
		} finally {
			setIsActivating(false);
		}
	};

	const handleCreateInstance = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedParentAccount || !newInstanceName.trim()) return;

		setSavingInstance(true);
		try {
			const result = await createInstanceAction(selectedParentAccount.id, newInstanceName);

			if (!result.success) throw new Error(result.error);

			setNewInstanceName('');
			setIsCreating(false);

			// Reload instances
			handleSelectAccount(selectedParentAccount);
		} catch (err: unknown) {
			console.error(err);
			setError((err as Error).message || 'Erro ao criar instância');
		} finally {
			setSavingInstance(false);
		}
	};

	const handleSelectInstance = async (
		instanceId: string,
		accountId: string,
		remember: boolean = false,
	) => {
		document.cookie = `selectedCompanyId=${instanceId}; path=/; max-age=86400; SameSite=Lax`;
		document.cookie = `parentCompanyId=${accountId}; path=/; max-age=86400; SameSite=Lax`;

		if (remember || defaultInstanceId === instanceId) {
			document.cookie = `rememberedInstanceId=${instanceId}; path=/; max-age=2592000; SameSite=Lax`; // Salva por 30 dias
			document.cookie = `rememberedParentId=${accountId}; path=/; max-age=2592000; SameSite=Lax`;
		}

		router.push('/dashboard');
		router.refresh();
	};

	const handleSetDefaultCompany = (
		instanceId: string,
		accountId: string,
		checked: boolean,
	) => {
		if (checked) {
			setDefaultInstanceId(instanceId);
			document.cookie = `rememberedInstanceId=${instanceId}; path=/; max-age=2592000; SameSite=Lax`;
			document.cookie = `rememberedParentId=${accountId}; path=/; max-age=2592000; SameSite=Lax`;
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
			!selectedParentAccount
		)
			return;

		setSavingInstance(true);
		try {
			// Atualizando via cliente
			const { error: sbError } = await supabase
				.from('instances')
				.update({ name: editInstanceName })
				.eq('id', editingInstance.id);

			if (sbError) throw new Error(sbError.message);

			setEditingInstance(null);
			setEditInstanceName('');

			// Recarregar lista de instâncias perfeitamente baseada no pai
			handleSelectAccount(selectedParentAccount);
		} catch (err: unknown) {
			console.error(err);
			setError((err as Error).message || 'Erro ao editar instância');
		} finally {
			setSavingInstance(false);
		}
	};

	const handleLogout = async () => {
		await supabase.auth.signOut();
		document.cookie = 'selectedCompanyId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
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
	
	if (requireSetup && authUser) {
		return (
			<SetupProfileModal
				user={authUser}
				onComplete={() => {
					setRequireSetup(false);
					// Recarrega os dados do usuário para atualizar metadados
					window.location.reload();
				}}
			/>
		);
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
				<div className="flex flex-col items-center gap-6 animate-in fade-in duration-700">
					<div className="flex items-center gap-3 mb-4">
						<img
							src="/logo.png"
							alt="Obra-Log"
							className="h-12 animate-pulse"
							onError={(e) => (e.currentTarget.style.display = 'none')}
						/>
						<h1 className="text-3xl font-bold tracking-tighter text-foreground">
							Obra
							<span className="text-blue-600 dark:text-blue-500">
								Log
							</span>
						</h1>
					</div>
					<div className="flex flex-col items-center gap-3">
						<Loader2 className="h-10 w-10 animate-spin text-blue-600" />
						<p className="text-muted-foreground font-medium animate-pulse">
							Preparando seu acesso...
						</p>
					</div>
				</div>
			</div>
		);
	}

	if (pendingAccount) {
		return (
			<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
				<div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-300">
					<div className="flex flex-col items-center mb-8">
						<div className="w-16 h-16 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
							<Settings size={32} />
						</div>
						<h1 className="text-2xl font-bold text-foreground">
							Configuração de Conta
						</h1>
						<p className="text-muted-foreground text-sm mt-2">
							Quase lá! Precisamos de alguns dados da sua empresa para ativar seu acesso.
						</p>
					</div>

					{error && (
						<div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 text-left">
							{error}
						</div>
					)}

					<form onSubmit={handleActivateAccount} className="space-y-6">
						<div className="space-y-4 text-left">
							<div className="space-y-2">
								<label className="block text-sm font-medium text-foreground">
									Nome da Empresa (Razão Social ou Fantasia)
								</label>
								<input
									type="text"
									value={onboardingCompanyName}
									onChange={(e) => setOnboardingCompanyName(e.target.value)}
									required
									className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground"
									placeholder="Ex: Construtora Silva LTDA"
								/>
							</div>

							<div className="space-y-2">
								<label className="block text-sm font-medium text-foreground">
									CNPJ (Opcional)
								</label>
								<input
									type="text"
									value={onboardingCnpj}
									onChange={(e) => setOnboardingCnpj(e.target.value)}
									className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground"
									placeholder="00.000.000/0000-00"
								/>
							</div>
						</div>

						<button
							type="submit"
							disabled={isActivating || !onboardingCompanyName.trim()}
							className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-medium h-10 px-4 py-2 rounded-md transition-colors flex items-center justify-center text-sm mt-8"
						>
							{isActivating ? (
								<Loader2 className="animate-spin w-5 h-5" />
							) : (
								'Ativar Minha Conta'
							)}
						</button>
					</form>

					<button
						onClick={handleLogout}
						className="mt-6 w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
					>
						<LogOut size={16} /> Sair
					</button>
				</div>
			</div>
		);
	}

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
						{selectedParentAccount 
							? `Selecione a filial de ${selectedParentAccount.company_name}`
							: 'Selecione sua conta'}
					</h2>
					<p className="text-muted-foreground text-lg max-w-xl mx-auto">
						{selectedParentAccount
							? 'Escolha a instância (filial ou matriz) que deseja acessar para iniciar sua sessão.'
							: 'Selecione a conta que deseja gerenciar hoje.'}
					</p>
				</div>

				{!selectedParentAccount &&
					accounts.length === 0 &&
					!error && (
						<div className="text-muted-foreground">
							Nenhuma conta encontrada para este usuário.
						</div>
					)}

				{selectedParentAccount && (
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
																selectedParentAccount.id,
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
											</div>
										</div>
									))}

									{/* Botão de Adicionar (se limite permitir) */}
									{isGlobalAdmin && (!selectedParentAccount.max_instances ||
										instances.length <
											selectedParentAccount.max_instances) && (
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
										</button>
									)}
								</div>

								{/* Se houver múltiplas contas, mostra seletor de conta */}
								{accounts.length > 1 && (
									<div className="mt-8 p-4 bg-muted/30 rounded-2xl border border-border/50 flex flex-wrap justify-center gap-3">
										<p className="w-full text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
											Suas Contas
										</p>
										{accounts.map((acc) => (
											<button
												key={acc.id}
												onClick={() =>
													handleSelectAccount(acc)
												}
												className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
													selectedParentAccount.id ===
													acc.id
														? 'bg-blue-600 text-white shadow-md'
														: 'bg-background hover:bg-accent text-muted-foreground'
												}`}
											>
												{acc.company_name}
											</button>
										))}
									</div>
								)}

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
