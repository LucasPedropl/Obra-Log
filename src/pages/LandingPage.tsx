import { Shield, HardHat, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
          Bem-vindo à Plataforma
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Selecione o ambiente de acesso desejado. O sistema é dividido entre a gestão 
          SaaS (Super-Admin) e o ERP de Canteiro de Obras (ObraLog).
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Card ObraLog */}
        <Link 
          to="/app/login"
          className="group relative bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-500 transition-all duration-300 flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <HardHat size={32} />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">
            ObraLog (ERP)
          </h2>
          <p className="text-slate-500 mb-8">
            Acesso para Construtoras, Engenheiros e Almoxarifes. Gestão completa de canteiros, estoque e EPIs.
          </p>
          <div className="mt-auto flex items-center text-emerald-600 font-medium">
            Entrar no ERP <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card Super Admin */}
        <Link 
          to="/admin/login"
          className="group relative bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-500 transition-all duration-300 flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Shield size={32} />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">
            Painel Super-Admin
          </h2>
          <p className="text-slate-500 mb-8">
            Acesso exclusivo GEPLANO. Gestão de tenants, estatísticas de uso e controle global da plataforma SaaS.
          </p>
          <div className="mt-auto flex items-center text-indigo-600 font-medium">
            Entrar no Admin <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
