'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const WARNING_TITLE =
	'Horários incompletos: preencha entrada, saída de almoço, volta do almoço e saída para calcular a diária.';

interface IncompleteHoursWarningProps {
	/** Compact badge for tight grid cells. */
	compact?: boolean;
	className?: string;
}

/** Amber alert when a PRESENT day has 1–3 of 4 clock times filled. */
export function IncompleteHoursWarning({
	compact = false,
	className,
}: IncompleteHoursWarningProps) {
	if (compact) {
		return (
			<span
				title={WARNING_TITLE}
				className={cn(
					'inline-flex items-center justify-center gap-0.5 rounded-md border border-amber-300 bg-amber-50 px-1 py-0.5 text-[10px] font-bold leading-none text-amber-800',
					className,
				)}
			>
				<AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
				!
			</span>
		);
	}

	return (
		<div
			role="status"
			title={WARNING_TITLE}
			className={cn(
				'flex items-start gap-1.5 rounded-[5px] border border-amber-300 bg-amber-50 px-2 py-1.5 text-[11px] font-medium leading-snug text-amber-900',
				className,
			)}
		>
			<AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
			<span>Horários incompletos — preencha as 4 horas do dia.</span>
		</div>
	);
}
