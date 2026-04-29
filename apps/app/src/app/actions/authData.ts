'use server';
import { createServerSupabaseClient } from '@/config/supabaseServer';
import { supabaseAdmin } from '@/config/supabaseAdmin';

/**
 * Retorna as Contas (Accounts) do usuário e o seu papel (ADMIN ou User).
 * Busca em account_users (Global Admins) e user_instance_access (Usuários Locais).
 */
export async function getUserAccountsAction(userId: string) {
	try {
		// 1. Tentar achar o usuário como Admin da Conta
		const { data: adminData, error: adminErr } = await supabaseAdmin
			.from('account_users')
			.select('account_id, accounts(id, company_name, status, max_instances)')
			.eq('user_id', userId);

		if (adminErr) throw new Error(adminErr.message);

		// Se for admin, retorna as contas
		if (adminData && adminData.length > 0) {
			const accounts = adminData.map((item: any) => item.accounts).filter(Boolean);
			return { success: true, isGlobalAdmin: true, accounts };
		}

		// 2. Tentar achar o usuário como Usuário de Instância
		const { data: instanceData, error: instanceErr } = await supabaseAdmin
			.from('user_instance_access')
			.select('instance_id, instances(account_id, accounts(id, company_name, status, max_instances))')
			.eq('user_id', userId);

		if (instanceErr) throw new Error(instanceErr.message);

		if (instanceData && instanceData.length > 0) {
			// Extrair contas únicas
			const uniqueAccountsMap = new Map();
			instanceData.forEach((item: any) => {
				const acc = item.instances?.accounts;
				if (acc && !uniqueAccountsMap.has(acc.id)) {
					uniqueAccountsMap.set(acc.id, acc);
				}
			});
			const accounts = Array.from(uniqueAccountsMap.values());
			return { success: true, isGlobalAdmin: false, accounts };
		}

		// Nenhum vínculo
		return { success: true, isGlobalAdmin: false, accounts: [] };
	} catch (error: unknown) {
		console.error('Erro em getUserAccountsAction:', error);
		const message = error instanceof Error ? error.message : 'Erro ao buscar contas';
		return { success: false, error: message };
	}
}

/**
 * Verifica e retorna as instâncias (filiais) atreladas à conta, as quais o usuário tem acesso.
 */
export async function getAccountInstancesAction(accountId: string, userId: string, isGlobalAdmin: boolean) {
	try {
		if (isGlobalAdmin) {
			// Admin vê todas as instâncias da conta
			const { data, error } = await supabaseAdmin
				.from('instances')
				.select('id, name')
				.eq('account_id', accountId)
				.order('name');

			if (error) throw new Error(error.message);
			return { success: true, instances: data || [] };
		} else {
			// Usuário vê apenas as instâncias vinculadas
			const { data, error } = await supabaseAdmin
				.from('user_instance_access')
				.select('instance_id, instances!inner(id, name, account_id)')
				.eq('user_id', userId)
				.eq('instances.account_id', accountId);

			if (error) throw new Error(error.message);
			const instances = (data || []).map((item: any) => item.instances).filter(Boolean);
			return { success: true, instances };
		}
	} catch (error: unknown) {
		console.error('Erro em getAccountInstancesAction:', error);
		const message = error instanceof Error ? error.message : 'Erro ao buscar instâncias';
		return { success: false, error: message };
	}
}

/**
 * Cria uma nova instância (filial) para a conta selecionada.
 */
export async function createInstanceAction(accountId: string, name: string) {
	try {
		const { data, error } = await supabaseAdmin
			.from('instances')
			.insert({
				name,
				account_id: accountId,
				status: 'ACTIVE'
			})
			.select()
			.single();

		if (error) throw new Error(error.message);
		
		return { success: true, instance: data };
	} catch (error: unknown) {
		console.error('Erro em createInstanceAction:', error);
		const message = error instanceof Error ? error.message : 'Erro ao criar instância';
		return { success: false, error: message };
	}
}

/**
 * Ativa uma conta PENDING preenchendo o nome da empresa e cnpj (opcional)
 */
export async function activateAccountAction(accountId: string, companyName: string, cnpj: string) {
	try {
		const { error } = await supabaseAdmin
			.from('accounts')
			.update({
				company_name: companyName,
				cnpj: cnpj || null,
				status: 'ACTIVE'
			})
			.eq('id', accountId);

		if (error) throw new Error(error.message);
		
		return { success: true };
	} catch (error: unknown) {
		console.error('Erro em activateAccountAction:', error);
		const message = error instanceof Error ? error.message : 'Erro ao ativar a conta';
		return { success: false, error: message };
	}
}
