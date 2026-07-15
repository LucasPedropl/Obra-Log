import { useCallback, useEffect, useState } from 'react';
import {
	getSiteAttendance,
	upsertAttendanceRecord,
	deleteAttendanceRecord,
} from '@/app/actions/attendanceActions';
import type {
	AttendanceRecord,
	UpsertAttendanceInput,
} from '../schemas/attendanceSchema';
import {
	DEFAULT_WORKDAY_SCHEDULE,
	normalizeWorkdaySchedule,
	type WorkdaySchedule,
} from '../lib/workdaySchedule';

/** Key used to index records by collaborator + day. */
export const cellKey = (collaboratorId: string, date: string) =>
	`${collaboratorId}_${date}`;

/**
 * Loads attendance records for a site within a date range and exposes
 * optimistic-friendly mutators (save/clear) keyed by collaborator + day.
 * Also returns the site workday schedule for Folga Programada defaults.
 */
export function useSiteAttendance(
	siteId: string,
	startDate: string,
	endDate: string,
) {
	const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
	const [workdaySchedule, setWorkdaySchedule] = useState<WorkdaySchedule>(
		DEFAULT_WORKDAY_SCHEDULE,
	);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchRecords = useCallback(async () => {
		if (!siteId || !startDate || !endDate) {
			setIsLoading(false);
			return;
		}
		try {
			setIsLoading(true);
			setError(null);
			const result = await getSiteAttendance(siteId, startDate, endDate);
			const map: Record<string, AttendanceRecord> = {};
			for (const r of (result?.records as AttendanceRecord[]) || []) {
				map[cellKey(r.collaborator_id, r.work_date)] = r;
			}
			setRecords(map);
			setWorkdaySchedule(normalizeWorkdaySchedule(result?.workdaySchedule));
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : 'Erro ao carregar o ponto';
			console.error('Error fetching attendance:', err);
			setError(message);
		} finally {
			setIsLoading(false);
		}
	}, [siteId, startDate, endDate]);

	useEffect(() => {
		fetchRecords();
	}, [fetchRecords]);

	const saveCell = async (input: UpsertAttendanceInput): Promise<boolean> => {
		try {
			setError(null);
			const saved = (await upsertAttendanceRecord(
				input,
			)) as AttendanceRecord | null;
			if (saved) {
				setRecords((prev) => ({
					...prev,
					[cellKey(saved.collaborator_id, saved.work_date)]: saved,
				}));
			}
			return true;
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : 'Erro ao salvar o ponto';
			console.error('Error saving attendance:', err);
			setError(message);
			return false;
		}
	};

	const clearCell = async (
		collaboratorId: string,
		workDate: string,
	): Promise<boolean> => {
		try {
			setError(null);
			await deleteAttendanceRecord(siteId, collaboratorId, workDate);
			setRecords((prev) => {
				const next = { ...prev };
				delete next[cellKey(collaboratorId, workDate)];
				return next;
			});
			return true;
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : 'Erro ao limpar o registro';
			console.error('Error clearing attendance:', err);
			setError(message);
			return false;
		}
	};

	return {
		records,
		workdaySchedule,
		isLoading,
		error,
		saveCell,
		clearCell,
		refetch: fetchRecords,
	};
}
