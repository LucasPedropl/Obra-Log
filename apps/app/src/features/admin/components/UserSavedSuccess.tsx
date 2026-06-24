import { Button } from '@/components/ui/button';
import { Info, UserCheck } from 'lucide-react';

interface UserSavedSuccessProps {
	isNewUser: boolean;
	generatedPassword: string | null;
	onClose: () => void;
}

export function UserSavedSuccess({
	isNewUser,
	generatedPassword,
	onClose,
}: UserSavedSuccessProps) {
	return (
		<div className="bg-white rounded-xl p-8 text-center flex flex-col items-center gap-4">
			<div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
				<UserCheck className="w-8 h-8 text-green-600" />
			</div>
			<h3 className="text-xl font-bold text-gray-900">
				{isNewUser ? 'Usuário Criado!' : 'Usuário Atualizado!'}
			</h3>
			<p className="text-gray-500">
				{isNewUser
					? 'O acesso foi configurado com sucesso para esta empresa.'
					: 'As alterações de perfil e obras foram salvas.'}
			</p>

			{generatedPassword ? (
				<div className="w-full bg-blue-50 border border-blue-100 rounded-lg p-4 mt-2">
					<p className="text-xs font-bold text-blue-600 uppercase mb-2">
						Credenciais de Acesso
					</p>
					<div className="flex flex-col gap-2 text-left">
						<p className="text-sm font-medium text-gray-700">Senha Provisória:</p>
						<code className="bg-white px-3 py-2 rounded border border-blue-200 text-blue-700 font-mono text-lg block">
							{generatedPassword}
						</code>
					</div>
				</div>
			) : isNewUser ? null : (
				<div className="w-full bg-amber-50 border border-orange-100 rounded-lg p-4 mt-2 flex items-start gap-3 text-left">
					<Info className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
					<p className="text-sm text-orange-800">
						Como o usuário já existe, ele deve utilizar a senha atual para entrar.
					</p>
				</div>
			)}

			<Button onClick={onClose} className="w-full mt-4">
				Concluir e Voltar
			</Button>
		</div>
	);
}
