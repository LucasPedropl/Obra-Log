'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { getObraOverviewStats } from '@/app/actions/overviewActions';
import {
	Package,
	Wrench,
	Truck,
	AlertTriangle,
	Activity,
	ArrowRight,
	Loader2,
	Users,
} from 'lucide-react';

interface StatProps {
	title: string;
	value: number | string;
	description: string;
	icon: React.ReactNode;
	href: string;
	trend?: 'up' | 'down' | 'neutral';
	lowWarning?: boolean;
}

function StatCard({
	title,
	value,
	description,
	icon,
	href,
	lowWarning,
}: StatProps) {
	return (
		<Link
			href={href}
			className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 group cursor-pointer"
		>
			<div className="flex justify-between items-start">
				<div
					className={`p-3 rounded-lg ${lowWarning && Number(value) > 0 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}
				>
					{icon}
				</div>
				<ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
			</div>
			<div>
				<h3
					className={`text-3xl font-bold ${lowWarning && Number(value) > 0 ? 'text-red-700' : 'text-gray-900 group-hover:text-blue-700'} transition-colors`}
				>
					{value}
				</h3>
				<p className="text-sm font-semibold text-gray-700 mt-1.5">
					{title}
				</p>
				<p className="text-xs text-gray-500 mt-0.5">{description}</p>
			</div>
		</Link>
	);
}

export default function VisaoGeralObraPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const resolvedParams = use(params);
	const [isLoading, setIsLoading] = useState(true);
	const [stats, setStats] = useState<any>(null);
	const [recentMovements, setRecentMovements] = useState<any[]>([]);
	const [recentEquipments, setRecentEquipments] = useState<any[]>([]);

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			const {
				success,
				stats: newStats,
				recentMovements: newMovements,
				recentEquipments: newEquipments,
			} = await getObraOverviewStats(resolvedParams.id);
			if (success) {
				setStats(newStats);
				setRecentMovements(newMovements || []);
				setRecentEquipments(newEquipments || []);
			}
			setIsLoading(false);
		};
		loadData();
	}, [resolvedParams.id]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-24 h-full">
				<Loader2 className="w-10 h-10 animate-spin text-gray-300" />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-8 pb-32">
			<PageHeader
				title="Visão Geral da Obra"
				description="Acompanhamento rápido de todas as métricas do canteiro de obras."
			/>

			{/* STATS GRID */}
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
				<Link
					href={`/obras/${resolvedParams.id}/almoxarifado`}
					className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 group cursor-pointer"
				>
					<div className="flex justify-between items-start">
						<div
							className={`p-3 rounded-lg ${stats?.lowStockInventory > 0 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}
						>
							<Package className="w-6 h-6" />
						</div>
						<ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
					</div>
					<div>
						<h3 className="text-3xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors flex items-center gap-3">
							{stats?.totalInventory || 0}
							{stats?.lowStockInventory > 0 && (
								<span className="text-sm font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1 mt-1">
									<AlertTriangle className="w-3.5 h-3.5" />
									{stats.lowStockInventory} em baixa
								</span>
							)}
						</h3>
						<p className="text-sm font-semibold text-gray-700 mt-1.5">
							Itens no Almoxarifado
						</p>
						<p className="text-xs text-gray-500 mt-0.5">
							Visão geral de itens em estoque
						</p>
					</div>
				</Link>

				<StatCard
					title="Colaboradores na Obra"
					value={stats?.activeCollaborators || 0}
					description="Trabalhadores alocados no site"
					icon={<Users className="w-6 h-6" />}
					href={`/obras/${resolvedParams.id}/colaboradores`}
				/>
				<StatCard
					title="Ferramentas em Uso"
					value={stats?.toolsInUse || 0}
					description="Emprestadas para colaboradores"
					icon={<Wrench className="w-6 h-6" />}
					href={`/obras/${resolvedParams.id}/ferramentas/em-uso`}
				/>
				<StatCard
					title="Equipamentos Ativos"
					value={stats?.activeRented || 0}
					description="Alugados e atualmente na obra"
					icon={<Truck className="w-6 h-6" />}
					href={`/obras/${resolvedParams.id}/equip-alugados/ativos`}
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-[min(10vh,40px)]">
				{/* RECENTS MOVEMENTS */}
				<div className="bg-white rounded-xl border border-gray-200 xl:border-gray-100 shadow-sm overflow-hidden flex flex-col h-[400px]">
					<div className="border-b border-gray-100 p-5 flex items-center justify-between shrink-0">
						<div className="flex items-center gap-2">
							<Activity className="text-gray-400 w-5 h-5" />
							<h3 className="font-semibold text-gray-900">
								Últimas Movimentações
							</h3>
						</div>
						<Link
							href={`/obras/${resolvedParams.id}/movimentacoes`}
							className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center group"
						>
							Ver todas
							<ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
						</Link>
					</div>
					<div className="p-0 overflow-y-auto flex-1">
						{recentMovements.length === 0 ? (
							<div className="p-8 text-center text-gray-500 h-full flex items-center justify-center">
								Nenhuma movimentação recente registrada.
							</div>
						) : (
							<ul className="divide-y divide-gray-100">
								{recentMovements.map(
									(mov: any, idx: number) => (
										<li
											key={mov.id || idx}
											className="p-4 hover:bg-gray-50 transition-colors flex items-start justify-between gap-4"
										>
											<div className="flex flex-col gap-1.5 overflow-hidden">
												<span className="font-semibold text-gray-900 text-sm truncate">
													{mov.itemName}
												</span>
												<span className="text-xs font-medium text-gray-500">
													Por {mov.user} •{' '}
													{new Date(
														mov.date,
													).toLocaleDateString(
														'pt-BR',
														{
															day: '2-digit',
															month: 'short',
															hour: '2-digit',
															minute: '2-digit',
														},
													)}
												</span>
											</div>
											<div className="flex flex-col items-end gap-1.5 shrink-0 min-w-max">
												<span
													className={`text-sm font-bold px-2 py-0.5 rounded-md ${mov.type === 'IN' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}
												>
													{mov.type === 'IN'
														? '+'
														: '-'}
													{mov.quantity_delta}
												</span>
												<span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
													{mov.reason === 'PURCHASE'
														? 'COMPRA'
														: mov.reason === 'WASTE'
															? 'PERDA'
															: mov.reason ===
																  'APPLICATION'
																? 'APLICAÇÃO'
																: mov.reason}
												</span>
											</div>
										</li>
									),
								)}
							</ul>
						)}
					</div>
				</div>

				{/* RECENT EQUIPMENTS */}
				<div className="bg-white rounded-xl border border-gray-200 xl:border-gray-100 shadow-sm overflow-hidden flex flex-col h-[400px]">
					<div className="border-b border-gray-100 p-5 flex items-center justify-between shrink-0">
						<div className="flex items-center gap-2">
							<Truck className="text-gray-400 w-5 h-5" />
							<h3 className="font-semibold text-gray-900">
								Chegada de Equipamentos
							</h3>
						</div>
						<Link
							href={`/obras/${resolvedParams.id}/equip-alugados/ativos`}
							className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center group"
						>
							Ver todos
							<ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
						</Link>
					</div>
					<div className="p-0 overflow-y-auto flex-1">
						{recentEquipments.length === 0 ? (
							<div className="p-8 text-center text-gray-500 h-full flex items-center justify-center">
								Nenhum equipamento alugado recente.
							</div>
						) : (
							<ul className="divide-y divide-gray-100">
								{recentEquipments.map(
									(equip: any, idx: number) => (
										<li
											key={equip.id || idx}
											className="p-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
										>
											<div className="flex flex-col gap-1.5">
												<span className="font-semibold text-gray-900 text-sm">
													{equip.name}
												</span>
												<span className="text-xs font-medium text-gray-500">
													<span className="text-gray-400 font-normal">
														Forn:
													</span>{' '}
													{equip.supplier}
												</span>
											</div>
											<div className="flex flex-col sm:items-end gap-1.5">
												<span className="text-sm text-gray-600 font-medium">
													Chegou em{' '}
													{new Date(
														equip.date,
													).toLocaleDateString(
														'pt-BR',
													)}
												</span>
												<span className="text-[10px] uppercase tracking-wider font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded w-fit">
													{equip.status === 'ACTIVE'
														? 'NO CANTEIRO'
														: 'DEVOLVIDO'}
												</span>
											</div>
										</li>
									),
								)}
							</ul>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
