'use client';

import { importCatalogsAdmin } from '@/app/actions/adminActions';
import { DataTable, DetailRow } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { FilterPanel } from '@/components/shared/FilterPanel';
import { ImportModal } from '@/components/shared/ImportModal';
import { PageHeader } from '@/components/shared/PageHeader';
import { Pagination } from '@/components/shared/Pagination';
import { TableSearch } from '@/components/shared/TableSearch';
import { Button } from '@/components/ui/button';
import { SupplyItemForm } from '@/features/insumos/components/SupplyItemForm';
import { useSupplyItems } from '@/features/insumos/hooks/useSupplyItems';
import { getActiveCompanyId, getParentCompanyId } from '@/lib/utils';
import { SearchableSelect } from '@/components/ui/searchable-select';
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

	// Filtros específicos
	const [unitFilter, setUnitFilter] = useState('');
	const [categoryFilter, setCategoryFilter] = useState('');
	const [subcategoryFilter, setSubcategoryFilter] = useState('');
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
		setCurrentPage(1); // resolver bug de paginação
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

		const matchesCategory = categoryFilter
			? item.categories?.primary_category?.toLowerCase() ===
				categoryFilter.toLowerCase()
			: true;

		const matchesSubcategory = subcategoryFilter
			? item.categories?.secondary_category?.toLowerCase() ===
				subcategoryFilter.toLowerCase()
			: true;

		const matchesStockGroup = stockControlFilter
			? stockControlFilter === 'yes'
				? item.is_stock_controlled === true
				: item.is_stock_controlled === false
			: true;

		return matchesSearch && matchesUnit && matchesCategory && matchesSubcategory && matchesStockGroup;
	});

	// Get unique values for filters
	const availableCategories = Array.from(
		new Set(
			insumos
				.map((i) => i.categories?.primary_category)
				.filter(Boolean),
		),
	).sort();

	const availableSubcategories = Array.from(
		new Set(
			insumos
				.map((i) => i.categories?.secondary_category)
				.filter(Boolean),
		),
	).sort();

	const availableUnits = Array.from(
		new Map(
			insumos
				.filter((i) => i.measurement_units)
				.map((i) => [i.measurement_units.abbreviation, i.measurement_units])
		).values()
	).sort((a, b) => a.name.localeCompare(b.name));

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
		const companyId = getParentCompanyId();

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
				description="Gerenciamento de materiais, estoque e requisições."
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
					title="Nenhum Insumo Cadastrado"
					description="Este módulo de almoxarifado global será construído e habitado pelos próximos cadastros e deploys."
					icon={<PackageOpen className="w-8 h-8 text-gray-400" />}
				/>
			) : (
				<div className="flex flex-col gap-4">
					<TableSearch
						value={searchTerm}
						onChange={handleSearchChange}
						placeholder="Pesquisar insumos por descrição ou unidade..."
						onFilterClick={() => setShowFilters(!showFilters)}
						className="w-full"
					/>

					<FilterPanel
						isOpen={showFilters}
						onClose={() => setShowFilters(false)}
						onClear={() => {
							setUnitFilter('');
							setCategoryFilter('');
							setSubcategoryFilter('');
							setStockControlFilter('');
						}}
					>
						<div className="flex flex-col gap-1.5">
							<label className="text-sm font-medium text-gray-700">
								Categoria Principal
							</label>
							<SearchableSelect
								options={availableCategories.map((cat) => ({
									value: String(cat),
									label: String(cat),
								}))}
								value={categoryFilter}
								onChange={setCategoryFilter}
								placeholder="Filtrar por categoria..."
								className="rounded-[5px] h-10 border-gray-300 bg-white shadow-sm border"
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-sm font-medium text-gray-700">
								Subcategoria
							</label>
							<SearchableSelect
								options={availableSubcategories.map((sub) => ({
									value: String(sub),
									label: String(sub),
								}))}
								value={subcategoryFilter}
								onChange={setSubcategoryFilter}
								placeholder="Filtrar por subcategoria..."
								className="rounded-[5px] h-10 border-gray-300 bg-white shadow-sm border"
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-sm font-medium text-gray-700">
								Unidade de Medida
							</label>
							<SearchableSelect
								options={availableUnits.map((u) => ({
									value: u.abbreviation,
									label: `${u.name} (${u.abbreviation})`,
								}))}
								value={unitFilter}
								onChange={setUnitFilter}
								placeholder="Filtrar por unidade..."
								className="rounded-[5px] h-10 border-gray-300 bg-white shadow-sm border"
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-sm font-medium text-gray-700">
								Controle de Estoque
							</label>
							<SearchableSelect
								options={[
									{ value: 'yes', label: 'Sim' },
									{ value: 'no', label: 'Não' },
								]}
								value={stockControlFilter}
								onChange={setStockControlFilter}
								placeholder="Todos"
								className="rounded-[5px] h-10 border-gray-300 bg-white shadow-sm border"
							/>
						</div>
					</FilterPanel>

					<div className="bg-white rounded-xl shadow-sm">
						<DataTable
							data={currentInsumos}
							columns={[
								{ header: 'Nome', accessorKey: 'name' },
								{
									header: 'Categoria',
									cell: (item) => (
										<div className="flex flex-col">
											<span className="font-medium text-gray-900">
												{item.categories
													?.primary_category || '-'}
											</span>
											{item.categories
												?.secondary_category && (
												<span className="text-[10px] text-gray-500 uppercase tracking-wider">
													{
														item.categories
															.secondary_category
													}
												</span>
											)}
										</div>
									),
								},
								{
									header: 'Unidade',
									cell: (item) =>
										item.measurement_units?.abbreviation ||
										'-',
								},
								{
									header: 'Estoque Mínimo',
									cell: (item) => item.min_threshold || 0,
								},
							]}
							detailsTitle="Detalhes do Insumo"
							renderDetails={(item) => (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<DetailRow label="Nome" value={item.name} className="sm:col-span-2" />
									<DetailRow label="Categoria Primária" value={item.categories?.primary_category || '-'} />
									<DetailRow label="Categoria Secundária" value={item.categories?.secondary_category || '-'} />
									<DetailRow label="Unidade de Medida" value={item.measurement_units?.name ? `${item.measurement_units.name} (${item.measurement_units.abbreviation})` : '-'} />
									<DetailRow label="Estoque Mínimo" value={item.min_threshold || 0} />
									<DetailRow label="Controla Estoque" value={item.is_stock_controlled ? 'Sim' : 'Não'} />
								</div>
							)}
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
				description="Faça o upload do seu arquivo .txt com os insumos (formato: Nome;Unidade;EstoqueMinimo;É Ferramenta(S/N))"
				onImportLines={handleImport}
			/>
		</div>
	);
}
