'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useConfirm } from '@/components/shared/ConfirmDialog';
import { useToast } from '@/components/ui/toaster';
import { createClient } from '@/config/supabase';
import {
	changePasswordAction,
	requestAccountDeletionAction,
} from '@/app/actions/settingsSecurityActions';
import { clearTenantCookiesAction } from '@/app/actions/tenantActions';

export function SecurityTab() {
	const { addToast } = useToast();
	const confirm = useConfirm();
	const router = useRouter();
	const supabase = createClient();

	const [showPasswordForm, setShowPasswordForm] = useState(false);
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [saving, setSaving] = useState(false);

	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault();

		if (newPassword !== confirmPassword) {
			addToast('As senhas não coincidem', 'error');
			return;
		}

		setSaving(true);
		try {
			const result = await changePasswordAction({
				currentPassword,
				newPassword,
			});

			if (!result.success) throw new Error(result.error);

			addToast('Senha alterada com sucesso!', 'success');
			setShowPasswordForm(false);
			setCurrentPassword('');
			setNewPassword('');
			setConfirmPassword('');
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : 'Erro ao alterar senha';
			addToast(message, 'error');
		} finally {
			setSaving(false);
		}
	};

	const handleRequestDeletion = async () => {
		const ok = await confirm({
			title: 'Solicitar exclusão da conta',
			description:
				'Sua solicitação será registrada e processada em até 15 dias úteis, conforme a LGPD. Você será desconectado imediatamente.',
			confirmLabel: 'Confirmar solicitação',
			variant: 'destructive',
		});

		if (!ok) return;

		setSaving(true);
		try {
			const result = await requestAccountDeletionAction();
			if (!result.success) throw new Error(result.error);

			addToast('Solicitação registrada com sucesso.', 'success');
			await supabase.auth.signOut();
			await clearTenantCookiesAction();
			router.push('/auth/login');
			router.refresh();
		} catch (error: unknown) {
			const message =
				error instanceof Error
					? error.message
					: 'Erro ao solicitar exclusão';
			addToast(message, 'error');
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="p-6 space-y-6">
			<div className="border-b border-gray-100 pb-4">
				<h3 className="text-lg font-bold text-gray-900">Segurança da Conta</h3>
				<p className="text-sm text-gray-500">
					Proteja seu acesso e gerencie sua senha.
				</p>
			</div>

			<div className="space-y-4">
				<div className="border border-gray-100 hover:border-blue-200 transition-colors">
					<div className="flex items-center justify-between p-4">
						<div className="flex gap-4 items-center">
							<div className="w-10 h-10 bg-blue-50 text-blue-600 flex items-center justify-center">
								<Icon name="Key" size={20} />
							</div>
							<div>
								<h4 className="text-sm font-bold text-gray-900">
									Alterar Senha
								</h4>
								<p className="text-xs text-gray-500 mt-0.5">
									Recomendamos uma senha de no mínimo 8 caracteres.
								</p>
							</div>
						</div>
						<Button
							type="button"
							variant="outline"
							disabled={saving}
							onClick={() => setShowPasswordForm((v) => !v)}
							className="rounded-none text-[10px] font-bold uppercase tracking-widest px-4 border-gray-200"
						>
							{showPasswordForm ? 'Cancelar' : 'Redefinir'}
						</Button>
					</div>

					{showPasswordForm && (
						<form
							onSubmit={handleChangePassword}
							className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-4"
						>
							<Input
								type="password"
								placeholder="Senha atual"
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
								className="rounded-none h-11"
								required
							/>
							<Input
								type="password"
								placeholder="Nova senha"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								className="rounded-none h-11"
								required
								minLength={8}
							/>
							<Input
								type="password"
								placeholder="Confirmar nova senha"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								className="rounded-none h-11"
								required
								minLength={8}
							/>
							<Button
								type="submit"
								disabled={saving}
								className="bg-blue-600 hover:bg-blue-700 text-white rounded-none text-xs font-bold uppercase tracking-widest"
							>
								{saving ? 'Salvando...' : 'Salvar nova senha'}
							</Button>
						</form>
					)}
				</div>

				<div className="flex items-center justify-between p-4 border border-gray-100 hover:border-red-200 transition-colors">
					<div className="flex gap-4 items-center">
						<div className="w-10 h-10 bg-red-50 text-red-600 flex items-center justify-center">
							<Icon name="WarningCircle" size={20} />
						</div>
						<div>
							<h4 className="text-sm font-bold text-red-900">
								Excluir Minha Conta
							</h4>
							<p className="text-xs text-red-500 mt-0.5">
								Solicite a exclusão dos seus dados pessoais (LGPD Art. 18).
							</p>
						</div>
					</div>
					<Button
						type="button"
						variant="ghost"
						disabled={saving}
						onClick={handleRequestDeletion}
						className="rounded-none text-[10px] font-bold uppercase tracking-widest px-4 text-red-600 hover:bg-red-50"
					>
						Excluir
					</Button>
				</div>
			</div>
		</div>
	);
}
