import React, { useState, useEffect, useRef } from 'react';
import { ERPLayout } from '../../../../components/layout/ERPLayout';
import { useParams } from 'react-router-dom';
import {
	Search,
	Plus,
	Filter,
	Settings2,
	Wrench,
	X,
	ChevronDown,
	Camera,
	Calendar,
	Clock,
	Upload,
} from 'lucide-react';
import { supabase } from '../../../../config/supabase';
import { SearchableSelect } from '../../../../components/ui/SearchableSelect';
import { useToast } from '../../../../context/ToastContext';
import { useEscape } from '../../../../hooks/useEscape';

export default function FerramentasDisponiveis() {
	const { id } = useParams();
	const { showToast } = useToast();
	const [searchTerm, setSearchTerm] = useState('');
	const [showAddModal, setShowAddModal] = useState(false);

	useEscape(() => setShowAddModal(false));

	const [ferramentas, setFerramentas] = useState<any[]>([]);
	const [inventoryTools, setInventoryTools] = useState<any[]>([]);
	const [selectedInventoryIds, setSelectedInventoryIds] = useState<string[]>(
		[],
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [modalSearchTerm, setModalSearchTerm] = useState('');
	const [modalSelectedCategory, setModalSelectedCategory] = useState('');
	const [modalSelectedSubCategory, setModalSelectedSubCategory] =
		useState('');

	// Novos Estados: Empréstimo
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [showLendModal, setShowLendModal] = useState(false);
	const [selectedToolForLoan, setSelectedToolForLoan] = useState<any>(null);
	const [collaborators, setCollaborators] = useState<any[]>([]);
	const [loanData, setLoanData] = useState({
		collaborator_id: '',
		quantity: 1,
		loan_date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
		loan_time: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
		photos: [] as File[],
		notes: '',
	});

	// Filtros da página
	const [showFilters, setShowFilters] = useState(false);

	const fetchInventoryTools = async () => {
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

			// Agora não filtramos forçadamente por is_tool ou nome da categoria,
			// deixando a cargo do usuário selecionar o que é ferramenta de fato
			setInventoryTools(data || []);
		} catch (err) {
			console.error(err);
		}
	};

	const fetchFerramentas = async () => {
		if (!id) return;
		try {
			const { data: toolsData, error: toolsError } = await supabase
				.from('site_tools')
				.select(
					'id, inventory_id, site_inventory(quantity, catalogs(name, code))',
				)
				.eq('site_id', id);
			if (toolsError) throw toolsError;

			const { data: loansData, error: loansError } = await supabase
				.from('tool_loans')
				.select('inventory_id, quantity')
				.eq('site_id', id)
				.eq('status', 'OPEN');
			if (loansError) throw loansError;

			const loansCountMap = (loansData || []).reduce(
				(acc: any, loan: any) => {
					acc[loan.inventory_id] =
						(acc[loan.inventory_id] || 0) + loan.quantity;
					return acc;
				},
				{},
			);

			const toolsWithAvailability = (toolsData || []).map((tool: any) => {
				const total = tool.site_inventory?.quantity || 0;
				const loaned = loansCountMap[tool.inventory_id] || 0;
				return {
					...tool,
					available_quantity: Math.max(0, total - loaned),
				};
			});

			setFerramentas(toolsWithAvailability);
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
			console.error('Erro ao buscar colaboradores:', err);
		}
	};

	useEffect(() => {
		fetchFerramentas();
		fetchInventoryTools();
		fetchColaboradores();
	}, [id]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (selectedInventoryIds.length === 0) {
			showToast('Selecione pelo menos uma ferramenta', 'error');
			return;
		}
		setIsSubmitting(true);
		try {
			const itemsToInsert = selectedInventoryIds.map((invId) => ({
				site_id: id,
				inventory_id: invId,
			}));

			const { error } = await supabase
				.from('site_tools')
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
				`${selectedInventoryIds.length} ferramenta(s) adicionada(s) à lista`,
				'success',
			);
			setShowAddModal(false);
			setSelectedInventoryIds([]);
			fetchFerramentas();
		} catch (err: any) {
			console.error(err);
			showToast('Erro ao adicionar ferramenta', 'error');
		} finally {
			setIsSubmitting(false);
		}
	};

	// Mock color for purely display consistency now that we don't track inside vs outside yet
	const getRatioColor = (disponivel: number, total: number) => {
		if (disponivel === 0) return 'text-red-500 bg-red-500/10';
		if (disponivel < total) return 'text-yellow-500 bg-yellow-500/10';
		return 'text-green-500 bg-green-500/10';
	};

	const availableInventoryInfos = inventoryTools.filter(
		(inv) => !ferramentas.some((f) => f.inventory_id === inv.id),
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
							<Wrench className="text-primary" /> Ferramentas
							Disponíveis
						</h1>
						<p className="text-text-muted mt-1">
							Controle de quais ferramentas estão disponíveis para
							a obra
						</p>
					</div>
					<button
						onClick={() => setShowAddModal(true)}
						className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
					>
						<Plus size={20} />
						<span>Nova Ferramenta</span>
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
								placeholder="Buscar ferramenta..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary transition-colors"
							/>
						</div>
						<div className="relative flex gap-2">
							<button
								onClick={() => setShowFilters(!showFilters)}
								className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
									showFilters
										? 'bg-primary/10 border-primary text-primary'
										: 'bg-background border-border text-text-main hover:border-primary/50'
								}`}
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
										<div>
											<label className="block text-xs font-medium text-text-muted mb-1">
												Status de Empréstimo
											</label>
											<select className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:border-primary text-text-main">
												<option>Todos</option>
												<option>Disponível</option>
												<option>
													Emprestado (Alguns)
												</option>
											</select>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[500px]">
						{ferramentas.length === 0 ? (
							<div className="col-span-full py-8 text-center text-text-muted">
								Nenhuma ferramenta cadastrada nesta lista ainda.
							</div>
						) : (
							ferramentas.map((ferramenta) => {
								const nome =
									ferramenta.site_inventory?.catalogs?.name ||
									'Desconhecida';
								const codigo =
									ferramenta.site_inventory?.catalogs?.code ||
									'';
								const totalQtd =
									ferramenta.site_inventory?.quantity || 0;
								const dispQtd =
									ferramenta.available_quantity ?? totalQtd;
								return (
									<div
										key={ferramenta.id}
										className="bg-background border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
									>
										<div className="flex justify-between items-start mb-4">
											<div>
												<h3 className="font-semibold text-text-main">
													{nome}
												</h3>
												<p className="text-sm text-text-muted">
													{codigo}
												</p>
											</div>
											<div
												className={`px-2 py-1 rounded-md text-sm font-bold flex items-center ${getRatioColor(dispQtd, totalQtd)}`}
											>
												{totalQtd}/{dispQtd} Disponíveis
											</div>
										</div>
										<div className="flex gap-2 mt-4">
											<button
												className="flex-1 text-center py-2 text-sm font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
												disabled={dispQtd === 0}
												onClick={() => {
													setSelectedToolForLoan({
														id: ferramenta.id,
														inventory_id:
															ferramenta.inventory_id,
														name: nome,
														available: dispQtd,
													});
													setLoanData({
														...loanData,
														quantity: 1,
														loan_date: `${new Date().getFullYear()}-${String(
															new Date().getMonth() +
																1,
														).padStart(
															2,
															'0',
														)}-${String(
															new Date().getDate(),
														).padStart(2, '0')}`,
														loan_time: `${String(
															new Date().getHours(),
														).padStart(
															2,
															'0',
														)}:${String(
															new Date().getMinutes(),
														).padStart(2, '0')}`,
														photos: [],
													});
													setShowLendModal(true);
												}}
											>
												Emprestar
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
									Adicionar Ferramenta à Obra
								</h2>
								<p className="text-sm text-text-muted mt-1">
									Selecione uma ferramenta já disponível no
									almoxarifado desta obra.
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
										Ferramentas Encontradas no Almoxarifado
									</label>
									<button
										type="button"
										className="text-xs text-primary hover:underline font-medium"
										onClick={() => {
											const filtered =
												inventoryTools.filter(
													(inv) =>
														!ferramentas.some(
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
											) {
												setSelectedInventoryIds([]);
											} else {
												setSelectedInventoryIds(
													filtered.map((i) => i.id),
												);
											}
										}}
									>
										Selecionar / Desmarcar Todas
									</button>
								</div>
								<div className="flex gap-2 mb-3">
									<select
										value={modalSelectedCategory}
										onChange={(e) => {
											setModalSelectedCategory(
												e.target.value,
											);
											setModalSelectedSubCategory(''); // Reset subcategory when primary changes
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
									{inventoryTools
										.filter(
											(inv) =>
												!ferramentas.some(
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
																) {
																	setSelectedInventoryIds(
																		(
																			prev,
																		) => [
																			...prev,
																			inv.id,
																		],
																	);
																} else {
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
																}
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
									{inventoryTools.filter(
										(inv) =>
											!ferramentas.some(
												(f) =>
													f.inventory_id === inv.id,
											),
									).length === 0 && (
										<div className="text-center py-4 text-sm text-text-muted">
											Nenhuma ferramenta disponível no
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
										: `Adicionar Selecionadas (${selectedInventoryIds.length})`}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
			{showLendModal && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
					onClick={() => setShowLendModal(false)}
				>
					<div
						className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between p-5 border-b border-border">
							<div>
								<h2 className="text-xl font-bold text-text-main">
									Emprestar Ferramenta
								</h2>
								<p className="text-sm text-text-muted mt-1">
									{selectedToolForLoan?.name}
								</p>
							</div>
							<button
								onClick={() => setShowLendModal(false)}
								className="p-2 text-text-muted hover:text-text-main hover:bg-background rounded-lg transition-colors -mt-4 -mr-2"
							>
								<X size={20} />
							</button>
						</div>
						<form
							className="p-5 space-y-5"
							onSubmit={async (e) => {
								e.preventDefault();
								if (
									!loanData.collaborator_id ||
									loanData.quantity < 1
								)
									return;
								setIsSubmitting(true);
								try {
									let photoUrl = null;
									if (
										loanData.photos &&
										loanData.photos.length > 0
									) {
										const urls = [];
										for (const file of loanData.photos) {
											const ext = file.name
												.split('.')
												.pop();
											const filename = `emprestimos/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
											const {
												data: uploadData,
												error: uploadErr,
											} = await supabase.storage
												.from('ferramentas-fotos')
												.upload(filename, file);
											if (uploadErr) throw uploadErr;
											const { data: publicUrlData } =
												supabase.storage
													.from('ferramentas-fotos')
													.getPublicUrl(filename);
											urls.push(publicUrlData.publicUrl);
										}
										photoUrl = urls.join(',');
									}
									const { error } = await supabase
										.from('tool_loans')
										.insert({
											site_id: id,
											inventory_id:
												selectedToolForLoan.inventory_id,
											collaborator_id:
												loanData.collaborator_id,
											quantity: loanData.quantity,
											loan_date: `${loanData.loan_date}T${loanData.loan_time}:00`,
											notes_on_loan: loanData.notes,
											photo_url: photoUrl,
											status: 'OPEN',
										});
									if (error) throw error;
									showToast(
										'Ferramenta emprestada com sucesso',
										'success',
									);
									setShowLendModal(false);
									fetchFerramentas();
								} catch (err) {
									console.error(err);
									showToast(
										'Erro ao emprestar ferramenta',
										'error',
									);
								} finally {
									setIsSubmitting(false);
								}
							}}
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
										value={loanData.collaborator_id}
										onChange={(val) =>
											setLoanData({
												...loanData,
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
											value={loanData.loan_date}
											onChange={(e) =>
												setLoanData({
													...loanData,
													loan_date: e.target.value,
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
											value={loanData.loan_time}
											onChange={(e) =>
												setLoanData({
													...loanData,
													loan_time: e.target.value,
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
											selectedToolForLoan?.available || 1
										}
										value={loanData.quantity}
										onChange={(e) =>
											setLoanData({
												...loanData,
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
										Observações
									</label>
									<textarea
										value={loanData.notes}
										onChange={(e) =>
											setLoanData({
												...loanData,
												notes: e.target.value,
											})
										}
										placeholder="Detalhes do estado da ferramenta..."
										className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary resize-none"
										rows={2}
									></textarea>
								</div>

								<div>
									<label className="block text-sm font-medium text-text-main mb-1">
										Fotos
									</label>
									<input
										type="file"
										accept="image/*"
										multiple
										ref={fileInputRef}
										onChange={(e) => {
											if (e.target.files?.length) {
												setLoanData({
													...loanData,
													photos: [
														...loanData.photos,
														...Array.from(
															e.target.files,
														),
													],
												});
											}
											// clear input so same file can be selected again if needed
											if (fileInputRef.current)
												fileInputRef.current.value = '';
										}}
										className="hidden"
									/>
									{/* Camera input that forces mobile device to open camera */}
									<input
										type="file"
										accept="image/*"
										capture="environment"
										id="cameraInput"
										onChange={(e) => {
											if (e.target.files?.length) {
												setLoanData({
													...loanData,
													photos: [
														...loanData.photos,
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
											onClick={() => {
												const cameraInput =
													document.getElementById(
														'cameraInput',
													);
												if (cameraInput)
													cameraInput.click();
											}}
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

									{loanData.photos.length > 0 && (
										<div className="space-y-2 mt-2">
											{loanData.photos.map(
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
																		...loanData.photos,
																	];
																newPhotos.splice(
																	index,
																	1,
																);
																setLoanData({
																	...loanData,
																	photos: newPhotos,
																});
															}}
															className="text-text-muted hover:text-red-500 p-1"
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

							<div className="flex justify-end pt-4 gap-3 border-t border-border mt-5">
								<button
									type="button"
									onClick={() => setShowLendModal(false)}
									className="px-4 py-2 text-text-muted hover:text-text-main font-medium"
								>
									Cancelar
								</button>
								<button
									type="submit"
									disabled={isSubmitting}
									className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-6 rounded-lg disabled:opacity-50"
								>
									{isSubmitting
										? 'Confirmando...'
										: 'Confirmar Empréstimo'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</ERPLayout>
	);
}
