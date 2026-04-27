'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '../schemas/loginSchema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { GoogleLoginButton } from './GoogleLoginButton';
import { Eye, EyeOff } from 'lucide-react';

import { useRouter } from 'next/navigation';

import { createClient } from '@/config/supabase';

export function LoginForm() {
	const router = useRouter();
	const supabase = createClient();
	const [showPassword, setShowPassword] = useState(false);

	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
	});

	const onSubmit = async (data: LoginFormData) => {
		try {
			const { error } = await supabase.auth.signInWithPassword({
				email: data.email,
				password: data.password,
			});

			if (error) {
				throw error;
			}

			// Redireciona para a seleção de instância. 
			// Se precisar mudar senha, a página de destino cuidará disso de forma persistente.
			router.push('/selecionar-instancia');
			router.refresh();
		} catch (error: unknown) {
			console.error('Login error:', error);
			let message = 'E-mail ou senha incorretos. Tente novamente!';
			
			if (error instanceof Error) {
				message = error.message;
			} else if (error && typeof error === 'object' && 'message' in error) {
				message = String((error as any).message);
			}
			
			setError('root', { message });
		}
	};

	return (
		<div className="w-full max-w-md space-y-8">
			<div className="text-center sm:text-left">
				<h2 className="text-3xl font-bold tracking-tight text-gray-900">
					Bem-vindo(a) de volta!
				</h2>
				<p className="mt-2 text-sm text-gray-600">
					Faça login na sua conta para acessar o sistema.
				</p>
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">E-mail</Label>
						<Input
							id="email"
							type="email"
							placeholder="admin@empresa.com"
							{...register('email')}
						/>
						{errors.email && (
							<p className="text-sm text-red-500">
								{errors.email.message}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="password">Senha</Label>
						<div className="relative">
							<Input
								id="password"
								type={showPassword ? 'text' : 'password'}
								placeholder="••••••••"
								className="pr-10"
								{...register('password')}
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
							>
								{showPassword ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</button>
						</div>
						{errors.password && (
							<p className="text-sm text-red-500">
								{errors.password.message}
							</p>
						)}
					</div>
				</div>

				<div className="flex items-center justify-between">
					<div className="flex items-center">
						<input
							id="remember-me"
							type="checkbox"
							className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
							{...register('rememberMe')}
						/>
						<label
							htmlFor="remember-me"
							className="ml-2 block text-sm text-gray-900"
						>
							Lembrar de mim
						</label>
					</div>

					<div className="text-sm">
						<a
							href="#"
							className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
						>
							Esqueceu a senha?
						</a>
					</div>
				</div>

				{errors.root && (
					<div className="p-3 bg-red-50 border border-red-200 rounded-md text-center">
						<p className="text-sm text-red-600 font-medium">
							{errors.root.message}
						</p>
					</div>
				)}

				<Button
					type="submit"
					className="w-full"
					disabled={isSubmitting}
				>
					{isSubmitting ? 'Entrando...' : 'Entrar agora'}
				</Button>
			</form>

			<div className="mt-6">
				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border-t border-gray-300" />
					</div>
					<div className="relative flex justify-center text-sm">
						<span className="bg-white px-2 text-gray-500">
							Ou acesse com
						</span>
					</div>
				</div>

				<div className="mt-6">
					<GoogleLoginButton />
				</div>
			</div>
		</div>
	);
}
