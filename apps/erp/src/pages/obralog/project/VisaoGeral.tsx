import React, { useEffect, useState } from 'react';
import { ERPLayout } from '../../../components/layout/ERPLayout';
import { useParams } from 'react-router-dom';
import { env } from '../../../config/env';
import { supabase } from '../../../config/supabase';
import {
	HardHat,
	Users,
	Wrench,
	Shield,
	ArrowRightLeft,
	Clock,
	AlertTriangle,
} from 'lucide-react';

export default function VisaoGeral() {
	const { id } = useParams();
	const [obra, setObra] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchProject() {
			if (!id) return;
			try {
				const res = await fetch(
					`${env.VITE_API_URL}/api/construction_sites/${id}`,
					{
						headers: {
							Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
						},
					},
				);
				if (res.ok) {
					const data = await res.json();
					setObra(data);
				}
			} catch (err) {
				console.error(err);
			} finally {
				setLoading(false);
			}
		}
		fetchProject();
	}, [id]);

	return (
		<ERPLayout>
			<div className="space-y-6">
				<div className="flex items-center gap-4 border-b border-border pb-6">
					<div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
						<HardHat size={32} />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-text-main">
							{loading
								? 'Carregando...'
								: obra?.name || 'Visão Geral da Obra'}
						</h1>
						<p className="text-text-muted">
							Acompanhe o status e as movimentações em tempo real.
						</p>
					</div>
				</div>

				{/* Cards de Resumo Estáticos/Mockados */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center">
								<Users size={24} />
							</div>
							<div>
								<p className="text-sm font-medium text-text-muted">
									Colaboradores
								</p>
								<h3 className="text-2xl font-bold text-text-main">
									0
								</h3>
							</div>
						</div>
					</div>

					<div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center">
								<Wrench size={24} />
							</div>
							<div>
								<p className="text-sm font-medium text-text-muted">
									Ferramentas na Obra
								</p>
								<h3 className="text-2xl font-bold text-text-main">
									0
								</h3>
							</div>
						</div>
					</div>

					<div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-lg flex items-center justify-center">
								<Shield size={24} />
							</div>
							<div>
								<p className="text-sm font-medium text-text-muted">
									EPIs Disponíveis
								</p>
								<h3 className="text-2xl font-bold text-text-main">
									0
								</h3>
							</div>
						</div>
					</div>

					<div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-lg flex items-center justify-center">
								<ArrowRightLeft size={24} />
							</div>
							<div>
								<p className="text-sm font-medium text-text-muted">
									Empréstimos Ativos
								</p>
								<h3 className="text-2xl font-bold text-text-main">
									0
								</h3>
							</div>
						</div>
					</div>
				</div>

				{/* Alertas e Atividades */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
					<div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
						<h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
							<AlertTriangle
								className="text-orange-500"
								size={20}
							/>
							Alertas da Obra
						</h3>
						<div className="space-y-3">
							<p className="text-sm text-text-muted text-center py-4">
								Nenhum alerta no momento.
							</p>
						</div>
					</div>

					<div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
						<h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
							<Clock className="text-blue-500" size={20} />
							Últimas Movimentações
						</h3>
						<div className="space-y-4">
							<p className="text-sm text-text-muted text-center py-4">
								Nenhuma movimentação registrada.
							</p>
						</div>
					</div>
				</div>
			</div>
		</ERPLayout>
	);
}
