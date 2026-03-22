import React, { useState } from 'react';
import { ERPLayout } from '../../../../components/layout/ERPLayout';
import { Search, Plus, Filter, Wrench } from 'lucide-react';

export default function FerramentasDisponiveis() {
	const [searchTerm, setSearchTerm] = useState('');

	// Mock data
	const ferramentas: any[] = [];

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
							<Wrench className="text-primary" /> Ferramentas
							Disponíveis
						</h1>
						<p className="text-text-muted mt-1">
							Controle de estoque de ferramentas da obra
						</p>
					</div>
					<button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
						<Plus size={20} />
						<span>Nova Ferramenta</span>
					</button>
				</div>

				<div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
					<div className="flex flex-col sm:flex-row gap-4 mb-6">
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
						<button className="flex items-center gap-2 bg-background border border-border text-text-main px-4 py-2 rounded-lg hover:border-primary transition-colors">
							<Filter size={20} />
							<span>Filtros</span>
						</button>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{ferramentas.map((ferramenta) => (
							<div
								key={ferramenta.id}
								className="bg-background border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
							>
								<div className="flex justify-between items-start mb-4">
									<div>
										<h3 className="font-semibold text-text-main">
											{ferramenta.nome}
										</h3>
										<p className="text-sm text-text-muted">
											{ferramenta.codigo}
										</p>
									</div>
									<div
										className={`px-2 py-1 rounded-md text-sm font-bold flex items-center ${getRatioColor(ferramenta.disponiveis, ferramenta.total)}`}
									>
										{ferramenta.disponiveis} /{' '}
										{ferramenta.total}
									</div>
								</div>
								<div className="flex gap-2 mt-4">
									<button
										className="flex-1 text-center py-2 text-sm font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
										disabled={ferramenta.disponiveis === 0}
									>
										Emprestar
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</ERPLayout>
	);
}
