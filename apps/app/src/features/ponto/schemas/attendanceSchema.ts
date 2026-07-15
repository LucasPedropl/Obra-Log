import { z } from 'zod';

/** Possible per-day attendance statuses (mirrors the frequency report model). */
export const ATTENDANCE_STATUSES = [
	'PRESENT',
	'ABSENT',
	'ABSENT_JUSTIFIED',
	'DAY_OFF',
	'SCHEDULED_DAY_OFF',
	'SCHEDULED_DISMISSAL',
	'REQUESTED_DISMISSAL',
	'NA',
] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const upsertAttendanceSchema = z.object({
	siteId: z.string().uuid('Obra inválida'),
	collaboratorId: z.string().uuid('Colaborador inválido'),
	workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
	status: z.enum(ATTENDANCE_STATUSES),
	clockIn: z
		.string()
		.regex(timeRegex, 'Hora inválida')
		.optional()
		.nullable()
		.or(z.literal('')),
	clockOut: z
		.string()
		.regex(timeRegex, 'Hora inválida')
		.optional()
		.nullable()
		.or(z.literal('')),
	lunchStart: z
		.string()
		.regex(timeRegex, 'Hora inválida')
		.optional()
		.nullable()
		.or(z.literal('')),
	lunchEnd: z
		.string()
		.regex(timeRegex, 'Hora inválida')
		.optional()
		.nullable()
		.or(z.literal('')),
	notes: z.string().max(500).optional().nullable(),
});

export type UpsertAttendanceInput = z.infer<typeof upsertAttendanceSchema>;

export interface AttendanceRecord {
	id: string;
	collaborator_id: string;
	work_date: string;
	clock_in: string | null;
	clock_out: string | null;
	lunch_start: string | null;
	lunch_end: string | null;
	status: AttendanceStatus;
	day_fraction: number;
	notes: string | null;
}
