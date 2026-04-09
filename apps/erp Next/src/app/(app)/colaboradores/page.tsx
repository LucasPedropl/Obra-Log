'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { Users, Upload, Download, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CollaboratorForm } from '@/features/colaboradores/components/CollaboratorForm';
import { useCollaborators } from '@/features/colaboradores/hooks/useCollaborators';
import { TableSearch } from '@/components/shared/TableSearch';
import { DataTable } from '@/components/shared/DataTable';

export default function ColaboradoresPage() {
	const [colaboradores, setColaboradores] = useState<any[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const { fetchCollaborators, isLoading } = useCollaborators();
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

		return (
			colab.name?.toLowerCase().includes(searchLower) ||
			colab.email?.toLowerCase().includes(searchLower) ||
			colab.role_title?.toLowerCase().includes(searchLower) ||
			dateStr.includes(searchLower)
		);
	});

	const totalPages = Math.max(
		1,
		Math.ceil(filteredColaboradores.length / itemsPerPage),
	);

	const handleFormClose = () => {
		setIsFormOpen(false);
		loadColaboradores();
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

			{isFormOpen && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
					onClick={() => setIsFormOpen(false)}
				>
					<div
						className="relative w-full max-w-2xl mt-8 md:mt-0 animate-in fade-in zoom-in duration-300"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							onClick={() => setIsFormOpen(false)}
							className="absolute top-4 right-4 z-10 p-2 text-muted-foreground hover:bg-muted/30 rounded-full transition-colors"
						>
							<X size={20} />
						</button>
						<CollaboratorForm onCancel={handleFormClose} />
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
					{/* Barra de Pesquisa e Filtros */}
					<TableSearch
						value={searchTerm}
						onChange={handleSearchChange}
						placeholder="Buscar colaboradores por nome, email ou cargo..."
						onFilterClick={() =>
							console.log('Abrir filtros de colaboradores')
						}
					/>

					<div className="bg-white rounded-xl shadow-sm">
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
							onEdit={(item) => console.log('Editar', item)}
							onDelete={(item) => {
								console.log('Excluir unitário:', item);
								setColaboradores((prev) =>
									prev.filter((c) => c.id !== item.id),
								);
							}}
							onDeleteBulk={(items) => {
								console.log('Excluir massa:', items);
								const idsToRemove = items.map((i) => i.id);
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
					onClick={() => console.log('Importar colaboradores')}
					className="flex items-center gap-2 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 rounded-[5px] shadow-sm"
				>
					<Upload className="h-4 w-4" />
					<span>Importar</span>
				</Button>

				{colaboradores.length > 0 && (
					<Button
						variant="outline"
						onClick={() => console.log('Exportar colaboradores')}
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
