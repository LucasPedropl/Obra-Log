import React, { useState, useEffect } from 'react';
import {
	Shield,
	Plus,
	Building2,
	Loader2,
	LogOut,
	Users,
	Key,
	ChevronRight,
	Search,
	Mail,
	AlertTriangle,
	User,
} from 'lucide-react';
import { adminService } from '../../features/admin/services/admin.service';
import { authService } from '../../features/auth/services/auth.service';
import { useAdminData, Company } from '../../features/admin/hooks/useAdminData';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../config/supabase';

export default function AdminDashboard() {
	const navigate = useNavigate();
	const [isVerifying, setIsVerifying] = useState(true);

	useEffect(() => {
		let mounted = true;

		const checkAuth = async () => {
			try {
				const {
					data: { session },
				} = await supabase.auth.getSession();

				if (!session && mounted) {
					navigate('/admin/login', { replace: true });
					return;
				}

				// Verifica se é super admin
				if (session?.user) {
					const { data: userData } = await supabase
						.from('users')
						.select('is_super_admin, full_name')
						.eq('id', session.user.id)
						.maybeSingle();

					if (!userData?.is_super_admin && mounted) {
						navigate('/admin/login', { replace: true });
						return;
					}

					if (mounted) {
						setAdminProfile({
							displayName:
								userData?.full_name ||
								session.user.email?.split('@')[0] ||
								'Usuário',
							role: 'Super Admin',
						});
					}
				}
			} catch (error) {
				console.error('Error checking auth:', error);
			} finally {
				if (mounted) setIsVerifying(false);
			}
		};

		checkAuth();
	}, [navigate]);

	const {
		companies,
		loading: loadingData,
		refetchCompanies,
	} = useAdminData();
	const [selectedCompany, setSelectedCompany] = useState<Company | null>(
		null,
	);
	const [searchTerm, setSearchTerm] = useState('');
	const { showToast } = useToast();

	// Form states
	const [companyName, setCompanyName] = useState('');
	const [adminEmail, setAdminEmail] = useState('');

	const [loading, setLoading] = useState(false);
	const [companyError, setCompanyError] = useState('');
	const [userError, setUserError] = useState('');
	const [result, setResult] = useState<{
		email: string;
		tempPass: string;
	} | null>(null);

	// Users list state
	const [companyUsers, setCompanyUsers] = useState<any[]>([]);
	const [loadingUsers, setLoadingUsers] = useState(false);
	const [resettingUserId, setResettingUserId] = useState<string | null>(null);

	// Header profile states
	const [adminProfile, setAdminProfile] = useState<{
		displayName: string;
		role: string;
	} | null>(null);
	const [showProfileMenu, setShowProfileMenu] = useState(false);

	// Modal states
	const [confirmModal, setConfirmModal] = useState<{
		isOpen: boolean;
		title: string;
		message: string;
		onConfirm: () => void;
		type: 'danger' | 'warning';
	}>({
		isOpen: false,
		title: '',
		message: '',
		onConfirm: () => {},
		type: 'warning',
	});

	useEffect(() => {
		if (selectedCompany) {
			fetchCompanyUsers(selectedCompany.id);
		} else {
			setCompanyUsers([]);
		}
	}, [selectedCompany]);

	// ... (funções de fetch e handlers continuam abaixo)
	// Como isVerifying pode demorar alguns ms, mostramos loader
	if (isVerifying) {
		return (
			<div className="h-screen w-screen flex items-center justify-center bg-slate-50">
				<Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
			</div>
		);
	}

	const fetchCompanyUsers = async (companyId: string) => {
		setLoadingUsers(true);
		try {
			const users = await adminService.getCompanyUsers(companyId);
			setCompanyUsers(users || []);
		} catch (err) {
			console.error('Erro ao buscar usuários:', err);
			showToast('Erro ao buscar usuários da empresa', 'error');
		} finally {
			setLoadingUsers(false);
		}
	};

	const handleCreateCompany = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setCompanyError('');
		try {
			const newCompany = await adminService.createCompany(companyName);
			setCompanyName('');
			await refetchCompanies();
			setSelectedCompany(newCompany);
			showToast('Empresa criada com sucesso!', 'success');
		} catch (err: any) {
			setCompanyError(err.message);
			showToast(err.message, 'error');
		} finally {
			setLoading(false);
		}
	};

	const handleCreateUser = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedCompany) return;
		setLoading(true);
		setUserError('');
		setResult(null);
		try {
			const res = await adminService.createCompanyAdmin(
				selectedCompany.id,
				adminEmail,
			);
			setResult({ email: res.email, tempPass: res.tempPassword });
			setAdminEmail('');
			fetchCompanyUsers(selectedCompany.id);
			showToast('Usuário criado com sucesso!', 'success');
		} catch (err: any) {
			setUserError(err.message);
			showToast(err.message, 'error');
		} finally {
			setLoading(false);
		}
	};

	const handleResetPassword = async (userId: string) => {
		setConfirmModal({
			isOpen: true,
			title: 'Resetar Senha',
			message:
				'Tem certeza que deseja gerar uma nova senha para este usuário? A senha atual será invalidada.',
			type: 'warning',
			onConfirm: async () => {
				setConfirmModal((prev) => ({ ...prev, isOpen: false }));
				setResettingUserId(userId);
				setUserError('');
				setResult(null);

				try {
					const res = await adminService.resetUserPassword(userId);
					setResult({ email: res.email, tempPass: res.tempPassword });
					showToast('Senha resetada com sucesso!', 'success');
				} catch (err: any) {
					setUserError(err.message);
					showToast(err.message, 'error');
				} finally {
					setResettingUserId(null);
				}
			},
		});
	};

	const handleLogout = async () => {
		await authService.logout();
		navigate('/admin/login');
	};

	const handleDeleteDatabase = () => {
		setConfirmModal({
			isOpen: true,
			title: 'Apagar Banco de Dados',
			message:
				'TEM CERTEZA? Esta ação apagará TODOS os dados do sistema (exceto seu usuário admin) e é irreversível.',
			type: 'danger',
			onConfirm: async () => {
				setConfirmModal((prev) => ({ ...prev, isOpen: false }));
				try {
					const user = await authService.getCurrentUser();
					await adminService.deleteDatabase(user.id);
					showToast('Banco de dados apagado com sucesso.', 'success');
					setTimeout(() => window.location.reload(), 2000);
				} catch (err: any) {
					showToast(
						'Erro ao apagar banco de dados: ' + err.message,
						'error',
					);
				}
			},
		});
	};

	const filteredCompanies = companies.filter((c) =>
		c.name.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	return (
		<div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
			{/* Sidebar */}
			<aside className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
				<div className="p-6 border-b border-slate-200 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-sm">
							<Shield size={20} />
						</div>
						<div>
							<h1 className="text-lg font-bold text-slate-900 leading-tight">
								Super-Admin
							</h1>
							<p className="text-xs text-slate-500 font-medium">
								Gestão de Tenants
							</p>
						</div>
					</div>
				</div>

				<div className="p-4 border-b border-slate-200 bg-slate-50/50">
					<form
						onSubmit={handleCreateCompany}
						className="flex flex-col gap-3"
					>
						<h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
							Nova Empresa
						</h2>
						{companyError && (
							<div className="p-2 bg-red-50 text-red-700 rounded-lg border border-red-100 text-xs">
								{companyError}
							</div>
						)}
						<div className="flex gap-2">
							<input
								type="text"
								required
								value={companyName}
								onChange={(e) => setCompanyName(e.target.value)}
								className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
								placeholder="Nome da Construtora"
							/>
							<button
								disabled={loading}
								className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white p-2 rounded-lg transition-colors flex items-center justify-center shadow-sm"
							>
								{loading ? (
									<Loader2 className="animate-spin w-5 h-5" />
								) : (
									<Plus size={20} />
								)}
							</button>
						</div>
					</form>
				</div>

				<div className="flex-1 overflow-hidden flex flex-col">
					<div className="p-4 pb-2">
						<div className="relative">
							<Search
								className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
								size={16}
							/>
							<input
								type="text"
								placeholder="Buscar empresas..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
							/>
						</div>
					</div>
					<div className="flex-1 overflow-y-auto p-2 space-y-1">
						{loadingData ? (
							<div className="flex justify-center p-8">
								<Loader2 className="animate-spin text-indigo-600" />
							</div>
						) : filteredCompanies.length === 0 ? (
							<p className="text-sm text-slate-500 text-center py-8">
								Nenhuma empresa encontrada.
							</p>
						) : (
							filteredCompanies.map((company) => (
								<button
									key={company.id}
									onClick={() => {
										setSelectedCompany(company);
										setResult(null);
										setUserError('');
									}}
									className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${
										selectedCompany?.id === company.id
											? 'bg-indigo-50 text-indigo-900'
											: 'bg-transparent text-slate-600 hover:bg-slate-100'
									}`}
								>
									<div className="flex items-center gap-3 overflow-hidden">
										<div
											className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedCompany?.id === company.id ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}
										>
											<Building2 size={16} />
										</div>
										<div className="truncate">
											<div className="font-semibold text-sm truncate">
												{company.name}
											</div>
											<div className="text-[10px] opacity-60 font-mono mt-0.5">
												{company.id.split('-')[0]}
											</div>
										</div>
									</div>
									<ChevronRight
										size={16}
										className={
											selectedCompany?.id === company.id
												? 'text-indigo-400'
												: 'text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity'
										}
									/>
								</button>
							))
						)}
					</div>
				</div>

				<div className="p-4 border-t border-slate-200">
					<button
						onClick={handleLogout}
						className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mb-2"
					>
						<LogOut size={16} /> Sair do Painel
					</button>
					<button
						onClick={handleDeleteDatabase}
						className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-colors border border-red-200"
					>
						<Shield size={16} /> Apagar Todo o Banco
					</button>
				</div>
			</aside>

			{/* Main Content */}
			<main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
				{/* Top Header */}
				<header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-6 shrink-0">
					<div className="relative">
						<button
							onClick={() => setShowProfileMenu(!showProfileMenu)}
							className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-lg transition-colors text-slate-700"
						>
							<div className="text-right">
								<div className="text-sm font-medium capitalize">
									{adminProfile?.displayName ||
										'Carregando...'}
								</div>
								<div className="text-xs text-slate-500">
									{adminProfile?.role || ''}
								</div>
							</div>
							<div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
								<User size={16} />
							</div>
						</button>

						{showProfileMenu && (
							<div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 shadow-lg rounded-lg overflow-hidden z-50">
								<button
									onClick={handleLogout}
									className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
								>
									<LogOut size={16} />
									<span>Sair do sistema</span>
								</button>
							</div>
						)}
					</div>
				</header>

				<div className="flex-1 overflow-y-auto">
					{selectedCompany ? (
						<div className="max-w-4xl mx-auto p-8 md:p-12">
							<div className="mb-10">
								<div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold tracking-wide uppercase mb-4">
									Tenant Selecionado
								</div>
								<h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
									{selectedCompany.name}
								</h2>
								<p className="text-slate-500 mt-2 text-lg">
									Gerencie os acessos administrativos e
									configurações desta empresa.
								</p>
							</div>

							<div className="grid md:grid-cols-2 gap-8">
								{/* Form de Criação de Admin */}
								<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 flex flex-col">
									<div className="flex items-center gap-3 mb-6">
										<div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
											<Key size={20} />
										</div>
										<div>
											<h3 className="text-lg font-bold text-slate-900">
												Novo Acesso Admin
											</h3>
											<p className="text-xs text-slate-500">
												Gere credenciais para o cliente
											</p>
										</div>
									</div>

									{userError && (
										<div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">
											{userError}
										</div>
									)}

									{result ? (
										<div className="flex-1 flex flex-col justify-center">
											<div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
												<div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
													<Key size={24} />
												</div>
												<h3 className="text-emerald-800 font-bold text-lg mb-2">
													Acesso Gerado!
												</h3>
												<p className="text-emerald-700 mb-6 text-sm">
													Envie estas credenciais para
													o cliente.
												</p>

												<div className="bg-white p-4 rounded-lg border border-emerald-100 font-mono text-sm text-left space-y-2">
													<div className="flex flex-col">
														<span className="text-xs text-slate-400 uppercase tracking-wider">
															E-mail
														</span>
														<span className="font-medium text-slate-800">
															{result.email}
														</span>
													</div>
													<div className="flex flex-col">
														<span className="text-xs text-slate-400 uppercase tracking-wider">
															Senha Temporária
														</span>
														<span className="font-medium text-slate-800">
															{result.tempPass}
														</span>
													</div>
												</div>

												<button
													onClick={() =>
														setResult(null)
													}
													className="mt-6 text-emerald-600 hover:text-emerald-800 text-sm font-medium transition-colors"
												>
													Gerar outro acesso
												</button>
											</div>
										</div>
									) : (
										<form
											onSubmit={handleCreateUser}
											className="flex-1 flex flex-col"
										>
											<div className="flex-1">
												<label className="block text-sm font-medium text-slate-700 mb-2">
													E-mail Corporativo
												</label>
												<div className="relative">
													<Mail
														className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
														size={18}
													/>
													<input
														type="email"
														required
														value={adminEmail}
														onChange={(e) =>
															setAdminEmail(
																e.target.value,
															)
														}
														className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
														placeholder="admin@empresa.com"
													/>
												</div>
												<p className="text-xs text-slate-500 mt-3 leading-relaxed">
													O usuário receberá uma senha
													temporária e será solicitado
													a definir seu nome e uma
													nova senha no primeiro
													acesso.
												</p>
											</div>

											<button
												disabled={loading}
												className="mt-8 w-full bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-300 text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
											>
												{loading ? (
													<Loader2 className="animate-spin w-5 h-5" />
												) : (
													<Plus size={18} />
												)}{' '}
												Gerar Credenciais
											</button>
										</form>
									)}
								</div>

								{/* Lista de Usuários */}
								<div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
									<div className="p-6 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
										<div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
											<Users size={20} />
										</div>
										<div>
											<h3 className="text-lg font-bold text-slate-900">
												Usuários Ativos
											</h3>
											<p className="text-xs text-slate-500">
												Administradores da empresa
											</p>
										</div>
									</div>

									<div className="flex-1 overflow-y-auto p-2">
										{loadingUsers ? (
											<div className="p-12 flex justify-center">
												<Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
											</div>
										) : companyUsers.length === 0 ? (
											<div className="p-12 text-center flex flex-col items-center">
												<div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
													<Users
														className="text-slate-300"
														size={24}
													/>
												</div>
												<p className="text-slate-500 font-medium">
													Nenhum usuário cadastrado
												</p>
												<p className="text-sm text-slate-400 mt-1">
													Gere o primeiro acesso ao
													lado.
												</p>
											</div>
										) : (
											<div className="space-y-1">
												{companyUsers.map((cu: any) => (
													<div
														key={cu.id}
														className="p-4 hover:bg-slate-50 rounded-xl transition-colors flex flex-col gap-2 border-b border-slate-100 last:border-0"
													>
														<div className="flex items-center gap-4">
															<div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
																{cu.full_name
																	?.charAt(0)
																	.toUpperCase() ||
																	cu.email
																		?.charAt(
																			0,
																		)
																		.toUpperCase() ||
																	'?'}
															</div>
															<div className="flex-1 min-w-0">
																<div className="font-semibold text-slate-900 text-sm truncate flex items-center gap-2">
																	{cu.full_name ||
																		'Pendente (Primeiro Acesso)'}
																	{cu.require_password_change && (
																		<span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] rounded font-bold uppercase tracking-wider">
																			Pendente
																		</span>
																	)}
																</div>
																<div className="text-xs text-slate-500 truncate">
																	{cu.email}
																</div>
															</div>
															<div className="shrink-0 flex items-center gap-2">
																<span
																	className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
																		cu.status ===
																		'ACTIVE'
																			? 'bg-emerald-100 text-emerald-800'
																			: 'bg-slate-100 text-slate-800'
																	}`}
																>
																	{cu.status}
																</span>
																{cu.status ===
																	'ACTIVE' && (
																	<button
																		onClick={() =>
																			handleResetPassword(
																				cu.id,
																			)
																		}
																		disabled={
																			resettingUserId ===
																			cu.id
																		}
																		title="Gerar nova senha temporária"
																		className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
																	>
																		{resettingUserId ===
																		cu.id ? (
																			<Loader2
																				size={
																					16
																				}
																				className="animate-spin"
																			/>
																		) : (
																			<Key
																				size={
																					16
																				}
																			/>
																		)}
																	</button>
																)}
															</div>
														</div>
														{cu.temp_password &&
															cu.require_password_change && (
																<div className="ml-14 mt-1 bg-slate-100 p-2 rounded-lg text-xs font-mono text-slate-600 flex justify-between items-center">
																	<span>
																		Senha
																		Temp:{' '}
																		<strong className="text-slate-900">
																			{
																				cu.temp_password
																			}
																		</strong>
																	</span>
																	<span className="text-[10px] text-slate-400 uppercase">
																		Aguardando
																		troca
																	</span>
																</div>
															)}
													</div>
												))}
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					) : (
						<div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50">
							<div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-200">
								<Building2
									className="text-slate-300"
									size={40}
								/>
							</div>
							<h2 className="text-2xl font-bold text-slate-800 mb-2">
								Nenhuma empresa selecionada
							</h2>
							<p className="text-slate-500 max-w-md">
								Selecione uma empresa no menu lateral para
								gerenciar seus acessos ou crie uma nova empresa
								para começar.
							</p>
						</div>
					)}
				</div>
			</main>

			{/* Confirmation Modal */}
			{confirmModal.isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
					<div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
						<div
							className={`p-6 border-b ${confirmModal.type === 'danger' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}
						>
							<div className="flex items-center gap-3">
								<div
									className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
										confirmModal.type === 'danger'
											? 'bg-red-100 text-red-600'
											: 'bg-amber-100 text-amber-600'
									}`}
								>
									<AlertTriangle size={20} />
								</div>
								<h3
									className={`text-lg font-bold ${confirmModal.type === 'danger' ? 'text-red-900' : 'text-amber-900'}`}
								>
									{confirmModal.title}
								</h3>
							</div>
						</div>
						<div className="p-6">
							<p className="text-slate-600 leading-relaxed">
								{confirmModal.message}
							</p>
						</div>
						<div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
							<button
								onClick={() =>
									setConfirmModal((prev) => ({
										...prev,
										isOpen: false,
									}))
								}
								className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
							>
								Cancelar
							</button>
							<button
								onClick={confirmModal.onConfirm}
								className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm ${
									confirmModal.type === 'danger'
										? 'bg-red-600 hover:bg-red-700'
										: 'bg-amber-600 hover:bg-amber-700'
								}`}
							>
								Confirmar Ação
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
