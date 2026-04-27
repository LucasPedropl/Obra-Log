import React, { useState, useEffect } from 'react';
import { Search, Check, PackageOpen, X, Grip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	getSiteInventoryAdmin,
	getSiteToolsAdmin,
	addSiteToolsAdmin,
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

interface AddToolFormProps {
	onCancel: () => void;
	onSaved: () => void;
	siteId: string;
}

interface RawSiteTool {
	inventory_id: string;
}

interface RawInventoryItem {
	id: string;
	quantity: number;
	catalogs: {
		name: string;
		code: string | null;
		measurement_units: {
			abbreviation: string;
		} | null;
		categories: {
			primary_category: string;
			secondary_category: string | null;
		} | null;
	} | null;
}

export function AddToolForm({ onCancel, onSaved, siteId }: AddToolFormProps) {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedItems, setSelectedItems] = useState<string[]>([]);
	const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchInventory = async () => {
			try {
				setIsLoading(true);
				setError(null);

				const [existingTools, inventoryData] = await Promise.all([
					getSiteToolsAdmin(siteId),
					getSiteInventoryAdmin(siteId),
				]);

				const existingIds = new Set(
					(existingTools as unknown as RawSiteTool[])?.map((t) => t.inventory_id) || [],
				);

				const formatted: InventoryItem[] = (inventoryData as unknown as RawInventoryItem[] || [])
					.filter((item) => !existingIds.has(item.id))
					.map((item) => {
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
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Erro ao carregar dados do inventário';
				console.error('Error fetching inventory for tools:', err);
				setError(message);
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

			await addSiteToolsAdmin(siteId, selectedItems);

			onSaved();
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Erro ao salvar ferramentas';
			console.error('Error saving tools:', err);
			setError(message);
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-[800px] h-[650px] max-w-[95vw] max-h-[90vh] flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#101828]"></div>
			</div>
		);
	}

	return (
		<div className="bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 w-[800px] h-[650px] max-w-[95vw] max-h-[90vh] flex flex-col">
			<div className="p-6 border-b border-gray-200 flex justify-between items-start shrink-0">
				<div>
					<h2 className="text-xl font-bold text-gray-900 tracking-tight">
						Adicionar Ferramentas à Obra
					</h2>
					<p className="text-sm text-gray-500 mt-1">
						Selecione os insumos do almoxarifado para gerenciá-los
						como ferramentas de empréstimo.
					</p>
				</div>
				<button
					onClick={onCancel}
					className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-[5px] transition-colors p-1.5"
				>
					<X size={20} />
				</button>
			</div>

			<div className="p-6 flex-1 overflow-hidden flex flex-col bg-gray-50/50">
				<div className="flex flex-col gap-2 mb-5 shrink-0">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<input
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="Pesquise por nome, código ou categoria..."
							className="w-full bg-white border border-gray-300 rounded-[5px] py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#101828]/20 focus:border-[#101828] shadow-sm transition-all"
						/>
					</div>
				</div>

				{error && (
					<div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
						{error}
					</div>
				)}

				<div className="grid grid-cols-1 gap-3 overflow-y-auto pr-2 rounded-[5px] flex-1 pb-4">
					{filteredItems.map((item) => {
						const isSelected = selectedItems.includes(item.id);
						return (
							<div
								key={item.id}
								onClick={() => toggleSelection(item.id)}
								className={`group flex items-start gap-4 p-4 rounded-lg cursor-pointer border transition-all duration-200 ${
									isSelected
										? 'bg-blue-50/50 border-[#101828] shadow-sm'
										: 'bg-white border-gray-200 hover:border-[#101828]/50 hover:shadow-sm'
								}`}
							>
								<div
									className={`mt-1 w-5 h-5 shrink-0 rounded-[5px] border flex items-center justify-center transition-all duration-200 ${
										isSelected
											? 'bg-[#101828] border-[#101828] text-white'
											: 'border-gray-300 bg-gray-50 group-hover:border-[#101828]/50'
									}`}
								>
									{isSelected && (
										<Check size={14} strokeWidth={3} />
									)}
								</div>
								<div className="flex flex-1 flex-col sm:flex-row sm:items-center justify-between gap-3">
									<div className="flex flex-col gap-1">
										<div className="font-semibold text-sm text-gray-900 group-hover:text-[#101828] transition-colors">
											{item.name}
										</div>
										<div className="flex items-center gap-2 text-xs font-medium text-gray-500">
											<div className="flex items-center gap-1.5">
												<Grip
													size={12}
													className="text-gray-400"
												/>
												<span className="bg-gray-100 px-2 py-0.5 rounded-[5px]">
													{item.category}
												</span>
											</div>
										</div>
									</div>
									<div className="flex flex-col sm:items-end gap-1.5 mt-2 sm:mt-0">
										<div className="inline-flex items-center text-xs font-mono font-medium text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-[5px]">
											Cod: {item.code}
										</div>
										<div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
											Qtd Estoque: {item.quantity}
										</div>
									</div>
								</div>
							</div>
						);
					})}

					{filteredItems.length === 0 && (
						<div className="text-center py-16 flex flex-col items-center justify-center h-full">
							<div className="w-16 h-16 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-4">
								<PackageOpen className="w-8 h-8 text-gray-300" />
							</div>
							<p className="text-sm font-semibold text-gray-700">
								Nenhum insumo encontrado
							</p>
							<p className="text-xs text-gray-500 mt-1.5 max-w-[250px] leading-relaxed">
								Não há insumos disponíveis no almoxarifado para
								adicionar como ferramenta.
							</p>
						</div>
					)}
				</div>
			</div>

			<div className="p-5 border-t border-gray-200 flex flex-row items-center justify-between bg-white rounded-b-xl shrink-0">
				<div className="text-sm font-medium text-gray-600">
					Selecionados:{' '}
					<span className="font-bold text-[#101828] bg-blue-50 px-2 py-0.5 rounded-[5px]">
						{selectedItems.length}
					</span>
				</div>
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						onClick={onCancel}
						className="text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-semibold rounded-[5px] px-6"
					>
						Cancelar
					</Button>
					<Button
						onClick={handleSave}
						disabled={selectedItems.length === 0 || isSaving}
						className="bg-[#101828] hover:bg-[#1b263b] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md rounded-[5px] px-8 transition-colors"
					>
						{isSaving ? 'Salvando...' : 'Salvar como Ferramenta'}
					</Button>
				</div>
			</div>
		</div>
	);
}
