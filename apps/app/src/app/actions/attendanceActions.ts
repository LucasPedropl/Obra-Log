'use server';

import { z } from 'zod';
import { createServerSupabaseClient } from '@/config/supabaseServer';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { safeLogError } from '@/lib/safeLog';
import { upsertAttendanceSchema } from '@/features/ponto/schemas/attendanceSchema';
import type { AttendanceStatus } from '@/features/ponto/schemas/attendanceSchema';
import {
	assertSiteAccess,
	getAuthenticatedUserId,
} from './_helpers';
import {
	normalizeWorkdaySchedule,
	type WorkdaySchedule,
} from '@/features/ponto/lib/workdaySchedule';

const siteIdSchema = z.string().uuid('ID da obra inválido');
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida');

function formatZodError(error: unknown): never {
	if (error instanceof z.ZodError) {
		throw new Error(error.issues[0]?.message ?? 'Dados inválidos');
	}
	throw error;
}

/** Converts "HH:mm" into minutes since midnight. */
function timeToMinutes(value: string): number {
	const [h, m] = value.split(':').map(Number);
	return h * 60 + m;
}

/**
 * Computes the worked-day fraction for an attendance record. Only PRESENT days
 * count; the fraction is worked-hours / standard-workday-hours (can exceed 1.0
 * for overtime). Tolerance snaps near-full days to exactly 1.0.
 */
function computeDayFraction(
	status: AttendanceStatus,
	clockIn: string | null,
	clockOut: string | null,
	lunchStart: string | null,
	lunchEnd: string | null,
	standardHours: number,
	toleranceMinutes: number,
): number {
	if (status !== 'PRESENT') return 0;
	if (!clockIn || !clockOut) return 1;

	const startMin = timeToMinutes(clockIn);
	const endMin = timeToMinutes(clockOut);
	
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

export async function getSiteAttendance(
	siteId: string,
	startDate: string,
	endDate: string,
) {
	try {
		const parsedSiteId = siteIdSchema.parse(siteId);
		const start = dateSchema.parse(startDate);
		const end = dateSchema.parse(endDate);
		const userId = await getAuthenticatedUserId();
		await assertSiteAccess(userId, parsedSiteId);

		const supabase = await createServerSupabaseClient();
		const [{ data, error }, { data: site, error: siteError }] = await Promise.all([
			supabase
				.from('attendance_records')
				.select(
					'id, collaborator_id, work_date, clock_in, clock_out, lunch_start, lunch_end, status, day_fraction, notes',
				)
				.eq('site_id', parsedSiteId)
				.gte('work_date', start)
				.lte('work_date', end),
			supabaseAdmin
				.from('construction_sites')
				.select('workday_schedule_json')
				.eq('id', parsedSiteId)
				.single(),
		]);
		if (error) throw error;
		if (siteError) throw siteError;

		return {
			records: data || [],
			workdaySchedule: normalizeWorkdaySchedule(site?.workday_schedule_json),
		};
	} catch (error: unknown) {
		safeLogError('getSiteAttendance', error);
		formatZodError(error);
	}
}

export async function upsertAttendanceRecord(
	input: z.infer<typeof upsertAttendanceSchema>,
) {
	try {
		const payload = upsertAttendanceSchema.parse(input);
		const userId = await getAuthenticatedUserId();
		await assertSiteAccess(userId, payload.siteId);

		const supabase = await createServerSupabaseClient();

		const { data: site, error: siteError } = await supabaseAdmin
			.from('construction_sites')
			.select('company_id, tolerance_minutes, workday_schedule_json')
			.eq('id', payload.siteId)
			.single();
		if (siteError) throw siteError;

		// Calculate standard hours dynamically based on weekly schedule json
		let standardHours = 8;
		const dateObj = new Date(payload.workDate + 'T00:00:00');
		const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
		const dayOfWeek = daysMap[dateObj.getDay()];

		const schedule = site.workday_schedule_json as any;
		if (schedule && schedule[dayOfWeek]) {
			const dayInfo = schedule[dayOfWeek];
			if (dayInfo.active && dayInfo.start && dayInfo.end) {
				const scheduleMinutes = timeToMinutes(dayInfo.end) - timeToMinutes(dayInfo.start);
				if (scheduleMinutes > 0) {
					standardHours = scheduleMinutes / 60;
				}
			}
		}

		const clockIn = payload.clockIn || null;
		const clockOut = payload.clockOut || null;
		const lunchStart = payload.lunchStart || null;
		const lunchEnd = payload.lunchEnd || null;

		const dayFraction = computeDayFraction(
			payload.status,
			clockIn,
			clockOut,
			lunchStart,
			lunchEnd,
			standardHours,
			Number(site.tolerance_minutes ?? 0),
		);

		const row = {
			company_id: site.company_id,
			site_id: payload.siteId,
			collaborator_id: payload.collaboratorId,
			work_date: payload.workDate,
			clock_in: clockIn,
			clock_out: clockOut,
			lunch_start: lunchStart,
			lunch_end: lunchEnd,
			status: payload.status,
			day_fraction: dayFraction,
			notes: payload.notes || null,
			updated_at: new Date().toISOString(),
		};

		const { data, error } = await supabase
			.from('attendance_records')
			.upsert(row, { onConflict: 'site_id,collaborator_id,work_date' })
			.select(
				'id, collaborator_id, work_date, clock_in, clock_out, lunch_start, lunch_end, status, day_fraction, notes',
			)
			.single();
		if (error) throw error;
		return data;
	} catch (error: unknown) {
		safeLogError('upsertAttendanceRecord', error);
		formatZodError(error);
	}
}

export async function deleteAttendanceRecord(
	siteId: string,
	collaboratorId: string,
	workDate: string,
) {
	try {
		const parsedSiteId = siteIdSchema.parse(siteId);
		const parsedCollaboratorId = z.string().uuid().parse(collaboratorId);
		const parsedDate = dateSchema.parse(workDate);
		const userId = await getAuthenticatedUserId();
		await assertSiteAccess(userId, parsedSiteId);

		const supabase = await createServerSupabaseClient();
		const { error } = await supabase
			.from('attendance_records')
			.delete()
			.eq('site_id', parsedSiteId)
			.eq('collaborator_id', parsedCollaboratorId)
			.eq('work_date', parsedDate);
		if (error) throw error;
		return true;
	} catch (error: unknown) {
		safeLogError('deleteAttendanceRecord', error);
		formatZodError(error);
	}
}
