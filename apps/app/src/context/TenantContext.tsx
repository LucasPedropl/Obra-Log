'use client';

import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { setCachedCompanyId } from '@/lib/utils';

interface TenantContextData {
	companyId: string | null;
	setCompanyId: (id: string | null) => void;
}

const TenantContext = createContext<TenantContextData>({
	companyId: null,
	setCompanyId: () => {},
});

export function TenantProvider({
	children,
	initialCompanyId = null,
}: {
	children: React.ReactNode;
	initialCompanyId?: string | null;
}) {
	const [companyId, setCompanyIdState] = useState<string | null>(
		initialCompanyId,
	);

	useEffect(() => {
		setCachedCompanyId(initialCompanyId);
	}, [initialCompanyId]);

	const setCompanyId = useCallback((id: string | null) => {
		setCompanyIdState(id);
		setCachedCompanyId(id);
	}, []);

	const value = useMemo(
		() => ({ companyId, setCompanyId }),
		[companyId, setCompanyId],
	);

	return (
		<TenantContext.Provider value={value}>{children}</TenantContext.Provider>
	);
}

export function useTenant() {
	return useContext(TenantContext);
}
