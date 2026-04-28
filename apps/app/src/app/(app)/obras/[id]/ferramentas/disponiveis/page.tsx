'use client';

import { use, useState } from 'react';
import { useTools, ToolItem } from '@/features/ferramentas/hooks/useTools';
import { LoanToolForm } from '@/features/ferramentas/components/LoanToolForm';
import { AddToolForm } from '@/features/ferramentas/components/AddToolForm';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, ColumnDef, DetailRow } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSearch } from '@/components/shared/TableSearch';
import { Pagination } from '@/components/shared/Pagination';
import { Button } from '@/components/ui/button';
import { Grid2x2, List, Wrench, LogOut, Loader2 } from 'lucide-react';

interface FerramentasDisponiveisPageProps {
	params: Promise<{ id: string }>;
}

function getAvailabilityStatus(
	available: number,
	total: number,
): 'full' | 'partial' | 'empty' {
	if (available === 0) return 'empty';
	if (available === total) return 'full';
	return 'partial';
}

function AvailabilityBadge({
	available,
	total,
}: {
	available: number;
	total: number;
}) {
	const status = getAvailabilityStatus(available, total);
	const colors = {
		full: 'bg-green-100 text-green-800 border-green-300',
		partial: 'bg-yellow-100 text-yellow-800 border-yellow-300',
		empty: 'bg-red-100 text-red-800 border-red-300',
	};

	return (
		<span
			className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colors[status]}`}
		>
			{available}/{total}
		</span>
	);
}

export default function FerramentasDisponiveisPage({
	params,
}: FerramentasDisponiveisPageProps) {
	const resolvedParams = use(params);
	const siteId = resolvedParams.id;

	const { tools, isLoading, error, refetch } = useTools(siteId);

	const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
	const [searchTerm, setSearchTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(1);

	const [isAddFormOpen, setIsAddFormOpen] = useState(false);
	const [isLoanFormOpen, setIsLoanFormOpen] = useState(false);
	const [selectedTool, setSelectedTool] = useState<ToolItem | null>(null);

	const [showFilters, setShowFilters] = useState(false);
	const [filterCategory, setFilterCategory] = useState('');
	const [filterAvailability, setFilterAvailability] = useState('');

	const itemsPerPage = 8; // Adjust based on grid layout nicely

	const filteredTools = tools.filter((tool) => {
		const search = searchTerm.toLowerCase();
		const matchesSearch =
			tool.name.toLowerCase().includes(search) ||
			tool.code.toLowerCase().includes(search) ||
			tool.category.toLowerCase().includes(search);

		const matchesCategory =
			filterCategory === '' ||
			tool.category.toLowerCase().includes(filterCategory.toLowerCase());

		let matchesAvailability = true;
		if (filterAvailability === 'available') {
			matchesAvailability = tool.availableQuantity > 0;
		} else if (filterAvailability === 'unavailable') {
			matchesAvailability = tool.availableQuantity === 0;
		}

		return matchesSearch && matchesCategory && matchesAvailability;
	});

	const totalPages = Math.max(
		1,
		Math.ceil(filteredTools.length / itemsPerPage),
	);
	const currentTools = filteredTools.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	const handleBorrowClick = (tool: ToolItem) => {
		setSelectedTool(tool);
		setIsLoanFormOpen(true);
	};

	const columns: ColumnDef<ToolItem>[] = [
		{
			header: 'Ferramenta',
			accessorKey: 'name',
			className: 'font-medium',
		},
		{
			header: 'Código',
			accessorKey: 'code',
		},
		{
			header: 'Categoria',
			accessorKey: 'category',
		},
		{
			header: 'Disponível',
			cell: (item) => (
				<AvailabilityBadge
					available={item.availableQuantity}
					total={item.totalQuantity}
				/>
			),
		},
		{
			header: '',
			cell: (item) => (
				<Button
					onClick={() => handleBorrowClick(item)}
					disabled={item.availableQuantity === 0}
					size="sm"
					className="flex items-center gap-2 h-8 px-3 rounded-[5px] bg-[#101828] hover:bg-[#1b263b] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-medium"
				>
					<LogOut className="w-3.5 h-3.5" />
					Emprestar
				</Button>
			),
		},
	];

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center p-12 gap-3 h-full">
				<Loader2 className="w-8 h-8 animate-spin text-[#101828]" />
				<p className="text-gray-500">Carregando ferramentas...</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 relative">
			<PageHeader
				title="Ferramentas Disponíveis"
				description="Gerencie as ferramentas disponíveis para empréstimo aos colaboradores."
				onAdd={() => setIsAddFormOpen(true)}
				addLabel="Cadastrar Ferramentas"
			/>

			{/* Modal Overlays */}
			{isAddFormOpen && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
					onClick={() => setIsAddFormOpen(false)}
				>
					<div onClick={(e) => e.stopPropagation()}>
						<AddToolForm
							siteId={siteId}
							onCancel={() => setIsAddFormOpen(false)}
							onSaved={() => {
								setIsAddFormOpen(false);
								refetch();
							}}
						/>
					</div>
				</div>
			)}

			{isLoanFormOpen && selectedTool && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
					onClick={() => setIsLoanFormOpen(false)}
				>
					<div onClick={(e) => e.stopPropagation()}>
						<LoanToolForm
							siteId={siteId}
							inventoryId={selectedTool.inventoryId}
							toolName={selectedTool.name}
							availableQuantity={selectedTool.availableQuantity}
							onCancel={() => setIsLoanFormOpen(false)}
							onSaved={() => {
								setIsLoanFormOpen(false);
								refetch();
							}}
						/>
					</div>
				</div>
			)}

			<div className="flex flex-col gap-5">
				{tools.length > 0 && (
					<div className="flex flex-col gap-4">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div className="flex-1 w-full">
								<TableSearch
									value={searchTerm}
									onChange={(v) => {
										setSearchTerm(v);
										setCurrentPage(1);
									}}
									onFilterClick={() =>
										setShowFilters(!showFilters)
									}
									placeholder="Pesquisar ferramentas..."
								/>
							</div>

							<div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm shrink-0">
								<button
									onClick={() => setViewMode('table')}
									className={`p-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${
										viewMode === 'table'
											? 'bg-gray-100 text-gray-900 border-2 border-gray-200'
											: 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
									}`}
								>
									<List className="w-4 h-4" />
									<span className="hidden sm:inline">
										Tabela
									</span>
								</button>
								<button
									onClick={() => setViewMode('cards')}
									className={`p-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${
										viewMode === 'cards'
											? 'bg-gray-100 text-gray-900 border-2 border-gray-200'
											: 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
									}`}
								>
									<Grid2x2 className="w-4 h-4" />
									<span className="hidden sm:inline">
										Cards
									</span>
								</button>
							</div>
						</div>

						{showFilters && (
							<div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm flex flex-col sm:flex-row gap-4">
								<div className="flex-1">
									<label className="text-sm font-medium text-gray-700 mb-1 block">
										Categoria
									</label>
									<input
										type="text"
										placeholder="Filtrar por categoria..."
										value={filterCategory}
										onChange={(e) => {
											setFilterCategory(e.target.value);
											setCurrentPage(1);
										}}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#101828]"
									/>
								</div>
								<div className="flex-1">
									<label className="text-sm font-medium text-gray-700 mb-1 block">
										Disponibilidade
									</label>
									<select
										value={filterAvailability}
										onChange={(e) => {
											setFilterAvailability(
												e.target.value,
											);
											setCurrentPage(1);
										}}
										className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#101828]"
									>
										<option value="">Todas</option>
										<option value="available">
											Disponíveis apenas
										</option>
										<option value="unavailable">
											Emprestadas apenas
										</option>
									</select>
								</div>
							</div>
						)}
					</div>
				)}

				{!isLoading && filteredTools.length === 0 ? (
					<EmptyState
						title={
							searchTerm
								? 'Nenhuma ferramenta encontrada'
								: 'Nenhuma ferramenta disponível'
						}
						description={
							searchTerm
								? 'Tente mudar os termos da pesquisa.'
								: 'Comece cadastrando ferramentas para poder emprestá-las aos colaboradores.'
						}
						icon={<Wrench className="w-8 h-8 text-gray-400" />}
					/>
				) : (
					<>
						{viewMode === 'table' ? (
							<DataTable
								data={currentTools}
								columns={columns}
								detailsTitle="Detalhes da Ferramenta"
								renderDetails={(item) => (
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<DetailRow label="Ferramenta" value={item.name} className="sm:col-span-2" />
										<DetailRow label="Código" value={item.code} />
										<DetailRow label="Categoria" value={item.category} />
										<DetailRow label="Disponível" value={`${item.availableQuantity} / ${item.totalQuantity}`} />
									</div>
								)}
								keyExtractor={(item) => item.id}
							/>
						) : (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
								{currentTools.map((tool) => {
									const isZero = tool.availableQuantity === 0;
									const isFull =
										tool.availableQuantity ===
										tool.totalQuantity;
									const borderColor = isZero
										? 'border-red-200'
										: isFull
											? 'border-green-200'
											: 'border-yellow-200';
									const bgContentColor = isZero
										? 'bg-red-50/50'
										: isFull
											? 'bg-green-50/50'
											: 'bg-yellow-50/50';

									return (
										<div
											key={tool.id}
											className={`flex flex-col bg-white rounded-xl border-2 ${borderColor} overflow-hidden shadow-sm hover:shadow-md transition-all`}
										>
											<div
												className={`p-4 flex-1 ${bgContentColor}`}
											>
												<div className="flex justify-between items-start mb-2 gap-3">
													<h3 className="font-semibold text-gray-900 line-clamp-2">
														{tool.name}
													</h3>
													<AvailabilityBadge
														available={
															tool.availableQuantity
														}
														total={
															tool.totalQuantity
														}
													/>
												</div>
												<p className="text-xs text-gray-500 mb-3">
													Cód: {tool.code}
												</p>
												<span className="inline-block px-2.5 py-1 bg-white border border-gray-200 rounded-[5px] text-xs font-medium text-gray-600">
													{tool.category}
												</span>
											</div>
											<div className="p-4 border-t border-gray-100 bg-white">
												<Button
													onClick={() =>
														handleBorrowClick(tool)
													}
													disabled={isZero}
													className="w-full flex items-center justify-center gap-2 h-10 rounded-[5px] bg-[#101828] hover:bg-[#1b263b] disabled:bg-gray-300 disabled:text-gray-500 text-white font-semibold transition-colors"
												>
													<LogOut className="w-4 h-4" />
													Emprestar
												</Button>
											</div>
										</div>
									);
								})}
							</div>
						)}

						<Pagination
							currentPage={currentPage}
							totalPages={totalPages}
							onPageChange={setCurrentPage}
							totalItems={filteredTools.length}
							itemsPerPage={itemsPerPage}
						/>
					</>
				)}
			</div>
		</div>
	);
}
