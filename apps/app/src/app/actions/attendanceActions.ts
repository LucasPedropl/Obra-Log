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
	type WorkdayKey,
	timeToMinutes,
	computeDayFraction,
} from '@/features/ponto/lib/workdaySchedule';

const siteIdSchema = z.string().uuid('ID da obra inválido');
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida');

function formatZodError(error: unknown): never {
	if (error instanceof z.ZodError) {
		throw new Error(error.issues[0]?.message ?? 'Dados inválidos');
	}
	throw error;
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
				.select('workday_schedule_json, tolerance_minutes')
				.eq('id', parsedSiteId)
				.single(),
		]);
		if (error) throw error;
		if (siteError) throw siteError;

		const schedule = normalizeWorkdaySchedule(site?.workday_schedule_json);
		const tolerance = Number(site?.tolerance_minutes ?? 0);

		const mappedRecords = (data || []).map((rec) => {
			if (rec.status !== 'PRESENT') return rec;

			let standardHours = 8;
			let scheduledStart: string | null = null;
			const dateObj = new Date(rec.work_date + 'T00:00:00');
			const daysMap: WorkdayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
			const dayOfWeek = daysMap[dateObj.getDay()];

			if (schedule && schedule[dayOfWeek]) {
				const dayInfo = schedule[dayOfWeek];
				if (dayInfo.active && dayInfo.start && dayInfo.end) {
					const scheduleMinutes = timeToMinutes(dayInfo.end) - timeToMinutes(dayInfo.start);
					if (scheduleMinutes > 0) {
						standardHours = scheduleMinutes / 60;
						scheduledStart = dayInfo.start;
					}
				}
			}

			const recalculatedFraction = computeDayFraction(
				rec.status as AttendanceStatus,
				rec.clock_in,
				rec.clock_out,
				rec.lunch_start,
				rec.lunch_end,
				standardHours,
				tolerance,
				scheduledStart,
			);

			return {
				...rec,
				day_fraction: recalculatedFraction,
			};
		});

		return {
			records: mappedRecords,
			workdaySchedule: schedule,
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
		let scheduledStart: string | null = null;
		const dateObj = new Date(payload.workDate + 'T00:00:00');
		const daysMap: WorkdayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
		const dayOfWeek = daysMap[dateObj.getDay()];

		const schedule = site.workday_schedule_json as WorkdaySchedule | null;
		if (schedule && schedule[dayOfWeek]) {
			const dayInfo = schedule[dayOfWeek];
			if (dayInfo.active && dayInfo.start && dayInfo.end) {
				const scheduleMinutes = timeToMinutes(dayInfo.end) - timeToMinutes(dayInfo.start);
				if (scheduleMinutes > 0) {
					standardHours = scheduleMinutes / 60;
					scheduledStart = dayInfo.start;
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
			scheduledStart,
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
