'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Loader2, Printer } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useConstructionSites } from '@/features/obras/hooks/useConstructionSites';
import { buildDayColumns, defaultFortnight } from '@/features/ponto/lib/dateRange';
import { useActiveObra } from '@/context/ActiveObraContext';
import { useFrequencyReport } from '@/features/folha/hooks/useFrequencyReport';
import { buildFrequencyReport } from '@/features/folha/lib/buildReport';
import { printFolhaSection } from '@/features/folha/lib/printFolha';
import { FrequencyReport } from '@/features/folha/components/FrequencyReport';

interface SiteOption {
	id: string;
	name: string;
}

export default function FolhaPage() {
	const { selectedObraId } = useActiveObra();
	const initial = useMemo(() => defaultFortnight(), []);
	const [sites, setSites] = useState<SiteOption[]>([]);
	const [siteId, setSiteId] = useState('');
	const [startDate, setStartDate] = useState(initial.start);
	const [endDate, setEndDate] = useState(initial.end);

	const { fetchConstructionSites } = useConstructionSites();
	const { data, isLoading, error } = useFrequencyReport(
		siteId,
		startDate,
		endDate,
	);

	useEffect(() => {
		if (selectedObraId && !siteId) {
			setSiteId(selectedObraId);
		}
	}, [selectedObraId, siteId]);

	useEffect(() => {
		(async () => {
			const result = await fetchConstructionSites();
			setSites(result.map((s: SiteOption) => ({ id: s.id, name: s.name })));
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const days = useMemo(
		() => buildDayColumns(startDate, endDate),
		[startDate, endDate],
	);

	const report = useMemo(
		() =>
			data
				? buildFrequencyReport(
						data.collaborators,
						data.records,
						days,
						data.workdaySchedule,
					)
				: null,
		[data, days],
	);

	const selectedSiteName = sites.find((s) => s.id === siteId)?.name || '';
	const periodLabel = `${startDate.split('-').reverse().join('/')} a ${endDate
		.split('-')
		.reverse()
		.join('/')}`;

	return (
		<ProtectedRoute resource="folha_pagamento">
			<div className="w-full flex flex-col gap-6">
				<PageHeader
					title="Folha de Pagamento"
					description="Relatório de frequência por quinzena e cálculo dos valores a pagar por colaborador."
				/>

				<div className="folha-no-print flex flex-wrap items-end gap-4 bg-white border border-gray-200 rounded-[5px] p-4 shadow-sm">
					<div className="flex flex-col gap-1.5 min-w-[240px] flex-1 sm:flex-initial">
						<label className="text-xs font-semibold text-gray-700">Obra</label>
						<SearchableSelect
							options={sites.map((s) => ({ value: s.id, label: s.name }))}
							value={siteId}
							onChange={setSiteId}
							placeholder="Selecione a obra..."
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-gray-700">Início</label>
						<input
							type="date"
							value={startDate}
							max={endDate || undefined}
							onChange={(e) => setStartDate(e.target.value)}
							className="h-10 rounded-[5px] border border-gray-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-gray-700">Fim</label>
						<input
							type="date"
							value={endDate}
							min={startDate || undefined}
							onChange={(e) => setEndDate(e.target.value)}
							className="h-10 rounded-[5px] border border-gray-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					{report && report.rows.length > 0 && (
						<div className="flex flex-wrap items-center gap-3">
							<Button
								variant="outline"
								onClick={() => printFolhaSection('all')}
								className="h-10 rounded-[5px] border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm font-semibold"
							>
								<Printer className="w-4 h-4 mr-2" />
								Exportar PDF
							</Button>
						</div>
					)}

					{error && (
						<div className="w-full rounded-[5px] border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive mt-2">
							{error}
						</div>
					)}
				</div>

				{!siteId ? (
					<EmptyState
						title="Selecione uma obra"
						description="Escolha a obra para carregar o relatório de frequência do período."
						icon={<FileText className="w-8 h-8 text-gray-400" />}
					/>
				) : isLoading && !report ? (
					<div className="flex items-center justify-center p-12">
						<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
					</div>
				) : report ? (
					report.rows.length === 0 ? (
						<EmptyState
							title="Sem dados no período"
							description="Nenhum colaborador alocado ou nenhum ponto registrado para a obra e período selecionados."
							icon={<FileText className="w-8 h-8 text-gray-400" />}
						/>
					) : (
						<div className={isLoading ? 'opacity-60 pointer-events-none' : undefined}>
							<FrequencyReport
								report={report}
								days={days}
								siteName={selectedSiteName}
								periodLabel={periodLabel}
							/>
						</div>
					)
				) : null}
			</div>
		</ProtectedRoute>
	);
}
