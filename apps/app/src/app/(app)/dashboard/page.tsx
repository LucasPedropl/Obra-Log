'use client';

import React, { useEffect, useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import {
	Building2,
	Users,
	PackageOpen,
	AlertCircle,
	Loader2,
} from 'lucide-react';
import {
	getDashboardKpisAction,
	type DashboardKpis,
} from '@/app/actions/dashboardActions';

export default function DashboardPage() {
	const [kpis, setKpis] = useState<DashboardKpis | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const load = async () => {
			const result = await getDashboardKpisAction();
			if (result.success && result.kpis) {
				setKpis(result.kpis);
			} else {
				setError(result.error ?? 'Não foi possível carregar os indicadores');
			}
			setLoading(false);
		};
		load();
	}, []);

	return (
		<div className="w-full flex flex-col gap-6">
			<PageHeader
				title="Dashboard"
				description="Visão geral do sistema e indicadores rápidos."
			/>

			{loading ? (
				<div className="flex justify-center p-12">
					<Loader2 className="w-8 h-8 animate-spin text-gray-400" />
				</div>
			) : error ? (
				<div className="bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
					<AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
					<div>
						<p className="font-medium text-amber-900">Dashboard em construção</p>
						<p className="text-sm text-amber-700 mt-1">{error}</p>
					</div>
				</div>
			) : kpis ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<KpiCard
						label="Obras Ativas"
						value={kpis.activeSites}
						icon={<Building2 className="w-6 h-6" />}
						iconClass="bg-blue-50 text-blue-600 border-blue-100"
					/>
					<KpiCard
						label="Mão de Obra"
						value={kpis.collaborators}
						icon={<Users className="w-6 h-6" />}
						iconClass="bg-indigo-50 text-indigo-600 border-indigo-100"
					/>
					<KpiCard
						label="Insumos em Baixa"
						value={kpis.lowStockItems}
						icon={<PackageOpen className="w-6 h-6" />}
						iconClass="bg-orange-50 text-orange-600 border-orange-100"
					/>
					<KpiCard
						label="Itens no Estoque"
						value={kpis.totalInventoryItems}
						icon={<PackageOpen className="w-6 h-6" />}
						iconClass="bg-emerald-50 text-emerald-600 border-emerald-100"
					/>
				</div>
			) : null}
		</div>
	);
}

function KpiCard({
	label,
	value,
	icon,
	iconClass,
}: {
	label: string;
	value: number;
	icon: React.ReactNode;
	iconClass: string;
}) {
	return (
		<div className="bg-white rounded-none border border-gray-200 p-5 transition-all">
			<div className="flex justify-between items-start">
				<div>
					<p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
					<h3 className="text-3xl font-bold text-gray-900">{value}</h3>
				</div>
				<div className={`p-3 border ${iconClass}`}>{icon}</div>
			</div>
		</div>
	);
}
