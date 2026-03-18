import React from 'react';
import { ERPLayout } from '../../components/layout/ERPLayout';

export default function NovaObra() {
  return (
    <ERPLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-white">Cadastro de Obra</h1>
          <p className="text-slate-400 mt-1">Preencha os dados abaixo para registrar um novo projeto.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <p className="text-slate-400">Formulário de cadastro em desenvolvimento...</p>
        </div>
      </div>
    </ERPLayout>
  );
}
