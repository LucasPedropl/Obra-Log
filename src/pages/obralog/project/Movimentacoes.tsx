import React, { useState } from 'react';
import { ERPLayout } from '../../../components/layout/ERPLayout';
import { Search, ArrowRightLeft, Filter } from 'lucide-react';

export default function Movimentacoes() {
	const [searchTerm, setSearchTerm] = useState('');

	// Mock data aggregating all movements
	const movimentacoes: any[] = [];
	const getTipoStyle = (tipo: string) => {
		if (tipo.includes('Entrada') || tipo.includes('Devolução')) {
			return 'bg-green-500/10 text-green-500';
		}
		if (
			tipo.includes('Saída') ||
			tipo.includes('Empréstimo') ||
			tipo.includes('Retirada')
		) {
			return 'bg-blue-500/10 text-blue-500';
		}
		return 'bg-zinc-500/10 text-zinc-500';
	};

	return (
		<ERPLayout>
			<div className="space-y-6">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div>
						<h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
							<ArrowRightLeft className="text-primary" />{' '}
							Movimentações da Obra
						</h1>
						<p className="text-text-muted mt-1">
							Histórico global de todas as entradas, saídas,
							locações e empréstimos
						</p>
					</div>
				</div>

				<div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
					<div className="flex flex-col sm:flex-row gap-4 mb-6">
						<div className="relative flex-1">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Search size={18} className="text-text-muted" />
							</div>
							<input
								type="text"
								placeholder="Buscar por item, responsável ou tipo..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary transition-colors"
							/>
						</div>
						<button className="flex items-center gap-2 bg-background border border-border text-text-main px-4 py-2 rounded-lg hover:border-primary transition-colors">
							<Filter size={20} />
							<span>Filtros</span>
						</button>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="border-b border-border">
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Data/Hora
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Tipo
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Item Movimentado
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted text-center">
										Qtd
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Responsável
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Origem/Destino/Obs
									</th>
								</tr>
							</thead>
							<tbody>
								{movimentacoes.map((mov) => (
									<tr
										key={mov.id}
										className="border-b border-border hover:bg-background/50 transition-colors"
									>
										<td className="py-3 px-4 text-text-main whitespace-nowrap">
											{mov.data}
										</td>
										<td className="py-3 px-4">
											<span
												className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold ${getTipoStyle(mov.tipo)}`}
											>
												{mov.tipo}
											</span>
										</td>
										<td className="py-3 px-4 font-medium text-text-main">
											{mov.item}
										</td>
										<td className="py-3 px-4 text-center font-bold text-text-main">
											{mov.qtd}
										</td>
										<td className="py-3 px-4 text-text-main">
											{mov.responsavel}
										</td>
										<td className="py-3 px-4 text-text-muted text-sm">
											{mov.origemDestino}
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
