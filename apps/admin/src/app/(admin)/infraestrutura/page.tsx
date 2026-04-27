'use client';

import React, { useState, useEffect } from 'react';
import {
	Database,
	HardDrive,
	Activity,
	Users,
	RefreshCw,
	Server,
	Zap,
	AlertTriangle,
	Loader2,
	X,
} from 'lucide-react';
import { createClient } from '@/config/supabase';
import { deleteDatabaseAction } from '@/app/actions/infra';
import { useToast } from '@/components/ui/toaster';

export default function InfraestruturaPage() {
	const { addToast } = useToast();
	const [loading, setLoading] = useState(true);
	const [isResetModalOpen, setIsResetModalOpen] = useState(false);
	const [isResetting, setIsResetting] = useState(false);
	const [resetConfirmText, setResetConfirmText] = useState('');

	const supabase = createClient();

	useEffect(() => {
		const timer = setTimeout(() => setLoading(false), 600);
		return () => clearTimeout(timer);
	}, []);

	const handleRefresh = () => {
		setLoading(true);
		setTimeout(() => setLoading(false), 800);
	};

	const handleResetDatabase = async () => {
		if (resetConfirmText !== 'CONFIRMAR') return;
		setIsResetting(true);
		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) throw new Error('Usuário não autenticado.');
			await deleteDatabaseAction(user.id);
			setIsResetModalOpen(false);
			setResetConfirmText('');
			addToast('Banco de dados limpo com sucesso.', 'success');
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Erro desconhecido';
			addToast(message, 'error');
		} finally {
			setIsResetting(false);
		}
	};

	// Mock metrics (pode ser substituído por dados reais futuramente)
	const metrics = {
		database: { used: 125, total: 500, percentage: 25, records: 15420 },
		storage: { used: 2.1, total: 10, percentage: 21, files: 3241 },
		api: { requestsToday: 42500, limitDaily: 100000, percentage: 42.5 },
		users: { active: 145, total: 350 },
	};

	return (
		<div className="flex flex-col gap-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<p className="text-sm text-slate-500">
					Monitoramento de recursos, armazenamento e uso do sistema.
				</p>
				<button
					onClick={handleRefresh}
					disabled={loading}
					className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all disabled:opacity-50"
				>
					<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
					Atualizar
				</button>
			</div>

			{loading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{[1, 2, 3, 4].map((i) => (
						<div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-40 animate-pulse">
							<div className="h-10 w-10 bg-slate-200 rounded-full mb-4"></div>
							<div className="h-4 w-1/2 bg-slate-200 rounded mb-2"></div>
							<div className="h-6 w-3/4 bg-slate-200 rounded"></div>
						</div>
					))}
				</div>
			) : (
				<>
					{/* Metric Cards */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						{/* Database */}
						<MetricCard
							icon={Database}
							iconBg="bg-blue-50"
							iconColor="text-blue-600"
							badgeBg="bg-blue-50"
							badgeColor="text-blue-700"
							barColor="bg-blue-500"
							title="Banco de Dados"
							value={`${metrics.database.used}`}
							suffix={`/ ${metrics.database.total} MB`}
							detail={`~ ${metrics.database.records.toLocaleString('pt-BR')} registros`}
							percentage={metrics.database.percentage}
						/>
						{/* Storage */}
						<MetricCard
							icon={HardDrive}
							iconBg="bg-purple-50"
							iconColor="text-purple-600"
							badgeBg="bg-purple-50"
							badgeColor="text-purple-700"
							barColor="bg-purple-500"
							title="Imagens / Arquivos"
							value={`${metrics.storage.used}`}
							suffix={`/ ${metrics.storage.total} GB`}
							detail={`~ ${metrics.storage.files.toLocaleString('pt-BR')} arquivos`}
							percentage={metrics.storage.percentage}
						/>
						{/* API */}
						<MetricCard
							icon={Activity}
							iconBg="bg-amber-50"
							iconColor="text-amber-600"
							badgeBg="bg-amber-50"
							badgeColor="text-amber-700"
							barColor="bg-amber-500"
							title="Requisições API (Hoje)"
							value={metrics.api.requestsToday.toLocaleString('pt-BR')}
							detail={`Limite diário: ${metrics.api.limitDaily.toLocaleString('pt-BR')}`}
							percentage={metrics.api.percentage}
						/>
						{/* Users */}
						<MetricCard
							icon={Users}
							iconBg="bg-emerald-50"
							iconColor="text-emerald-600"
							badgeBg="bg-emerald-50"
							badgeColor="text-emerald-700"
							barColor="bg-emerald-500"
							title="Usuários Ativos"
							value={`${metrics.users.active}`}
							suffix={`/ ${metrics.users.total}`}
							detail="Em todas as empresas"
							percentage={(metrics.users.active / metrics.users.total) * 100}
							badgeText="Online"
						/>
					</div>

					{/* Actions + Status */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Actions */}
						<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
							<div className="p-5 border-b border-slate-100 flex items-center gap-3">
								<Server className="w-5 h-5 text-slate-500" />
								<h2 className="text-lg font-bold text-slate-800">Manutenção e Ações</h2>
							</div>
							<div className="p-5 flex flex-col gap-4">
								<p className="text-sm text-slate-500 mb-2">
									Utilize estas ferramentas de manutenção para otimizar o uso de recursos ou resetar o banco de dados.
								</p>
								<div className="flex flex-col sm:flex-row gap-4">
									<button className="flex-1 flex flex-col items-center justify-center gap-2 p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
										<Zap className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors" />
										<span className="text-sm font-bold text-slate-700 group-hover:text-blue-700">Limpar Cache</span>
										<span className="text-xs text-slate-500 text-center">Libera disco e otimiza velocidade</span>
									</button>
									<button className="flex-1 flex flex-col items-center justify-center gap-2 p-4 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group">
										<Database className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition-colors" />
										<span className="text-sm font-bold text-slate-700 group-hover:text-emerald-700">Otimizar Banco</span>
										<span className="text-xs text-slate-500 text-center">Reorganiza índices e remove lixo</span>
									</button>
								</div>

								{/* Botão perigoso */}
								<div className="mt-4 pt-4 border-t border-slate-100">
									<button
										onClick={() => setIsResetModalOpen(true)}
										className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-red-200 rounded-xl text-red-500 hover:bg-red-50 hover:border-red-400 transition-all text-sm font-medium"
									>
										<AlertTriangle className="w-4 h-4" />
										Resetar Banco de Dados
									</button>
								</div>
							</div>
						</div>

						{/* Status */}
						<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
							<div className="p-5 border-b border-slate-100 flex items-center gap-3">
								<Activity className="w-5 h-5 text-slate-500" />
								<h2 className="text-lg font-bold text-slate-800">Status dos Serviços</h2>
							</div>
							<ul className="divide-y divide-slate-100">
								<ServiceStatusRow name="Supabase Database Region" detail="sa-east-1 (São Paulo)" />
								<ServiceStatusRow name="Supabase Storage" detail="Buckets: empresas, avatars" />
								<ServiceStatusRow name="Autenticação (GoTrue)" detail="Serviço de Login & Tokens JWT" />
							</ul>
						</div>
					</div>
				</>
			)}

			{/* ── Modal Reset DB ── */}
			{isResetModalOpen && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
					<div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
						<div className="p-6 pt-8 text-center flex flex-col items-center">
							<div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
								<AlertTriangle className="w-8 h-8" />
							</div>
							<h2 className="text-xl font-bold text-slate-900 mb-2">
								Resetar Banco de Dados?
							</h2>
							<p className="text-slate-500 mb-4 max-w-sm text-sm">
								Isso apagará <b>TODOS</b> os dados do sistema (empresas, usuários, obras, inventários). Apenas seu usuário Super-Admin será preservado. Esta ação é <b>irreversível</b>.
							</p>
							<div className="w-full mb-4">
								<label className="block text-sm font-medium text-slate-700 mb-1 text-left">
									Digite <span className="font-mono font-bold text-red-600">CONFIRMAR</span> para prosseguir:
								</label>
								<input
									type="text"
									value={resetConfirmText}
									onChange={(e) => setResetConfirmText(e.target.value)}
									className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-sm font-mono"
									placeholder="CONFIRMAR"
								/>
							</div>
							<div className="flex justify-center gap-3 w-full">
								<button
									onClick={() => { setIsResetModalOpen(false); setResetConfirmText(''); }}
									disabled={isResetting}
									className="flex-1 px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
								>
									Cancelar
								</button>
								<button
									onClick={handleResetDatabase}
									disabled={isResetting || resetConfirmText !== 'CONFIRMAR'}
									className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
								>
									{isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sim, Apagar Tudo'}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

// ── Sub-components ──

interface MetricCardProps {
	icon: React.FC<{ className?: string }>;
	iconBg: string;
	iconColor: string;
	badgeBg: string;
	badgeColor: string;
	barColor: string;
	title: string;
	value: string;
	suffix?: string;
	detail: string;
	percentage: number;
	badgeText?: string;
}

function MetricCard({ icon: Icon, iconBg, iconColor, badgeBg, badgeColor, barColor, title, value, suffix, detail, percentage, badgeText }: MetricCardProps) {
	return (
		<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col relative overflow-hidden">
			<div className="flex justify-between items-start mb-4">
				<div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center ${iconColor}`}>
					<Icon className="w-5 h-5" />
				</div>
				<span className={`text-xs font-bold px-2 py-1 ${badgeBg} ${badgeColor} rounded-lg`}>
					{badgeText || `${Math.round(percentage)}%`}
				</span>
			</div>
			<div>
				<h3 className="text-sm font-medium text-slate-500">{title}</h3>
				<p className="text-2xl font-bold text-slate-800 mt-1">
					{value}{' '}
					{suffix && <span className="text-sm font-medium text-slate-500">{suffix}</span>}
				</p>
				<p className="text-xs text-slate-400 mt-1">{detail}</p>
			</div>
			<div className="mt-4 w-full bg-slate-100 rounded-full h-1.5">
				<div className={`${barColor} h-1.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
			</div>
		</div>
	);
}

function ServiceStatusRow({ name, detail }: { name: string; detail: string }) {
	return (
		<li className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
			<div>
				<p className="font-medium text-slate-800 text-sm">{name}</p>
				<p className="text-xs text-slate-500">{detail}</p>
			</div>
			<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
				<span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
				Operacional
			</span>
		</li>
	);
}
