import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';

export interface Company {
	id: string;
	name: string;
	active: boolean;
	created_at: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';

export function useAdminData() {
	const [companies, setCompanies] = useState<Company[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchCompanies = async () => {
		setLoading(true);
		try {
			const { data: sessionData } = await supabase.auth.getSession();
			const token = sessionData?.session?.access_token;
			const res = await fetch(`${API_URL}/api/admin/companies`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			if (!res.ok) throw new Error('Falha ao buscar empresas');
			const data = await res.json();
			setCompanies(data);
		} catch (error) {
			console.error('Erro ao buscar empresas:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCompanies();
	}, []);

	return { companies, loading, refetchCompanies: fetchCompanies };
}
