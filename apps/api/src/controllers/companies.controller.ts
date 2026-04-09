import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

export const getCompanies = async (req: Request, res: Response) => {
	try {
		const { data, error } = await supabaseAdmin
			.from('companies')
			.select('*')
			.is('parent_id', null)
			.order('created_at', { ascending: false });

		if (error) throw error;
		res.status(200).json(data);
	} catch (err: any) {
		console.error('❌ Erro ao listar empresas:', err);
		res.status(400).json({
			error:
				err.message || 'Erro desconhecido ao conectar com o Supabase',
		});
	}
};

export const getCompanyUsers = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const { data, error } = await supabaseAdmin
			.from('company_users')
			.select(
				`
        user_id,
        status,
        users (
          id,
          email,
          full_name
        )
      `,
			)
			.eq('company_id', id);

		if (error) throw error;

		const formattedData = data.map((item: any) => ({
			id: item.user_id,
			status: item.status,
			email: item.users?.email,
			full_name: item.users?.full_name,
		}));

		res.status(200).json(formattedData);
	} catch (err: any) {
		console.error('❌ Erro ao listar usuários da empresa:', err);
		res.status(400).json({ error: err.message });
	}
};

export const createCompany = async (req: Request, res: Response) => {
	try {
		const { name, max_instances } = req.body;
		if (!name) {
			return res
				.status(400)
				.json({ error: 'O nome da empresa é obrigatório.' });
		}

		const { data, error } = await supabaseAdmin
			.from('companies')
			.insert({
				name,
				max_instances: max_instances || 1,
			})
			.select()
			.single();

		if (error) throw error;
		res.status(201).json(data);
	} catch (err: any) {
		console.error('❌ Erro ao criar empresa:', err);
		res.status(400).json({ error: err.message });
	}
};

export const deleteCompany = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		// Simplificada temporariamente - a verdadeira continha exclusões em cascata.
		// Você pode expandir esta lógica conforme necessário no futuro.
		const { error: deleteError } = await supabaseAdmin
			.from('companies')
			.delete()
			.eq('id', id);

		if (deleteError) throw deleteError;

		res.status(200).json({ message: 'Empresa excluída com sucesso!' });
	} catch (err: any) {
		console.error('❌ Erro ao excluir empresa:', err);
		res.status(400).json({ error: err.message });
	}
};

export const getUserCompanies = async (req: Request, res: Response) => {
	try {
		const { userId } = req.params;

		const { data, error } = await supabaseAdmin
			.from('company_users')
			.select(
				`
        company_id,
        companies (
          id,
          name,
          active,
          max_instances,
          parent_id
        )
      `,
			)
			.eq('user_id', userId);

		if (error) throw error;
		res.json(data);
	} catch (err: any) {
		res.status(400).json({ error: err.message });
	}
};

export const getCompanyInstances = async (req: Request, res: Response) => {
	try {
		const { id } = req.params; // parent company id
		const userId = req.user?.id; // from auth middleware

		if (!userId) {
			return res.status(401).json({ error: 'Usuário não autenticado.' });
		}

		// 1. Verifica se o usuário é Administrador Global (vinculado à empresa PAI)
		const { data: parentLink } = await supabaseAdmin
			.from('company_users')
			.select('id')
			.eq('company_id', id)
			.eq('user_id', userId)
			.single();

		if (parentLink) {
			// É admin global da empresa, retorna todas as instâncias filhas
			const { data, error } = await supabaseAdmin
				.from('companies')
				.select('*')
				.eq('parent_id', id);

			if (error) throw error;
			return res.status(200).json(data);
		}

		// 2. Se não é global, busca APENAS as instâncias que ele tem permissão específica
		// supabase join might vary, let's fetch in two steps to be safe
		const { data: allInstances } = await supabaseAdmin
			.from('companies')
			.select('*')
			.eq('parent_id', id);

		const { data: linkRecords } = await supabaseAdmin
			.from('company_users')
			.select('company_id')
			.eq('user_id', userId);

		if (!allInstances || !linkRecords) {
			return res.status(200).json([]);
		}

		const allowedCompanyIds = linkRecords.map((r) => r.company_id);
		const filteredInstances = allInstances.filter((inst) =>
			allowedCompanyIds.includes(inst.id),
		);

		res.status(200).json(filteredInstances);
	} catch (err: any) {
		res.status(400).json({ error: err.message });
	}
};

export const createCompanyInstance = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { name } = req.body;

		// 1. Cria a instância sem precisar vincular os admins,
		// pois a lógica hierárquica verificará a permissão na empresa pai
		const { data, error } = await supabaseAdmin
			.from('companies')
			.insert({ name, parent_id: id })
			.select()
			.single();

		if (error) throw error;

		res.status(201).json(data);
	} catch (err: any) {
		res.status(400).json({ error: err.message });
	}
};
