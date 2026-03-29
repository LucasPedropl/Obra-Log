import React from 'react';
import { ERPLayout } from '../../components/layout/ERPLayout';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function NotFoundERP() {
	const navigate = useNavigate();

	return (
		<ERPLayout>
			<div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
				<AlertCircle className="w-20 h-20 text-brand-primary mb-6" />
				<h1 className="text-4xl font-bold text-text-main mb-4">
					404 - Página não encontrada
				</h1>
				<p className="text-text-muted mb-8 max-w-md">
					Desculpe, a página que você está tentando acessar não existe
					ou foi movida.
				</p>
				<button
					onClick={() => navigate('/app/dashboard')}
					className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-3 rounded-lg font-medium transition-colors"
				>
					<ArrowLeft className="w-5 h-5" />
					Voltar para o Dashboard
				</button>
			</div>
		</ERPLayout>
	);
}
