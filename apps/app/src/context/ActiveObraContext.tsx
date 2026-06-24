'use client';

import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { usePathname } from 'next/navigation';
import { setSelectedObraAction } from '@/app/actions/tenantActions';

export type ObraSelectorTarget = 'sidebar' | 'header' | 'any';

interface ObraSelectorOpenSignal {
	count: number;
	target: ObraSelectorTarget;
}

interface ActiveObraContextData {
	selectedObraId: string | null;
	setSelectedObraId: (id: string | null) => void;
	selectedObraName: string | null;
	setSelectedObraName: (name: string | null) => void;
	obraSelectorOpenSignal: ObraSelectorOpenSignal;
	requestOpenObraSelector: (target?: ObraSelectorTarget) => void;
}

const ActiveObraContext = createContext<ActiveObraContextData>({
	selectedObraId: null,
	setSelectedObraId: () => {},
	selectedObraName: null,
	setSelectedObraName: () => {},
	obraSelectorOpenSignal: { count: 0, target: 'any' },
	requestOpenObraSelector: () => {},
});

export function ActiveObraProvider({
	children,
	initialObraId = null,
}: {
	children: React.ReactNode;
	initialObraId?: string | null;
}) {
	const pathname = usePathname();
	const [selectedObraId, setSelectedObraIdState] = useState<string | null>(
		initialObraId,
	);
	const [selectedObraName, setSelectedObraName] = useState<string | null>(null);
	const [obraSelectorOpenSignal, setObraSelectorOpenSignal] =
		useState<ObraSelectorOpenSignal>({ count: 0, target: 'any' });

	const obraRouteMatch = pathname?.match(/^\/obras\/([^/]+)(?:\/|$)/);
	const urlObraId = obraRouteMatch ? obraRouteMatch[1] : null;

	useEffect(() => {
		if (urlObraId) {
			setSelectedObraIdState(urlObraId);
			void setSelectedObraAction(urlObraId).then((result) => {
				if (!result.success) {
					console.error('setSelectedObraAction:', result.error);
				}
			});
		}
	}, [urlObraId]);

	const setSelectedObraId = useCallback((id: string | null) => {
		setSelectedObraIdState(id);
		void setSelectedObraAction(id).then((result) => {
			if (!result.success) {
				console.error('setSelectedObraAction:', result.error);
			}
		});
		if (!id) setSelectedObraName(null);
	}, []);

	const requestOpenObraSelector = useCallback(
		(target: ObraSelectorTarget = 'any') => {
			setObraSelectorOpenSignal((prev) => ({
				count: prev.count + 1,
				target,
			}));
		},
		[],
	);

	const value = useMemo(
		() => ({
			selectedObraId: urlObraId ?? selectedObraId,
			setSelectedObraId,
			selectedObraName,
			setSelectedObraName,
			obraSelectorOpenSignal,
			requestOpenObraSelector,
		}),
		[
			urlObraId,
			selectedObraId,
			setSelectedObraId,
			selectedObraName,
			obraSelectorOpenSignal,
			requestOpenObraSelector,
		],
	);

	return (
		<ActiveObraContext.Provider value={value}>
			{children}
		</ActiveObraContext.Provider>
	);
}

export function useActiveObra() {
	return useContext(ActiveObraContext);
}
