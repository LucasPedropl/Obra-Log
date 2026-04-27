import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PermissionsProvider } from '@/context/PermissionsContext';

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<PermissionsProvider>
			<AppLayout>{children}</AppLayout>
		</PermissionsProvider>
	);
}
