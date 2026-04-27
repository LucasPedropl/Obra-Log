'use client';

import React, {
	useEffect,
	useState,
	createContext,
	useContext,
	MouseEvent,
} from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
	id: string;
	message: string;
	type: ToastType;
}

interface ToastContextType {
	addToast: (message: string, type: ToastType) => void;
	removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
	const [toasts, setToasts] = useState<ToastOptions[]>([]);

	const addToast = (message: string, type: ToastType) => {
		const id = Math.random().toString(36).substring(2, 9);
		setToasts((prev) => [...prev, { id, message, type }]);
	};

	const removeToast = (id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	};

	return (
		<ToastContext.Provider value={{ addToast, removeToast }}>
			{children}
			<div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
				{toasts.map((toast) => (
					<ToastItem
						key={toast.id}
						toast={toast}
						removeToast={removeToast}
					/>
				))}
			</div>
		</ToastContext.Provider>
	);
};

export const useToast = () => {
	const context = useContext(ToastContext);
	if (!context)
		throw new Error('useToast must be used within a ToastProvider');
	return context;
};

const ToastItem = ({
	toast,
	removeToast,
}: {
	toast: ToastOptions;
	removeToast: (id: string) => void;
}) => {
	const [progress, setProgress] = useState(0);
	const [isPaused, setIsPaused] = useState(false);

	useEffect(() => {
		if (progress >= 100) {
			removeToast(toast.id);
		}
	}, [progress, removeToast, toast.id]);

	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (!isPaused) {
			interval = setInterval(() => {
				setProgress((prev) => {
					if (prev >= 100) {
						clearInterval(interval);
						return 100;
					}
					// Increase by 1% roughly every 40ms -> Total time ~ 4 seconds
					return prev + 1;
				});
			}, 40);
		}
		return () => clearInterval(interval);
	}, [isPaused]);

	const bgColor = {
		success: 'bg-emerald-600',
		error: 'bg-red-600',
		warning: 'bg-yellow-500 text-black',
		info: 'bg-blue-600',
	}[toast.type];

	const Icon = {
		success: <CheckCircle className="w-5 h-5 flex-shrink-0" />,
		error: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
		warning: <AlertTriangle className="w-5 h-5 flex-shrink-0" />,
		info: <Info className="w-5 h-5 flex-shrink-0" />,
	}[toast.type];

	const handleContextMenu = (e: MouseEvent) => {
		e.preventDefault();
		removeToast(toast.id);
	};

	return (
		<div
			onMouseEnter={() => setIsPaused(true)}
			onMouseLeave={() => setIsPaused(false)}
			onContextMenu={handleContextMenu}
			className={cn(
				'relative overflow-hidden rounded-lg shadow-2xl pointer-events-auto flex min-w-[300px] max-w-[400px] items-center gap-3 p-4 text-white animate-in slide-in-from-bottom-5 fade-in-0',
				bgColor,
			)}
		>
			{Icon}
			<div className="z-10 flex-1 text-sm font-medium leading-snug break-words">
				{toast.message}
			</div>
			<button
				onClick={() => removeToast(toast.id)}
				className="opacity-70 hover:opacity-100 transition-opacity z-10"
			>
				<X className="w-4 h-4" />
			</button>

			<div
				className="absolute bottom-0 left-0 h-1 bg-white/40 transition-all ease-linear z-0"
				style={{ width: `${progress}%` }}
			/>
		</div>
	);
};
