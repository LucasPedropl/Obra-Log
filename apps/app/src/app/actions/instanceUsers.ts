'use server';

import { supabaseAdmin } from '@/config/supabaseAdmin';
import { createServerSupabaseClient } from '@/config/supabaseServer';

export async function getInstanceUsersAction(instanceId: string) {
	const supabase = await createServerSupabaseClient();
	try {
		const { data, error } = await supabase
			.from('instance_users')
			.select(`
				id,
				status,
				users ( id, email, full_name ),
				access_profiles ( id, name )
			`)
			.eq('instance_id', instanceId)
			.order('created_at', { ascending: false });

		if (error) throw error;

		const formattedUsers = data.map(iu => {
			const user = Array.isArray(iu.users) ? iu.users[0] : iu.users;
			const profile = Array.isArray(iu.access_profiles) ? iu.access_profiles[0] : iu.access_profiles;
			return {
				id: user?.id,
				instanceUserId: iu.id,
				email: user?.email,
				full_name: user?.full_name,
				status: iu.status,
				profile: {
					id: profile?.id,
					name: profile?.name
				}
			};
		});

		return { success: true, users: formattedUsers };
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Erro ao buscar usuários da instância';
		console.error('Error fetching instance users:', error);
		return { success: false, error: message };
	}
}

export async function saveInstanceUserAction(instanceId: string, data: {
	email: string;
	fullName: string;
	profileId: string;
	companyId: string;
}) {
	const supabase = await createServerSupabaseClient();
	try {
		// 1. Check if user exists or create
		let userId;
		const { data: existingUser } = await supabase
			.from('users')
			.select('id')
			.eq('email', data.email)
			.maybeSingle();

		if (existingUser) {
			userId = existingUser.id;
			// Atualiza o nome se foi fornecido
			await supabase.from('users').update({ full_name: data.fullName }).eq('id', userId);
		} else {
			try {
				const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
				const { data: authUser, error: authError } =
					await supabaseAdmin.auth.admin.createUser({
						email: data.email,
						password: tempPassword,
						email_confirm: true,
						user_metadata: {
							require_password_change: true,
							full_name: data.fullName,
							temp_password: tempPassword,
						},
					});

				if (authError) {
					// Detectar órfão
					if (authError.message.toLowerCase().includes('already been registered')) {
						const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers();
						const existingAuthUser = allUsers.find(u => u.email === data.email);

						if (existingAuthUser) {
							const { data: profile } = await supabase.from('users').select('id').eq('id', existingAuthUser.id).maybeSingle();
							const { data: links } = await supabase.from('company_users').select('id').eq('user_id', existingAuthUser.id).limit(1);

							if (!profile && (!links || links.length === 0)) {
								await supabaseAdmin.auth.admin.deleteUser(existingAuthUser.id);
								return saveInstanceUserAction(instanceId, data); // Tentar novamente
							}
						}
					}
					throw new Error(authError.message);
				}

				userId = authUser.user.id;

				const { error: profileError } = await supabase.from('users').insert({
					id: userId,
					email: data.email,
					full_name: data.fullName,
					is_super_admin: false,
					require_password_change: true,
					temp_password: tempPassword,
				});

				if (profileError) {
					await supabaseAdmin.auth.admin.deleteUser(userId);
					throw profileError;
				}
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Erro ao criar usuário no Auth';
				throw new Error(message);
			}
		}

		// 2. Garantir vínculo global na empresa
		await supabase
			.from('company_users')
			.upsert({
				company_id: data.companyId,
				user_id: userId,
				is_company_admin: false,
				status: 'ACTIVE',
			}, { onConflict: 'user_id,company_id' });

		// 3. Vincular na instância
		const { error: assignError } = await supabase
			.from('instance_users')
			.upsert({
				user_id: userId,
				instance_id: instanceId,
				profile_id: data.profileId,
				status: 'ACTIVE',
			}, { onConflict: 'user_id,instance_id' });

		if (assignError) throw new Error(assignError.message);

		return { success: true };
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Erro ao salvar usuário na instância';
		console.error('Error saving instance user:', error);
		return { success: false, error: message };
	}
}
