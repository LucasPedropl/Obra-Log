'use client';

import { useEffect, useState } from 'react';
import { Building2, Users, LayoutDashboard, Loader2, Zap, AlertTriangle, ChevronRight } from 'lucide-react';
import { listCompaniesAction } from '@/app/actions/companies';
import Link from 'next/link';

interface DashboardStats {
	totalCompanies: number;
	pendingCompanies: number;
	activeCompanies: number;
}

export default function AdminDashboard() {
	const [stats, setStats] = useState<DashboardStats | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchStats = async () => {
			try {
				const companies = await listCompaniesAction();
				setStats({
					totalCompanies: companies.length,
					pendingCompanies: companies.filter(c => c.status === 'PENDING').length,
					activeCompanies: companies.filter(c => c.status === 'ACTIVE').length,
				});
			} catch (err) {
				console.error('Erro ao carregar estatísticas:', err);
			} finally {
				setLoading(false);
			}
		};
		fetchStats();
	}, []);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="w-8 h-8 animate-spin text-blue-600" />
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
				<p className="text-slate-500">Visão geral do ecossistema Obra-Log.</p>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
					<div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
						<Building2 className="w-6 h-6" />
					</div>
					<div>
						<p className="text-sm font-medium text-slate-500">Total de Empresas</p>
						<p className="text-2xl font-bold text-slate-900">{stats?.totalCompanies}</p>
					</div>
				</div>

				<div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
					<div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
						<Zap className="w-6 h-6" />
					</div>
					<div>
						<p className="text-sm font-medium text-slate-500">Empresas Ativas</p>
						<p className="text-2xl font-bold text-emerald-600">{stats?.activeCompanies}</p>
					</div>
				</div>

				<div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
					<div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
						<AlertTriangle className="w-6 h-6" />
					</div>
					<div>
						<p className="text-sm font-medium text-slate-500">Aguardando Ativação</p>
						<p className="text-2xl font-bold text-amber-600">{stats?.pendingCompanies}</p>
					</div>
				</div>
			</div>

			{/* Quick Actions */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
					<h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
						<LayoutDashboard className="w-5 h-5 text-blue-600" />
						Ações Rápidas
					</h3>
					<div className="space-y-3">
						<Link href="/empresas" className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors group">
							<div className="flex items-center gap-3">
								<Building2 className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
								<span className="font-medium text-slate-700">Gerenciar Empresas</span>
							</div>
							<ChevronRight className="w-4 h-4 text-slate-300" />
						</Link>
						<Link href="/infra" className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors group">
							<div className="flex items-center gap-3">
								<Users className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
								<span className="font-medium text-slate-700">Manutenção do Sistema</span>
							</div>
							<ChevronRight className="w-4 h-4 text-slate-300" />
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
