import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { ActiveObraProvider } from '@/context/ActiveObraContext';
import { ConfirmProvider } from '@/components/shared/ConfirmDialog';
import { PermissionsProvider } from '@/context/PermissionsContext';
import { TenantProvider } from '@/context/TenantContext';

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const cookieStore = await cookies();
	const initialCompanyId =
		cookieStore.get('selectedCompanyId')?.value ?? null;

	// Sem empresa selecionada não há contexto válido para as telas internas.
	// Redireciona para a seleção de empresa em vez de exibir erros parciais.
	if (!initialCompanyId) {
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
