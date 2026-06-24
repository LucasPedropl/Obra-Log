'use server';

import { z } from 'zod';
import { createServerSupabaseClient } from '@/config/supabaseServer';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { safeLogError } from '@/lib/safeLog';
import {
	assertCompanyResourcePermission,
	getAuthenticatedUserId,
	getValidatedCompanyId,
} from './_helpers';

const collaboratorIdSchema = z.string().uuid();

type ActionResult<T = undefined> =
	| { success: true; data?: T }
	| { success: false; error: string };

export async function getCollaboratorsAdmin(company_id: string) {
	const supabase = await createServerSupabaseClient();
	const { data, error } = await supabase
		.from('collaborators')
		.select('*')
		.eq('company_id', company_id)
		.order('name', { ascending: true });
	if (error) throw error;
	return data;
}

export async function createCollaboratorAdmin(data: Record<string, unknown>) {
	const supabase = await createServerSupabaseClient();
	const { data: result, error } = await supabase
		.from('collaborators')
		.insert([data])
		.select()
		.single();
	if (error) throw error;
	return result;
}

export async function updateCollaboratorAdmin(
	id: string,
	data: Record<string, unknown>,
) {
	const supabase = await createServerSupabaseClient();
	const { data: result, error } = await supabase
		.from('collaborators')
		.update(data)
		.eq('id', id)
		.select()
		.single();
	if (error) throw error;
	return result;
}

export async function deleteCollaboratorAdmin(id: string, company_id: string) {
	const supabase = await createServerSupabaseClient();
	const { error } = await supabase
		.from('collaborators')
		.delete()
		.eq('id', id)
		.eq('company_id', company_id);
	if (error) throw error;
	return true;
}

export async function importCollaboratorsAdmin(
	items: Record<string, unknown>[],
) {
	const supabase = await createServerSupabaseClient();
	if (!items.length) return { success: true };
	const { data, error } = await supabase
		.from('collaborators')
		.insert(items)
		.select();
	if (error) throw error;
	return { success: true, data };
}

/** LGPD Art. 18 — exports all personal data for a collaborator. */
export async function exportCollaboratorDataAction(
	collaboratorId: string,
): Promise<ActionResult<Record<string, unknown>>> {
	try {
		const parsedId = collaboratorIdSchema.parse(collaboratorId);
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId);

		await assertCompanyResourcePermission(
			userId,
			companyId,
			'colaboradores',
			'view',
		);

		const { data, error } = await supabaseAdmin
			.from('collaborators')
			.select('*')
			.eq('id', parsedId)
			.eq('company_id', companyId)
			.maybeSingle();

		if (error) throw new Error(error.message);
		if (!data) throw new Error('Colaborador não encontrado');

		return { success: true, data };
	} catch (error: unknown) {
		safeLogError('exportCollaboratorDataAction', error);
		const message =
			error instanceof z.ZodError
				? 'ID de colaborador inválido'
				: error instanceof Error
					? error.message
					: 'Erro ao exportar dados';
		return { success: false, error: message };
	}
}

/** LGPD Art. 18 — anonymizes collaborator personal data in-place. */
export async function anonymizeCollaboratorAction(
	collaboratorId: string,
): Promise<ActionResult> {
	try {
		const parsedId = collaboratorIdSchema.parse(collaboratorId);
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId);

		await assertCompanyResourcePermission(
			userId,
			companyId,
			'colaboradores',
			'delete',
		);

		const { error } = await supabaseAdmin
			.from('collaborators')
			.update({
				name: 'Titular Anonimizado',
				cpf: null,
				rg: null,
				email: null,
				phone: null,
				cellphone: null,
				birth_date: null,
				cep: null,
				street: null,
				number: null,
				neighborhood: null,
				complement: null,
				city: null,
				state: null,
				documents_json: [],
				status: 'ANONYMIZED',
			})
			.eq('id', parsedId)
			.eq('company_id', companyId);

		if (error) throw new Error(error.message);

		return { success: true };
	} catch (error: unknown) {
		safeLogError('anonymizeCollaboratorAction', error);
		const message =
			error instanceof z.ZodError
				? 'ID de colaborador inválido'
				: error instanceof Error
					? error.message
					: 'Erro ao anonimizar colaborador';
		return { success: false, error: message };
	}
}
