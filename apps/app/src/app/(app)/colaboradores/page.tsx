'use client';

import { importCollaboratorsAdmin } from '@/app/actions/adminActions';
import { DataTable, DetailRow } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { FilterPanel } from '@/components/shared/FilterPanel';
import { ImportModal } from '@/components/shared/ImportModal';
import { PageHeader } from '@/components/shared/PageHeader';
import { Pagination } from '@/components/shared/Pagination';
import { TableSearch } from '@/components/shared/TableSearch';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/shared/Can';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { CollaboratorForm } from '@/features/colaboradores/components/CollaboratorForm';
import { useCollaborators } from '@/features/colaboradores/hooks/useCollaborators';
import { getActiveCompanyId } from '@/lib/utils';
import { maskCpfDisplay } from '@/lib/maskUtils';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { exportToCsv } from '@/lib/exportUtils';
import { useConfirm } from '@/components/shared/ConfirmDialog';
import { Download, Upload, Users, X } from 'lucide-react';
import { TablePageSkeleton } from '@/components/shared/TablePageSkeleton';
import { useEffect, useState } from 'react';

export default function ColaboradoresPage() {
	const [colaboradores, setColaboradores] = useState<any[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<any>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [showFilters, setShowFilters] = useState(false);
	const [isImportModalOpen, setIsImportModalOpen] = useState(false);

	// Filtros específicos
	const [roleFilter, setRoleFilter] = useState('');

	const { fetchCollaborators, deleteCollaborator, isLoading } =
		useCollaborators();
	const confirm = useConfirm();
	const itemsPerPage = 10;

	const loadColaboradores = async () => {
		const data = await fetchCollaborators();
		setColaboradores(data);
	};

	useEffect(() => {
		loadColaboradores();
	}, []);

	const handleSearchChange = (val: string) => {
		setSearchTerm(val);
		setCurrentPage(1);
	};

	const filteredColaboradores = colaboradores.filter((colab) => {
		const searchLower = searchTerm.toLowerCase();
		const dateStr = colab.created_at
			? new Date(colab.created_at).toLocaleDateString('pt-BR')
			: '';

		const matchesSearch = !searchTerm ||
			colab.name?.toLowerCase().includes(searchLower) ||
			colab.email?.toLowerCase().includes(searchLower) ||
			colab.role?.toLowerCase().includes(searchLower) ||
			dateStr.includes(searchLower);

		const matchesRole = roleFilter
			? colab.role?.toLowerCase() === roleFilter.toLowerCase()
			: true;

		return matchesSearch && matchesRole;
	});

	const availableRoles = Array.from(
		new Set(colaboradores.map((c) => c.role).filter(Boolean)),
	);

	const totalPages = Math.ceil(filteredColaboradores.length / itemsPerPage);
	const currentData = filteredColaboradores.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	const handleEdit = (item: any) => {
		setEditingItem(item);
		setIsFormOpen(true);
	};

	const handleDelete = async (item: any) => {
		const ok = await confirm({
			title: 'Excluir colaborador',
			description: `Deseja realmente excluir o colaborador ${item.name}?`,
			confirmLabel: 'Excluir',
			variant: 'destructive',
		});
		if (ok) {
			await deleteCollaborator(item.id);
			loadColaboradores();
		}
	};

	const handleExport = () => {
		exportToCsv(
			filteredColaboradores.map((c) => ({
				nome: c.name,
				email: c.email ?? '',
				cargo: c.role ?? '',
			})),
			[
				{ key: 'nome', label: 'Nome' },
				{ key: 'email', label: 'E-mail' },
				{ key: 'cargo', label: 'Cargo' },
			],
			'colaboradores',
		);
	};

	const handleFormClose = () => {
		setIsFormOpen(false);
		setEditingItem(null);
		loadColaboradores();
	};

	return (
		<ProtectedRoute resource="colaboradores">
			<div className="w-full flex flex-col gap-6 relative">
				<Can 
					on="colaboradores" 
					perform="create"
					fallback={
						<PageHeader
							title="Colaboradores"
							description="Gestão de equipes, jornada e permissões."
						/>
					}
				>
					<PageHeader
						title="Colaboradores"
						description="Gestão de equipes, jornada e permissões."
						onAdd={() => setIsFormOpen(true)}
						addLabel="Cadastrar Colaborador"
					/>
				</Can>

				{(isFormOpen || editingItem) && (
					<div
						className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
						onClick={handleFormClose}
					>
						<div
							className="relative w-full max-w-3xl mt-8 md:mt-0 animate-in fade-in zoom-in duration-300"
							onClick={(e) => e.stopPropagation()}
						>
							<CollaboratorForm
								initialData={editingItem}
								onCancel={handleFormClose}
							/>
						</div>
					</div>
				)}

				{isLoading && colaboradores.length === 0 ? (
					<TablePageSkeleton rows={8} columns={3} />
				) : colaboradores.length === 0 ? (
					<EmptyState
						title="Equipe Vazia"
						description="Você ainda não adicionou colaboradores. A tela aguarda o início do fluxo de RH."
						icon={<Users className="w-8 h-8 text-gray-400" />}
					/>
				) : (
					<div className="space-y-4">
						<div className="space-y-4">
							<TableSearch
								value={searchTerm}
								onChange={handleSearchChange}
								placeholder="Buscar colaboradores por nome, email ou cargo..."
								onFilterClick={() => setShowFilters(!showFilters)}
							/>

							<FilterPanel
								isOpen={showFilters}
								onClose={() => setShowFilters(false)}
								onClear={() => {
									setRoleFilter('');
								}}
							>
								<div className="flex flex-col gap-1.5">
									<label className="text-sm font-medium text-gray-700">
										Cargo / Função
									</label>
									<SearchableSelect
										options={availableRoles.map((role) => ({
											value: String(role),
											label: String(role),
										}))}
										value={roleFilter}
										onChange={setRoleFilter}
										placeholder="Todos os cargos"
										className="rounded-[5px] h-10 border-gray-300 bg-white shadow-sm border"
									/>
								</div>
							</FilterPanel>
						</div>

						<div className="flex flex-col gap-6">
							<DataTable
								data={currentData}
								columns={[
									{ 
										header: 'Nome', 
										accessorKey: 'name',
										cell: (item) => (
											<div className="flex flex-col">
												<span className="font-medium text-gray-900">{item.name}</span>
												<span className="text-xs text-gray-500">{item.email || 'Sem e-mail'}</span>
											</div>
										)
									},
									{ header: 'Cargo/Função', accessorKey: 'role_title' },
									{
										header: 'CPF',
										cell: (item) => (
											<span className="font-mono text-gray-500">
												{maskCpfDisplay(item.cpf)}
											</span>
										),
									},
									{ 
										header: 'Admissão', 
										cell: (colab) => colab.created_at
											? new Date(colab.created_at).toLocaleDateString('pt-BR')
											: 'N/A'
									},
								]}
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
					<Can on="colaboradores" perform="create">
						<Button
							variant="outline"
							onClick={() => setIsImportModalOpen(true)}
							className="flex items-center gap-2 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 rounded-[5px] shadow-sm"
						>
							<Upload className="h-4 w-4" />
							<span>Importar</span>
						</Button>
					</Can>

					{colaboradores.length > 0 && (
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

				<ImportModal
					isOpen={isImportModalOpen}
					onClose={() => setIsImportModalOpen(false)}
					onImportLines={async (lines) => {
						const companyId = await getActiveCompanyId();
						// Adaptar as linhas do TXT (separadas por ;) para o formato esperado por importCollaboratorsAdmin
						const data = lines.map(line => {
							const [name, email, role, cpf] = line.split(';');
							return { company_id: companyId, name: name?.trim(), email: email?.trim(), role: role?.trim(), cpf: cpf?.trim() };
						});
						await importCollaboratorsAdmin(data);
						loadColaboradores();
					}}
					title="Importar Colaboradores"
					description="Selecione um arquivo TXT com dados separados por ponto e vírgula."
				/>
			</div>
		</ProtectedRoute>
	);
}
