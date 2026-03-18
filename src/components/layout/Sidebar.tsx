import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, HardHat, Settings, ChevronLeft, ChevronRight, List } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const navItems = [
    { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
    { name: 'Cadastro de Obras', path: '/app/obras/nova', icon: HardHat },
    { name: 'Listagem de Obras', path: '/app/obras', icon: List },
  ];

  return (
    <aside className={`bg-slate-950 border-r border-slate-800 transition-all duration-300 flex flex-col relative z-20 ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        {isOpen && <span className="text-emerald-500 font-bold text-xl truncate">ObraLog</span>}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className={`text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors ${!isOpen && 'mx-auto'}`}
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive ? 'bg-emerald-900/30 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              } ${!isOpen && 'justify-center'}`
            }
          >
            <item.icon size={22} className="shrink-0" />
            {isOpen && <span className="font-medium truncate">{item.name}</span>}
            
            {/* Tooltip for closed state */}
            {!isOpen && (
              <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-slate-700 shadow-xl">
                {item.name}
                {/* Tooltip arrow */}
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-4 border-r-4 border-y-transparent border-r-slate-800"></div>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-800">
        <NavLink
          to="/app/configuracoes"
          className={({ isActive }) =>
            `group relative flex items-center gap-3 p-3 rounded-lg transition-colors ${
              isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            } ${!isOpen && 'justify-center'}`
          }
        >
          <Settings size={22} className="shrink-0" />
          {isOpen && <span className="font-medium truncate">Configurações</span>}
          
          {/* Tooltip for closed state */}
          {!isOpen && (
            <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-slate-700 shadow-xl">
              Configurações
              {/* Tooltip arrow */}
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-4 border-r-4 border-y-transparent border-r-slate-800"></div>
            </div>
          )}
        </NavLink>
      </div>
    </aside>
  );
};
