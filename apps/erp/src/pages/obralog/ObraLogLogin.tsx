import { HardHat, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { authService } from '../../features/auth/services/auth.service';
import { supabase } from '../../config/supabase';

export default function ObraLogLogin() {
	const [email, setEmail] = useState('pedro@gmail.com');
	const [password, setPassword] = useState('plm200510');
	const [rememberMe, setRememberMe] = useState(true);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const navigate = useNavigate();

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			if (!rememberMe) {
				localStorage.setItem('keep_session', 'false');
			} else {
				localStorage.removeItem('keep_session');
			}
			sessionStorage.setItem('session_is_active', '1');

			const { user } = await authService.login({ email, password });

			if (user.user_metadata?.require_password_change) {
				navigate('/app/setup-profile');
				return;
			}

			// Check companies
			const companyUsers = await authService.getUserCompanies(user.id);

			// Extract valid active companies
			const activeCompanies = companyUsers
				?.map((cu: any) => cu.companies)
				.filter((c: any) => c && c.active);

			if (activeCompanies && activeCompanies.length > 0) {
				// To force Instance selection / Tenant check, always redirect to select-company
				// We don't auto-redirect to dashboard anymore on root login if we want that Netflix style.
				navigate('/app/select-company');
			} else {
				throw new Error(
					'Você não está vinculado a nenhum Sistema/Empresa.',
				);
			}
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
					<div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
						<HardHat size={32} />
					</div>
					<h1 className="text-2xl font-bold text-slate-900">
						ObraLog ERP
					</h1>
					<p className="text-slate-500 text-sm mt-1">
						Gestão inteligente de canteiros
					</p>
				</div>

				{error && (
					<div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
						{error}
					</div>
				)}

				<form className="space-y-4" onSubmit={handleLogin}>
					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">
							E-mail Corporativo
						</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
							placeholder="engenheiro@construtora.com"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">
							Senha
						</label>
						<PasswordInput
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="focus:ring-emerald-500 focus:border-emerald-500"
							placeholder="••••••••"
						/>
					</div>

					<div className="flex items-center">
						<input
							id="remember-me"
							type="checkbox"
							checked={rememberMe}
							onChange={(e) => setRememberMe(e.target.checked)}
							className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
						/>
						<label
							htmlFor="remember-me"
							className="ml-2 block text-sm text-slate-700"
						>
							Lembrar-me (manter sessão ativa)
						</label>
					</div>

					<button
						disabled={loading}
						className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-2.5 rounded-lg transition-colors mt-6 flex items-center justify-center"
					>
						{loading ? (
							<Loader2 className="animate-spin w-5 h-5" />
						) : (
							'Acessar ERP'
						)}
					</button>
				</form>

				<div className="mt-6 text-center">
					<Link
						to="/"
						className="text-sm text-emerald-600 hover:text-emerald-800 font-medium"
					>
						&larr; Voltar para seleção de sistema
					</Link>
				</div>
			</div>
		</div>
	);
}
