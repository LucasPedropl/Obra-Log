'use client';

import { useAuth } from '@/components/providers/AuthContext';
import { createClient } from '@/config/supabase';
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

export default function LoginPage() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [rememberMe, setRememberMe] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [checkingSession, setCheckingSession] = useState(true);

	const { user, loading: authLoading } = useAuth();
	const router = useRouter();
	const supabase = createClient();

	React.useEffect(() => {
		if (!authLoading && user) {
			router.push('/dashboard');
		}

		// Carregar email lembrado
		const savedEmail = localStorage.getItem('obralog_admin_remember_email');
		if (savedEmail) {
			setEmail(savedEmail);
			setRememberMe(true);
		}

		if (!authLoading) {
			setCheckingSession(false);
		}
	}, [user, authLoading, router]);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			const { data: authData, error: authError } =
				await supabase.auth.signInWithPassword({ email, password });

			if (authError) throw authError;

			const { data: userData, error: userError } = await supabase
				.from('profiles')
				.select('is_super_admin')
				.eq('id', authData.user.id)
				.maybeSingle();

			if (userError) throw userError;

			if (!userData?.is_super_admin) {
				await supabase.auth.signOut();
				throw new Error('Acesso negado. Você não é um Super-Admin.');
			}

			// Salvar email se Lembrar de mim estiver marcado
			if (rememberMe) {
				localStorage.setItem('obralog_admin_remember_email', email);
			} else {
				localStorage.removeItem('obralog_admin_remember_email');
			}

			router.push('/dashboard');
			router.refresh();
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : 'Erro ao realizar login';
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	if (checkingSession) {
		return (
			<div className="min-h-screen bg-slate-50 flex items-center justify-center">
				<Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
			<div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
				<div className="flex flex-col items-center mb-8">
					<div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
						<Shield size={32} />
					</div>
					<h1 className="text-2xl font-bold text-slate-900">
						Obra<span className="text-blue-500">Log</span> Admin
					</h1>
					<p className="text-slate-500 text-sm mt-1">
						Acesso exclusivo Super-Admin
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
							E-mail
						</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
							placeholder="admin@obralog.com"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">
							Senha
						</label>
						<div className="relative">
							<input
								type={showPassword ? 'text' : 'password'}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								placeholder="••••••••"
								className="w-full px-4 py-2.5 pr-11 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
							>
								{showPassword ? (
									<EyeOff className="w-4 h-4" />
								) : (
									<Eye className="w-4 h-4" />
								)}
							</button>
						</div>
					</div>

					<div className="flex items-center">
						<input
							id="remember-me"
							type="checkbox"
							checked={rememberMe}
							onChange={(e) => setRememberMe(e.target.checked)}
							className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
						/>
						<label
							htmlFor="remember-me"
							className="ml-2 block text-sm text-slate-700 cursor-pointer select-none"
						>
							Lembrar de mim
						</label>
					</div>

					<button
						disabled={loading}
						className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 rounded-lg transition-colors mt-6 flex items-center justify-center"
					>
						{loading ? (
							<Loader2 className="animate-spin w-5 h-5" />
						) : (
							'Entrar no Painel'
						)}
					</button>
				</form>
			</div>
		</div>
	);
}
