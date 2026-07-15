'use client';

import React from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock, Loader2, Save } from 'lucide-react';
import { useToast } from '@/components/ui/toaster';
import {
	siteConfigSchema,
	type SiteConfigFormData,
} from '../schemas/constructionSiteSchema';

interface SiteConfigFormProps {
	defaultValues: SiteConfigFormData;
	isSaving: boolean;
	onSubmit: (data: SiteConfigFormData) => Promise<boolean>;
}

const inputClass =
	'w-full flex h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground';

const DAYS_OF_WEEK = [
	{ key: 'monday', label: 'Segunda-feira' },
	{ key: 'tuesday', label: 'Terça-feira' },
	{ key: 'wednesday', label: 'Quarta-feira' },
	{ key: 'thursday', label: 'Quinta-feira' },
	{ key: 'friday', label: 'Sexta-feira' },
	{ key: 'saturday', label: 'Sábado' },
	{ key: 'sunday', label: 'Domingo' },
] as const;

export function SiteConfigForm({
	defaultValues,
	isSaving,
	onSubmit,
}: SiteConfigFormProps) {
	const { addToast } = useToast();
	const {
		register,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<SiteConfigFormData>({
		resolver: zodResolver(siteConfigSchema) as unknown as Resolver<SiteConfigFormData>,
		defaultValues,
	});

	const submit = async (data: SiteConfigFormData) => {
		const ok = await onSubmit(data);
		if (ok) addToast('Configuração da obra salva com sucesso!', 'success');
		else addToast('Erro ao salvar a configuração da obra.', 'error');
	};

	return (
		<form onSubmit={handleSubmit(submit)} className="flex flex-col gap-6">
			<section className="rounded-xl border border-border bg-card p-6">
				<div className="flex items-center gap-3 mb-5">
					<div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
						<Clock size={20} />
					</div>
					<div>
						<h2 className="text-lg font-semibold text-foreground">
							Jornada e Ponto
						</h2>
						<p className="text-sm text-muted-foreground">
							Parâmetros usados no cálculo automático das diárias no registro de
							ponto.
						</p>
					</div>
				</div>

				<div className="flex flex-col gap-5">
					<div className="flex flex-col gap-2 max-w-xs">
						<label className="text-sm font-medium text-foreground">
							Tolerância (minutos)
						</label>
						<input
							type="number"
							step="1"
							min="0"
							max="240"
							{...register('tolerance_minutes')}
							className={inputClass}
							placeholder="0"
						/>
						<span className="text-xs text-muted-foreground">
							Margem de atraso/saída antecipada desconsiderada no cálculo.
						</span>
						{errors.tolerance_minutes && (
							<span className="text-destructive text-xs">
								{errors.tolerance_minutes.message}
							</span>
						)}
					</div>

					<div className="mt-4 border-t border-gray-100 pt-5">
						<h3 className="text-sm font-semibold text-foreground mb-4">
							Horários de Trabalho Semanais
						</h3>
						<div className="flex flex-col gap-3">
							{DAYS_OF_WEEK.map((day) => {
								const isActive = watch(`workday_schedule_json.${day.key}.active`);
								const dayErrors = errors.workday_schedule_json?.[day.key] as any;
								return (
									<div key={day.key} className="flex flex-col border-b border-gray-100 last:border-0 py-2">
										<div className="flex flex-wrap items-center gap-4">
											<div className="flex items-center gap-3 w-40 shrink-0">
												<input
													type="checkbox"
													id={`active-${day.key}`}
													{...register(`workday_schedule_json.${day.key}.active`)}
													className="h-4 w-4 rounded-[3px] border-gray-300 text-blue-600 focus:ring-blue-500"
												/>
												<label htmlFor={`active-${day.key}`} className="text-sm font-semibold text-gray-700 select-none">
													{day.label}
												</label>
											</div>

											<div className="flex items-center gap-2">
												<span className="text-xs text-gray-500">Início:</span>
												<input
													type="time"
													disabled={!isActive}
													{...register(`workday_schedule_json.${day.key}.start`)}
													className="h-9 w-24 rounded-[5px] border border-gray-300 bg-white px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40 disabled:bg-gray-50 text-gray-900"
												/>
											</div>

											<div className="flex items-center gap-2">
												<span className="text-xs text-gray-500">Saída Almoço:</span>
												<input
													type="time"
													disabled={!isActive}
													{...register(`workday_schedule_json.${day.key}.lunch_start`)}
													className="h-9 w-24 rounded-[5px] border border-gray-300 bg-white px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40 disabled:bg-gray-50 text-gray-900"
												/>
											</div>

											<div className="flex items-center gap-2">
												<span className="text-xs text-gray-500">Volta Almoço:</span>
												<input
													type="time"
													disabled={!isActive}
													{...register(`workday_schedule_json.${day.key}.lunch_end`)}
													className="h-9 w-24 rounded-[5px] border border-gray-300 bg-white px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40 disabled:bg-gray-50 text-gray-900"
												/>
											</div>

											<div className="flex items-center gap-2">
												<span className="text-xs text-gray-500">Fim:</span>
												<input
													type="time"
													disabled={!isActive}
													{...register(`workday_schedule_json.${day.key}.end`)}
													className="h-9 w-24 rounded-[5px] border border-gray-300 bg-white px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40 disabled:bg-gray-50 text-gray-900"
												/>
											</div>
										</div>

										{dayErrors && (
											<div className="text-destructive text-[11px] font-medium pl-44 mt-1">
												{dayErrors.end?.message || dayErrors.lunch_start?.message || dayErrors.lunch_end?.message}
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</section>

			<div className="flex justify-end">
				<button
					type="submit"
					disabled={isSaving}
					className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
				>
					{isSaving ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						<Save className="w-4 h-4" />
					)}
					Salvar Configuração
				</button>
			</div>
		</form>
	);
}
