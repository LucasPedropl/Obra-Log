'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SlideOverview } from './slides/SlideOverview';
import { SlideTasks } from './slides/SlideTasks';
import { SlideFinance } from './slides/SlideFinance';

import { cn } from '@/lib/utils';

const slidesData = [
	{
		title: 'Gestão Inteligente de Obras',
		description:
			'Acompanhe o cronograma, orçamento e recursos com eficiência. Reduza falhas e tome decisões com base em dados reais e atualizados.',
		Component: SlideOverview,
	},
	{
		title: 'Controle de Equipes e Etapas',
		description:
			'Nunca perca o controle do campo. Centralize tarefas, delegue atividades e acompanhe o funil de produção dia a dia na palma da mão.',
		Component: SlideTasks,
	},
	{
		title: 'Saúde Financeira Transparente',
		description:
			'Monitoramento das contas a pagar, receber e saldo do projeto em tempo real. Fluxo de caixa detalhado para sua construtora decolar.',
		Component: SlideFinance,
	},
];

export function AuthSlider() {
	const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

	// Auto-slide effect every 12 seconds
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentSlideIndex((prev) => (prev + 1) % slidesData.length);
		}, 12000);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className="relative h-full w-full flex flex-col justify-between items-center text-center p-12">
			{/* Brand Button - Top Right */}
			<div className="w-full flex justify-end">
				<Button
					variant="ghost"
					className="text-white hover:text-white hover:bg-white/10 rounded-full gap-2 px-6 shadow-sm border border-white/10 transition-colors backdrop-blur-sm"
				>
					{/* Extracted small icon building */}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#F29C1F"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M3 21h18M5 21V7l8-4v18" stroke="#ffffff" />
						<path d="M11 21L21 6m0 0v5m0-5h-5" stroke="#F29C1F" />
					</svg>
					Obra-Log
				</Button>
			</div>

			{/* Decorative Feature Component Area */}
			<div className="flex-1 flex items-center justify-center w-full min-h-[500px] mt-4 relative perspective-[1000px]">
				{slidesData.map((slide, index) => {
					const Component = slide.Component;
					return (
						<Component
							key={index}
							isActive={currentSlideIndex === index}
						/>
					);
				})}
			</div>

			{/* Sliding Text Content Area */}
			<div className="w-full mt-8 mb-6 relative z-10 transition-all duration-500 min-h-[140px] flex flex-col items-center justify-end">
				<h2
					className="text-3xl font-bold tracking-tight text-white mb-4 transition-all"
					key={`title-${currentSlideIndex}`}
				>
					{slidesData[currentSlideIndex].title}
				</h2>
				<p
					className="text-gray-400 text-sm max-w-md leading-relaxed transition-all"
					key={`desc-${currentSlideIndex}`}
				>
					{slidesData[currentSlideIndex].description}
				</p>
			</div>

			{/* Slider Pagination Dots */}
			<div className="flex gap-4 mt-2 items-center mb-2 z-10 bg-white/5 p-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
				<button
					onClick={() =>
						setCurrentSlideIndex(
							currentSlideIndex === 0
								? slidesData.length - 1
								: currentSlideIndex - 1,
						)
					}
					className="text-white/50 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="m15 18-6-6 6-6" />
					</svg>
				</button>

				<div className="flex gap-3 items-center px-2">
					{slidesData.map((_, i) => (
						<button
							key={i}
							onClick={() => setCurrentSlideIndex(i)}
							className={`transition-all rounded-full ${
								currentSlideIndex === i
									? 'w-8 h-2 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]'
									: 'w-2 h-2 bg-white/30 hover:bg-white/50'
							} cursor-pointer`}
						/>
					))}
				</div>

				<button
					onClick={() =>
						setCurrentSlideIndex(
							(currentSlideIndex + 1) % slidesData.length,
						)
					}
					className="text-white/50 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="m9 18 6-6-6-6" />
					</svg>
				</button>
			</div>
		</div>
	);
}
