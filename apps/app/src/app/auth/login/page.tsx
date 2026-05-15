import React from 'react';
import Image from 'next/image';
import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Imagem de Fundo conforme protótipo */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: 'url("/images/bg-login.png")',
          filter: 'brightness(0.4)'
        }}
      />

      {/* Card de Login Centralizado */}
      <div className="relative z-20 w-full max-w-[480px] px-4">
        <div className="bg-[#F8F9FA] rounded-[5px] shadow-2xl overflow-hidden border border-white/10">
          
          {/* Cabeçalho do Card */}
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

          {/* Área do Formulário */}
          <div className="p-8 md:p-10">
            <LoginForm />
          </div>

          {/* Rodapé do Card */}
          <div className="py-6 bg-[#F1F3F5] border-t border-gray-200 text-center">
            <p className="text-xs text-gray-600 font-medium">
              Precisa de acesso? <button className="text-[#101828] font-bold hover:underline">Contate o administrador</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
