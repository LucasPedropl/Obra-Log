'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HardHat, Loader2, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createClient } from '@/config/supabase';

interface SetupProfileUser {
	id: string;
	email?: string;
}

interface SetupProfileModalProps {
	user: SetupProfileUser;
	onComplete: () => void;
}

export function SetupProfileModal({
	user,
	onComplete,
}: SetupProfileModalProps) {
	const [fullName, setFullName] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [error, setError] = useState('');
	const supabase = createClient();

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
			// Update auth user data first
			const { error: updateDataError } = await supabase.auth.updateUser({
				data: { full_name: fullName, require_password_change: false },
			});

			if (updateDataError) {
				throw new Error(
					`Erro ao atualizar perfil: ${updateDataError.message}`,
				);
			}

			// Update auth password separately
			const { error: updatePassError } = await supabase.auth.updateUser({
				password: password,
			});

			if (updatePassError) {
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

			onComplete();
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Erro ao configurar perfil';
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-[999] flex items-center justify-center p-4 h-[100dvh] w-screen">
			{/* Backdrop com desfoque e escurecimento garantido em toda a tela */}
			<div 
				className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-500" 
				aria-hidden="true"
			/>

			{/* Conteúdo do Modal */}
			<div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in-95 duration-300">
				<div className="flex flex-col items-center mb-8 text-center">
					<div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
						<HardHat size={32} />
					</div>
					<h2 className="text-2xl font-bold text-gray-900">
						Bem-vindo ao ObraLog
					</h2>
					<p className="text-gray-500 text-sm mt-1">
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
					<div className="space-y-2">
						<Label className="block text-sm font-medium text-gray-700">
							Nome Completo
						</Label>
						<Input
							type="text"
							value={fullName}
							onChange={(e) => setFullName(e.target.value)}
							required
							placeholder="Ex: João Silva"
						/>
					</div>
					<div className="space-y-2">
						<Label className="block text-sm font-medium text-gray-700">
							Nova Senha
						</Label>
						<div className="relative">
							<Input
								type={showPassword ? 'text' : 'password'}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								placeholder="••••••••"
								className="pr-10"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
							>
								{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
							</button>
						</div>
					</div>
					<div className="space-y-2">
						<Label className="block text-sm font-medium text-gray-700">
							Confirmar Nova Senha
						</Label>
						<div className="relative">
							<Input
								type={showConfirmPassword ? 'text' : 'password'}
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
								placeholder="••••••••"
								className="pr-10"
							/>
							<button
								type="button"
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
							>
								{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
							</button>
						</div>
					</div>

					<Button
						type="submit"
						disabled={loading}
						className="w-full mt-6"
					>
						{loading ? (
							<Loader2 className="animate-spin w-5 h-5 mr-2" />
						) : null}
						{loading ? 'Salvando...' : 'Salvar e Continuar'}
					</Button>
				</form>
			</div>
		</div>
	);
}
