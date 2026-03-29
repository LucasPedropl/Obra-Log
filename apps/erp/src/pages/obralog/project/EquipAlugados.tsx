import React, { useState } from 'react';
import { ERPLayout } from '../../../components/layout/ERPLayout';
import { Search, Plus, Truck, Camera, X, ChevronDown } from 'lucide-react';

export default function EquipAlugados() {
	const [searchTerm, setSearchTerm] = useState('');
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDevolucaoModalOpen, setIsDevolucaoModalOpen] = useState(false);
	const [selectedEquip, setSelectedEquip] = useState<any>(null);

	// Mock data
	const equipamentos: any[] = [];
	const handleDevolver = (equip: any) => {
		if (equip.isEmprestado) {
			alert(
				'Não é possível devolver um equipamento que está emprestado a um colaborador!',
			);
			return;
		}
		setSelectedEquip(equip);
		setIsDevolucaoModalOpen(true);
	};

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

				<div className="bg-surface border border-border rounded-sm shadow-sm p-4 sm:p-6 overflow-hidden">
					<div className="flex flex-col sm:flex-row gap-4 mb-6">
						<div className="relative flex-1">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Search size={18} className="text-text-muted" />
							</div>
							<input
								type="text"
								placeholder="Buscar locação..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary transition-colors"
							/>
						</div>
						<div className="flex gap-2">
							<button className="flex items-center gap-2 bg-background border border-border text-text-main px-4 py-2 rounded-lg hover:border-primary/50 transition-colors">
								<ChevronDown size={20} />
								<span>Filtros</span>
							</button>
						</div>
					</div>

					<div className="overflow-x-auto bg-surface border border-border rounded-lg">
						<table className="w-full text-left [&_th]:border-b [&_th]:border-border [&_td]:border-b [&_td]:border-border [&_tbody_tr:last-child_td]:border-b-0">
							<thead>
								<tr className="border-b border-border">
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Status
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Equipamento / Fornecedor
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Categoria
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
								{equipamentos.map((item) => (
									<tr
										key={item.id}
										className="border-b border-border hover:bg-black/5 dark:hover:bg-white/5 even:bg-black/[0.02] dark:even:bg-white/[0.02] transition-colors"
									>
										<td className="py-3 px-4">
											<span
												className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-sm font-medium ${item.status === 'Devolvido' ? 'bg-zinc-500/10 text-zinc-500' : 'bg-blue-500/10 text-blue-500'}`}
											>
												{item.status}
											</span>
										</td>
										<td className="py-3 px-4">
											<div className="font-medium text-text-main">
												{item.equipamento}
											</div>
											<div className="text-xs text-text-muted">
												{item.fornecedor}
											</div>
										</td>
										<td className="py-3 px-4 text-text-muted">
											{item.categoria}
										</td>
										<td className="py-3 px-4 text-center font-medium text-text-main">
											{item.qtd}
										</td>
										<td className="py-3 px-4 text-text-main">
											{item.dataEntrada}
										</td>
										<td className="py-3 px-4 text-text-muted">
											{item.dataSaida}
										</td>
										<td className="py-3 px-4 text-center">
											<span className="text-primary font-medium">
												{item.numFotos}📸
											</span>
										</td>
										<td className="py-3 px-4 text-right">
											{item.status === 'Em uso' && (
												<button
													onClick={() =>
														handleDevolver(item)
													}
													className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-1.5 rounded-lg transition-colors font-medium text-sm"
												>
													Devolver
												</button>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* Modal de Nova Locação */}
			{isModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="bg-surface w-full max-w-2xl rounded-xl shadow-xl flex flex-col max-h-[90vh]">
						<div className="flex justify-between items-center p-6 border-b border-border">
							<h2 className="text-xl font-bold text-text-main">
								Nova Locação (Entrada)
							</h2>
							<button
								onClick={() => setIsModalOpen(false)}
								className="text-text-muted hover:text-text-main"
							>
								<X size={24} />
							</button>
						</div>

						<div className="p-6 overflow-y-auto space-y-4">
							<div>
								<label className="block text-sm font-medium text-text-main mb-1">
									Equipamento *
								</label>
								<input
									type="text"
									placeholder="Ex: Betoneira 400L"
									className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary"
								/>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-text-main mb-1">
										Categoria
									</label>
									<select className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary">
										<option value="">
											Selecione ou digite...
										</option>
										<option value="Equipamentos">
											Equipamentos
										</option>
										<option value="Ferramentas">
											Ferramentas
										</option>
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-text-main mb-1">
										Unidade
									</label>
									<select className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary">
										<option value="">
											Selecione ou digite...
										</option>
										<option value="un">un</option>
									</select>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-text-main mb-1">
										Quantidade *
									</label>
									<input
										type="number"
										defaultValue={1}
										className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-text-main mb-1">
										Data de Entrada *
									</label>
									<input
										type="date"
										defaultValue="2026-03-21"
										className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-text-main mb-1">
									Fornecedor *
								</label>
								<input
									type="text"
									placeholder="Ex: Casa do Construtor"
									className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-text-main mb-1">
									Descrição / Observações
								</label>
								<textarea
									rows={3}
									className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary resize-none"
								></textarea>
							</div>

							<div>
								<label className="block text-sm font-medium text-text-main mb-2">
									Fotos da Chegada (Vistoria)
								</label>
								<button className="w-32 h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-text-muted hover:border-primary hover:text-primary transition-colors bg-background">
									<Camera size={24} className="mb-2" />
									<span className="text-sm font-medium">
										Adicionar
									</span>
								</button>
							</div>
						</div>

						<div className="p-6 border-t border-border flex justify-end gap-3 bg-surface rounded-b-xl">
							<button
								onClick={() => setIsModalOpen(false)}
								className="px-6 py-2 text-text-main hover:bg-background border border-transparent hover:border-border rounded-lg transition-colors font-medium"
							>
								Cancelar
							</button>
							<button className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
								Confirmar
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal de Devolução */}
			{isDevolucaoModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="bg-surface w-full max-w-md rounded-xl shadow-xl flex flex-col">
						<div className="flex justify-between items-center p-6 border-b border-border">
							<h2 className="text-xl font-bold text-text-main">
								Devolver Equipamento
							</h2>
							<button
								onClick={() => setIsDevolucaoModalOpen(false)}
								className="text-text-muted hover:text-text-main"
							>
								<X size={24} />
							</button>
						</div>

						<div className="p-6 space-y-4">
							<p className="text-text-muted mb-4">
								Realizando a devolução de{' '}
								<strong className="text-text-main">
									{selectedEquip?.equipamento}
								</strong>
								.
							</p>

							<div>
								<label className="block text-sm font-medium text-text-main mb-1">
									Data de Saída *
								</label>
								<input
									type="date"
									defaultValue="2026-03-21"
									className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-text-main mb-2">
									Fotos da Saída (Vistoria)
								</label>
								<button className="w-32 h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-text-muted hover:border-primary hover:text-primary transition-colors bg-background">
									<Camera size={24} className="mb-2" />
									<span className="text-sm font-medium">
										Adicionar
									</span>
								</button>
							</div>

							<div>
								<label className="block text-sm font-medium text-text-main mb-1">
									Observações de Devolução
								</label>
								<textarea
									rows={3}
									placeholder="Condição do equipamento, pendências..."
									className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary resize-none"
								></textarea>
							</div>
						</div>

						<div className="p-6 border-t border-border flex justify-end gap-3 bg-surface rounded-b-xl">
							<button
								onClick={() => setIsDevolucaoModalOpen(false)}
								className="px-6 py-2 text-text-main hover:bg-background border border-transparent hover:border-border rounded-lg transition-colors font-medium"
							>
								Cancelar
							</button>
							<button className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
								Finalizar Devolução
							</button>
						</div>
					</div>
				</div>
			)}
		</ERPLayout>
	);
}
