import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader2, LogOut } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { authService } from '../../features/auth/services/auth.service';

export default function SelectCompany() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('company_users')
        .select(`
          company_id,
          companies (
            id,
            name,
            active
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Filter out inactive companies or nulls
      const validCompanies = (data
        ?.map(cu => cu.companies as any)
        .filter(c => c && c.active) || []) as any[];

      if (validCompanies.length === 0) {
        throw new Error('Você não está vinculado a nenhuma empresa ativa.');
      }

      if (validCompanies.length === 1) {
        // Automatically select if only one
        handleSelect(validCompanies[0].id);
      } else {
        setCompanies(validCompanies);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (companyId: string) => {
    localStorage.setItem('selectedCompanyId', companyId);
    navigate('/app/dashboard');
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/app/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
            <Building2 size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Selecione a Empresa</h1>
          <p className="text-slate-500 text-sm mt-1 text-center">
            Você está vinculado a mais de uma empresa. Escolha qual deseja acessar.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => handleSelect(company.id)}
              className="w-full text-left px-4 py-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all flex items-center justify-between group"
            >
              <span className="font-medium text-slate-700 group-hover:text-emerald-700">{company.name}</span>
              <span className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                Acessar &rarr;
              </span>
            </button>
          ))}
        </div>

        <button 
          onClick={handleLogout}
          className="mt-8 w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
        >
          <LogOut size={16} /> Sair
        </button>
      </div>
    </div>
  );
}
