'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/config/supabaseServer';
import { safeLogError } from '@/lib/safeLog';
import { loginSchema } from '@/features/auth/schemas/loginSchema';
import { getUserCompaniesAction } from './authData';

type LoginResult = { success: false; error: string };

export async function loginAction(
	formData: z.infer<typeof loginSchema>,
): Promise<LoginResult | void> {
	let email: string;
	let password: string;

	try {
		const parsed = loginSchema.parse(formData);
		email = parsed.email;
		password = parsed.password;
	} catch (error: unknown) {
		safeLogError('loginAction', error);
		const message =
			error instanceof z.ZodError
				? (error.issues[0]?.message ?? 'Dados inválidos')
				: 'Dados inválidos';
		return { success: false, error: message };
	}

	const supabase = await createServerSupabaseClient();
	const cookieStore = await cookies();

	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) {
		safeLogError('loginAction', error);
		return { success: false, error: error.message };
	}

	const user = data.user;

	if (user.user_metadata?.require_password_change) {
		redirect('/empresas');
	}

	const result = await getUserCompaniesAction();

	if (result.success && result.companies && result.companies.length === 1) {
		const company = result.companies[0];

		if (company.status === 'ACTIVE') {
      cookieStore.set('selectedCompanyId', company.id, {
        path: '/',
        maxAge: 86400,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

			redirect('/dashboard');
		}
	}

	redirect('/empresas');
}
