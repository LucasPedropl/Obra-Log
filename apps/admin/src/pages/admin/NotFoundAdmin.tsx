import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function NotFoundAdmin() {
	const navigate = useNavigate();

	return (
		<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
			<ShieldAlert className="w-20 h-20 text-slate-400 mb-6" />
			<h1 className="text-4xl font-bold text-slate-800 mb-4">
				404 - Página Administrativa Não Encontrada
			</h1>
			<p className="text-slate-600 mb-8 max-w-md">
				A rota de administração que você tentou acessar não existe ou
				você não tem permissão.
			</p>
			<button
				onClick={() => navigate('/admin/dashboard')}
				className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
			>
				<ArrowLeft className="w-5 h-5" />
				Voltar para o Painel Admin
			</button>
		</div>
	);
}
