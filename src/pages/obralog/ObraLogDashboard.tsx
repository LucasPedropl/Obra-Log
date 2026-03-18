import React from 'react';
import { ERPLayout } from '../../components/layout/ERPLayout';
import { useToast } from '../../context/ToastContext';
import { Building2, MapPin, Calendar, ArrowRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock data for obras
const mockObras = [
  {
    id: 1,
    name: 'Residencial Aurora',
    address: 'Rua das Flores, 123 - Centro',
    status: 'Em andamento',
    progress: 45,
    startDate: '10/01/2026',
    endDate: '15/12/2026',
  },
  {
    id: 2,
    name: 'Edifício Comercial Horizon',
    address: 'Av. Paulista, 1000 - Bela Vista',
    status: 'Planejamento',
    progress: 0,
    startDate: '01/04/2026',
    endDate: '30/11/2027',
  },
  {
    id: 3,
    name: 'Condomínio Parque Verde',
    address: 'Rodovia BR-101, Km 45',
    status: 'Concluída',
    progress: 100,
    startDate: '15/02/2025',
    endDate: '20/01/2026',
  }
];

export default function ObraLogDashboard() {
  const { showToast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em andamento': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'Planejamento': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Concluída': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  return (
    <ERPLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard Principal</h1>
            <p className="text-slate-400 mt-1">Visão geral das suas obras e projetos.</p>
          </div>
          <Link 
            to="/app/obras/nova"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={20} />
            Nova Obra
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="text-slate-400 text-sm font-medium mb-1">Total de Obras</div>
            <div className="text-3xl font-bold text-white">12</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="text-slate-400 text-sm font-medium mb-1">Em Andamento</div>
            <div className="text-3xl font-bold text-blue-400">5</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="text-slate-400 text-sm font-medium mb-1">Concluídas (Este ano)</div>
            <div className="text-3xl font-bold text-emerald-400">3</div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Obras Recentes</h2>
            <Link to="/app/obras" className="text-emerald-500 hover:text-emerald-400 text-sm font-medium flex items-center gap-1">
              Ver todas <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {mockObras.map((obra) => (
              <div key={obra.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors flex flex-col">
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-slate-800 rounded-lg text-emerald-500">
                      <Building2 size={24} />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(obra.status)}`}>
                      {obra.status}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-1" title={obra.name}>
                    {obra.name}
                  </h3>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-start gap-2 text-slate-400 text-sm">
                      <MapPin size={16} className="shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{obra.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Calendar size={16} className="shrink-0" />
                      <span>{obra.startDate} - {obra.endDate}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Progresso</span>
                      <span className="text-white font-medium">{obra.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${obra.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-slate-800 p-4 bg-slate-950/50">
                  <button 
                    onClick={() => showToast(`Acessando obra: ${obra.name}`, 'success')}
                    className="w-full py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Acessar Painel da Obra
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ERPLayout>
  );
}
