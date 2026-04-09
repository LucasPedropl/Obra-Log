import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

export const deleteDatabase = async (req: Request, res: Response) => {
  try {
    const { adminUserId } = req.body;
    if (!adminUserId) {
      return res.status(400).json({ error: 'ID do admin é obrigatório.' });
    }

    // 1. Apagar dados de todas as tabelas na ordem correta para evitar erros de chave estrangeira
    const tablesToDelete = [
      // dependências mais profundas primeiro
      'tool_loans',
      'site_movements',
      'site_inventory',
      'epi_withdrawals',
      'rented_equipments',

      // tabelas filhas diretas da empresa
      'construction_sites',
      'catalogs',
      'measurement_units',
      'categories',

      // relacionadas a usuários/perfis
      'collaborators',
      'company_users',
      'access_profiles',

      // tabela mãe
      'companies',

      // tabela base de acesso
      'users',
    ];

    for (const table of tablesToDelete) {
      if (table === 'users') {
        const { error } = await supabaseAdmin.from(table).delete().neq('id', adminUserId);
        if (error) console.error(`Erro limpando ${table}:`, error);
      } else if (table === 'access_profiles') {
        const { error } = await supabaseAdmin
          .from(table)
          .delete()
          .neq('id', 'non-existent-id');
        if (error) console.error(`Erro limpando ${table}:`, error);
      } else {
        const { error } = await supabaseAdmin
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta tudo
        if (error) console.error(`Erro limpando ${table}:`, error);
      }
    }

    // Apagar usuários no auth.users (exceto o admin)
    const { data: authData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) throw usersError;

    for (const user of authData.users) {
      if (user.id !== adminUserId) {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
      }
    }

    res.status(200).json({ message: 'Banco de dados limpo com sucesso.' });
  } catch (err: any) {
    console.error('❌ Erro ao apagar banco de dados:', err);
    res.status(400).json({ error: err.message });
  }
};