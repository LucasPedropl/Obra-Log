import React from 'react';
import {
	CalendarClock,
	CheckCircle2,
	Clock,
	AlertTriangle,
	FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function SlideTasks({ isActive }: { isActive: boolean }) {
	return (
		<div
			className={cn(
				'absolute inset-0 flex items-center justify-center transition-all duration-1000 transform w-full h-[500px]',
				isActive
					? 'opacity-100 scale-100 translate-y-0'
					: 'opacity-0 scale-95 translate-y-12 z-[-1] pointer-events-none',
			)}
		>
			<div className="relative w-[320px] h-[580px] rounded-[2.5rem] border-[10px] border-[#1b263b] bg-gradient-to-b from-[#0f172a] to-[#1e293b] shadow-[0_0_60px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col p-5 group">
				{/* Top Notch Area Mockup */}
				<div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1b263b] rounded-b-2xl z-20"></div>

				{/* Lighting Effect */}
				<div className="absolute -top-10 -right-20 w-48 h-48 bg-purple-500/20 blur-[80px] rounded-full pointer-events-none"></div>

				{/* App Header */}
				<div className="mt-6 z-10 flex justify-between items-center mb-6">
					<div>
						<p className="text-gray-400 text-xs font-medium">
							Cronograma
						</p>
						<h3 className="text-white text-xl font-bold tracking-tight">
							Etapas do Mês
						</h3>
					</div>
					<div className="w-10 h-10 rounded-full border-2 border-purple-500 p-0.5 overflow-hidden ring-2 ring-purple-500/30">
						{/* Random User Avatar */}
						<img
							src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
							alt="User Profile"
							className="w-full h-full object-cover rounded-full"
						/>
					</div>
				</div>

				{/* Task Cards List */}
				<div className="flex flex-col gap-4 flex-1 z-10 overflow-y-hidden">
					{/* Status Filter Dummy */}
					<div className="flex gap-2 text-xs font-semibold overflow-x-hidden whitespace-nowrap mb-2 hide-scrollbar pb-1">
						<span className="px-4 py-1.5 bg-white/10 text-white rounded-full whitespace-nowrap ring-1 ring-white/10 backdrop-blur-md cursor-pointer hover:bg-white/20 transition">
							Todas (24)
						</span>
						<span className="px-4 py-1.5 bg-orange-500/20 text-orange-400 rounded-full whitespace-nowrap ring-1 ring-orange-500/30 backdrop-blur-md cursor-pointer border border-orange-500/10">
							Em Andamento
						</span>
					</div>

					{/* Card 1 - Completed */}
					<div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 group/task hover:bg-white/10 transition-all duration-300">
						<div className="flex justify-between items-start">
							<div className="flex items-center gap-2 text-gray-300 text-sm font-semibold">
								<CheckCircle2
									size={16}
									className="text-emerald-400"
								/>
								<span>Fundação do Solo</span>
							</div>
							<span className="text-emerald-400/80 bg-emerald-400/10 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide">
								Concluído
							</span>
						</div>
						<div className="text-xs text-gray-500 flex gap-2 items-center">
							<FileText size={12} />
							<span>Documentação assinada</span>
						</div>
					</div>

					{/* Card 2 - In progress - Highlights */}
					<div className="bg-gradient-to-br from-purple-500/20 to-blue-500/10 border border-purple-500/30 rounded-2xl p-4 flex flex-col gap-4 relative overflow-hidden group/task hover:border-purple-400/40 transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
						<div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl pointer-events-none"></div>
						<div className="flex justify-between items-start z-10">
							<div className="flex items-center gap-2 text-white text-sm font-bold">
								<Clock
									size={16}
									className="text-purple-400 animate-pulse"
								/>
								<span>Armação e Formas</span>
							</div>
							<span className="text-white bg-purple-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider shadow-lg">
								Hoje
							</span>
						</div>

						{/* Progress Bar */}
						<div className="z-10 w-full">
							<div className="flex justify-between text-[11px] mb-1 text-gray-300 font-medium">
								<span>Progresso</span>
								<span>65%</span>
							</div>
							<div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
								<div className="h-full bg-gradient-to-r from-purple-400 to-blue-400 w-[65%] rounded-full shadow-[0_0_10px_rgba(168,85,247,1)]"></div>
							</div>
						</div>

						{/* Avatars */}
						<div className="z-10 flex -space-x-2 mt-1">
							<img
								src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80"
								className="w-6 h-6 rounded-full border-2 border-[#1e293b] object-cover"
							/>
							<img
								src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=100&q=80"
								className="w-6 h-6 rounded-full border-2 border-[#1e293b] object-cover z-[1]"
							/>
							<div className="w-6 h-6 rounded-full border-2 border-[#1e293b] bg-gray-800 text-[10px] text-white flex items-center justify-center font-bold z-[2]">
								+3
							</div>
						</div>
					</div>

					{/* Card 3 - Pending */}
					<div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 group/task hover:bg-white/10 transition-all duration-300">
						<div className="flex justify-between items-start">
							<div className="flex items-center gap-2 text-gray-300 text-sm font-semibold">
								<AlertTriangle
									size={16}
									className="text-yellow-500"
								/>
								<span>Concretagem N1</span>
							</div>
							<span className="text-yellow-500/80 bg-yellow-500/10 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide">
								Amanhã
							</span>
						</div>
						<div className="text-xs text-gray-500 flex gap-2 items-center">
							<CalendarClock size={12} />
							<span>Início às 08:00h</span>
						</div>
					</div>
				</div>

				{/* Floating Action Button */}
				<div className="absolute bottom-6 right-6 w-12 h-12 bg-purple-500 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.5)] flex items-center justify-center text-white z-20 cursor-pointer hover:bg-purple-600 hover:scale-110 transition-transform">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M5 12h14" />
						<path d="M12 5v14" />
					</svg>
				</div>
			</div>
		</div>
	);
}
