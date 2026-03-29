/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { AppRouter } from './routes/AppRouter';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { supabase } from './config/supabase';

export default function App() {
	useEffect(() => {
		// Lógica para 'Manter Sessão' ativada/desativada
		const checkSessionPersistence = async () => {
			const keepSession = localStorage.getItem('keep_session');
			const sessionActive = sessionStorage.getItem('session_is_active');

			if (keepSession === 'false' && !sessionActive) {
				// Se a pessoa não pediu para lembrar a senha e está abrindo uma nova aba/janela,
				// limpamos a sessão do Supabase logando-a pra fora.
				await supabase.auth.signOut();
				localStorage.removeItem('selectedCompanyId');
			} else {
				// Marca que a aba atual possui navegação ativa
				sessionStorage.setItem('session_is_active', '1');
			}
		};

		checkSessionPersistence();
	}, []);

	return (
		<ThemeProvider>
			<ToastProvider>
				<AppRouter />
			</ToastProvider>
		</ThemeProvider>
	);
}
