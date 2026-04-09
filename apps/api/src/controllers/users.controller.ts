import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

// ============================================================================
// SUPER-ADMIN USER OPERATIONS
// ============================================================================

export const createAdminUser = async (req: Request, res: Response) => {
	try {
		const { companyId, email } = req.body;

		if (!companyId || !email) {
			return res
				.status(400)
				.json({ error: 'Dados incompletos para criar o usuário.' });
		}

		// Gera senha temporária segura
		const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';

		const fullPerms = {
			obras: {
				view: true,
				create: true,
				edit: true,
				delete: true,
				access_type: 'all',
			},
			colaboradores: {
				view: true,
				create: true,
				edit: true,
				delete: true,
			},
			ferramentas: { view: true, create: true, edit: true, delete: true },
			epis: { view: true, create: true, edit: true, delete: true },
			equip_alugados: {
				view: true,
				create: true,
				edit: true,
				delete: true,
			},
			movimentacoes: {
				view: true,
				create: true,
				edit: true,
				delete: true,
			},
			insumos: { view: true, create: true, edit: true, delete: true },
			mao_de_obra: { view: true, create: true, edit: true, delete: true },
			relatorios: { view: true, create: true, edit: true, delete: true },
			usuarios: { view: true, create: true, edit: true, delete: true },
			perfis: { view: true, create: true, edit: true, delete: true },
		};

		// 1. Cria usuário no Auth
		const { data: authUser, error: authError } =
			await supabaseAdmin.auth.admin.createUser({
				email,
				password: tempPassword,
				email_confirm: true,
				user_metadata: {
					require_password_change: true,
					full_name: 'Administrador',
					temp_password: tempPassword,
				},
			});

		if (authError) throw authError;

		// 2. Busca ou cria o perfil Administrador para esta empresa
		let profileId = null;
		const { data: existingProfile } = await supabaseAdmin
			.from('access_profiles')
			.select('id')
			.eq('company_id', companyId)
			.eq('name', 'Administrador Padrão')
			.single();

		if (existingProfile) {
			profileId = existingProfile.id;
		} else {
			const { data: newProfile, error: profileError } =
				await supabaseAdmin
					.from('access_profiles')
					.insert({
						company_id: companyId,
						name: 'Administrador Padrão',
						scope: 'ALL_SITES',
						permissions: fullPerms,
						allowed_sites: [],
					})
					.select()
					.single();

			if (!profileError && newProfile) {
				profileId = newProfile.id;
			}
		}

		// 3. Vincula usuário à empresa PRINCIPAL
		const { error: linkError } = await supabaseAdmin
			.from('company_users')
			.insert({
				company_id: companyId,
				user_id: authUser.user.id,
				profile_id: profileId,
				status: 'ACTIVE',
			});

		if (linkError) throw linkError;

		res.status(201).json({ email, tempPassword, userId: authUser.user.id });
	} catch (err: any) {
		console.error('❌ Erro ao criar usuário admin:', err);
		res.status(400).json({ error: err.message });
	}
};

export const resetUserPassword = async (req: Request, res: Response) => {
	try {
		const { userId } = req.params;
		const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';

		const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
			userId,
			{
				password: tempPassword,
				user_metadata: {
					require_password_change: true,
					temp_password: tempPassword,
				},
			},
		);

		if (error) throw error;

		res.json({ email: data.user.email, tempPassword });
	} catch (err: any) {
		console.error('❌ Erro ao resetar senha:', err);
		res.status(400).json({ error: err.message });
	}
};

// ============================================================================
// TENANT USER OPERATIONS (GEPLANO PANEL)
// ============================================================================

export const getTenantUsers = async (req: Request, res: Response) => {
	try {
		const { company_id } = req.query;
		if (!company_id) {
			return res.status(400).json({ error: 'company_id é obrigatório.' });
		}

		const { data, error } = await supabaseAdmin
			.from('company_users')
			.select(
				`
        id,
        status,
        profile_id,
        access_profiles ( name ),
        users ( id, email, full_name )
      `,
			)
			.eq('company_id', company_id as string);

		if (error) throw error;

		// Fetch from auth.admin
		const { data: authData, error: authError } =
			await supabaseAdmin.auth.admin.listUsers();
		if (authError) throw authError;

		const users = data.map((cu: any) => {
			const userRecord = cu.users || {};
			const authUser = authData.users.find((u) => u.id === userRecord.id);

			return {
				id: userRecord.id,
				email: userRecord.email,
				full_name: userRecord.full_name,
				status: cu.status,
				profile_id: cu.profile_id,
				profile_name: cu.access_profiles?.name || 'Sem perfil',
				temp_password: authUser?.user_metadata?.temp_password || null,
				require_password_change:
					authUser?.user_metadata?.require_password_change || false,
			};
		});

		res.status(200).json(users);
	} catch (err: any) {
		res.status(400).json({ error: err.message });
	}
};

export const createTenantUser = async (req: Request, res: Response) => {
	try {
		const { company_id, email, full_name, profile_id } = req.body;

		if (!company_id || !email || !full_name) {
			return res
				.status(400)
				.json({ error: 'Campos obrigatórios faltando.' });
		}

		const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';

		const { data: authUser, error: authError } =
			await supabaseAdmin.auth.admin.createUser({
				email,
				password: tempPassword,
				email_confirm: true,
				user_metadata: {
					require_password_change: true,
					full_name,
					temp_password: tempPassword,
				},
			});

		if (authError) {
			return res.status(400).json({ error: authError.message });
		}

		// Garante que existe no public.users (caso a trigger não faça ou atrase)
		await supabaseAdmin.from('users').upsert({
			id: authUser.user.id,
			email,
			full_name,
			is_super_admin: false,
		});

		const { error: companyUserError } = await supabaseAdmin
			.from('company_users')
			.insert({
				company_id,
				user_id: authUser.user.id,
				profile_id: profile_id || null,
				status: 'ACTIVE',
			});

		if (companyUserError) throw companyUserError;

		res.status(201).json({
			user: { id: authUser.user.id, email, full_name },
			tempPassword,
		});
	} catch (err: any) {
		res.status(400).json({ error: err.message });
	}
};
