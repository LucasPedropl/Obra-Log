import type {
	ReportAttendance,
	ReportCollaborator,
} from '@/app/actions/folhaActions';
import type { AttendanceStatus } from '@/features/ponto/schemas/attendanceSchema';
import { cellKey } from '@/features/ponto/hooks/useSiteAttendance';
import type { DayColumn } from '@/features/ponto/lib/dateRange';
import {
	isScheduledDayOff,
	type WorkdaySchedule,
} from '@/features/ponto/lib/workdaySchedule';

export interface ReportDayCell {
	status: AttendanceStatus;
	dayFraction: number;
}

export interface ReportRow {
	id: string;
	index: number;
	name: string;
	role_title: string;
	dailyRate: number;
	cellphone: string | null;
	bankName: string | null;
	pixKey: string | null;
	pixKeyType: string | null;
	cells: Record<string, ReportDayCell | undefined>;
	totalFraction: number;
	totalValue: number;
}

export interface FrequencyReport {
	rows: ReportRow[];
	grandTotal: number;
}

/**
 * Aggregates collaborators + attendance into the report model.
 * Days not marked as work days in the site schedule appear as Folga Programada
 * when there is no explicit attendance record.
 */
export function buildFrequencyReport(
	collaborators: ReportCollaborator[],
	records: ReportAttendance[],
	days: DayColumn[],
	schedule?: WorkdaySchedule | null,
): FrequencyReport {
	const recordMap = new Map<string, ReportAttendance>();
	for (const r of records) {
		recordMap.set(cellKey(r.collaborator_id, r.work_date), r);
	}

	let grandTotal = 0;

	const rows: ReportRow[] = collaborators.map((c, idx) => {
		const cells: Record<string, ReportDayCell | undefined> = {};
		let totalFraction = 0;

		for (const day of days) {
			const rec = recordMap.get(cellKey(c.id, day.date));
			if (rec) {
				const fraction = Number(rec.day_fraction);
				cells[day.date] = {
					status: rec.status as AttendanceStatus,
					dayFraction: fraction,
				};
				totalFraction += fraction;
			} else if (isScheduledDayOff(day.date, schedule)) {
				cells[day.date] = {
					status: 'SCHEDULED_DAY_OFF',
					dayFraction: 0,
				};
			} else {
				cells[day.date] = undefined;
			}
		}

		const dailyRate = c.daily_rate ?? 0;
		const totalValue = totalFraction * dailyRate;
		grandTotal += totalValue;

		return {
			id: c.id,
			index: idx + 1,
			name: c.name,
			role_title: c.role_title,
			dailyRate,
			cellphone: c.cellphone,
			bankName: c.bank_name,
			pixKey: c.pix_key,
			pixKeyType: c.pix_key_type,
			cells,
			totalFraction,
			totalValue,
		};
	});

	return { rows, grandTotal };
}
