'use client';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/Icon';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { cn } from '@/lib/utils';
import { AlertTriangle, Building2, Edit2, Eye, Info, Plus, Shield, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

interface AppModuleChild {
	id: string;
	label: string;
	icon: string;
	sensitive?: boolean;
}

interface AppModule {
	id: string;
	label: string;
	group: string;
	icon: string;
	sensitive?: boolean;
	children?: AppModuleChild[];
}

const APP_MODULES: AppModule[] = [
	{
		id: 'dashboard',
		label: 'Dashboard Geral',
		group: 'Global',
		icon: 'SquaresFour',
	},
	{
		id: 'insumos',
		label: 'Catálogo de Insumos',
		group: 'Global',
		icon: 'Package',
	},
	{
		id: 'obras',
		label: 'Gestão de Obras',
		group: 'Global',
		icon: 'Buildings',
		children: [
			{ id: 'site_dashboard', label: 'Visão Geral (Painel da Obra)', icon: 'ChartPieSlice' },
			{ id: 'site_insumos', label: 'Estoque e Materiais', icon: 'Warehouse' },
			{ id: 'site_mao_de_obra', label: 'Mão de Obra', icon: 'UsersThree' },
			{ id: 'site_ponto', label: 'Registro de Ponto', icon: 'Clock' },
			{ id: 'site_ferramentas', label: 'Gestão de Ferramentas', icon: 'Wrench' },
			{ id: 'site_epis', label: 'Gestão de EPIs', icon: 'HardHat' },
			{ id: 'site_equipamentos', label: 'Equip. Alugados', icon: 'Truck' },
			{ id: 'site_movimentacoes', label: 'Movimentações', icon: 'ArrowsLeftRight' },
			{ id: 'site_config', label: 'Configuração da Obra', icon: 'Gear' },
		],
	},
	{
		id: 'mao_de_obra',
		label: 'Mão de Obra',
		group: 'Global',
		icon: 'Users',
	},
	{
		id: 'folha_pagamento',
		label: 'Folha de Pagamento',
		group: 'Global',
		icon: 'Money',
		sensitive: true,
	},
	{ id: 'usuarios', label: 'Usuários', group: 'Global', icon: 'UserCircle' },
	{
		id: 'perfis',
		label: 'Perfis de Acesso',
		group: 'Global',
		icon: 'ShieldCheck',
	},
];

const isModuleActive = (perms?: PermissionAction) =>
	!!perms && (perms.view || perms.create || perms.edit || perms.delete);

interface PermissionAction {
	view: boolean;
	create: boolean;
	edit: boolean;
	delete: boolean;
}

interface SiteOption {
	id: string;
	name: string;
}

interface AccessProfileFormData {
	company_id: string;
	name: string;
	scope: 'ALL_SITES' | 'SPECIFIC_SITES';
	permissions: Record<string, PermissionAction>;
	allowed_sites: string[];
}

export function AccessProfileForm({
	initialData,
	companyId,
	sites = [],
	onSubmit,
	onCancel,
	isLoading,
}: {
	initialData?: Partial<AccessProfileFormData>;
	companyId: string;
	sites?: SiteOption[];
	onSubmit: (data: AccessProfileFormData) => void;
	onCancel: () => void;
	isLoading: boolean;
}) {
	const [name, setName] = useState(initialData?.name || '');
	const [scope, setScope] = useState<'ALL_SITES' | 'SPECIFIC_SITES'>(
		initialData?.scope || 'ALL_SITES',
	);
	const [allowedSites, setAllowedSites] = useState<string[]>(
		initialData?.allowed_sites || [],
	);
	const [permissions, setPermissions] = useState<
		Record<string, PermissionAction>
	>(initialData?.permissions || {});

	const toggleAllowedSite = (siteId: string) => {
		setAllowedSites((current) =>
			current.includes(siteId)
				? current.filter((id) => id !== siteId)
				: [...current, siteId],
		);
	};

	const handleBulkPermissionChange = (modId: string, value: boolean) => {
		setPermissions((prev) => {
			const nextState = {
				...prev,
				[modId]: {
					view: value,
					create: value,
					edit: value,
					delete: value,
				},
			};

			// Se desativar o pai (obras), desativa todos os filhos
			if (modId === 'obras' && !value) {
				const childrenMods =
					APP_MODULES.find((m) => m.id === 'obras')?.children || [];
				childrenMods.forEach((child) => {
					nextState[child.id] = {
						view: false,
						create: false,
						edit: false,
						delete: false,
					};
				});
			}

			return nextState;
		});
	};

	const handleToggleAll = (modId: string) => {
		const modPerms = permissions[modId];
		const isAnyActive =
			modPerms &&
			(modPerms.view ||
				modPerms.create ||
				modPerms.edit ||
				modPerms.delete);
		handleBulkPermissionChange(modId, !isAnyActive);
	};
	const handlePermissionChange = (
		modId: string,
		action: keyof PermissionAction,
		value: boolean,
	) => {
		setPermissions((prev) => {
			const modPerms = prev[modId] || {
				view: false,
				create: false,
				edit: false,
				delete: false,
			};

			// Se o usuário tenta marcar create/edit/delete, view deve ser forcado a true
			const newView =
				action !== 'view' && value
					? true
					: action === 'view'
						? value
						: modPerms.view;

			// Se o usuário tenta desmarcar view, create/edit/delete devem ser forçados a false
			const result = {
				...modPerms,
				view: newView,
				[action]: value,
			};

			if (action === 'view' && !value) {
				result.create = false;
				result.edit = false;
				result.delete = false;
			}

			const nextState = { ...prev, [modId]: result };

			// Se o módulo for "obras" e estiver sendo totalmente desabilitado a view
			if (modId === 'obras' && action === 'view' && !value) {
				const childrenMods =
					APP_MODULES.find((m) => m.id === 'obras')?.children || [];
				childrenMods.forEach((child) => {
					nextState[child.id] = {
						view: false,
						create: false,
						edit: false,
						delete: false,
					};
				});
			}

			return nextState;
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit({
			company_id: companyId,
			name,
			scope,
			permissions,
			allowed_sites: scope === 'ALL_SITES' ? [] : allowedSites,
		});
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-6">
			<div className="flex items-center gap-3 border-b pb-4">
				<div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
					<Shield size={20} />
				</div>
				<div>
					<h2 className="text-xl font-semibold">
						{initialData ? 'Editar Perfil' : 'Novo Perfil'}
					</h2>
					<p className="text-sm text-gray-500">
						Defina os recursos e as abas que este perfil terá acesso
					</p>
				</div>
			</div>

			<div className="flex flex-col gap-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex flex-col gap-2">
						<label className="text-sm font-medium text-gray-700">
							Nome do Perfil
						</label>
						<input
							type="text"
							required
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Ex: Gerente de Obras"
							className="h-10 px-3 py-2 rounded-md border border-input focus:ring-2 focus:ring-primary focus:border-transparent outline-none w-full"
						/>
					</div>
					<div className="flex flex-col gap-2">
						<label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
							Escopo
						</label>
						<SearchableSelect
							value={scope}
							onChange={(val) => {
								const nextScope = val as 'ALL_SITES' | 'SPECIFIC_SITES';
								setScope(nextScope);
								if (nextScope === 'ALL_SITES') {
									setAllowedSites([]);
								}
							}}
							options={[
								{ value: 'ALL_SITES', label: 'Acesso a Todas as Obras da Empresa' },
								{ value: 'SPECIFIC_SITES', label: 'Acesso Restrito a Obras Específicas' },
							]}
							placeholder="Selecione o escopo..."
						/>
					</div>
				</div>

				{scope === 'SPECIFIC_SITES' && (
					<div className="rounded-lg border border-amber-100 bg-amber-50/40 p-4 space-y-3">
						<div className="flex items-center gap-2 text-amber-700">
							<Building2 size={18} />
							<h4 className="text-sm font-semibold">Obras permitidas neste perfil</h4>
						</div>
						<p className="text-xs text-gray-600">
							Selecione as obras que usuários com este perfil poderão acessar.
						</p>
						{sites.length === 0 ? (
							<div className="flex gap-3 rounded-lg border border-amber-100 bg-white p-3 text-amber-800">
								<Info size={18} className="shrink-0" />
								<p className="text-xs leading-relaxed">
									Não há obras ativas cadastradas. O perfil poderá ser salvo,
									mas usuários restritos não terão acesso a nenhuma obra.
								</p>
							</div>
						) : (
							<div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto rounded-md border bg-white p-2 sm:grid-cols-2">
								{sites.map((site) => (
									<div
										key={site.id}
										onClick={() => toggleAllowedSite(site.id)}
										className={cn(
											'flex cursor-pointer items-center gap-2 rounded-md border p-2 transition-all',
											allowedSites.includes(site.id)
												? 'border-primary/30 bg-primary/10 font-medium text-primary'
												: 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
										)}
									>
										<div
											className={cn(
												'flex h-4 w-4 items-center justify-center rounded border transition-colors',
												allowedSites.includes(site.id)
													? 'border-primary bg-primary'
													: 'border-gray-300',
											)}
										>
											{allowedSites.includes(site.id) && (
												<div className="h-1.5 w-1.5 rounded-full bg-white" />
											)}
										</div>
										<span className="truncate text-xs">{site.name}</span>
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>

			<div className="border border-border rounded-lg overflow-hidden">
				<div className="divide-y divide-border h-[40vh] overflow-y-auto w-full custom-scrollbar">
					<table className="w-full text-left text-sm table-fixed">
						<thead className="bg-muted text-muted-foreground sticky top-0 z-10 shadow-sm">
							<tr>
								<th className="font-medium p-3 w-[45%]">Módulo</th>
								<th className="font-medium p-3 text-center w-[13.75%]">
									<Eye size={16} className="inline mr-1" />{' '}
									Ver
								</th>
								<th className="font-medium p-3 text-center w-[13.75%]">
									<Plus size={16} className="inline mr-1" />{' '}
									Criar
								</th>
								<th className="font-medium p-3 text-center w-[13.75%]">
									<Edit2 size={16} className="inline mr-1" />{' '}
									Editar
								</th>
								<th className="font-medium p-3 text-center w-[13.75%]">
									<Trash2 size={16} className="inline mr-1" />{' '}
									Excluir
								</th>
							</tr>
						</thead>
						<tbody className="bg-card divide-y divide-border">
							{APP_MODULES.map((mod) => {
								const modPerms = permissions[
									mod.id
								] || {
									view: false,
									create: false,
									edit: false,
									delete: false,
								};

											const sensitiveActive =
												!!mod.sensitive && isModuleActive(modPerms);

											return (
												<React.Fragment key={mod.id}>
													{sensitiveActive && (
														<tr>
															<td colSpan={5} className="p-0">
																<div className="flex items-start gap-2 bg-red-50 border-y border-red-200 px-6 py-2.5 text-red-700">
																	<AlertTriangle size={16} className="shrink-0 mt-0.5" />
																	<p className="text-xs font-semibold leading-relaxed">
																		Atenção: esta é a área mais sensível do
																		sistema. Ao liberar a Folha de Pagamento, este
																		perfil verá diárias, valores e dados financeiros
																		de todos os colaboradores. Conceda apenas a
																		usuários de total confiança.
																	</p>
																</div>
															</td>
														</tr>
													)}
													<tr
														className={cn(
															'hover:bg-muted/50 transition-colors',
															sensitiveActive && 'bg-red-50/40',
														)}
													>
														<td
															className="p-3 font-medium text-foreground pl-6 cursor-pointer select-none hover:bg-muted/30 transition-colors"
															onClick={() =>
																handleToggleAll(
																	mod.id,
																)
															}
															onContextMenu={(
																e,
															) => {
																e.preventDefault();
																handleBulkPermissionChange(
																	mod.id,
																	false,
																);
															}}
															title="Clique para alternar tudo / Botão direito para desativar tudo"
														>
															<div className="flex items-center gap-2">
																{mod.icon && (
																	<Icon
																		name={
																			mod.icon
																		}
																		size={
																			18
																		}
																		className="text-gray-500"
																	/>
																)}
																{mod.label}
																{mod.sensitive && (
																	<span
																		title="Página sensível: acesso a dados financeiros"
																		className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700"
																	>
																		<AlertTriangle size={11} />
																		Sensível
																	</span>
																)}
															</div>
														</td>

														{(
															[
																'view',
																'create',
																'edit',
																'delete',
															] as const
														).map((action) => {
															const isDisabled =
																action !==
																	'view' &&
																!modPerms.view;
															return (
																<td
																	key={action}
																	className="p-3 text-center"
																>
																	<input
																		type="checkbox"
																		checked={
																			isDisabled
																				? false
																				: modPerms[
																						action
																					]
																		}
																		disabled={
																			isDisabled
																		}
																		onChange={(
																			e,
																		) =>
																			handlePermissionChange(
																				mod.id,
																				action,
																				e
																					.target
																					.checked,
																			)
																		}
																		className={`w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary transition-opacity ${
																			isDisabled
																				? 'opacity-30 cursor-not-allowed'
																				: 'cursor-pointer'
																		}`}
																	/>
																</td>
															);
														})}
													</tr>

													{/* Renderizar Sub-Módulos apenas se a visualização do pai estiver ativa */}
													{mod.children &&
														modPerms.view &&
														mod.children.map(
															(child) => {
																const childPerms =
																	permissions[
																		child.id
																	] || {
																		view: false,
																		create: false,
																		edit: false,
																		delete: false,
																	};

																return (
																	<tr
																		key={
																			child.id
																		}
																		className="hover:bg-muted/50 transition-colors bg-muted/10"
																	>
																		<td
																			className="p-3 text-sm font-medium text-foreground pl-12 flex items-center gap-2 cursor-pointer select-none hover:bg-muted/30 transition-colors"
																			onClick={() =>
																				handleToggleAll(
																					child.id,
																				)
																			}
																			onContextMenu={(
																				e,
																			) => {
																				e.preventDefault();
																				handleBulkPermissionChange(
																					child.id,
																					false,
																				);
																			}}
																			title="Clique para alternar tudo / Botão direito para desativar tudo"
																		>
																			{child.icon && (
																				<Icon
																					name={
																						child.icon
																					}
																					size={
																						16
																					}
																					className="text-gray-400"
																				/>
																			)}
																			{
																				child.label
																			}
																		</td>

																		{(
																			[
																				'view',
																				'create',
																				'edit',
																				'delete',
																			] as const
																		).map(
																			(
																				action,
																			) => {
																				const isChildDisabled =
																					action !==
																						'view' &&
																					!childPerms.view;
																				return (
																					<td
																						key={
																							action
																						}
																						className="p-3 text-center"
																					>
																						<input
																							type="checkbox"
																							checked={
																								isChildDisabled
																									? false
																									: childPerms[
																											action
																										]
																							}
																							disabled={
																								isChildDisabled
																							}
																							onChange={(
																								e,
																							) =>
																								handlePermissionChange(
																									child.id,
																									action,
																									e
																										.target
																										.checked,
																								)
																							}
																							className={`w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary transition-opacity ${
																								isChildDisabled
																									? 'opacity-30 cursor-not-allowed'
																									: 'cursor-pointer'
																							}`}
																						/>
																					</td>
																				);
																			},
																		)}
																	</tr>
																);
															},
														)}
													</React.Fragment>
												);
											})}
						</tbody>
					</table>
				</div>
			</div>

			<div className="flex gap-3 justify-end pt-4 border-t">
				<Button
					type="button"
					variant="outline"
					onClick={onCancel}
					disabled={isLoading}
				>
					Cancelar
				</Button>
				<Button type="submit" disabled={isLoading || !name.trim()}>
					{isLoading ? 'Salvando...' : 'Salvar Perfil'}
				</Button>
			</div>
		</form>
	);
}
