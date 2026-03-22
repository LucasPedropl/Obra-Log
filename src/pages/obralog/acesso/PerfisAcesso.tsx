import React, { useState, useEffect } from 'react';
import { ERPLayout } from '../../../components/layout/ERPLayout';
import { supabase } from '../../../config/supabase';
import { useToast } from '../../../context/ToastContext';
import {
	Plus,
	Download,
	Upload,
	X,
	ChevronDown,
	ChevronRight,
} from 'lucide-react';

const DEFAULT_PERMS = {
	view: false,
	edit: false,
	create: false,
	delete: false,
	import_export: false,
};
const INITIAL_PERMISSIONS = {
	dashboard: { ...DEFAULT_PERMS },
	mao_de_obra: { ...DEFAULT_PERMS },
	config_dados: {
		full_access: false,
		insumos: { ...DEFAULT_PERMS },
		unidades: { ...DEFAULT_PERMS },
		categorias: { ...DEFAULT_PERMS },
	},
	obras: {
		access_type: 'all', // 'all' | 'specific'
		global_pages_access: false, // Se true, dÃ¡ acesso total a todas as pÃ¡ginas das obras
		pages: {
			visao_geral: { ...DEFAULT_PERMS },
			almoxarifado: { ...DEFAULT_PERMS },
			ferramentas: { ...DEFAULT_PERMS },
			epis: { ...DEFAULT_PERMS },
			equip_alugados: { ...DEFAULT_PERMS },
			movimentacoes: { ...DEFAULT_PERMS },
		},
	},
};

export default function PerfisAcesso() {
	const { showToast } = useToast();
	const [profiles, setProfiles] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [expandedModules, setExpandedModules] = useState<
		Record<string, boolean>
	>({
		config_dados: true,
		obras: true,
	});

	const companyId = localStorage.getItem('selectedCompanyId');

	const [formData, setFormData] = useState({
		name: '',
		scope: 'ALL_SITES',
		permissions: JSON.parse(JSON.stringify(INITIAL_PERMISSIONS)), // deep copy
	});

	useEffect(() => {
		if (companyId) {
			fetchProfiles();
		}
	}, [companyId]);

	const fetchProfiles = async () => {
		try {
			setIsLoading(true);
			const { data, error } = await supabase
				.from('access_profiles')
				.select('*')
				.eq('company_id', companyId);

			if (error) {
				console.error(error);
			} else if (data) {
				setProfiles(data);
			}
		} catch (err) {
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	// Handlers granulares
	const handleSimplePermission = (
		module: string,
		action: string,
		checked: boolean,
	) => {
		setFormData((prev) => ({
			...prev,
			permissions: {
				...prev.permissions,
				[module]: { ...prev.permissions[module], [action]: checked },
			},
		}));
	};

	const handleConfigDadosPermission = (
		page: string | null,
		action: string,
		checked: boolean,
	) => {
		setFormData((prev) => {
			const newPerms = { ...prev };
			if (page === null && action === 'full_access') {
				newPerms.permissions.config_dados.full_access = checked;
				if (checked) {
					// Marca tudo
					['insumos', 'unidades', 'categorias'].forEach((p) => {
						newPerms.permissions.config_dados[p] = {
							view: true,
							edit: true,
							create: true,
							delete: true,
							import_export: true,
						};
					});
				} else {
					['insumos', 'unidades', 'categorias'].forEach((p) => {
						newPerms.permissions.config_dados[p] = {
							...DEFAULT_PERMS,
						};
					});
				}
			} else if (page) {
				newPerms.permissions.config_dados[page][action] = checked;
				// Se desmarcou uma, perde o full access
				if (!checked)
					newPerms.permissions.config_dados.full_access = false;
			}
			return newPerms;
		});
	};

	const handleObrasPermission = (
		type: 'access_type' | 'global_pages_access' | 'page_perm',
		val: any,
		page?: string,
		action?: string,
	) => {
		setFormData((prev) => {
			const newPerms = { ...prev };
			if (type === 'access_type') {
				newPerms.permissions.obras.access_type = val;
			} else if (type === 'global_pages_access') {
				newPerms.permissions.obras.global_pages_access = val;
				if (val) {
					Object.keys(newPerms.permissions.obras.pages).forEach(
						(p) => {
							newPerms.permissions.obras.pages[p] = {
								view: true,
								edit: true,
								create: true,
								delete: true,
								import_export: true,
							};
						},
					);
				} else {
					Object.keys(newPerms.permissions.obras.pages).forEach(
						(p) => {
							newPerms.permissions.obras.pages[p] = {
								...DEFAULT_PERMS,
							};
						},
					);
				}
			} else if (type === 'page_perm' && page && action) {
				newPerms.permissions.obras.pages[page][action] = val;
				if (!val)
					newPerms.permissions.obras.global_pages_access = false;
			}
			return newPerms;
		});
	};

	const toggleExpand = (mod: string) => {
		setExpandedModules((p) => ({ ...p, [mod]: !p[mod] }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name) return;
		setIsSubmitting(true);

		try {
			const payload = {
				company_id: companyId,
				name: formData.name,
				scope: formData.scope,
				permissions: formData.permissions,
			};

			const { error } = await supabase
				.from('access_profiles')
				.insert(payload);

			if (error) {
				throw new Error(error.message);
			}

			setIsModalOpen(false);
			setFormData({
				name: '',
				scope: 'ALL_SITES',
				permissions: JSON.parse(JSON.stringify(INITIAL_PERMISSIONS)),
			});
			showToast('Perfil de acesso criado com sucesso', 'success');
			fetchProfiles();
		} catch (err: any) {
			showToast(err.message, 'error');
		} finally {
			setIsSubmitting(false);
		}
	};

	// Helper para renderizar os checkboxes padrÃ£o (view, create, edit, delete, import_export)
	const renderPermCheckboxes = (
		checkedState: any,
		onChange: (action: string, val: boolean) => void,
		showImportExport = true,
	) => {
		const actions = [
			{ key: 'view', label: 'Ver' },
			{ key: 'create', label: 'Criar' },
			{ key: 'edit', label: 'Editar' },
			{ key: 'delete', label: 'Excluir' },
		];
		if (showImportExport)
			actions.push({ key: 'import_export', label: 'Imp/Exp' });

		return actions.map((act) => (
			<label
				key={act.key}
				className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-main cursor-pointer"
			>
				<input
					type="checkbox"
					className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/50 cursor-pointer"
					checked={checkedState[act.key] || false}
					onChange={(e) => onChange(act.key, e.target.checked)}
				/>
				{act.label}
			</label>
		));
	};

	return (
		<ERPLayout>
			<div className="space-y-6 max-w-5xl mx-auto">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-text-main">
							Perfis de Acesso
						</h1>
						<p className="text-text-muted mt-1">
							Gerencie nÃ­veis de acesso e permissÃµes avanÃ§adas.
						</p>
					</div>
					<button
						onClick={() => {
							setFormData({
								name: '',
								scope: 'ALL_SITES',
								permissions: JSON.parse(
									JSON.stringify(INITIAL_PERMISSIONS),
								),
							});
							setIsModalOpen(true);
						}}
						className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
					>
						<Plus size={18} />
						Novo Perfil
					</button>
				</div>

				<div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
					<table className="w-full text-left">
						<thead className="bg-background border-b border-border">
							<tr>
								<th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
									Nome do Perfil
								</th>
								<th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
									Tipo
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{isLoading ? (
								<tr>
									<td
										colSpan={2}
										className="px-6 py-8 text-center text-text-muted"
									>
										Carregando...
									</td>
								</tr>
							) : profiles.length === 0 ? (
								<tr>
									<td
										colSpan={2}
										className="px-6 py-8 text-center text-text-muted"
									>
										Nenhum perfil encontrado.
									</td>
								</tr>
							) : (
								profiles.map((p, idx) => (
									<tr key={idx}>
										<td className="px-6 py-4 font-medium text-text-main">
											{p.name}
										</td>
										<td className="px-6 py-4">
											<span
												className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${p.scope === 'ALL_SITES' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}
											>
												{p.scope === 'ALL_SITES'
													? 'Acesso Global'
													: 'Restrito / Personalizado'}
											</span>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{isModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm sm:items-center">
					<div className="bg-surface w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl border border-border flex flex-col overflow-hidden">
						{/* Header */}
						<div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
							<div>
								<h2 className="text-xl font-bold text-text-main">
									Mapeamento de Acessos
								</h2>
								<p className="text-sm text-text-muted mt-0.5">
									Defina as regras exatas de acesso por
									mÃ³dulo e pÃ¡ginas.
								</p>
							</div>
							<button
								onClick={() => setIsModalOpen(false)}
								className="p-2 hover:bg-surface rounded-lg text-text-muted hover:text-text-main transition-colors"
							>
								<X size={20} />
							</button>
						</div>

						{/* Corpo */}
						<div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
							<div className="space-y-6">
								<div className="space-y-1.5 focus-within:text-primary">
									<label className="text-sm font-semibold text-text-main">
										Nome do Perfil *
									</label>
									<input
										type="text"
										placeholder="Ex: Engenheiro Residente, Assistente Adm..."
										value={formData.name}
										onChange={(e) =>
											setFormData((pr) => ({
												...pr,
												name: e.target.value,
											}))
										}
										className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-main focus:ring-2 focus:ring-primary/50"
									/>
								</div>

								<div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
									<label className="flex items-center gap-3 cursor-pointer">
										<input
											type="checkbox"
											className="w-5 h-5 rounded border-border text-primary focus:ring-primary/50 cursor-pointer"
											checked={
												formData.scope === 'ALL_SITES'
											}
											onChange={(e) =>
												setFormData((pr) => ({
													...pr,
													scope: e.target.checked
														? 'ALL_SITES'
														: 'SPECIFIC_SITES',
												}))
											}
										/>
										<div>
											<span className="block font-bold text-text-main text-base">
												Habilitar Acesso Global (Todas
												as Obras)
											</span>
											<span className="block text-sm text-text-muted mt-0.5">
												Concede acesso total de escopo a
												todas as obras da empresa.
											</span>
										</div>
									</label>
								</div>

								<div className="space-y-4">
									<h3 className="font-semibold text-text-main border-b border-border pb-2">
										Matriz de PermissÃµes
									</h3>
									<div className="bg-background border border-border rounded-xl divide-y divide-border text-sm">
										{/* DASHBOARD */}
										<div className="p-4 sm:flex items-center justify-between hover:bg-surface transition-colors">
											<div className="font-medium text-text-main mb-2 sm:mb-0 w-48 font-semibold">
												Dashboard
											</div>
											<div className="flex flex-wrap gap-4 sm:gap-6 bg-surface p-2 px-3 rounded-lg border border-border">
												{renderPermCheckboxes(
													formData.permissions
														.dashboard,
													(act, val) =>
														handleSimplePermission(
															'dashboard',
															act,
															val,
														),
													false, // no import export generally on dashboard
												)}
											</div>
										</div>

										{/* MÃƒO DE OBRA */}
										<div className="p-4 sm:flex items-center justify-between hover:bg-surface transition-colors">
											<div className="font-medium text-text-main mb-2 sm:mb-0 w-48 font-semibold">
												MÃ£o de Obra
											</div>
											<div className="flex flex-wrap gap-4 sm:gap-6 bg-surface p-2 px-3 rounded-lg border border-border">
												{renderPermCheckboxes(
													formData.permissions
														.mao_de_obra,
													(act, val) =>
														handleSimplePermission(
															'mao_de_obra',
															act,
															val,
														),
												)}
											</div>
										</div>

										{/* CADASTROS BÃSICOS (ConfiguraÃ§Ãµes de Dados) */}
										<div className="flex flex-col">
											<div className="p-4 flex items-center justify-between hover:bg-surface transition-colors">
												<div
													className="flex items-center gap-2 font-semibold text-text-main cursor-pointer"
													onClick={() =>
														toggleExpand(
															'config_dados',
														)
													}
												>
													<button className="p-1 hover:bg-border rounded text-text-muted">
														{expandedModules.config_dados ? (
															<ChevronDown
																size={16}
															/>
														) : (
															<ChevronRight
																size={16}
															/>
														)}
													</button>
													Cadastros BÃ¡sicos
												</div>
												<label className="flex items-center gap-2 text-xs font-medium text-primary cursor-pointer bg-primary/5 px-2 py-1 rounded border border-primary/20">
													<input
														type="checkbox"
														className="w-3.5 h-3.5 rounded border-border text-primary cursor-pointer"
														checked={
															formData.permissions
																.config_dados
																.full_access
														}
														onChange={(e) =>
															handleConfigDadosPermission(
																null,
																'full_access',
																e.target
																	.checked,
															)
														}
													/>
													Acesso Total ao MÃ³dulo
												</label>
											</div>
											{expandedModules.config_dados && (
												<div className="pb-4 px-4 pl-12 space-y-3 bg-surface/30">
													{[
														{
															id: 'insumos',
															label: 'Insumos',
														},
														{
															id: 'unidades',
															label: 'Unid. de Medidas',
														},
														{
															id: 'categorias',
															label: 'Categorias',
														},
													].map((page) => (
														<div
															key={page.id}
															className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2 last:border-0 last:pb-0"
														>
															<span className="text-text-muted">
																{page.label}
															</span>
															<div className="flex flex-wrap gap-3">
																{renderPermCheckboxes(
																	(
																		formData
																			.permissions
																			.config_dados as any
																	)[page.id],
																	(
																		act,
																		val,
																	) =>
																		handleConfigDadosPermission(
																			page.id,
																			act,
																			val,
																		),
																)}
															</div>
														</div>
													))}
												</div>
											)}
										</div>

										{/* OBRAS */}
										<div className="flex flex-col">
											<div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-surface transition-colors gap-3">
												<div
													className="flex items-center gap-2 font-semibold text-text-main cursor-pointer"
													onClick={() =>
														toggleExpand('obras')
													}
												>
													<button className="p-1 hover:bg-border rounded text-text-muted">
														{expandedModules.obras ? (
															<ChevronDown
																size={16}
															/>
														) : (
															<ChevronRight
																size={16}
															/>
														)}
													</button>
													Obras (GestÃ£o Completa)
												</div>

												{/* Global configs para Obras */}
												<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 bg-surface p-2 px-4 rounded-lg border border-border">
													<label className="flex items-center gap-2 text-xs font-medium text-text-main">
														<span>
															Visualizar Obras:
														</span>
														<select
															className="bg-background border border-border rounded px-2 py-1 focus:ring-1 focus:ring-primary/50 text-xs"
															value={
																formData
																	.permissions
																	.obras
																	.access_type
															}
															onChange={(e) =>
																handleObrasPermission(
																	'access_type',
																	e.target
																		.value,
																)
															}
														>
															<option value="all">
																Todas as Obras
																cadastradas
															</option>
															<option value="specific">
																Apenas obras
																vinculadas ao
																usuÃ¡rio
															</option>
														</select>
													</label>
													<div className="h-4 w-px bg-border hidden sm:block"></div>
													<label className="flex items-center gap-2 text-xs font-medium text-primary cursor-pointer">
														<input
															type="checkbox"
															className="w-3.5 h-3.5 rounded border-border text-primary cursor-pointer"
															checked={
																formData
																	.permissions
																	.obras
																	.global_pages_access
															}
															onChange={(e) =>
																handleObrasPermission(
																	'global_pages_access',
																	e.target
																		.checked,
																)
															}
														/>
														Acesso Total a PÃ¡ginas
														Internas
													</label>
												</div>
											</div>

											{expandedModules.obras && (
												<div className="pb-4 px-4 pl-12 space-y-3 bg-surface/30">
													<p className="text-xs text-text-muted mb-2 font-medium uppercase tracking-widest">
														PÃ¡ginas Internas das
														Obras
													</p>
													{[
														{
															id: 'visao_geral',
															label: 'VisÃ£o Geral',
														},
														{
															id: 'almoxarifado',
															label: 'Almoxarifado',
														},
														{
															id: 'ferramentas',
															label: 'Ferramentas',
														},
														{
															id: 'epis',
															label: 'EPIs',
														},
														{
															id: 'equip_alugados',
															label: 'Equip. Alugados',
														},
														{
															id: 'movimentacoes',
															label: 'MovimentaÃ§Ãµes',
														},
													].map((page) => (
														<div
															key={page.id}
															className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2 last:border-0 last:pb-0"
														>
															<span className="text-text-muted">
																{page.label}
															</span>
															<div className="flex flex-wrap gap-3">
																{renderPermCheckboxes(
																	(
																		formData
																			.permissions
																			.obras
																			.pages as any
																	)[page.id],
																	(
																		act,
																		val,
																	) =>
																		handleObrasPermission(
																			'page_perm',
																			val,
																			page.id,
																			act,
																		),
																)}
															</div>
														</div>
													))}
												</div>
											)}
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Footer */}
						<div className="px-6 py-4 border-t border-border bg-background flex justify-end gap-3 rounded-b-2xl">
							<button
								onClick={() => setIsModalOpen(false)}
								className="px-5 py-2.5 text-text-main font-medium hover:bg-surface border border-transparent hover:border-border rounded-lg transition-all"
							>
								Cancelar
							</button>
							<button
								onClick={handleSubmit}
								disabled={isSubmitting || !formData.name}
								className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
							>
								{isSubmitting ? 'Salvando...' : 'Salvar Perfil'}
							</button>
						</div>
					</div>
				</div>
			)}
		</ERPLayout>
	);
}
