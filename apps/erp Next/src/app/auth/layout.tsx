import React from 'react';
import { AuthSlider } from '@/features/auth/components/AuthSlider';

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-screen bg-gray-50">
			{/* Lado Esquerdo - Formulário */}
			<div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:w-1/2 xl:w-5/12 lg:px-20 xl:px-24 z-20 bg-white shadow-[10px_0_40px_rgba(0,0,0,0.1)] relative">
				{/* Logo & Marca da Obra-Log (Fixada no Topo Esquerdo igual na imagem base) */}
				<div className="absolute top-8 left-8 sm:top-12 sm:left-12 flex items-center gap-3 select-none">
					<div className="relative flex h-12 w-12 items-center justify-center p-1 rounded-xl bg-gradient-to-br from-[#101828] to-[#1e2a44] shadow-md border-b-2 border-[#F29C1F]">
						{/* Logo Original da Obra-Log */}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="w-8 h-8"
						>
							<path d="M3 21h18M5 21V7l8-4v18" stroke="#ffffff" />
							<path d="M13 3l8 4v14" stroke="#ffffff" />
							<path d="M7 10h4M7 14h4" stroke="#ffffff" />
							<path
								d="M4 8l10-5m0 0l-2 5m2-5H6"
								stroke="#F29C1F"
							/>
							<path
								d="M11 21L21 6m0 0v5m0-5h-5"
								stroke="#F29C1F"
								strokeWidth="2"
							/>
						</svg>
					</div>
					<h1 className="text-2xl font-extrabold tracking-tight text-[#101828]">
						Obra-Log
					</h1>
				</div>

				<div className="mx-auto w-full max-w-sm lg:w-full mt-16 sm:mt-0">
					{children}
				</div>
			</div>

			{/* Lado Direito - Ilustração e Slides */}
			<div className="relative hidden w-0 flex-1 lg:flex bg-[#101828] overflow-hidden items-center justify-center">
				<AuthSlider />

				{/* Elementos decorativos de fundo simulando painel gráfico */}
				<div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent rounded-l-[100%] blur-3xl opacity-30 pointer-events-none" />
				<div className="absolute -bottom-24 -left-20 w-[600px] h-[600px] rounded-full border border-white/5 opacity-50 shadow-[inset_0_0_80px_rgba(255,255,255,0.02)] pointer-events-none" />
				<div className="absolute -top-32 -left-32 w-[400px] h-[400px] bg-white/10 blur-[100px] rounded-full pointer-events-none" />
			</div>
		</div>
	);
}
