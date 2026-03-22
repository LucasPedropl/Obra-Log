import React, { useState } from 'react';
import { ERPLayout } from '../../../../components/layout/ERPLayout';
import { Search, Plus, Shield, UserPlus } from 'lucide-react';

export default function EPisDisponiveis() {
	const [searchTerm, setSearchTerm] = useState('');

	// Mock data
	const epis: any[] = [];

	const getRatioColor = (disponivel: number, total: number) => {
		if (disponivel === 0) return 'text-red-500 bg-red-500/10';
		if (disponivel < total) return 'text-yellow-500 bg-yellow-500/10';
		return 'text-green-500 bg-green-500/10';
	};

	return (
		<ERPLayout>
			<div className="space-y-6">
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
					<button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
						<Plus size={20} />
						<span>Novo EPI</span>
					</button>
				</div>

				<div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
					<div className="flex mb-6">
						<div className="relative flex-1 max-w-md">
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
					</div>

					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="border-b border-border">
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										EPI
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Estoque (Disponível/Total)
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted text-right">
										Ação
									</th>
								</tr>
							</thead>
							<tbody>
								{epis.map((epi) => (
									<tr
										key={epi.id}
										className="border-b border-border hover:bg-background/50 transition-colors"
									>
										<td className="py-3 px-4">
											<div className="font-medium text-text-main">
												{epi.nome}
											</div>
											<div className="text-xs text-text-muted">
												Cód: {epi.codigo}
											</div>
										</td>
										<td className="py-3 px-4">
											<span
												className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-sm font-medium ${getRatioColor(epi.disponiveis, epi.total)}`}
											>
												{epi.disponiveis} / {epi.total}
											</span>
										</td>
										<td className="py-3 px-4 text-right">
											<button
												disabled={epi.disponiveis === 0}
												className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors font-medium text-sm ${epi.disponiveis > 0 ? 'bg-primary/10 text-primary hover:bg-primary hover:text-white' : 'bg-background border border-border text-text-muted cursor-not-allowed'}`}
											>
												<UserPlus size={16} /> Entregar
												ao Colaborador
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
