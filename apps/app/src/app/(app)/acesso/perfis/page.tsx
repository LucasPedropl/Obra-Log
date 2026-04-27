'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { ShieldCheck, Upload, Download, X, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSearch } from '@/components/shared/TableSearch';
import { FilterPanel } from '@/components/shared/FilterPanel';
import { DataTable } from '@/components/shared/DataTable';
import { useToast } from '@/components/ui/toaster';
import {
	accessProfilesService,
	AccessProfile,
} from '@/features/admin/services/accessProfiles.service';
import { AccessProfileForm } from '@/features/admin/components/AccessProfileForm';
import { UserForm } from '@/features/admin/components/UserForm';
import { usersService } from '@/features/admin/services/users.service';

export default function PerfisDeAcessoPage() {
	const [perfis, setPerfis] = useState<AccessProfile[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isUserFormOpen, setIsUserFormOpen] = useState(false);
	const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
	const [editingItem, setEditingItem] = useState<AccessProfile | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [showFilters, setShowFilters] = useState(false);
	const [scopeFilter, setScopeFilter] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const itemsPerPage = 10;
	const { addToast } = useToast();

	const loadData = async () => {
		try {
			setIsLoading(true);
			const companyCookie = document.cookie.match(
				/(^| )selectedCompanyId=([^;]+)/,
			);
			if (!companyCookie)
				throw new Error(
					'Instância não encontrada no cookie. Faça login novamente.',
				);
			const companyId = companyCookie[2];

			const data = await accessProfilesService.getProfiles(companyId);
			setPerfis(data);
		} catch (error: any) {
			addToast('Erro ao carregar perfis: ' + error.message, 'error');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	const handleSearchChange = (val: string) => {
		setSearchTerm(val);
		setCurrentPage(1);
	};

	const filteredPerfis = perfis.filter((perfil) => {
		const searchLower = searchTerm.toLowerCase();
		const matchesSearch =
			!searchTerm || perfil.name?.toLowerCase().includes(searchLower);
		const matchesScope = scopeFilter ? perfil.scope === scopeFilter : true;
		return matchesSearch && matchesScope;
	});

	const totalPages = Math.max(
		1,
		Math.ceil(filteredPerfis.length / itemsPerPage),
	);

	const handleFormClose = () => {
		setIsFormOpen(false);
		setEditingItem(null);
	};

	const handleUserFormClose = () => {
		setIsUserFormOpen(false);
		setGeneratedPassword(null);
	};

	const handleSaveUser = async (data: any) => {
		try {
			setIsSaving(true);
			const companyCookie = document.cookie.match(
				/(^| )selectedCompanyId=([^;]+)/,
			);
			if (!companyCookie) throw new Error('Instância não encontrada.');
			const companyId = companyCookie[2];

			const response = await usersService.createUser({
				...data,
				company_id: companyId,
			});
			
			setGeneratedPassword(response.tempPassword);
			addToast('Usuário criado com sucesso!', 'success');
		} catch (error: any) {
			addToast('Erro ao criar usuário: ' + error.message, 'error');
		} finally {
			setIsSaving(false);
		}
	};

	const handleSave = async (data: any) => {
		try {
			setIsSaving(true);
			const companyCookie = document.cookie.match(
				/(^| )selectedCompanyId=([^;]+)/,
			);
			if (!companyCookie) throw new Error('Instância não encontrada.');
			const companyId = companyCookie[2];

			data.company_id = companyId;

			if (editingItem) {
				await accessProfilesService.updateProfile(editingItem.id, data);
				addToast('Perfil atualizado com sucesso.', 'success');
			} else {
				await accessProfilesService.createProfile(data);
				addToast('Perfil criado com sucesso.', 'success');
			}
			await loadData();
			handleFormClose();
		} catch (error: any) {
			addToast('Erro ao salvar: ' + error.message, 'error');
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async (item: AccessProfile) => {
		if (!confirm('Deseja realmente deletar este perfil de acesso?')) return;
		try {
			setIsLoading(true);
			await accessProfilesService.deleteProfile(item.id);
			addToast('Perfil excluído.', 'success');
			await loadData();
		} catch (error: any) {
			addToast('Erro ao excluir: ' + error.message, 'error');
			setIsLoading(false);
		}
	};

	const currentItems = filteredPerfis.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	return (
		<div className="w-full flex flex-col gap-6 relative">
			<PageHeader
				title="Perfis de Acesso"
				description="Gerencie os níveis de acesso e permissões do sistema"
				onAdd={() => setIsFormOpen(true)}
				addLabel="Novo Perfil"
			>
				<Button
					size="sm"
					variant="outline"
					onClick={() => setIsUserFormOpen(true)}
					className="flex items-center gap-2 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 rounded-[5px] px-4 shadow-sm"
				>
					<Plus className="h-4 w-4" />
					<span>Novo Usuário</span>
				</Button>
			</PageHeader>

			{(isFormOpen || editingItem) && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
					onClick={handleFormClose}
				>
					<div
						className="relative w-full max-w-3xl mt-8 md:mt-0 animate-in fade-in zoom-in duration-300 bg-white p-6 rounded-xl shadow-xl border overflow-hidden max-h-[90vh]"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							onClick={handleFormClose}
							className="absolute top-4 right-4 z-10 p-2 text-muted-foreground hover:bg-muted/30 rounded-full transition-colors"
						>
							<X size={20} />
						</button>
						<AccessProfileForm
							initialData={editingItem}
							companyId={
								document.cookie.match(
									/(^| )selectedCompanyId=([^;]+)/,
								)?.[2] || ''
							}
							onSubmit={handleSave}
							onCancel={handleFormClose}
							isLoading={isSaving}
						/>
					</div>
				</div>
			)}

			{isUserFormOpen && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
					onClick={handleUserFormClose}
				>
					<div
						className="relative w-full max-w-2xl mt-8 md:mt-0 animate-in fade-in zoom-in duration-300 bg-white p-6 rounded-xl shadow-xl border overflow-hidden max-h-[90vh]"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							onClick={handleUserFormClose}
							className="absolute top-4 right-4 z-10 p-2 text-muted-foreground hover:bg-muted/30 rounded-full transition-colors"
						>
							<X size={20} />
						</button>
						
						{generatedPassword ? (
							<div className="text-center space-y-4 py-8">
								<div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
									<ShieldCheck className="w-8 h-8 text-green-600" />
								</div>
								<h3 className="text-xl font-medium text-gray-900">Usuário Criado com Sucesso!</h3>
								<p className="text-gray-500 max-w-sm mx-auto">
									A senha temporária do usuário foi gerada. Copie-a agora, pois não será mostrada novamente.
								</p>
								<div className="bg-gray-100 p-4 rounded-lg flex items-center justify-center gap-3 max-w-xs mx-auto my-6">
									<code className="text-xl font-mono font-bold tracking-wider">{generatedPassword}</code>
								</div>
								<Button onClick={handleUserFormClose} className="w-full max-w-xs">
									Concluir
								</Button>
							</div>
						) : (
							<UserForm
								companyId={
									document.cookie.match(
										/(^| )selectedCompanyId=([^;]+)/,
									)?.[2] || ''
								}
								profiles={perfis}
								onSubmit={handleSaveUser}
								onCancel={handleUserFormClose}
								isLoading={isSaving}
							/>
						)}
					</div>
				</div>
			)}

			{isLoading && perfis.length === 0 ? (
				<div className="flex justify-center p-12">
					<Loader2 className="w-8 h-8 animate-spin text-gray-400" />
				</div>
			) : perfis.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
					<ShieldCheck className="w-12 h-12 text-gray-400 mb-4" />
					<h3 className="text-lg font-medium text-gray-900 mb-1">
						Nenhum perfil encontrado
					</h3>
					<p className="text-gray-500 text-sm mb-6 text-center max-w-md">
						Cadastre seu primeiro perfil de acesso para começar a
						gerenciar permissões no sistema.
					</p>
					<Button onClick={() => setIsFormOpen(true)}>
						<Plus className="w-4 h-4 mr-2" />
						Criar Primeiro Perfil
					</Button>
				</div>
			) : (
				<div className="space-y-4">
					<div className="space-y-4">
						<TableSearch
							value={searchTerm}
							onChange={handleSearchChange}
							placeholder="Buscar perfis por nome..."
							onFilterClick={() => setShowFilters(!showFilters)}
						/>

						<FilterPanel
							isOpen={showFilters}
							onClose={() => setShowFilters(false)}
							onClear={() => {
								setScopeFilter('');
							}}
						>
							<div className="flex flex-col gap-1.5">
								<label className="text-sm font-medium text-gray-700">
									Escopo de Permissão
								</label>
								<select
									value={scopeFilter}
									onChange={(e) =>
										setScopeFilter(e.target.value)
									}
									className="h-10 px-3 py-2 rounded-[5px] border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
								>
									<option value="">Todos</option>
									<option value="ALL_SITES">
										Todas as Obras
									</option>
									<option value="SPECIFIC_SITES">
										Obras Específicas
									</option>
								</select>
							</div>
						</FilterPanel>
					</div>

					<div className="bg-white rounded-xl shadow-sm">
						<DataTable
							data={currentItems}
							columns={[
								{
									header: 'Nome do Perfil',
									accessorKey: 'name',
									className: 'font-medium',
								},
								{
									header: 'Escopo',
									cell: (item) =>
										item.scope === 'ALL_SITES'
											? 'Todas das Obras da Instância'
											: 'Restrito a algumas Obras',
								},
								{
									header: 'Permissões Ativas',
									cell: (item) =>
										`${Object.keys(item.permissions || {}).filter((k) => Object.values(item.permissions[k] as any).some((v) => v)).length} módulos`,
								},
							]}
							keyExtractor={(item) => item.id}
							onEdit={(item) => {
								setEditingItem(item);
								setIsFormOpen(true);
							}}
							onDelete={handleDelete}
							onDeleteBulk={async (items) => {
								for (const item of items) {
									await accessProfilesService.deleteProfile(
										item.id,
									);
								}
								await loadData();
								addToast('Perfis excluídos.', 'success');
							}}
						/>

						{totalPages > 1 && (
							<div className="border-t">
								<Pagination
									currentPage={currentPage}
									totalPages={totalPages}
									onPageChange={setCurrentPage}
								/>
							</div>
						)}
					</div>
				</div>
			)}

			<div className="flex items-center justify-end gap-3 w-full mt-4">
				<Button
					variant="outline"
					onClick={() => console.log('Importar perfis')}
					className="flex items-center gap-2 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 rounded-[5px] shadow-sm"
				>
					<Upload className="h-4 w-4" />
					<span>Importar</span>
				</Button>

				{perfis.length > 0 && (
					<Button
						variant="outline"
						onClick={() => console.log('Exportar perfis')}
						className="flex items-center gap-2 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 rounded-[5px] shadow-sm"
					>
						<Download className="h-4 w-4" />
						<span>Exportar</span>
					</Button>
				)}
			</div>
		</div>
	);
}
