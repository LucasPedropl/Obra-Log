import React, { useState, useEffect } from 'react';
import { ERPLayout } from '../../components/layout/ERPLayout';
import {
	Database,
	Image as ImageIcon,
	Activity,
	Users,
	HardDrive,
	RefreshCw,
	AlertTriangle,
	Server,
	Zap,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

// MOCK DATA: Pode ser substituído por chamadas de API reais futuramente
const mockMetrics = {
	database: {
		used: 125, // MB
		total: 500, // MB
		percentage: 25,
		records: 15420,
	},
	storage: {
		used: 2.1, // GB
		total: 10, // GB
		percentage: 21,
		files: 3241,
	},
	api: {
		requestsToday: 42500,
		limitDaily: 100000,
		percentage: 42.5,
	},
	users: {
		active: 145,
		total: 350,
	},
};

export default function InfraestruturaAdmin() {
	const { showToast } = useToast();
	const [loading, setLoading] = useState(true);
	const [metrics, setMetrics] = useState<typeof mockMetrics | null>(null);

	// Simulation of loading data
	useEffect(() => {
		let mounted = true;
		setTimeout(() => {
			if (mounted) {
				setMetrics(mockMetrics);
				setLoading(false);
			}
		}, 800);
		return () => {
			mounted = false;
		};
	}, []);

	const handleRefresh = () => {
		setLoading(true);
		setTimeout(() => {
			setLoading(false);
			showToast('Métricas atualizadas com sucesso', 'success');
		}, 1000);
	};

	const handleClearCache = () => {
		// Simulando limpeza de cache com toast (sem alert)
		showToast('Iniciando limpeza de cache do sistema...', 'info');
		setTimeout(() => {
			showToast('Cache limpo com sucesso!', 'success');
		}, 2000);
	};

	const handleOptimizeDB = () => {
		showToast(
			'Otimização de banco de dados iniciada. Isso pode levar alguns minutos.',
			'info',
		);
		setTimeout(() => {
			showToast('Otimização concluída!', 'success');
		}, 3000);
	};

	return (
		<ERPLayout title="Infraestrutura e Limites">
			<div className="flex-1 min-h-screen bg-slate-50 -m-4 md:-m-6 p-6 md:p-8">
				<div className="w-full">
					<div className="flex justify-between items-center mb-6">
						<div>
							<p className="text-sm text-slate-500">
								Monitoramento de recursos, armazenamento e uso
								do sistema.
							</p>
						</div>
						<button
							onClick={handleRefresh}
							disabled={loading}
							className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
						>
							<RefreshCw
								className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
							/>
							Atualizar
						</button>
					</div>

					{!metrics || loading ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							{[1, 2, 3, 4].map((i) => (
								<div
									key={i}
									className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-40 animate-pulse"
								>
									<div className="h-10 w-10 bg-slate-200 rounded-full mb-4"></div>
									<div className="h-4 w-1/2 bg-slate-200 rounded mb-2"></div>
									<div className="h-6 w-3/4 bg-slate-200 rounded"></div>
								</div>
							))}
						</div>
					) : (
						<div className="flex flex-col gap-6">
							{/* Cards Pincipais */}
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
								{/* Database Card */}
								<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col relative overflow-hidden">
									<div className="absolute top-0 right-0 p-4 opacity-5">
										<Database className="w-24 h-24" />
									</div>
									<div className="flex justify-between items-start mb-4">
										<div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
											<Database className="w-5 h-5" />
										</div>
										<span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-700 rounded-lg">
											{metrics.database.percentage}%
										</span>
									</div>
									<div>
										<h3 className="text-sm font-medium text-slate-500">
											Banco de Dados
										</h3>
										<p className="text-2xl font-bold text-slate-800 mt-1">
											{metrics.database.used}{' '}
											<span className="text-sm font-medium text-slate-500">
												/ {metrics.database.total} MB
											</span>
										</p>
										<p className="text-xs text-slate-400 mt-1">
											~{' '}
											{metrics.database.records.toLocaleString(
												'pt-BR',
											)}{' '}
											registros
										</p>
									</div>
									<div className="mt-4 w-full bg-slate-100 rounded-full h-1.5">
										<div
											className="bg-blue-500 h-1.5 rounded-full"
											style={{
												width: `${metrics.database.percentage}%`,
											}}
										></div>
									</div>
								</div>

								{/* Storage Card */}
								<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col relative overflow-hidden">
									<div className="absolute top-0 right-0 p-4 opacity-5">
										<ImageIcon className="w-24 h-24" />
									</div>
									<div className="flex justify-between items-start mb-4">
										<div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
											<HardDrive className="w-5 h-5" />
										</div>
										<span className="text-xs font-bold px-2 py-1 bg-purple-50 text-purple-700 rounded-lg">
											{metrics.storage.percentage}%
										</span>
									</div>
									<div>
										<h3 className="text-sm font-medium text-slate-500">
											Imagens / Arquivos
										</h3>
										<p className="text-2xl font-bold text-slate-800 mt-1">
											{metrics.storage.used}{' '}
											<span className="text-sm font-medium text-slate-500">
												/ {metrics.storage.total} GB
											</span>
										</p>
										<p className="text-xs text-slate-400 mt-1">
											~{' '}
											{metrics.storage.files.toLocaleString(
												'pt-BR',
											)}{' '}
											arquivos
										</p>
									</div>
									<div className="mt-4 w-full bg-slate-100 rounded-full h-1.5">
										<div
											className="bg-purple-500 h-1.5 rounded-full"
											style={{
												width: `${metrics.storage.percentage}%`,
											}}
										></div>
									</div>
								</div>

								{/* API Requests */}
								<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col relative overflow-hidden">
									<div className="absolute top-0 right-0 p-4 opacity-5">
										<Activity className="w-24 h-24" />
									</div>
									<div className="flex justify-between items-start mb-4">
										<div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
											<Activity className="w-5 h-5" />
										</div>
										<span className="text-xs font-bold px-2 py-1 bg-amber-50 text-amber-700 rounded-lg">
											{metrics.api.percentage}%
										</span>
									</div>
									<div>
										<h3 className="text-sm font-medium text-slate-500">
											Requisições API (Hoje)
										</h3>
										<p className="text-2xl font-bold text-slate-800 mt-1">
											{metrics.api.requestsToday.toLocaleString(
												'pt-BR',
											)}
										</p>
										<p className="text-xs text-slate-400 mt-1">
											Limite diário:{' '}
											{metrics.api.limitDaily.toLocaleString(
												'pt-BR',
											)}
										</p>
									</div>
									<div className="mt-4 w-full bg-slate-100 rounded-full h-1.5">
										<div
											className="bg-amber-500 h-1.5 rounded-full"
											style={{
												width: `${metrics.api.percentage}%`,
											}}
										></div>
									</div>
								</div>

								{/* Users Activity */}
								<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col relative overflow-hidden">
									<div className="absolute top-0 right-0 p-4 opacity-5">
										<Users className="w-24 h-24" />
									</div>
									<div className="flex justify-between items-start mb-4">
										<div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
											<Users className="w-5 h-5" />
										</div>
										<span className="text-xs font-bold px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
											Online
										</span>
									</div>
									<div>
										<h3 className="text-sm font-medium text-slate-500">
											Usuários Ativos
										</h3>
										<p className="text-2xl font-bold text-slate-800 mt-1">
											{metrics.users.active}{' '}
											<span className="text-sm font-medium text-slate-500">
												/ {metrics.users.total}
											</span>
										</p>
										<p className="text-xs text-slate-400 mt-1">
											Em todas as empresas
										</p>
									</div>
									<div className="mt-4 w-full bg-slate-100 rounded-full h-1.5">
										<div
											className="bg-emerald-500 h-1.5 rounded-full"
											style={{
												width: `${(metrics.users.active / metrics.users.total) * 100}%`,
											}}
										></div>
									</div>
								</div>
							</div>

							{/* Detailed Specs and Actions */}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								{/* Ações de Infraestrutura */}
								<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
									<div className="p-5 border-b border-slate-100 flex items-center gap-3">
										<Server className="w-5 h-5 text-slate-500" />
										<h2 className="text-lg font-bold text-slate-800">
											Manutenção e Ações
										</h2>
									</div>
									<div className="p-5 flex flex-col gap-4">
										<p className="text-sm text-slate-500 mb-2">
											Utilize estas ferramentas de
											manutenção para otimizar o uso de
											recursos, liberar conexões pendentes
											ou gerenciar espaço em disco.
										</p>

										<div className="flex flex-col sm:flex-row gap-4">
											<button
												onClick={handleClearCache}
												className="flex-1 flex flex-col items-center justify-center gap-2 p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
											>
												<Zap className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors" />
												<span className="text-sm font-bold text-slate-700 group-hover:text-blue-700">
													Limpar Cache
												</span>
												<span className="text-xs text-slate-500 text-center">
													Libera disco e otimiza
													velocidade de respostas da
													API
												</span>
											</button>

											<button
												onClick={handleOptimizeDB}
												className="flex-1 flex flex-col items-center justify-center gap-2 p-4 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
											>
												<Database className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition-colors" />
												<span className="text-sm font-bold text-slate-700 group-hover:text-emerald-700">
													Otimizar Banco
												</span>
												<span className="text-xs text-slate-500 text-center">
													Reorganiza índices e remove
													tabelas temporárias/lixo
												</span>
											</button>
										</div>
									</div>
								</div>

								{/* Status do Supabase/Provedor */}
								<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
									<div className="p-5 border-b border-slate-100 flex items-center gap-3">
										<Activity className="w-5 h-5 text-slate-500" />
										<h2 className="text-lg font-bold text-slate-800">
											Status dos Serviços
										</h2>
									</div>
									<div className="p-0">
										<ul className="divide-y divide-slate-100">
											<li className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
												<div>
													<p className="font-medium text-slate-800 text-sm">
														Supabase Database Region
													</p>
													<p className="text-xs text-slate-500">
														sa-east-1 (São Paulo)
													</p>
												</div>
												<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
													<span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{' '}
													Operacional
												</span>
											</li>
											<li className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
												<div>
													<p className="font-medium text-slate-800 text-sm">
														Supabase Storage
													</p>
													<p className="text-xs text-slate-500">
														Buckets: empresas,
														avatars
													</p>
												</div>
												<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
													<span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{' '}
													Operacional
												</span>
											</li>
											<li className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
												<div>
													<p className="font-medium text-slate-800 text-sm">
														Autenticação (GoTrue)
													</p>
													<p className="text-xs text-slate-500">
														Serviço de Login &
														Tokens JWT
													</p>
												</div>
												<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
													<span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{' '}
													Operacional
												</span>
											</li>
										</ul>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</ERPLayout>
	);
}
