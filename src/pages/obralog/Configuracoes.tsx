import React from 'react';
import { ERPLayout } from '../../components/layout/ERPLayout';
import { useTheme } from '../../context/ThemeContext';
import { Check } from 'lucide-react';

const themes = [
	{
		id: 'light',
		name: 'Claro (Padrão)',
		bg: 'bg-slate-50',
		surface: 'bg-white',
		primary: 'bg-emerald-600',
		text: 'text-slate-900',
	},
	{
		id: 'dark',
		name: 'Escuro (Cosmic)',
		bg: 'bg-slate-950',
		surface: 'bg-slate-900',
		primary: 'bg-emerald-500',
		text: 'text-slate-100',
	},
	{
		id: 'ocean',
		name: 'Ocean (Azul)',
		bg: 'bg-slate-900',
		surface: 'bg-slate-800',
		primary: 'bg-sky-500',
		text: 'text-slate-100',
	},
	{
		id: 'monochrome',
		name: 'Preto e Branco',
		bg: 'bg-black',
		surface: 'bg-zinc-900',
		primary: 'bg-white',
		text: 'text-white',
	},
];

export default function Configuracoes() {
	const { theme, setTheme } = useTheme();

	return (
		<ERPLayout>
			<div className="space-y-6 max-w-5xl mx-auto">
				<div>
					<h1 className="text-2xl font-bold text-text-main">
						Configurações
					</h1>
					<p className="text-text-muted mt-1">
						Ajuste as preferências e a aparência do seu sistema.
					</p>
				</div>

				<div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
					<h2 className="text-lg font-semibold text-text-main mb-1">
						Aparência & Tema
					</h2>
					<p className="text-sm text-text-muted mb-6">
						Personalize a interface para se adequar ao seu estilo.
					</p>

					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
						{themes.map((t) => {
							const isActive = theme === t.id;
							return (
								<button
									key={t.id}
									onClick={() => setTheme(t.id as any)}
									className={`relative flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all ${
										isActive
											? 'border-primary ring-1 ring-primary/30'
											: 'border-border hover:border-text-muted/50'
									} ${t.bg}`}
								>
									<div className="flex w-full items-center justify-between mb-4">
										<span
											className={`text-sm font-medium ${t.text}`}
										>
											{t.name}
										</span>
										{isActive && (
											<div
												className={`w-5 h-5 rounded-full flex items-center justify-center ${t.id === 'monochrome' ? 'bg-white text-black' : 'bg-primary text-white'}`}
											>
												<Check
													size={12}
													strokeWidth={3}
												/>
											</div>
										)}
									</div>

									{/* Mockup visual do tema */}
									<div
										className={`w-full h-20 rounded-lg p-2 flex flex-col gap-2 shadow-inner border border-white/5 ${t.surface}`}
									>
										<div className="w-full h-8 rounded shrink-0 bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/5"></div>
										<div className="flex gap-2 h-full">
											<div
												className={`w-6 rounded shrink-0 ${t.primary}`}
											></div>
											<div className="flex-1 rounded bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/5"></div>
										</div>
									</div>
								</button>
							);
						})}
					</div>
				</div>
			</div>
		</ERPLayout>
	);
}
