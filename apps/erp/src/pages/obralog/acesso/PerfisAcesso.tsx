import React, { useState, useEffect } from 'react';
import { ERPLayout } from '../../../components/layout/ERPLayout';
import { supabase } from '../../../config/supabase';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { useEscape } from '../../../hooks/useEscape';
import {
	Plus,
	X,
	Search,
	Shield,
	ChevronDown,
	ChevronRight,
	Pencil,
	Trash2,
} from 'lucide-react';

const DEFAULT_PERMS = {
	view: false,
	create: false,
	edit: false,
	delete: false,
};

const INITIAL_PERMISSIONS = {
	dashboard: { ...DEFAULT_PERMS },
	mao_de_obra: { ...DEFAULT_PERMS },
	acesso: {
		usuarios: { ...DEFAULT_PERMS },
		perfis: { ...DEFAULT_PERMS },
	},
	config_dados: {
		insumos: { ...DEFAULT_PERMS },
		unidades: { ...DEFAULT_PERMS },
		categorias: { ...DEFAULT_PERMS },
	},
	obras: {
		access_type: 'all',
		pages: {
			visao_geral: { ...DEFAULT_PERMS },
			almoxarifado: { ...DEFAULT_PERMS },
			ferramentas: {
				disponiveis: { ...DEFAULT_PERMS },
				emprestimos: { ...DEFAULT_PERMS },
				historico: { ...DEFAULT_PERMS },
			},
			epis: {
				disponiveis: { ...DEFAULT_PERMS },
				historico: { ...DEFAULT_PERMS },
			},
			equip_alugados: {
				ativos: { ...DEFAULT_PERMS },
				historico: { ...DEFAULT_PERMS },
			},
			movimentacoes: { ...DEFAULT_PERMS },
			colaboradores: { ...DEFAULT_PERMS },
		},
	},
};

// Funcao auxiliar para saber se todas as permissoes de um nivel estao ativas
const areAllChecked = (obj: any): boolean => {
	if (typeof obj !== 'object' || obj === null) return false;
	for (const key in obj) {
		if (key === 'access_type') continue; // Ignora configs que não sao de permissao boolean
		if (typeof obj[key] === 'boolean') {
			if (!obj[key]) return false;
		} else if (typeof obj[key] === 'object') {
			if (!areAllChecked(obj[key])) return false;
		}
	}
	return true;
};

// Funcao auxiliar para setar recursivamente todos os booleans de um obj
const setAllBooleans = (obj: any, val: boolean): any => {
	if (typeof obj !== 'object' || obj === null) return obj;
	const newObj = { ...obj };
	for (const key in newObj) {
		if (key === 'access_type') continue;
		if (typeof newObj[key] === 'boolean') {
			newObj[key] = val;
		} else if (typeof newObj[key] === 'object') {
			newObj[key] = setAllBooleans(newObj[key], val);
		}
	}
	return newObj;
};

const Toggle = ({ checked, onChange, label, subLabel }: any) => (
	<label className="flex items-center justify-between cursor-pointer group py-2">
		<div className="flex flex-col flex-1 mr-4">
			<span className="text-sm font-medium text-text-main group-hover:text-primary transition-colors">
				{label}
			</span>
			{subLabel && (
				<span className="text-xs text-text-muted">{subLabel}</span>
			)}
		</div>
		<div className="relative flex items-center">
			<input
				type="checkbox"
				className="sr-only"
				checked={checked || false}
				onChange={(e) => onChange(e.target.checked)}
			/>
			<div
				className={`block w-10 h-6 rounded-full transition-all ${
					checked
						? 'bg-primary'
						: 'bg-slate-100 border border-slate-500/50 shadow-inner dark:bg-white/20 dark:border-transparent'
				}`}
			></div>
			<div
				className={`absolute left-1 bg-white w-4 h-4 rounded-full transition-transform box-shadow-sm ${
					checked ? 'transform translate-x-4' : ''
				}`}
			></div>
		</div>
	</label>
);

export default function PerfisAcesso() {
	const { showToast } = useToast();
	const { isAllowed } = useAuth();
	const [profiles, setProfiles] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [sites, setSites] = useState<any[]>([]);
	const [profileDetailsModal, setProfileDetailsModal] = useState<any | null>(
		null,
	);

	useEscape(() => {
		setIsModalOpen(false);
		setProfileDetailsModal(null);
	});

	// Accordions (Modulos)
	const [expandedModules, setExpandedModules] = useState<
		Record<string, boolean>
	>({
		dashboard: false,
		obras: false,
		mao_de_obra: false,
		config_dados: false,
		acesso: false,
	});

	const companyId = localStorage.getItem('selectedCompanyId');

	const [formData, setFormData] = useState({
		name: '',
		scope: 'SPECIFIC_SITES',
		allowed_sites: [] as string[],
		permissions: JSON.parse(JSON.stringify(INITIAL_PERMISSIONS)),
	});

	useEffect(() => {
		if (companyId) {
			fetchProfiles();
			fetchSites();
		}
	}, [companyId]);

	const fetchSites = async () => {
		try {
			const { data } = await supabase
				.from('construction_sites')
				.select('id, name')
				.eq('company_id', companyId);
			if (data) setSites(data);
		} catch (err) {
			console.error(err);
		}
	};

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

	const toggleModule = (moduleKey: string) => {
		setExpandedModules((prev) => ({
			...prev,
			[moduleKey]: !prev[moduleKey],
		}));
	};

	const setDeepPerm = (path: string[], val: boolean | string | object) => {
		setFormData((prev) => {
			const newPerms = { ...prev.permissions };
			let current: any = newPerms;
			for (let i = 0; i < path.length - 1; i++) {
				if (!current[path[i]]) current[path[i]] = {};
				current = current[path[i]];
			}
			current[path[path.length - 1]] = val;
			return { ...prev, permissions: newPerms };
		});
	};

	// Ativa/Desativa um modulo/subnivel inteiro
	const toggleAllInPath = (path: string[]) => {
		let current: any = formData.permissions;
		for (const p of path) {
			if (current[p]) current = current[p];
		}
		const currentlyAllChecked = areAllChecked(current);

		const updatedNode = setAllBooleans(current, !currentlyAllChecked);
		setDeepPerm(path, updatedNode);
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
				allowed_sites:
					formData.scope === 'SPECIFIC_SITES'
						? formData.allowed_sites
						: [],
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
				scope: 'SPECIFIC_SITES',
				allowed_sites: [],
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

	const renderPermSwitches = (basePath: string[], checkedState: any = {}) => {
		const actions = [
			{ key: 'view', label: 'Visualizar' },
			{ key: 'create', label: 'Criar' },
			{ key: 'edit', label: 'Editar' },
			{ key: 'delete', label: 'Excluir' },
		];

		const pageAllChecked = areAllChecked(checkedState);

		return (
			<div className="bg-background pt-2 pb-4 px-4 rounded-xl border border-border mt-2 space-y-2">
				<div className="flex justify-end border-b border-border pb-2 mb-2">
					<div className="flex items-center gap-2">
						<span className="text-xs font-semibold text-text-muted">
							Marcar Todos
						</span>
						<div
							className="relative flex items-center cursor-pointer"
							onClick={() => toggleAllInPath(basePath)}
						>
							<input
								type="checkbox"
								className="sr-only"
								readOnly
								checked={pageAllChecked}
							/>
							<div
								className={`block w-8 h-4.5 rounded-full transition-all ${pageAllChecked ? 'bg-primary' : 'bg-slate-100 border border-slate-500/50 shadow-inner dark:bg-white/20 dark:border-transparent'}`}
							></div>
							<div
								className={`absolute left-0.5 bg-white w-3.5 h-3.5 rounded-full transition-transform ${pageAllChecked ? 'transform translate-x-3.5' : ''}`}
							></div>
						</div>
					</div>
				</div>
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
					{actions.map((act) => (
						<Toggle
							key={act.key}
							label={act.label}
							checked={checkedState[act.key] || false}
							onChange={(val: boolean) =>
								setDeepPerm([...basePath, act.key], val)
							}
						/>
					))}
				</div>
			</div>
		);
	};

	const renderModuleHeader = (
		key: string,
		title: string,
		description: string,
		path: string[],
	) => {
		let currentObj: any = formData.permissions;
		for (const p of path) {
			if (currentObj[p]) currentObj = currentObj[p];
		}
		const moduleAllChecked = areAllChecked(currentObj);
		const isExpanded = expandedModules[key];

		return (
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
				<div
					className="flex-1 flex items-center gap-2 cursor-pointer group"
					onClick={() => toggleModule(key)}
				>
					<div className="p-1.5 rounded-lg bg-surface border border-border group-hover:border-primary/50 text-text-muted group-hover:text-primary transition-colors flex-shrink-0">
						{isExpanded ? (
							<ChevronDown size={18} />
						) : (
							<ChevronRight size={18} />
						)}
					</div>
					<div>
						<h4 className="font-bold text-text-main text-lg group-hover:text-primary transition-colors">
							{title}
						</h4>
						<p className="text-sm text-text-muted mt-0.5">
							{description}
						</p>
					</div>
				</div>

				<div className="flex items-center gap-3 bg-background p-2 rounded-xl border border-border shrink-0">
					<label
						className="text-xs font-bold text-text-main pl-1 cursor-pointer select-none"
						onClick={() => toggleAllInPath(path)}
					>
						Ativar Módulo Todo:
					</label>
					<div
						className="relative flex items-center cursor-pointer"
						onClick={() => toggleAllInPath(path)}
					>
						<input
							type="checkbox"
							className="sr-only"
							readOnly
							checked={moduleAllChecked}
						/>
						<div
							className={`block w-10 h-6 rounded-full transition-all ${moduleAllChecked ? 'bg-primary' : 'bg-slate-100 border border-slate-500/50 shadow-inner dark:bg-white/20 dark:border-transparent'}`}
						></div>
						<div
							className={`absolute left-1 bg-white w-4 h-4 rounded-full transition-transform ${moduleAllChecked ? 'transform translate-x-4' : ''}`}
						></div>
					</div>
				</div>
			</div>
		);
	};

	const filteredProfiles = profiles.filter((p) =>
		p.name?.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	return (
		<ERPLayout>
			<div className="space-y-6 w-full max-w-7xl mx-auto">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-text-main">
							Perfis de Acesso
						</h1>
						<p className="text-text-muted mt-1">
							Gerencie permissões e controle o acesso em
							diferentes módulos e páginas.
						</p>
					</div>
					{isAllowed('perfis', 'create') && (
						<button
							onClick={() => {
								setFormData({
									name: '',
									scope: 'SPECIFIC_SITES',
									allowed_sites: [],
									permissions: JSON.parse(
										JSON.stringify(INITIAL_PERMISSIONS),
									),
								});
								setIsModalOpen(true);
							}}
							className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
						>
							<Plus size={18} />
							Novo Perfil
						</button>
					)}
				</div>

				<div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden p-4 sm:p-6">
					<div className="flex flex-col sm:flex-row gap-4 mb-6">
						<div className="relative flex-1">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Search size={18} className="text-text-muted" />
							</div>
							<input
								type="text"
								placeholder="Pesquisar perfil..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
							/>
						</div>
					</div>

					<div className="overflow-x-auto bg-surface border border-border rounded-xl">
						<table className="w-full text-left [&_th]:border-b [&_th]:border-border [&_td]:border-b [&_td]:border-border [&_tbody_tr:last-child_td]:border-b-0">
							<thead className="bg-background border-b border-border">
								<tr>
									<th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">
										Nome do Perfil
									</th>
									<th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">
										Escopo
									</th>
									<th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap text-right">
										Ações
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{isLoading ? (
									<tr>
										<td
											colSpan={3}
											className="px-6 py-12 text-center text-text-muted"
										>
											<div className="flex flex-col items-center gap-2">
												<div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
												<span>
													Carregando perfis...
												</span>
											</div>
										</td>
									</tr>
								) : filteredProfiles.length === 0 ? (
									<tr>
										<td
											colSpan={3}
											className="px-6 py-12 text-center text-text-muted"
										>
											<div className="flex flex-col items-center gap-2">
												<Shield
													size={32}
													className="text-border"
												/>
												<span>
													Nenhum perfil encontrado.
												</span>
											</div>
										</td>
									</tr>
								) : (
									filteredProfiles.map((p, idx) => {
										const isGlobal =
											p.scope === 'ALL_SITES';
										return (
											<tr
												key={idx}
												onClick={() =>
													setProfileDetailsModal(p)
												}
												className="hover:bg-black/5 dark:hover:bg-white/5 even:bg-black/[0.02] dark:even:bg-white/[0.02] transition-colors cursor-pointer"
											>
												<td className="px-6 py-4 font-semibold text-text-main flex items-center gap-3">
													<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
														<Shield size={16} />
													</div>
													{p.name}
												</td>
												<td className="px-6 py-4">
													<span
														className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
															isGlobal
																? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
																: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
														}`}
													>
														{isGlobal
															? 'Global'
															: 'Restrito'}
													</span>
												</td>
												<td className="px-6 py-4 text-right">
													<div className="flex items-center justify-end gap-2">
														{isAllowed(
															'perfis',
															'edit',
														) &&
															p.name !==
																'Administrador Padrão' && (
																<button
																	className="p-2 text-text-muted hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
																	title="Editar"
																	onClick={(
																		e,
																	) => {
																		e.stopPropagation();
																		// Editar perfil
																	}}
																>
																	<Pencil
																		size={
																			18
																		}
																	/>
																</button>
															)}
														{isAllowed(
															'perfis',
															'delete',
														) &&
															p.name !==
																'Administrador Padrão' && (
																<button
																	className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
																	title="Excluir"
																	onClick={(
																		e,
																	) => {
																		e.stopPropagation();
																		// Excluir perfil
																	}}
																>
																	<Trash2
																		size={
																			18
																		}
																	/>
																</button>
															)}
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

			{isModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm shadow-2xl">
					<div
						className="bg-surface w-full max-w-4xl max-h-[95vh] rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 border border-border"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Header */}
						<div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-border bg-background gap-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-primary/10 rounded-lg text-primary">
									<Shield size={24} />
								</div>
								<div>
									<h2 className="text-xl font-bold text-text-main leading-tight">
										Configurar Perfil de Acesso
									</h2>
									<p className="text-sm text-text-muted mt-0.5">
										Defina regras detalhadas de permissão
										por módulo e funcionalidades.
									</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<button
									onClick={() => setIsModalOpen(false)}
									className="p-2 bg-surface hover:bg-border rounded-full text-text-muted hover:text-text-main transition-colors border border-transparent hover:border-border"
								>
									<X size={20} />
								</button>
							</div>
						</div>

						{/* Corpo */}
						<div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-background">
							<div className="space-y-6 max-w-3xl mx-auto">
								{/* Detalhes Gerais */}
								<div className="bg-surface border border-border p-5 rounded-2xl space-y-4">
									<h3 className="text-base font-bold text-text-main flex items-center gap-2 border-b border-border pb-2">
										1. Detalhes Gerais
									</h3>
									<div>
										<label className="text-sm font-semibold text-text-main mb-1.5 block">
											Nome do Perfil{' '}
											<span className="text-red-500">
												*
											</span>
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
											className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text-main focus:ring-2 focus:ring-primary/50 outline-none transition-shadow"
										/>
									</div>
									<div className="pt-2">
										<Toggle
											checked={
												formData.scope === 'ALL_SITES'
											}
											onChange={(val: boolean) => {
												setFormData((pr) => ({
													...pr,
													scope: val
														? 'ALL_SITES'
														: 'SPECIFIC_SITES',
												}));
												if (val) {
													setFormData((pr) => ({
														...pr,
														permissions:
															setAllBooleans(
																pr.permissions,
																true,
															),
													}));
												}
											}}
											label="Acesso Completo ao Sistema (Administrador)"
											subLabel="Se ativado, o perfil recebe permissões globais irrestritas e acessa todos os módulos e obras. (Ativa todas as regras abaixo automaticamente)."
										/>
									</div>
								</div>

								{/* Matriz de Permissoes (Accordions) */}
								<div className="space-y-4">
									<h3 className="text-base font-bold text-text-main flex items-center gap-2 mt-6 ml-1">
										2. Matriz de Permissões (Módulos)
									</h3>

									<div className="space-y-4">
										{/* Dashboard */}
										<div className="bg-surface border border-border rounded-2xl p-5 transition-colors">
											{renderModuleHeader(
												'dashboard',
												'Dashboard Global',
												'Acesso aos gráficos e indicadores principais.',
												['dashboard'],
											)}
											{expandedModules.dashboard && (
												<div className="mt-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
													{renderPermSwitches(
														['dashboard'],
														formData.permissions
															.dashboard,
													)}
												</div>
											)}
										</div>

										{/* Obras */}
										<div className="bg-surface border border-border rounded-2xl p-5 transition-colors">
											{renderModuleHeader(
												'obras',
												'Gestão de Obras (Projetos)',
												'Permissões dentro de cada canteiro de obras e subpáginas.',
												['obras'],
											)}

											{expandedModules.obras && (
												<div className="mt-4 space-y-6 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
													<div className="flex flex-col gap-4 bg-background p-4 rounded-xl border border-border w-full">
														<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
															<label className="text-sm font-semibold text-text-main">
																Regra da
																Listagem:
															</label>
															<select
																className="bg-surface border border-border rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary/50 outline-none text-sm font-medium text-text-main"
																value={
																	formData
																		.permissions
																		.obras
																		.access_type
																}
																onChange={(e) =>
																	setDeepPerm(
																		[
																			'obras',
																			'access_type',
																		],
																		e.target
																			.value,
																	)
																}
															>
																<option value="all">
																	Ver Todas
																	listadas na
																	empresa
																</option>
																<option value="specific">
																	Apenas
																	vinculadas
																	ao usuário
																</option>
															</select>
														</div>

														{formData.permissions
															.obras
															.access_type ===
															'specific' && (
															<div className="flex flex-col gap-2 mt-1 pt-4 border-t border-border">
																<label className="text-sm font-semibold text-text-main pb-1">
																	Obras
																	Liberadas
																	para este
																	Perfil:
																</label>
																<div className="flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar pr-2">
																	{sites.map(
																		(
																			site,
																		) => (
																			<label
																				key={
																					site.id
																				}
																				className="flex items-center gap-3 cursor-pointer px-3 py-2 bg-surface/50 hover:bg-surface rounded-lg transition-colors border border-border/50 hover:border-border"
																			>
																				<input
																					type="checkbox"
																					className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary/50"
																					checked={formData.allowed_sites.includes(
																						site.id,
																					)}
																					onChange={(
																						e,
																					) => {
																						if (
																							e
																								.target
																								.checked
																						) {
																							setFormData(
																								(
																									pr,
																								) => ({
																									...pr,
																									allowed_sites:
																										[
																											...pr.allowed_sites,
																											site.id,
																										],
																								}),
																							);
																						} else {
																							setFormData(
																								(
																									pr,
																								) => ({
																									...pr,
																									allowed_sites:
																										pr.allowed_sites.filter(
																											(
																												id,
																											) =>
																												id !==
																												site.id,
																										),
																								}),
																							);
																						}
																					}}
																				/>
																				<span className="text-sm text-text-main font-medium truncate">
																					{
																						site.name
																					}
																				</span>
																			</label>
																		),
																	)}
																	{sites.length ===
																		0 && (
																		<span className="text-xs text-text-muted italic px-2">
																			Nenhuma
																			obra
																			cadastrada.
																		</span>
																	)}
																</div>
															</div>
														)}
													</div>

													{[
														{
															id: 'visao_geral',
															label: 'Visão Geral (Dashboard da Obra)',
														},
														{
															id: 'almoxarifado',
															label: 'Almoxarifado e Estoque',
														},
														{
															id: 'ferramentas',
															label: 'Ferramentas',
															subpages: [
																{
																	id: 'disponiveis',
																	label: 'Estoque de Ferramentas',
																},
																{
																	id: 'emprestimos',
																	label: 'Empréstimos Ativos',
																},
																{
																	id: 'historico',
																	label: 'Histórico de Ferramentas',
																},
															],
														},
														{
															id: 'epis',
															label: 'EPIs',
															subpages: [
																{
																	id: 'disponiveis',
																	label: 'Estoque de EPIs',
																},
																{
																	id: 'historico',
																	label: 'Histórico de Retiradas',
																},
															],
														},
														{
															id: 'equip_alugados',
															label: 'Equip. Alugados',
															subpages: [
																{
																	id: 'ativos',
																	label: 'Equipamentos Ativos',
																},
																{
																	id: 'historico',
																	label: 'Histórico de Locação',
																},
															],
														},
														{
															id: 'movimentacoes',
															label: 'Movimentações (Logs)',
														},
														{
															id: 'colaboradores',
															label: 'Colaboradores na Obra',
														},
													].map((page) => (
														<div
															key={page.id}
															className="bg-background rounded-xl p-4 sm:p-5 border border-border"
														>
															<div className="flex items-center justify-between border-b border-border pb-2 mb-4">
																<h5 className="text-sm font-bold text-text-main">
																	{page.label}
																</h5>
															</div>

															{page.subpages ? (
																<div className="space-y-6">
																	{page.subpages.map(
																		(
																			sub,
																		) => (
																			<div
																				key={
																					sub.id
																				}
																				className="pl-4 border-l-2 border-border/50"
																			>
																				<h6 className="text-sm font-bold text-text-muted mb-2">
																					{
																						sub.label
																					}
																				</h6>
																				{renderPermSwitches(
																					[
																						'obras',
																						'pages',
																						page.id,
																						sub.id,
																					],
																					(
																						formData
																							.permissions
																							.obras
																							.pages as any
																					)[
																						page
																							.id
																					]?.[
																						sub
																							.id
																					],
																				)}
																			</div>
																		),
																	)}
																</div>
															) : (
																renderPermSwitches(
																	[
																		'obras',
																		'pages',
																		page.id,
																	],
																	(
																		formData
																			.permissions
																			.obras
																			.pages as any
																	)[page.id],
																)
															)}
														</div>
													))}
												</div>
											)}
										</div>

										{/* Mão de Obra Geral */}
										<div className="bg-surface border border-border rounded-2xl p-5 transition-colors">
											{renderModuleHeader(
												'mao_de_obra',
												'Mão de Obra (Global)',
												'Gestão do banco global de funcionários da empresa.',
												['mao_de_obra'],
											)}
											{expandedModules.mao_de_obra && (
												<div className="mt-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
													{renderPermSwitches(
														['mao_de_obra'],
														formData.permissions
															.mao_de_obra,
													)}
												</div>
											)}
										</div>

										{/* Configurações de Dados */}
										<div className="bg-surface border border-border rounded-2xl p-5 transition-colors">
											{renderModuleHeader(
												'config_dados',
												'Cadastros Básicos (Tabelas)',
												'Insumos, Unidades, Categorias e base de dados.',
												['config_dados'],
											)}
											{expandedModules.config_dados && (
												<div className="mt-4 space-y-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
													{[
														{
															id: 'insumos',
															label: 'Insumos / Catálogo Principal',
														},
														{
															id: 'unidades',
															label: 'Unidades de Medida',
														},
														{
															id: 'categorias',
															label: 'Categorias e Grupos',
														},
													].map((page) => (
														<div
															key={page.id}
															className="bg-background rounded-xl p-4 border border-border"
														>
															<div className="flex items-center justify-between border-b border-border pb-2 mb-2">
																<h5 className="text-sm font-bold text-text-main">
																	{page.label}
																</h5>
															</div>
															{renderPermSwitches(
																[
																	'config_dados',
																	page.id,
																],
																(
																	formData
																		.permissions
																		.config_dados as any
																)[page.id],
															)}
														</div>
													))}
												</div>
											)}
										</div>

										{/* Controle de Acesso */}
										<div className="bg-surface border border-border rounded-2xl p-5 transition-colors">
											{renderModuleHeader(
												'acesso',
												'Segurança e Acessos',
												'Controle quem pode acessar o sistema e gerenciar perfis.',
												['acesso'],
											)}
											{expandedModules.acesso && (
												<div className="mt-4 space-y-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
													<div className="bg-background rounded-xl p-4 border border-border">
														<h5 className="text-sm font-bold text-text-main mb-2">
															Gestão de Usuários
														</h5>
														{renderPermSwitches(
															[
																'acesso',
																'usuarios',
															],
															formData.permissions
																.acesso
																.usuarios,
														)}
													</div>
													<div className="bg-background rounded-xl p-4 border border-border">
														<h5 className="text-sm font-bold text-text-main mb-2">
															Gestão de Perfis de
															Acesso
														</h5>
														{renderPermSwitches(
															[
																'acesso',
																'perfis',
															],
															formData.permissions
																.acesso.perfis,
														)}
													</div>
												</div>
											)}
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Footer */}
						<div className="px-6 py-5 border-t border-border bg-surface flex justify-end gap-3 z-10">
							<button
								onClick={() => setIsModalOpen(false)}
								className="px-6 py-2.5 text-text-main font-semibold hover:bg-background border border-border rounded-xl transition-all"
							>
								Cancelar
							</button>
							<button
								onClick={handleSubmit}
								disabled={isSubmitting || !formData.name}
								className="px-8 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
							>
								{isSubmitting ? (
									<>
										<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
										Salvando...
									</>
								) : (
									'Salvar Regras de Acesso'
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{profileDetailsModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
					<div
						className="bg-surface w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col border border-border animate-in fade-in zoom-in duration-200"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between px-6 py-5 border-b border-border bg-background/50 rounded-t-2xl">
							<div>
								<h2 className="text-xl font-bold text-text-main flex items-center gap-3">
									<div className="p-2 bg-primary/10 rounded-lg">
										<Shield
											size={24}
											className="text-primary"
										/>
									</div>
									Detalhes do Perfil de Acesso
								</h2>
								<p className="text-sm text-text-muted mt-1 ml-12">
									Visualização das regras de permissão
									configuradas.
								</p>
							</div>
							<button
								onClick={() => setProfileDetailsModal(null)}
								className="p-2 hover:bg-background rounded-lg text-text-muted hover:text-text-main transition-colors"
							>
								<X size={24} />
							</button>
						</div>

						<div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-background">
							<div className="bg-surface border border-border p-5 rounded-2xl space-y-4">
								<div>
									<label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 block">
										Nome do Perfil
									</label>
									<div className="font-bold text-text-main text-lg h-8 flex items-center">
										{profileDetailsModal.name}
									</div>
								</div>
								<div>
									<label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 block">
										Escopo
									</label>
									<div>
										<span
											className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
												profileDetailsModal.scope ===
												'ALL_SITES'
													? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
													: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20'
											}`}
										>
											{profileDetailsModal.scope ===
											'ALL_SITES'
												? 'Global (Acesso Completo)'
												: 'Específico (Restrito)'}
										</span>
									</div>
								</div>
							</div>

							<div className="space-y-4">
								<h3 className="text-base font-bold text-text-main flex items-center gap-2 border-b border-border pb-2">
									Regras de Permissão Ativas
								</h3>
								<div className="bg-surface border border-border rounded-xl overflow-hidden">
									<div className="p-4 bg-background border-b border-border text-sm text-text-muted">
										Apenas os módulos e ações com permissão{' '}
										<strong>concedida</strong> estão
										listados abaixo.
									</div>
									<div className="p-1">
										<pre className="text-xs text-text-main font-mono bg-black/5 dark:bg-white/5 p-4 rounded-lg overflow-x-auto">
											{JSON.stringify(
												profileDetailsModal.permissions,
												(key, value) => {
													// Filter out false values for cleaner display
													if (value === false)
														return undefined;
													// Filter out empty objects
													if (
														typeof value ===
															'object' &&
														value !== null &&
														Object.keys(value)
															.length === 0
													)
														return undefined;
													return value;
												},
												2,
											)}
										</pre>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</ERPLayout>
	);
}
