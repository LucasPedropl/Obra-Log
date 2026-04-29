'use client';
import React, { use, useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { PackageOpen, Loader2, X } from 'lucide-react';
import { TableSearch } from '@/components/shared/TableSearch';
import { Pagination } from '@/components/shared/Pagination';
import { DataTable, DetailRow } from '@/components/shared/DataTable';
import { AddInventoryForm } from '@/features/almoxarifado/components/AddInventoryForm';
import { StockAdjustment } from '@/features/almoxarifado/components/StockAdjustment';
import { getSiteInventoryAdmin } from '@/app/actions/adminActions';

interface InventoryItem {
	id: string;
	catalogId: string;
	quantity: number;
	min_threshold: number;
	catalogs: {
		name: string;
		category: string;
		measurement_units: {
			abbreviation: string;
		} | null;
	} | null;
}

interface InventoryRawItem {
	id: string;
	catalog_id: string;
	quantity: number | null;
	min_threshold: number | null;
	catalogs: {
		name: string | null;
		categories: {
			primary_category: string | null;
			secondary_category: string | null;
		} | null;
		measurement_units: {
			abbreviation: string | null;
		} | null;
	} | null;
}

export default function AlmoxarifadoObraPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const resolvedParams = use(params);

	const [searchTerm, setSearchTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [isLoading, setIsLoading] = useState(false);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [items, setItems] = useState<InventoryItem[]>([]);

	const loadItems = useCallback(async () => {
		setIsLoading(true);
		try {
			const data = await getSiteInventoryAdmin(resolvedParams.id);
			const normalized = (data as unknown as InventoryRawItem[]).map(
				(item) => {
					const catalog = item.catalogs ?? null;
					const category = catalog?.categories ?? null;
					const measurementUnit = catalog?.measurement_units ?? null;

					return {
						id: item.id,
						catalogId: item.catalog_id,
						quantity: item.quantity ?? 0,
						min_threshold: item.min_threshold ?? 0,
						catalogs: catalog
							? {
									name: catalog.name || '-',
									category:
										category?.primary_category ||
										'Sem Categoria',
									measurement_units: measurementUnit
										? {
												abbreviation:
													measurementUnit.abbreviation ||
													'UN',
											}
										: null,
								}
							: null,
					};
				},
			);

			setItems(normalized);
		} catch (error) {
			console.error('Error fetching inventory:', error);
		} finally {
			setIsLoading(false);
		}
	}, [resolvedParams.id]);

	useEffect(() => {
		void loadItems();
	}, [loadItems]);

	const itemsPerPage = 10;

	const existingCatalogIds = useMemo(
		() => items.map((item) => item.catalogId),
		[items],
	);

	const filteredItems = useMemo(() => {
		if (!searchTerm.trim()) return items;
		const lowerSearch = searchTerm.toLowerCase();
		return items.filter((item) => {
			const name = item.catalogs?.name?.toLowerCase() || '';
			const category = item.catalogs?.category?.toLowerCase() || '';
			return name.includes(lowerSearch) || category.includes(lowerSearch);
		});
	}, [items, searchTerm]);

	const totalPages = Math.max(
		1,
		Math.ceil(filteredItems.length / itemsPerPage),
	);

	const paginatedItems = useMemo(() => {
		const start = (currentPage - 1) * itemsPerPage;
		return filteredItems.slice(start, start + itemsPerPage);
	}, [filteredItems, currentPage]);

	return (
		<div className="w-full flex flex-col gap-6 relative">
			<PageHeader
				title="Almoxarifado da Obra"
				description="Gestão de estoque e suprimentos local da obra"
				onAdd={() => setIsFormOpen(true)}
				addLabel="Adicionar Estoque"
			/>

			{isFormOpen && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
					onClick={() => setIsFormOpen(false)}
				>
					<div
						className="relative flex items-center justify-center min-h-[calc(100vh-2rem)] py-8 animate-in fade-in zoom-in duration-300"
						onClick={(e) => e.stopPropagation()}
					>
						<AddInventoryForm
							siteId={resolvedParams.id}
							existingCatalogIds={existingCatalogIds}
							onCancel={() => setIsFormOpen(false)}
							onSaved={() => {
								setIsFormOpen(false);
								void loadItems();
							}}
						/>
					</div>
				</div>
			)}

			{isLoading ? (
				<div className="flex items-center justify-center p-12">
					<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
				</div>
			) : filteredItems.length === 0 ? (
				<EmptyState
					title="Estoque Vazio"
					description="Esta obra ainda não possui itens no almoxarifado."
					icon={<PackageOpen className="w-8 h-8 text-gray-400" />}
				/>
			) : (
				<div className="flex flex-col gap-4">
					<TableSearch
						value={searchTerm}
						onChange={(val) => {
							setSearchTerm(val);
							setCurrentPage(1);
						}}
						placeholder="Pesquisar itens..."
					/>

					<div className="">
						<DataTable
							data={paginatedItems}
							columns={[
								{
									header: 'Insumo',
									cell: (item) => item.catalogs?.name || '-',
								},
								{
									header: 'Categoria',
									cell: (item) =>
										item.catalogs?.category || '-',
								},
								{
									header: 'Quantidade',
									cell: (item) => (
										<StockAdjustment
											inventoryId={item.id}
											siteId={resolvedParams.id}
											initialQuantity={item.quantity}
											unit={
												item.catalogs?.measurement_units
													?.abbreviation || 'UN'
											}
											onSaved={loadItems}
										/>
									),
									className: 'text-right font-semibold',
								},
								{
									header: 'Unidade',
									cell: (item) =>
										item.catalogs?.measurement_units
											?.abbreviation || 'UN',
								},
							]}
							detailsTitle="Detalhes do Item (Almoxarifado)"
							renderDetails={(item) => (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<DetailRow label="Insumo" value={item.catalogs?.name || '-'} className="sm:col-span-2" />
									<DetailRow label="Categoria" value={item.catalogs?.category || '-'} />
									<DetailRow label="Quantidade Disponível" value={item.quantity || 0} />
									<DetailRow label="Unidade de Medida" value={item.catalogs?.measurement_units?.abbreviation || 'UN'} />
									<DetailRow label="Estoque Mínimo" value={item.min_threshold || 0} />
								</div>
							)}
							keyExtractor={(item) => item.id}
						/>
					</div>

					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						onPageChange={setCurrentPage}
					/>
				</div>
			)}
		</div>
	);
}
