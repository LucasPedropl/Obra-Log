import { supabase } from '../../../config/supabase';
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

export type LoginDTO = z.infer<typeof loginSchema>;

export const authService = {
  async login(data: LoginDTO) {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) throw error;

    // Verifica se o usuário é super admin (se for login no painel admin)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_super_admin')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (userError) throw userError;

    if (!userData) {
      await supabase.auth.signOut();
      throw new Error('Perfil não encontrado. A sincronização do usuário falhou no banco de dados.');
    }

    return {
      user: authData.user,
      isSuperAdmin: userData.is_super_admin,
    };
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) throw new Error('Usuário não autenticado');
    return user;
  }
};

