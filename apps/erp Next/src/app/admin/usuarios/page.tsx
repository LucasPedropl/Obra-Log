'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Mail,
	Key,
	Plus,
	Loader2,
	Building2,
	User,
	X,
	Trash2,
} from 'lucide-react';
import {
	getGlobalUsersAction,
	saveGlobalUserAction,
	getAllCompaniesAction,
	getAllProfilesAction,
} from '../../actions/globalUsers';

export default function UsuariosPage() {
	const [users, setUsers] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);

	// Modal data
	const [companies, setCompanies] = useState<any[]>([]);
	const [profiles, setProfiles] = useState<any[]>([]);

	// Modal state
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [saving, setSaving] = useState(false);

	// Form state
	const [editId, setEditId] = useState<string | undefined>(undefined);
	const [email, setEmail] = useState('');
	const [fullName, setFullName] = useState('');
	const [isSuperAdmin, setIsSuperAdmin] = useState(false);
	const [assignments, setAssignments] = useState<
		Array<{ id: string; companyId: string; profileId: string | null }>
	>([]);

	useEffect(() => {
		loadData();
		loadOptions();
	}, []);

	const loadData = async () => {
		setLoading(true);
		try {
			const res = await getGlobalUsersAction();
			if (res.success && res.users) {
				setUsers(res.users);
			} else {
				console.error(res.error);
			}
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const loadOptions = async () => {
		try {
			const [compRes, profRes] = await Promise.all([
				getAllCompaniesAction(),
				getAllProfilesAction(),
			]);
			if (compRes.success && compRes.companies)
				setCompanies(compRes.companies);
			if (profRes.success && profRes.profiles)
				setProfiles(profRes.profiles);
		} catch (err) {
			console.error(err);
		}
	};

	const handleOpenNew = () => {
		setEditId(undefined);
		setEmail('');
		setFullName('');
		setIsSuperAdmin(false);
		setAssignments([]);
		setIsModalOpen(true);
	};

	const handleEdit = (u: any) => {
		setEditId(u.id);
		setEmail(u.email);
		setFullName(u.full_name || '');
		setIsSuperAdmin(u.is_super_admin || false);

		const currentAssignments = (u.company_users || []).map(
			(cu: any, i: number) => ({
				id: cu.company_id + '_' + i,
				companyId: cu.company_id,
				profileId: cu.profile_id,
			}),
		);

		setAssignments(currentAssignments);
		setIsModalOpen(true);
	};

	const handleSave = async () => {
		if (!email || !fullName) {
			alert('Preencha os campos obrigatórios (E-mail, Nome).');
			return;
		}
		if (!isSuperAdmin && assignments.length === 0) {
			if (
				!confirm(
					'Usuário padrão deve ter ao menos 1 vínculo com filial. Se não cadastrar nenhuma, ele não acessará o sistema. Continuar?',
				)
			)
				return;
		}

		setSaving(true);
		try {
			const res = await saveGlobalUserAction({
				id: editId,
				email,
				fullName,
				isSuperAdmin: isSuperAdmin,
				assignments: assignments.map((a) => ({
					companyId: a.companyId,
					profileId: a.profileId,
				})),
			});

			if (!res.success) {
				alert(res.error || 'Erro ao salvar o usuário');
			} else {
				setIsModalOpen(false);
				loadData();
			}
		} catch (err: any) {
			alert('Erro: ' + (err.message || 'Falha ao salvar'));
		} finally {
			setSaving(false);
		}
	};

	const removeAssignment = (id: string) => {
		setAssignments((prev) => prev.filter((a) => a.id !== id));
	};

	const handleAssignmentChange = (
		id: string,
		field: 'companyId' | 'profileId',
		value: string,
	) => {
		setAssignments((prev) =>
			prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
		);
	};

	const generateId = () => Math.random().toString(36).substring(7);

	return (
		<div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
			<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
				<div>
					<h2 className="text-2xl font-bold tracking-tight text-gray-900">
						Gestão de Usuários
					</h2>
					<p className="text-muted-foreground">
						Gerencie todos os usuários do sistema, atribua empresas
						e defina acessos.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Button
						onClick={handleOpenNew}
						className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
					>
						<Plus className="w-4 h-4 mr-2" />
						Novo Usuário / Admin
					</Button>
				</div>
			</div>

			<div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
				<div className="p-0 border-b">
					{loading ? (
						<div className="flex items-center justify-center p-12">
							<Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-sm text-left">
								<thead className="bg-gray-50/80 text-gray-600 font-medium">
									<tr>
										<th className="px-6 py-4">Nome</th>
										<th className="px-6 py-4">Email</th>
										<th className="px-6 py-4">
											Acessos em Filiais
										</th>
										<th className="px-6 py-4">Tipo</th>
										<th className="px-6 py-4 text-right">
											Ações
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-100">
									{users.map((u) => (
										<tr
											key={u.id}
											className="hover:bg-gray-50/50 transition-colors"
										>
											<td className="px-6 py-4 font-medium text-gray-900">
												{u.full_name ||
													'Usuário Sem Nome'}
											</td>
											<td className="px-6 py-4 text-gray-600">
												<div className="flex items-center">
													<Mail className="w-3.5 h-3.5 mr-2 text-gray-400" />
													{u.email}
												</div>
											</td>
											<td className="px-6 py-4 text-gray-600">
												{!u.is_super_admin ? (
													<div className="flex flex-col gap-1 text-xs">
														{(u.company_users || [])
															.length > 0 ? (
															(
																u.company_users ||
																[]
															).map(
																(
																	cu: any,
																	i: number,
																) => (
																	<div
																		key={i}
																		className="bg-gray-100 px-2 py-1 rounded inline-block w-max"
																	>
																		•{' '}
																		{cu
																			.companies
																			?.name ||
																			'Filial'}{' '}
																		-{' '}
																		<span className="text-blue-600 font-medium">
																			{cu
																				.access_profiles
																				?.name ||
																				'Sem Perfil'}
																		</span>
																	</div>
																),
															)
														) : (
															<span className="text-gray-400 italic">
																Nenhum
															</span>
														)}
													</div>
												) : (
													<span className="text-purple-600 text-xs font-semibold">
														- Acesso Irrestrito a
														Todas -
													</span>
												)}
											</td>
											<td className="px-6 py-4">
												{u.is_super_admin ? (
													<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
														<Key className="w-3 h-3 mr-1" />
														Super Admin
													</span>
												) : (
													<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
														<User className="w-3 h-3 mr-1" />
														Padrão
													</span>
												)}
											</td>
											<td className="px-6 py-4 text-right">
												<Button
													variant="ghost"
													size="sm"
													className="text-gray-500 hover:text-blue-600 outline-none"
													onClick={() =>
														handleEdit(u)
													}
												>
													Editar
												</Button>
											</td>
										</tr>
									))}

									{users.length === 0 && (
										<tr>
											<td
												colSpan={5}
												className="text-center py-12 text-gray-500"
											>
												<Building2 className="mx-auto h-12 w-12 text-gray-300 mb-3" />
												Nenhum usuário encontrado.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{isModalOpen && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
					<div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl my-auto relative">
						<div className="p-6 border-b flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
							<div>
								<h3 className="text-xl font-semibold text-gray-900">
									{editId
										? 'Editar Usuário'
										: 'Novo Usuário do Sistema'}
								</h3>
								<p className="text-sm text-gray-500 mt-1">
									Determine a filiação e os níveis de
									permissão do usuário.
								</p>
							</div>
							<button
								onClick={() => setIsModalOpen(false)}
								className="p-2 hover:bg-gray-200 rounded-full transition text-gray-500"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="p-6 overflow-y-auto flex-1 space-y-6">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2 col-span-2 md:col-span-1">
									<label className="text-sm font-medium text-gray-700">
										Nome Completo
									</label>
									<Input
										value={fullName}
										onChange={(e) =>
											setFullName(e.target.value)
										}
										placeholder="Ex: João da Silva"
									/>
								</div>
								<div className="space-y-2 col-span-2 md:col-span-1">
									<label className="text-sm font-medium text-gray-700">
										E-mail de Acesso
									</label>
									<Input
										value={email}
										onChange={(e) =>
											setEmail(e.target.value)
										}
										disabled={!!editId}
										placeholder="Ex: joao@teste.com"
									/>
									{editId && (
										<p className="text-xs text-gray-400">
											O e-mail não pode ser editado
											remotamente neste painel.
										</p>
									)}
								</div>
							</div>

							<div className="flex items-center gap-3 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
								<input
									type="checkbox"
									id="superAdminCheck"
									className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
									checked={isSuperAdmin}
									onChange={(e) => {
										setIsSuperAdmin(e.target.checked);
										if (e.target.checked)
											setAssignments([]);
									}}
								/>
								<div>
									<label
										htmlFor="superAdminCheck"
										className="text-sm font-semibold text-gray-900 cursor-pointer"
									>
										Definir como Super Admin
									</label>
									<p className="text-xs text-gray-500">
										Se marcado, terá acesso total e
										invisível ao sistema inteiro, ignorando
										filiais.
									</p>
								</div>
							</div>

							{!isSuperAdmin && (
								<div className="space-y-4 pt-2">
									<div className="flex justify-between items-center">
										<div>
											<label className="text-sm font-medium text-gray-800">
												Filiais e Perfis de Acesso
											</label>
											<p className="text-xs text-gray-500 mt-0.5">
												Em quais filiais esse usuário
												atua e com qual cargo?
											</p>
										</div>
										<Button
											size="sm"
											variant="outline"
											className="h-8"
											onClick={() =>
												setAssignments((prev) => [
													...prev,
													{
														id: generateId(),
														companyId: '',
														profileId: '',
													},
												])
											}
										>
											<Plus className="w-3.5 h-3.5 mr-1" />{' '}
											Adicionar Acesso
										</Button>
									</div>

									{assignments.length === 0 ? (
										<div className="text-center p-6 border-2 border-dashed rounded-xl bg-gray-50/50">
											<Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
											<p className="text-sm text-gray-500">
												Nenhum acesso definido. O
												usuário não entrará em nenhuma
												filial.
											</p>
										</div>
									) : (
										<div className="space-y-3">
											{assignments.map((assignment) => {
												// Perfis disponíveis: apenas os da empresa selecionada (ou todos se nada foi selecionado para mostrar limpo)
												const filteredProfiles =
													profiles.filter(
														(p) =>
															p.company_id ===
															assignment.companyId,
													);

												return (
													<div
														key={assignment.id}
														className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-gray-50/80 p-3 rounded-xl border"
													>
														<div className="w-full flex-1">
															<select
																className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
																value={
																	assignment.companyId
																}
																onChange={(e) =>
																	handleAssignmentChange(
																		assignment.id,
																		'companyId',
																		e.target
																			.value,
																	)
																}
															>
																<option
																	value=""
																	disabled
																>
																	Selecione
																	uma
																	Filial...
																</option>
																{companies.map(
																	(c) => (
																		<option
																			key={
																				c.id
																			}
																			value={
																				c.id
																			}
																		>
																			{
																				c.name
																			}
																		</option>
																	),
																)}
															</select>
														</div>
														<div className="w-full flex-1">
															<select
																className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
																value={
																	assignment.profileId ||
																	''
																}
																onChange={(e) =>
																	handleAssignmentChange(
																		assignment.id,
																		'profileId',
																		e.target
																			.value,
																	)
																}
																disabled={
																	!assignment.companyId
																}
															>
																<option
																	value=""
																	disabled
																>
																	Selecione o
																	Perfil...
																</option>
																{filteredProfiles.map(
																	(p) => (
																		<option
																			key={
																				p.id
																			}
																			value={
																				p.id
																			}
																		>
																			{
																				p.name
																			}
																		</option>
																	),
																)}
															</select>
														</div>
														<Button
															variant="ghost"
															className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 shrink-0"
															onClick={() =>
																removeAssignment(
																	assignment.id,
																)
															}
														>
															<Trash2 className="w-4 h-4" />
														</Button>
													</div>
												);
											})}
										</div>
									)}
								</div>
							)}
						</div>

						<div className="p-6 border-t bg-gray-50/50 flex justify-end gap-3 rounded-b-2xl">
							<Button
								variant="outline"
								onClick={() => setIsModalOpen(false)}
								disabled={saving}
							>
								Cancelar
							</Button>
							<Button
								onClick={handleSave}
								className="bg-blue-600 hover:bg-blue-700 text-white"
								disabled={saving}
							>
								{saving ? (
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								) : null}
								{editId ? 'Salvar Edição' : 'Criar Usuário'}
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
