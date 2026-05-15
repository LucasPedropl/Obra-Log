'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  Loader2,
  Search,
  ArrowRight,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { createClient } from '@/config/supabase';
import { 
  getUserCompaniesAction, 
  activateCompanyAction,
  createCompanySelfServiceAction,
  upgradeCompanyPlanAction,
} from '@/app/actions/authData';
import { SetupProfileModal } from '@/features/auth/components/SetupProfileModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Company {
  id: string;
  name: string;
  status: string;
  role: 'ADMIN' | 'USER';
  profile_name?: string;
  cnpj?: string;
  active_sites_count?: number;
  users_count?: number;
  current_plan?: string;
  max_sites?: number;
}

interface SelectCompanyClientProps {
  initialCompanies?: Company[];
  user?: any;
}

export function SelectCompanyClient({ initialCompanies, user: initialUser }: SelectCompanyClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(!initialCompanies);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>(initialCompanies || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [authUser, setAuthUser] = useState<any | null>(initialUser || null);
  const [requireSetup, setRequireSetup] = useState(false);

  // Limites e Planos (Upgrade de empresa existente)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradingCompanyId, setUpgradingCompanyId] = useState<string | null>(null);

  // Fluxo de Nova Empresa (Criação)
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Onboarding state (Ativação de empresa PENDING)
  const [pendingCompany, setPendingCompany] = useState<Company | null>(null);
  const [onboardingCompanyName, setOnboardingCompanyName] = useState('');
  const [onboardingCnpj, setOnboardingCnpj] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  const handleSelectCompany = (companyId: string, remember: boolean = false) => {
    document.cookie = `selectedCompanyId=${companyId}; path=/; max-age=86400; SameSite=Lax`;
    if (remember) {
      document.cookie = `rememberedCompanyId=${companyId}; path=/; max-age=2592000; SameSite=Lax`;
    }
    router.push('/dashboard');
    router.refresh();
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const match = document.cookie.match(/(^| )rememberedCompanyId=([^;]+)/);
        if (match) {
          handleSelectCompany(match[2]);
          return;
        }

        let currentUser = authUser;
        let currentCompanies = companies;

        if (!currentUser) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            router.push('/auth/login');
            return;
          }
          currentUser = user;
          setAuthUser(user);
        }

        if (currentUser.user_metadata?.require_password_change) {
          setRequireSetup(true);
          setLoading(false);
          return;
        }

        if (currentCompanies.length === 0) {
          const result = await getUserCompaniesAction(currentUser.id);
          if (!result.success) throw new Error(result.error);
          currentCompanies = (result.companies as Company[]) || [];
          setCompanies(currentCompanies);
        }

        // Se só tem uma empresa e ela está pendente, abre o onboarding
        if (currentCompanies.length === 1 && currentCompanies[0].status === 'PENDING' && currentCompanies[0].role === 'ADMIN') {
          setPendingCompany(currentCompanies[0]);
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar empresas.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [initialCompanies, initialUser]);

  const onSelectCard = (company: Company) => {
    if (company.status === 'PENDING') {
      if (company.role === 'ADMIN') {
        setPendingCompany(company);
        setOnboardingCompanyName('');
        setOnboardingCnpj('');
      } else {
        setError('Esta empresa ainda não foi ativada pelo administrador.');
      }
    } else {
      handleSelectCompany(company.id);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingCompany || !onboardingCompanyName.trim()) return;

    setIsActivating(true);
    setError(null);
    try {
      const result = await activateCompanyAction(pendingCompany.id, onboardingCompanyName, onboardingCnpj);
      if (!result.success) throw new Error(result.error);
      
      document.cookie = `selectedCompanyId=${pendingCompany.id}; path=/; max-age=86400; SameSite=Lax`;
      setPendingCompany(null);
      router.refresh();
      router.push('/dashboard');
      
      setTimeout(() => {
        if (window.location.pathname !== '/dashboard') window.location.href = '/dashboard';
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao ativar empresa');
    } finally {
      setIsActivating(false);
    }
  };

  // ───────────────────── Fluxo de Nova Empresa ─────────────────────

  const handlePlanSelectForNewCompany = async (planName: string, maxSites: number) => {
    if (!authUser) return;
    setIsCreating(true);
    setError(null);
    try {
      const result = await createCompanySelfServiceAction(authUser.id, planName, maxSites);
      if (!result.success) throw new Error(result.error);
      
      const updated = await getUserCompaniesAction(authUser.id);
      if (updated.success) {
        const updatedCompanies = updated.companies as Company[];
        setCompanies(updatedCompanies);
        const newPending = updatedCompanies.find((c: any) => c.id === result.companyId);
        if (newPending) {
          setPendingCompany(newPending);
          setOnboardingCompanyName('');
          setOnboardingCnpj('');
          setShowPlanSelection(false);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar nova empresa.');
    } finally {
      setIsCreating(false);
    }
  };

  // ───────────────────── Fluxo de Upgrade (Empresa Existente) ─────────────────────

  const handleUpgradePlan = async (planName: string, maxSites: number) => {
    if (!authUser || !upgradingCompanyId) return;
    setIsCreating(true);
    try {
      await upgradeCompanyPlanAction(upgradingCompanyId, planName, maxSites);
      setShowUpgradeModal(false);
      setUpgradingCompanyId(null);
      const updated = await getUserCompaniesAction(authUser.id);
      if (updated.success) setCompanies(updated.companies as Company[]);
    } catch (err: any) {
      setError('Falha ao processar upgrade.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = 'selectedCompanyId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'rememberedCompanyId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/auth/login');
    router.refresh();
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cnpj?.includes(searchTerm)
  );

  if (requireSetup && authUser) {
    return <SetupProfileModal user={authUser} onComplete={() => window.location.reload()} />;
  }

  // Modal Unificado de Planos (Reutilizado para Criação e Upgrade)
  if (showUpgradeModal || showPlanSelection) {
    const isNewFlow = showPlanSelection;
    const title = isNewFlow ? "Escolha seu Plano" : "Upgrade de Assinatura";
    const subtitle = isNewFlow ? "Selecione o melhor plano para sua nova organização" : "Ajuste os limites para esta organização específica";
    const handleAction = isNewFlow ? handlePlanSelectForNewCompany : handleUpgradePlan;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-4xl bg-white p-8 md:p-12 border border-gray-200 shadow-2xl relative rounded-[5px]">
          <button 
            onClick={() => { setShowUpgradeModal(false); setShowPlanSelection(false); setUpgradingCompanyId(null); }} 
            className="absolute top-6 right-6 text-gray-400 hover:text-black font-bold text-sm"
          >
            FECHAR
          </button>
          
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-[#101828]">{title}</h2>
            <p className="text-gray-500 mt-2 text-sm uppercase font-bold tracking-widest">{subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Plano Bronze */}
            <div className="border border-gray-200 p-6 flex flex-col hover:border-blue-500 transition-colors rounded-[5px] bg-white">
              <h3 className="text-xl font-bold text-[#101828]">Bronze</h3>
              <p className="text-gray-500 text-sm mt-1 mb-4 h-10">Ideal para pequenas construtoras.</p>
              <div className="text-3xl font-black mb-6 text-[#101828]">R$ 349<span className="text-sm font-medium text-gray-500">/mês</span></div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center text-sm font-medium text-gray-700"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500 shrink-0" /> Até 2 Obras Ativas</li>
                <li className="flex items-center text-sm font-medium text-gray-700"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500 shrink-0" /> Usuários Ilimitados</li>
                <li className="flex items-center text-sm font-medium text-gray-700"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500 shrink-0" /> Gestão de Insumos</li>
              </ul>
              <Button 
                onClick={() => handleAction('Bronze', 2)}
                className="w-full rounded-[5px] bg-white text-[#101828] border-2 border-[#101828] hover:bg-gray-50 font-bold"
                disabled={isCreating}
              >
                {isCreating ? <Loader2 className="animate-spin h-4 w-4" /> : 'Assinar Bronze'}
              </Button>
            </div>

            {/* Plano Prata */}
            <div className="border-2 border-[#101828] p-6 flex flex-col relative bg-gray-50 shadow-lg rounded-[5px]">
              <div className="absolute top-0 right-0 bg-[#101828] text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest rounded-bl-[5px]">RECOMENDADO</div>
              <h3 className="text-xl font-bold text-[#101828]">Prata</h3>
              <p className="text-gray-500 text-sm mt-1 mb-4 h-10">Expansão de negócios e filiais.</p>
              <div className="text-3xl font-black mb-6 text-[#101828]">R$ 749<span className="text-sm font-medium text-gray-500">/mês</span></div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center text-sm font-medium text-gray-700"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500 shrink-0" /> Até 10 Obras Ativas</li>
                <li className="flex items-center text-sm font-medium text-gray-700"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500 shrink-0" /> Gestão de EPIs Completa</li>
                <li className="flex items-center text-sm font-medium text-gray-700"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500 shrink-0" /> Suporte WhatsApp</li>
              </ul>
              <Button 
                onClick={() => handleAction('Prata', 10)}
                className="w-full rounded-[5px] bg-[#101828] hover:bg-black font-bold text-white shadow-xl shadow-black/10"
                disabled={isCreating}
              >
                {isCreating ? <Loader2 className="animate-spin h-4 w-4" /> : 'Assinar Prata'}
              </Button>
            </div>

            {/* Plano Ouro */}
            <div className="border border-gray-200 p-6 flex flex-col hover:border-blue-500 transition-colors rounded-[5px] bg-white">
              <h3 className="text-xl font-bold text-[#101828]">Ouro</h3>
              <p className="text-gray-500 text-sm mt-1 mb-4 h-10">Controle total de grandes operações.</p>
              <div className="text-3xl font-black mb-6 text-[#101828]">R$ 1.497<span className="text-sm font-medium text-gray-500">/mês</span></div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center text-sm font-medium text-gray-700"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500 shrink-0" /> Obras Ilimitadas</li>
                <li className="flex items-center text-sm font-medium text-gray-700"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500 shrink-0" /> Relatórios Customizados</li>
                <li className="flex items-center text-sm font-medium text-gray-700"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500 shrink-0" /> Suporte 24/7</li>
              </ul>
              <Button 
                onClick={() => handleAction('Ouro', 999)}
                className="w-full rounded-[5px] bg-white text-[#101828] border-2 border-[#101828] hover:bg-gray-50 font-bold"
                disabled={isCreating}
              >
                {isCreating ? <Loader2 className="animate-spin h-4 w-4" /> : 'Assinar Ouro'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#101828] mb-4" />
        <p className="text-gray-500 font-medium">Carregando instâncias...</p>
      </div>
    );
  }

  if (pendingCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8F9FA]">
        <div className="w-full max-w-md bg-white p-8 border border-gray-200 shadow-sm rounded-[5px]">
          <div className="text-center mb-8 relative">
            <button 
              onClick={() => {
                setPendingCompany(null);
                // Se o usuário fechar o modal de uma empresa PENDING que acabou de ser criada,
                // ela continua na lista para ele ativar depois se quiser.
              }} 
              className="absolute left-0 top-0 text-gray-400 hover:text-black text-xs font-bold uppercase tracking-tight"
            >
              ← Voltar
            </button>
            <h1 className="text-2xl font-bold text-[#101828]">Ativar Empresa</h1>
            <p className="text-gray-500 text-xs mt-2 font-medium uppercase tracking-wider">CONFIGURAÇÃO DE AMBIENTE</p>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-[11px] font-bold border border-red-100 uppercase">{error}</div>}
          <form onSubmit={handleActivate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-700 uppercase">Nome da Empresa</label>
              <Input className="rounded-[5px] h-12 border-gray-300" value={onboardingCompanyName} onChange={e => setOnboardingCompanyName(e.target.value)} placeholder="Ex: Alpha Construtora" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-700 uppercase">CNPJ (Opcional)</label>
              <Input className="rounded-[5px] h-12 border-gray-300" value={onboardingCnpj} onChange={e => setOnboardingCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
            </div>
            <Button className="w-full h-12 rounded-[5px] bg-[#101828] hover:bg-black font-bold uppercase tracking-widest text-xs text-white" disabled={isActivating}>
              {isActivating ? <Loader2 className="animate-spin" /> : 'Confirmar e Entrar'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-8 md:p-12 lg:p-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold text-[#101828] mb-2 font-sans">Selecione a Empresa</h1>
            <p className="text-gray-500 text-sm font-medium">Acesse os projetos e insumos da organização correspondente.</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Input 
              className="pl-4 pr-10 h-11 rounded-[5px] border-gray-300 focus:border-gray-900 focus:ring-0 placeholder:text-gray-400"
              placeholder="Buscar empresa..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>

        {error && <div className="mb-8 p-4 bg-red-50 text-red-600 text-xs font-bold border border-red-200 uppercase tracking-tight rounded-[5px]">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <button
              key={company.id}
              onClick={() => onSelectCard(company)}
              className="group flex flex-col bg-white border border-gray-300 hover:border-gray-900 hover:shadow-md transition-all text-left overflow-hidden rounded-[5px]"
            >
              <div className="p-6 flex items-start gap-5 flex-1">
                <div className="w-[60px] h-[60px] shrink-0 bg-[#F3F4F6] text-[#101828] font-bold text-xl flex items-center justify-center border border-gray-300 rounded-[5px]">
                  {company.name.startsWith('Pendente:') ? '?' : company.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0 pt-1">
                  <h3 className="font-bold text-[#101828] text-[17px] truncate leading-tight group-hover:text-black">
                    {company.name.startsWith('Pendente:') ? 'Empresa Pendente' : company.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight",
                      company.role === 'ADMIN' 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-gray-100 text-gray-600"
                    )}>
                      {company.role === 'ADMIN' ? 'Administrador' : (company.profile_name || 'Colaborador')}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {company.cnpj || 'Sem CNPJ'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-[1px] bg-gray-200 w-full" />

              <div className="px-6 py-4 flex items-center justify-between bg-white group-hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-8">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Obras Ativas</span>
                    <span className="text-xl font-black text-[#101828] mt-0.5">{company.status === 'PENDING' ? '--' : (company.active_sites_count || 0)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Usuários</span>
                    <span className="text-xl font-black text-[#101828] mt-0.5">{company.status === 'PENDING' ? '--' : (company.users_count || 0)}</span>
                  </div>
                </div>
                <div className="w-8 h-8 flex items-center justify-center text-gray-400 group-hover:text-[#101828] transition-colors">
                  <ArrowRight size={20} />
                </div>
              </div>
            </button>
          ))}

          {(!searchTerm || 'nova empresa'.includes(searchTerm.toLowerCase())) && (
            <button
              onClick={() => setShowPlanSelection(true)}
              className="group flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 hover:border-gray-900 hover:bg-white transition-all text-center rounded-[5px] min-h-[160px] p-6"
            >
              <div className="w-16 h-16 bg-white border border-gray-200 rounded-[5px] flex items-center justify-center text-gray-400 group-hover:text-black group-hover:border-gray-900 transition-colors mb-4 shadow-sm">
                <Plus size={32} />
              </div>
              <h3 className="font-bold text-[#101828] text-lg group-hover:text-black">Nova Empresa</h3>
              <p className="text-xs text-gray-500 font-medium mt-1 max-w-[200px]">Cadastre uma nova filial ou Organização</p>
            </button>
          )}

          {filteredCompanies.length === 0 && searchTerm && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-medium">Nenhuma empresa encontrada com esse termo.</p>
            </div>
          )}
        </div>

        <div className="mt-16 pt-8 border-t border-gray-100 flex justify-center">
          <Button 
            variant="ghost" 
            className="text-gray-400 hover:text-red-600 font-bold text-xs uppercase tracking-widest gap-2"
            onClick={handleLogout}
          >
            <LogOut size={16} /> Sair do Sistema
          </Button>
        </div>
      </div>
    </div>
  );
}
