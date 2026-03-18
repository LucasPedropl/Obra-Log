import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import dotenv from "dotenv";

// Carrega as variáveis do .env
dotenv.config();

async function startServer() {
  const app = express();
  // O Render injeta a variável PORT automaticamente
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Middlewares
  app.use(cors()); // Permite requisições de outros domínios (ex: frontend na Vercel, backend no Render)
  app.use(express.json());

  // ============================================================================
  // ROTAS DA API (BACKEND SEGURO)
  // ============================================================================
  
  // Inicializa o cliente Admin apenas no servidor (Seguro)
  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Rota para criar uma nova Empresa (Tenant)
  app.post("/api/admin/companies", async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: "O nome da empresa é obrigatório." });

      const { data, error } = await supabaseAdmin
        .from('companies')
        .insert({ name })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json(data);
    } catch (err: any) {
      console.error("❌ Erro ao criar empresa:", err);
      res.status(400).json({ error: err.message });
    }
  });

  // Rota para criar um Usuário Admin para uma Empresa
  app.post("/api/admin/users", async (req, res) => {
    try {
      const { companyId, email, fullName } = req.body;
      
      if (!companyId || !email) {
        return res.status(400).json({ error: "Dados incompletos para criar o usuário." });
      }

      // Gera senha temporária segura
      let tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
      let userId = '';

      // 1. Cria usuário no Auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { 
          full_name: fullName || '',
          require_password_change: true
        }
      });

      if (authError) {
        if (authError.message.includes('already been registered')) {
          // Usuário já existe, vamos buscar o ID dele na tabela public.users
          const { data: existingUser, error: searchError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', email)
            .single();
            
          if (searchError || !existingUser) {
             throw new Error("Usuário já existe no Auth mas não foi encontrado na tabela public.users.");
          }
          userId = existingUser.id;
          tempPassword = 'O usuário já possui uma senha';
        } else {
          throw authError;
        }
      } else {
        userId = authUser.user.id;
      }

      // 2. Vincula usuário à empresa
      // Primeiro verifica se já está vinculado
      const { data: existingLink } = await supabaseAdmin
        .from('company_users')
        .select('id')
        .eq('company_id', companyId)
        .eq('user_id', userId)
        .maybeSingle();
        
      if (existingLink) {
        return res.status(400).json({ error: "Este usuário já está vinculado a esta empresa." });
      }

      const { error: linkError } = await supabaseAdmin
        .from('company_users')
        .insert({
          company_id: companyId,
          user_id: userId,
          status: 'ACTIVE'
        });

      if (linkError) throw linkError;

      res.status(201).json({ email, tempPassword, userId });
    } catch (err: any) {
      console.error("❌ Erro ao criar usuário:", err);
      res.status(400).json({ error: err.message });
    }
  });

  // Rota para listar usuários de uma empresa
  app.get("/api/admin/companies/:companyId/users", async (req, res) => {
    try {
      const { companyId } = req.params;
      
      const { data, error } = await supabaseAdmin
        .from('company_users')
        .select(`
          status,
          users (
            id,
            full_name,
            email,
            is_super_admin
          )
        `)
        .eq('company_id', companyId);

      if (error) throw error;

      // Formatar a resposta
      const users = data.map(item => ({
        ...item.users,
        status: item.status
      }));

      res.json(users);
    } catch (err: any) {
      console.error("❌ Erro ao buscar usuários:", err);
      res.status(400).json({ error: err.message });
    }
  });

  // Rota para resetar senha de um usuário
  app.post("/api/admin/users/:userId/reset-password", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Gera senha temporária segura
      const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';

      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: tempPassword, user_metadata: { require_password_change: true } }
      );

      if (authError) throw authError;

      res.json({ email: authUser.user.email, tempPassword });
    } catch (err: any) {
      console.error("❌ Erro ao resetar senha:", err);
      res.status(400).json({ error: err.message });
    }
  });

  // Rota para apagar o banco de dados (exceto o admin atual)
  app.post("/api/admin/delete-database", async (req, res) => {
    try {
      const { adminUserId } = req.body;
      
      if (!adminUserId) {
        return res.status(400).json({ error: "ID do admin é obrigatório." });
      }

      // 1. Apagar todas as empresas (isso deve apagar company_users em cascata se configurado,
      // mas vamos apagar manualmente por segurança)
      const { error: delCompanyUsersError } = await supabaseAdmin
        .from('company_users')
        .delete()
        .neq('user_id', adminUserId); // Não apagar o vínculo do admin se houver
        
      if (delCompanyUsersError) throw delCompanyUsersError;

      const { error: delCompaniesError } = await supabaseAdmin
        .from('companies')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Apaga todas
        
      if (delCompaniesError) throw delCompaniesError;

      // 2. Buscar todos os usuários do Auth para apagar
      const { data: authUsers, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listUsersError) throw listUsersError;

      // 3. Apagar usuários do Auth (exceto o admin atual)
      for (const user of authUsers.users) {
        if (user.id !== adminUserId) {
          await supabaseAdmin.auth.admin.deleteUser(user.id);
        }
      }

      // 4. Apagar usuários da tabela public.users (exceto o admin atual)
      const { error: delUsersError } = await supabaseAdmin
        .from('users')
        .delete()
        .neq('id', adminUserId);
        
      if (delUsersError) throw delUsersError;

      res.json({ message: "Banco de dados limpo com sucesso." });
    } catch (err: any) {
      console.error("❌ Erro ao limpar banco de dados:", err);
      res.status(400).json({ error: err.message });
    }
  });

  // ============================================================================
  // MIDDLEWARE DO VITE (FRONTEND)
  // ============================================================================
  // Isso permite que o mesmo servidor sirva a API e o Frontend (Monorepo)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
  });
}

startServer();

