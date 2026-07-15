'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrencyDisplay } from '@/lib/maskUtils';
import type { ReportRow } from '../lib/buildReport';
import {
	formatBankDataLabel,
	formatContactPhone,
	formatPixKeyRaw,
} from '../lib/paymentFormat';
import { printFolhaSection } from '../lib/printFolha';

interface PaymentSummaryTableProps {
	rows: ReportRow[];
	grandTotal: number;
}

const formatQuantity = (value: number) =>
	value.toLocaleString('pt-BR', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

/**
 * Second report table: amounts due with bank/Pix/contact for each collaborator.
 * Total row is visually detached with a highlight bar (Excel-style).
 */
export function PaymentSummaryTable({ rows, grandTotal }: PaymentSummaryTableProps) {
	return (
		<div id="folha-payment-section" className="folha-print-section mt-8">
			<header className="mb-3 flex flex-wrap items-center justify-between gap-3">
				<h3 className="text-base font-bold text-slate-900 flex-1 text-center sm:text-left">
					Resumo de Pagamento
				</h3>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="folha-no-print h-8 rounded-[5px] border-gray-300 text-xs font-semibold"
					onClick={() => printFolhaSection('payment')}
				>
					<Download className="w-3.5 h-3.5 mr-1.5" />
					Baixar esta tabela
				</Button>
			</header>

			<div className="overflow-x-auto">
				<table className="w-full border-collapse text-[10px]">
					<thead>
						<tr className="bg-slate-700 text-white">
							<th className="border border-slate-500 px-1 py-1.5 text-center">ID</th>
							<th className="border border-slate-500 px-2 py-1.5 text-left min-w-[140px]">
								Nome
							</th>
							<th className="border border-slate-500 px-1 py-1.5 text-center">Und</th>
							<th className="border border-slate-500 px-1 py-1.5 text-center">
								Quantidade
							</th>
							<th className="border border-slate-500 px-1 py-1.5 text-center whitespace-nowrap">
								Valor unitário
							</th>
							<th className="border border-slate-500 px-1 py-1.5 text-center whitespace-nowrap">
								Total R$
							</th>
							<th className="border border-slate-500 px-2 py-1.5 text-left min-w-[120px]">
								Função
							</th>
							<th className="border border-slate-500 px-2 py-1.5 text-left min-w-[180px]">
								Dados Bancários
							</th>
							<th className="border border-slate-500 px-1 py-1.5 text-left">
								Chave Pix
							</th>
							<th className="border border-slate-500 px-1 py-1.5 text-left">
								Contato
							</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row, i) => (
							<tr key={row.id} className={i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
								<td className="border border-slate-300 px-1 py-1.5 text-center text-slate-500">
									{row.index}
								</td>
								<td className="border border-slate-300 px-2 py-1.5 font-semibold text-slate-800 uppercase">
									{row.name}
								</td>
								<td className="border border-slate-300 px-1 py-1.5 text-center">
									Dia
								</td>
								<td className="border border-slate-300 px-1 py-1.5 text-center font-semibold">
									{formatQuantity(row.totalFraction)}
								</td>
								<td className="border border-slate-300 px-1 py-1.5 text-right whitespace-nowrap">
									{row.dailyRate > 0 ? formatCurrencyDisplay(row.dailyRate) : '—'}
								</td>
								<td className="border border-slate-300 px-1 py-1.5 text-right font-bold whitespace-nowrap">
									{formatCurrencyDisplay(row.totalValue)}
								</td>
								<td className="border border-slate-300 px-2 py-1.5 uppercase">
									{row.role_title}
								</td>
								<td className="border border-slate-300 px-2 py-1.5 leading-snug">
									{formatBankDataLabel(row.bankName, row.pixKeyType, row.pixKey) ||
										'—'}
								</td>
								<td className="border border-slate-300 px-1 py-1.5 font-mono text-[9px]">
									{formatPixKeyRaw(row.pixKey, row.pixKeyType) || '—'}
								</td>
								<td className="border border-slate-300 px-1 py-1.5 whitespace-nowrap">
									{formatContactPhone(row.cellphone) || '—'}
								</td>
							</tr>
						))}
						{/* Espaço visual entre o corpo e o total */}
						<tr aria-hidden className="pointer-events-none">
							<td
								colSpan={10}
								className="border-0 bg-transparent p-0 h-3"
							/>
						</tr>
						<tr className="bg-slate-700 font-bold text-white text-sm">
							<td
								className="border border-slate-500 px-2 py-2.5 text-right"
								colSpan={5}
							>
								TOTAL R$
							</td>
							<td className="border border-slate-500 px-2 py-2.5 text-right whitespace-nowrap">
								{formatCurrencyDisplay(grandTotal)}
							</td>
							<td className="border border-slate-500 px-1 py-2.5" colSpan={4} />
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	);
}
