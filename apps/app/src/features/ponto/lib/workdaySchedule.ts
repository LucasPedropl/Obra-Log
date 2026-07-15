import { getDay, parseISO } from 'date-fns';

/** Keys used in construction_sites.workday_schedule_json */
export type WorkdayKey =
	| 'sunday'
	| 'monday'
	| 'tuesday'
	| 'wednesday'
	| 'thursday'
	| 'friday'
	| 'saturday';

export interface DaySchedule {
	active?: boolean | string | number | null;
	start?: string | null;
	end?: string | null;
	lunch_start?: string | null;
	lunch_end?: string | null;
}

export type WorkdaySchedule = Partial<Record<WorkdayKey, DaySchedule>>;

/** Fallback when the site has no workday_schedule_json saved yet. */
export const DEFAULT_WORKDAY_SCHEDULE: WorkdaySchedule = {
	monday: { start: '08:00', end: '17:00', active: true },
	tuesday: { start: '08:00', end: '17:00', active: true },
	wednesday: { start: '08:00', end: '17:00', active: true },
	thursday: { start: '08:00', end: '17:00', active: true },
	friday: { start: '08:00', end: '17:00', active: true },
	saturday: { start: '08:00', end: '12:00', active: true },
	sunday: { start: '', end: '', active: false },
};

/** JS Date#getDay() index → schedule key (0 = Sunday). */
export const WEEKDAY_KEYS: WorkdayKey[] = [
	'sunday',
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
];

/** Normalizes schedule from Supabase / server actions; falls back to default. */
export function normalizeWorkdaySchedule(
	raw: unknown,
): WorkdaySchedule {
	if (!raw) return DEFAULT_WORKDAY_SCHEDULE;
	if (typeof raw === 'string') {
		try {
			const parsed: unknown = JSON.parse(raw);
			if (typeof parsed === 'object' && parsed !== null) {
				return { ...DEFAULT_WORKDAY_SCHEDULE, ...(parsed as WorkdaySchedule) };
			}
			return DEFAULT_WORKDAY_SCHEDULE;
		} catch {
			return DEFAULT_WORKDAY_SCHEDULE;
		}
	}
	if (typeof raw === 'object') {
		return { ...DEFAULT_WORKDAY_SCHEDULE, ...(raw as WorkdaySchedule) };
	}
	return DEFAULT_WORKDAY_SCHEDULE;
}

function isDayActive(day: DaySchedule | undefined): boolean {
	if (!day) return true;
	const { active } = day;
	if (active === true || active === 1 || active === 'true' || active === '1') {
		return true;
	}
	if (active === false || active === 0 || active === 'false' || active === '0') {
		return false;
	}
	const hasHours = Boolean(day.start && day.end);
	return hasHours;
}

/**
 * True when the date is not a work day in the site schedule
 * (e.g. Sunday with active: false → Folga Programada).
 */
export function isScheduledDayOff(
	isoDate: string,
	schedule: WorkdaySchedule | null | undefined,
): boolean {
	const normalized = normalizeWorkdaySchedule(schedule ?? null);

	try {
		const date = parseISO(isoDate);
		if (Number.isNaN(date.getTime())) return false;
		const key = WEEKDAY_KEYS[getDay(date)];
		const day = normalized[key];
		return !isDayActive(day);
	} catch {
		return false;
	}
}
