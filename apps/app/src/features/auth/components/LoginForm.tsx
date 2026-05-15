'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '../schemas/loginSchema';
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { loginAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const result = await loginAction(data);
      if (result && !result.success) {
        setServerError(result.error || 'E-mail ou senha inválidos.');
      }
    } catch (error: any) {
      if (error?.message === 'NEXT_REDIRECT') return;
      setServerError('Ocorreu um erro ao tentar entrar.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Campo de E-mail */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
          Email Profissional
        </Label>
        <div className="relative group">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors">
            <Mail size={18} />
          </div>
          <Input
            type="email"
            placeholder="nome@empresa.com.br"
            className="pl-10 h-12 bg-white border-gray-300 rounded-[5px] focus-visible:ring-0 focus-visible:border-gray-900 text-gray-900 placeholder:text-gray-400 font-medium"
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tight">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Campo de Senha */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
          Senha
        </Label>
        <div className="relative group">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors">
            <Lock size={18} />
          </div>
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="pl-10 pr-10 h-12 bg-white border-gray-300 rounded-[5px] focus-visible:ring-0 focus-visible:border-gray-900 text-gray-900 placeholder:text-gray-400 font-medium tracking-widest"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tight">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Lembrar-me e Esqueci Senha */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            id="remember" 
            className="w-4 h-4 rounded-[5px] border-gray-300 text-[#101828] focus:ring-[#101828]"
          />
          <label htmlFor="remember" className="text-[11px] font-medium text-gray-600">
            Lembrar de mim
          </label>
        </div>
        <button type="button" className="text-[11px] font-bold text-[#101828] hover:underline">
          Esqueceu a senha?
        </button>
      </div>

      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-[5px] text-center text-[11px] text-red-600 font-bold uppercase">
          {serverError}
        </div>
      )}

      {/* Botão de Entrar */}
      <Button
        disabled={isSubmitting}
        className="w-full h-12 bg-[#101828] hover:bg-[#1b263b] text-white font-black text-sm uppercase tracking-[0.1em] rounded-[5px] transition-all flex items-center justify-center gap-2 border-none shadow-lg shadow-black/20 mt-2"
      >
        {isSubmitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Entrar na Plataforma <ArrowRight size={18} />
          </>
        )}
      </Button>
    </form>
  );
}
