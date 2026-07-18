'use client';

import React from 'react';
import { cellKey } from '../hooks/useSiteAttendance';
import type { AttendanceRecord } from '../schemas/attendanceSchema';
import type { GridCollaborator } from './attendanceTypes';
import { DailyAttendanceRow, type DailyAttendanceSaveData } from './DailyAttendanceRow';

interface DailyAttendanceTableProps {
	collaborators: GridCollaborator[];
	date: string;
	records: Record<string, AttendanceRecord>;
	onSave: (
		collaboratorId: string,
		date: string,
		data: DailyAttendanceSaveData,
	) => Promise<boolean>;
}

export function DailyAttendanceTable({
	collaborators,
	date,
	records,
	onSave,
}: DailyAttendanceTableProps) {
	return (
		<div className="overflow-x-auto rounded-xl border border-border bg-card custom-scrollbar">
			<table className="w-full min-w-[860px] border-collapse text-sm">
				<thead>
					<tr className="bg-muted/60 text-left">
						<th className="sticky left-0 z-10 bg-muted/60 px-4 py-3 font-semibold text-foreground border-b border-border min-w-[200px]">
							Colaborador
						</th>
						<th className="px-3 py-3 font-semibold border-b border-border">Entrada</th>
						<th className="px-3 py-3 font-semibold border-b border-border">S. Almoço</th>
						<th className="px-3 py-3 font-semibold border-b border-border">V. Almoço</th>
						<th className="px-3 py-3 font-semibold border-b border-border">Saída</th>
						<th className="px-3 py-3 font-semibold border-b border-border min-w-[180px]">
							Observações
						</th>
					</tr>
				</thead>
				<tbody>
					{collaborators.map((c) => (
						<DailyAttendanceRow
							key={c.collaboratorId}
							collaborator={c}
							record={records[cellKey(c.collaboratorId, date)]}
							onSave={(data) => onSave(c.collaboratorId, date, data)}
						/>
					))}
				</tbody>
			</table>
		</div>
	);
}

export type { DailyAttendanceSaveData };
