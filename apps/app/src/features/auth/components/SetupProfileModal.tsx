'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { User, Lock, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { setupInitialProfileAction } from '@/app/actions/authData';

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
			const result = await setupInitialProfileAction(user.id, fullName, password);
			
			if (!result.success) {
				throw new Error(result.error);
			}

			onComplete();
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Erro ao configurar perfil';
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-[999] flex items-center justify-center p-4 h-[100dvh] w-screen overflow-hidden">
			{/* Backdrop com desfoque e imagem de fundo para dar o mesmo clima do login */}
			<div 
				className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-500 z-0" 
				aria-hidden="true"
			/>
			
			{/* Conteúdo do Modal (Card Estilo Login) */}
			<div className="relative z-20 w-full max-w-[480px] bg-[#F8F9FA] rounded-[5px] shadow-2xl overflow-hidden border border-white/10 animate-in fade-in zoom-in-95 duration-300">
				
				{/* Cabeçalho do Card (Branding Identico ao Login) */}
				<div className="pt-8 pb-6 flex flex-col items-center border-b border-gray-200 bg-white">
					<div className="flex items-center gap-3">
						<Image 
							src="/logo.png" 
							alt="Logo Obra-Log" 
							width={40} 
							height={40} 
							className="object-contain"
						/>
						<h1 className="text-3xl font-bold tracking-tight text-[#101828]">
							Obralog
						</h1>
					</div>
					<p className="text-[10px] font-mono font-bold text-gray-500 tracking-[0.2em] mt-1 uppercase">
						CONSTRUCTION MGMT
					</p>
				</div>

				<div className="p-8 md:p-10">
					<div className="mb-8 text-center">
						<h2 className="text-xl font-bold text-gray-900">
							Bem-vindo ao ObraLog
						</h2>
						<p className="text-gray-500 text-[11px] font-medium mt-1 uppercase tracking-wider">
							Para continuar, por favor informe seu nome e crie uma nova senha pessoal.
						</p>
					</div>

					{error && (
						<div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-[5px] text-center text-[11px] text-red-600 font-bold uppercase">
							{error}
						</div>
					)}

					<form className="space-y-5" onSubmit={handleSetup}>
						{/* Campo de Nome Completo */}
						<div className="space-y-1.5">
							<Label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
								Nome Completo
							</Label>
							<div className="relative group">
								<div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors">
									<User size={18} />
								</div>
								<Input
									type="text"
									value={fullName}
									onChange={(e) => setFullName(e.target.value)}
									required
									placeholder="Ex: João Silva"
									className="pl-10 h-12 bg-white border-gray-300 rounded-[5px] focus-visible:ring-0 focus-visible:border-gray-900 text-gray-900 placeholder:text-gray-400 font-medium"
								/>
							</div>
						</div>

						{/* Campo de Nova Senha */}
						<div className="space-y-1.5">
							<Label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
								Nova Senha
							</Label>
							<div className="relative group">
								<div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors">
									<Lock size={18} />
								</div>
								<Input
									type={showPassword ? 'text' : 'password'}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									placeholder="••••••••"
									className="pl-10 pr-10 h-12 bg-white border-gray-300 rounded-[5px] focus-visible:ring-0 focus-visible:border-gray-900 text-gray-900 placeholder:text-gray-400 font-medium tracking-widest"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
								>
									{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
								</button>
							</div>
						</div>

						{/* Campo de Confirmar Senha */}
						<div className="space-y-1.5">
							<Label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
								Confirmar Nova Senha
							</Label>
							<div className="relative group">
								<div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors">
									<Lock size={18} />
								</div>
								<Input
									type={showConfirmPassword ? 'text' : 'password'}
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									required
									placeholder="••••••••"
									className="pl-10 pr-10 h-12 bg-white border-gray-300 rounded-[5px] focus-visible:ring-0 focus-visible:border-gray-900 text-gray-900 placeholder:text-gray-400 font-medium tracking-widest"
								/>
								<button
									type="button"
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
								>
									{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
								</button>
							</div>
						</div>

						<Button
							type="submit"
							disabled={loading}
							className="w-full h-12 bg-[#101828] hover:bg-[#1b263b] text-white font-black text-sm uppercase tracking-[0.1em] rounded-[5px] transition-all flex items-center justify-center gap-2 border-none shadow-lg shadow-black/20 mt-4"
						>
							{loading ? (
								<Loader2 className="w-5 h-5 animate-spin" />
							) : (
								<>
									Salvar e Continuar <ArrowRight size={18} />
								</>
							)}
						</Button>
					</form>
				</div>
			</div>
		</div>
	);
}
