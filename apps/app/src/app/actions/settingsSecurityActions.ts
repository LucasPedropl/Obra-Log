'use server';

import { z } from 'zod';
import { createServerSupabaseClient } from '@/config/supabaseServer';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { getAuthenticatedUserId } from './_helpers';

const changePasswordSchema = z.object({
	currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
	newPassword: z.string().min(8, 'Nova senha deve ter no mínimo 8 caracteres'),
});

type ActionResult<T = undefined> =
	| { success: true; data?: T }
	| { success: false; error: string };

/** Changes password after verifying the current one. */
export async function changePasswordAction(
	input: z.infer<typeof changePasswordSchema>,
): Promise<ActionResult> {
	try {
		const data = changePasswordSchema.parse(input);
		const supabase = await createServerSupabaseClient();
		await getAuthenticatedUserId();

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user?.email) {
			throw new Error('Usuário sem e-mail cadastrado');
		}

		const { error: verifyError } = await supabase.auth.signInWithPassword({
			email: user.email,
			password: data.currentPassword,
		});

		if (verifyError) {
			throw new Error('Senha atual incorreta');
		}

		const { error } = await supabase.auth.updateUser({
			password: data.newPassword,
		});

		if (error) throw new Error(error.message);

		return { success: true };
	} catch (error: unknown) {
		console.error('changePasswordAction:', error);
		const message =
			error instanceof z.ZodError
				? error.issues[0]?.message ?? 'Dados inválidos'
				: error instanceof Error
					? error.message
					: 'Erro ao alterar senha';
		return { success: false, error: message };
	}
}

/** Registers an account deletion request (LGPD Art. 18). */
export async function requestAccountDeletionAction(): Promise<ActionResult> {
	try {
		const userId = await getAuthenticatedUserId();

		const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
			user_metadata: {
				deletion_requested_at: new Date().toISOString(),
			},
		});

		if (error) throw new Error(error.message);

		return { success: true };
	} catch (error: unknown) {
		console.error('requestAccountDeletionAction:', error);
		const message =
			error instanceof Error
				? error.message
				: 'Erro ao solicitar exclusão da conta';
		return { success: false, error: message };
	}
}
