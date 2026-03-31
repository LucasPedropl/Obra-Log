import React, { useState, useEffect, useRef } from 'react';
import { ERPLayout } from '../../../../components/layout/ERPLayout';
import { supabase } from '../../../../config/supabase';
import {
	Search,
	Plus,
	Truck,
	Camera,
	X,
	ChevronDown,
	Settings2,
	Loader2,
	Image as ImageIcon,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useToast } from '../../../../context/ToastContext';

const normalizeString = (str: string) =>
	str
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();

export default function EquipAlugadosAtivos() {
	const { id: siteId } = useParams();
	const { showToast } = useToast();

	const [equipamentos, setEquipamentos] = useState<any[]>([]);
	const [categorias, setCategorias] = useState<any[]>([]);
	const [unidades, setUnidades] = useState<any[]>([]);

	const [loading, setLoading] = useState(false);
	const [fetching, setFetching] = useState(true);
	const [saving, setSaving] = useState(false);

	const [searchTerm, setSearchTerm] = useState('');
	const [showFilters, setShowFilters] = useState(false);
	const [filterStatus, setFilterStatus] = useState('Todos');

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDevolucaoModalOpen, setIsDevolucaoModalOpen] = useState(false);
	const [selectedEquip, setSelectedEquip] = useState<any>(null);

	const [formData, setFormData] = useState({
		name: '',
		category_id: '',
		unit_id: '',
		quantity: 1,
		supplier: '',
		description: '',
	});

	const [loanDate, setLoanDate] = useState('');
	const [loanTime, setLoanTime] = useState('');

	const [loanPhotos, setLoanPhotos] = useState<File[]>([]);
	const [returnPhotos, setReturnPhotos] = useState<File[]>([]);

	const [returnDate, setReturnDate] = useState('');
	const [returnTime, setReturnTime] = useState('');
	const [returnNotes, setReturnNotes] = useState('');

	const [catSearch, setCatSearch] = useState('');
	const [catOpen, setCatOpen] = useState(false);
	const [catModalOpen, setCatModalOpen] = useState(false);
	const [newCatData, setNewCatData] = useState({
		primary_category: '',
		secondary_category: '',
		entry_type: 'PRODUTO',
	});
	const catRef = useRef<HTMLDivElement>(null);

	const [unitSearch, setUnitSearch] = useState('');
	const [unitOpen, setUnitOpen] = useState(false);
	const [unitModalOpen, setUnitModalOpen] = useState(false);
	const [newUnitData, setNewUnitData] = useState({
		name: '',
		abbreviation: '',
	});
	const unitRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (siteId) fetchData();

		const handleClickOutside = (e: MouseEvent) => {
			if (catRef.current && !catRef.current.contains(e.target as Node))
				setCatOpen(false);
			if (unitRef.current && !unitRef.current.contains(e.target as Node))
				setUnitOpen(false);
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () =>
			document.removeEventListener('mousedown', handleClickOutside);
	}, [siteId]);

	useEffect(() => {
		if (isModalOpen) {
			const now = new Date();
			setLoanDate(now.toISOString().split('T')[0]);
			setLoanTime(now.toTimeString().slice(0, 5));
		}
	}, [isModalOpen]);

	useEffect(() => {
		if (isDevolucaoModalOpen) {
			const now = new Date();
			setReturnDate(now.toISOString().split('T')[0]);
			setReturnTime(now.toTimeString().slice(0, 5));
		}
	}, [isDevolucaoModalOpen]);

	const fetchData = async () => {
		setFetching(true);
		try {
			const companyId = localStorage.getItem('selectedCompanyId');
			if (!companyId) return;

			const [catRes, unRes, equipRes] = await Promise.all([
				supabase
					.from('categories')
					.select('*')
					.or(`company_id.eq.${companyId},company_id.is.null`),
				supabase
					.from('measurement_units')
					.select('*')
					.or(`company_id.eq.${companyId},company_id.is.null`),
				supabase
					.from('rented_equipments')
					.select(`*, site_inventory!inner(*, catalogs(*))`)
					.eq('site_id', siteId)
					.is('exit_date', null)
					.order('entry_date', { ascending: false }),
			]);

			if (!catRes.error && catRes.data) setCategorias(catRes.data);
			if (!unRes.error && unRes.data) setUnidades(unRes.data);
			if (!equipRes.error && equipRes.data)
				setEquipamentos(equipRes.data);
		} catch (err) {
			console.error(err);
		} finally {
			setFetching(false);
		}
	};

	const handleSaveCategory = async () => {
		try {
			const companyId = localStorage.getItem('selectedCompanyId');
			if (!companyId || !newCatData.primary_category.trim()) return;

			const { data, error } = await supabase
				.from('categories')
				.insert({
					company_id: companyId,
					primary_category: newCatData.primary_category.trim(),
					secondary_category:
						newCatData.secondary_category.trim() || null,
					entry_type: newCatData.entry_type,
				})
				.select()
				.single();

			if (error) throw error;
			setCategorias([...categorias, data]);
			setFormData({ ...formData, category_id: data.id });
			setCatModalOpen(false);
			setNewCatData({
				primary_category: '',
				secondary_category: '',
				entry_type: 'PRODUTO',
			});
			showToast('Categoria salva!', 'success');
		} catch (error) {
			showToast('Erro ao criar categoria', 'error');
		}
	};

	const handleSaveUnit = async () => {
		try {
			const companyId = localStorage.getItem('selectedCompanyId');
			if (
				!companyId ||
				!newUnitData.name.trim() ||
				!newUnitData.abbreviation.trim()
			)
				return;

			const { data, error } = await supabase
				.from('measurement_units')
				.insert({
					company_id: companyId,
					name: newUnitData.name.trim(),
					abbreviation: newUnitData.abbreviation.trim().toUpperCase(),
				})
				.select()
				.single();

			if (error) throw error;
			setUnidades([...unidades, data]);
			setFormData({ ...formData, unit_id: data.id });
			setUnitModalOpen(false);
			setNewUnitData({ name: '', abbreviation: '' });
			showToast('Unidade salva!', 'success');
		} catch (error) {
			showToast('Erro ao criar unidade', 'error');
		}
	};

	const uploadPhotos = async (
		files: File[],
		bucket: string = 'ferramentas-fotos',
	): Promise<string[]> => {
		const urls: string[] = [];
		for (const file of files) {
			const fileExt = file.name.split('.').pop();
			const fileName = `${Math.random()}.${fileExt}`;
			const { error } = await supabase.storage
				.from(bucket)
				.upload(fileName, file);
			if (!error) {
				const { data } = supabase.storage
					.from(bucket)
					.getPublicUrl(fileName);
				urls.push(data.publicUrl);
			}
		}
		return urls;
	};

	const handlePhotoChange = (
		e: React.ChangeEvent<HTMLInputElement>,
		isReturn = false,
	) => {
		if (e.target.files) {
			const newFiles = Array.from(e.target.files);
			if (isReturn) setReturnPhotos([...returnPhotos, ...newFiles]);
			else setLoanPhotos([...loanPhotos, ...newFiles]);
		}
	};

	const removePhoto = (index: number, isReturn: boolean) => {
		if (isReturn) {
			setReturnPhotos((prev) => prev.filter((_, i) => i !== index));
		} else {
			setLoanPhotos((prev) => prev.filter((_, i) => i !== index));
		}
	};

	const handleNovaLocacao = async () => {
		if (
			!formData.name ||
			!formData.category_id ||
			!formData.unit_id ||
			!loanDate ||
			!loanTime ||
			!formData.supplier ||
			formData.quantity <= 0
		) {
			showToast('Preencha os campos obrigatórios.', 'error');
			return;
		}

		setSaving(true);
		try {
			const companyId = localStorage.getItem('selectedCompanyId');

			const { data: catalogData, error: catErr } = await supabase
				.from('catalogs')
				.insert({
					company_id: companyId,
					name: formData.name,
					category_id: formData.category_id,
					unit_id: formData.unit_id,
					is_rented_equipment: true,
				})
				.select()
				.single();
			if (catErr) throw catErr;

			const { data: invData, error: invErr } = await supabase
				.from('site_inventory')
				.insert({
					site_id: siteId,
					catalog_id: catalogData.id,
					quantity: formData.quantity,
				})
				.select()
				.single();
			if (invErr) throw invErr;

			let photoUrls = '';
			if (loanPhotos.length > 0)
				photoUrls = (await uploadPhotos(loanPhotos)).join(',');

			const entryDateTime = new Date(
				`${loanDate}T${loanTime}:00`,
			).toISOString();

			const { error: rentErr } = await supabase
				.from('rented_equipments')
				.insert({
					site_id: siteId,
					inventory_id: invData.id,
					supplier: formData.supplier,
					quantity: formData.quantity,
					entry_date: entryDateTime,
					description: formData.description,
					entry_photos_url: photoUrls,
					status: 'ACTIVE',
				});
			if (rentErr) throw rentErr;

			showToast('Locação registrada!', 'success');
			setIsModalOpen(false);
			setFormData({
				name: '',
				category_id: '',
				unit_id: '',
				quantity: 1,
				supplier: '',
				description: '',
			});
			setLoanPhotos([]);
			fetchData();
		} catch (error) {
			showToast('Erro ao processar', 'error');
		} finally {
			setSaving(false);
		}
	};

	const confirmarDevolucao = async () => {
		if (!returnDate || !returnTime)
			return showToast('Preencha a data e hora.', 'error');
		setSaving(true);

		try {
			let photoUrls = '';
			if (returnPhotos.length > 0)
				photoUrls = (await uploadPhotos(returnPhotos)).join(',');

			const exitDateTime = new Date(
				`${returnDate}T${returnTime}:00`,
			).toISOString();
			const desc = selectedEquip.description
				? `${selectedEquip.description} | Devolução: ${returnNotes}`
				: `Devolução: ${returnNotes}`;

			const { error: rentErr } = await supabase
				.from('rented_equipments')
				.update({
					status: 'RETURNED',
					exit_date: exitDateTime,
					exit_photos_url: photoUrls,
					description: desc,
				})
				.eq('id', selectedEquip.id);
			if (rentErr) throw rentErr;

			const { data: inventoryData } = await supabase
				.from('site_inventory')
				.select('quantity')
				.eq('id', selectedEquip.inventory_id)
				.single();
			if (inventoryData) {
				const newQty = Math.max(
					0,
					inventoryData.quantity - selectedEquip.quantity,
				);
				await supabase
					.from('site_inventory')
					.update({ quantity: newQty })
					.eq('id', selectedEquip.inventory_id);
			}

			showToast('Devolvido com sucesso!', 'success');
			setIsDevolucaoModalOpen(false);
			fetchData();
		} catch (err) {
			showToast('Erro ao devolver', 'error');
		} finally {
			setSaving(false);
		}
	};

	const filteredList = equipamentos.filter((eq) => {
		const nameNorm = normalizeString(
			eq.site_inventory?.catalogs?.name || '',
		);
		const matchesSearch =
			nameNorm.includes(normalizeString(searchTerm)) ||
			normalizeString(eq.supplier || '').includes(
				normalizeString(searchTerm),
			);
		const matchesStatus =
			filterStatus === 'Todos' ||
			(filterStatus === 'Ativa' && eq.status === 'ACTIVE') ||
			(filterStatus === 'Devolvida' && eq.status === 'RETURNED');
		return matchesSearch && matchesStatus;
	});

	const searchCatNorm = normalizeString(catSearch);
	const filteredCats = categorias.filter(
		(c) =>
			normalizeString(c.primary_category).includes(searchCatNorm) ||
			(c.secondary_category &&
				normalizeString(c.secondary_category).includes(searchCatNorm)),
	);
	const globais = filteredCats.filter((c) => !c.company_id);
	const locais = filteredCats.filter((c) => c.company_id);

	const searchUnitNorm = normalizeString(unitSearch);
	const filteredUnits = unidades.filter(
		(u) =>
			normalizeString(u.name).includes(searchUnitNorm) ||
			normalizeString(u.abbreviation).includes(searchUnitNorm),
	);
	const globaisUnits = filteredUnits.filter((u) => !u.company_id);
	const locaisUnits = filteredUnits.filter((u) => u.company_id);

	return (
		<ERPLayout>
			<div className="space-y-6 flex flex-col h-full relative w-full">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div>
						<h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
							<Truck className="text-primary" /> Equipamentos
							Alugados
						</h1>
						<p className="text-text-muted mt-1">
							Gestão de locações e devoluções na obra
						</p>
					</div>
					<button
						onClick={() => setIsModalOpen(true)}
						className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
					>
						<Plus size={20} />
						<span>Nova Locação</span>
					</button>
				</div>

				<div className="bg-surface border border-border rounded-lg shadow-sm p-4 sm:p-6 overflow-hidden">
					<div className="flex flex-col sm:flex-row gap-4 mb-6">
						<div className="relative flex-1">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Search size={18} className="text-text-muted" />
							</div>
							<input
								type="text"
								placeholder="Buscar locação por nome ou fornecedor..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary"
							/>
						</div>
						<div className="relative flex gap-2">
							<button
								onClick={() => setShowFilters(!showFilters)}
								className={`flex items-center gap-2 px-4 py-2 rounded-lg border \${showFilters ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-text-main hover:border-primary/50'}`}
							>
								<Settings2 size={20} />
								<span>Filtros</span>
							</button>
							{showFilters && (
								<div className="absolute right-0 top-full mt-2 w-72 bg-surface border border-border rounded-xl shadow-xl z-50 p-4">
									<h3 className="text-sm font-medium mb-3 border-b border-border pb-2">
										Filtros
									</h3>
									<div>
										<label className="block text-xs font-medium text-text-muted mb-1">
											Status da Locação
										</label>
										<select
											value={filterStatus}
											onChange={(e) =>
												setFilterStatus(e.target.value)
											}
											className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md"
										>
											<option>Todos</option>
											<option>Ativa</option>
											<option>Devolvida</option>
										</select>
									</div>
								</div>
							)}
						</div>
					</div>

					<div className="overflow-x-auto bg-surface border border-border rounded-lg">
						<table className="w-full text-left [&_th]:border-b [&_th]:border-border [&_td]:border-b [&_td]:border-border [&_tbody_tr:last-child_td]:border-b-0">
							<thead>
								<tr className="border-b border-border bg-background/50">
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Status
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Equipamento / Fornecedor
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted text-center">
										Qtd
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Data Entrada
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Data Saída
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted text-center">
										Fotos
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted text-right">
										Ações
									</th>
								</tr>
							</thead>
							<tbody>
								{fetching ? (
									<tr>
										<td
											colSpan={7}
											className="py-8 text-center text-text-muted"
										>
											<Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
											Carregando...
										</td>
									</tr>
								) : filteredList.length === 0 ? (
									<tr>
										<td
											colSpan={7}
											className="py-12 text-center text-text-muted"
										>
											Nenhum equipamento encontrado.
										</td>
									</tr>
								) : (
									filteredList.map((item) => {
										const catMap =
											item.site_inventory?.catalogs || {};
										const numFotos = item.entry_photos_url
											? item.entry_photos_url
													.split(',')
													.filter((u: any) => u)
													.length
											: 0;
										return (
											<tr
												key={item.id}
												className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
											>
												<td className="py-3 px-4">
													<span
														className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium border \${item.status === 'RETURNED' ? 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}
													>
														{item.status ===
														'RETURNED'
															? 'Devolvido'
															: 'Ativa'}
													</span>
												</td>
												<td className="py-3 px-4">
													<div className="font-medium">
														{catMap.name}
													</div>
													<div className="text-xs text-text-muted">
														{item.supplier}
													</div>
												</td>
												<td className="py-3 px-4 text-center font-medium">
													{item.quantity}
												</td>
												<td className="py-3 px-4 text-sm">
													{item.entry_date
														? new Date(
																item.entry_date,
															).toLocaleString(
																'pt-BR',
																{
																	dateStyle:
																		'short',
																	timeStyle:
																		'short',
																},
															)
														: '-'}
												</td>
												<td className="py-3 px-4 text-sm text-text-muted">
													{item.exit_date
														? new Date(
																item.exit_date,
															).toLocaleString(
																'pt-BR',
																{
																	dateStyle:
																		'short',
																	timeStyle:
																		'short',
																},
															)
														: '-'}
												</td>
												<td className="py-3 px-4 text-center">
													{numFotos > 0 && (
														<span className="text-primary font-medium text-sm flex items-center justify-center gap-1">
															{numFotos}
															<ImageIcon
																size={14}
															/>
														</span>
													)}
												</td>
												<td className="py-3 px-4 text-right">
													{item.status ===
														'ACTIVE' && (
														<button
															onClick={() => {
																setSelectedEquip(
																	item,
																);
																setIsDevolucaoModalOpen(
																	true,
																);
																setReturnPhotos(
																	[],
																);
																setReturnNotes(
																	'',
																);
															}}
															className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-1.5 rounded-lg text-sm border border-primary/20"
														>
															Devolver
														</button>
													)}
												</td>
											</tr>
										);
									})
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{isModalOpen && (
				<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
					<div className="bg-surface w-full max-w-2xl rounded-xl shadow-xl flex flex-col max-h-[90vh]">
						<div className="flex justify-between items-center p-6 border-b border-border">
							<h2 className="text-xl font-bold">Nova Locação</h2>
							<button
								onClick={() => setIsModalOpen(false)}
								disabled={saving}
							>
								<X size={24} />
							</button>
						</div>
						<div className="p-6 overflow-y-auto space-y-6">
							<div>
								<label className="block text-sm font-medium mb-1">
									Equipamento *
								</label>
								<input
									type="text"
									value={formData.name}
									onChange={(e) =>
										setFormData({
											...formData,
											name: e.target.value,
										})
									}
									className="w-full px-4 py-2 bg-background border border-border rounded-lg"
								/>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="relative" ref={catRef}>
									<label className="block text-sm font-medium mb-1">
										Categoria *
									</label>
									<div
										className="w-full px-4 py-2 bg-background border border-border rounded-lg flex items-center justify-between cursor-pointer"
										onClick={() => setCatOpen(!catOpen)}
									>
										<span className="truncate">
											{formData.category_id ? (() => { 
    const cat = categorias.find(c => c.id === formData.category_id);
    if (!cat) return 'Selecione...';
    return cat.secondary_category ? cat.primary_category + ' (' + cat.secondary_category + ')' : cat.primary_category;
})() : 'Selecione...'}
										</span>
										<ChevronDown size={16} />
									</div>
									{catOpen && (
										<div className="absolute top-full left-0 z-[65] mt-1 w-full bg-surface border border-border rounded-lg shadow-xl overflow-hidden">
											<div className="p-2 border-b border-border relative">
												<Search
													className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
													size={16}
												/>
												<input
													type="text"
													autoFocus
													value={catSearch}
													onChange={(e) =>
														setCatSearch(
															e.target.value,
														)
													}
													className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-md text-sm"
												/>
											</div>
											<div className="max-h-48 overflow-y-auto p-1">
												{globais.length > 0 && (
													<div className="px-3 py-1 text-xs font-semibold uppercase">
														Cadastradas
													</div>
												)}
												{globais.map((c) => (
													<button
														key={c.id}
														onClick={() => {
															setFormData({
																...formData,
																category_id:
																	c.id,
															});
															setCatOpen(false);
														}}
														className={`w-full flex items-start px-3 py-2 text-left rounded-md hover:bg-primary/5 \${formData.category_id === c.id ? 'bg-primary/10 text-primary' : ''}`}
													>
														<div className="text-sm font-medium truncate">
															{c.primary_category}{c.secondary_category && <span className="text-text-muted text-xs ml-1">({c.secondary_category})</span>}
														</div>
													</button>
												))}
												{locais.length > 0 && (
													<div className="px-3 py-1 mt-2 text-xs font-semibold uppercase border-t border-border pt-2">
														Criadas por você
													</div>
												)}
												{locais.map((c) => (
													<button
														key={c.id}
														onClick={() => {
															setFormData({
																...formData,
																category_id:
																	c.id,
															});
															setCatOpen(false);
														}}
														className={`w-full flex items-start px-3 py-2 text-left rounded-md hover:bg-primary/5 \${formData.category_id === c.id ? 'bg-primary/10 text-primary' : ''}`}
													>
														<div className="text-sm font-medium truncate">
															{c.primary_category}{c.secondary_category && <span className="text-text-muted text-xs ml-1">({c.secondary_category})</span>}
														</div>
													</button>
												))}
											</div>
											{catSearch.trim() !== '' && (
												<div className="p-2 border-t border-border bg-black/5">
													<button
														onClick={() => {
															setNewCatData({
																...newCatData,
																primary_category:
																	catSearch.trim(),
															});
															setCatModalOpen(
																true,
															);
															setCatOpen(false);
															setCatSearch('');
														}}
														className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-md"
													>
														<Plus size={16} />{' '}
														Adicionar "{catSearch}"
													</button>
												</div>
											)}
										</div>
									)}
								</div>
								<div className="relative" ref={unitRef}>
									<label className="block text-sm font-medium mb-1">
										Unidade *
									</label>
									<div
										className="w-full px-4 py-2 bg-background border border-border rounded-lg flex items-center justify-between cursor-pointer"
										onClick={() => setUnitOpen(!unitOpen)}
									>
										<span className="truncate">
											{formData.unit_id
												? unidades.find(
														(u) =>
															u.id ===
															formData.unit_id,
													)?.abbreviation
												: 'Selecione...'}
										</span>
										<ChevronDown size={16} />
									</div>
									{unitOpen && (
										<div className="absolute top-full left-0 z-[65] mt-1 w-full bg-surface border border-border rounded-lg shadow-xl overflow-hidden">
											<div className="p-2 border-b border-border relative">
												<Search
													className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
													size={16}
												/>
												<input
													type="text"
													autoFocus
													value={unitSearch}
													onChange={(e) =>
														setUnitSearch(
															e.target.value,
														)
													}
													className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-md text-sm"
												/>
											</div>
											<div className="max-h-48 overflow-y-auto p-1">
												{globaisUnits.length > 0 && (
													<div className="px-3 py-1 text-xs font-semibold uppercase">
														Cadastradas
													</div>
												)}
												{globaisUnits.map((u) => (
													<button
														key={u.id}
														onClick={() => {
															setFormData({
																...formData,
																unit_id: u.id,
															});
															setUnitOpen(false);
														}}
														className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-md hover:bg-primary/5 \${formData.unit_id === u.id ? 'bg-primary/10 text-primary' : ''}`}
													>
														<span className="text-sm font-medium">
															{u.abbreviation}
														</span>
													</button>
												))}
												{locaisUnits.length > 0 && (
													<div className="px-3 py-1 mt-2 text-xs font-semibold uppercase border-t border-border pt-2">
														Criadas por você
													</div>
												)}
												{locaisUnits.map((u) => (
													<button
														key={u.id}
														onClick={() => {
															setFormData({
																...formData,
																unit_id: u.id,
															});
															setUnitOpen(false);
														}}
														className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-md hover:bg-primary/5 \${formData.unit_id === u.id ? 'bg-primary/10 text-primary' : ''}`}
													>
														<span className="text-sm font-medium">
															{u.abbreviation}
														</span>
													</button>
												))}
											</div>
											{unitSearch.trim() !== '' && (
												<div className="p-2 border-t border-border bg-black/5">
													<button
														onClick={() => {
															setNewUnitData({
																name: unitSearch.trim(),
																abbreviation:
																	unitSearch
																		.trim()
																		.substring(
																			0,
																			3,
																		)
																		.toUpperCase(),
															});
															setUnitModalOpen(
																true,
															);
															setUnitOpen(false);
															setUnitSearch('');
														}}
														className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-md"
													>
														<Plus size={16} />{' '}
														Adicionar "{unitSearch}"
													</button>
												</div>
											)}
										</div>
									)}
								</div>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium mb-1">
										Quantidade *
									</label>
									<input
										type="number"
										min={1}
										value={formData.quantity}
										onChange={(e) =>
											setFormData({
												...formData,
												quantity:
													parseInt(e.target.value) ||
													1,
											})
										}
										className="w-full px-4 py-2 bg-background border border-border rounded-lg"
									/>
								</div>
								<div className="grid grid-cols-2 gap-2">
									<div>
										<label className="block text-sm font-medium mb-1">
											Data *
										</label>
										<input
											type="date"
											value={loanDate}
											onChange={(e) =>
												setLoanDate(e.target.value)
											}
											className="w-full px-3 py-2 bg-background border border-border rounded-lg"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium mb-1">
											Hora *
										</label>
										<input
											type="time"
											value={loanTime}
											onChange={(e) =>
												setLoanTime(e.target.value)
											}
											className="w-full px-3 py-2 bg-background border border-border rounded-lg"
										/>
									</div>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">
									Fornecedor *
								</label>
								<input
									type="text"
									value={formData.supplier}
									onChange={(e) =>
										setFormData({
											...formData,
											supplier: e.target.value,
										})
									}
									className="w-full px-4 py-2 bg-background border border-border rounded-lg"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">
									Descrição
								</label>
								<textarea
									rows={3}
									value={formData.description}
									onChange={(e) =>
										setFormData({
											...formData,
											description: e.target.value,
										})
									}
									className="w-full px-4 py-2 bg-background border border-border rounded-lg resize-none"
								></textarea>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">
									Fotos da Chegada
								</label>
								<div className="flex flex-wrap gap-4">
									{loanPhotos.map((f, i) => (
										<div
											key={i}
											className="relative w-24 h-24 rounded-lg overflow-hidden border border-border"
										>
											<img
												src={URL.createObjectURL(f)}
												className="w-full h-full object-cover"
											/>
											<button
												onClick={() =>
													removePhoto(i, false)
												}
												className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full"
											>
												<X size={14} />
											</button>
										</div>
									))}
									<div className="flex gap-2">
										<label className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-text-muted hover:border-primary hover:text-primary cursor-pointer">
											<Camera
												size={24}
												className="mb-1"
											/>
											<span className="text-[10px]">
												Tirar Foto
											</span>
											<input
												type="file"
												accept="image/*"
												capture="environment"
												className="hidden"
												onChange={(e) =>
													handlePhotoChange(e, false)
												}
											/>
										</label>
										<label className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-text-muted hover:border-primary hover:text-primary cursor-pointer">
											<Plus size={24} className="mb-1" />
											<span className="text-[10px]">
												Anexar
											</span>
											<input
												type="file"
												accept="image/*"
												multiple
												className="hidden"
												onChange={(e) =>
													handlePhotoChange(e, false)
												}
											/>
										</label>
									</div>
								</div>
							</div>
						</div>
						<div className="p-6 border-t border-border flex justify-end gap-3">
							<button
								onClick={() => setIsModalOpen(false)}
								className="px-6 py-2 hover:bg-black/5 rounded-lg"
							>
								Cancelar
							</button>
							<button
								onClick={handleNovaLocacao}
								disabled={saving}
								className="px-6 py-2 bg-primary text-white rounded-lg flex items-center gap-2"
							>
								{saving && (
									<Loader2 className="w-4 h-4 animate-spin" />
								)}
								Confirmar
							</button>
						</div>
					</div>
				</div>
			)}

			{isDevolucaoModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="bg-surface w-full max-w-md rounded-xl shadow-xl flex flex-col">
						<div className="flex justify-between items-center p-6 border-b border-border">
							<h2 className="text-xl font-bold">
								Devolver Equipamento
							</h2>
							<button
								onClick={() => setIsDevolucaoModalOpen(false)}
							>
								<X size={24} />
							</button>
						</div>
						<div className="p-6 space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium mb-1">
										Data *
									</label>
									<input
										type="date"
										value={returnDate}
										onChange={(e) =>
											setReturnDate(e.target.value)
										}
										className="w-full px-3 py-2 bg-background border border-border rounded-lg"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">
										Hora *
									</label>
									<input
										type="time"
										value={returnTime}
										onChange={(e) =>
											setReturnTime(e.target.value)
										}
										className="w-full px-3 py-2 bg-background border border-border rounded-lg"
									/>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">
									Fotos da Saída
								</label>
								<div className="flex flex-wrap gap-4">
									{returnPhotos.map((f, i) => (
										<div
											key={i}
											className="relative w-20 h-20 rounded-lg overflow-hidden border border-border"
										>
											<img
												src={URL.createObjectURL(f)}
												className="w-full h-full object-cover"
											/>
											<button
												onClick={() =>
													removePhoto(i, true)
												}
												className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full"
											>
												<X size={14} />
											</button>
										</div>
									))}
									<div className="flex gap-2">
										<label className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-text-muted hover:border-primary hover:text-primary cursor-pointer">
											<Camera size={20} />
											<span className="text-[10px]">
												Tirar Foto
											</span>
											<input
												type="file"
												accept="image/*"
												capture="environment"
												className="hidden"
												onChange={(e) =>
													handlePhotoChange(e, true)
												}
											/>
										</label>
										<label className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-text-muted hover:border-primary hover:text-primary cursor-pointer">
											<Plus size={20} />
											<span className="text-[10px]">
												Anexar
											</span>
											<input
												type="file"
												accept="image/*"
												multiple
												className="hidden"
												onChange={(e) =>
													handlePhotoChange(e, true)
												}
											/>
										</label>
									</div>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">
									Observações
								</label>
								<textarea
									rows={3}
									value={returnNotes}
									onChange={(e) =>
										setReturnNotes(e.target.value)
									}
									className="w-full px-4 py-2 bg-background border border-border rounded-lg resize-none"
								></textarea>
							</div>
						</div>
						<div className="p-6 border-t border-border flex justify-end gap-3">
							<button
								onClick={() => setIsDevolucaoModalOpen(false)}
								className="px-6 py-2 hover:bg-black/5 rounded-lg"
							>
								Cancelar
							</button>
							<button
								onClick={confirmarDevolucao}
								disabled={saving}
								className="px-6 py-2 bg-primary text-white rounded-lg flex items-center gap-2"
							>
								{saving && (
									<Loader2 className="w-4 h-4 animate-spin" />
								)}
								Finalizar
							</button>
						</div>
					</div>
				</div>
			)}

			{catModalOpen && (
				<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
					<div className="bg-surface w-full max-w-md rounded-xl shadow-xl">
						<div className="p-6 border-b border-border flex justify-between">
							<h2 className="text-xl font-bold">
								Nova Categoria
							</h2>
							<button onClick={() => setCatModalOpen(false)}>
								<X size={24} />
							</button>
						</div>
						<div className="p-6 space-y-4">
							<div>
								<label className="block text-sm font-medium mb-1">
									Nome *
								</label>
								<input
									type="text"
									value={newCatData.primary_category}
									onChange={(e) =>
										setNewCatData({
											...newCatData,
											primary_category: e.target.value,
										})
									}
									className="w-full px-3 py-2 bg-background border border-border rounded-md"
								/>
							</div><div><label className="block text-sm font-medium mb-1">Subcategoria (Opcional)</label><input type="text" value={newCatData.secondary_category} onChange={(e) => setNewCatData({...newCatData, secondary_category: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-md" /></div>
						</div>
						<div className="p-6 border-t border-border flex justify-end gap-3">
							<button
								onClick={() => setCatModalOpen(false)}
								className="px-4 py-2 hover:bg-black/5 rounded-md"
							>
								Cancelar
							</button>
							<button
								onClick={handleSaveCategory}
								className="px-4 py-2 bg-primary text-white rounded-md"
							>
								Salvar
							</button>
						</div>
					</div>
				</div>
			)}

			{unitModalOpen && (
				<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
					<div className="bg-surface w-full max-w-md rounded-xl shadow-xl">
						<div className="p-6 border-b border-border flex justify-between">
							<h2 className="text-xl font-bold">Nova Unidade</h2>
							<button onClick={() => setUnitModalOpen(false)}>
								<X size={24} />
							</button>
						</div>
						<div className="p-6 space-y-4">
							<div>
								<label className="block text-sm font-medium mb-1">
									Nome *
								</label>
								<input
									type="text"
									value={newUnitData.name}
									onChange={(e) =>
										setNewUnitData({
											...newUnitData,
											name: e.target.value,
										})
									}
									className="w-full px-3 py-2 bg-background border border-border rounded-md"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">
									Sigla *
								</label>
								<input
									type="text"
									value={newUnitData.abbreviation}
									onChange={(e) =>
										setNewUnitData({
											...newUnitData,
											abbreviation: e.target.value,
										})
									}
									className="w-full px-3 py-2 bg-background border border-border rounded-md"
								/>
							</div>
						</div>
						<div className="p-6 border-t border-border flex justify-end gap-3">
							<button
								onClick={() => setUnitModalOpen(false)}
								className="px-4 py-2 hover:bg-black/5 rounded-md"
							>
								Cancelar
							</button>
							<button
								onClick={handleSaveUnit}
								className="px-4 py-2 bg-primary text-white rounded-md"
							>
								Salvar
							</button>
						</div>
					</div>
				</div>
			)}
		</ERPLayout>
	);
}
