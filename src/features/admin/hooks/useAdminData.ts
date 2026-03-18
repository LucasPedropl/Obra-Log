import { useState, useEffect } from 'react';

export interface Company {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://obra-log.onrender.com';

export function useAdminData() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/companies`);
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
