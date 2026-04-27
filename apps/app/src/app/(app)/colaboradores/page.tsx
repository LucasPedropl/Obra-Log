'use client';

import { importCollaboratorsAdmin } from '@/app/actions/adminActions';
import { DataTable } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { FilterPanel } from '@/components/shared/FilterPanel';
import { ImportModal } from '@/components/shared/ImportModal';
import { PageHeader } from '@/components/shared/PageHeader';
import { Pagination } from '@/components/shared/Pagination';
import { TableSearch } from '@/components/shared/TableSearch';
import { Button } from '@/components/ui/button';
import { CollaboratorForm } from '@/features/colaboradores/components/CollaboratorForm';
import { useCollaborators } from '@/features/colaboradores/hooks/useCollaborators';
import { getActiveCompanyId } from '@/lib/utils';
import { Download, Loader2, Upload, Users, X } from 'lucide-react';
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
		setCurrentPage(1); // resolve pagination issue
	};

	const filteredColaboradores = colaboradores.filter((colab) => {
		if (!searchTerm) return true;
		const searchLower = searchTerm.toLowerCase();
		const dateStr = colab.created_at
			? new Date(colab.created_at).toLocaleDateString('pt-BR')
			: '';

		const matchesSearch =
			colab.name?.toLowerCase().includes(searchLower) ||
			colab.email?.toLowerCase().includes(searchLower) ||
			colab.role_title?.toLowerCase().includes(searchLower) ||
			dateStr.includes(searchLower);

		const matchesRole = roleFilter
			? colab.role_title?.toLowerCase() === roleFilter.toLowerCase()
			: true;

		return matchesSearch && matchesRole;
	});

	// Get unique roles for the filter dropdown
	const availableRoles = Array.from(
		new Set(colaboradores.map((c) => c.role_title).filter(Boolean)),
	);

	const totalPages = Math.max(
		1,
		Math.ceil(filteredColaboradores.length / itemsPerPage),
	);

	const handleFormClose = () => {
		setIsFormOpen(false);
		loadColaboradores();
	};

	const handleImport = async (lines: string[]) => {
		const result: any[] = [];
		const companyId = getActiveCompanyId();
		if (!companyId) return;

		for (const line of lines) {
			const parts = line.split(';');
			if (parts.length >= 2) {
				const [name, role_title] = parts;
				result.push({
					name: name.trim(),
					role_title: role_title.trim(),
					company_id: companyId,
					status: 'ACTIVE',
				});
			}
		}

		if (result.length > 0) {
			try {
				await importCollaboratorsAdmin(result);
				loadColaboradores();
			} catch (error) {
				console.error('Erro ao importar colaboradores:', error);
			}
		}
	};
	const currentColabs = filteredColaboradores.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	return (
		<div className="w-full flex flex-col gap-6 relative">
			<PageHeader
				title="Colaboradores"
				description="Gestão de equipes, jornada e permissões."
				onAdd={() => setIsFormOpen(true)}
				addLabel="Cadastrar Colaborador"
			/>

			{(isFormOpen || editingItem) && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
					onClick={() => {
						setIsFormOpen(false);
						setEditingItem(null);
					}}
				>
					<div
						className="relative w-full max-w-2xl mt-8 md:mt-0 animate-in fade-in zoom-in duration-300"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							onClick={() => {
								setIsFormOpen(false);
								setEditingItem(null);
							}}
							className="absolute top-4 right-4 z-10 p-2 text-muted-foreground hover:bg-muted/30 rounded-full transition-colors"
						>
							<X size={20} />
						</button>
						<CollaboratorForm
							onCancel={() => {
								setIsFormOpen(false);
								setEditingItem(null);
								loadColaboradores();
							}}
							initialData={editingItem}
						/>
					</div>
				</div>
			)}

			{isLoading && colaboradores.length === 0 ? (
				<div className="flex justify-center p-12">
					<Loader2 className="w-8 h-8 animate-spin text-gray-400" />
				</div>
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
								<select
									value={roleFilter}
									onChange={(e) =>
										setRoleFilter(e.target.value)
									}
									className="h-10 px-3 py-2 rounded-[5px] border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
								>
									<option value="">Todos os cargos</option>
									{availableRoles.map((role) => (
										<option
											key={String(role)}
											value={String(role)}
										>
											{String(role)}
										</option>
									))}
								</select>
							</div>
						</FilterPanel>
					</div>

					<div className="">
						<DataTable
							data={currentColabs}
							columns={[
								{
									header: 'Nome',
									accessorKey: 'name',
									className: 'font-medium',
								},
								{
									header: 'Email',
									accessorKey: 'email',
									className:
										'break-all max-w-[200px] truncate',
								},
								{
									header: 'Cargo/Função',
									accessorKey: 'role_title',
								},
								{
									header: 'Admissão',
									cell: (colab) =>
										colab.created_at
											? new Date(
													colab.created_at,
												).toLocaleDateString('pt-BR')
											: 'N/A',
								},
							]}
							keyExtractor={(item) => item.id}
							onEdit={(item) => setEditingItem(item)}
							onDelete={async (item) => {
								await deleteCollaborator(item.id);
								setColaboradores((prev) =>
									prev.filter((c) => c.id !== item.id),
								);
							}}
							onDeleteBulk={async (items) => {
								const idsToRemove = items.map((i) => i.id);
								for (const id of idsToRemove) {
									await deleteCollaborator(id);
								}
								setColaboradores((prev) =>
									prev.filter(
										(c) => !idsToRemove.includes(c.id),
									),
								);
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

			{/* Botoes alinhados a direita sem borda arredondada na base */}
			<div className="flex items-center justify-end gap-3 w-full mt-4">
				<Button
					variant="outline"
					onClick={() => setIsImportModalOpen(true)}
					className="flex items-center gap-2 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 rounded-[5px] shadow-sm"
				>
					<Upload className="h-4 w-4" />
					<span>Importar</span>
				</Button>

				{colaboradores.length > 0 && (
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

			<ImportModal
				isOpen={isImportModalOpen}
				onClose={() => setIsImportModalOpen(false)}
				title="Importar Colaboradores"
				description="Faça o upload do seu arquivo .txt (formato: Nome;Cargo/Função)"
				onImportLines={handleImport}
			/>
		</div>
	);
}
