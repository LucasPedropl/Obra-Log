'use server';

import { z } from 'zod';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import {
	assertInventoryBelongsToSite,
	assertSiteAccess,
	getAuthenticatedUserId,
} from './_helpers';
import { safeLogError } from '@/lib/safeLog';

const createToolLoanSchema = z.object({
	siteId: z.string().uuid(),
	inventoryId: z.string().uuid(),
	collaboratorId: z.string().uuid(),
	quantity: z.number().int().positive(),
	loanDate: z.string().min(1),
	observation: z.string().nullable().optional(),
	availableQuantity: z.number().int().nonnegative(),
});

const returnToolLoanSchema = z.object({
	loanId: z.string().uuid(),
	siteId: z.string().uuid(),
	returnDate: z.string().min(1),
	observation: z.string().nullable().optional(),
});

type ActionResult = { success: true } | { success: false; error: string };

/** Registers a tool loan for a collaborator at a site. */
export async function createToolLoanAction(
	input: z.infer<typeof createToolLoanSchema>,
): Promise<ActionResult> {
	try {
		const data = createToolLoanSchema.parse(input);
		const userId = await getAuthenticatedUserId();
		await assertSiteAccess(userId, data.siteId);

		if (data.quantity > data.availableQuantity) {
			throw new Error(
				`Quantidade máxima disponível é ${data.availableQuantity}.`,
			);
		}

		await assertInventoryBelongsToSite(data.inventoryId, data.siteId);

		const { error } = await supabaseAdmin.from('tool_loans').insert({
			site_id: data.siteId,
			inventory_id: data.inventoryId,
			collaborator_id: data.collaboratorId,
			quantity: data.quantity,
			loan_date: new Date(data.loanDate).toISOString(),
			notes_on_loan: data.observation || null,
			status: 'OPEN',
		});

		if (error) throw new Error(error.message);

		return { success: true };
	} catch (error: unknown) {
		console.error('createToolLoanAction:', error);
		const message =
			error instanceof z.ZodError
				? error.issues[0]?.message ?? 'Dados inválidos'
				: error instanceof Error
					? error.message
					: 'Erro ao realizar o empréstimo';
		return { success: false, error: message };
	}
}

/** Marks a tool loan as returned. */
export async function returnToolLoanAction(
	input: z.infer<typeof returnToolLoanSchema>,
): Promise<ActionResult> {
	try {
		const data = returnToolLoanSchema.parse(input);
		const userId = await getAuthenticatedUserId();
		await assertSiteAccess(userId, data.siteId);

		const { data: loan, error: fetchError } = await supabaseAdmin
			.from('tool_loans')
			.select('id, site_id, status')
			.eq('id', data.loanId)
			.maybeSingle();

		if (fetchError) throw new Error(fetchError.message);
		if (!loan || loan.site_id !== data.siteId) {
			throw new Error('Empréstimo não encontrado');
		}
		if (loan.status === 'RETURNED') {
			throw new Error('Este empréstimo já foi devolvido');
		}

		const { error } = await supabaseAdmin
			.from('tool_loans')
			.update({
				returned_date: new Date(data.returnDate).toISOString(),
				notes_on_return: data.observation || null,
				status: 'RETURNED',
			})
			.eq('id', data.loanId);

		if (error) throw new Error(error.message);

		return { success: true };
	} catch (error: unknown) {
		console.error('returnToolLoanAction:', error);
		const message =
			error instanceof z.ZodError
				? error.issues[0]?.message ?? 'Dados inválidos'
				: error instanceof Error
					? error.message
					: 'Erro ao realizar a devolução';
		return { success: false, error: message };
	}
}
