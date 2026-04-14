'use client';

import { use, useState } from 'react';
import { useEPIs, EPIItem } from '@/features/epis/hooks/useEPIs';
import { GiveEPIForm } from '@/features/epis/components/GiveEPIForm';
import { AddEPIForm } from '@/features/epis/components/AddEPIForm';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, ColumnDef } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSearch } from '@/components/shared/TableSearch';
import { Pagination } from '@/components/shared/Pagination';
import { Button } from '@/components/ui/button';
import { Shield, Loader2, List, Grid2x2, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EPIsDisponiveisPageProps {
	params: Promise<{ id: string }>;
}

function EPIStatusBadge({
	available,
	minThreshold,
}: {
	available: number;
	minThreshold: number;
}) {
	if (available === 0) {
		return (
			<Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
				Esgotado
			</Badge>
		);
	}
	if (available <= minThreshold && minThreshold > 0) {
		return (
			<Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100">
				Atenção: {available} desc.
			</Badge>
		);
	}
	return (
		<Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 items-center justify-center min-w-[70px]">
			{available}
		</Badge>
	);
}

export default function EPIsDisponiveisPage({
	params,
}: EPIsDisponiveisPageProps) {
	const resolvedParams = use(params);
	const siteId = resolvedParams.id;

	const { epis, isLoading, refetch } = useEPIs(siteId);

	const [searchTerm, setSearchTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
	const [isAddFormOpen, setIsAddFormOpen] = useState(false);
	const [isGiveFormOpen, setIsGiveFormOpen] = useState(false);
	const [selectedEPI, setSelectedEPI] = useState<EPIItem | null>(null);

	const [showFilters, setShowFilters] = useState(false);
	const [filterCategory, setFilterCategory] = useState('');

	const itemsPerPage = 8;

	const filteredEPIs = epis.filter((epi) => {
		const search = searchTerm.toLowerCase();
		const matchesSearch =
			epi.name.toLowerCase().includes(search) ||
			epi.code.toLowerCase().includes(search) ||
			epi.category.toLowerCase().includes(search);

		const matchesCategory =
			filterCategory === '' ||
			epi.category.toLowerCase().includes(filterCategory.toLowerCase());

		return matchesSearch && matchesCategory;
	});

	const totalPages = Math.max(
		1,
		Math.ceil(filteredEPIs.length / itemsPerPage),
	);
	const currentEPIs = filteredEPIs.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	const handleGiveClick = (epi: EPIItem) => {
		setSelectedEPI(epi);
		setIsGiveFormOpen(true);
	};

	const columns: ColumnDef<EPIItem>[] = [
		{
			header: 'EPI',
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
			header: 'Status',
			cell: (item) => (
				<EPIStatusBadge
					available={item.totalQuantity}
					minThreshold={item.minThreshold}
				/>
			),
		},
		{
			header: 'Ações',
			cell: (item) => (
				<Button
					onClick={() => handleGiveClick(item)}
					disabled={item.totalQuantity === 0}
					size="sm"
					className="flex items-center gap-2 h-8 px-3 rounded-[5px] bg-[#101828] hover:bg-[#1b263b] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-medium"
				>
					<Send className="w-3.5 h-3.5" />
					Entregar
				</Button>
			),
		},
	];

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center p-12 gap-3 h-full">
				<Loader2 className="w-8 h-8 animate-spin text-[#101828]" />
				<p className="text-gray-500">Carregando EPIs...</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 relative">
			<PageHeader
				title="EPIs Disponíveis"
				description="Gerencie os Equipamentos de Proteção Individual em estoque para entregar aos colaboradores."
				onAdd={() => setIsAddFormOpen(true)}
				addLabel="Cadastrar EPIs"
			/>

			{isAddFormOpen && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
					onClick={() => setIsAddFormOpen(false)}
				>
					<div onClick={(e) => e.stopPropagation()}>
						<AddEPIForm
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

			{isGiveFormOpen && selectedEPI && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
					onClick={() => setIsGiveFormOpen(false)}
				>
					<div onClick={(e) => e.stopPropagation()}>
						<GiveEPIForm
							siteId={siteId}
							catalogId={selectedEPI.catalogId}
							inventoryId={selectedEPI.inventoryId}
							epiName={selectedEPI.name}
							availableQuantity={selectedEPI.totalQuantity}
							onCancel={() => setIsGiveFormOpen(false)}
							onSaved={() => {
								setIsGiveFormOpen(false);
								refetch();
							}}
						/>
					</div>
				</div>
			)}

			<div className="flex flex-col gap-5">
				{epis.length > 0 && (
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
									placeholder="Pesquisar EPIs..."
								/>
							</div>

							<div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm shrink-0">
								<button
									onClick={() => setViewMode('table')}
									className={`p-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${
										viewMode === 'table'
											? 'bg-gray-100 text-gray-900 border border-gray-200 shadow-sm'
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
											? 'bg-gray-100 text-gray-900 border border-gray-200 shadow-sm'
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
							</div>
						)}
					</div>
				)}

				{!isLoading && filteredEPIs.length === 0 ? (
					<EmptyState
						title={
							searchTerm
								? 'Nenhum EPI encontrado'
								: 'Nenhum EPI disponível'
						}
						description={
							searchTerm
								? 'Tente mudar os termos da pesquisa.'
								: 'Comece cadastrando EPIs para poder entregá-los aos colaboradores.'
						}
						icon={<Shield className="w-8 h-8 text-gray-400" />}
					/>
				) : (
					<>
						{viewMode === 'table' ? (
							<DataTable
								data={currentEPIs}
								columns={columns}
								keyExtractor={(item) => item.id}
							/>
						) : (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
								{currentEPIs.map((epi) => {
									const isZero = epi.totalQuantity === 0;
									const isWarning =
										!isZero &&
										epi.totalQuantity <= epi.minThreshold &&
										epi.minThreshold > 0;
									const borderColor = isZero
										? 'border-red-200'
										: isWarning
											? 'border-yellow-200'
											: 'border-green-200';
									const bgContentColor = isZero
										? 'bg-red-50/50'
										: isWarning
											? 'bg-yellow-50/50'
											: 'bg-green-50/50';

									return (
										<div
											key={epi.id}
											className={`flex flex-col bg-white rounded-xl border-2 ${borderColor} overflow-hidden shadow-sm hover:shadow-md transition-all`}
										>
											<div className="p-4 border-b border-gray-100">
												<div className="flex items-start justify-between gap-2 mb-2">
													<h3 className="font-semibold text-gray-900 leading-tight">
														{epi.name}
													</h3>
												</div>
												<div className="flex flex-wrap items-center gap-2">
													<Badge
														variant="secondary"
														className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-[5px] font-medium"
													>
														{epi.code}
													</Badge>
													<span className="text-xs text-gray-500 font-medium">
														{epi.category}
													</span>
												</div>
											</div>

											<div
												className={`flex-1 p-4 flex flex-col justify-center items-center gap-1 ${bgContentColor}`}
											>
												<span className="text-sm font-medium text-gray-600">
													Em Estoque
												</span>
												<div className="flex items-baseline gap-1">
													<span
														className={`text-3xl font-black ${
															isZero
																? 'text-red-600'
																: isWarning
																	? 'text-yellow-600'
																	: 'text-green-600'
														}`}
													>
														{epi.totalQuantity}
													</span>
													<span className="text-sm font-medium text-gray-500">
														UN
													</span>
												</div>
												{!isZero && isWarning && (
													<span className="text-xs text-yellow-700 font-medium mt-1">
														Abaixo do mínimo (
														{epi.minThreshold})
													</span>
												)}
											</div>

											<div className="p-3 border-t border-gray-100 bg-white">
												<Button
													onClick={() =>
														handleGiveClick(epi)
													}
													disabled={isZero}
													className="w-full h-10 bg-[#101828] hover:bg-[#1b263b] text-white rounded-[5px] shadow-sm disabled:bg-gray-300 transition-all font-semibold flex items-center justify-center gap-2"
												>
													<Send className="w-4 h-4" />
													Entregar Colaborador
												</Button>
											</div>
										</div>
									);
								})}
							</div>
						)}

						{filteredEPIs.length > 0 && (
							<Pagination
								currentPage={currentPage}
								totalPages={totalPages}
								onPageChange={setCurrentPage}
							/>
						)}
					</>
				)}
			</div>
		</div>
	);
}
