'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePermissions } from '@/context/PermissionsContext';
import { Loader2 } from 'lucide-react';

interface ObraProtectedRouteProps {
	children: React.ReactNode;
}

/**
 * Protege rotas /obras/[id]/* verificando permissão de obras e escopo por obra.
 */
export function ObraProtectedRoute({ children }: ObraProtectedRouteProps) {
	const { can, canAccessSite, loading } = usePermissions();
	const router = useRouter();
	const params = useParams();
	const siteId = typeof params?.id === 'string' ? params.id : '';

	const hasObraPermission = can('obras', 'view');
	const hasSiteAccess = canAccessSite(siteId);
	const isAllowed = hasObraPermission && hasSiteAccess;

	useEffect(() => {
		if (!loading && !isAllowed) {
			router.push('/unauthorized');
		}
	}, [loading, isAllowed, router]);

	if (loading) {
		return (
			<div className="flex h-full w-full items-center justify-center p-12">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
			</div>
		);
	}

	if (!isAllowed) {
		return null;
	}

	return <>{children}</>;
}
