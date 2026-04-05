import React, { useState, useEffect, useRef } from 'react';
import { ERPLayout } from '../../../../components/layout/ERPLayout';
import { useParams } from 'react-router-dom';
import {
	Search,
	Plus,
	Shield,
	UserPlus,
	X,
	Filter,
	Settings2,
	ChevronDown,
	Camera,
	Upload,
} from 'lucide-react';
import { supabase } from '../../../../config/supabase';
import { SearchableSelect } from '../../../../components/ui/SearchableSelect';
import { useToast } from '../../../../context/ToastContext';
import { useEscape } from '../../../../hooks/useEscape';

export default function EPisDisponiveis() {
	const { id } = useParams();
	const { showToast } = useToast();
	const [searchTerm, setSearchTerm] = useState('');
	const [showAddModal, setShowAddModal] = useState(false);
	const [showFilters, setShowFilters] = useState(false);

	useEscape(() => setShowAddModal(false));

	const [epis, setEpis] = useState<any[]>([]);
	const [inventoryEpis, setInventoryEpis] = useState<any[]>([]);
	const [selectedInventoryIds, setSelectedInventoryIds] = useState<string[]>(
		[],
	);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [modalSearchTerm, setModalSearchTerm] = useState('');
	const [modalSelectedCategory, setModalSelectedCategory] = useState('');
	const [modalSelectedSubCategory, setModalSelectedSubCategory] =
		useState('');

	// Delivery State
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [showDeliveryModal, setShowDeliveryModal] = useState(false);
	const [selectedEpiForDelivery, setSelectedEpiForDelivery] =
		useState<any>(null);
	const [collaborators, setCollaborators] = useState<any[]>([]);
	const [deliveryData, setDeliveryData] = useState({
		collaborator_id: '',
		quantity: 1,
		withdrawal_date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
		withdrawal_time: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
		photos: [] as File[],
		notes: '',
	});

	const fetchInventoryEpis = async () => {
		if (!id) return;
		try {
			const { data, error } = await supabase
				.from('site_inventory')
				.select(
					`
					id, 
					quantity, 
					catalogs!inner(
						id, 
						name, 
						code, 
						is_tool,
						categories (primary_category, secondary_category)
					)
				`,
				)
				.eq('site_id', id);
			if (error) throw error;

			const epiItems = (data || []).filter(
				(item: any) => item.catalogs && item.catalogs.is_tool === false,
			);
			setInventoryEpis(epiItems);
		} catch (err) {
			console.error(err);
		}
	};

	const fetchEpis = async () => {
		if (!id) return;
		try {
			const { data: epiData, error: epiError } = await supabase
				.from('site_epis')
				.select(
					'id, inventory_id, site_inventory(quantity, min_threshold, catalogs(id, name, code))',
				)
				.eq('site_id', id);
			if (epiError) throw epiError;

			const episWithAvailability = (epiData || []).map((epi: any) => {
				const total = epi.site_inventory?.quantity || 0;
				const min = epi.site_inventory?.min_threshold || 0;
				return {
					...epi,
					available_quantity: total,
					min_threshold: min,
				};
			});

			setEpis(episWithAvailability);
		} catch (err) {
			console.error(err);
		}
	};

	const fetchColaboradores = async () => {
		if (!id) return;
		try {
			const { data, error } = await supabase
				.from('site_collaborators')
				.select('collaborators (id, name, document, role_title)')
				.eq('site_id', id);
			if (error) throw error;
			const formattedColabs = (data || [])
				.map((item: any) => item.collaborators)
				.filter(Boolean);
			setCollaborators(formattedColabs);
		} catch (err) {
			console.error(err);
		}
	};

	useEffect(() => {
		fetchEpis();
		fetchInventoryEpis();
		fetchColaboradores();
	}, [id]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (selectedInventoryIds.length === 0) {
			showToast('Selecione pelo menos um EPI', 'error');
			return;
		}
		setIsSubmitting(true);
		try {
			const itemsToInsert = selectedInventoryIds.map((invId) => ({
				site_id: id,
				inventory_id: invId,
			}));

			const { error } = await supabase
				.from('site_epis')
				.insert(itemsToInsert);
			if (error) {
				if (error.code === '42P01') {
					showToast(
						'Por favor, execute o script SQL para criar as tabelas de vínculo!',
						'error',
					);
				} else {
					throw error;
				}
				return;
			}
			showToast(
				`${selectedInventoryIds.length} EPI(s) adicionado(s) à lista`,
				'success',
			);
			setShowAddModal(false);
			setSelectedInventoryIds([]);
			fetchEpis();
		} catch (err: any) {
			console.error(err);
			showToast('Erro ao adicionar EPI', 'error');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeliverySubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!deliveryData.collaborator_id || deliveryData.quantity < 1) return;
		setIsSubmitting(true);
		try {
			const { data: userData } = await supabase.auth.getUser();
			const userId = userData?.user?.id;
			if (!userId) throw new Error('Usuário não autenticado');

			let photoUrl = null;
			if (deliveryData.photos && deliveryData.photos.length > 0) {
				const urls = [];
				for (const file of deliveryData.photos) {
					const ext = file.name.split('.').pop();
					const filename = `epis/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
					const { error: uploadErr } = await supabase.storage
						.from('ferramentas-fotos')
						.upload(filename, file);
					if (uploadErr) throw uploadErr;
					const { data: publicUrlData } = supabase.storage
						.from('ferramentas-fotos')
						.getPublicUrl(filename);
					urls.push(publicUrlData.publicUrl);
				}
				photoUrl = urls.join(',');
			}

			const { error } = await supabase.from('epi_withdrawals').insert({
				site_id: id,
				collaborator_id: deliveryData.collaborator_id,
				catalog_id: selectedEpiForDelivery.catalog_id,
				withdrawn_by: userId,
				quantity: deliveryData.quantity,
				withdrawal_date: `${deliveryData.withdrawal_date}T${deliveryData.withdrawal_time}:00`,
				notes: deliveryData.notes,
				photo_url: photoUrl,
			});

			if (error) throw error;

			const newQuantity =
				selectedEpiForDelivery.available - deliveryData.quantity;
			const { error: invError } = await supabase
				.from('site_inventory')
				.update({ quantity: newQuantity })
				.eq('id', selectedEpiForDelivery.inventory_id);

			if (invError) throw invError;

			// Registrar movimento no histórico de estoque (opcional, mas recomendado)
			await supabase.from('site_movements').insert({
				site_id: id,
				inventory_id: selectedEpiForDelivery.inventory_id,
				type: 'OUT',
				quantity: deliveryData.quantity,
				date: `${deliveryData.withdrawal_date}T${deliveryData.withdrawal_time}:00`,
				reason: `Entrega de EPI para colaborador (Ref: ${deliveryData.collaborator_id})`,
				registered_by: userId,
			});

			showToast('EPI entregue com sucesso', 'success');
			setShowDeliveryModal(false);
			fetchEpis();
		} catch (err) {
			console.error(err);
			showToast('Erro ao entregar EPI', 'error');
		} finally {
			setIsSubmitting(false);
		}
	};

	const getStockColor = (disp: number, minThr: number) => {
		if (disp === 0) return 'text-red-500 bg-red-500/10 font-bold';
		if (minThr > 0 && disp <= minThr)
			return 'text-yellow-600 bg-yellow-500/20 font-bold';
		return 'text-green-600 bg-green-500/10 font-bold';
	};

	const availableInventoryInfos = inventoryEpis.filter(
		(inv) => !epis.some((e) => e.inventory_id === inv.id),
	);

	const uniqueCategories = Array.from(
		new Set(
			availableInventoryInfos
				.map((inv) => inv.catalogs?.categories?.primary_category)
				.filter(Boolean),
		),
	) as string[];

	const uniqueSubCategories = Array.from(
		new Set(
			availableInventoryInfos
				.filter(
					(inv) =>
						!modalSelectedCategory ||
						inv.catalogs?.categories?.primary_category ===
							modalSelectedCategory,
				)
				.map((inv) => inv.catalogs?.categories?.secondary_category)
				.filter(Boolean),
		),
	) as string[];

	return (
		<ERPLayout>
			<div className="space-y-6 flex flex-col h-full relative w-full">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div>
						<h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
							<Shield className="text-primary" /> EPIs Disponíveis
						</h1>
						<p className="text-text-muted mt-1">
							Gestão de Equipamentos de Proteção Individual na
							obra
						</p>
					</div>
					<button
						onClick={() => setShowAddModal(true)}
						className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
					>
						<Plus size={20} />
						<span>Novo EPI</span>
					</button>
				</div>

				<div className="bg-surface border border-border rounded-sm shadow-sm p-4 sm:p-6 overflow-hidden">
					<div className="flex flex-col sm:flex-row gap-4 mb-2">
						<div className="relative flex-1">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Search size={18} className="text-text-muted" />
							</div>
							<input
								type="text"
								placeholder="Buscar EPI..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary transition-colors"
							/>
						</div>
						<div className="relative flex gap-2">
							<button
								onClick={() => setShowFilters(!showFilters)}
								className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showFilters ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-text-main hover:border-primary/50'}`}
							>
								<Settings2 size={20} />
								<span>Filtros</span>
							</button>
							{showFilters && (
								<div className="absolute right-0 top-full mt-2 w-72 bg-surface border border-border rounded-xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2 text-left">
									<h3 className="text-sm font-medium mb-3 text-text-main border-b border-border pb-2">
										Filtros
									</h3>
									<div className="space-y-4">
										<div>
											<label className="block text-xs font-medium text-text-muted mb-1">
												Categoria
											</label>
											<select className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:border-primary text-text-main">
												<option>Todas</option>
											</select>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[500px]">
						{epis.length === 0 ? (
							<div className="col-span-full py-8 text-center text-text-muted">
								Nenhum EPI cadastrado nesta lista ainda.
							</div>
						) : (
							epis.map((epi) => {
								const nome =
									epi.site_inventory?.catalogs?.name ||
									'Desconhecido';
								const codigo =
									epi.site_inventory?.catalogs?.code || '';
								const dispQtd = epi.available_quantity || 0;
								const minThr = epi.min_threshold || 0;
								return (
									<div
										key={epi.id}
										className="bg-background border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
									>
										<div className="flex justify-between items-start mb-4 gap-2">
											<div>
												<h3 className="font-semibold text-text-main">
													{nome}
												</h3>
												<p className="text-sm text-text-muted">
													{codigo}
												</p>
											</div>
											<div
												className={`px-2 py-1 rounded-md text-sm text-center ${getStockColor(dispQtd, minThr)} whitespace-nowrap`}
											>
												{dispQtd} Disponíve
												{dispQtd === 1 ? 'l' : 'is'}
											</div>
										</div>
										<div className="flex gap-2 mt-4">
											<button
												className="flex-1 text-center py-2 text-sm font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
												disabled={dispQtd === 0}
												onClick={() => {
													setSelectedEpiForDelivery({
														id: epi.id,
														inventory_id:
															epi.inventory_id,
														catalog_id:
															epi.site_inventory
																?.catalogs?.id,
														name: nome,
														available: dispQtd,
													});
													setDeliveryData({
														...deliveryData,
														quantity: 1,
														withdrawal_date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
														withdrawal_time: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
														photos: [],
														notes: '',
													});
													setShowDeliveryModal(true);
												}}
											>
												<div className="flex items-center justify-center gap-2">
													<UserPlus size={16} />{' '}
													Entregar ao Colaborador
												</div>
											</button>
										</div>
									</div>
								);
							})
						)}
					</div>
				</div>
			</div>

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
									Adicionar EPI à Obra
								</h2>
								<p className="text-sm text-text-muted mt-1">
									Selecione EPIs do almoxarifado.
								</p>
							</div>
							<button
								onClick={() => setShowAddModal(false)}
								className="p-2 text-text-muted hover:text-text-main hover:bg-background rounded-lg transition-colors -mt-4 -mr-2"
							>
								<X size={20} />
							</button>
						</div>
						<form className="p-5 space-y-5" onSubmit={handleSubmit}>
							<div>
								<div className="flex justify-between items-center mb-2">
									<label className="block text-sm font-medium text-text-main">
										EPIs Encontrados no Almoxarifado
									</label>
									<button
										type="button"
										className="text-xs text-primary hover:underline font-medium"
										onClick={() => {
											const filtered =
												inventoryEpis.filter(
													(inv) =>
														!epis.some(
															(f) =>
																f.inventory_id ===
																inv.id,
														) &&
														((
															inv.catalogs
																?.name || ''
														)
															.toLowerCase()
															.includes(
																modalSearchTerm.toLowerCase(),
															) ||
															(
																inv.catalogs
																	?.code || ''
															)
																.toLowerCase()
																.includes(
																	modalSearchTerm.toLowerCase(),
																)) &&
														(!modalSelectedCategory ||
															inv.catalogs
																?.categories
																?.primary_category ===
																modalSelectedCategory) &&
														(!modalSelectedSubCategory ||
															inv.catalogs
																?.categories
																?.secondary_category ===
																modalSelectedSubCategory),
												);
											if (
												selectedInventoryIds.length ===
													filtered.length &&
												filtered.length > 0
											)
												setSelectedInventoryIds([]);
											else
												setSelectedInventoryIds(
													filtered.map((i) => i.id),
												);
										}}
									>
										Selecionar / Desmarcar Todos
									</button>
								</div>
								<div className="flex gap-2 mb-3">
									<select
										value={modalSelectedCategory}
										onChange={(e) => {
											setModalSelectedCategory(
												e.target.value,
											);
											setModalSelectedSubCategory('');
										}}
										className="w-1/2 px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary transition-colors"
									>
										<option value="">
											Todas as Categorias
										</option>
										{uniqueCategories.map((cat) => (
											<option key={cat} value={cat}>
												{cat}
											</option>
										))}
									</select>
									<select
										value={modalSelectedSubCategory}
										onChange={(e) =>
											setModalSelectedSubCategory(
												e.target.value,
											)
										}
										className="w-1/2 px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary transition-colors"
										disabled={
											!modalSelectedCategory ||
											uniqueSubCategories.length === 0
										}
									>
										<option value="">
											Todas as Subcategorias
										</option>
										{uniqueSubCategories.map((sub) => (
											<option key={sub} value={sub}>
												{sub}
											</option>
										))}
									</select>
								</div>
								<div className="relative mb-3">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<Search
											size={16}
											className="text-text-muted"
										/>
									</div>
									<input
										type="text"
										placeholder="Filtrar por nome ou código..."
										value={modalSearchTerm}
										onChange={(e) =>
											setModalSearchTerm(e.target.value)
										}
										className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary transition-colors"
									/>
								</div>
								<div className="max-h-60 overflow-y-auto border border-border rounded-lg bg-background p-2 space-y-1">
									{inventoryEpis
										.filter(
											(inv) =>
												!epis.some(
													(f) =>
														f.inventory_id ===
														inv.id,
												) &&
												((inv.catalogs?.name || '')
													.toLowerCase()
													.includes(
														modalSearchTerm.toLowerCase(),
													) ||
													(inv.catalogs?.code || '')
														.toLowerCase()
														.includes(
															modalSearchTerm.toLowerCase(),
														)) &&
												(!modalSelectedCategory ||
													inv.catalogs?.categories
														?.primary_category ===
														modalSelectedCategory) &&
												(!modalSelectedSubCategory ||
													inv.catalogs?.categories
														?.secondary_category ===
														modalSelectedSubCategory),
										)
										.map((inv) => {
											const isSelected =
												selectedInventoryIds.includes(
													inv.id,
												);
											return (
												<label
													key={inv.id}
													className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 border-primary/20' : 'hover:bg-surface border-transparent'} border`}
												>
													<div className="flex items-center h-5">
														<input
															type="checkbox"
															className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
															checked={isSelected}
															onChange={(e) => {
																if (
																	e.target
																		.checked
																)
																	setSelectedInventoryIds(
																		(
																			prev,
																		) => [
																			...prev,
																			inv.id,
																		],
																	);
																else
																	setSelectedInventoryIds(
																		(
																			prev,
																		) =>
																			prev.filter(
																				(
																					id,
																				) =>
																					id !==
																					inv.id,
																			),
																	);
															}}
														/>
													</div>
													<div className="flex flex-col">
														<span className="text-sm font-medium text-text-main">
															{inv.catalogs?.name}
														</span>
														<span className="text-xs text-text-muted flex gap-2">
															{inv.catalogs
																?.code && (
																<span>
																	Código:{' '}
																	{
																		inv
																			.catalogs
																			.code
																	}
																</span>
															)}
															{inv.catalogs
																?.categories
																?.primary_category && (
																<span className="bg-background rounded px-1.5 py-0.5 border border-border">
																	Cat:{' '}
																	{
																		inv
																			.catalogs
																			.categories
																			.primary_category
																	}
																</span>
															)}
														</span>
													</div>
												</label>
											);
										})}
									{inventoryEpis.filter(
										(inv) =>
											!epis.some(
												(f) =>
													f.inventory_id === inv.id,
											),
									).length === 0 && (
										<div className="text-center py-4 text-sm text-text-muted">
											Nenhum EPI disponível no
											almoxarifado.
										</div>
									)}
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
									disabled={
										isSubmitting ||
										selectedInventoryIds.length === 0
									}
									className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
								>
									{isSubmitting
										? 'Adicionando...'
										: `Adicionar Selecionados (${selectedInventoryIds.length})`}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{showDeliveryModal && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
					onClick={() => setShowDeliveryModal(false)}
				>
					<div
						className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between p-5 border-b border-border">
							<div>
								<h2 className="text-xl font-bold text-text-main">
									Entregar EPI
								</h2>
								<p className="text-sm text-text-muted mt-1">
									{selectedEpiForDelivery?.name}
								</p>
							</div>
							<button
								onClick={() => setShowDeliveryModal(false)}
								className="p-2 text-text-muted hover:text-text-main hover:bg-background rounded-lg transition-colors -mt-4 -mr-2"
							>
								<X size={20} />
							</button>
						</div>
						<form
							className="p-5 space-y-5"
							onSubmit={handleDeliverySubmit}
						>
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-text-main mb-1">
										Colaborador
									</label>
									<SearchableSelect
										options={collaborators.map((c) => ({
											value: c.id,
											label: `${c.name} - ${c.role_title || c.document}`,
											searchValue: `${c.name} ${c.role_title} ${c.document}`,
										}))}
										value={deliveryData.collaborator_id}
										onChange={(val) =>
											setDeliveryData({
												...deliveryData,
												collaborator_id: val,
											})
										}
										placeholder="Selecione um colaborador"
										required
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-text-main mb-1">
											Data
										</label>
										<input
											type="date"
											value={deliveryData.withdrawal_date}
											onChange={(e) =>
												setDeliveryData({
													...deliveryData,
													withdrawal_date:
														e.target.value,
												})
											}
											className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary"
											required
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-text-main mb-1">
											Hora
										</label>
										<input
											type="time"
											value={deliveryData.withdrawal_time}
											onChange={(e) =>
												setDeliveryData({
													...deliveryData,
													withdrawal_time:
														e.target.value,
												})
											}
											className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary"
											required
										/>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-text-main mb-1">
										Quantidade
									</label>
									<input
										type="number"
										min="1"
										max={
											selectedEpiForDelivery?.available ||
											1
										}
										value={deliveryData.quantity}
										onChange={(e) =>
											setDeliveryData({
												...deliveryData,
												quantity: parseInt(
													e.target.value,
												),
											})
										}
										className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary"
										required
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-text-main mb-1">
										Observações (Opcional)
									</label>
									<textarea
										value={deliveryData.notes}
										onChange={(e) =>
											setDeliveryData({
												...deliveryData,
												notes: e.target.value,
											})
										}
										placeholder="Detalhes adicionais..."
										className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary resize-none"
										rows={2}
									></textarea>
								</div>

								<div>
									<label className="block text-sm font-medium text-text-main mb-1">
										Fotos (Opcional)
									</label>
									<input
										type="file"
										accept="image/*"
										multiple
										ref={fileInputRef}
										onChange={(e) => {
											if (e.target.files?.length) {
												setDeliveryData({
													...deliveryData,
													photos: [
														...deliveryData.photos,
														...Array.from(
															e.target.files,
														),
													],
												});
											}
											if (fileInputRef.current)
												fileInputRef.current.value = '';
										}}
										className="hidden"
									/>
									<input
										type="file"
										accept="image/*"
										capture="environment"
										id="cameraInput"
										onChange={(e) => {
											if (e.target.files?.length) {
												setDeliveryData({
													...deliveryData,
													photos: [
														...deliveryData.photos,
														...Array.from(
															e.target.files,
														),
													],
												});
											}
											const cameraInput =
												document.getElementById(
													'cameraInput',
												) as HTMLInputElement | null;
											if (cameraInput)
												cameraInput.value = '';
										}}
										className="hidden"
									/>

									<div className="flex gap-2 w-full mb-3">
										<button
											type="button"
											onClick={() =>
												document
													.getElementById(
														'cameraInput',
													)
													?.click()
											}
											className="flex-1 flex flex-col items-center justify-center gap-2 py-4 border-2 border-dashed border-border rounded-lg text-text-muted hover:text-primary hover:border-primary hover:bg-primary/5 transition-colors"
										>
											<Camera size={24} />
											<span className="text-sm font-medium">
												Tirar Foto
											</span>
										</button>
										<button
											type="button"
											onClick={() =>
												fileInputRef.current?.click()
											}
											className="flex-1 flex flex-col items-center justify-center gap-2 py-4 border-2 border-dashed border-border rounded-lg text-text-muted hover:text-primary hover:border-primary hover:bg-primary/5 transition-colors"
										>
											<Upload size={24} />
											<span className="text-sm font-medium">
												Anexar Arquivos
											</span>
										</button>
									</div>

									{deliveryData.photos.length > 0 && (
										<div className="space-y-2 mt-2">
											{deliveryData.photos.map(
												(file, index) => (
													<div
														key={`${file.name}-${index}`}
														className="flex items-center justify-between p-3 border border-border rounded-lg bg-background"
													>
														<div className="flex items-center gap-2 overflow-hidden">
															<Camera
																size={16}
																className="text-primary shrink-0"
															/>
															<span className="text-sm text-text-main truncate">
																{file.name}
															</span>
														</div>
														<button
															type="button"
															onClick={() => {
																const newPhotos =
																	[
																		...deliveryData.photos,
																	];
																newPhotos.splice(
																	index,
																	1,
																);
																setDeliveryData(
																	{
																		...deliveryData,
																		photos: newPhotos,
																	},
																);
															}}
															className="p-1 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
														>
															<X size={16} />
														</button>
													</div>
												),
											)}
										</div>
									)}
								</div>
							</div>

							<div className="flex justify-end pt-4 gap-3 border-t border-border">
								<button
									type="button"
									onClick={() => setShowDeliveryModal(false)}
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
										? 'Registrando...'
										: 'Entregar EPI'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</ERPLayout>
	);
}
