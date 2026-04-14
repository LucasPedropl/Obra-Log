'use client';
import React, { use, useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { PackageOpen, Loader2, X } from 'lucide-react';
import { TableSearch } from '@/components/shared/TableSearch';
import { Pagination } from '@/components/shared/Pagination';
import { AddInventoryForm } from '@/features/almoxarifado/components/AddInventoryForm';
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

					<div className="bg-white rounded-lg border border-gray-200">
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead className="bg-gray-50 border-b border-gray-200">
									<tr>
										<th className="text-left px-4 py-3 font-semibold text-gray-700">
											Insumo
										</th>
										<th className="text-left px-4 py-3 font-semibold text-gray-700">
											Categoria
										</th>
										<th className="text-right px-4 py-3 font-semibold text-gray-700">
											Quantidade
										</th>
										<th className="text-left px-4 py-3 font-semibold text-gray-700">
											Unidade
										</th>
									</tr>
								</thead>
								<tbody>
									{paginatedItems.map((item) => (
										<tr
											key={item.id}
											className="border-b border-gray-100"
										>
											<td className="px-4 py-3 text-gray-900">
												{item.catalogs?.name || '-'}
											</td>
											<td className="px-4 py-3 text-gray-600">
												{item.catalogs?.category || '-'}
											</td>
											<td className="px-4 py-3 text-right font-semibold text-gray-900">
												{item.quantity || 0}
											</td>
											<td className="px-4 py-3 text-gray-600">
												{item.catalogs
													?.measurement_units
													?.abbreviation || 'UN'}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
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
