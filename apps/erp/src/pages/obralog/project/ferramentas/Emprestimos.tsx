import React, { useState } from 'react';
import { ERPLayout } from '../../../../components/layout/ERPLayout';
import { Search, UserCheck, Filter, ChevronDown } from 'lucide-react';

export default function FerramentasEmprestimos() {
	const [searchTerm, setSearchTerm] = useState('');

	// Mock data
	const emprestimos: any[] = [];

	return (
		<ERPLayout>
			<div className="space-y-6 flex flex-col h-full relative w-full">
				<div>
					<h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
						<UserCheck className="text-primary" /> Ferramentas em
						Uso (Empréstimos)
					</h1>
					<p className="text-text-muted mt-1">
						Controle de ferramentas com os colaboradores
					</p>
				</div>

				<div className="bg-surface border border-border rounded-sm shadow-sm p-4 sm:p-6 overflow-hidden">
					<div className="flex flex-col sm:flex-row gap-4 mb-6">
						<div className="relative flex-1">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Search size={18} className="text-text-muted" />
							</div>
							<input
								type="text"
								placeholder="Buscar por colaborador ou ferramenta..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary transition-colors"
							/>
						</div>
						<div className="flex gap-2">
							<button className="flex items-center gap-2 bg-background border border-border text-text-main px-4 py-2 rounded-lg hover:border-primary transition-colors">
								<Filter size={20} />
								<span>Filtros</span>
								<ChevronDown
									size={16}
									className="text-text-muted ml-1"
								/>
							</button>
						</div>
					</div>

					<div className="overflow-x-auto bg-surface border border-border rounded-lg">
						<table className="w-full text-left [&_th]:border-b [&_th]:border-border [&_td]:border-b [&_td]:border-border [&_tbody_tr:last-child_td]:border-b-0">
							<thead>
								<tr className="border-b border-border">
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Ferramenta
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Colaborador
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Data/Hora Retirada
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Status
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted text-right">
										Ação
									</th>
								</tr>
							</thead>
							<tbody>
								{emprestimos.map((emp) => (
									<tr
										key={emp.id}
										className="border-b border-border hover:bg-black/5 dark:hover:bg-white/5 even:bg-black/[0.02] dark:even:bg-white/[0.02] transition-colors"
									>
										<td className="py-3 px-4">
											<div className="font-medium text-text-main">
												{emp.ferramenta}
											</div>
											<div className="text-xs text-text-muted">
												{emp.codigo}
											</div>
										</td>
										<td className="py-3 px-4 text-text-main">
											{emp.colaborador}
										</td>
										<td className="py-3 px-4 text-text-muted">
											{emp.dataEmprestimo}
										</td>
										<td className="py-3 px-4">
											<span
												className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-sm font-medium ${emp.status === 'Atrasado' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}
											>
												{emp.status}
											</span>
										</td>
										<td className="py-3 px-4 text-right">
											<button className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-1.5 rounded-lg transition-colors font-medium text-sm">
												Devolução
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</ERPLayout>
	);
}
