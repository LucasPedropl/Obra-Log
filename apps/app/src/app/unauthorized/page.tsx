'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Home, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
	const router = useRouter();
	const [countdown, setCountdown] = useState(5);

	useEffect(() => {
		const timer = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					clearInterval(timer);
					router.push('/dashboard');
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [router]);

	return (
		<div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
			<div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center animate-in fade-in zoom-in duration-500">
				<div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
					<ShieldAlert className="w-10 h-10 text-red-600" />
				</div>

				<h1 className="text-2xl font-bold text-gray-900 mb-2">
					Acesso Negado
				</h1>
				
				<p className="text-gray-500 mb-8 leading-relaxed">
					Você não possui permissão para acessar esta página. 
					Por favor, entre em contato com o administrador caso acredite que isso seja um erro.
				</p>

				<div className="bg-gray-50 rounded-lg p-4 mb-8 flex items-center justify-center gap-3">
					<Loader2 className="w-4 h-4 animate-spin text-primary" />
					<span className="text-sm font-medium text-gray-700">
						Redirecionando para o Início em <span className="text-primary font-bold">{countdown}s</span>...
					</span>
				</div>

				<div className="flex flex-col sm:flex-row gap-3">
					<Button 
						variant="outline" 
						className="flex-1"
						onClick={() => router.back()}
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Voltar
					</Button>
					<Button 
						className="flex-1"
						onClick={() => router.push('/dashboard')}
					>
						<Home className="w-4 h-4 mr-2" />
						Página Inicial
					</Button>
				</div>
			</div>
		</div>
	);
}
