import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: Isso renova a sessão se o token estiver expirado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname.startsWith('/login');

  // Redireciona para o login se não houver usuário e não estiver na tela de login
  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // Adiciona o parâmetro de redirecionamento para voltar após o login
    url.searchParams.set('next', request.nextUrl.pathname);
    
    const response = NextResponse.redirect(url);
    
    // Copiar cookies da supabaseResponse (que podem conter instruções de limpeza de cookies inválidos)
    supabaseResponse.cookies.getAll().forEach(cookie => {
      response.cookies.set(cookie.name, cookie.value);
    });
    
    return response;
  }

  // Se o usuário estiver logado e tentar acessar a tela de login, manda para o dashboard
  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    
    // Criar a resposta de redirecionamento
    const response = NextResponse.redirect(url);
    
    // IMPORTANTE: Se o getUser renovou o token, precisamos passar os novos cookies para o redirecionamento
    // Como o supabase-ssr pode ter chamado setAll, a supabaseResponse já tem os cookies.
    // Vamos copiar os cookies da supabaseResponse para a nossa nova resposta de redirecionamento.
    supabaseResponse.cookies.getAll().forEach(cookie => {
      response.cookies.set(cookie.name, cookie.value);
    });
    
    return response;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
