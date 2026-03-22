import React, { useState } from 'react';
import { ERPLayout } from '../../../components/layout/ERPLayout';
import { useParams } from 'react-router-dom';
import { Search, UserPlus, Users } from 'lucide-react';

export default function ColaboradoresProjeto() {
	const { id } = useParams();
	const [searchTerm, setSearchTerm] = useState('');

	// Mock data
	const colaboradores: any[] = [];
	return (
		<ERPLayout>
			<div className="space-y-6">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div>
						<h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
							<Users className="text-primary" /> Colaboradores da
							Obra
						</h1>
						<p className="text-text-muted mt-1">
							Gerenciamento da equipe alocada na obra atual
						</p>
					</div>

					<button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
						<UserPlus size={20} />
						<span>Alocar Colaborador</span>
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
								placeholder="Buscar colaborador..."
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
										Nome
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Função
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Status
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted text-right">
										Ações
									</th>
								</tr>
							</thead>
							<tbody>
								{colaboradores.map((colab) => (
									<tr
										key={colab.id}
										className="border-b border-border hover:bg-background/50 transition-colors"
									>
										<td className="py-3 px-4 font-medium text-text-main">
											{colab.nome}
										</td>
										<td className="py-3 px-4 text-text-muted">
											{colab.funcao}
										</td>
										<td className="py-3 px-4">
											<span className="inline-flex items-center justify-center bg-green-500/10 text-green-500 text-sm font-medium px-2 py-1 rounded-full">
												{colab.status}
											</span>
										</td>
										<td className="py-3 px-4 text-right">
											<button className="text-red-500 hover:underline text-sm font-medium">
												Remover
											</button>
										</td>
									</tr>
								))}
								{colaboradores.length === 0 && (
									<tr>
										<td
											colSpan={4}
											className="py-8 text-center text-text-muted"
										>
											Nenhum colaborador alocado nesta
											obra ainda.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</ERPLayout>
	);
}
