'use client';

import { importCatalogsAdmin } from '@/app/actions/adminActions';
import { DataTable } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { FilterPanel } from '@/components/shared/FilterPanel';
import { ImportModal } from '@/components/shared/ImportModal';
import { PageHeader } from '@/components/shared/PageHeader';
import { Pagination } from '@/components/shared/Pagination';
import { TableSearch } from '@/components/shared/TableSearch';
import { Button } from '@/components/ui/button';
import { SupplyItemForm } from '@/features/insumos/components/SupplyItemForm';
import { useSupplyItems } from '@/features/insumos/hooks/useSupplyItems';
import { getActiveCompanyId } from '@/lib/utils';
import { Download, Loader2, PackageOpen, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function InsumosPage() {
	const [insumos, setInsumos] = useState<any[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<any>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [isImportModalOpen, setIsImportModalOpen] = useState(false);
	const [showFilters, setShowFilters] = useState(false);

	// Filtros especÃ­ficos
	const [unitFilter, setUnitFilter] = useState('');
	const [stockControlFilter, setStockControlFilter] = useState('');

	const { fetchSupplyItems, deleteSupplyItem, isLoading } = useSupplyItems();
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
		setCurrentPage(1); // resolver bug de paginaÃ§Ã£o
	};

	const filteredInsumos = insumos.filter((item) => {
		const searchLower = searchTerm.toLowerCase();
		const matchesSearch = !searchTerm
			? true
			: item.name?.toLowerCase().includes(searchLower) ||
				item.measurement_units?.abbreviation
					?.toLowerCase()
					.includes(searchLower) ||
				String(item.current_stock || 0).includes(searchLower) ||
				String(item.min_threshold || 0).includes(searchLower);

		const matchesUnit = unitFilter
			? item.measurement_units?.abbreviation?.toLowerCase() ===
				unitFilter.toLowerCase()
			: true;

		const matchesStockGroup = stockControlFilter
			? stockControlFilter === 'yes'
				? item.is_stock_controlled === true
				: item.is_stock_controlled === false
			: true;

		return matchesSearch && matchesUnit && matchesStockGroup;
	});

	// Get unique units for the filter dropdown
	const availableUnits = Array.from(
		new Set(
			insumos
				.map((i) => i.measurement_units?.abbreviation)
				.filter(Boolean),
		),
	);

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

	const handleImport = async (lines: string[]) => {
		const result: any[] = [];
		const companyId = getActiveCompanyId();

		if (!companyId) {
			console.error('Nenhuma empresa ativa encontrada.');
			return;
		}

		for (const line of lines) {
			const parts = line.split(';');
			if (parts.length >= 1) {
				const [name, unitStr, threshold, isToolStr] = parts;
				if (!name?.trim()) continue;

				const minThreshold = parseFloat(threshold || '0');
				const isTool = isToolStr?.trim()?.toUpperCase() === 'S';

				result.push({
					name: name.trim(),
					company_id: companyId,
					min_threshold: isNaN(minThreshold) ? 0 : minThreshold,
					is_tool: isTool,
				});
			}
		}

		if (result.length > 0) {
			try {
				await importCatalogsAdmin(result);
				loadInsumos();
			} catch (error) {
				console.error('Erro ao importar insumos:', error);
			}
		}
	};

	return (
		<div className="w-full flex flex-col gap-6 relative">
			<PageHeader
				title="Insumos"
				description="Gerenciamento de materiais, estoque e requisiÃ§Ãµes."
				onAdd={() => setIsFormOpen(true)}
				addLabel="Cadastrar Insumo"
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
						className="relative w-full max-w-lg mt-8 md:mt-0 animate-in fade-in zoom-in duration-300"
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
						<SupplyItemForm
							onCancel={() => {
								setIsFormOpen(false);
								setEditingItem(null);
								loadInsumos();
							}}
							initialData={editingItem}
						/>
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
					description="Este mÃ³dulo de almoxarifado global serÃ¡ construÃ­do e habitado pelos prÃ³ximos cadastros e deploys."
					icon={<PackageOpen className="w-8 h-8 text-gray-400" />}
				/>
			) : (
				<div className="flex flex-col gap-4">
					<TableSearch
						value={searchTerm}
						onChange={handleSearchChange}
						placeholder="Pesquisar insumos por descriÃ§Ã£o ou unidade..."
						onFilterClick={() => setShowFilters(!showFilters)}
						className="w-full"
					/>

					<FilterPanel
						isOpen={showFilters}
						onClose={() => setShowFilters(false)}
						onClear={() => {
							setUnitFilter('');
							setStockControlFilter('');
						}}
					>
						<div className="flex flex-col gap-1.5">
							<label className="text-sm font-medium text-gray-700">
								Unidade de Medida
							</label>
							<select
								value={unitFilter}
								onChange={(e) => setUnitFilter(e.target.value)}
								className="h-10 px-3 py-2 rounded-[5px] border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
							>
								<option value="">Todas as unidades</option>
								{availableUnits.map((unit) => (
									<option
										key={String(unit)}
										value={String(unit)}
									>
										{String(unit)}
									</option>
								))}
							</select>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-sm font-medium text-gray-700">
								Controle de Estoque
							</label>
							<select
								value={stockControlFilter}
								onChange={(e) =>
									setStockControlFilter(e.target.value)
								}
								className="h-10 px-3 py-2 rounded-[5px] border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
							>
								<option value="">Todos</option>
								<option value="yes">
									Controla Estoque = Sim
								</option>
								<option value="no">
									Controla Estoque = NÃ£o
								</option>
							</select>
						</div>
					</FilterPanel>

					<div className="bg-white rounded-xl shadow-sm">
						<DataTable
							data={currentInsumos}
							columns={[
								{ header: 'DescriÃ§Ã£o', accessorKey: 'name' },
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
									header: 'Estoque MÃ­nimo',
									cell: (item) => item.min_threshold || 0,
								},
							]}
							keyExtractor={(item) => item.id}
							onEdit={(item) => setEditingItem(item)}
							onDelete={async (item) => {
								await deleteSupplyItem(item.id);
								setInsumos((prev) =>
									prev.filter((i) => i.id !== item.id),
								);
							}}
							onDeleteBulk={async (items) => {
								const idsToRemove = items.map((i) => i.id);
								for (const id of idsToRemove) {
									await deleteSupplyItem(id);
								}
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
					onClick={() => setIsImportModalOpen(true)}
					className="flex items-center gap-2 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 rounded-[5px] shadow-sm"
				>
					<Upload className="h-4 w-4" />
					<span>Importar</span>
				</Button>

				{insumos.length > 0 && (
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
				title="Importar Insumos"
				description="FaÃ§a o upload do seu arquivo .txt com os insumos (formato: Nome;Unidade;EstoqueMinimo;É_Ferramenta(S/N))"
				onImportLines={handleImport}
			/>
		</div>
	);
}
