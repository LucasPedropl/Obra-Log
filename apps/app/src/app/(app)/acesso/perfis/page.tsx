'use client';

import { DataTable, DetailRow } from '@/components/shared/DataTable';
import { FilterPanel } from '@/components/shared/FilterPanel';
import { PageHeader } from '@/components/shared/PageHeader';
import { Pagination } from '@/components/shared/Pagination';
import { TableSearch } from '@/components/shared/TableSearch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';
import { AccessProfileForm } from '@/features/admin/components/AccessProfileForm';
import {
	AccessProfile,
	accessProfilesService,
} from '@/features/admin/services/accessProfiles.service';
import { getParentCompanyId } from '@/lib/utils';
import { Download, Loader2, Plus, ShieldCheck, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function PerfisDeAcessoPage() {
	const [perfis, setPerfis] = useState<AccessProfile[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [isFormOpen, setIsFormOpen] = useState(false);
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
			const companyId = getParentCompanyId();
			if (!companyId)
				throw new Error(
					'Instância não encontrada. Faça login novamente.',
				);

			const data = await accessProfilesService.getProfiles(companyId);
			setPerfis(data);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Erro desconhecido ao carregar perfis';
			addToast('Erro ao carregar perfis: ' + message, 'error');
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

	interface LocalProfileFormData {
		name: string;
		scope: 'ALL_SITES' | 'SPECIFIC_SITES';
		permissions: Record<string, any>;
		allowed_sites: string[];
		company_id?: string;
	}

	const handleSave = async (data: LocalProfileFormData) => {
		try {
			setIsSaving(true);
			const companyId = getParentCompanyId();
			if (!companyId) throw new Error('Instância não encontrada.');

			data.company_id = companyId;

			if (editingItem) {
				await accessProfilesService.updateProfile(editingItem.id, data);
				addToast('Perfil atualizado com sucesso.', 'success');
			} else {
				// Certificamos que company_id está presente para satisfazer o tipo Omit<AccessProfile, 'id'>
				await accessProfilesService.createProfile(data as Required<LocalProfileFormData>);
				addToast('Perfil criado com sucesso.', 'success');
			}
			await loadData();
			handleFormClose();
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Erro desconhecido ao salvar perfil';
			addToast('Erro ao salvar: ' + message, 'error');
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
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Erro desconhecido ao excluir perfil';
			addToast('Erro ao excluir: ' + message, 'error');
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
			/>

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
							detailsTitle="Detalhes do Perfil"
							renderDetails={(item) => (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<DetailRow label="Nome do Perfil" value={item.name} className="sm:col-span-2" />
									<DetailRow label="Escopo de Permissão" value={item.scope === 'ALL_SITES' ? 'Todas das Obras da Instância' : 'Restrito a algumas Obras'} />
									<DetailRow label="Quantidade de Módulos" value={`${Object.keys(item.permissions || {}).filter((k) => Object.values(item.permissions[k] as any).some((v) => v)).length} módulos com acesso`} />
								</div>
							)}
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
					onClick={() => {}}
					className="flex items-center gap-2 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 rounded-[5px] shadow-sm"
				>
					<Upload className="h-4 w-4" />
					<span>Importar</span>
				</Button>

				{perfis.length > 0 && (
					<Button
						variant="outline"
						onClick={() => {}}
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
