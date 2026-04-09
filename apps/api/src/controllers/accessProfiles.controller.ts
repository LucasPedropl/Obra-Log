import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

export const getAccessProfiles = async (req: Request, res: Response) => {
	try {
		const { company_id } = req.query;

		if (!company_id) {
			return res.status(400).json({ error: 'company_id é obrigatório.' });
		}

		// Identifica se a company tem parent_id (é instância) e redireciona a busca para o Parent
		const { data: comp } = await supabaseAdmin
			.from('companies')
			.select('parent_id')
			.eq('id', company_id as string)
			.single();

		const effectiveId = comp?.parent_id || company_id;

		const { data, error } = await supabaseAdmin
			.from('access_profiles')
			.select('*')
			.eq('company_id', effectiveId);

		if (error) throw error;
		res.status(200).json(data);
	} catch (err: any) {
		res.status(400).json({ error: err.message });
	}
};
