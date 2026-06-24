'use client';

import { importCatalogsAdmin } from '@/app/actions/adminActions';
import { Can } from '@/components/shared/Can';
import { DataTable } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { FilterPanel } from '@/components/shared/FilterPanel';
import { ImportModal } from '@/components/shared/ImportModal';
import { PageHeader } from '@/components/shared/PageHeader';
import { Pagination } from '@/components/shared/Pagination';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { TableSearch } from '@/components/shared/TableSearch';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { SupplyItemForm } from '@/features/insumos/components/SupplyItemForm';
import { useSupplyItems } from '@/features/insumos/hooks/useSupplyItems';
import { getActiveCompanyId } from '@/lib/utils';
import { exportToCsv } from '@/lib/exportUtils';
import { useConfirm } from '@/components/shared/ConfirmDialog';
import { Download, PackageOpen, Upload, X } from 'lucide-react';
import { TablePageSkeleton } from '@/components/shared/TablePageSkeleton';
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
	const confirm = useConfirm();
	const itemsPerPage = 10;

	const loadInsumos = async () => {
		const data = await fetchSupplyItems();
		setInsumos(Array.isArray(data) ? data : []);
	};

	useEffect(() => {
		loadInsumos();
	}, []);

	const handleSearchChange = (val: string) => {
		setSearchTerm(val);
		setCurrentPage(1);
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

		return (
			matchesSearch &&
			matchesUnit &&
			matchesCategory &&
			matchesSubcategory &&
			matchesStockGroup
		);
	});

	const availableCategories = Array.from(
		new Set(
			insumos.map((i) => i.categories?.primary_category).filter(Boolean),
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
				.map((i) => [
					i.measurement_units.abbreviation,
					i.measurement_units,
				]),
		).values(),
	).sort((a: any, b: any) => a.name.localeCompare(b.name));

	const totalPages = Math.ceil(filteredInsumos.length / itemsPerPage);
	const currentData = filteredInsumos.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	const handleEdit = (item: any) => {
		setEditingItem(item);
		setIsFormOpen(true);
	};

	const handleDelete = async (item: any) => {
		const ok = await confirm({
			title: 'Excluir insumo',
			description: `Deseja realmente excluir o insumo ${item.name}?`,
			confirmLabel: 'Excluir',
			variant: 'destructive',
		});
		if (ok) {
			await deleteSupplyItem(item.id);
			loadInsumos();
		}
	};

	const handleExport = () => {
		exportToCsv(
			filteredInsumos.map((item) => ({
				nome: item.name,
				unidade: item.measurement_units?.abbreviation ?? '',
				categoria: item.categories?.primary_category ?? '',
				estoque_minimo: item.min_threshold ?? 0,
			})),
			[
				{ key: 'nome', label: 'Nome' },
				{ key: 'unidade', label: 'Unidade' },
				{ key: 'categoria', label: 'Categoria' },
				{ key: 'estoque_minimo', label: 'Estoque Mínimo' },
			],
			'insumos',
		);
	};

	const handleFormClose = () => {
		setIsFormOpen(false);
		setEditingItem(null);
		loadInsumos();
	};

	return (
		<ProtectedRoute resource="insumos">
			<div className="w-full flex flex-col gap-6 relative">
				<Can
					on="insumos"
					perform="create"
					fallback={
						<PageHeader
							title="Insumos"
							description="Gerenciamento de materiais, estoque e requisições."
						/>
					}
				>
					<PageHeader
						title="Insumos"
						description="Gerenciamento de materiais, estoque e requisições."
						onAdd={() => setIsFormOpen(true)}
						addLabel="Cadastrar Insumo"
					/>
				</Can>

				{(isFormOpen || editingItem) && (
					<div
						className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
						onClick={handleFormClose}
					>
						<div
							className="relative w-full max-w-lg mt-8 md:mt-0 animate-in fade-in zoom-in duration-300 bg-white rounded-xl shadow-2xl p-6"
							onClick={(e) => e.stopPropagation()}
						>
							<button
								onClick={handleFormClose}
								className="absolute top-4 right-4 z-10 p-2 text-muted-foreground hover:bg-muted/30 rounded-full transition-colors"
							>
								<X size={20} />
							</button>
							<SupplyItemForm
								initialData={editingItem}
								onCancel={handleFormClose}
							/>
						</div>
					</div>
				)}

				{isLoading && insumos.length === 0 ? (
					<TablePageSkeleton rows={8} columns={4} />
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
									options={availableSubcategories.map(
										(sub) => ({
											value: String(sub),
											label: String(sub),
										}),
									)}
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
									options={availableUnits.map((u: any) => ({
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

						<div className="flex flex-col gap-6">
							<DataTable
								data={currentData}
								columns={[
									{ header: 'Nome', accessorKey: 'name' },
									{
										header: 'Categoria',
										cell: (item) => (
											<div className="flex flex-col">
												<span className="font-medium text-gray-900">
													{item.categories
														?.primary_category ||
														'-'}
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
											item.measurement_units
												?.abbreviation || '-',
									},
									{
										header: 'Estoque Mínimo',
										cell: (item) => item.min_threshold || 0,
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
					<Can on="insumos" perform="create">
						<Button
							variant="outline"
							onClick={() => setIsImportModalOpen(true)}
							className="flex items-center gap-2 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 rounded-[5px] shadow-sm"
						>
							<Upload className="h-4 w-4" />
							<span>Importar</span>
						</Button>
					</Can>

					{insumos.length > 0 && (
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
						const companyId = getActiveCompanyId();
						if (!companyId) {
							throw new Error('Nenhuma empresa selecionada.');
						}

						const data = lines.map((line) => {
							const [name, unitAbbreviation, minThreshold] =
								line.split(';');
							return {
								company_id: companyId,
								name: name?.trim() ?? '',
								unit_abbreviation: unitAbbreviation?.trim(),
								min_threshold: Number(minThreshold) || 0,
							};
						});

						await importCatalogsAdmin(data);
						loadInsumos();
					}}
					title="Importar Insumos"
					description="Selecione um arquivo TXT com dados separados por ponto e vírgula."
				/>
			</div>
		</ProtectedRoute>
	);
}
