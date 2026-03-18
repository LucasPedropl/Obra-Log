import { LayoutDashboard, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../features/auth/services/auth.service';

export default function ObraLogDashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/app/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">ObraLog ERP</h1>
            <p className="text-xs text-slate-500">Painel de Gestão</p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition-colors text-sm font-medium"
        >
          <LogOut size={18} />
          Sair
        </button>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Bem-vindo ao ObraLog!</h2>
          <p className="text-slate-600">
            Você fez login com sucesso no sistema ERP. O painel de gestão das obras será construído aqui.
          </p>
        </div>
      </main>
    </div>
  );
}
