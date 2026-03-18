import React, { useState, useEffect } from 'react';
import { Shield, Plus, Building2, Loader2, LogOut, Users, Key } from 'lucide-react';
import { adminService } from '../../features/admin/services/admin.service';
import { authService } from '../../features/auth/services/auth.service';
import { useAdminData, Company } from '../../features/admin/hooks/useAdminData';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { companies, loading: loadingData, refetchCompanies } = useAdminData();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  
  // Form states
  const [companyName, setCompanyName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [companyError, setCompanyError] = useState('');
  const [userError, setUserError] = useState('');
  const [result, setResult] = useState<{ email: string; tempPass: string } | null>(null);
  
  // Users list state
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const navigate = useNavigate();

  // Fetch users when selected company changes
  useEffect(() => {
    if (selectedCompany) {
      fetchCompanyUsers(selectedCompany.id);
    } else {
      setCompanyUsers([]);
    }
  }, [selectedCompany]);

  const fetchCompanyUsers = async (companyId: string) => {
    setLoadingUsers(true);
    try {
      const users = await adminService.getCompanyUsers(companyId);
      setCompanyUsers(users || []);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setCompanyError('');
    try {
      const newCompany = await adminService.createCompany(companyName);
      setCompanyName('');
      await refetchCompanies();
      setSelectedCompany(newCompany);
    } catch (err: any) {
      setCompanyError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    setLoading(true); setUserError(''); setResult(null);
    try {
      const res = await adminService.createCompanyAdmin(selectedCompany.id, adminEmail, adminName);
      setResult({ email: res.email, tempPass: res.tempPassword });
      setAdminEmail(''); setAdminName('');
      // Refresh users list
      fetchCompanyUsers(selectedCompany.id);
    } catch (err: any) {
      setUserError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
            <Shield size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Painel Super-Admin</h1>
        </div>
        <button onClick={handleLogout} className="text-slate-500 hover:text-red-600 flex items-center gap-2 text-sm font-medium transition-colors">
          <LogOut size={18} /> Sair
        </button>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid md:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Lista de Empresas */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="text-indigo-600" size={20} /> Nova Empresa
            </h2>
            {companyError && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 text-xs">{companyError}</div>}
            <form onSubmit={handleCreateCompany} className="flex flex-col gap-3">
              <input 
                type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                placeholder="Nome da Construtora"
              />
              <button disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus size={16} />} Criar Empresa
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex-1 overflow-hidden flex flex-col">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Empresas Cadastradas</h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {loadingData ? (
                <div className="flex justify-center p-4"><Loader2 className="animate-spin text-indigo-600" /></div>
              ) : companies.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">Nenhuma empresa encontrada.</p>
              ) : (
                companies.map(company => (
                  <button
                    key={company.id}
                    onClick={() => { setSelectedCompany(company); setResult(null); setUserError(''); }}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                      selectedCompany?.id === company.id 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-900' 
                        : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    <div className="font-medium">{company.name}</div>
                    <div className="text-xs opacity-70 mt-1">ID: {company.id.split('-')[0]}...</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Coluna Direita: Detalhes e Usuários */}
        <div className="md:col-span-8">
          {selectedCompany ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
              <div className="border-b border-slate-100 pb-6 mb-6">
                <h2 className="text-2xl font-bold text-slate-900">{selectedCompany.name}</h2>
                <p className="text-slate-500 text-sm mt-1">Gerencie os acessos administrativos desta empresa.</p>
              </div>

              {userError && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">{userError}</div>}

              {result && (
                <div className="mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <h3 className="text-emerald-800 font-bold mb-2 flex items-center gap-2"><Key size={18} /> Acesso Gerado!</h3>
                  <p className="text-emerald-700 mb-4 text-sm">Envie estas credenciais para o cliente acessar o ObraLog.</p>
                  <div className="bg-white p-4 rounded-lg border border-emerald-100 font-mono text-sm">
                    <p><strong>E-mail:</strong> {result.email}</p>
                    <p><strong>Senha:</strong> {result.tempPass}</p>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Users className="text-indigo-600" size={20} /> Adicionar Usuário Admin
                </h3>
                <form onSubmit={handleCreateUser} className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                    <input 
                      type="text" required value={adminName} onChange={(e) => setAdminName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      placeholder="Ex: João Silva"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                    <input 
                      type="email" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      placeholder="admin@empresa.com"
                    />
                  </div>
                  <div className="md:col-span-2 pt-2">
                    <button disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2 text-sm">
                      {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus size={16} />} Gerar Acesso Admin
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="text-slate-500" size={16} /> Usuários da Empresa
                  </h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {loadingUsers ? (
                    <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>
                  ) : companyUsers.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">Nenhum usuário cadastrado.</div>
                  ) : (
                    companyUsers.map(user => (
                      <div key={user.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{user.full_name || 'Usuário'}</p>
                          <p className="text-slate-500 text-xs">{user.email}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {user.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full bg-slate-100/50 rounded-2xl border border-slate-200 border-dashed flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <Building2 size={48} className="mb-4 text-slate-300" />
              <p>Selecione uma empresa na lista ao lado<br/>para gerenciar seus usuários.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

