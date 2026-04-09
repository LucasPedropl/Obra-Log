import React, { useState, useEffect } from 'react';
import {
	Plus,
	Building2,
	Users,
	Loader2,
	Key,
	Mail,
	X,
	ChevronDown,
	ChevronUp,
	Trash2,
	Pencil,
	AlertTriangle,
} from 'lucide-react';
import { ERPLayout } from '../../components/layout/ERPLayout';
import { useAdminData, Company } from '../../features/admin/hooks/useAdminData';
import { adminService } from '../../features/admin/services/admin.service';
import { useToast } from '../../context/ToastContext';
import { useEscape } from '../../hooks/useEscape';

export default function EmpresasAdmin() {
	const {
		companies,
		loading: loadingData,
		refetchCompanies,
	} = useAdminData();
	const { showToast } = useToast();

	const [newCompanyName, setNewCompanyName] = useState('');
	const [newCompanyInstances, setNewCompanyInstances] = useState<number>(1);
	const [loadingCreate, setLoadingCreate] = useState(false);

	// Selection / Deletion
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [isDeleting, setIsDeleting] = useState(false);

	// Modals & Popups States
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedCompany, setSelectedCompany] = useState<Company | null>(
		null,
	);

	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
	const [editCompanyName, setEditCompanyName] = useState('');
	const [isEditing, setIsEditing] = useState(false);

	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [deleteTargetIds, setDeleteTargetIds] = useState<string[]>([]);

	useEscape(() => {
		setIsModalOpen(false);
		setIsEditModalOpen(false);
		setIsDeleteConfirmOpen(false);
	});

	// Admin Form
	const [adminEmail, setAdminEmail] = useState('');
	const [loadingAdmin, setLoadingAdmin] = useState(false);
	const [companyAdmins, setCompanyAdmins] = useState<any[]>([]);
	const [loadingAdmins, setLoadingAdmins] = useState(false);
	const [result, setResult] = useState<{
		email: string;
		tempPass: string;
	} | null>(null);

	// Users list
	const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

	useEffect(() => {
		if (selectedCompany && isModalOpen) {
			loadAdmins(selectedCompany.id);
			setResult(null);
			setExpandedUserId(null);
		} else {
			setCompanyAdmins([]);
		}
	}, [selectedCompany, isModalOpen]);

	const loadAdmins = async (companyId: string) => {
		setLoadingAdmins(true);
		try {
			const users = await adminService.getCompanyUsers(companyId);
			setCompanyAdmins(users || []);
		} catch (err) {
			showToast('Erro ao buscar administradores da empresa', 'error');
		} finally {
			setLoadingAdmins(false);
		}
	};

	const handleCreateCompany = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newCompanyName.trim()) return;

		setLoadingCreate(true);
		try {
			await adminService.createCompany(
				newCompanyName,
				newCompanyInstances,
			);
			setNewCompanyName('');
			setNewCompanyInstances(1);
			await refetchCompanies();
			showToast('Empresa criada com sucesso!', 'success');
		} catch (err: any) {
			showToast(err.message || 'Erro ao criar empresa', 'error');
		} finally {
			setLoadingCreate(false);
		}
	};

	const openDeleteConfirm = (ids: string[], e?: React.MouseEvent) => {
		if (e) e.stopPropagation();
		setDeleteTargetIds(ids);
		setIsDeleteConfirmOpen(true);
	};

	const executeDelete = async () => {
		if (deleteTargetIds.length === 0) return;

		setIsDeleting(true);
		try {
			for (const id of deleteTargetIds) {
				await adminService.deleteCompany(id);
			}
			setSelectedIds((prev) =>
				prev.filter((id) => !deleteTargetIds.includes(id)),
			);
			await refetchCompanies();
			showToast(
				`${deleteTargetIds.length} empresa(s) excluída(s) com sucesso.`,
				'success',
			);
			setIsDeleteConfirmOpen(false);
			setDeleteTargetIds([]);
		} catch (err: any) {
			showToast(
				err.message ||
					'Erro ao excluir empresas. O processo foi interrompido.',
				'error',
			);
		} finally {
			setIsDeleting(false);
		}
	};

	const openEditModal = (company: Company, e: React.MouseEvent) => {
		e.stopPropagation();
		setCompanyToEdit(company);
		setEditCompanyName(company.name);
		setIsEditModalOpen(true);
	};

	const handleEditCompany = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!companyToEdit || !editCompanyName.trim()) return;

		setIsEditing(true);
		try {
			await adminService.updateCompany(companyToEdit.id, editCompanyName);
			await refetchCompanies();
			showToast('Empresa atualizada com sucesso!', 'success');
			setIsEditModalOpen(false);
			setCompanyToEdit(null);
			setEditCompanyName('');
		} catch (err: any) {
			showToast(err.message || 'Erro ao atualizar empresa', 'error');
		} finally {
			setIsEditing(false);
		}
	};

	const toggleSelectAll = () => {
		if (selectedIds.length === companies.length) {
			setSelectedIds([]);
		} else {
			setSelectedIds(companies.map((c) => c.id));
		}
	};

	const toggleSelection = (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		if (selectedIds.includes(id)) {
			setSelectedIds((prev) =>
				prev.filter((selectedId) => selectedId !== id),
			);
		} else {
			setSelectedIds((prev) => [...prev, id]);
		}
	};

	const handleCreateAdmin = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedCompany || !adminEmail.trim()) return;

		setLoadingAdmin(true);
		setResult(null);
		try {
			const res = await adminService.createCompanyAdmin(
				selectedCompany.id,
				adminEmail,
			);
			setResult({ email: res.email, tempPass: res.tempPassword });
			setAdminEmail('');
			await loadAdmins(selectedCompany.id);
			showToast('Administrador criado com sucesso!', 'success');
		} catch (err: any) {
			showToast(err.message || 'Erro ao criar administrador', 'error');
		} finally {
			setLoadingAdmin(false);
		}
	};

	const openCompanyModal = (company: Company) => {
		setSelectedCompany(company);
		setIsModalOpen(true);
	};

	const closeModal = () => {
		setIsModalOpen(false);
		setTimeout(() => setSelectedCompany(null), 300);
	};

	return (
		<ERPLayout title="Gestão de Empresas">
			<div className="flex-1 min-h-screen bg-slate-50 -m-4 md:-m-6 p-6 md:p-8">
				{/* Usando w-full para preencher 100% da largura disponivel em vez de max-w limitando */}
				<div className="w-full">
					<div className="flex flex-col gap-6">
						{/* Criar Empresa */}
						<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
							<h2 className="text-lg font-bold text-slate-800 mb-4">
								Cadastrar Nova Empresa
							</h2>
							<form
								onSubmit={handleCreateCompany}
								className="flex flex-col md:flex-row gap-4"
							>
								<input
									type="text"
									placeholder="Nome da construtora"
									value={newCompanyName}
									onChange={(e) =>
										setNewCompanyName(e.target.value)
									}
									className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
									required
								/>
								<div className="flex flex-col md:flex-row items-center gap-2">
									<label className="text-sm font-medium text-slate-700 whitespace-nowrap">
										Instâncias Max:
									</label>
									<input
										type="number"
										min="1"
										placeholder="Qtd."
										value={newCompanyInstances}
										onChange={(e) =>
											setNewCompanyInstances(
												parseInt(e.target.value) || 1,
											)
										}
										className="w-24 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
										required
									/>
								</div>
								<button
									disabled={loadingCreate}
									type="submit"
									className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-8 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
								>
									{loadingCreate ? (
										<Loader2 className="w-4 h-4 animate-spin" />
									) : (
										<Plus className="w-4 h-4" />
									)}
									Cadastrar Empresa
								</button>
							</form>
						</div>

						{/* Ações em Massa (Exclusão) */}
						{selectedIds.length > 0 && (
							<div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-top-4">
								<div className="flex items-center gap-3">
									<span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
										{selectedIds.length}
									</span>
									<span className="text-sm font-medium text-slate-700">
										{selectedIds.length === 1
											? 'empresa selecionada'
											: 'empresas selecionadas'}
									</span>
								</div>
								<button
									onClick={() =>
										openDeleteConfirm(selectedIds)
									}
									className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
								>
									<Trash2 className="w-4 h-4" />
									Excluir Selecionadas
								</button>
							</div>
						)}

						{/* Tabela de Empresas */}
						<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
							<div className="p-6 border-b border-slate-100 bg-slate-50/50">
								<h2 className="text-lg font-bold text-slate-800">
									Empresas Cadastradas
								</h2>
								<p className="text-sm text-slate-500">
									Clique em uma empresa para gerenciar seus
									administradores.
								</p>
							</div>
							<div className="overflow-x-auto">
								<table className="w-full text-left border-collapse min-w-[500px]">
									<thead>
										<tr className="border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider bg-white">
											<th className="px-6 py-4 w-12 text-center">
												<input
													type="checkbox"
													className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
													checked={
														companies.length > 0 &&
														selectedIds.length ===
															companies.length
													}
													onChange={toggleSelectAll}
												/>
											</th>
											<th className="px-4 py-4">
												Nome da Empresa
											</th>
											<th className="px-6 py-4 w-32 text-center">
												Status
											</th>
											<th className="px-6 py-4 w-40 text-right">
												Ações
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-100 bg-white">
										{loadingData ? (
											<tr>
												<td
													colSpan={4}
													className="px-6 py-8 text-center"
												>
													<Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
												</td>
											</tr>
										) : companies.length === 0 ? (
											<tr>
												<td
													colSpan={4}
													className="px-6 py-8 text-center text-slate-500"
												>
													Nenhuma empresa cadastrada.
												</td>
											</tr>
										) : (
											companies.map((company) => {
												const isSelected =
													selectedIds.includes(
														company.id,
													);
												return (
													<tr
														key={company.id}
														onClick={() =>
															openCompanyModal(
																company,
															)
														}
														className={`cursor-pointer transition-colors ${
															isSelected
																? 'bg-blue-50/50 hover:bg-blue-50'
																: 'hover:bg-slate-50'
														}`}
													>
														<td
															className="px-6 py-4 w-12 text-center"
															onClick={(e) =>
																toggleSelection(
																	company.id,
																	e,
																)
															}
														>
															<input
																type="checkbox"
																className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
																checked={
																	isSelected
																}
																onChange={() => {}} // Controlled by the td wrapper onClick
															/>
														</td>
														<td className="px-4 py-4">
															<div className="flex items-center gap-4">
																<div
																	className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${isSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}
																>
																	<Building2 className="w-5 h-5" />
																</div>
																<div className="font-medium text-slate-900">
																	{
																		company.name
																	}
																</div>
															</div>
														</td>
														<td className="px-6 py-4 w-32 text-center">
															<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
																Ativo
															</span>
														</td>
														<td className="px-6 py-4 w-40 text-right">
															<div className="flex items-center justify-end gap-2">
																<button
																	onClick={(
																		e,
																	) =>
																		openEditModal(
																			company,
																			e,
																		)
																	}
																	className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
																	title="Editar"
																>
																	<Pencil className="w-4 h-4" />
																</button>
																<button
																	onClick={(
																		e,
																	) =>
																		openDeleteConfirm(
																			[
																				company.id,
																			],
																			e,
																		)
																	}
																	className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
																	title="Excluir"
																>
																	<Trash2 className="w-4 h-4" />
																</button>
															</div>
														</td>
													</tr>
												);
											})
										)}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>

				{/* MODAL EDITAR EMPRESA */}
				{isEditModalOpen && companyToEdit && (
					<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
						<div
							className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="flex items-center justify-between p-6 border-b border-slate-100">
								<h2 className="text-xl font-bold text-slate-900">
									Editar Empresa
								</h2>
								<button
									onClick={() => setIsEditModalOpen(false)}
									className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
								>
									<X className="w-5 h-5" />
								</button>
							</div>
							<form onSubmit={handleEditCompany} className="p-6">
								<div className="mb-6">
									<label className="block text-sm font-medium text-slate-700 mb-2">
										Nome da Empresa
									</label>
									<input
										type="text"
										value={editCompanyName}
										onChange={(e) =>
											setEditCompanyName(e.target.value)
										}
										className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900"
										required
									/>
								</div>
								<div className="flex justify-end gap-3">
									<button
										type="button"
										onClick={() =>
											setIsEditModalOpen(false)
										}
										className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
									>
										Cancelar
									</button>
									<button
										type="submit"
										disabled={
											isEditing ||
											!editCompanyName.trim() ||
											editCompanyName ===
												companyToEdit.name
										}
										className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
									>
										{isEditing ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											'Salvar Alterações'
										)}
									</button>
								</div>
							</form>
						</div>
					</div>
				)}

				{/* MODAL CONFIRMAÇÃO DE DELEÇÃO */}
				{isDeleteConfirmOpen && (
					<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
						<div
							className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="p-6 pt-8 text-center flex flex-col items-center">
								<div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
									<AlertTriangle className="w-8 h-8" />
								</div>
								<h2 className="text-xl font-bold text-slate-900 mb-2">
									Excluir Empresa
									{deleteTargetIds.length > 1 ? 's' : ''}?
								</h2>
								<p className="text-slate-500 mb-6 max-w-sm">
									Tem certeza que deseja excluir{' '}
									{deleteTargetIds.length === 1
										? 'esta empresa'
										: `estas ${deleteTargetIds.length} empresas`}{' '}
									e todos os seus vínculos? Esta ação é{' '}
									<b>irreversível</b>.
								</p>
								<div className="flex justify-center gap-3 w-full">
									<button
										onClick={() =>
											setIsDeleteConfirmOpen(false)
										}
										disabled={isDeleting}
										className="flex-1 px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
									>
										Cancelar
									</button>
									<button
										onClick={executeDelete}
										disabled={isDeleting}
										className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
									>
										{isDeleting ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											'Sim, Excluir'
										)}
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* MODAL DE GERENCIAMENTO DE ACESSOS (READ ONLY) */}
				{isModalOpen && selectedCompany && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
						{/* Modal Container: Tamanho e altura fixos, responsivo no mobile */}
						<div
							className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] md:h-[650px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
							onClick={(e) => e.stopPropagation()}
						>
							{/* Header do Modal */}
							<div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white shrink-0">
								<div>
									<h2 className="text-xl font-bold text-slate-900">
										Acessos da Empresa
									</h2>
									<p className="text-sm text-slate-500">
										{selectedCompany.name}
									</p>
								</div>
								<button
									onClick={closeModal}
									className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
								>
									<X className="w-5 h-5" />
								</button>
							</div>

							{/* Corpo do Modal - Formulário Fixo no topo */}
							<div className="p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
								<h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
									<Key className="w-4 h-4 text-blue-600" />{' '}
									Cadastrar novo administrador
								</h3>
								<form
									onSubmit={handleCreateAdmin}
									className="flex gap-2"
								>
									<div className="relative flex-1">
										<Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
										<input
											type="email"
											placeholder="E-mail do administrador"
											value={adminEmail}
											onChange={(e) =>
												setAdminEmail(e.target.value)
											}
											className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
											required
										/>
									</div>
									<button
										disabled={loadingAdmin}
										type="submit"
										className="bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center min-w-[120px]"
									>
										{loadingAdmin ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											'Criar Acesso'
										)}
									</button>
								</form>

								{/* Resultado da geração de senha */}
								{result && (
									<div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-lg animate-in slide-in-from-top-2">
										<p className="text-xs font-bold text-emerald-800 mb-2 uppercase tracking-wider">
											Acesso Gerado com sucesso
										</p>
										<div className="text-sm text-slate-700 space-y-1">
											<p>
												<strong>E-mail:</strong>{' '}
												{result.email}
											</p>
											<p>
												<strong>Senha Temp:</strong>{' '}
												<span className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-200">
													{result.tempPass}
												</span>
											</p>
										</div>
									</div>
								)}
							</div>

							{/* Lista Scrollável de Usuários */}
							<div className="flex-1 overflow-y-auto p-6 bg-white">
								<h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 sticky top-0 bg-white pb-2 z-10">
									<Users className="w-4 h-4 text-slate-500" />{' '}
									Lista de Usuários ({companyAdmins.length})
								</h3>

								{loadingAdmins ? (
									<div className="flex justify-center py-10">
										<Loader2 className="w-8 h-8 animate-spin text-blue-600" />
									</div>
								) : companyAdmins.length === 0 ? (
									<div className="text-center py-10">
										<div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
											<Users className="w-6 h-6 text-slate-300" />
										</div>
										<p className="text-slate-500 text-sm">
											Nenhum administrador encontrado
											nesta empresa.
										</p>
									</div>
								) : (
									<div className="space-y-3">
										{companyAdmins.map((admin) => (
											<div
												key={admin.id}
												className="border border-slate-200 rounded-lg overflow-hidden transition-all bg-white hover:border-slate-300"
											>
												<button
													onClick={() =>
														setExpandedUserId(
															expandedUserId ===
																admin.id
																? null
																: admin.id,
														)
													}
													className="w-full flex items-center justify-between p-3 transition-colors text-left"
												>
													<div className="flex items-center gap-3">
														<div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-100">
															{admin.full_name
																?.charAt(0)
																?.toUpperCase() ||
																admin.email
																	?.charAt(0)
																	?.toUpperCase() ||
																'?'}
														</div>
														<div className="min-w-0">
															<p className="text-sm font-bold text-slate-800 truncate">
																{admin.full_name ||
																	'Usuário Pendente'}
															</p>
															<p className="text-xs text-slate-500 truncate">
																{admin.email}
															</p>
														</div>
													</div>
													{expandedUserId ===
													admin.id ? (
														<ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
													) : (
														<ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
													)}
												</button>

												{/* Detalhes expandidos */}
												{expandedUserId ===
													admin.id && (
													<div className="p-4 bg-slate-50 border-t border-slate-100">
														<div className="flex items-center gap-2 mb-2">
															<span
																className={`w-2 h-2 rounded-full ${admin.require_password_change ? 'bg-amber-400' : 'bg-emerald-400'}`}
															></span>
															<span className="text-sm font-medium text-slate-700">
																Status da Senha:
															</span>
															<span className="text-sm font-bold text-slate-900">
																{admin.require_password_change
																	? 'Aguardando troca'
																	: 'Atualizada'}
															</span>
														</div>

														{admin.require_password_change &&
															admin.temp_password && (
																<div className="mt-3 p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 shadow-sm">
																	<span>
																		Senha
																		Temporária
																		gerada:
																	</span>
																	<span className="font-mono bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 text-slate-900 font-bold tracking-wide">
																		{
																			admin.temp_password
																		}
																	</span>
																</div>
															)}
													</div>
												)}
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</ERPLayout>
	);
}
