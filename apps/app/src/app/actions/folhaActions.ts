'use server';

import { z } from 'zod';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { safeLogError } from '@/lib/safeLog';
import { assertSiteAccess, getAuthenticatedUserId } from './_helpers';
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
				.select('collaborator_id, work_date, status, day_fraction')
				.eq('site_id', parsedSiteId)
				.gte('work_date', start)
				.lte('work_date', end),
			supabaseAdmin
				.from('construction_sites')
				.select('workday_schedule_json')
				.eq('id', parsedSiteId)
				.single(),
		]);

		if (colabError) throw colabError;
		if (recError) throw recError;
		if (siteError) throw siteError;

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
			records: (records as ReportAttendance[]) || [],
			workdaySchedule: normalizeWorkdaySchedule(site?.workday_schedule_json),
		};
	} catch (error: unknown) {
		safeLogError('getFrequencyReportData', error);
		formatZodError(error);
	}
}
