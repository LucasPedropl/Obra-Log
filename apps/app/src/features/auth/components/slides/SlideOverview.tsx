import React from 'react';
import { Activity, ArrowUpRight, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SlideOverview({ isActive }: { isActive: boolean }) {
	return (
		<div
			className={cn(
				'absolute inset-0 flex items-center justify-center transition-all duration-1000 transform w-full h-[500px]',
				isActive
					? 'opacity-100 scale-100 translate-y-0'
					: 'opacity-0 scale-95 translate-y-12 z-[-1] pointer-events-none',
			)}
		>
			<div className="relative w-full max-w-[560px] aspect-[16/11] rounded-2xl bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 p-6 flex flex-col gap-4 shadow-2xl overflow-hidden group">
				{/* Background Glows */}
				<div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none"></div>
				<div className="absolute -bottom-32 -left-32 w-64 h-64 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none"></div>

				{/* Header */}
				<div className="flex justify-between items-center z-10 w-full mb-2">
					<div className="flex gap-3 items-center">
						<div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-lg ring-1 ring-blue-500/30">
							<Activity size={20} />
						</div>
						<div>
							<h3 className="text-gray-200 font-semibold text-base leading-tight">
								Visão Geral
							</h3>
							<p className="text-gray-400 text-xs">
								Residencial Alpha View
							</p>
						</div>
					</div>
					<div className="flex items-center gap-1 text-emerald-400 text-sm bg-emerald-400/10 px-2.5 py-1 rounded-full font-medium ring-1 ring-emerald-400/20">
						<TrendingUp size={14} />
						<span>+15.3%</span>
					</div>
				</div>

				{/* Metrics Row */}
				<div className="grid grid-cols-2 gap-4 w-full z-10">
					<div className="bg-white/5 border border-white/10 rounded-xl p-4 relative overflow-hidden">
						<p className="text-gray-400 text-xs mb-1 font-medium">
							Orçamento Estimado
						</p>
						<p className="text-white text-2xl font-bold tracking-tight">
							R$ 4.2M
						</p>
						<div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-transparent opacity-50"></div>
					</div>
					<div className="bg-white/5 border border-white/10 rounded-xl p-4 relative overflow-hidden">
						<p className="text-gray-400 text-xs mb-1 font-medium">
							Equipe em Campo
						</p>
						<div className="flex gap-2 items-end">
							<p className="text-white text-2xl font-bold tracking-tight">
								124
							</p>
							<p className="text-gray-400 text-xs mb-1">
								colaboradores
							</p>
						</div>
						<div className="absolute bottom-0 right-0 p-2 opacity-10">
							<Users size={40} />
						</div>
					</div>
				</div>

				{/* Marketing Graph Component */}
				<div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-4 z-10">
					<div className="flex justify-between items-center">
						<p className="text-gray-300 text-sm font-medium">
							Avanço Físico vs Financeiro
						</p>
						<ArrowUpRight size={16} className="text-gray-500" />
					</div>

					{/* Dummy bar chart */}
					<div className="flex-1 flex items-end gap-3 pt-4">
						{[40, 25, 60, 45, 80, 65, 95].map((h, i) => (
							<div
								key={i}
								className="flex-1 flex flex-col justify-end gap-2 group/bar"
							>
								<div className="w-full flex gap-1 items-end justify-center">
									<div
										style={{ height: `${h}%` }}
										className="w-1/2 bg-blue-500/80 rounded-t-sm transition-all duration-500 group-hover/bar:bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
									></div>
									<div
										style={{ height: `${h - 10}%` }}
										className="w-1/2 bg-emerald-400/80 rounded-t-sm transition-all duration-500 group-hover/bar:bg-emerald-300"
									></div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
