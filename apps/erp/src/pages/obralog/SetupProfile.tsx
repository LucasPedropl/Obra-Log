import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HardHat, Loader2 } from 'lucide-react';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { supabase } from '../../config/supabase';
import { authService } from '../../features/auth/services/auth.service';

export default function SetupProfile() {
	const [fullName, setFullName] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const navigate = useNavigate();

	const handleSetup = async (e: React.FormEvent) => {
		e.preventDefault();
		if (password !== confirmPassword) {
			setError('As senhas não coincidem');
			return;
		}
		if (password.length < 6) {
			setError('A senha deve ter no mínimo 6 caracteres');
			return;
		}

		setLoading(true);
		setError('');

		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error('Usuário não autenticado');

			// Update auth user data first
			const { error: updateDataError } = await supabase.auth.updateUser({
				data: { full_name: fullName, require_password_change: false },
			});

			if (updateDataError) {
				console.error(
					'Erro ao atualizar dados do ucuário:',
					updateDataError,
				);
				throw new Error(
					`Erro ao atualizar perfil: ${updateDataError.message}`,
				);
			}

			// Update auth password separately
			const { error: updatePassError } = await supabase.auth.updateUser({
				password: password,
			});

			if (updatePassError) {
				console.error('Erro ao atualizar senha:', updatePassError);
				// Se o erro for porque a senha é a mesma, podemos ignorar e prosseguir
				if (
					!updatePassError.message.includes(
						'different from the old password',
					) &&
					!updatePassError.message.includes('should be different')
				) {
					throw new Error(
						`Erro de senha (Supabase): ${updatePassError.message}`,
					);
				}
			}

			// Update public.users
			const { error: updateDbError } = await supabase
				.from('users')
				.update({ full_name: fullName })
				.eq('id', user.id);

			if (updateDbError) throw updateDbError;

			// Check companies to decide where to navigate
			const companyUsers = await authService.getUserCompanies(user.id);

			const activeCompanies = companyUsers
				?.map((cu: any) => cu.companies)
				.filter((c: any) => c && c.active);

			if (activeCompanies && activeCompanies.length > 0) {
				navigate('/app/select-company');
			} else {
				throw new Error('Você não está vinculado a nenhuma empresa.');
			}
		} catch (err: any) {
			setError(err.message || 'Erro ao configurar perfil');
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
						Bem-vindo ao ObraLog
					</h1>
					<p className="text-slate-500 text-sm mt-1 text-center">
						Para continuar, por favor informe seu nome e crie uma
						nova senha pessoal.
					</p>
				</div>

				{error && (
					<div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
						{error}
					</div>
				)}

				<form className="space-y-4" onSubmit={handleSetup}>
					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">
							Nome Completo
						</label>
						<input
							type="text"
							value={fullName}
							onChange={(e) => setFullName(e.target.value)}
							required
							className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
							placeholder="Ex: João Silva"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">
							Nova Senha
						</label>
						<PasswordInput
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="focus:ring-emerald-500 focus:border-emerald-500"
							placeholder="••••••••"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">
							Confirmar Nova Senha
						</label>
						<PasswordInput
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
							className="focus:ring-emerald-500 focus:border-emerald-500"
							placeholder="••••••••"
						/>
					</div>
					<button
						disabled={loading}
						className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-2.5 rounded-lg transition-colors mt-6 flex items-center justify-center"
					>
						{loading ? (
							<Loader2 className="animate-spin w-5 h-5" />
						) : (
							'Salvar e Continuar'
						)}
					</button>
				</form>
			</div>
		</div>
	);
}
