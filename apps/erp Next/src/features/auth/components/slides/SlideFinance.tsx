import React from 'react';
import {
	DollarSign,
	ArrowDownRight,
	ArrowUpRight,
	Wallet,
	PieChart,
	FileCheck,
	CircleDollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function SlideFinance({ isActive }: { isActive: boolean }) {
	return (
		<div
			className={cn(
				'absolute inset-0 flex items-center justify-center transition-all duration-1000 transform w-full h-[500px]',
				isActive
					? 'opacity-100 scale-100 translate-y-0'
					: 'opacity-0 scale-95 translate-y-12 z-[-1] pointer-events-none',
			)}
		>
			<div className="relative w-[85%] max-w-[500px] aspect-[4/3] rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-white/10 p-6 shadow-2xl flex flex-col gap-6 overflow-hidden">
				{/* Background Glow */}
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-orange-500/10 blur-[120px] rounded-full pointer-events-none"></div>

				{/* Finance Header */}
				<div className="flex justify-between items-center z-10 w-full relative">
					<div className="flex gap-4 items-center">
						<div className="p-3 bg-orange-500/20 text-orange-400 rounded-xl ring-1 ring-orange-500/30">
							<DollarSign size={24} />
						</div>
						<div>
							<h3 className="text-white font-bold text-lg leading-tight">
								Painel Financeiro
							</h3>
							<p className="text-gray-400 text-sm">
								Resumo do Mês Atual
							</p>
						</div>
					</div>
					<div className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer">
						<PieChart size={20} className="text-gray-400" />
					</div>
				</div>

				{/* Horizontal Balance Card */}
				<div className="w-full bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-2 relative overflow-hidden z-10 group hover:border-orange-500/30 transition-colors">
					<div className="flex justify-between text-gray-400 text-xs font-semibold mb-1">
						<span>Saldo em Caixa</span>
						<span className="flex items-center text-emerald-400">
							<ArrowUpRight size={14} className="mr-0.5" /> 8.4%
						</span>
					</div>
					<div className="flex items-end gap-3">
						<span className="text-4xl text-white font-extrabold tracking-tight">
							R$ 1.250.000
						</span>
						<span className="text-sm font-medium text-gray-500 mb-1.5">
							,00
						</span>
					</div>
					<div className="absolute right-0 bottom-0 p-4 opacity-5 pointer-events-none">
						<Wallet size={80} />
					</div>
				</div>

				{/* Split Flow Cards - Recipes vs Expenses */}
				<div className="grid grid-cols-2 gap-4 flex-1 z-10">
					{/* Recipes */}
					<div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex flex-col justify-between hover:bg-emerald-500/10 transition-colors">
						<div className="flex items-center gap-2 text-emerald-400 mb-2 font-medium text-sm">
							<ArrowUpRight size={16} /> Entradas
						</div>
						<div className="text-white font-bold text-xl tracking-tight leading-none mb-1">
							R$ 480k
						</div>
						<div className="text-[10px] text-emerald-400/80 bg-emerald-400/10 px-2 py-1 rounded inline-flex self-start uppercase font-bold tracking-wide">
							Faturado
						</div>
					</div>

					{/* Expenses */}
					<div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 flex flex-col justify-between hover:bg-rose-500/10 transition-colors relative overflow-hidden">
						<div className="flex items-center gap-2 text-rose-400 mb-2 font-medium text-sm">
							<ArrowDownRight size={16} /> Saídas
						</div>
						<div className="text-white font-bold text-xl tracking-tight leading-none mb-1">
							R$ 125k
						</div>
						<div className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
							<span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>{' '}
							Materiais (60%)
						</div>
					</div>
				</div>

				{/* Recent Transactions List */}
				<div className="mt-2 flex flex-col gap-3 py-2 z-10 w-full relative">
					<div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">
						<span>Últimas Transações</span>
						<span className="cursor-pointer hover:text-white transition">
							Ver todas
						</span>
					</div>

					<div className="flex flex-col gap-2">
						{/* Transaction 1 */}
						<div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-lg p-3 hover:bg-white/10 transition cursor-pointer">
							<div className="flex items-center gap-3">
								<div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
									<FileCheck size={16} />
								</div>
								<div>
									<p className="text-white text-sm font-semibold tracking-tight">
										Cimento Votorantim
									</p>
									<p className="text-gray-500 text-xs">
										Fornecedor
									</p>
								</div>
							</div>
							<div className="text-right">
								<p className="text-rose-400 text-sm font-bold tracking-tight">
									- R$ 12.500
								</p>
								<p className="text-gray-500 text-xs">
									Pago hoje
								</p>
							</div>
						</div>

						{/* Transaction 2 */}
						<div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-lg p-3 hover:bg-white/10 transition cursor-pointer">
							<div className="flex items-center gap-3">
								<div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400">
									<CircleDollarSign size={16} />
								</div>
								<div>
									<p className="text-white text-sm font-semibold tracking-tight">
										Parcela Cliente
									</p>
									<p className="text-gray-500 text-xs">
										João Silva
									</p>
								</div>
							</div>
							<div className="text-right">
								<p className="text-emerald-400 text-sm font-bold tracking-tight">
									+ R$ 45.000
								</p>
								<p className="text-gray-500 text-xs">
									Recebido
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
