import React, { useState, useEffect } from 'react';
import { Search, Check, PackageOpen, X, Grip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	getSiteInventoryAdmin,
	getSiteEpisAdmin,
	addSiteEpisAdmin,
} from '@/app/actions/adminActions';

interface InventoryItem {
	id: string;
	name: string;
	code: string;
	unit: string;
	category: string;
	subcategory: string;
	quantity: number;
}

interface AddEPIFormProps {
	onCancel: () => void;
	onSaved: () => void;
	siteId: string;
}

export function AddEPIForm({ onCancel, onSaved, siteId }: AddEPIFormProps) {
	const [searchTerm, setSearchTerm] = useState('');
	const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
	const [selectedItems, setSelectedItems] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchInventory = async () => {
			try {
				setIsLoading(true);
				setError(null);

				const [existingEPIs, inventoryData] = await Promise.all([
					getSiteEpisAdmin(siteId),
					getSiteInventoryAdmin(siteId),
				]);

				const existingIds = new Set(
					existingEPIs?.map((t: any) => t.inventory_id) || [],
				);

				const formatted: InventoryItem[] = (inventoryData || [])
					.filter(
						(item: any) =>
							!existingIds.has(item.id) &&
							item.catalogs?.is_tool !== true,
					)
					.map((item: any) => {
						const catalog = item.catalogs ?? null;
						return {
							id: item.id,
							name: catalog?.name || 'Produto sem nome',
							code: catalog?.code || 'S/C',
							unit:
								catalog?.measurement_units?.abbreviation ||
								'UN',
							category:
								catalog?.categories?.primary_category ||
								'Sem Categoria',
							subcategory:
								catalog?.categories?.secondary_category || '',
							quantity: item.quantity || 0,
						};
					});

				setInventoryItems(formatted);
			} catch (err: any) {
				console.error('Error fetching inventory for EPIs:', err);
				setError(err.message || 'Erro ao carregar dados');
			} finally {
				setIsLoading(false);
			}
		};

		if (siteId) {
			fetchInventory();
		}
	}, [siteId]);

	const filteredItems = inventoryItems.filter(
		(item) =>
			item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.category.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const toggleSelection = (id: string) => {
		setSelectedItems((prev) => {
			if (prev.includes(id)) {
				return prev.filter((i) => i !== id);
			}
			return [...prev, id];
		});
	};

	const handleSave = async () => {
		if (selectedItems.length === 0) return;

		try {
			setIsSaving(true);
			setError(null);

			await addSiteEpisAdmin(siteId, selectedItems);

			onSaved();
		} catch (err: any) {
			console.error('Error adding EPIs:', err);
			setError(err.message || 'Erro ao salvar EPIs');
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-[600px] max-w-[95vw] overflow-hidden flex flex-col h-[600px]">
			<div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
				<div>
					<h2 className="text-base font-semibold text-gray-900">
						Cadastrar EPIs
					</h2>
					<p className="text-xs text-gray-500 mt-0.5">
						Selecione os insumos do almoxarifado que serão
						controlados como EPI.
					</p>
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 rounded-[5px]"
					onClick={onCancel}
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			<div className="p-4 border-b border-gray-100 shrink-0">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
					<input
						type="text"
						placeholder="Buscar por nome, código ou categoria..."
						className="flex h-10 w-full rounded-[5px] border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#101828]"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
			</div>

			<div className="flex-1 overflow-auto p-4 bg-gray-50/30">
				{error && (
					<div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-[5px] border border-red-200 uppercase font-medium">
						{error}
					</div>
				)}

				{isLoading ? (
					<div className="flex justify-center items-center h-full">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#101828]"></div>
					</div>
				) : filteredItems.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-center py-8">
						<div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
							<PackageOpen className="w-6 h-6 text-gray-400" />
						</div>
						<h3 className="text-sm font-semibold text-gray-900">
							Nenhum item encontrado
						</h3>
						<p className="text-xs text-gray-500 mt-1 max-w-[250px]">
							Todos os EPIs já foram importados ou não há insumos
							no almoxarifado correspondentes.
						</p>
					</div>
				) : (
					<div className="space-y-2">
						{filteredItems.map((item) => {
							const isSelected = selectedItems.includes(item.id);

							return (
								<div
									key={item.id}
									onClick={() => toggleSelection(item.id)}
									className={`
                                      flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 group
                                      ${
											isSelected
												? 'border-[#101828] bg-blue-50/30 shadow-sm'
												: 'border-gray-200 bg-white hover:border-[#101828]/30 hover:shadow-sm'
										}
                                    `}
								>
									<div
										className={`
                                      flex items-center justify-center w-5 h-5 rounded-[4px] border transition-colors shrink-0
                                      ${
											isSelected
												? 'bg-[#101828] border-[#101828]'
												: 'border-gray-300 group-hover:border-[#101828]/50 bg-white'
										}
                                    `}
									>
										{isSelected && (
											<Check className="w-3.5 h-3.5 text-white" />
										)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between mb-0.5">
											<span className="text-sm font-semibold text-gray-900 truncate pr-4">
												{item.name}
											</span>
											<span className="text-xs font-medium text-gray-500 shrink-0">
												Estoque: {item.quantity}
											</span>
										</div>
										<div className="flex justify-between items-center text-xs text-gray-500">
											<span className="flex items-center gap-1">
												Cod: {item.code}
											</span>
											<span>{item.category}</span>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			<div className="flex items-center justify-between p-4 border-t border-gray-100 bg-white shrink-0">
				<span className="text-xs font-medium text-gray-500">
					{selectedItems.length}{' '}
					{selectedItems.length === 1
						? 'item selecionado'
						: 'itens selecionados'}
				</span>
				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={onCancel}
						className="h-9 px-4 text-xs font-semibold rounded-[5px] border-gray-300 text-gray-700 hover:bg-gray-50 uppercase"
					>
						Cancelar
					</Button>
					<Button
						onClick={handleSave}
						disabled={selectedItems.length === 0 || isSaving}
						className="h-9 px-4 text-xs font-semibold rounded-[5px] bg-[#101828] hover:bg-[#1b263b] text-white uppercase"
					>
						{isSaving ? 'Salvando...' : 'Adicionar EPIs'}
					</Button>
				</div>
			</div>
		</div>
	);
}
