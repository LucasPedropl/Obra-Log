'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
	Plus,
	Building2,
	Users,
	Loader2,
	Mail,
	X,
	Trash2,
	AlertTriangle,
} from 'lucide-react';
import {
	listAccountsAction,
	createAccountAction,
	deleteAccountAction,
	listAccountAdminsAction,
	deleteAccountAdminAction,
	type AccountRow,
	type AccountUserRow,
} from '@/app/actions/accounts';
import { useToast } from '@/components/ui/toaster';

export default function ContasPage() {
	const { addToast } = useToast();
	const [accounts, setAccounts] = useState<AccountRow[]>([]);
	const [loadingData, setLoadingData] = useState(true);

	// Create account form
	const [newAccountEmail, setNewAccountEmail] = useState('');
	const [newAccountInstances, setNewAccountInstances] = useState(1);
	const [loadingCreate, setLoadingCreate] = useState(false);
	const [createResult, setCreateResult] = useState<{ email: string; tempPass: string } | null>(null);

	// Selection / Deletion
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [deleteTargetIds, setDeleteTargetIds] = useState<string[]>([]);

	// Access modal
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedAccount, setSelectedAccount] = useState<AccountRow | null>(null);
	const [accountAdmins, setAccountAdmins] = useState<AccountUserRow[]>([]);
	const [loadingAdmins, setLoadingAdmins] = useState(false);

	const fetchAccounts = useCallback(async () => {
		setLoadingData(true);
		try {
			const data = await listAccountsAction();
			setAccounts(data);
		} catch (err) {
			console.error('Erro ao buscar contas:', err);
		} finally {
			setLoadingData(false);
		}
	}, []);

	useEffect(() => {
		fetchAccounts();
	}, [fetchAccounts]);

	const loadAdmins = async (accountId: string) => {
		setLoadingAdmins(true);
		try {
			const users = await listAccountAdminsAction(accountId);
			setAccountAdmins(users);
		} catch {
			console.error('Erro ao buscar admins');
		} finally {
			setLoadingAdmins(false);
		}
	};

	useEffect(() => {
		if (selectedAccount && isModalOpen) {
			loadAdmins(selectedAccount.id);
		} else {
			setAccountAdmins([]);
		}
	}, [selectedAccount, isModalOpen]);

	// ── Handlers ──

	const handleCreateAccount = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newAccountEmail.trim()) return;
		setLoadingCreate(true);
		setCreateResult(null);
		try {
			const res = await createAccountAction(newAccountEmail, newAccountInstances);
			setCreateResult({ email: res.email, tempPass: res.tempPassword });
			setNewAccountEmail('');
			setNewAccountInstances(1);
			await fetchAccounts();
			addToast('Conta criada com sucesso!', 'success');
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Erro ao criar conta';
			addToast(message, 'error');
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
				await deleteAccountAction(id);
			}
			setSelectedIds((prev) => prev.filter((id) => !deleteTargetIds.includes(id)));
			await fetchAccounts();
			setIsDeleteConfirmOpen(false);
			setDeleteTargetIds([]);
			addToast('Conta(s) excluída(s) com sucesso!', 'success');
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Erro ao excluir conta';
			addToast(message, 'error');
		} finally {
			setIsDeleting(false);
		}
	};

	const handleDeleteAdmin = async (userId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		if (!selectedAccount) return;
		if (!confirm('Tem certeza que deseja excluir este administrador? Isso removerá o acesso dele à conta.')) return;
		
		try {
			await deleteAccountAdminAction(userId, selectedAccount.id);
			addToast('Administrador removido com sucesso!', 'success');
			await loadAdmins(selectedAccount.id);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Erro ao remover administrador';
			addToast(message, 'error');
		}
	};

	const toggleSelectAll = () => {
		if (selectedIds.length === accounts.length) {
			setSelectedIds([]);
		} else {
			setSelectedIds(accounts.map((a) => a.id));
		}
	};

	const toggleSelection = (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
		);
	};

	const openAccountModal = (account: AccountRow) => {
		setSelectedAccount(account);
		setIsModalOpen(true);
	};

	const closeModal = () => {
		setIsModalOpen(false);
		setTimeout(() => setSelectedAccount(null), 300);
	};

	return (
		<div className="flex flex-col gap-6">
			{/* ── Criar Conta ── */}
			<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
				<h2 className="text-lg font-bold text-slate-800 mb-4">
					Cadastrar Nova Conta (Construtora)
				</h2>
				<form onSubmit={handleCreateAccount} className="flex flex-col gap-4">
					<div className="flex flex-col md:flex-row gap-4">
						<div className="relative flex-1">
							<Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
							<input
								type="email"
								placeholder="E-mail do titular da conta"
								value={newAccountEmail}
								onChange={(e) => setNewAccountEmail(e.target.value)}
								className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
								required
							/>
						</div>
						<div className="flex items-center gap-2">
							<label className="text-sm font-medium text-slate-700 whitespace-nowrap">
								Instâncias Max:
							</label>
							<input
								type="number"
								min="1"
								value={newAccountInstances}
								onChange={(e) => setNewAccountInstances(parseInt(e.target.value) || 1)}
								className="w-24 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
								required
							/>
						</div>
						<button
							disabled={loadingCreate}
							type="submit"
							className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-8 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
						>
							{loadingCreate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
							Cadastrar Conta
						</button>
					</div>
				</form>
				{createResult && (
					<div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-lg max-w-lg">
						<p className="text-xs font-bold text-emerald-800 mb-2 uppercase tracking-wider">
							Conta Criada com sucesso (Pendente de Ativação)
						</p>
						<div className="text-sm text-slate-700 space-y-1">
							<p><strong>E-mail Titular:</strong> {createResult.email}</p>
							<p>
								<strong>Senha Temporária:</strong>{' '}
								<span className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-200">
									{createResult.tempPass}
								</span>
							</p>
							<p className="text-xs mt-2 text-emerald-600">Envie esta senha para o cliente. Ele ativará a conta no primeiro acesso.</p>
						</div>
					</div>
				)}
			</div>

			{/* ── Ações em Massa ── */}
			{selectedIds.length > 0 && (
				<div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm flex items-center justify-between">
					<div className="flex items-center gap-3">
						<span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
							{selectedIds.length}
						</span>
						<span className="text-sm font-medium text-slate-700">
							{selectedIds.length === 1 ? 'conta selecionada' : 'contas selecionadas'}
						</span>
					</div>
					<button
						onClick={() => openDeleteConfirm(selectedIds)}
						className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
					>
						<Trash2 className="w-4 h-4" />
						Excluir Selecionadas
					</button>
				</div>
			)}

			{/* ── Tabela ── */}
			<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
				<div className="p-6 border-b border-slate-100 bg-slate-50/50">
					<h2 className="text-lg font-bold text-slate-800">
						Contas / Empresas Cadastradas
					</h2>
					<p className="text-sm text-slate-500">
						Clique em uma conta para gerenciar seus administradores.
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
										checked={accounts.length > 0 && selectedIds.length === accounts.length}
										onChange={toggleSelectAll}
									/>
								</th>
								<th className="px-4 py-4">Nome / Empresa</th>
								<th className="px-6 py-4 text-center">Status</th>
								<th className="px-6 py-4 text-center">Instâncias Max</th>
								<th className="px-6 py-4 w-40 text-right">Ações</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 bg-white">
							{loadingData ? (
								<tr>
									<td colSpan={5} className="px-6 py-8 text-center">
										<Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
									</td>
								</tr>
							) : accounts.length === 0 ? (
								<tr>
									<td colSpan={5} className="px-6 py-8 text-center text-slate-500">
										Nenhuma conta cadastrada.
									</td>
								</tr>
							) : (
								accounts.map((account) => {
									const isSelected = selectedIds.includes(account.id);
									return (
										<tr
											key={account.id}
											onClick={() => openAccountModal(account)}
											className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'}`}
										>
											<td className="px-6 py-4 w-12 text-center" onClick={(e) => toggleSelection(account.id, e)}>
												<input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" checked={isSelected} onChange={() => {}} />
											</td>
											<td className="px-4 py-4">
												<div className="flex items-center gap-4">
													<div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${isSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
														<Building2 className="w-5 h-5" />
													</div>
													<div className="font-medium text-slate-900">{account.company_name}</div>
												</div>
											</td>
											<td className="px-6 py-4 text-center">
												{account.status === 'PENDING' && (
													<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
														Pendente
													</span>
												)}
												{account.status === 'ACTIVE' && (
													<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
														Ativo
													</span>
												)}
											</td>
											<td className="px-6 py-4 text-center text-slate-600 font-medium">
												{account.max_instances}
											</td>
											<td className="px-6 py-4 w-40 text-right">
												<div className="flex items-center justify-end gap-2">
													<button onClick={(e) => openDeleteConfirm([account.id], e)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
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

			{/* ── Modal Confirmar Deleção ── */}
			{isDeleteConfirmOpen && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
					<div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
						<div className="p-6 pt-8 text-center flex flex-col items-center">
							<div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
								<AlertTriangle className="w-8 h-8" />
							</div>
							<h2 className="text-xl font-bold text-slate-900 mb-2">
								Excluir Conta{deleteTargetIds.length > 1 ? 's' : ''}?
							</h2>
							<p className="text-slate-500 mb-6 max-w-sm">
								Tem certeza que deseja excluir{' '}
								{deleteTargetIds.length === 1 ? 'esta conta' : `estas ${deleteTargetIds.length} contas`}
								{' '}e todos os seus dados? Esta ação é <b>irreversível</b>.
							</p>
							<div className="flex justify-center gap-3 w-full">
								<button onClick={() => setIsDeleteConfirmOpen(false)} disabled={isDeleting} className="flex-1 px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
									Cancelar
								</button>
								<button onClick={executeDelete} disabled={isDeleting} className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
									{isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sim, Excluir'}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* ── Modal Acessos ── */}
			{isModalOpen && selectedAccount && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
					<div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
						{/* Header */}
						<div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white shrink-0">
							<div>
								<h2 className="text-xl font-bold text-slate-900">Administradores da Conta</h2>
								<p className="text-sm text-slate-500">{selectedAccount.company_name}</p>
							</div>
							<button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Lista de Usuários */}
						<div className="flex-1 overflow-y-auto p-6 bg-white">
							{loadingAdmins ? (
								<div className="flex justify-center py-10">
									<Loader2 className="w-8 h-8 animate-spin text-blue-600" />
								</div>
							) : accountAdmins.length === 0 ? (
								<div className="text-center py-10">
									<div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
										<Users className="w-6 h-6 text-slate-300" />
									</div>
									<p className="text-slate-500 text-sm">Nenhum administrador encontrado nesta conta.</p>
								</div>
							) : (
								<div className="space-y-3">
									{accountAdmins.map((admin) => (
										<div key={admin.id} className="border border-slate-200 rounded-lg p-3 flex items-center justify-between bg-white hover:border-slate-300 transition-colors">
											<div className="flex items-center gap-3">
												<div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100">
													{admin.full_name?.charAt(0)?.toUpperCase() || admin.email?.charAt(0)?.toUpperCase() || '?'}
												</div>
												<div>
													<p className="text-sm font-bold text-slate-800">
														{admin.full_name || 'Usuário Pendente'}
													</p>
													<p className="text-xs text-slate-500">{admin.email}</p>
												</div>
											</div>
											<button
												onClick={(e) => handleDeleteAdmin(admin.id, e)}
												className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
												title="Remover Admin"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}