import React from 'react';
import { cn } from '../lib/utils';

interface MaterialIconProps extends React.HTMLAttributes<HTMLSpanElement> {
	icon: string;
	size?: number;
	fill?: boolean;
	weight?: number;
	grade?: number;
	opticalSize?: number;
	className?: string;
}

/**
 * Componente para exibição de ícones do Material Symbols Rounded.
 * Requer que a fonte seja carregada no layout principal do projeto.
 */
export const MaterialIcon = ({
	icon,
	size = 24,
	fill = false,
	weight = 400,
	grade = 0,
	opticalSize = 24,
	className,
	...props
}: MaterialIconProps) => {
	return (
		<span
			className={cn(
				'material-symbols-rounded select-none flex items-center justify-center shrink-0',
				className
			)}
			style={{
				fontSize: `${size}px`,
				fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`,
				width: `${size}px`,
				height: `${size}px`,
			}}
			{...props}
		>
			{icon}
		</span>
	);
};
