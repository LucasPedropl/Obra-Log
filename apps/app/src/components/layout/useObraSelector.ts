'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/config/supabase';
import {
	useActiveObra,
	type ObraSelectorTarget,
} from '@/context/ActiveObraContext';
import { useTenant } from '@/context/TenantContext';

interface UseObraSelectorOptions {
	target: ObraSelectorTarget;
	onMobileClose?: () => void;
}

export function useObraSelector({ target, onMobileClose }: UseObraSelectorOptions) {
	const router = useRouter();
	const supabase = createClient();
	const {
		selectedObraId,
		selectedObraName,
		setSelectedObraId,
		setSelectedObraName,
		obraSelectorOpenSignal,
	} = useActiveObra();
	const { companyId: tenantCompanyId } = useTenant();

	const [obras, setObras] = useState<{ id: string; name: string }[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const displayName = selectedObraName ?? 'Selecione uma obra';
	const initials = selectedObraName
		? selectedObraName
				.split(' ')
				.map((n) => n[0])
				.join('')
				.substring(0, 2)
				.toUpperCase()
		: 'OB';

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	useEffect(() => {
		const { target: signalTarget } = obraSelectorOpenSignal;
		const shouldOpen =
			signalTarget === 'any' || signalTarget === target;
		if (shouldOpen && obraSelectorOpenSignal.count > 0) {
			setIsOpen(true);
		}
	}, [obraSelectorOpenSignal, target]);

	useEffect(() => {
		const loadObras = async () => {
			const companyId =
				tenantCompanyId ??
				document.cookie.match(/(^| )selectedCompanyId=([^;]+)/)?.[2] ??
				null;
			if (!companyId) return;

			const { data: dbObras } = await supabase
				.from('construction_sites')
				.select('id, name')
				.eq('company_id', companyId);

			if (!dbObras) return;
			setObras(dbObras);

			if (selectedObraId) {
				const current = dbObras.find((o) => o.id === selectedObraId);
				if (current) setSelectedObraName(current.name);
			}
		};
		loadObras();
	}, [selectedObraId, setSelectedObraName, tenantCompanyId]);

	const handleSelectObra = (obra: { id: string; name: string }, navigate = true) => {
		setSelectedObraId(obra.id);
		setSelectedObraName(obra.name);
		setIsOpen(false);
		onMobileClose?.();
		if (navigate) router.push(`/obras/${obra.id}/visao-geral`);
	};

	return {
		obras,
		isOpen,
		setIsOpen,
		dropdownRef,
		displayName,
		initials,
		selectedObraId,
		handleSelectObra,
		router,
	};
}
