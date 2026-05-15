import React from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import {
	Building2,
	Users,
	PackageOpen,
	TrendingUp,
	AlertCircle,
	ArrowUpRight,
	ArrowDownRight,
	Clock,
} from 'lucide-react';

export default function DashboardPage() {
	return (
		<div className="w-full flex flex-col gap-6">
			<PageHeader
				title="Dashboard"
				description="Visão geral do sistema e indicadores rápidos."
			/>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<div className="bg-white rounded-none border border-gray-200 p-5   transition-all">
					<div className="flex justify-between items-start">
						<div>
							<p className="text-sm font-medium text-gray-500 mb-1">
								Obras Ativas
							</p>
							<h3 className="text-3xl font-bold text-gray-900">
								12
							</h3>
						</div>
						<div className="p-3 bg-blue-50 text-blue-600 border border-blue-100">
							<Building2 className="w-6 h-6" />
						</div>
					</div>
					<div className="mt-4 flex items-center text-sm">
						<ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
						<span className="text-emerald-500 font-medium">+2</span>
						<span className="text-gray-400 ml-2">neste mês</span>
					</div>
				</div>

				<div className="bg-white rounded-none border border-gray-200 p-5   transition-all">
					<div className="flex justify-between items-start">
						<div>
							<p className="text-sm font-medium text-gray-500 mb-1">
								Colaboradores
							</p>
							<h3 className="text-3xl font-bold text-gray-900">
								148
							</h3>
						</div>
						<div className="p-3 bg-indigo-50 text-indigo-600 border border-indigo-100">
							<Users className="w-6 h-6" />
						</div>
					</div>
					<div className="mt-4 flex items-center text-sm">
						<ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
						<span className="text-emerald-500 font-medium">
							+12
						</span>
						<span className="text-gray-400 ml-2">neste mês</span>
					</div>
				</div>

				<div className="bg-white rounded-none border border-gray-200 p-5   transition-all">
					<div className="flex justify-between items-start">
						<div>
							<p className="text-sm font-medium text-gray-500 mb-1">
								Insumos em Baixa
							</p>
							<h3 className="text-3xl font-bold text-gray-900">
								24
							</h3>
						</div>
						<div className="p-3 bg-orange-50 text-orange-600 border border-orange-100">
							<PackageOpen className="w-6 h-6" />
						</div>
					</div>
					<div className="mt-4 flex items-center text-sm">
						<ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
						<span className="text-red-500 font-medium">-5%</span>
						<span className="text-gray-400 ml-2">
							vs último mês
						</span>
					</div>
				</div>

				<div className="bg-white rounded-none border border-gray-200 p-5   transition-all">
					<div className="flex justify-between items-start">
						<div>
							<p className="text-sm font-medium text-gray-500 mb-1">
								Custo Total Previsto
							</p>
							<h3 className="text-3xl font-bold text-gray-900">
								R$ 1.2M
							</h3>
						</div>
						<div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100">
							<TrendingUp className="w-6 h-6" />
						</div>
					</div>
					<div className="mt-4 flex items-center text-sm">
						<ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
						<span className="text-emerald-500 font-medium">
							+10%
						</span>
						<span className="text-gray-400 ml-2">
							vs último mês
						</span>
					</div>
				</div>
			</div>

			{/* Gráficos e Atividades / Sub-grids */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Simulador de Gráfico / Métricas da Obra */}
				<div className="lg:col-span-2 bg-white border border-gray-200 rounded-none p-6 ">
					<div className="flex items-center justify-between mb-6">
						<h3 className="text-lg font-semibold text-gray-900">
							Evolução do Custo
						</h3>
						<select className="bg-gray-50 border-none text-sm text-gray-600 rounded-none px-3 py-1 cursor-pointer focus:ring-0">
							<option>Últimos 6 meses</option>
							<option>Último Ano</option>
						</select>
					</div>

					{/* Gráfico Simulado via CSS */}
					<div className="h-64 flex items-end justify-between gap-2 mt-4 px-2">
						{[40, 70, 55, 90, 65, 80].map((height, i) => (
							<div
								key={i}
								className="w-full flex flex-col items-center gap-2 group"
							>
								<div
									className="w-full bg-blue-100 group-hover:bg-blue-200 rounded-none relative transition-all"
									style={{ height: `${height}%` }}
								>
									<div
										className="absolute bottom-0 w-full bg-blue-600 group-hover:bg-blue-700 rounded-none transition-all"
										style={{ height: `${height - 20}%` }}
									/>
								</div>
								<span className="text-xs font-medium text-gray-400">
									{
										[
											'Nov',
											'Dez',
											'Jan',
											'Fev',
											'Mar',
											'Abr',
										][i]
									}
								</span>
							</div>
						))}
					</div>
				</div>

				{/* Painel de Avisos/Atividades */}
				<div className="bg-white border border-gray-200 rounded-none p-6 ">
					<h3 className="text-lg font-semibold text-gray-900 mb-6">
						Avisos Recentes
					</h3>

					<div className="space-y-6">
						{[
							{
								icon: AlertCircle,
								color: 'text-red-500',
								bg: 'bg-red-50',
								title: 'Cimento esgotando',
								desc: 'Estoque da Obra Central menor que 10%.',
								time: 'Há 2 horas',
							},
							{
								icon: Clock,
								color: 'text-orange-500',
								bg: 'bg-orange-50',
								title: 'Atraso de Entrega',
								desc: 'Fornecedor A atrasou entrega do Lote 4.',
								time: 'Há 5 horas',
							},
							{
								icon: Building2,
								color: 'text-blue-500',
								bg: 'bg-blue-50',
								title: 'Nova Fase Iniciada',
								desc: 'Fundação da Obra Sul 1 concluída.',
								time: 'Ontem',
							},
						].map((item, idx) => (
							<div key={idx} className="flex gap-4">
								<div
									className={`mt-1 w-10 h-10 border flex items-center justify-center shrink-0 ${item.bg} ${item.color} ${item.color.replace('text-', 'border-').replace('500', '100')}`}
								>
									<item.icon className="w-5 h-5" />
								</div>
								<div>
									<p className="text-sm font-semibold text-gray-900">
										{item.title}
									</p>
									<p className="text-sm text-gray-500 mt-0.5">
										{item.desc}
									</p>
									<p className="text-xs font-medium text-gray-400 mt-2">
										{item.time}
									</p>
								</div>
							</div>
						))}
					</div>

					<button className="w-full mt-6 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-colors">
						Ver todas as notificações
					</button>
				</div>
			</div>
		</div>
	);
}
