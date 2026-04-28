'use server';
import { createServerSupabaseClient } from '@/config/supabaseServer';

import { supabaseAdmin } from '@/config/supabaseAdmin';

/**
 * Verifica e retorna os dados de vínculos (companies) do usuário.
 * Bypassa o RLS usando supabaseAdmin.
 */
export async function getUserCompaniesAction(userId: string) {
	try {
		const { data, error } = await supabaseAdmin
			.from('company_users')
			.select(`
				company_id,
				companies (
					id,
					name,
					active,
					max_instances
				)
			`)
			.eq('user_id', userId);

		if (error) throw new Error(error.message);
		
		// Limpa o objeto retornado pelo join do Supabase
		const mappedCompanies = (data || []).map((item: any) => item.companies).filter(Boolean);
		return { success: true, companies: mappedCompanies };
	} catch (error: unknown) {
		console.error('Erro em getUserCompaniesAction:', error);
		const message = error instanceof Error ? error.message : 'Erro ao buscar empresas';
		return { success: false, error: message };
	}
}

/**
 * Verifica e retorna as instâncias (filiais/matriz) atreladas à empresa.
 * Bypassa o RLS usando supabaseAdmin.
 */
export async function getCompanyInstancesAction(companyId: string) {
	try {
		const { data, error } = await supabaseAdmin
			.from('companies')
			.select('id, name')
			.eq('parent_id', companyId);

		if (error) throw new Error(error.message);
		
		return { success: true, instances: data || [] };
	} catch (error: unknown) {
		console.error('Erro em getCompanyInstancesAction:', error);
		const message = error instanceof Error ? error.message : 'Erro ao buscar instâncias';
		return { success: false, error: message };
	}
}

/**
 * Cria de forma administrativa uma nova instância (filial) para a empresa do usuário logado.
 */
export async function createCompanyInstanceAction(companyId: string, name: string) {
	try {
		const { data, error } = await supabaseAdmin
			.from('companies')
			.insert({
				name,
				parent_id: companyId,
				active: true
			})
			.select()
			.single();

		if (error) throw new Error(error.message);
		
		return { success: true, instance: data };
	} catch (error: unknown) {
		console.error('Erro em createCompanyInstanceAction:', error);
		const message = error instanceof Error ? error.message : 'Erro ao criar instância';
		return { success: false, error: message };
	}
}

/**
 * Valida de forma administrativa se o usuário possui vínculo com QUALQUER empresa (usado no login).
 */
export async function checkUserHasCompanyLinkAction(userId: string) {
	try {
		const supabase = await createServerSupabaseClient();
		const { data, error } = await supabase
			.from('company_users')
			.select('id')
			.eq('user_id', userId)
			.limit(1)
			.maybeSingle();

		if (error) throw new Error(error.message);
		
		return { success: true, hasLink: !!data };
	} catch (error: unknown) {
		console.error('Erro em checkUserHasCompanyLinkAction:', error);
		const message = error instanceof Error ? error.message : 'Erro ao verificar vínculos do usuário';
		return { success: false, error: message };
	}
}
