import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

// ============================================================================
// COLABORADORES
// ============================================================================

export const getCollaborators = async (req: Request, res: Response) => {
  try {
    const { company_id } = req.query;
    if (!company_id) {
      return res.status(400).json({ error: 'company_id é obrigatório.' });
    }

    const { data, error } = await supabaseAdmin
      .from('collaborators')
      .select('*')
      .eq('company_id', company_id as string);

    if (error) throw error;
    res.status(200).json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const createCollaborator = async (req: Request, res: Response) => {
  try {
    const {
      company_id,
      name,
      cpf,
      rg,
      birth_date,
      phone,
      cellphone,
      email,
      cep,
      street,
      number,
      neighborhood,
      complement,
      state,
      city,
      profile_id,
    } = req.body;

    if (!company_id || !name) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    }

    const { data, error } = await supabaseAdmin
      .from('collaborators')
      .insert({
        company_id,
        name,
        cpf,
        rg,
        birth_date,
        phone,
        cellphone,
        email,
        cep,
        street,
        number,
        neighborhood,
        complement,
        state,
        city,
        profile_id: profile_id || null,
        role_title: req.body.role_title || 'Colaborador',
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (error) {
      // Se der erro por colunas extras, vamos fazer o fallback pra inserir só o básico + um campo doc
      if (error.code === 'PGRST204') {
        const { data: fbData, error: fbError } = await fallbackInsert(supabaseAdmin, req.body);
        if (fbError) throw fbError;
        return res.status(201).json(fbData);
      }
      throw error;
    }
    
    res.status(201).json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

async function fallbackInsert(client: any, body: any) {
  return await client
    .from('collaborators')
    .insert({
      company_id: body.company_id,
      name: body.name,
      role_title: body.role_title || 'Colaborador',
      document: body.cpf, // Reaproveita o campo document
      status: 'ACTIVE',
    })
    .select()
    .single();
}