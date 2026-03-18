import React from 'react';
import { ERPLayout } from '../../components/layout/ERPLayout';

export default function ListagemObras() {
  return (
    <ERPLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-white">Listagem de Obras</h1>
          <p className="text-slate-400 mt-1">Gerencie todos os seus projetos cadastrados.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <p className="text-slate-400">Tabela de listagem em desenvolvimento...</p>
        </div>
      </div>
    </ERPLayout>
  );
}
