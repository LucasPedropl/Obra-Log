import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, HardHat, Settings, ChevronLeft, ChevronRight, List } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const navItems = [
    { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
    { name: 'Obras', path: '/app/obras', icon: HardHat },
    { name: 'Listagem', path: '/app/listagem', icon: List },
  ];

  return (
    <aside className={`bg-slate-950 border-r border-slate-800 transition-all duration-300 flex flex-col ${isOpen ? 'w-64' : 'w-16'}`}>
      <div className="p-4 flex items-center justify-between border-b border-slate-800">
        {isOpen && <span className="text-white font-bold">ObraLog</span>}
        <button onClick={() => setIsOpen(!isOpen)} className="text-slate-400 hover:text-white">
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive ? 'bg-emerald-900/30 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
            title={!isOpen ? item.name : undefined}
          >
            <item.icon size={20} />
            {isOpen && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-slate-800">
        <NavLink
          to="/app/configuracoes"
          className={({ isActive }) =>
            `flex items-center gap-3 p-3 rounded-lg transition-colors ${
              isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`
          }
          title={!isOpen ? 'Configurações' : undefined}
        >
          <Settings size={20} />
          {isOpen && <span>Configurações</span>}
        </NavLink>
      </div>
    </aside>
  );
};
