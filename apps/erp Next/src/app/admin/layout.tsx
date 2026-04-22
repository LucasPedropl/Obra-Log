import React from 'react';
import { Settings, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex h-screen bg-gray-50">
			{/* Admin Sidebar */}
			<aside className="hidden md:flex w-64 flex-col bg-white border-r">
				<div className="flex h-14 items-center border-b px-6">
					<Settings className="w-5 h-5 mr-3 text-blue-600" />
					<span className="font-semibold text-gray-900 leading-tight tracking-tight">
						Admin<span className="text-blue-600">Global</span>
					</span>
				</div>
				<nav className="flex-1 space-y-1 p-4">
					<Link
						href="/admin/usuarios"
						className="flex items-center rounded-lg px-3 py-2 text-sm font-medium bg-blue-50 text-blue-700"
					>
						<Users className="w-5 h-5 mr-3" />
						Usuários Globais
					</Link>
				</nav>
				<div className="border-t p-4">
					<Link
						href="/selecionar-instancia"
						className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100"
					>
						<ArrowLeft className="w-5 h-5 mr-3" />
						Voltar para ERP
					</Link>
				</div>
			</aside>

			<main className="flex-1 flex flex-col overflow-hidden">
				<header className="bg-white border-b h-14 flex items-center justify-between px-6">
					<h1 className="font-medium text-gray-800">
						Painel de Administração Global
					</h1>
				</header>
				<div className="flex-1 overflow-auto p-6">
					<div className="mx-auto max-w-6xl">{children}</div>
				</div>
			</main>
		</div>
	);
}
