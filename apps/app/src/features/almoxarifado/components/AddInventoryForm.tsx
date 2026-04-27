import React, { useState, useEffect, useMemo } from 'react';
import { Search, Check, PackageOpen, X, Grip, Loader2 } from 'lucide-react';
import { useSupplyItems } from '@/features/insumos/hooks/useSupplyItems';
import { createClient } from '@/config/supabase';
import { Button } from '@/components/ui/button';

interface AddInventoryFormProps {
	onCancel: () => void;
	onSaved: () => void;
	siteId: string;
	existingCatalogIds: string[];
}

interface AddInventoryPayloadItem {
	catalogId: string;
	quantity: number;
	category: 'NONE' | 'TOOL' | 'EPI';
}

interface SupplyItemOption {
	id: string;
	name: string;
	code: string;
	unit: string;
	category: string;
	subcategory: string;
}

interface RawSupplyItem {
	id: string;
	name: string;
	code: string | null;
	measurement_units: {
		abbreviation: string;
	} | null;
	categories: {
		primary_category: string;
		secondary_category: string | null;
	} | null;
}

interface RawInventoryResult {
	id: string;
	catalog_id: string;
}

export function AddInventoryForm({
	onCancel,
	onSaved,
	siteId,
	existingCatalogIds,
}: AddInventoryFormProps) {
	const [step, setStep] = useState(1);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedItems, setSelectedItems] = useState<string[]>([]);
	const [quantities, setQuantities] = useState<Record<string, number>>({});
	const [categories, setCategories] = useState<
		Record<string, 'NONE' | 'TOOL' | 'EPI'>
	>({});

	const { fetchSupplyItems } = useSupplyItems();
	const [globalItems, setGlobalItems] = useState<SupplyItemOption[]>([]);
	const [isFetching, setIsFetching] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		fetchSupplyItems().then((res) => {
			const mapped = (res as unknown as RawSupplyItem[] || []).map((item) => ({
				id: item.id,
				name: item.name,
				code: item.code || '-',
				unit: item.measurement_units?.abbreviation || 'UN',
				category: item.categories?.primary_category || 'Sem Categoria',
				subcategory: item.categories?.secondary_category || '',
			}));
			setGlobalItems(mapped);
			setIsFetching(false);
		});
	}, []);

	const availableItems = useMemo(() => {
		const existingIds = new Set(existingCatalogIds);
		return globalItems.filter((item) => !existingIds.has(item.id));
	}, [globalItems, existingCatalogIds]);

	const filteredItems = availableItems.filter(
		(item) =>
			item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.subcategory?.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const toggleSelection = (id: string) => {
		setSelectedItems((prev) => {
			if (prev.includes(id)) {
				return prev.filter((i) => i !== id);
			}
			return [...prev, id];
		});

		if (!categories[id]) {
			setCategories((prev) => ({ ...prev, [id]: 'NONE' }));
		}
		if (quantities[id] === undefined) {
			setQuantities((prev) => ({ ...prev, [id]: 0 }));
		}
	};

	const handleSave = async () => {
		if (isSaving) return;

		setIsSaving(true);
		try {
			const payload: AddInventoryPayloadItem[] = selectedItems.map(
				(id) => ({
					catalogId: id,
					quantity: quantities[id] || 0,
					category: categories[id] || 'NONE',
				}),
			);

			const supabase = createClient();

			// 1. Inserir no site_inventory
			const inventoryData = payload.map((item) => ({
				site_id: siteId,
				catalog_id: item.catalogId,
				quantity: item.quantity,
				min_threshold: 0,
			}));

			const { data: inventoryResults, error: inventoryError } = await supabase
				.from('site_inventory')
				.upsert(inventoryData, { onConflict: 'site_id,catalog_id' })
				.select('id, catalog_id');

			if (inventoryError) throw inventoryError;

			// 2. Separar Ferramentas e EPIs
			const epiData: { site_id: string; inventory_id: string }[] = [];
			const toolData: { site_id: string; inventory_id: string }[] = [];

			(inventoryResults as unknown as RawInventoryResult[] || []).forEach((invRow) => {
				const originalItem = payload.find(
					(i) => i.catalogId === invRow.catalog_id,
				);
				if (originalItem?.category === 'EPI') {
					epiData.push({ site_id: siteId, inventory_id: invRow.id });
				} else if (originalItem?.category === 'TOOL') {
					toolData.push({ site_id: siteId, inventory_id: invRow.id });
				}
			});

			// 3. Inserir EPIs
			if (epiData.length > 0) {
				const { data: existingEpis } = await supabase
					.from('site_epis')
					.select('inventory_id')
					.in('inventory_id', epiData.map((e) => e.inventory_id));

				const existingEpiIds = new Set(existingEpis?.map((e) => e.inventory_id) || []);
				const newEpis = epiData.filter((e) => !existingEpiIds.has(e.inventory_id));

				if (newEpis.length > 0) {
					const { error: epiError } = await supabase.from('site_epis').insert(newEpis);
					if (epiError) throw epiError;
				}
			}

			// 4. Inserir Ferramentas
			if (toolData.length > 0) {
				const { data: existingTools } = await supabase
					.from('site_tools')
					.select('inventory_id')
					.in('inventory_id', toolData.map((t) => t.inventory_id));

				const existingToolIds = new Set(existingTools?.map((t) => t.inventory_id) || []);
				const newTools = toolData.filter((t) => !existingToolIds.has(t.inventory_id));

				if (newTools.length > 0) {
					const { error: toolError } = await supabase.from('site_tools').insert(newTools);
					if (toolError) throw toolError;
				}
			}

			onSaved();
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Erro ao salvar inventário';
			console.error('Erro ao salvar:', err);
			alert('Erro ao salvar inventário: ' + message);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 w-[800px] h-[650px] max-w-[95vw] max-h-[90vh] flex flex-col">
			<div className="p-6 border-b border-gray-200 flex justify-between items-start shrink-0">
				<div>
					<h2 className="text-xl font-bold text-gray-900 tracking-tight">
						{step === 1
							? 'Adicionar Insumos à Obra'
							: 'Configurar Quantidades e Destinação'}
					</h2>
					<p className="text-sm text-gray-500 mt-1">
						{step === 1
							? 'Selecione os insumos do catálogo global que farão parte do estoque da obra.'
							: 'Defina o estoque inicial e se o insumo será classificado como Ferramenta ou EPI na obra.'}
					</p>
				</div>
				<button
					type="button"
					onClick={onCancel}
					className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-[5px] transition-colors p-1.5"
				>
					<X size={20} />
				</button>
			</div>

			<div className="p-6 flex-1 overflow-hidden flex flex-col bg-gray-50/50">
				{step === 1 && (
					<div className="flex flex-col h-full">
						<div className="flex flex-col gap-2 mb-5 shrink-0">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
								<input
									type="text"
									value={searchTerm}
									onChange={(e) =>
										setSearchTerm(e.target.value)
									}
									placeholder="Pesquise por nome, código ou categoria do insumo..."
									className="w-full bg-white border border-gray-300 rounded-[5px] py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#101828]/20 focus:border-[#101828] shadow-sm transition-all"
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 gap-3 overflow-y-auto pr-2 rounded-[5px] flex-1 pb-4">
							{isFetching && (
								<div className="flex flex-col items-center justify-center py-12">
									<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
									<p className="text-sm mt-3 text-gray-500">
										Carregando insumos...
									</p>
								</div>
							)}
							{!isFetching &&
								filteredItems.map((item) => {
									const isSelected = selectedItems.includes(
										item.id,
									);
									return (
										<div
											key={item.id}
											onClick={() =>
												toggleSelection(item.id)
											}
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
													<Check
														size={14}
														strokeWidth={3}
													/>
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
														<span className="text-gray-300">
															•
														</span>
														<span className="text-gray-500">
															{item.subcategory}
														</span>
													</div>
												</div>
												<div className="flex flex-col sm:items-end gap-1.5 mt-2 sm:mt-0">
													<div className="inline-flex items-center text-xs font-mono font-medium text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-[5px]">
														Cód: {item.code}
													</div>
													<div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
														UN: {item.unit}
													</div>
												</div>
											</div>
										</div>
									);
								})}

							{!isFetching && filteredItems.length === 0 && (
								<div className="text-center py-16 flex flex-col items-center justify-center h-full">
									<div className="w-16 h-16 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-4">
										<PackageOpen className="w-8 h-8 text-gray-300" />
									</div>
									<p className="text-sm font-semibold text-gray-700">
										Nenhum insumo encontrado
									</p>
									<p className="text-xs text-gray-500 mt-1.5 max-w-[250px] leading-relaxed">
										Não existem insumos disponíveis para
										cadastro correspondente à sua pesquisa
										no catálogo global.
									</p>
								</div>
							)}
						</div>
					</div>
				)}

				{step === 2 && (
					<div className="flex flex-col gap-4 overflow-y-auto pr-2 h-full">
						{selectedItems.map((id) => {
							const item = globalItems.find((i) => i.id === id);
							if (!item) return null;

							return (
								<div
									key={item.id}
									className="bg-white border border-gray-200 shadow-sm rounded-lg p-5 flex flex-col gap-5 shrink-0"
								>
									<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 border-b border-gray-100 pb-4">
										<div className="flex flex-col gap-1">
											<div className="font-semibold text-[15px] text-gray-900">
												{item.name}
											</div>
											<div className="flex items-center gap-2 text-xs font-medium text-gray-500">
												<span className="bg-gray-100 px-2 py-0.5 rounded-[5px]">
													{item.category}
												</span>
												<span className="text-gray-300">
													•
												</span>
												<span className="text-gray-500">
													{item.code}
												</span>
											</div>
										</div>
										<div className="flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-[5px] border border-gray-100">
											<label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
												Qtd. Inicial:
											</label>
											<div className="flex items-center gap-2">
												<input
													type="number"
													min="0"
													value={quantities[id] || 0}
													onChange={(e) =>
														setQuantities({
															...quantities,
															[id]: Number(
																e.target.value,
															),
														})
													}
													className="w-20 bg-white border border-gray-300 rounded-[5px] px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-[#101828] focus:ring-1 focus:ring-[#101828] text-center shadow-sm"
												/>
												<span className="text-xs font-bold text-gray-500 min-w-[2rem] text-center">
													{item.unit}
												</span>
											</div>
										</div>
									</div>

									<div>
										<label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 block">
											Classificação de Uso na Obra
										</label>
										<div className="grid grid-cols-3 gap-3">
											<button
												type="button"
												onClick={() =>
													setCategories({
														...categories,
														[id]: 'NONE',
													})
												}
												className={`py-3 px-2 text-sm font-semibold rounded-[5px] border transition-all duration-200 flex flex-col items-center gap-1 ${
													categories[id] === 'NONE'
														? 'bg-[#101828] border-[#101828] text-white shadow-md transform scale-[1.02]'
														: 'bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
												}`}
											>
												Padrão
												<span
													className={`text-[10px] font-normal ${categories[id] === 'NONE' ? 'text-gray-300' : 'text-gray-400'}`}
												>
													Consumo Geral
												</span>
											</button>
											<button
												type="button"
												onClick={() =>
													setCategories({
														...categories,
														[id]: 'TOOL',
													})
												}
												className={`py-3 px-2 text-sm font-semibold rounded-[5px] border transition-all duration-200 flex flex-col items-center gap-1 ${
													categories[id] === 'TOOL'
														? 'bg-[#101828] border-[#101828] text-white shadow-md transform scale-[1.02]'
														: 'bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
												}`}
											>
												Ferramenta
												<span
													className={`text-[10px] font-normal ${categories[id] === 'TOOL' ? 'text-gray-300' : 'text-gray-400'}`}
												>
													Estoque de Ativos
												</span>
											</button>
											<button
												type="button"
												onClick={() =>
													setCategories({
														...categories,
														[id]: 'EPI',
													})
												}
												className={`py-3 px-2 text-sm font-semibold rounded-[5px] border transition-all duration-200 flex flex-col items-center gap-1 ${
													categories[id] === 'EPI'
														? 'bg-[#101828] border-[#101828] text-white shadow-md transform scale-[1.02]'
														: 'bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
												}`}
											>
												EPI
												<span
													className={`text-[10px] font-normal ${categories[id] === 'EPI' ? 'text-gray-300' : 'text-gray-400'}`}
												>
													Segurança
												</span>
											</button>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
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
						type="button"
						variant="ghost"
						onClick={step === 1 ? onCancel : () => setStep(1)}
						className="text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-semibold rounded-[5px] px-6"
					>
						{step === 1 ? 'Cancelar' : 'Voltar'}
					</Button>

					<Button
						type="button"
						onClick={step === 1 ? () => setStep(2) : handleSave}
						disabled={
							isSaving ||
							(step === 1 && selectedItems.length === 0)
						}
						className="bg-[#101828] hover:bg-[#1b263b] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md rounded-[5px] px-8 transition-colors"
					>
						{step === 1
							? 'Avançar'
							: isSaving
								? 'Salvando...'
								: 'Salvar no Estoque'}
					</Button>
				</div>
			</div>
		</div>
	);
}
