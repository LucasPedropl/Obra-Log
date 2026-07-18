'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatCurrencyDisplay } from '@/lib/maskUtils';
import { STATUS_CONFIG } from '@/features/ponto/lib/attendanceConfig';
import type { AttendanceStatus } from '@/features/ponto/schemas/attendanceSchema';
import type { DayColumn } from '@/features/ponto/lib/dateRange';
import { IncompleteHoursWarning } from '@/features/ponto/components/IncompleteHoursWarning';
import type { FrequencyReport as ReportModel } from '../lib/buildReport';
import { printFolhaSection } from '../lib/printFolha';
import { PaymentSummaryTable } from './PaymentSummaryTable';

interface FrequencyReportProps {
	report: ReportModel;
	days: DayColumn[];
	siteName: string;
	periodLabel: string;
}

const formatFraction = (value: number) =>
	value.toLocaleString('pt-BR', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

function cellContent(
	status: AttendanceStatus,
	dayFraction: number,
	hasIncompleteTimes?: boolean,
) {
	if (status === 'PRESENT' && hasIncompleteTimes) {
		return <IncompleteHoursWarning compact />;
	}
	if (status === 'PRESENT') return formatFraction(dayFraction);
	return STATUS_CONFIG[status].short;
}

function cellClassName(
	status: AttendanceStatus | undefined,
	isWeekend: boolean,
	hasIncompleteTimes?: boolean,
) {
	if (hasIncompleteTimes) {
		return 'bg-amber-50 text-amber-800';
	}
	if (status && status !== 'PRESENT') {
		return STATUS_CONFIG[status].badgeClass;
	}
	return isWeekend ? 'bg-slate-50' : '';
}

export function FrequencyReport({
	report,
	days,
	siteName,
	periodLabel,
}: FrequencyReportProps) {
	const totalColSpan = days.length + 5;

	return (
		<div
			id="folha-print"
			className="rounded-xl border border-border bg-white p-5 print:border-0 print:p-0"
		>
			<PrintStyles />

			<header className="mb-4 text-center">
				<h2 className="text-lg font-bold text-slate-900">
					Relatório de Frequência
				</h2>
				<p className="text-sm text-slate-600">{siteName}</p>
				<p className="text-xs text-slate-500">{periodLabel}</p>
			</header>

			<div id="folha-freq-section" className="folha-print-section">
				<div className="mb-3 flex justify-end folha-no-print">
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-8 rounded-[5px] border-gray-300 text-xs font-semibold"
						onClick={() => printFolhaSection('freq')}
					>
						<Download className="w-3.5 h-3.5 mr-1.5" />
						Baixar esta tabela
					</Button>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full border-collapse text-[11px]">
						<thead>
							<tr className="bg-slate-700 text-white">
								<th className="border border-slate-500 px-1 py-1 text-left">#</th>
								<th className="border border-slate-500 px-2 py-1 text-left min-w-[160px]">
									Nome
								</th>
								{days.map((day) => (
									<th
										key={day.date}
										className="border border-slate-500 px-1 py-1 text-center"
									>
										<div>{day.dayLabel}</div>
										<div className="text-[8px] uppercase text-slate-200">
											{day.weekdayLabel}
										</div>
									</th>
								))}
								<th className="border border-slate-500 px-1 py-1 text-center">Und</th>
								<th className="border border-slate-500 px-1 py-1 text-center">Qtd</th>
								<th className="border border-slate-500 px-1 py-1 text-center">Diária</th>
								<th className="border border-slate-500 px-1 py-1 text-center">Total</th>
							</tr>
						</thead>
						<tbody>
							{report.rows.map((row) => (
								<tr key={row.id}>
									<td className="border border-slate-300 px-1 py-1 text-center text-slate-500">
										{row.index}
									</td>
									<td className="border border-slate-300 px-2 py-1">
										<div className="font-semibold text-slate-800">{row.name}</div>
										<div className="text-[9px] text-slate-500">{row.role_title}</div>
									</td>
									{days.map((day) => {
										const cell = row.cells[day.date];
										return (
											<td
												key={day.date}
												className={cn(
													'border border-slate-300 px-1 py-1.5 text-center align-middle leading-tight',
													cellClassName(
														cell?.status,
														day.isWeekend,
														cell?.hasIncompleteTimes,
													),
												)}
											>
												{cell
													? cellContent(
															cell.status,
															cell.dayFraction,
															cell.hasIncompleteTimes,
														)
													: ''}
											</td>
										);
									})}
									<td className="border border-slate-300 px-1 py-1 text-center">Dia</td>
									<td className="border border-slate-300 px-1 py-1 text-center font-semibold">
										{formatFraction(row.totalFraction)}
									</td>
									<td className="border border-slate-300 px-1 py-1 text-right whitespace-nowrap">
										{row.dailyRate > 0 ? formatCurrencyDisplay(row.dailyRate) : '—'}
									</td>
									<td className="border border-slate-300 px-1 py-1 text-right font-bold whitespace-nowrap">
										{formatCurrencyDisplay(row.totalValue)}
									</td>
								</tr>
							))}
							<tr aria-hidden className="pointer-events-none">
								<td
									colSpan={totalColSpan + 1}
									className="border-0 bg-transparent p-0 h-3"
								/>
							</tr>
							<tr className="bg-slate-700 font-bold text-white text-sm">
								<td
									className="border border-slate-500 px-2 py-2.5 text-right"
									colSpan={totalColSpan}
								>
									TOTAL R$
								</td>
								<td className="border border-slate-500 px-2 py-2.5 text-right whitespace-nowrap">
									{formatCurrencyDisplay(report.grandTotal)}
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				<div className="folha-freq-legend">
					<ReportLegend />
				</div>
			</div>

			<PaymentSummaryTable rows={report.rows} grandTotal={report.grandTotal} />
		</div>
	);
}

const LEGEND_ITEMS: AttendanceStatus[] = [
	'SCHEDULED_DISMISSAL',
	'REQUESTED_DISMISSAL',
	'ABSENT',
	'DAY_OFF',
	'SCHEDULED_DAY_OFF',
	'NA',
	'ABSENT_JUSTIFIED',
];

const LEGEND_HINTS: Partial<Record<AttendanceStatus, string>> = {
	SCHEDULED_DISMISSAL: 'Dispensa programada com possibilidade de retorno',
	REQUESTED_DISMISSAL: 'Dispensa solicitada pelo colaborador',
	ABSENT: 'Falta injustificada (dia não pago)',
	DAY_OFF: 'Dia de folga não remunerado',
	SCHEDULED_DAY_OFF: 'Folga programada em dia útil (não remunerada)',
	NA: 'Não aplicável — ainda não contratado ou não iniciado',
	ABSENT_JUSTIFIED: 'Falta justificada (atestado etc.) — não remunerada',
};

function ReportLegend() {
	return (
		<div className="mt-5">
			<p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700">
				Legenda:
			</p>
			<div className="grid gap-2 sm:grid-cols-2 text-[10px]">
				{LEGEND_ITEMS.map((status) => (
					<div key={status} className="flex items-start gap-2">
						<span
							className={cn(
								'inline-flex min-w-[118px] justify-center rounded px-2 py-1 text-center leading-tight',
								STATUS_CONFIG[status].badgeClass,
							)}
						>
							{STATUS_CONFIG[status].short}
						</span>
						<span className="text-slate-600 pt-1">
							{LEGEND_HINTS[status] ?? STATUS_CONFIG[status].label}
						</span>
					</div>
				))}
				<div className="flex items-start gap-2">
					<span className="inline-flex min-w-[118px] justify-center rounded border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-900">
						1,00 / 0,98
					</span>
					<span className="text-slate-600 pt-1">
						Fração da diária trabalhada no dia
					</span>
				</div>
			</div>
		</div>
	);
}

function PrintStyles() {
	return (
		<style>{`
			@media print {
				@page { size: A4 landscape; margin: 8mm; }
				body * { visibility: hidden; }
				#folha-print, #folha-print * { visibility: visible; }
				#folha-print { position: absolute; left: 0; top: 0; width: 100%; }
				#folha-print * {
					-webkit-print-color-adjust: exact !important;
					print-color-adjust: exact !important;
				}
				.folha-no-print { display: none !important; }
				html[data-print-section="freq"] #folha-payment-section {
					display: none !important;
				}
				html[data-print-section="payment"] #folha-freq-section {
					display: none !important;
				}
				html[data-print-section="payment"] #folha-print > header {
					display: none !important;
				}
			}
		`}</style>
	);
}
