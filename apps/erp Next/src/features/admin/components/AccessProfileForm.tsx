'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Eye, Edit2, Plus, Trash2 } from 'lucide-react';

const APP_MODULES = [
	{ id: 'dashboard', label: 'Dashboard Geral', group: 'Global' },
	{ id: 'insumos', label: 'Catálogo de Insumos', group: 'Global' },
	{
		id: 'obras',
		label: 'Gestão de Obras',
		group: 'Global',
		children: [
			{ id: 'site_dashboard', label: 'Visão Geral (Painel da Obra)' },
			{ id: 'site_insumos', label: 'Estoque e Materiais' },
			{ id: 'site_equipamentos', label: 'Ferramentas Alugadas' },
			{ id: 'site_colaboradores', label: 'Equipe Alocada' },
		],
	},
	{ id: 'colaboradores', label: 'Base de Colaboradores', group: 'Global' },
	{ id: 'usuarios', label: 'Usuários', group: 'Global' },
	{ id: 'perfis', label: 'Perfis de Acesso', group: 'Global' },
];

interface PermissionAction {
	view: boolean;
	create: boolean;
	edit: boolean;
	delete: boolean;
}

export function AccessProfileForm({
	initialData,
	companyId,
	onSubmit,
	onCancel,
	isLoading,
}: {
	initialData?: any;
	companyId: string;
	onSubmit: (data: any) => void;
	onCancel: () => void;
	isLoading: boolean;
}) {
	const [name, setName] = useState(initialData?.name || '');
	const [scope, setScope] = useState<'ALL_SITES' | 'SPECIFIC_SITES'>(
		initialData?.scope || 'ALL_SITES',
	);
	const [permissions, setPermissions] = useState<
		Record<string, PermissionAction>
	>(initialData?.permissions || {});

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
			allowed_sites: [],
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
						<label className="text-sm font-medium text-gray-700">
							Escopo
						</label>
						<select
							value={scope}
							onChange={(e) => setScope(e.target.value as any)}
							className="h-10 px-3 py-2 rounded-md border border-input focus:ring-2 focus:ring-primary focus:border-transparent outline-none w-full"
						>
							<option value="ALL_SITES">
								Acesso a Todas as Obras da Empresa
							</option>
							<option value="SPECIFIC_SITES">
								Acesso Restrito a Obras Específicas
							</option>
						</select>
					</div>
				</div>
			</div>

			<div className="border border-border rounded-lg overflow-hidden">
				<div className="bg-muted/50 p-4 border-b font-medium text-sm flex items-center justify-between">
					<span>Permissões por Módulo</span>
				</div>
				<div className="divide-y divide-border h-[40vh] overflow-y-auto w-full">
					<table className="w-full text-left text-sm">
						<thead className="bg-muted text-muted-foreground sticky top-0 z-10 shadow-sm">
							<tr>
								<th className="font-medium p-3">Módulo</th>
								<th className="font-medium p-3 text-center">
									<Eye size={16} className="inline mr-1" />{' '}
									Ver
								</th>
								<th className="font-medium p-3 text-center">
									<Plus size={16} className="inline mr-1" />{' '}
									Criar
								</th>
								<th className="font-medium p-3 text-center">
									<Edit2 size={16} className="inline mr-1" />{' '}
									Editar
								</th>
								<th className="font-medium p-3 text-center">
									<Trash2 size={16} className="inline mr-1" />{' '}
									Excluir
								</th>
							</tr>
						</thead>
						<tbody className="bg-card divide-y divide-border">
							{Array.from(
								new Set(APP_MODULES.map((m) => m.group)),
							).map((groupName) => {
								const modulesInGroup = APP_MODULES.filter(
									(m) => m.group === groupName,
								);

								return (
									<React.Fragment key={groupName}>
										<tr className="bg-muted/30">
											<td
												colSpan={5}
												className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground bg-gray-50/50 dark:bg-gray-800/20"
											>
												{groupName}
											</td>
										</tr>
										{modulesInGroup.map((mod) => {
											const modPerms = permissions[
												mod.id
											] || {
												view: false,
												create: false,
												edit: false,
												delete: false,
											};

											return (
												<React.Fragment key={mod.id}>
													<tr className="hover:bg-muted/50 transition-colors">
														<td className="p-3 font-medium text-foreground pl-6">
															{mod.label}
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
																		<td className="p-3 text-sm font-medium text-foreground pl-12 flex items-center gap-2">
																			<div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
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
