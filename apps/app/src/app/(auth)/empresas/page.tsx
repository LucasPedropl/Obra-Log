import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/config/supabaseServer';
import { SelectCompanyClient } from './SelectCompanyClient';
import { getUserCompaniesAction } from '@/app/actions/authData';

export default async function EmpresasPage() {
	const supabase = await createServerSupabaseClient();
	const { data: { user } } = await supabase.auth.getUser();

	if (!user) {
		redirect('/auth/login');
	}

	// Buscamos as empresas no servidor para evitar "flicker" de loading excessivo
	const result = await getUserCompaniesAction(user.id);
	
	if (!result.success) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700">
					Erro ao carregar empresas: {result.error}
				</div>
			</div>
		);
	}

	const companies = result.companies || [];

	// OBSERVAÇÃO: Não tentamos setar cookies aqui (Server Component).
	// Passamos a lista para o SelectCompanyClient que cuidará do auto-select se necessário.
	return <SelectCompanyClient initialCompanies={companies} user={user} />;
}
