'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/context/PermissionsContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
	/** O recurso a ser verificado (ex: 'insumos', 'obras') */
	resource: string;
	/** A ação necessária (default: 'view') */
	action?: 'view' | 'create' | 'edit' | 'delete';
	/** O conteúdo da página */
	children: React.ReactNode;
}

/**
 * Wrapper para proteger páginas inteiras baseado em permissões.
 * Se o usuário não tiver acesso, será redirecionado para /unauthorized.
 */
export function ProtectedRoute({ 
	resource, 
	action = 'view', 
	children 
}: ProtectedRouteProps) {
	const { can, loading } = usePermissions();
	const router = useRouter();

	useEffect(() => {
		if (!loading && !can(resource, action)) {
			router.push('/unauthorized');
		}
	}, [loading, can, resource, action, router]);

	if (loading) {
		return (
			<div className="flex h-full w-full items-center justify-center p-12">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
			</div>
		);
	}

	if (!can(resource, action)) {
		return null; // O useEffect cuidará do redirecionamento
	}

	return <>{children}</>;
}
