import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

// Helper function to resolve effective company_id (parent company for multi-tenancy)
const getEffectiveCompanyId = async (company_id: string) => {
	const { data: comp } = await supabaseAdmin
		.from('companies')
		.select('parent_id')
		.eq('id', company_id)
		.single();
	return comp?.parent_id || company_id;
};

// Security Helper: Enforce logic rules on permissions regardless of what the client sends
const sanitizePermissions = (rawPermissions: any) => {
	if (!rawPermissions || typeof rawPermissions !== 'object') return {};

	const sanitized: any = {};
	for (const resource in rawPermissions) {
		const perms = rawPermissions[resource];
		if (perms && typeof perms === 'object') {
			let { view, create, edit, delete: del } = perms;

			// Regra 1: Se tem permissão pra criar, editar ou deletar, obrigatoriamente ele tem que poder ver
			if (create || edit || del) {
				view = true;
			}

			// Regra 2: Se não pode ver (view é falso), não pode fazer nenhuma das outras ações
			if (!view) {
				create = false;
				edit = false;
				del = false;
			}

			sanitized[resource] = {
				view: !!view,
				create: !!create,
				edit: !!edit,
				delete: !!del,
			};
		}
	}
	return sanitized;
};

export const getAccessProfiles = async (req: Request, res: Response) => {
	try {
		const { company_id } = req.query;

		if (!company_id) {
			return res.status(400).json({ error: 'company_id é obrigatório.' });
		}

		const effectiveId = await getEffectiveCompanyId(company_id as string);

		const { data, error } = await supabaseAdmin
			.from('access_profiles')
			.select('*')
			.eq('company_id', effectiveId)
			.order('name');

		if (error) throw error;
		res.status(200).json(data);
	} catch (err: any) {
		res.status(400).json({ error: err.message });
	}
};

export const createAccessProfile = async (req: Request, res: Response) => {
	try {
		const { company_id, name, permissions, scope, allowed_sites } =
			req.body;

		if (!company_id || !name || !scope) {
			return res.status(400).json({
				error: 'Campos obrigatórios: company_id, name, scope.',
			});
		}

		const effectiveId = await getEffectiveCompanyId(company_id as string);
		const sanitizedPermissions = sanitizePermissions(permissions);

		const { data, error } = await supabaseAdmin
			.from('access_profiles')
			.insert([
				{
					company_id: effectiveId,
					name,
					permissions: sanitizedPermissions || {}, // Record of actions per resource
					scope,
					allowed_sites: allowed_sites || [],
				},
			])
			.select('*')
			.single();

		if (error) throw error;
		res.status(201).json(data);
	} catch (err: any) {
		res.status(400).json({ error: err.message });
	}
};

export const updateAccessProfile = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { name, permissions, scope, allowed_sites } = req.body;

		const sanitizedPermissions = permissions
			? sanitizePermissions(permissions)
			: undefined;

		const { data, error } = await supabaseAdmin
			.from('access_profiles')
			.update({
				name,
				...(permissions ? { permissions: sanitizedPermissions } : {}),
				scope,
				allowed_sites,
			})
			.eq('id', id)
			.select('*')
			.single();

		if (error) throw error;
		res.status(200).json(data);
	} catch (err: any) {
		res.status(400).json({ error: err.message });
	}
};

export const deleteAccessProfile = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		// Primeiro, verificar se existem company_users atrelados a este perfil
		const { count, error: countError } = await supabaseAdmin
			.from('company_users')
			.select('*', { count: 'exact', head: true })
			.eq('profile_id', id);

		if (countError) throw countError;

		if (count && count > 0) {
			return res.status(400).json({
				error: 'Não é possível excluir o perfil pois existem usuários vinculados a ele.',
			});
		}

		const { error } = await supabaseAdmin
			.from('access_profiles')
			.delete()
			.eq('id', id);

		if (error) throw error;
		res.status(204).send();
	} catch (err: any) {
		res.status(400).json({ error: err.message });
	}
};
