'use client';

import React from 'react';
import {
	usePermissions,
	PermissionActions,
} from '@/context/PermissionsContext';

interface CanProps {
	resource: string;
	action: keyof PermissionActions;
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

export function Can({ resource, action, children, fallback = null }: CanProps) {
	const { can, loading } = usePermissions();

	if (loading) {
		// Mostrar skeleton/loader caso seja interessante
		// ou apenas null pra evitar flickers bruscos demais
		return null;
	}

	if (!can(resource, action)) {
		return <>{fallback}</>;
	}

	return <>{children}</>;
}
