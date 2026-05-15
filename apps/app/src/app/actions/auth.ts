'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/config/supabaseServer';
import { getUserCompaniesAction } from './authData';

export async function loginAction(formData: any) {
  const supabase = await createServerSupabaseClient();
  const cookieStore = await cookies();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const user = data.user;

  // 1. Se precisar trocar senha, mandamos para o setup (onboarding)
  if (user.user_metadata?.require_password_change) {
    redirect('/empresas');
  }

  // 2. Buscamos as empresas do usuário
  const result = await getUserCompaniesAction(user.id);
  
  if (result.success && result.companies && result.companies.length === 1) {
    const company = result.companies[0];
    
    if (company.status === 'ACTIVE') {
      // 3. SE SÓ TEM UMA EMPRESA: Seta o cookie e vai direto pro Dashboard
      cookieStore.set('selectedCompanyId', company.id, {
        path: '/',
        maxAge: 86400,
        sameSite: 'lax',
      });
      
      redirect('/dashboard');
    }
  }

  // 4. Se tiver múltiplas empresas ou precisar de ativação, vai para seleção
  redirect('/empresas');
}
