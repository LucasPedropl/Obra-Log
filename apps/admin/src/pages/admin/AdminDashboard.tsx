import React from 'react';
import { ERPLayout } from '../../components/layout/ERPLayout';
import { LayoutDashboard } from 'lucide-react';

export default function AdminDashboard() {
	return (
		<ERPLayout>
			<div className="flex-1 min-h-screen bg-slate-50 -m-4 md:-m-6">
				{/* Header Top Bar */}
				<div className="bg-white border-b border-slate-200 px-6 md:px-8 py-4 flex items-center justify-between">
					<h1 className="text-xl font-semibold text-slate-800">
						Visão Geral
					</h1>
				</div>

				{/* Content */}
				<div className="p-6 md:p-8">
					<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center">
						<div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
							<LayoutDashboard size={32} />
						</div>
						<h2 className="text-2xl font-bold text-slate-800 mb-2">
							Bem-vindo ao Painel!
						</h2>
						<p className="text-slate-500 max-w-md">
							Aqui você tem uma visão geral de todos os dados do
							sistema. Acesse o menu lateral para gerenciar
							empresas, equipe e configurações.
						</p>
					</div>
				</div>
			</div>
		</ERPLayout>
	);
}
