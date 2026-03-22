import React from 'react';
import { ERPLayout } from '../../components/layout/ERPLayout';
import { useTheme } from '../../context/ThemeContext';
import { Check } from 'lucide-react';

const themes = [
	{
		id: 'light',
		name: 'Moderno (Padrão)',
		bg: 'bg-[#f9fafb]',
		surface: 'bg-white',
		primary: 'bg-[#18181b]',
		text: 'text-[#09090b]',
	},
	{
		id: 'dark',
		name: 'Escuro',
		bg: 'bg-slate-800',
		surface: 'bg-slate-950',
		primary: 'bg-[#006b54]',
		text: 'text-slate-50',
	},
	{
		id: 'bw',
		name: 'Branco e Preto',
		bg: 'bg-white',
		surface: 'bg-black',
		primary: 'bg-black',
		text: 'text-black',
	},
	{
		id: 'supabase',
		name: 'Supabase Style',
		bg: 'bg-[#171717]',
		surface: 'bg-[#1c1c1c]',
		primary: 'bg-[#3ecf8e]',
		text: 'text-[#ededed]',
	},
	{
		id: 'green',
		name: 'Verde (Claro)',
		bg: 'bg-[#f1f5f9]',
		surface: 'bg-white',
		primary: 'bg-[#13836c]',
		text: 'text-[#0f172a]',
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
