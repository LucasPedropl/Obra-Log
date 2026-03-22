import React, { useState } from 'react';
import { ERPLayout } from '../../../../components/layout/ERPLayout';
import { Search, History, Users, ArrowLeft } from 'lucide-react';

export default function EPisHistorico() {
	const [activeTab, setActiveTab] = useState<'geral' | 'colaborador'>(
		'geral',
	);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedColaborador, setSelectedColaborador] = useState<
		number | null
	>(null);

	// Mock Data
	const historicoGeral: any[] = [];

	const colaboradoresEpi: any[] = [];

	const handleColabClick = (id: number) => {
		setSelectedColaborador(id);
	};

	const renderGeral = () => (
		<div className="overflow-x-auto">
			<table className="w-full text-left border-collapse">
				<thead>
					<tr className="border-b border-border">
						<th className="py-3 px-4 text-sm font-semibold text-text-muted">
							Data/Hora
						</th>
						<th className="py-3 px-4 text-sm font-semibold text-text-muted">
							EPI Entregue
						</th>
						<th className="py-3 px-4 text-sm font-semibold text-text-muted">
							Colaborador
						</th>
						<th className="py-3 px-4 text-sm font-semibold text-text-muted">
							Resp. pela Entrega
						</th>
					</tr>
				</thead>
				<tbody>
					{historicoGeral.map((item) => (
						<tr
							key={item.id}
							className="border-b border-border hover:bg-background/50 transition-colors"
						>
							<td className="py-3 px-4 text-text-main">
								{item.data}
							</td>
							<td className="py-3 px-4 font-medium text-text-main">
								{item.epi}
							</td>
							<td className="py-3 px-4 text-text-main">
								{item.colaborador}
							</td>
							<td className="py-3 px-4 text-text-muted">
								{item.responsavelEntrega}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);

	const renderListaColaboradores = () => (
		<div className="overflow-x-auto">
			<table className="w-full text-left border-collapse">
				<thead>
					<tr className="border-b border-border">
						<th className="py-3 px-4 text-sm font-semibold text-text-muted">
							Colaborador
						</th>
						<th className="py-3 px-4 text-sm font-semibold text-text-muted">
							Função
						</th>
						<th className="py-3 px-4 text-sm font-semibold text-text-muted text-center">
							EPIs Recebidos
						</th>
						<th className="py-3 px-4 text-sm font-semibold text-text-muted text-right">
							Ação
						</th>
					</tr>
				</thead>
				<tbody>
					{colaboradoresEpi.map((colab) => (
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
							<td className="py-3 px-4 text-center">
								<span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold text-sm">
									{colab.qtdEpis}
								</span>
							</td>
							<td className="py-3 px-4 text-right">
								<button
									onClick={() => handleColabClick(colab.id)}
									className="text-primary hover:underline font-medium text-sm"
								>
									Ver Detalhes
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);

	const renderDetalheColaborador = () => {
		const colab = colaboradoresEpi.find(
			(c) => c.id === selectedColaborador,
		);
		const colabHistorico = historicoGeral.filter(
			(h) => h.colaborador === colab?.nome,
		);

		return (
			<div className="space-y-4">
				<div className="flex items-center gap-4 mb-4">
					<button
						onClick={() => setSelectedColaborador(null)}
						className="p-2 border border-border text-text-muted hover:text-text-main hover:bg-background rounded-lg transition-colors"
					>
						<ArrowLeft size={18} />
					</button>
					<div>
						<h2 className="text-xl font-bold text-text-main">
							{colab?.nome}
						</h2>
						<p className="text-sm text-text-muted">
							{colab?.funcao} • {colab?.qtdEpis} EPIs recebidos
						</p>
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="border-b border-border">
								<th className="py-3 px-4 text-sm font-semibold text-text-muted">
									Data/Hora
								</th>
								<th className="py-3 px-4 text-sm font-semibold text-text-muted">
									EPI Entregue
								</th>
								<th className="py-3 px-4 text-sm font-semibold text-text-muted">
									Resp. pela Entrega
								</th>
							</tr>
						</thead>
						<tbody>
							{colabHistorico.map((item) => (
								<tr
									key={item.id}
									className="border-b border-border hover:bg-background/50 transition-colors"
								>
									<td className="py-3 px-4 text-text-main">
										{item.data}
									</td>
									<td className="py-3 px-4 font-medium text-text-main">
										{item.epi}
									</td>
									<td className="py-3 px-4 text-text-muted">
										{item.responsavelEntrega}
									</td>
								</tr>
							))}
							{colabHistorico.length === 0 && (
								<tr>
									<td
										colSpan={3}
										className="py-6 text-center text-text-muted"
									>
										Nenhum registro encontrado.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		);
	};

	return (
		<ERPLayout>
			<div className="space-y-6">
				<div>
					<h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
						<History className="text-primary" /> Histórico de EPIs
					</h1>
					<p className="text-text-muted mt-1">
						Acompanhe as entregas de equipamentos para a equipe
					</p>
				</div>

				<div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
					{/* Tabs */}
					{!selectedColaborador && (
						<div className="flex border-b border-border mb-6">
							<button
								onClick={() => setActiveTab('geral')}
								className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
									activeTab === 'geral'
										? 'border-primary text-primary'
										: 'border-transparent text-text-muted hover:text-text-main'
								}`}
							>
								<History size={18} /> Geral
							</button>
							<button
								onClick={() => setActiveTab('colaborador')}
								className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
									activeTab === 'colaborador'
										? 'border-primary text-primary'
										: 'border-transparent text-text-muted hover:text-text-main'
								}`}
							>
								<Users size={18} /> Por Colaborador
							</button>
						</div>
					)}

					<div className="flex mb-6">
						<div className="relative flex-1 max-w-md">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Search size={18} className="text-text-muted" />
							</div>
							<input
								type="text"
								placeholder={
									selectedColaborador
										? 'Buscar no histórico do colaborador...'
										: 'Buscar...'
								}
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary transition-colors"
							/>
						</div>
					</div>

					{selectedColaborador
						? renderDetalheColaborador()
						: activeTab === 'geral'
							? renderGeral()
							: renderListaColaboradores()}
				</div>
			</div>
		</ERPLayout>
	);
}
