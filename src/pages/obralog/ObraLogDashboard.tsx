import React from 'react';
import { ERPLayout } from '../../components/layout/ERPLayout';
import { useToast } from '../../context/ToastContext';

export default function ObraLogDashboard() {
  const { showToast } = useToast();

  return (
    <ERPLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Dashboard Principal</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={() => showToast('Ação realizada com sucesso!', 'success')}
            className="p-6 bg-slate-800 rounded-xl border border-slate-700 text-white hover:bg-slate-700 transition-colors"
          >
            Disparar Sucesso
          </button>
          <button 
            onClick={() => showToast('Erro ao realizar ação!', 'error')}
            className="p-6 bg-slate-800 rounded-xl border border-slate-700 text-white hover:bg-slate-700 transition-colors"
          >
            Disparar Erro
          </button>
        </div>
      </div>
    </ERPLayout>
  );
}
