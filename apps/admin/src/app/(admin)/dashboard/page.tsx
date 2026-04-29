'use client';

import { useEffect, useState } from 'react';
import { Building2, Users, LayoutDashboard, Loader2, Zap, AlertTriangle, ChevronRight } from 'lucide-react';
import { listAccountsAction } from '@/app/actions/accounts';

interface DashboardStats {
	totalAccounts: number;
	activeAccounts: number;
}

export default function DashboardPage() {
	const [stats, setStats] = useState<DashboardStats | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadStats() {
			try {
				const accounts = await listAccountsAction();
				setStats({
					totalAccounts: accounts.length,
					activeAccounts: accounts.filter((a) => a.status === 'ACTIVE').length,
				});
			} catch (err) {
				console.error('Erro ao carregar stats:', err);
			} finally {
				setLoading(false);
			}
		}
		loadStats();
	}, []);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-24">
				<Loader2 className="w-8 h-8 animate-spin text-blue-600" />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			{/* Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start gap-4">
					<div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
						<Building2 className="w-6 h-6" />
					</div>
					<div>
						<p className="text-sm font-medium text-slate-500">
							Empresas Cadastradas
						</p>
						<p className="text-3xl font-bold text-slate-800 mt-1">
							{stats?.totalAccounts ?? 0}
						</p>
					</div>
				</div>

				<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start gap-4">
					<div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
						<Building2 className="w-6 h-6" />
					</div>
					<div>
						<p className="text-sm font-medium text-slate-500">
							Empresas Ativas
						</p>
						<p className="text-3xl font-bold text-slate-800 mt-1">
							{stats?.activeAccounts ?? 0}
						</p>
					</div>
				</div>

				<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start gap-4">
					<div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
						<Users className="w-6 h-6" />
					</div>
					<div>
						<p className="text-sm font-medium text-slate-500">
							Status do Sistema
						</p>
						<p className="text-lg font-bold text-emerald-600 mt-1">
							Operacional
						</p>
					</div>
				</div>
			</div>

			{/* Welcome card */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col items-center text-center">
					<div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
						<LayoutDashboard size={32} />
					</div>
					<h2 className="text-xl font-bold text-slate-800 mb-2">
						Bem-vindo ao Painel!
					</h2>
					<p className="text-sm text-slate-500 max-w-sm">
						Aqui você tem uma visão geral de todos os dados do sistema.
						Acesse o menu lateral para gerenciar empresas e infraestrutura.
					</p>
				</div>

				<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
					<h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
						<Zap className="w-5 h-5 text-amber-500" /> Ações Rápidas
					</h2>
					<div className="grid grid-cols-1 gap-3">
						<button 
							onClick={() => window.location.href = '/infraestrutura'}
							className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all group"
						>
							<div className="flex items-center gap-3">
								<div className="p-2 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-100 transition-colors">
									<AlertTriangle className="w-5 h-5" />
								</div>
								<div className="text-left">
									<p className="text-sm font-bold text-slate-800">Resetar Banco de Dados</p>
									<p className="text-xs text-slate-500">Limpa todos os dados de negócio</p>
								</div>
							</div>
							<ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400" />
						</button>
						
						<button 
							onClick={() => window.location.href = '/empresas'}
							className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all group"
						>
							<div className="flex items-center gap-3">
								<div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
									<Building2 className="w-5 h-5" />
								</div>
								<div className="text-left">
									<p className="text-sm font-bold text-slate-800">Nova Empresa</p>
									<p className="text-xs text-slate-500">Cadastrar nova construtora</p>
								</div>
							</div>
							<ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400" />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
