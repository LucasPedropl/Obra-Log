import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

// ============================================================================
// CATEGORIES
// ============================================================================

export const getCategories = async (req: Request, res: Response) => {
  try {
    const { company_id } = req.query;
    if (!company_id) {
      return res.status(400).json({ error: 'company_id é obrigatório.' });
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('company_id', company_id as string);

    if (error) throw error;
    res.status(200).json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { company_id, entry_type, primary_category, secondary_category } = req.body;
    if (!company_id || !entry_type || !primary_category) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({
        company_id,
        entry_type,
        primary_category,
        secondary_category,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// ============================================================================
// MEASUREMENT UNITS
// ============================================================================

export const getMeasurementUnits = async (req: Request, res: Response) => {
  try {
    const { company_id } = req.query;
    if (!company_id) {
      return res.status(400).json({ error: 'company_id é obrigatório.' });
    }

    const { data, error } = await supabaseAdmin
      .from('measurement_units')
      .select('*')
      .eq('company_id', company_id as string);

    if (error) throw error;
    res.status(200).json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const createMeasurementUnit = async (req: Request, res: Response) => {
  try {
    const { company_id, name, abbreviation } = req.body;
    if (!company_id || !name || !abbreviation) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    }

    const { data, error } = await supabaseAdmin
      .from('measurement_units')
      .insert({ company_id, name, abbreviation })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// ============================================================================
// CATALOGS
// ============================================================================

export const getCatalogs = async (req: Request, res: Response) => {
  try {
    const { company_id } = req.query;
    if (!company_id) {
      return res.status(400).json({ error: 'company_id é obrigatório.' });
    }

    const { data, error } = await supabaseAdmin
      .from('catalogs')
      .select(`
        *,
        categories ( primary_category, entry_type ),
        measurement_units ( abbreviation )
      `)
      .eq('company_id', company_id as string);

    if (error) throw error;
    res.status(200).json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const createCatalog = async (req: Request, res: Response) => {
  try {
    const {
      company_id,
      category_id,
      unit_id,
      name,
      code,
      is_stock_controlled,
      min_threshold,
      is_tool,
    } = req.body;

    if (!company_id || !name) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    }

    const { data, error } = await supabaseAdmin
      .from('catalogs')
      .insert({
        company_id,
        category_id,
        unit_id,
        name,
        code,
        is_stock_controlled,
        min_threshold,
        is_tool,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};