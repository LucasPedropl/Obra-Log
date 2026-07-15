import { useState } from 'react';
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

/** Fetches the raw data for a site's frequency report on demand. */
export function useFrequencyReport() {
	const [data, setData] = useState<ReportData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const generate = async (
		siteId: string,
		startDate: string,
		endDate: string,
	): Promise<boolean> => {
		try {
			setIsLoading(true);
			setError(null);
			const result = await getFrequencyReportData(siteId, startDate, endDate);
			setData(
				result || {
					collaborators: [],
					records: [],
					workdaySchedule: null,
				},
			);
			return true;
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : 'Erro ao gerar o relatório';
			console.error('Error generating report:', err);
			setError(message);
			setData(null);
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	const reset = () => setData(null);

	return { data, isLoading, error, generate, reset };
}
