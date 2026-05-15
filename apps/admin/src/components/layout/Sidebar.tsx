'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MaterialIcon } from '../ui/MaterialIcon';
import { useAuth } from '@/components/providers/AuthContext';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { name: 'Empresas', href: '/empresas', icon: 'apartment' },
    { name: 'Infraestrutura', href: '/infraestrutura', icon: 'storage' },
  ];

  return (
    <aside 
      className={cn(
        "bg-slate-900 flex flex-col transition-all duration-300 ease-in-out shrink-0 overflow-hidden",
        isOpen ? "w-64" : "w-20"
      )}
    >
      <div className={cn(
        "h-16 flex items-center border-b border-slate-800 transition-all px-6",
        isOpen ? "justify-start" : "justify-center px-0"
      )}>
        {isOpen ? (
          <span className="text-xl font-bold text-white tracking-tight whitespace-nowrap">
            Obra<span className="text-blue-400">Log</span> <span className="text-xs text-slate-400 ml-1">ADMIN</span>
          </span>
        ) : (
          <div className="flex items-center justify-center bg-blue-600 w-10 h-10 rounded-lg">
            <span className="text-white font-bold">O</span>
          </div>
        )}
      </div>
      
      <div className="flex-1 py-6 overflow-y-auto overflow-x-hidden">
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            
            return (
              <Link
                key={item.name}
                href={item.href}
                title={!isOpen ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isOpen ? "px-3 py-2" : "h-12 w-12 mx-auto justify-center",
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <MaterialIcon 
                  icon={item.icon} 
                  size={20} 
                  fill={isActive}
                  weight={isActive ? 600 : 400}
                  className={isActive ? 'text-white' : 'text-slate-400'} 
                />
                {isOpen && <span className="whitespace-nowrap transition-opacity duration-300">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          title={!isOpen ? "Sair do Sistema" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200",
            isOpen ? "px-3 py-2 w-full" : "h-12 w-12 mx-auto justify-center"
          )}
        >
          <MaterialIcon icon="logout" size={20} className="text-slate-400" />
          {isOpen && <span className="whitespace-nowrap">Sair do Sistema</span>}
        </button>
      </div>
    </aside>
  );
}
