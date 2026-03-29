import { Shield, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { authService } from '../../features/auth/services/auth.service';

export default function AdminLogin() {
  const [email, setEmail] = useState('pedrolucasmota2005@gmail.com');
  const [password, setPassword] = useState('plm200510');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { isSuperAdmin } = await authService.login({ email, password });
      
      if (!isSuperAdmin) {
        await authService.logout();
        throw new Error('Acesso negado. Você não é um Super-Admin.');
      }

      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">GEPLANO Admin</h1>
          <p className="text-slate-500 text-sm mt-1">Acesso exclusivo Super-Admin</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="admin@geplano.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <PasswordInput 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 rounded-lg transition-colors mt-6 flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Entrar no Painel'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            &larr; Voltar para seleção de sistema
          </Link>
        </div>
      </div>
    </div>
  );
}

