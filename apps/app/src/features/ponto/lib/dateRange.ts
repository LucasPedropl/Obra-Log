import { addDays, eachDayOfInterval, format, parseISO } from 'date-fns';

export interface DayColumn {
	/** ISO date (YYYY-MM-DD). */
	date: string;
	/** Day of month, e.g. "05". */
	dayLabel: string;
	/** Short weekday, e.g. "sex". */
	weekdayLabel: string;
	/** True for Saturday/Sunday. */
	isWeekend: boolean;
	/** True when site schedule marks this weekday as non-work (Folga Programada). */
	isScheduledOff?: boolean;
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** Builds the list of day columns between two ISO dates (inclusive). */
export function buildDayColumns(startDate: string, endDate: string): DayColumn[] {
	const start = parseISO(startDate);
	const end = parseISO(endDate);
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
		return [];
	}

	return eachDayOfInterval({ start, end }).map((d) => {
		const weekday = d.getDay();
		return {
			date: format(d, 'yyyy-MM-dd'),
			dayLabel: format(d, 'dd/MM'),
			weekdayLabel: WEEKDAYS[weekday],
			isWeekend: weekday === 0 || weekday === 6,
		};
	});
}

/** Returns the default fortnight (1st–15th or 16th–end) for a given date. */
export function defaultFortnight(reference = new Date()): {
	start: string;
	end: string;
} {
	const year = reference.getFullYear();
	const month = reference.getMonth();
	const day = reference.getDate();

	if (day <= 15) {
		const start = new Date(year, month, 1);
		const end = new Date(year, month, 15);
		return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
	}

	const start = new Date(year, month, 16);
	const end = addDays(new Date(year, month + 1, 1), -1);
	return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
}
