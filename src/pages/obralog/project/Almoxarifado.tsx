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
	const [selectedCatalogId, setSelectedCatalogId] = useState('');
	const [initialQuantity, setInitialQuantity] = useState<number>(0);
	const [minThreshold, setMinThreshold] = useState<number>(0);

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
					.select('id, name, code')
					.eq('company_id', companyId)
					.eq('is_tool', false);

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

	const handleAddInsumo = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedCatalogId) {
			showToast('Selecione um insumo', 'error');
			return;
		}

		setIsSubmitting(true);
		try {
			const { error } = await supabase.from('site_inventory').insert({
				site_id: id,
				catalog_id: selectedCatalogId,
				quantity: initialQuantity || 0,
				min_threshold: minThreshold || 0,
			});

			if (error) throw error;

			showToast('Insumo adicionado ao estoque!', 'success');
			setShowAddModal(false);

			// Reset form
			setSelectedCatalogId('');
			setInitialQuantity(0);
			setMinThreshold(0);

			fetchInventory();
		} catch (err: any) {
			console.error(err);
			showToast('Erro ao adicionar insumo', 'error');
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
			<div className="space-y-6">
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

				<div className="bg-surface border border-border rounded-xl p-4 sm:p-6 shadow-sm">
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

					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
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
											className="border-b border-border hover:bg-background/50 transition-colors group"
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
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
					onClick={() => setShowAddModal(false)}
				>
					<div
						className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-lg mb-[10vh]"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between p-5 border-b border-border">
							<div>
								<h2 className="text-xl font-bold text-text-main">
									Adicionar Insumo à Obra
								</h2>
								<p className="text-sm text-text-muted mt-1">
									Selecione um insumo global para controlar
									nesta obra.
								</p>
							</div>
							<button
								onClick={() => setShowAddModal(false)}
								className="p-2 text-text-muted hover:text-text-main hover:bg-background rounded-lg transition-colors -mt-4 -mr-2"
							>
								<X size={20} />
							</button>
						</div>

						<form
							className="p-5 space-y-5"
							onSubmit={handleAddInsumo}
						>
							<div>
								<label className="block text-sm font-medium text-text-main mb-1">
									Selecione o Insumo *
								</label>
								<SearchableSelect
									options={catalogs.map((cat) => ({
										value: cat.id,
										label: cat.code
											? `[${cat.code}] ${cat.name}`
											: cat.name,
									}))}
									value={selectedCatalogId}
									onChange={setSelectedCatalogId}
									placeholder="Selecione um insumo..."
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-text-main mb-1">
									Quantidade Inicial
								</label>
								<input
									type="number"
									value={initialQuantity}
									onChange={(e) =>
										setInitialQuantity(
											Number(e.target.value),
										)
									}
									min="0"
									step="0.01"
									className="w-full px-4 py-2.5 bg-background border border-border text-text-main rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-text-main mb-1">
										Preço Médio (R$)
									</label>
									<input
										type="number"
										step="0.01"
										defaultValue="0"
										className="w-full px-4 py-2.5 bg-background border border-border text-text-main rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-text-main mb-1">
										Estoque Mínimo
									</label>
									<input
										type="number"
										value={minThreshold}
										onChange={(e) =>
											setMinThreshold(
												Number(e.target.value),
											)
										}
										min="0"
										step="0.01"
										className="w-full px-4 py-2.5 bg-background border border-border text-text-main rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
									/>
								</div>
							</div>

							<div className="flex justify-end pt-4 gap-3 border-t border-border">
								<button
									type="button"
									onClick={() => setShowAddModal(false)}
									className="px-4 py-2 text-text-muted hover:text-text-main font-medium transition-colors"
								>
									Cancelar
								</button>
								<button
									type="submit"
									disabled={isSubmitting}
									className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-50"
								>
									{isSubmitting
										? 'Adicionando...'
										: 'Adicionar ao Estoque'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</ERPLayout>
	);
}
