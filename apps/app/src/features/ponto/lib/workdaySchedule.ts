import { getDay, parseISO } from 'date-fns';
import type { AttendanceStatus } from '../schemas/attendanceSchema';

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

/** Converts "HH:mm" into minutes since midnight. */
export function timeToMinutes(value: string): number {
	const [h, m] = value.split(':').map(Number);
	return h * 60 + m;
}

function normalizeClockValue(value: string | null | undefined): string {
	if (typeof value !== 'string') return '';
	return value.trim().slice(0, 5);
}

/**
 * True when some (but not all) of the four day punches are filled.
 * Incomplete days must not show a worked-hours fraction in the UI.
 */
export function hasPartialClockTimes(
	clockIn: string | null | undefined,
	clockOut: string | null | undefined,
	lunchStart: string | null | undefined,
	lunchEnd: string | null | undefined,
): boolean {
	const filled = [clockIn, lunchStart, lunchEnd, clockOut]
		.map(normalizeClockValue)
		.filter(Boolean).length;
	return filled > 0 && filled < 4;
}

/**
 * Computes the worked-day fraction for an attendance record. Only PRESENT days
 * count; the fraction is worked-hours / standard-workday-hours (can exceed 1.0
 * for overtime). Tolerance snaps near-full days to exactly 1.0.
 * Partial clock times (1–3 of 4 filled) yield 0 until the day is complete.
 */
export function computeDayFraction(
	status: AttendanceStatus,
	clockIn: string | null,
	clockOut: string | null,
	lunchStart: string | null,
	lunchEnd: string | null,
	standardHours: number,
	toleranceMinutes: number,
	scheduledStart: string | null,
): number {
	if (status !== 'PRESENT') return 0;
	if (hasPartialClockTimes(clockIn, clockOut, lunchStart, lunchEnd)) return 0;
	if (!clockIn || !clockOut) return 1;

	let startMin = timeToMinutes(clockIn);
	const endMin = timeToMinutes(clockOut);

	if (scheduledStart) {
		const scheduledStartMin = timeToMinutes(scheduledStart);
		if (startMin < scheduledStartMin) {
			startMin = scheduledStartMin;
		}
	}

	let worked = 0;
	if (lunchStart && lunchEnd) {
		const lunchStartMin = timeToMinutes(lunchStart);
		const lunchEndMin = timeToMinutes(lunchEnd);
		worked = (lunchStartMin - startMin) + (endMin - lunchEndMin);
	} else {
		worked = endMin - startMin;
	}

	if (worked < 0) worked += 24 * 60; // overnight shift fallback
	if (worked <= 0) return 0;

	const fullDay = standardHours * 60;
	if (Math.abs(worked - fullDay) <= toleranceMinutes) return 1;

	return Math.round((worked / fullDay) * 100) / 100;
}
