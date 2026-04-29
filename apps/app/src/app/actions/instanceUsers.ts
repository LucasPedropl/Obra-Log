'use server';

import { supabaseAdmin } from '@/config/supabaseAdmin';
import { createServerSupabaseClient } from '@/config/supabaseServer';

export async function getInstanceUsersAction(instanceId: string) {
	const supabase = await createServerSupabaseClient();
	try {
		const { data, error } = await supabase
			.from('user_instance_access')
			.select(`
				id,
				created_at,
				profiles ( id, email, full_name ),
				access_profiles ( id, name )
			`)
			.eq('instance_id', instanceId)
			.order('created_at', { ascending: false });

		if (error) throw error;

		const formattedUsers = (data || []).map(ia => {
			const profile = ia.profiles;
			const accessProfile = ia.access_profiles;
			return {
				id: profile?.id,
				accessId: ia.id,
				email: profile?.email,
				full_name: profile?.full_name,
				profile: {
					id: accessProfile?.id,
					name: accessProfile?.name
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
	accountId: string;
}) {
	const supabase = await createServerSupabaseClient();
	try {
		// 1. Verificar se usuário existe no Profile ou criar no Auth
		let userId;
		const { data: existingProfile } = await supabase
			.from('profiles')
			.select('id')
			.eq('email', data.email)
			.maybeSingle();

		if (existingProfile) {
			userId = existingProfile.id;
			await supabase.from('profiles').update({ full_name: data.fullName }).eq('id', userId);
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
							const { data: profile } = await supabase.from('profiles').select('id').eq('id', existingAuthUser.id).maybeSingle();
							const { data: adminLinks } = await supabase.from('account_users').select('id').eq('user_id', existingAuthUser.id).limit(1);
							const { data: instanceLinks } = await supabase.from('user_instance_access').select('id').eq('user_id', existingAuthUser.id).limit(1);

							if (!profile && !adminLinks?.length && !instanceLinks?.length) {
								await supabaseAdmin.auth.admin.deleteUser(existingAuthUser.id);
								return saveInstanceUserAction(instanceId, data); 
							}
						}
					}
					throw new Error(authError.message);
				}

				userId = authUser.user.id;

				const { error: profileError } = await supabase.from('profiles').insert({
					id: userId,
					email: data.email,
					full_name: data.fullName,
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

		// 2. Vincular na instância com o perfil selecionado
		const { error: assignError } = await supabaseAdmin
			.from('user_instance_access')
			.upsert({
				user_id: userId,
				instance_id: instanceId,
				profile_id: data.profileId,
			}, { onConflict: 'user_id,instance_id' });

		if (assignError) throw new Error(assignError.message);

		return { success: true };
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Erro ao salvar usuário na instância';
		console.error('Error saving instance user:', error);
		return { success: false, error: message };
	}
}
