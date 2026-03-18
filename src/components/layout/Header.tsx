import React from 'react';
import { Settings, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Header: React.FC = () => {
  return (
    <header className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6">
      <div className="text-emerald-500 font-bold text-xl">ObraLog</div>
      
      <div className="flex items-center gap-4 text-slate-300">
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium">Pedro Lucas</div>
            <div className="text-xs text-slate-500">Admin</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
            <User size={16} />
          </div>
        </div>
        <Link to="/app/configuracoes" className="hover:text-emerald-400 transition-colors">
          <Settings size={20} />
        </Link>
      </div>
    </header>
  );
};
