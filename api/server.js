require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
// O Render injeta a porta automaticamente na variável process.env.PORT
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Permite que o frontend (Vercel) acesse esta API
app.use(express.json());

// Rota de Healthcheck (útil para o Render saber se a API está online)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'GEPLANO API is running' });
});

// ============================================================================
// ROTAS DE ADMINISTRAÇÃO (SUPER-ADMIN)
// ============================================================================

// Rota para listar todas as Empresas (Tenant)
app.get('/api/admin/companies', async (req, res) => {
  try {
    if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('seu-projeto')) {
      return res.status(400).json({ error: "A variável SUPABASE_URL no Render está inválida ou usando o valor padrão." });
    }

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error } = await supabaseAdmin
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error("❌ Erro ao listar empresas:", err);
    res.status(400).json({ error: err.message || "Erro desconhecido ao conectar com o Supabase" });
  }
});

// Rota para listar usuários de uma Empresa
app.get('/api/admin/companies/:id/users', async (req, res) => {
  try {
    const { id } = req.params;
    if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('seu-projeto')) {
      return res.status(400).json({ error: "A variável SUPABASE_URL no Render está inválida ou usando o valor padrão." });
    }

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error } = await supabaseAdmin
      .from('company_users')
      .select(`
        id,
        status,
        users (
          id,
          email,
          full_name
        )
      `)
      .eq('company_id', id);

    if (error) throw error;
    
    // Formata o retorno
    const users = data.map(cu => ({
      id: cu.users.id,
      email: cu.users.email,
      full_name: cu.users.full_name,
      status: cu.status
    }));
    
    res.status(200).json(users);
  } catch (err) {
    console.error("❌ Erro ao listar usuários:", err);
    res.status(400).json({ error: err.message || "Erro desconhecido ao conectar com o Supabase" });
  }
});

// Rota para criar uma nova Empresa (Tenant)
app.post('/api/admin/companies', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "O nome da empresa é obrigatório." });

    if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('seu-projeto')) {
      return res.status(400).json({ error: "A variável SUPABASE_URL no Render está inválida ou usando o valor padrão." });
    }

    // Inicializa o cliente Admin com a Service Role Key (Ignora RLS)
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error } = await supabaseAdmin
      .from('companies')
      .insert({ name })
      .select()
      .single();

    if (error) {
      console.error("❌ Erro do Supabase:", error);
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    console.error("❌ Erro ao criar empresa:", err);
    res.status(400).json({ error: err.message || "Erro desconhecido ao conectar com o Supabase" });
  }
});

// Rota para criar um Usuário Admin para uma Empresa
app.post('/api/admin/users', async (req, res) => {
  try {
    const { companyId, email } = req.body;
    
    if (!companyId || !email) {
      return res.status(400).json({ error: "Dados incompletos para criar o usuário." });
    }

    if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('seu-projeto')) {
      return res.status(400).json({ error: "A variável SUPABASE_URL no Render está inválida ou usando o valor padrão." });
    }

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Gera senha temporária segura
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';

    // 1. Cria usuário no Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { require_password_change: true, full_name: 'Administrador' }
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
  } catch (err) {
    console.error("❌ Erro ao criar usuário:", err);
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API do GEPLANO rodando na porta ${PORT}`);
});
