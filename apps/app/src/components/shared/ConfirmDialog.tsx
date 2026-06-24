'use client';

import React, {
	createContext,
	useCallback,
	useContext,
	useRef,
	useState,
} from 'react';
import { Button } from '@/components/ui/button';

interface ConfirmOptions {
	title?: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: 'default' | 'destructive';
}

interface ConfirmContextValue {
	confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
	const [open, setOpen] = useState(false);
	const [options, setOptions] = useState<ConfirmOptions | null>(null);
	const resolveRef = useRef<((value: boolean) => void) | null>(null);

	const confirm = useCallback((opts: ConfirmOptions) => {
		setOptions(opts);
		setOpen(true);
		return new Promise<boolean>((resolve) => {
			resolveRef.current = resolve;
		});
	}, []);

	const handleClose = (result: boolean) => {
		setOpen(false);
		resolveRef.current?.(result);
		resolveRef.current = null;
	};

	return (
		<ConfirmContext.Provider value={{ confirm }}>
			{children}
			{open && options && (
				<div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
					<div
						className="bg-white border border-gray-200 w-full max-w-md p-6 shadow-lg"
						role="dialog"
						aria-modal="true"
					>
						{options.title && (
							<h2 className="text-lg font-bold text-gray-900 mb-2">
								{options.title}
							</h2>
						)}
						<p className="text-sm text-gray-600 mb-6">{options.description}</p>
						<div className="flex justify-end gap-3">
							<Button
								variant="outline"
								onClick={() => handleClose(false)}
							>
								{options.cancelLabel ?? 'Cancelar'}
							</Button>
							<Button
								variant="default"
								className={
									options.variant === 'destructive'
										? 'bg-red-600 hover:bg-red-700 text-white'
										: undefined
								}
								onClick={() => handleClose(true)}
							>
								{options.confirmLabel ?? 'Confirmar'}
							</Button>
						</div>
					</div>
				</div>
			)}
		</ConfirmContext.Provider>
	);
}

export function useConfirm() {
	const ctx = useContext(ConfirmContext);
	if (!ctx) {
		throw new Error('useConfirm must be used within ConfirmProvider');
	}
	return ctx.confirm;
}
