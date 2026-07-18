import { useCallback, useEffect, useRef, useState } from 'react';
import { getFrequencyReportData } from '@/app/actions/folhaActions';
import type {
	ReportAttendance,
	ReportCollaborator,
} from '@/app/actions/folhaActions';
import type { WorkdaySchedule } from '@/features/ponto/lib/workdaySchedule';

interface ReportData {
	collaborators: ReportCollaborator[];
	records: ReportAttendance[];
	workdaySchedule: WorkdaySchedule | null;
}

/**
 * Loads frequency-report raw data for a site within a date range.
 * Refetches automatically whenever site or period changes.
 */
export function useFrequencyReport(
	siteId: string,
	startDate: string,
	endDate: string,
) {
	const [data, setData] = useState<ReportData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const requestIdRef = useRef(0);

	const fetchReport = useCallback(async () => {
		if (!siteId || !startDate || !endDate) {
			setData(null);
			setIsLoading(false);
			setError(null);
			return;
		}

		const requestId = ++requestIdRef.current;
		try {
			setIsLoading(true);
			setError(null);
			const result = await getFrequencyReportData(siteId, startDate, endDate);
			if (requestId !== requestIdRef.current) return;
			setData(
				result || {
					collaborators: [],
					records: [],
					workdaySchedule: null,
				},
			);
		} catch (err: unknown) {
			if (requestId !== requestIdRef.current) return;
			const message =
				err instanceof Error ? err.message : 'Erro ao gerar o relatório';
			console.error('Error generating report:', err);
			setError(message);
			setData(null);
		} finally {
			if (requestId === requestIdRef.current) {
				setIsLoading(false);
			}
		}
	}, [siteId, startDate, endDate]);

	useEffect(() => {
		void fetchReport();
	}, [fetchReport]);

	return { data, isLoading, error };
}
