'use client';

import React from 'react';
import { usePermissions, PermissionActions } from '@/context/PermissionsContext';

interface CanProps {
	/** O recurso a ser verificado (ex: 'insumos', 'obras', 'usuarios') */
	on: string;
	/** A ação a ser verificada */
	perform: keyof PermissionActions;
	/** Conteúdo a ser exibido caso tenha permissão */
	children: React.ReactNode;
	/** Conteúdo opcional a ser exibido caso NÃO tenha permissão */
	fallback?: React.ReactNode;
}

/**
 * Componente utilitário para renderização condicional baseada em permissões.
 * 
 * Exemplo de uso:
 * <Can perform="create" on="insumos">
 *   <Button>Novo Insumo</Button>
 * </Can>
 */
export function Can({ on, perform, children, fallback = null }: CanProps) {
	const { can, loading } = usePermissions();

	if (loading) return null;

	if (can(on, perform)) {
		return <>{children}</>;
	}

	return <>{fallback}</>;
}
