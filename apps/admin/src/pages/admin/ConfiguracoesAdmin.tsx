import React from 'react';
import { ERPLayout } from '../../components/layout/ERPLayout';

export default function ConfiguracoesAdmin() {
	return (
		<ERPLayout>
			<div className="p-6">
				<h1 className="text-2xl font-bold text-slate-900 mb-6">
					Configurações Gerais
				</h1>
				<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
					<p className="text-slate-600">
						Ajuste as configurações globais do sistema.
					</p>
				</div>
			</div>
		</ERPLayout>
	);
}
