import React, { useState } from 'react';
import { ERPLayout } from '../../components/layout/ERPLayout';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { adminService } from '../../features/admin/services/admin.service';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../features/auth/services/auth.service';

export default function ConfiguracoesAdmin() {
	const { showToast } = useToast();
	const [loadingWipe, setLoadingWipe] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	const handleWipeDatabase = async () => {
		try {
			setLoadingWipe(true);
			const currentUser = await authService.getCurrentUser();
			if (!currentUser) throw new Error('Usuário não logado');

			await adminService.deleteDatabase(currentUser.id);
			showToast(
				'Banco de dados excluído com sucesso (mantendo conta atual)',
				'success',
			);
			setShowConfirm(false);
		} catch (err: any) {
			showToast(err.message || 'Erro ao excluir banco de dados', 'error');
		} finally {
			setLoadingWipe(false);
		}
	};

	return (
		<ERPLayout>
			<div className="p-6 max-w-4xl mx-auto">
				<h1 className="text-2xl font-bold text-slate-900 mb-6">
					Configurações Gerais
				</h1>

				<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
					<div className="p-6 border-b border-slate-200">
						<h2 className="text-lg font-bold text-slate-800">
							Geral
						</h2>
						<p className="text-slate-600 mt-1">
							Ajuste as configurações globais do sistema.
						</p>
					</div>
				</div>

				<div className="bg-red-50 rounded-xl shadow-sm border border-red-200 overflow-hidden">
					<div className="p-6">
						<div className="flex items-start gap-4">
							<div className="p-3 bg-red-100 text-red-600 rounded-lg shrink-0">
								<AlertTriangle className="w-6 h-6" />
							</div>
							<div>
								<h2 className="text-lg font-bold text-red-900">
									Zona de Perigo: Excluir Banco de Dados
								</h2>
								<p className="text-red-700 mt-1 text-sm">
									Esta ação apagará permanentemente TODAS as
									empresas, obras, usuários, e configurações
									do sistema. Apenas a sua conta de Super
									Administrador (logada atualmente) será
									mantida. Esta ação{' '}
									<span className="font-bold underline">
										não pode ser desfeita
									</span>
									.
								</p>

								<div className="mt-6">
									{!showConfirm ? (
										<button
											onClick={() => setShowConfirm(true)}
											className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
										>
											<Trash2 className="w-5 h-5" />
											Apagar todo o Banco de Dados
										</button>
									) : (
										<div className="bg-white p-4 rounded-lg border border-red-200 inline-block shadow-sm">
											<p className="font-bold text-slate-800 mb-3 text-sm">
												Tem certeza absoluta? Digite sua
												decisão:
											</p>
											<div className="flex items-center gap-3">
												<button
													onClick={handleWipeDatabase}
													disabled={loadingWipe}
													className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
												>
													{loadingWipe ? (
														<Loader2 className="w-5 h-5 animate-spin" />
													) : (
														<Trash2 className="w-5 h-5" />
													)}
													Sim, APAGAR TUDO
												</button>
												<button
													onClick={() =>
														setShowConfirm(false)
													}
													disabled={loadingWipe}
													className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 bg-white disabled:opacity-50"
												>
													Cancelar
												</button>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</ERPLayout>
	);
}
