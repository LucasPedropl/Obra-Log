'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { PackageOpen, Upload, Download, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SupplyItemForm } from '@/features/insumos/components/SupplyItemForm';
import { useSupplyItems } from '@/features/insumos/hooks/useSupplyItems';
import { TableSearch } from '@/components/shared/TableSearch';
import { DataTable } from '@/components/shared/DataTable';

export default function InsumosPage() {
	const [insumos, setInsumos] = useState<any[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const { fetchSupplyItems, isLoading } = useSupplyItems();
	const itemsPerPage = 10;

	const loadInsumos = async () => {
		const data = await fetchSupplyItems();
		setInsumos(data);
	};

	useEffect(() => {
		loadInsumos();
	}, []);

	const handleSearchChange = (val: string) => {
		setSearchTerm(val);
		setCurrentPage(1); // resolver bug de paginação
	};

	const filteredInsumos = insumos.filter((item) => {
		if (!searchTerm) return true;
		const searchLower = searchTerm.toLowerCase();
		return (
			item.name?.toLowerCase().includes(searchLower) ||
			item.measurement_units?.abbreviation
				?.toLowerCase()
				.includes(searchLower) ||
			String(item.current_stock || 0).includes(searchLower) ||
			String(item.min_threshold || 0).includes(searchLower)
		);
	});

	const totalPages = Math.max(
		1,
		Math.ceil(filteredInsumos.length / itemsPerPage),
	);

	const handleFormClose = () => {
		setIsFormOpen(false);
		loadInsumos();
	};

	const currentInsumos = filteredInsumos.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	return (
		<div className="w-full flex flex-col gap-6 relative">
			<PageHeader
				title="Insumos"
				description="Gerenciamento de materiais, estoque e requisições."
				onAdd={() => setIsFormOpen(true)}
				addLabel="Cadastrar Insumo"
			/>

			{isFormOpen && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
					onClick={() => setIsFormOpen(false)}
				>
					<div
						className="relative w-full max-w-lg mt-8 md:mt-0 animate-in fade-in zoom-in duration-300"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							onClick={() => setIsFormOpen(false)}
							className="absolute top-4 right-4 z-10 p-2 text-muted-foreground hover:bg-muted/30 rounded-full transition-colors"
						>
							<X size={20} />
						</button>
						<SupplyItemForm onCancel={handleFormClose} />
					</div>
				</div>
			)}

			{isLoading && insumos.length === 0 ? (
				<div className="flex items-center justify-center p-12">
					<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
				</div>
			) : insumos.length === 0 ? (
				<EmptyState
					title="Nenhum Insumo Cadasrado"
					description="Este módulo de almoxarifado global será construído e habitado pelos próximos cadastros e deploys."
					icon={<PackageOpen className="w-8 h-8 text-gray-400" />}
				/>
			) : (
				<div className="flex flex-col gap-4">
					<TableSearch
						value={searchTerm}
						onChange={handleSearchChange}
						placeholder="Pesquisar insumos por descrição ou unidade..."
						onFilterClick={() =>
							console.log('Abrir filtros de insumos')
						}
						className="w-full"
					/>

					<div className="bg-white rounded-xl shadow-sm">
						<DataTable
							data={currentInsumos}
							columns={[
								{ header: 'Descrição', accessorKey: 'name' },
								{
									header: 'Unidade',
									cell: (item) =>
										item.measurement_units?.abbreviation ||
										'-',
								},
								{
									header: 'Estoque Atual',
									cell: (item) => item.current_stock || 0,
								},
								{
									header: 'Estoque Mínimo',
									cell: (item) => item.min_threshold || 0,
								},
							]}
							keyExtractor={(item) => item.id}
							onEdit={(item) => console.log('Editar', item)}
							onDelete={(item) => {
								setInsumos((prev) =>
									prev.filter((i) => i.id !== item.id),
								);
							}}
							onDeleteBulk={(items) => {
								const idsToRemove = items.map((i) => i.id);
								setInsumos((prev) =>
									prev.filter(
										(item) =>
											!idsToRemove.includes(item.id),
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
					onClick={() => console.log('Importar insumos')}
					className="flex items-center gap-2 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 rounded-[5px] shadow-sm"
				>
					<Upload className="h-4 w-4" />
					<span>Importar</span>
				</Button>

				{insumos.length > 0 && (
					<Button
						variant="outline"
						onClick={() => console.log('Exportar insumos')}
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
