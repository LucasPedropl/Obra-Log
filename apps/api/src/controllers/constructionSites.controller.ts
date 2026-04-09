import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

export const getSites = async (req: Request, res: Response) => {
  try {
    const { company_id } = req.query;
    if (!company_id) {
      return res.status(400).json({ error: 'company_id é obrigatório.' });
    }

    const { data, error } = await supabaseAdmin
      .from('construction_sites')
      .select('*')
      .eq('company_id', company_id as string)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getSiteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('construction_sites')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const createSite = async (req: Request, res: Response) => {
  try {
    const { name, company_id, status } = req.body;
    if (!name || !company_id) {
      return res.status(400).json({ error: 'Nome e company_id são obrigatórios.' });
    }

    const { data, error } = await supabaseAdmin
      .from('construction_sites')
      .insert({ name, company_id, status: status || 'ACTIVE' })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};