import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { ActiveObraProvider } from '@/context/ActiveObraContext';
import { ConfirmProvider } from '@/components/shared/ConfirmDialog';
import { PermissionsProvider } from '@/context/PermissionsContext';
import { TenantProvider } from '@/context/TenantContext';
import { createServerSupabaseClient } from '@/config/supabaseServer';
import { supabaseAdmin } from '@/config/supabaseAdmin';

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// Defesa em profundidade: o proxy já barra não-autenticados, mas o layout
	// também é alcançável via cache/prefetch do router.
	const supabase = await createServerSupabaseClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect('/auth/login');
	}

	const cookieStore = await cookies();
	const initialCompanyId =
		cookieStore.get('selectedCompanyId')?.value ?? null;

	// Sem empresa selecionada não há contexto válido para as telas internas.
	// Redireciona para a seleção de empresa em vez de exibir erros parciais.
	if (!initialCompanyId) {
		redirect('/empresas');
	}

	// O cookie pode apontar para uma empresa da qual o usuário não é mais
	// membro (troca de conta, remoção, reset do banco). Sem esta validação,
	// toda server action falha em cascata com "Sem acesso a esta empresa".
	const { data: member } = await supabaseAdmin
		.from('company_users')
		.select('company_id')
		.eq('user_id', user.id)
		.eq('company_id', initialCompanyId)
		.maybeSingle();

	if (!member) {
		redirect('/empresas');
	}

	const initialObraId = cookieStore.get('selectedObraId')?.value ?? null;

	return (
		<TenantProvider initialCompanyId={initialCompanyId}>
			<PermissionsProvider initialCompanyId={initialCompanyId}>
				<ActiveObraProvider initialObraId={initialObraId}>
					<ConfirmProvider>
						<AppLayout>{children}</AppLayout>
					</ConfirmProvider>
				</ActiveObraProvider>
			</PermissionsProvider>
		</TenantProvider>
	);
}
