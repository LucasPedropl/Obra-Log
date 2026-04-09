import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';

// Adding 'user' to Request type
declare global {
	namespace Express {
		interface Request {
			user?: any;
		}
	}
}

export const authMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	if (req.method === 'OPTIONS') {
		return next();
	}

	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res
				.status(401)
				.json({ error: 'Acesso negado. Token Ausente.' });
		}

		const token = authHeader.split(' ')[1];

		const {
			data: { user },
			error,
		} = await supabaseAdmin.auth.getUser(token);

		if (error || !user) {
			console.error('Erro ao verificar o token com Supabase:', error);
			return res
				.status(401)
				.json({
					error: 'Sessão inválida ou expirada. Faça login novamente.',
				});
		}

		req.user = user;
		next();
	} catch (error) {
		console.error('Erro interno no middleware de autenticação:', error);
		return res
			.status(500)
			.json({ error: 'Erro interno no servidor de autenticação.' });
	}
};
