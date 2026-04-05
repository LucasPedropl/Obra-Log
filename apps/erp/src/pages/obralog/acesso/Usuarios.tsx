import React, { useState, useEffect } from 'react';
import { ERPLayout } from '../../../components/layout/ERPLayout';
import { useAuth } from '../../../context/AuthContext';
import { useEscape } from '../../../hooks/useEscape';
import {
	Plus,
	Download,
	Upload,
	X,
	Copy,
	CheckCircle2,
	Search,
	ChevronDown,
	Pencil,
	Trash,
	Key,
} from 'lucide-react';

export default function Usuarios() {
	const { isAllowed } = useAuth();
	const [users, setUsers] = useState<any[]>([]);
	const [profiles, setProfiles] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState('');

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [formData, setFormData] = useState({
		fullName: '',
		email: '',
		profileId: '',
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [tempPasswordModal, setTempPasswordModal] = useState<{
		isOpen: boolean;
		password: string;
		email: string;
	} | null>(null);

	useEscape(() => {
		setIsModalOpen(false);
		setTempPasswordModal(null);
	});
	const [copied, setCopied] = useState(false);

	const companyId = localStorage.getItem('selectedCompanyId');

	useEffect(() => {
		if (companyId) {
			fetchUsers();
			fetchProfiles();
		}
	}, [companyId]);

	const fetchUsers = async () => {
		try {
			setIsLoading(true);
			const API_URL =
				import.meta.env.VITE_API_URL || 'http://localhost:5005';
			const res = await fetch(
				`${API_URL}/api/tenant/users?company_id=${companyId}`,
			);
			if (!res.ok) throw new Error('Erro ao buscar usuários');
			const data = await res.json();
			setUsers(data);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchProfiles = async () => {
		try {
			const API_URL =
				import.meta.env.VITE_API_URL || 'http://localhost:5005';
			const res = await fetch(
				`${API_URL}/api/access_profiles?company_id=${companyId}`,
			);
			if (!res.ok) throw new Error('Erro ao buscar perfis de acesso');
			const data = await res.json();
			setProfiles(data);
		} catch (err) {
			console.error(err);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		try {
			const API_URL =
				import.meta.env.VITE_API_URL || 'http://localhost:5005';

			const url = editingId
				? `${API_URL}/api/tenant/users/${editingId}`
				: `${API_URL}/api/tenant/users`;

			const response = await fetch(url, {
				method: editingId ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					company_id: companyId,
					full_name: formData.fullName,
					email: formData.email,
					profile_id: formData.profileId || null,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error ||
						`Erro ao ${editingId ? 'atualizar' : 'criar'} usuário`,
				);
			}

			const data = await response.json();

			if (!editingId) {
				setTempPasswordModal({
					isOpen: true,
					email: data.email,
					password: data.temp_password,
				});
			}

			setIsModalOpen(false);
			setFormData({ fullName: '', email: '', profileId: '' });
			setEditingId(null);
			fetchUsers();
		} catch (err: any) {
			alert(err.message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async (id: string) => {
		try {
			const API_URL =
				import.meta.env.VITE_API_URL || 'http://localhost:5005';
			const response = await fetch(`${API_URL}/api/tenant/users/${id}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Erro ao excluir usuário');
			}
			fetchUsers();
		} catch (err: any) {
			alert(err.message);
		}
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const filteredUsers = users.filter(
		(u) =>
			u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			u.email?.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	return (
		<ERPLayout>
			<div className="space-y-6 w-full">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-text-main">
							Usuários
						</h1>
						<p className="text-text-muted mt-1">
							Gerencie os usuários do sistema e os níveis de
							acesso.
						</p>
					</div>
					{isAllowed('usuarios', 'create') && (
						<button
							onClick={() => {
								setEditingId(null);
								setFormData({
									fullName: '',
									email: '',
									profileId: '',
								});
								setIsModalOpen(true);
							}}
							className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
						>
							<Plus size={18} />
							Novo Usuário
						</button>
					)}
				</div>

				<div className="bg-surface border border-border rounded-sm shadow-sm overflow-hidden p-4 sm:p-6">
					<div className="flex flex-col sm:flex-row gap-4 mb-6">
						<div className="relative flex-1">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Search size={18} className="text-text-muted" />
							</div>
							<input
								type="text"
								placeholder="Pesquisar usuário..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary transition-colors"
							/>
						</div>
						<div className="flex gap-2">
							<button className="flex items-center gap-2 bg-background border border-border text-text-main px-4 py-2 rounded-lg hover:border-primary/50 transition-colors">
								<ChevronDown size={20} />
								<span>Filtros</span>
							</button>
						</div>
					</div>

					<div className="overflow-x-auto bg-surface border border-border rounded-lg">
						<table className="w-full text-left [&_th]:border-b [&_th]:border-border [&_td]:border-b [&_td]:border-border [&_tbody_tr:last-child_td]:border-b-0">
							<thead className="bg-background border-b border-border">
								<tr>
									<th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
										Nome
									</th>
									<th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
										Email
									</th>
									<th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
										Perfil
									</th>
									<th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
										Status
									</th>
									<th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap text-right">
										Ações
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{isLoading ? (
									<tr>
										<td
											colSpan={5}
											className="px-6 py-8 text-center text-text-muted"
										>
											Carregando...
										</td>
									</tr>
								) : error ? (
									<tr>
										<td
											colSpan={4}
											className="px-6 py-8 text-center text-red-500"
										>
											{error}
										</td>
									</tr>
								) : filteredUsers.length === 0 ? (
									<tr>
										<td
											colSpan={5}
											className="px-6 py-8 text-center text-text-muted"
										>
											Nenhum usuário encontrado.
										</td>
									</tr>
								) : (
									filteredUsers.map((user, idx) => (
										<tr
											key={idx}
											className="hover:bg-black/5 dark:hover:bg-white/5 even:bg-black/[0.02] dark:even:bg-white/[0.02] transition-colors"
										>
											<td className="px-6 py-4 font-medium text-text-main">
												{user.full_name}
											</td>
											<td className="px-6 py-4 text-text-muted">
												{user.email}
											</td>
											<td className="px-6 py-4 text-sm">
												<span className="bg-background flex items-center w-fit px-2 py-1 rounded-md border border-border text-text-muted">
													{user.profile_name}
												</span>
											</td>
											<td className="px-6 py-4">
												{user.require_password_change ? (
													<span
														className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 cursor-pointer hover:bg-orange-200 transition-colors"
														title="Usuário Pendente. Clique para ver a senha."
														onClick={() => {
															if (
																user.temp_password
															) {
																setTempPasswordModal(
																	{
																		isOpen: true,
																		email: user.email,
																		password:
																			user.temp_password,
																	},
																);
															}
														}}
													>
														Pendente
													</span>
												) : (
													<span
														className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
															user.status ===
															'ACTIVE'
																? 'bg-green-100 text-green-700'
																: 'bg-red-100 text-red-700'
														}`}
													>
														{user.status ===
														'ACTIVE'
															? 'Ativo'
															: 'Inativo'}
													</span>
												)}
											</td>
											<td className="px-6 py-4 text-right">
												<div className="flex items-center justify-end gap-2">
													{isAllowed(
														'usuarios',
														'view',
													) &&
														user.require_password_change &&
														user.temp_password && (
															<button
																className="p-2 text-text-muted hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-colors"
																title="Ver Senha Temporária"
																onClick={() => {
																	setTempPasswordModal(
																		{
																			isOpen: true,
																			email: user.email,
																			password:
																				user.temp_password,
																		},
																	);
																}}
															>
																<Key
																	size={18}
																/>
															</button>
														)}
													{isAllowed(
														'usuarios',
														'edit',
													) && (
														<button
															className="p-2 text-text-muted hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
															title="Editar"
															onClick={() => {
																setEditingId(
																	user.id,
																);
																setFormData({
																	fullName:
																		user.full_name,
																	email: user.email,
																	profileId:
																		user.profile_id ||
																		'',
																});
																setIsModalOpen(
																	true,
																);
															}}
														>
															<Pencil size={18} />
														</button>
													)}
													{isAllowed(
														'usuarios',
														'delete',
													) && (
														<button
															className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
															title="Excluir"
															onClick={() => {
																if (
																	window.confirm(
																		'Tem certeza que deseja excluir ' +
																			user.full_name +
																			'?',
																	)
																) {
																	handleDelete(
																		user.id,
																	);
																}
															}}
														>
															<Trash size={18} />
														</button>
													)}
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{isModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
					<div className="bg-surface w-full max-w-md rounded-2xl shadow-xl border border-border flex flex-col">
						<div className="flex items-center justify-between px-6 py-4 border-b border-border">
							<h2 className="text-lg font-bold text-text-main">
								{editingId ? 'Editar Usuário' : 'Novo Usuário'}
							</h2>
							<button
								onClick={() => setIsModalOpen(false)}
								className="p-2 hover:bg-background rounded-lg text-text-muted hover:text-text-main transition-colors"
							>
								<X size={20} />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="p-6 space-y-4">
							<div className="space-y-1.5">
								<label className="text-sm font-medium text-text-main">
									Nome Completo *
								</label>
								<input
									type="text"
									required
									value={formData.fullName}
									onChange={(e) =>
										setFormData({
											...formData,
											fullName: e.target.value,
										})
									}
									placeholder="Ex: João Silva"
									className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
								/>
							</div>

							<div className="space-y-1.5">
								<label className="text-sm font-medium text-text-main">
									Email Corporativo *
								</label>
								<input
									type="email"
									required
									value={formData.email}
									onChange={(e) =>
										setFormData({
											...formData,
											email: e.target.value,
										})
									}
									placeholder="Ex: joao@empresa.com"
									className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
								/>
							</div>

							<div className="space-y-1.5">
								<label className="text-sm font-medium text-text-main">
									Perfil de Acesso / Função *
								</label>
								<select
									required
									value={formData.profileId}
									onChange={(e) =>
										setFormData({
											...formData,
											profileId: e.target.value,
										})
									}
									className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
								>
									<option value="" disabled>
										Selecione o perfil...
									</option>
									{profiles.map((p) => (
										<option key={p.id} value={p.id}>
											{p.name}
										</option>
									))}
								</select>
							</div>

							<div className="pt-4 flex justify-end gap-3 pt-6 mt-4">
								<button
									type="button"
									onClick={() => setIsModalOpen(false)}
									className="px-5 py-2.5 text-text-main font-medium hover:bg-background rounded-lg transition-colors"
								>
									Cancelar
								</button>
								<button
									type="submit"
									disabled={isSubmitting}
									className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors disabled:opacity-50"
								>
									{isSubmitting ? 'Salvando...' : 'Salvar'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{tempPasswordModal?.isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div className="bg-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
						<div className="flex flex-col items-center justify-center pt-8 pb-6 px-6 text-center border-b border-border">
							<div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
								<CheckCircle2 className="w-8 h-8 text-green-500" />
							</div>
							<h2 className="text-2xl font-bold text-text-main mb-2">
								Usuário Criado!
							</h2>
							<p className="text-text-muted max-w-sm">
								Uma senha temporária foi gerada. Forneça esta
								senha para que o usuário possa acessar o
								sistema.
							</p>
						</div>

						<div className="p-6 bg-background/50">
							<div className="space-y-4">
								<div>
									<label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1 block">
										Email do Usuário
									</label>
									<div className="font-medium text-text-main">
										{tempPasswordModal.email}
									</div>
								</div>

								<div>
									<label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1 block">
										Senha Temporária
									</label>
									<div className="flex items-center gap-2">
										<div className="bg-surface border border-border rounded-lg px-4 py-3 font-mono text-lg text-primary tracking-wider w-full select-all">
											{tempPasswordModal.password}
										</div>
										<button
											onClick={() =>
												copyToClipboard(
													tempPasswordModal.password,
												)
											}
											className="h-12 w-12 flex items-center justify-center bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors shrink-0"
											title="Copiar senha"
										>
											{copied ? (
												<CheckCircle2 size={20} />
											) : (
												<Copy size={20} />
											)}
										</button>
									</div>
								</div>
							</div>
						</div>

						<div className="p-4 bg-surface border-t border-border flex justify-end">
							<button
								onClick={() => setTempPasswordModal(null)}
								className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors"
							>
								Concluir e Fechar
							</button>
						</div>
					</div>
				</div>
			)}
		</ERPLayout>
	);
}
