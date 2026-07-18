'use server';

import { z } from 'zod';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { safeLogError } from '@/lib/safeLog';
import { assertSiteAccess, getAuthenticatedUserId } from './_helpers';
import {
	normalizeWorkdaySchedule,
	type WorkdaySchedule,
	type WorkdayKey,
	timeToMinutes,
	computeDayFraction,
	hasPartialClockTimes,
} from '@/features/ponto/lib/workdaySchedule';
import type { AttendanceStatus } from '@/features/ponto/schemas/attendanceSchema';

const siteIdSchema = z.string().uuid('ID da obra inválido');
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida');

function formatZodError(error: unknown): never {
	if (error instanceof z.ZodError) {
		throw new Error(error.issues[0]?.message ?? 'Dados inválidos');
	}
	throw error;
}

export interface ReportCollaborator {
	id: string;
	name: string;
	role_title: string;
	cpf: string | null;
	daily_rate: number | null;
	cellphone: string | null;
	bank_name: string | null;
	pix_key: string | null;
	pix_key_type: string | null;
}

export interface ReportAttendance {
	collaborator_id: string;
	work_date: string;
	status: string;
	day_fraction: number;
	/** PRESENT with 1–3 of 4 clock times filled — do not treat as a valid diária. */
	has_incomplete_times?: boolean;
}

interface RawSiteCollaborator {
	collaborator_id: string;
	collaborators: {
		id: string;
		name: string | null;
		role_title: string | null;
		cpf: string | null;
		daily_rate: number | null;
		cellphone: string | null;
		bank_name: string | null;
		pix_key: string | null;
		pix_key_type: string | null;
	} | null;
}

/**
 * Returns data for fortnightly frequency/payment reports: collaborators,
 * attendance and the site workday schedule (for Folga Programada defaults).
 */
export async function getFrequencyReportData(
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

		const [
			{ data: colabRows, error: colabError },
			{ data: records, error: recError },
			{ data: site, error: siteError },
		] = await Promise.all([
			supabaseAdmin
				.from('site_collaborators')
				.select(
					'collaborator_id, collaborators(id, name, role_title, cpf, daily_rate, cellphone, bank_name, pix_key, pix_key_type)',
				)
				.eq('site_id', parsedSiteId),
			supabaseAdmin
				.from('attendance_records')
				.select('collaborator_id, work_date, status, day_fraction, clock_in, clock_out, lunch_start, lunch_end')
				.eq('site_id', parsedSiteId)
				.gte('work_date', start)
				.lte('work_date', end),
			supabaseAdmin
				.from('construction_sites')
				.select('workday_schedule_json, tolerance_minutes')
				.eq('id', parsedSiteId)
				.single(),
		]);

		if (colabError) throw colabError;
		if (recError) throw recError;
		if (siteError) throw siteError;

		const schedule = normalizeWorkdaySchedule(site?.workday_schedule_json);
		const tolerance = Number(site?.tolerance_minutes ?? 0);

		const mappedRecords: ReportAttendance[] = ((records as any[]) || []).map((rec) => {
			if (rec.status !== 'PRESENT') {
				return {
					collaborator_id: rec.collaborator_id,
					work_date: rec.work_date,
					status: rec.status,
					day_fraction: rec.day_fraction,
					has_incomplete_times: false,
				};
			}

			const incomplete = hasPartialClockTimes(
				rec.clock_in,
				rec.clock_out,
				rec.lunch_start,
				rec.lunch_end,
			);

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
				collaborator_id: rec.collaborator_id,
				work_date: rec.work_date,
				status: rec.status,
				day_fraction: recalculatedFraction,
				has_incomplete_times: incomplete,
			};
		});

		const collaborators: ReportCollaborator[] = (
			(colabRows as unknown as RawSiteCollaborator[]) || []
		)
			.filter((row) => row.collaborators)
			.map((row) => ({
				id: row.collaborators!.id,
				name: row.collaborators!.name || 'Sem nome',
				role_title: row.collaborators!.role_title || 'Sem função',
				cpf: row.collaborators!.cpf,
				daily_rate:
					row.collaborators!.daily_rate != null
						? Number(row.collaborators!.daily_rate)
						: null,
				cellphone: row.collaborators!.cellphone,
				bank_name: row.collaborators!.bank_name,
				pix_key: row.collaborators!.pix_key,
				pix_key_type: row.collaborators!.pix_key_type,
			}))
			.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

		return {
			collaborators,
			records: mappedRecords,
			workdaySchedule: schedule,
		};
	} catch (error: unknown) {
		safeLogError('getFrequencyReportData', error);
		formatZodError(error);
	}
}
