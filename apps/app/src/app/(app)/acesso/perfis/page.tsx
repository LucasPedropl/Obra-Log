'use client';

import { DataTable, DetailRow } from '@/components/shared/DataTable';
import { FilterPanel } from '@/components/shared/FilterPanel';
import { PageHeader } from '@/components/shared/PageHeader';
import { Pagination } from '@/components/shared/Pagination';
import { TableSearch } from '@/components/shared/TableSearch';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Can } from '@/components/shared/Can';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';
import { AccessProfileForm } from '@/features/admin/components/AccessProfileForm';
import {
	AccessProfile,
	accessProfilesService,
} from '@/features/admin/services/accessProfiles.service';
import { getCompanySitesAction } from '@/app/actions/globalUsers';
import { getActiveCompanyId } from '@/lib/utils';
import { exportToCsv } from '@/lib/exportUtils';
import { useConfirm } from '@/components/shared/ConfirmDialog';
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
	const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
	const itemsPerPage = 10;
	const { addToast } = useToast();
	const confirm = useConfirm();

	const loadData = async () => {
		try {
			setIsLoading(true);
			const companyId = getActiveCompanyId();
			if (!companyId)
				throw new Error(
					'Instância não encontrada. Faça login novamente.',
				);

			const [data, sitesRes] = await Promise.all([
				accessProfilesService.getProfiles(companyId),
				getCompanySitesAction(),
			]);
			setPerfis(data);
			if (sitesRes.success) {
				setSites(sitesRes.sites || []);
			}
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
		const matchesScope = scopeFilter ? perfil.obra_scope === scopeFilter : true;
		return matchesSearch && matchesScope;
	});

	const totalPages = Math.ceil(filteredPerfis.length / itemsPerPage);
	const currentData = filteredPerfis.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	const handleEdit = (item: AccessProfile) => {
		setEditingItem(item);
		setIsFormOpen(true);
	};

	const handleSave = async (data: any) => {
		try {
			setIsSaving(true);
			const companyId = getActiveCompanyId();
			if (!companyId) throw new Error('Instância não encontrada.');

			if (editingItem) {
				await accessProfilesService.updateProfile(editingItem.id, data);
				addToast('Perfil atualizado com sucesso.', 'success');
			} else {
				await accessProfilesService.createProfile(data);
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
		const ok = await confirm({
			title: 'Excluir perfil',
			description: `Deseja realmente excluir o perfil ${item.name}?`,
			confirmLabel: 'Excluir',
			variant: 'destructive',
		});
		if (ok) {
			try {
				await accessProfilesService.deleteProfile(item.id);
				addToast('Perfil excluído com sucesso!', 'success');
				loadData();
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Erro desconhecido';
				addToast('Erro ao excluir: ' + message, 'error');
			}
		}
	};

	const handleExport = () => {
		exportToCsv(
			filteredPerfis.map((p) => ({
				nome: p.name,
				escopo: p.scope,
			})),
			[
				{ key: 'nome', label: 'Nome' },
				{ key: 'escopo', label: 'Escopo de Obras' },
			],
			'perfis-acesso',
		);
	};

	const handleFormClose = () => {
		setIsFormOpen(false);
		setEditingItem(null);
		loadData();
	};

	return (
		<ProtectedRoute resource="perfis">
			<div className="w-full flex flex-col gap-6 relative">
				<Can 
					on="perfis" 
					perform="create"
					fallback={
						<PageHeader
							title="Perfis de Acesso"
							description="Configure permissões granulares para diferentes funções no sistema"
						/>
					}
				>
					<PageHeader
						title="Perfis de Acesso"
						description="Configure permissões granulares para diferentes funções no sistema"
						onAdd={() => setIsFormOpen(true)}
						addLabel="Novo Perfil"
					/>
				</Can>

				{(isFormOpen || editingItem) && (
					<div
						className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
						onClick={handleFormClose}
					>
						<div
							className="relative w-full max-w-4xl mt-8 md:mt-0 animate-in fade-in zoom-in duration-300 bg-white rounded-xl shadow-2xl p-6"
							onClick={(e) => e.stopPropagation()}
						>
							<button
								onClick={handleFormClose}
								className="absolute top-4 right-4 z-10 p-2 text-muted-foreground hover:bg-muted/30 rounded-full transition-colors"
							>
								<X size={20} />
							</button>
							<AccessProfileForm
								initialData={editingItem ?? undefined}
								companyId={getActiveCompanyId() || ''}
								sites={sites}
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
						<Can on="perfis" perform="create">
							<Button onClick={() => setIsFormOpen(true)}>
								<Plus className="w-4 h-4 mr-2" />
								Criar Primeiro Perfil
							</Button>
						</Can>
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
										onChange={(e) => setScopeFilter(e.target.value)}
										className="h-10 px-3 py-2 rounded-[5px] border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
									>
										<option value="">Todos</option>
										<option value="ALL">Todas as Obras</option>
										<option value="SELECTED">Obras Selecionadas</option>
									</select>
								</div>
							</FilterPanel>
						</div>

						<div className="flex flex-col gap-6">
							<DataTable
								data={currentData}
								columns={[
									{ 
										header: 'Nome do Perfil', 
										accessorKey: 'name',
										cell: (item) => (
											<div className="flex items-center gap-3">
												<div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
													<ShieldCheck className="w-4 h-4 text-primary" />
												</div>
												<span className="font-medium text-gray-900">{item.name}</span>
											</div>
										)
									},
									{ 
										header: 'Escopo', 
										accessorKey: 'obra_scope',
										cell: (item) => (
											<span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${item.obra_scope === 'ALL' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
												{item.obra_scope === 'ALL' ? 'Total (Todas)' : 'Restrito (Selecionadas)'}
											</span>
										)
									},
									{
										header: 'Criado em',
										accessorKey: 'created_at',
										cell: (item) => item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '-'
									},								]}
								onEdit={handleEdit}
								onDelete={handleDelete}
								keyExtractor={(item) => item.id}
							/>
							{totalPages > 1 && (
								<Pagination
									currentPage={currentPage}
									totalPages={totalPages}
									onPageChange={setCurrentPage}
								/>
							)}
						</div>
					</div>
				)}

				<div className="flex items-center justify-end gap-3 w-full mt-4">
					{perfis.length > 0 && (
						<Button
							variant="outline"
							onClick={handleExport}
							className="flex items-center gap-2 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 rounded-[5px] shadow-sm"
						>
							<Download className="h-4 w-4" />
							<span>Exportar</span>
						</Button>
					)}
				</div>
			</div>
		</ProtectedRoute>
	);
}
