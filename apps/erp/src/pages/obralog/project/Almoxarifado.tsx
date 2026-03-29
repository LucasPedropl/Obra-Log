import React, { useState, useEffect } from 'react';
import { ERPLayout } from '../../../components/layout/ERPLayout';
import { useParams } from 'react-router-dom';
import {
	Search,
	Plus,
	ArrowRightLeft,
	Settings2,
	History,
	X,
	Package,
	Trash2,
} from 'lucide-react';
import { supabase } from '../../../config/supabase';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { useToast } from '../../../context/ToastContext';

export default function Almoxarifado() {
	const { id } = useParams();
	const { showToast } = useToast();
	const [searchTerm, setSearchTerm] = useState('');
	const [showAddModal, setShowAddModal] = useState(false);

	const [catalogs, setCatalogs] = useState<any[]>([]);
	const [inventory, setInventory] = useState<any[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Modal states
	interface AddItem {
		catalog_id: string;
		name: string;
		code?: string;
		unit?: string;
		quantity: number | '';
		price: number | '';
		min_threshold: number | '';
	}
	const [selectedItems, setSelectedItems] = useState<AddItem[]>([]);
	const [currentSelection, setCurrentSelection] = useState('');

	const companyId = localStorage.getItem('selectedCompanyId');

	const fetchInventory = async () => {
		if (!id) return;
		try {
			const { data, error } = await supabase
				.from('site_inventory')
				.select(
					`
					id, 
					quantity, 
					min_threshold,
					catalogs (id, name, code, measurement_units(abbreviation))
				`,
				)
				.eq('site_id', id);

			if (error) throw error;
			setInventory(data || []);
		} catch (error) {
			console.error('Error fetching inventory:', error);
		}
	};

	useEffect(() => {
		fetchInventory();
	}, [id]);

	useEffect(() => {
		async function fetchCatalogs() {
			if (!showAddModal || !companyId) return;
			try {
				// Don't show catalogs that are already in inventory
				const existingCatalogIds = inventory
					.map((item) => item.catalogs?.id)
					.filter(Boolean);

				let query = supabase
					.from('catalogs')
					.select('id, name, code, measurement_units(abbreviation)')
					.eq('company_id', companyId);

				const { data, error } = await query;

				if (error) throw error;

				// Filter out already added items manually if not possible directly in query easily
				const filteredData = (data || []).filter(
					(cat) => !existingCatalogIds.includes(cat.id),
				);

				setCatalogs(filteredData);
			} catch (error) {
				console.error('Error fetching catalogs:', error);
			}
		}
		if (showAddModal) {
			fetchCatalogs();
		}
	}, [showAddModal, companyId, inventory]);

	const handleItemSelect = (catalogId: string) => {
		if (!catalogId) return;

		if (selectedItems.some((i) => i.catalog_id === catalogId)) {
			showToast('Insumo já adicionado à lista', 'error');
			return;
		}

		const catalog = catalogs.find((c) => c.id === catalogId);
		if (catalog) {
			setSelectedItems([
				...selectedItems,
				{
					catalog_id: catalog.id,
					name: catalog.name,
					code: catalog.code,
					unit: catalog.measurement_units?.abbreviation,
					quantity: 1,
					price: '',
					min_threshold: '',
				},
			]);
		}
		setCurrentSelection('');
	};

	const updateItemProperty = (
		index: number,
		field: keyof AddItem,
		value: any,
	) => {
		const newItems = [...selectedItems];
		newItems[index] = { ...newItems[index], [field]: value };
		setSelectedItems(newItems);
	};

	const removeItem = (index: number) => {
		const newItems = [...selectedItems];
		newItems.splice(index, 1);
		setSelectedItems(newItems);
	};

	const handleAddInsumo = async (e: React.FormEvent) => {
		e.preventDefault();
		if (selectedItems.length === 0) {
			showToast('Adicione pelo menos um insumo à lista', 'error');
			return;
		}

		const invalidIndex = selectedItems.findIndex(
			(item) => !item.quantity || Number(item.quantity) <= 0,
		);
		if (invalidIndex !== -1) {
			showToast(
				'Preencha as quantidades obrigatórias corretamente',
				'error',
			);
			return;
		}

		setIsSubmitting(true);
		try {
			const itemsToInsert = selectedItems.map((item) => ({
				site_id: id,
				catalog_id: item.catalog_id,
				quantity: Number(item.quantity) || 0,
				min_threshold: Number(item.min_threshold) || 0,
			}));

			const { error } = await supabase
				.from('site_inventory')
				.insert(itemsToInsert);

			if (error) throw error;

			showToast('Insumos adicionados ao estoque!', 'success');
			setShowAddModal(false);
			setSelectedItems([]);

			fetchInventory();
		} catch (err: any) {
			console.error(err);
			showToast('Erro ao adicionar insumos', 'error');
		} finally {
			setIsSubmitting(false);
		}
	};

	const filteredInventory = inventory.filter((item) => {
		const searchLower = searchTerm.toLowerCase();
		const name = item.catalogs?.name?.toLowerCase() || '';
		const code = item.catalogs?.code?.toLowerCase() || '';
		return name.includes(searchLower) || code.includes(searchLower);
	});

	return (
		<ERPLayout>
			<div className="space-y-6 w-full">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div>
						<h1 className="text-2xl font-bold text-text-main">
							Almoxarifado
						</h1>
						<p className="text-text-muted mt-1">
							Gestão de estoque da obra
						</p>
					</div>

					<button
						onClick={() => setShowAddModal(true)}
						className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
					>
						<Plus size={20} />
						<span>Adicionar Insumo</span>
					</button>
				</div>

				<div className="bg-surface border border-border rounded-sm p-4 sm:p-6 shadow-sm">
					<div className="flex flex-col sm:flex-row gap-4 mb-6">
						<div className="relative flex-1">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Search size={18} className="text-text-muted" />
							</div>
							<input
								type="text"
								placeholder="Pesquisar insumo..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary transition-colors"
							/>
						</div>
						<div className="flex gap-2">
							<button className="flex items-center gap-2 bg-background border border-border text-text-main px-4 py-2 rounded-lg hover:border-primary/50 transition-colors">
								<Settings2 size={20} />
								<span>Filtros</span>
							</button>
						</div>
					</div>

					<div className="overflow-x-auto bg-surface border border-border rounded-lg">
						<table className="w-full text-left [&_th]:border-b [&_th]:border-border [&_td]:border-b [&_td]:border-border [&_tbody_tr:last-child_td]:border-b-0">
							<thead>
								<tr className="border-b border-border bg-background/50">
									<th className="py-3 px-4 text-sm font-semibold text-text-muted rounded-tl-lg">
										Insumo
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Origem
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted text-center">
										Qtd. em Obra
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted text-right rounded-tr-lg">
										Ações
									</th>
								</tr>
							</thead>
							<tbody>
								{filteredInventory.length === 0 ? (
									<tr>
										<td
											colSpan={4}
											className="py-12 text-center text-text-muted border-b border-border"
										>
											<div className="flex flex-col items-center justify-center">
												<Package
													size={48}
													className="text-border mb-3"
												/>
												<p>
													Nenhum insumo cadastrado
													nesta obra.
												</p>
											</div>
										</td>
									</tr>
								) : (
									filteredInventory.map((item) => (
										<tr
											key={item.id}
											className="border-b border-border hover:bg-black/5 dark:hover:bg-white/5 even:bg-black/[0.02] dark:even:bg-white/[0.02] transition-colors group"
										>
											<td className="py-3 px-4">
												<div className="font-medium text-text-main">
													{item.catalogs?.code
														? `[${item.catalogs.code}] `
														: ''}
													{item.catalogs?.name}
												</div>
											</td>
											<td className="py-3 px-4 text-text-muted">
												Global
											</td>
											<td className="py-3 px-4 text-center">
												<span className="inline-flex items-center justify-center bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-sm">
													{item.quantity}{' '}
													{item.catalogs
														?.measurement_units
														?.abbreviation || ''}
												</span>
											</td>
											<td className="py-3 px-4 text-right">
												<div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
													<button
														title="Movimentações"
														className="p-2 text-text-muted hover:text-primary transition-colors bg-background border border-border rounded-lg hover:border-primary/50"
													>
														<History size={18} />
													</button>
													<button
														title="Ajuste Rápido"
														className="p-2 text-text-muted hover:text-primary transition-colors bg-background border border-border rounded-lg hover:border-primary/50"
													>
														<ArrowRightLeft
															size={18}
														/>
													</button>
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* Modal de Adicionar Insumo */}
			{showAddModal && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
					onClick={() => {
						setShowAddModal(false);
						setSelectedItems([]);
					}}
				>
					<div
						className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-4xl flex flex-col h-[650px]"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between p-5 border-b border-border shrink-0">
							<div>
								<h2 className="text-xl font-bold text-text-main">
									Adicionar Insumos à Obra
								</h2>
								<p className="text-sm text-text-muted mt-1">
									Busque os insumos globais que deseja
									controlar nesta obra.
								</p>
							</div>
							<button
								onClick={() => {
									setShowAddModal(false);
									setSelectedItems([]);
								}}
								className="p-2 text-text-muted hover:text-text-main hover:bg-background rounded-lg transition-colors -mt-4 -mr-2"
							>
								<X size={20} />
							</button>
						</div>

						<div className="p-5 border-b border-border shrink-0 bg-background/30">
							<label className="block text-sm font-medium text-text-main mb-1">
								Buscar e Adicionar Insumo
							</label>
							<div className="w-full">
								<SearchableSelect
									options={catalogs
										.filter(
											(cat) =>
												!selectedItems.some(
													(si) =>
														si.catalog_id ===
														cat.id,
												),
										)
										.map((cat) => ({
											value: cat.id,
											label: cat.code
												? `[${cat.code}] ${cat.name}`
												: cat.name,
										}))}
									value={currentSelection}
									onChange={handleItemSelect}
									placeholder="Digite o nome do insumo para adicionar..."
									closeOnSelect={false}
								/>
							</div>
						</div>

						<div className="p-5 flex-1 overflow-y-auto">
							{selectedItems.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-12 text-text-muted">
									<Package
										size={48}
										className="mb-3 opacity-20"
									/>
									<p>Nenhum insumo selecionado.</p>
									<p className="text-sm mt-1">
										Busque no campo acima para adicioná-los
										à lista.
									</p>
								</div>
							) : (
								<div className="space-y-4">
									{selectedItems.map((item, index) => (
										<div
											key={item.catalog_id}
											className="bg-background border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 relative group"
										>
											<div className="flex-1 min-w-0">
												<h4
													className="font-semibold text-text-main truncate pr-6"
													title={item.name}
												>
													{item.code
														? `[${item.code}] `
														: ''}
													{item.name}
												</h4>
												<p className="text-xs text-text-muted mt-0.5">
													Unidade: {item.unit || '-'}
												</p>
											</div>

											<div className="flex items-center gap-3 w-full sm:w-auto">
												<div className="w-24 shrink-0">
													<label className="block text-xs font-medium text-text-muted mb-1">
														Qtd (obrig.)
													</label>
													<input
														type="number"
														required
														min="0.01"
														step="0.01"
														value={item.quantity}
														onChange={(e) =>
															updateItemProperty(
																index,
																'quantity',
																e.target.value,
															)
														}
														className="w-full px-3 py-1.5 bg-surface border border-border text-text-main rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
														placeholder="0.00"
													/>
												</div>
												<div className="w-24 shrink-0">
													<label className="block text-xs font-medium text-text-muted mb-1">
														Preço R$ (opc.)
													</label>
													<input
														type="number"
														min="0"
														step="0.01"
														value={item.price}
														onChange={(e) =>
															updateItemProperty(
																index,
																'price',
																e.target.value,
															)
														}
														className="w-full px-3 py-1.5 bg-surface border border-border text-text-main rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
														placeholder="0.00"
													/>
												</div>
												<div className="w-24 shrink-0">
													<label className="block text-xs font-medium text-text-muted mb-1">
														Estq. Min
													</label>
													<input
														type="number"
														min="0"
														step="0.01"
														value={
															item.min_threshold
														}
														onChange={(e) =>
															updateItemProperty(
																index,
																'min_threshold',
																e.target.value,
															)
														}
														className="w-full px-3 py-1.5 bg-surface border border-border text-text-main rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
														placeholder="0.00"
													/>
												</div>
											</div>

											<button
												onClick={() =>
													removeItem(index)
												}
												className="absolute top-4 right-4 sm:relative sm:top-0 sm:right-0 p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
												title="Remover da lista"
											>
												<Trash2 size={16} />
											</button>
										</div>
									))}
								</div>
							)}
						</div>

						<div className="p-5 border-t border-border shrink-0 flex items-center justify-between bg-background/50 rounded-b-xl">
							<span className="text-sm font-medium text-text-muted">
								Total de itens:{' '}
								<span className="text-text-main">
									{selectedItems.length}
								</span>
							</span>
							<div className="flex gap-3">
								<button
									type="button"
									onClick={() => {
										setShowAddModal(false);
										setSelectedItems([]);
									}}
									className="px-4 py-2 text-text-muted hover:text-text-main font-medium transition-colors"
								>
									Cancelar
								</button>
								<button
									onClick={handleAddInsumo}
									disabled={
										isSubmitting ||
										selectedItems.length === 0
									}
									className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-50"
								>
									{isSubmitting
										? 'Salvando...'
										: 'Salvar no Estoque'}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</ERPLayout>
	);
}
