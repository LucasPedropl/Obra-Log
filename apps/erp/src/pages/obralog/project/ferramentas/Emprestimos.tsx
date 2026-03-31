import React, { useState, useEffect, useRef } from 'react';
import { ERPLayout } from '../../../../components/layout/ERPLayout';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../../config/supabase';
import { useToast } from '../../../../context/ToastContext';
import {
	Wrench,
	Search,
	User,
	ArrowRightLeft,
	Camera,
	Upload,
	X,
	Settings2,
	FilterX,
	Users,
	History,
	ChevronDown,
	ChevronUp,
} from 'lucide-react';
import { LoanDetailsModal } from './LoanDetailsModal';

interface ToolLoan {
	id: string;
	inventory_id: string;
	collaborator_id: string;
	quantity: number;
	loan_date: string;
	returned_date?: string | null;
	notes_on_loan: string | null;
	notes_on_return?: string | null;
	photo_url: string | null;
	return_photo_url?: string | null;
	status: 'OPEN' | 'RETURNED' | 'LOST';
	site_id: string;
	site_inventory?: {
		catalogs?: {
			name: string;
		};
	};
	collaborators?: {
		name: string;
	};
}

interface ReturnData {
	return_date: string;
	return_time: string;
	quantity_returned: number;
	notes: string;
	photo_files: File[];
}

export default function Emprestimos() {
	const { id } = useParams();
	const { showToast } = useToast();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [loans, setLoans] = useState<ToolLoan[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Filtros
	const [showFilters, setShowFilters] = useState(false);
	const [filterStartDate, setFilterStartDate] = useState('');
	const [filterEndDate, setFilterEndDate] = useState('');
	const [filterCollaborator, setFilterCollaborator] = useState('');

	const clearFilters = () => {
		setFilterStartDate('');
		setFilterEndDate('');
		setFilterCollaborator('');
	};

	// Return Modal State
	const [showReturnModal, setShowReturnModal] = useState(false);
	const [selectedLoan, setSelectedLoan] = useState<ToolLoan | null>(null);
	const [viewLoanDetails, setViewLoanDetails] = useState<ToolLoan | null>(
		null,
	);
	const [returnData, setReturnData] = useState<ReturnData>({
		return_date: new Date().toISOString().split('T')[0],
		return_time: new Date().toTimeString().substring(0, 5),
		quantity_returned: 1,
		notes: '',
		photo_files: [],
	});

	const fetchLoans = async () => {
		if (!id) return;
		try {
			setIsLoading(true);

			const { data, error } = await supabase
				.from('tool_loans')
				.select(
					`
          id, quantity, loan_date, returned_date, notes_on_loan, notes_on_return, photo_url, return_photo_url, status, site_id, inventory_id, collaborator_id,
          site_inventory (
            catalogs ( name )
          ),
          collaborators ( name )
        `,
				)
				.eq('site_id', id)
				.order('loan_date', { ascending: false });

			if (error) throw error;
			setLoans((data as any) || []);
		} catch (err) {
			console.error('Error fetching loans:', err);
			showToast('Erro ao carregar empréstimos', 'error');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchLoans();
	}, []);

	const handleReturn = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedLoan) return;

		try {
			setIsSubmitting(true);

			let returnPhotoUrl = null;

			// 1. Upload photos if present
			if (returnData.photo_files.length > 0) {
				const uploadedUrls = [];
				for (const file of returnData.photo_files) {
					const fileExt = file.name.split('.').pop();
					const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
					const filePath = `${selectedLoan.site_id}/returns/${fileName}`;

					const { error: uploadError } = await supabase.storage
						.from('ferramentas-fotos')
						.upload(filePath, file);

					if (uploadError) throw uploadError;

					const { data: publicUrlData } = supabase.storage
						.from('ferramentas-fotos')
						.getPublicUrl(filePath);

					uploadedUrls.push(publicUrlData.publicUrl);
				}
				returnPhotoUrl = uploadedUrls.join(',');
			}

			// 2 & 3. Update active loan directly (Supabase schema tracks returns on the loan itself)
			const remainingQuantity =
				selectedLoan.quantity - returnData.quantity_returned;

			if (remainingQuantity <= 0) {
				// Returned completely
				const { error: returnError } = await supabase
					.from('tool_loans')
					.update({
						status: 'RETURNED',
						returned_date: `${returnData.return_date}T${returnData.return_time}:00Z`,
						notes_on_return: returnData.notes,
						return_photo_url: returnPhotoUrl,
					})
					.eq('id', selectedLoan.id);

				if (returnError) throw returnError;
			} else {
				// Partial return:
				// 1. Reduce the quantity of the current OPEN loan
				await supabase
					.from('tool_loans')
					.update({ quantity: remainingQuantity })
					.eq('id', selectedLoan.id);

				// 2. Create a new loan record for the returned amount to keep history!
				const { error: insertError } = await supabase
					.from('tool_loans')
					.insert({
						site_id: selectedLoan.site_id,
						inventory_id: selectedLoan.inventory_id,
						collaborator_id: selectedLoan.collaborator_id,
						quantity: returnData.quantity_returned,
						loan_date: selectedLoan.loan_date,
						returned_date: `${returnData.return_date}T${returnData.return_time}:00Z`,
						notes_on_loan: selectedLoan.notes_on_loan,
						notes_on_return: returnData.notes,
						photo_url: selectedLoan.photo_url, // keep original loan photo
						return_photo_url: returnPhotoUrl, // new return photo
						status: 'RETURNED',
					});

				if (insertError) throw insertError;
			}

			// Add quantity back to site_inventory
			const { data: currentInv } = await supabase
				.from('site_inventory')
				.select('quantity')
				.eq('id', selectedLoan.inventory_id)
				.single();

			if (currentInv) {
				await supabase
					.from('site_inventory')
					.update({
						quantity:
							currentInv.quantity + returnData.quantity_returned,
					})
					.eq('id', selectedLoan.inventory_id);
			}

			showToast('Devolução registrada com sucesso!', 'success');
			setShowReturnModal(false);
			fetchLoans();
		} catch (err: any) {
			console.error('Error handling return:', err);
			showToast(err.message || 'Erro ao registrar devolução', 'error');
		} finally {
			setIsSubmitting(false);
		}
	};

	const filteredActiveLoans = loans.filter((loan) => {
		if (loan.status !== 'OPEN') return false;

		const searchLower = searchTerm.toLowerCase();
		const matchesSearch =
			loan.site_inventory?.catalogs?.name
				?.toLowerCase()
				.includes(searchLower) ||
			loan.collaborators?.name?.toLowerCase().includes(searchLower) ||
			false;

		let matchesDate = true;
		if (filterStartDate) {
			matchesDate = matchesDate && loan.loan_date >= filterStartDate;
		}
		if (filterEndDate) {
			matchesDate = matchesDate && loan.loan_date <= filterEndDate;
		}

		let matchesCollaborator = true;
		if (filterCollaborator) {
			matchesCollaborator =
				loan.collaborators?.name
					?.toLowerCase()
					.includes(filterCollaborator.toLowerCase()) || false;
		}

		return matchesSearch && matchesDate && matchesCollaborator;
	});

	return (
		<ERPLayout>
			<div className="space-y-6 w-full">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div>
						<h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
							<ArrowRightLeft className="text-primary" />{' '}
							Devoluções
						</h1>
						<p className="text-text-muted mt-1">
							Acione o botão 'Devolver' nos itens que o
							colaborador entregou
						</p>
					</div>
				</div>

				<div className="bg-surface border border-border rounded-sm p-4 sm:p-6 shadow-sm min-h-[400px]">
					<div className="flex flex-col sm:flex-row gap-4 mb-6">
						<div className="relative flex-1">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Search size={18} className="text-text-muted" />
							</div>
							<input
								type="text"
								placeholder="Buscar empréstimo..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary transition-colors"
							/>
						</div>
						<div className="relative flex gap-2">
							<button
								onClick={() => setShowFilters(!showFilters)}
								className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
									showFilters ||
									filterStartDate ||
									filterEndDate ||
									filterCollaborator
										? 'bg-primary/10 border-primary text-primary'
										: 'bg-background border-border text-text-main hover:border-primary/50'
								}`}
							>
								<Settings2 size={18} />
								<span className="hidden sm:inline text-sm font-medium">
									Filtros
								</span>
								{(filterStartDate ||
									filterEndDate ||
									filterCollaborator) && (
									<div className="w-2 h-2 rounded-full bg-primary absolute top-2 right-2 sm:hidden" />
								)}
							</button>

							{showFilters && (
								<div className="absolute right-0 top-full mt-2 w-72 bg-surface border border-border rounded-xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2">
									<div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
										<h3 className="font-semibold text-text-main">
											Filtros
										</h3>
										{(filterStartDate ||
											filterEndDate ||
											filterCollaborator) && (
											<button
												onClick={clearFilters}
												className="text-xs flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors"
											>
												<FilterX size={14} />
												Limpar
											</button>
										)}
									</div>
									<div className="space-y-4">
										<div>
											<label className="block text-xs font-medium text-text-muted mb-1">
												Colaborador
											</label>
											<input
												type="text"
												placeholder="Nome do colaborador"
												value={filterCollaborator}
												onChange={(e) =>
													setFilterCollaborator(
														e.target.value,
													)
												}
												className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary"
											/>
										</div>
										<div className="grid grid-cols-2 gap-2">
											<div>
												<label className="block text-xs font-medium text-text-muted mb-1">
													Data Inicial
												</label>
												<input
													type="date"
													value={filterStartDate}
													onChange={(e) =>
														setFilterStartDate(
															e.target.value,
														)
													}
													className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary"
												/>
											</div>
											<div>
												<label className="block text-xs font-medium text-text-muted mb-1">
													Data Final
												</label>
												<input
													type="date"
													value={filterEndDate}
													onChange={(e) =>
														setFilterEndDate(
															e.target.value,
														)
													}
													className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary"
												/>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* List */}
					<div className="overflow-x-auto bg-surface border border-border rounded-lg">
						{isLoading ? (
							<div className="p-8 flex justify-center items-center h-48">
								<div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
							</div>
						) : filteredActiveLoans.length === 0 ? (
							<div className="p-12 text-center flex flex-col items-center justify-center">
								<div className="w-16 h-16 bg-background border border-border rounded-full flex items-center justify-center mb-4">
									<Wrench className="w-8 h-8 text-text-muted" />
								</div>
								<p className="text-text-main font-medium mb-1">
									Nenhum empréstimo ativo encontrado
								</p>
								<p className="text-text-muted text-sm max-w-md">
									Todos os itens emprestados foram devolvidos
									ou não há empréstimos nesta obra.
								</p>
							</div>
						) : (
							<table className="w-full text-left [&_th]:border-b [&_th]:border-border [&_td]:border-b [&_td]:border-border [&_tbody_tr:last-child_td]:border-b-0">
								<thead>
									<tr className="border-b border-border bg-background/50">
										<th className="py-3 px-4 text-sm font-semibold text-text-muted rounded-tl-lg">
											Ferramenta
										</th>
										<th className="py-3 px-4 text-sm font-semibold text-text-muted">
											Colaborador
										</th>
										<th className="py-3 px-4 text-sm font-semibold text-text-muted">
											Qtd
										</th>
										<th className="py-3 px-4 text-sm font-semibold text-text-muted">
											Data Empréstimo
										</th>
										<th className="py-3 px-4 text-sm font-semibold text-text-muted text-right rounded-tr-lg">
											Ação
										</th>
									</tr>
								</thead>
								<tbody>
									{filteredActiveLoans.map((loan) => (
										<tr
											key={loan.id}
											onClick={() =>
												setViewLoanDetails(loan)
											}
											className="cursor-pointer border-b border-border hover:bg-black/5 dark:hover:bg-white/5 even:bg-black/[0.02] dark:even:bg-white/[0.02] transition-colors group"
										>
											<td className="py-3 px-4">
												<div className="flex items-center gap-3">
													<div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center">
														<Wrench className="w-5 h-5 text-text-muted" />
													</div>
													<span className="font-medium text-text-main">
														{
															loan.site_inventory
																?.catalogs?.name
														}
													</span>
												</div>
											</td>
											<td className="py-3 px-4">
												<div className="flex items-center gap-2">
													<User className="w-4 h-4 text-text-muted" />
													<span className="text-text-main text-sm">
														{
															loan.collaborators
																?.name
														}
													</span>
												</div>
											</td>
											<td className="py-3 px-4 text-sm text-text-main">
												{loan.quantity}
											</td>
											<td className="py-3 px-4 text-sm text-text-muted flex flex-col">
												<span>
													{new Date(
														loan.loan_date,
													).toLocaleDateString(
														'pt-BR',
													)}
												</span>
												<span className="text-xs">
													{new Date(
														loan.loan_date,
													).toLocaleTimeString(
														'pt-BR',
														{
															hour: '2-digit',
															minute: '2-digit',
														},
													)}
												</span>
											</td>
											<td className="py-3 px-4 text-right">
												<button
													onClick={(e) => {
														e.stopPropagation();
														setSelectedLoan(loan);
														setReturnData({
															...returnData,
															quantity_returned:
																loan.quantity,
															notes: '',
															photo_files: [],
														});
														setShowReturnModal(
															true,
														);
													}}
													className="bg-primary text-white hover:bg-primary/90 px-3 py-1.5 rounded-lg transition-colors font-medium text-sm"
												>
													Devolver
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</div>
			</div>

			{/* Return Modal */}
			{showReturnModal && selectedLoan && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
					onClick={() => setShowReturnModal(false)}
				>
					<div
						className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between p-5 border-b border-border">
							<div>
								<h2 className="text-xl font-bold text-text-main">
									Registrar Devolução
								</h2>
								<p className="text-sm text-text-muted mt-1">
									{
										selectedLoan.site_inventory?.catalogs
											?.name
									}{' '}
									(Com {selectedLoan.collaborators?.name})
								</p>
							</div>
							<button
								onClick={() => setShowReturnModal(false)}
								className="p-2 hover:bg-background rounded-lg text-text-muted transition-colors"
							>
								<X size={20} />
							</button>
						</div>

						<form onSubmit={handleReturn} className="p-5 space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-text-main mb-1">
										Data
									</label>
									<input
										type="date"
										value={returnData.return_date}
										onChange={(e) =>
											setReturnData({
												...returnData,
												return_date: e.target.value,
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
										value={returnData.return_time}
										onChange={(e) =>
											setReturnData({
												...returnData,
												return_time: e.target.value,
											})
										}
										className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary"
										required
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-text-main mb-1">
									Qtd para Devolver (até{' '}
									{selectedLoan.quantity})
								</label>
								<input
									type="number"
									min="1"
									max={selectedLoan.quantity}
									value={returnData.quantity_returned}
									onChange={(e) =>
										setReturnData({
											...returnData,
											quantity_returned: parseInt(
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
									Observações / Estado
								</label>
								<textarea
									value={returnData.notes}
									onChange={(e) =>
										setReturnData({
											...returnData,
											notes: e.target.value,
										})
									}
									placeholder="Detalhes sobre a devolução..."
									className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary resize-none"
									rows={2}
								></textarea>
							</div>

							<div>
								<label className="block text-sm font-medium text-text-main mb-2">
									Fotos do estado na devolução
								</label>
								<div className="flex gap-2 mb-3">
									<label className="flex-1 flex flex-col items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-lg text-text-muted hover:text-primary hover:border-primary/50 transition-colors cursor-pointer bg-background">
										<Camera size={20} />
										<span className="text-xs font-medium text-center">
											Tirar Foto
										</span>
										<input
											type="file"
											accept="image/*"
											capture="environment"
											onChange={(e) => {
												if (e.target.files?.length) {
													setReturnData({
														...returnData,
														photo_files: [
															...returnData.photo_files,
															...Array.from(
																e.target.files,
															),
														],
													});
												}
											}}
											className="hidden"
										/>
									</label>
									<label className="flex-1 flex flex-col items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-lg text-text-muted hover:text-primary hover:border-primary/50 transition-colors cursor-pointer bg-background">
										<Upload size={20} />
										<span className="text-xs font-medium text-center">
											Galeria
										</span>
										<input
											type="file"
											accept="image/*"
											multiple
											onChange={(e) => {
												if (e.target.files?.length) {
													setReturnData({
														...returnData,
														photo_files: [
															...returnData.photo_files,
															...Array.from(
																e.target.files,
															),
														],
													});
												}
											}}
											className="hidden"
										/>
									</label>
								</div>

								{returnData.photo_files.length > 0 && (
									<div className="space-y-2 mt-2">
										<p className="text-xs font-medium text-text-muted">
											{returnData.photo_files.length}{' '}
											foto(s) selecionada(s)
										</p>
										{returnData.photo_files.map(
											(file, idx) => (
												<div
													key={idx}
													className="flex items-center justify-between p-2 border border-border rounded-lg bg-background"
												>
													<div className="flex items-center gap-2 overflow-hidden">
														<img
															src={URL.createObjectURL(
																file,
															)}
															alt={`Preview ${idx}`}
															className="w-8 h-8 object-cover rounded"
														/>
														<span className="text-sm text-text-main truncate">
															{file.name}
														</span>
													</div>
													<button
														type="button"
														onClick={() => {
															const newFiles = [
																...returnData.photo_files,
															];
															newFiles.splice(
																idx,
																1,
															);
															setReturnData({
																...returnData,
																photo_files:
																	newFiles,
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

							<div className="flex justify-end pt-4 gap-3 border-t border-border mt-5">
								<button
									type="button"
									onClick={() => setShowReturnModal(false)}
									className="px-4 py-2 text-text-muted font-medium"
								>
									Cancelar
								</button>
								<button
									type="submit"
									disabled={isSubmitting}
									className="bg-primary text-white font-medium py-2 px-6 rounded-lg disabled:opacity-50"
								>
									{isSubmitting
										? 'Salvando...'
										: 'Confirmar Devolução'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{viewLoanDetails && (
				<LoanDetailsModal
					loan={viewLoanDetails}
					onClose={() => setViewLoanDetails(null)}
				/>
			)}
		</ERPLayout>
	);
}
