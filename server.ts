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
      
      if (!companyId || !email || !fullName) {
        return res.status(400).json({ error: "Dados incompletos para criar o usuário." });
      }

      // Gera senha temporária segura
      const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';

      // 1. Cria usuário no Auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      });

      if (authError) throw authError;

      // 2. Vincula usuário à empresa
      const { error: linkError } = await supabaseAdmin
        .from('company_users')
        .insert({
          company_id: companyId,
          user_id: authUser.user.id,
          status: 'ACTIVE'
        });

      if (linkError) throw linkError;

      res.status(201).json({ email, tempPassword, userId: authUser.user.id });
    } catch (err: any) {
      console.error("❌ Erro ao criar usuário:", err);
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

