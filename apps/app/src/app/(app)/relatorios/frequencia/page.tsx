'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Users, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared/PageHeader';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { EmptyState } from '@/components/shared/EmptyState';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useConstructionSites } from '@/features/obras/hooks/useConstructionSites';
import { useSiteCollaborators } from '@/features/mao-de-obra/hooks/useSiteCollaborators';
import { useSiteAttendance, cellKey } from '@/features/ponto/hooks/useSiteAttendance';
import { PeriodPicker } from '@/features/ponto/components/PeriodPicker';
import { buildDayColumns, defaultFortnight } from '@/features/ponto/lib/dateRange';
import {
	isScheduledDayOff,
	normalizeWorkdaySchedule,
	type WorkdaySchedule,
} from '@/features/ponto/lib/workdaySchedule';
import { AttendanceGrid } from '@/features/ponto/components/AttendanceGrid';
import { AttendanceCellEditor } from '@/features/ponto/components/AttendanceCellEditor';
import { useActiveObra } from '@/context/ActiveObraContext';
import { STATUS_CONFIG } from '@/features/ponto/lib/attendanceConfig';
import type { AttendanceStatus } from '@/features/ponto/schemas/attendanceSchema';

interface SiteOption {
	id: string;
	name: string;
	workday_schedule_json?: WorkdaySchedule | null;
}

export default function FrequenciaPage() {
	const { selectedObraId } = useActiveObra();
	const initial = useMemo(() => defaultFortnight(), []);
	const [sites, setSites] = useState<SiteOption[]>([]);
	const [siteId, setSiteId] = useState('');
	const [startDate, setStartDate] = useState(initial.start);
	const [endDate, setEndDate] = useState(initial.end);

	useEffect(() => {
		if (selectedObraId && !siteId) {
			setSiteId(selectedObraId);
		}
	}, [selectedObraId, siteId]);

	const [selected, setSelected] = useState<{
		collaboratorId: string;
		date: string;
	} | null>(null);

	const { fetchConstructionSites } = useConstructionSites();

	const { collaborators, isLoading: loadingColabs } = useSiteCollaborators(siteId);
	const {
		records,
		workdaySchedule: scheduleFromAttendance,
		isLoading,
		error,
		saveCell,
		clearCell,
	} = useSiteAttendance(siteId, startDate, endDate);

	useEffect(() => {
		(async () => {
			const result = await fetchConstructionSites();
			setSites(
				result.map(
					(s: {
						id: string;
						name: string;
						workday_schedule_json?: WorkdaySchedule | null;
					}) => ({
						id: s.id,
						name: s.name,
						workday_schedule_json: normalizeWorkdaySchedule(
							s.workday_schedule_json,
						),
					}),
				),
			);
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const workdaySchedule = useMemo(() => {
		const fromSite = sites.find((s) => s.id === siteId)?.workday_schedule_json;
		return normalizeWorkdaySchedule(scheduleFromAttendance ?? fromSite);
	}, [scheduleFromAttendance, sites, siteId]);

	const days = useMemo(() => {
		const cols = buildDayColumns(startDate, endDate);
		return cols.map((day) => ({
			...day,
			isScheduledOff: isScheduledDayOff(day.date, workdaySchedule),
		}));
	}, [startDate, endDate, workdaySchedule]);

	const gridCollaborators = useMemo(() => {
		return collaborators.map((c: { collaboratorId: string; name: string; role_title: string }) => ({
			collaboratorId: c.collaboratorId,
			name: c.name,
			role_title: c.role_title,
		}));
	}, [collaborators]);

	const selectedCollaborator = selected
		? collaborators.find((c: { collaboratorId: string }) => c.collaboratorId === selected.collaboratorId)
		: null;
	
	const selectedRecord = selected
		? records[cellKey(selected.collaboratorId, selected.date)]
		: undefined;

	return (
		<ProtectedRoute resource="site_ponto">
			<div className="w-full flex flex-col gap-6">
				<PageHeader
					title="Relatório de Frequência"
					description="Consulte e edite o histórico de presença e ponto de múltiplos dias de qualquer obra."
				/>

				<div className="flex flex-wrap items-end gap-4 bg-white border border-gray-200 rounded-[5px] p-4 shadow-sm">
					<div className="flex flex-col gap-1.5 min-w-[240px] flex-1 sm:flex-initial">
						<label className="text-xs font-semibold text-gray-700">Obra</label>
						<SearchableSelect
							options={sites.map((s) => ({ value: s.id, label: s.name }))}
							value={siteId}
							onChange={setSiteId}
							placeholder="Selecione a obra..."
						/>
					</div>

					<PeriodPicker
						startDate={startDate}
						endDate={endDate}
						onChange={(s, e) => {
							setStartDate(s);
							setEndDate(e);
						}}
					/>

					{error && (
						<div className="w-full rounded-[5px] border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive mt-2">
							{error}
						</div>
					)}
				</div>

				{!siteId ? (
					<EmptyState
						title="Selecione uma obra"
						description="Selecione uma obra e defina o período desejado para visualizar a frequência."
						icon={<FileText className="w-8 h-8 text-gray-400" />}
					/>
				) : loadingColabs || isLoading ? (
					<div className="flex items-center justify-center p-12">
						<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
					</div>
				) : collaborators.length === 0 ? (
					<EmptyState
						title="Sem colaboradores"
						description="Nenhum colaborador alocado nesta obra para o período selecionado."
						icon={<Users className="w-8 h-8 text-gray-400" />}
					/>
				) : (
					<>
						<AttendanceGrid
							collaborators={gridCollaborators}
							days={days}
							records={records}
							onlyToday={false}
							workdaySchedule={workdaySchedule}
							onCellClick={(collaboratorId, date) =>
								setSelected({ collaboratorId, date })
							}
						/>
						<AttendanceLegend />
					</>
				)}

				{selected && selectedCollaborator && (
					<AttendanceCellEditor
						collaboratorName={selectedCollaborator.name}
						dateLabel={format(parseISO(selected.date), "dd/MM/yyyy")}
						record={selectedRecord}
						onSave={(data) =>
							saveCell({
								siteId: siteId,
								collaboratorId: selected.collaboratorId,
								workDate: selected.date,
								...data,
							})
						}
						onClear={() =>
							clearCell(selected.collaboratorId, selected.date)
						}
						onClose={() => setSelected(null)}
					/>
				)}
			</div>
		</ProtectedRoute>
	);
}

function AttendanceLegend() {
	const items = Object.entries(STATUS_CONFIG) as [
		AttendanceStatus,
		(typeof STATUS_CONFIG)[AttendanceStatus],
	][];

	return (
		<div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground bg-white border border-gray-100 rounded-[5px] p-3 shadow-sm mt-4">
			{items.map(([status, config]) => (
				<div key={status} className="flex items-center gap-1.5">
					<span className={cn('w-3 h-3 rounded-[3px] border', config.badgeClass)} />
					<span className="font-semibold">{config.label}</span>
				</div>
			))}
		</div>
	);
}
