'use client';

import React from 'react';
import * as Icons from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export type IconName = keyof typeof Icons;

interface IconProps extends React.ComponentPropsWithoutRef<'svg'> {
	name: string;
	size?: number;
	weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
	className?: string;
}

/**
 * Componente unificado para exibição de ícones do Phosphor Icons.
 * Utiliza o mapeamento de nomes para carregar o ícone correto.
 */
export const Icon = ({
	name,
	size = 20,
	weight = 'regular',
	className,
	...props
}: IconProps) => {
	// Tenta encontrar o ícone pelo nome (PascalCase ou kebab-case)
	const iconKey = name
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('') as IconName;

	const IconComponent = (Icons[iconKey] as React.ElementType) || Icons.Question;

	return (
		<IconComponent
			size={size}
			weight={weight}
			className={cn('shrink-0', className)}
			{...props}
		/>
	);
};
