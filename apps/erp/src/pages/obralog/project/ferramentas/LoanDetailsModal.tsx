import React from 'react';
import {
	X,
	Calendar,
	User,
	Wrench,
	FileText,
	CheckCircle2,
	AlertCircle,
} from 'lucide-react';

interface ToolLoan {
	id: string;
	inventory_id: string;
	collaborator_id: string;
	quantity: number;
	loan_date: string;
	returned_date?: string | null;
	notes_on_loan?: string | null;
	notes_on_return?: string | null;
	photo_url?: string | null;
	return_photo_url?: string | null;
	status: string;
	site_inventory?: {
		catalogs?: {
			name: string;
		};
	};
	collaborators?: {
		name: string;
	};
}

interface LoanDetailsModalProps {
	loan: ToolLoan;
	onClose: () => void;
}

export function LoanDetailsModal({ loan, onClose }: LoanDetailsModalProps) {
	const formatDateTime = (dateString?: string | null) => {
		if (!dateString) return '-';
		const dateValue = new Date(dateString);
		return `${dateValue.toLocaleDateString('pt-BR')} às ${dateValue.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
	};

	const loanPhotos = loan.photo_url
		? loan.photo_url.split(',').filter(Boolean)
		: [];
	const returnPhotos = loan.return_photo_url
		? loan.return_photo_url.split(',').filter(Boolean)
		: [];

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
			<div
				className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
					<h3 className="text-xl font-semibold text-text-main flex items-center gap-2">
						<FileText className="text-primary" />
						Detalhes do Empréstimo
					</h3>
					<button
						onClick={onClose}
						className="p-2 text-text-muted hover:text-text-main hover:bg-background rounded-lg transition-colors"
					>
						<X size={20} />
					</button>
				</div>

				<div className="p-4 sm:p-6 overflow-y-auto space-y-8 flex-1">
					{/* Cabeçalho Resumo */}
					<div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-background border border-border rounded-xl">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 rounded-lg bg-surface border border-border flex items-center justify-center shadow-sm">
								<Wrench className="text-primary w-6 h-6" />
							</div>
							<div>
								<p className="text-sm text-text-muted font-medium mb-1">
									Ferramenta
								</p>
								<p className="text-lg font-semibold text-text-main">
									{loan.site_inventory?.catalogs?.name ||
										'Ferramenta desconhecida'}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-4">
							<div className="text-right">
								<p className="text-sm text-text-muted font-medium mb-1">
									Colaborador
								</p>
								<div className="flex items-center justify-end gap-2 text-text-main font-medium">
									<User size={16} className="text-primary" />
									{loan.collaborators?.name || 'Desconhecido'}
								</div>
							</div>
						</div>

						<div className="text-right border-l pl-4 border-border hidden sm:block">
							<p className="text-sm text-text-muted font-medium mb-1">
								Qtd
							</p>
							<p className="text-xl font-bold text-text-main">
								{loan.quantity}
							</p>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						{/* Coluna Retirada */}
						<div className="space-y-4">
							<h4 className="font-semibold text-text-main flex items-center gap-2 border-b border-border pb-2">
								<AlertCircle
									size={18}
									className="text-orange-500"
								/>
								Dados da Retirada
							</h4>
							<div className="space-y-3">
								<div>
									<p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">
										Data/Hora
									</p>
									<p className="text-sm text-text-main flex items-center gap-2">
										<Calendar
											size={14}
											className="text-text-muted"
										/>
										{formatDateTime(loan.loan_date)}
									</p>
								</div>

								<div>
									<p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">
										Observações da Retirada
									</p>
									<p className="text-sm text-text-main p-3 bg-background border border-border rounded-lg min-h-[60px] whitespace-pre-wrap">
										{loan.notes_on_loan ||
											'Nenhuma observação registrada.'}
									</p>
								</div>

								<div>
									<p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-2">
										Fotos da Retirada
									</p>
									{loanPhotos.length > 0 ? (
										<div className="grid grid-cols-2 gap-2">
											{loanPhotos.map((url, i) => (
												<div
													key={i}
													className="aspect-square bg-background rounded-lg border border-border overflow-hidden"
												>
													<img
														src={url}
														alt={`Foto Retirada ${i + 1}`}
														className="w-full h-full object-cover relative z-10 hover:scale-110 transition-transform cursor-pointer"
														onClick={() =>
															window.open(
																url,
																'_blank',
															)
														}
													/>
												</div>
											))}
										</div>
									) : (
										<div className="text-sm text-text-muted italic border border-dashed border-border rounded-lg p-3 text-center">
											Nenhuma foto em anexo
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Coluna Devolução */}
						<div className="space-y-4">
							<h4 className="font-semibold text-text-main flex items-center gap-2 border-b border-border pb-2">
								<CheckCircle2
									size={18}
									className="text-green-500"
								/>
								Dados da Devolução
							</h4>

							{loan.status === 'OPEN' ? (
								<div className="h-full flex flex-col items-center justify-center pb-12 opacity-50 px-4 text-center">
									<Clock
										size={32}
										className="text-text-muted mb-3"
									/>
									<p className="font-medium text-text-main">
										Em Uso
									</p>
									<p className="text-sm text-text-muted mt-1">
										Ferramenta ainda não foi devolvida
									</p>
								</div>
							) : (
								<div className="space-y-3">
									<div>
										<p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">
											Data/Hora
										</p>
										<p className="text-sm text-text-main flex items-center gap-2">
											<Calendar
												size={14}
												className="text-text-muted"
											/>
											{formatDateTime(loan.returned_date)}
										</p>
									</div>

									<div>
										<p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">
											Observações da Devolução
										</p>
										<p className="text-sm text-text-main p-3 bg-background border border-border rounded-lg min-h-[60px] whitespace-pre-wrap">
											{loan.notes_on_return ||
												'Nenhuma observação registrada.'}
										</p>
									</div>

									<div>
										<p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-2">
											Fotos da Devolução
										</p>
										{returnPhotos.length > 0 ? (
											<div className="grid grid-cols-2 gap-2">
												{returnPhotos.map((url, i) => (
													<div
														key={i}
														className="aspect-square bg-background rounded-lg border border-border overflow-hidden"
													>
														<img
															src={url}
															alt={`Foto Devolução ${i + 1}`}
															className="w-full h-full object-cover relative z-10 hover:scale-110 transition-transform cursor-pointer"
															onClick={() =>
																window.open(
																	url,
																	'_blank',
																)
															}
														/>
													</div>
												))}
											</div>
										) : (
											<div className="text-sm text-text-muted italic border border-dashed border-border rounded-lg p-3 text-center">
												Nenhuma foto em anexo
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				<div className="p-4 sm:p-6 border-t border-border flex justify-end bg-background">
					<button
						onClick={onClose}
						className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
					>
						Fechar Detalhes
					</button>
				</div>
			</div>
		</div>
	);
}

function Clock(props: any) {
	return (
		<svg
			{...props}
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinelinejoin="round"
		>
			<circle cx="12" cy="12" r="10"></circle>
			<polyline points="12 6 12 12 16 14"></polyline>
		</svg>
	);
}
