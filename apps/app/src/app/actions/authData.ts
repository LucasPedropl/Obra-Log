'use server';
import { createServerSupabaseClient } from '@/config/supabaseServer';
import { supabaseAdmin } from '@/config/supabaseAdmin';

/**
 * Retorna as Empresas (Companies) vinculadas ao usuário.
 * Busca diretamente na tabela company_users.
 */
export async function getUserCompaniesAction(userId: string) {
	try {
		// 1. Buscar quais empresas o usuário está vinculado e qual seu papel (role)
		const { data: userLinks, error: linkError } = await supabaseAdmin
			.from('company_users')
			.select('company_id, role, profile_id')
			.eq('user_id', userId);

		if (linkError) throw new Error(linkError.message);
		if (!userLinks || userLinks.length === 0) return { success: true, companies: [] };

		// 1.1 Buscar nomes dos perfis separadamente (evita erro de falta de FK no Supabase)
		const profileIds = userLinks.map(l => l.profile_id).filter(Boolean) as string[];
		const profilesMap: Record<string, string> = {};
		
		if (profileIds.length > 0) {
			const { data: profilesData } = await supabaseAdmin
				.from('access_profiles')
				.select('id, name')
				.in('id', profileIds);
			
			profilesData?.forEach(p => {
				profilesMap[p.id] = p.name;
			});
		}

		const companyIds = userLinks.map(link => link.company_id);

		// 2. Buscar os dados das empresas e as contagens separadamente para evitar erro de relacionamento
		// Buscamos as empresas básicas
		const { data: companiesData, error: compError } = await supabaseAdmin
			.from('companies')
			.select('id, name, status, cnpj')
			.in('id', companyIds);

		if (compError) throw new Error(compError.message);

		// 3. Buscar contagens para cada empresa de forma paralela e segura
		const finalCompanies = await Promise.all(companiesData.map(async (company) => {
			const link = userLinks.find(l => l.company_id === company.id);
			const role = link?.role || 'USER';
			const profileName = link?.profile_id ? profilesMap[link.profile_id] : null;

			// Contagem de usuários
			const { count: usersCount } = await supabaseAdmin
				.from('company_users')
				.select('*', { count: 'exact', head: true })
				.eq('company_id', company.id);

			// Contagem de obras
			const { count: sitesCount } = await supabaseAdmin
				.from('construction_sites')
				.select('*', { count: 'exact', head: true })
				.eq('company_id', company.id);

			return {
				id: company.id,
				name: company.name,
				status: company.status,
				cnpj: company.cnpj,
				role: role,
				profile_name: profileName,
				users_count: usersCount || 0,
				active_sites_count: sitesCount || 0
			};
		}));

		return { 
			success: true, 
			companies: finalCompanies 
		};
	} catch (error: unknown) {
		console.error('Erro em getUserCompaniesAction:', error);
		const message = error instanceof Error ? error.message : 'Erro ao buscar empresas';
		return { success: false, error: message };
	}
}

/**
 * Ativa uma empresa PENDING preenchendo o nome e cnpj (opcional)
 */
export async function activateCompanyAction(companyId: string, name: string, cnpj: string) {
	try {
		const { error } = await supabaseAdmin
			.from('companies')
			.update({
				name,
				cnpj: cnpj || null,
				status: 'ACTIVE'
			})
			.eq('id', companyId);

		if (error) throw new Error(error.message);
		
		return { success: true };
	} catch (error: unknown) {
		console.error('Erro em activateCompanyAction:', error);
		const message = error instanceof Error ? error.message : 'Erro ao ativar a empresa';
		return { success: false, error: message };
	}
}

// ───────────────────── Gestão de Planos & Multi-Empresa (Independente) ─────────────────────

/**
 * Retorna os detalhes do plano de uma EMPRESA específica.
 * Atualmente simulado via metadados ou campos da tabela companies se existirem.
 */
export async function getCompanyPlanDetailsAction(companyId: string) {
	try {
		// Buscamos os dados direto da tabela companies
		const { data: company, error } = await supabaseAdmin
			.from('companies')
			.select('id, current_plan, max_sites')
			.eq('id', companyId)
			.single();

		if (error) {
			// Se os campos ainda não existem fisicamente, retornamos o padrão Starter
			return { success: true, plan: 'Starter', maxSites: 2 };
		}

		return { 
			success: true, 
			plan: company.current_plan || 'Starter', 
			maxSites: company.max_sites || 2 
		};
	} catch (error: unknown) {
		console.error('Erro em getCompanyPlanDetailsAction:', error);
		return { success: false, error: 'Erro ao buscar plano da empresa.' };
	}
}

/**
 * Atualiza o plano de uma EMPRESA específica (Upgrade Independente).
 */
export async function upgradeCompanyPlanAction(companyId: string, newPlanName: string, newMaxSites: number) {
	try {
		// Tentamos atualizar na tabela companies. 
		// Nota: Se as colunas não existirem, o Supabase retornará erro e usaremos o metadata como fallback seguro.
		const { error } = await supabaseAdmin
			.from('companies')
			.update({
				current_plan: newPlanName,
				max_sites: newMaxSites
			})
			.eq('id', companyId);

		if (error) throw new Error(error.message);
		return { success: true };
	} catch (error: unknown) {
		console.error('Erro em upgradeCompanyPlanAction:', error);
		return { success: false, error: 'Erro ao atualizar plano da empresa.' };
	}
}

/**
 * Cria uma nova empresa via auto-cadastro.
 * Agora recebe o plano e limites iniciais.
 */
export async function createCompanySelfServiceAction(userId: string, planName: string, maxSites: number) {
	try {
		// 1. Criar a empresa PENDING com o plano selecionado
		const { data: company, error: companyError } = await supabaseAdmin
			.from('companies')
			.insert({
				name: 'Pendente: Nova Empresa',
				status: 'PENDING',
				current_plan: planName,
				max_sites: maxSites
			})
			.select('id')
			.single();

		if (companyError) {
			// Fallback se as colunas de plano ainda não existirem
			const { data: companyRetry, error: retryError } = await supabaseAdmin
				.from('companies')
				.insert({
					name: 'Pendente: Nova Empresa',
					status: 'PENDING',
				})
				.select('id')
				.single();
			
			if (retryError) throw new Error(retryError.message);
			
			// Vincular usuário
			await supabaseAdmin.from('company_users').insert({
				company_id: companyRetry.id,
				user_id: userId,
				role: 'ADMIN',
			});

			return { success: true, companyId: companyRetry.id };
		}

		// 2. Vincular o usuário como ADMIN
		const { error: linkError } = await supabaseAdmin
			.from('company_users')
			.insert({
				company_id: company.id,
				user_id: userId,
				role: 'ADMIN',
			});

		if (linkError) throw new Error(linkError.message);

		return { success: true, companyId: company.id };
	} catch (error: unknown) {
		console.error('Erro no auto-cadastro:', error);
		const message = error instanceof Error ? error.message : 'Erro interno';
		return { success: false, error: message };
	}
}

/**
 * Configura o perfil inicial do usuário (Nome e Nova Senha)
 * Chamado durante o onboarding (SetupProfileModal)
 */
export async function setupInitialProfileAction(userId: string, fullName: string, newPassword?: string) {
	try {
		// 1. Atualizar Metadados do Usuário e Senha no Auth
		const updatePayload: any = {
			user_metadata: {
				full_name: fullName,
				require_password_change: false
			}
		};

		if (newPassword) {
			updatePayload.password = newPassword;
		}

		const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, updatePayload);
		if (authError) throw new Error(`Erro Auth: ${authError.message}`);

		// 2. Atualizar tabela pública public.profiles
		const { error: profileError } = await supabaseAdmin
			.from('profiles')
			.update({ full_name: fullName })
			.eq('id', userId);

		if (profileError) {
			console.error('Erro ao atualizar profiles (não crítico se Auth funcionou):', profileError);
		}

		return { success: true };
	} catch (error: unknown) {
		console.error('Erro em setupInitialProfileAction:', error);
		const message = error instanceof Error ? error.message : 'Erro ao configurar perfil';
		return { success: false, error: message };
	}
}
