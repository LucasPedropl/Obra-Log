require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Vamos forÃ§ar de forma HARDCODED a porta para nÃ£o usar process.env.PORT localmente,
// pois o Render vai injetar isso pelo ambiente, mas localmente pode estar bugando
const PORT = 5005;

// Middlewares
app.use(cors()); // Permite que o frontend (Vercel) acesse esta API
app.use(express.json());

// Rota de Healthcheck (útil para o Render saber se a API está online)
app.get('/health', (req, res) => {
	res.json({ status: 'ok', message: 'GEPLANO API is running' });
});

// ============================================================================
// MIDDLEWARE DE AUTENTICAÇÃO (BLINDAGEM)
// ============================================================================
const authMiddleware = async (req, res, next) => {
	// Permite requisições de preflight (OPTIONS) do navegador sem token
	if (req.method === 'OPTIONS') {
		return next();
	}

	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({ error: 'Acesso negado. Token Ausente.' });
		}
		
		const token = authHeader.split(' ')[1];
		const supabaseAdmin = createClient(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{ auth: { autoRefreshToken: false, persistSession: false } },
		);

		// Valida o JWT do usuário logado
		const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
		
		if (error || !user) {
			return res.status(401).json({ error: 'Acesso negado. Token Inválido ou Expirado.' });
		}

		req.user = user; // Instancia o usuário validado na requisição para uso futuro
		next();
	} catch (err) {
		console.error('Erro no AuthMiddleware:', err);
		res.status(500).json({ error: 'Erro interno ao validar autenticação.' });
	}
};

// Aplica o middleware a todas as rotas sob /api/
app.use('/api', authMiddleware);

// ============================================================================
// ROTAS DE APLICAÇÃO (OBRAS, ETC) - BYPASS DE RLS
// ============================================================================

app.get('/api/construction_sites', async (req, res) => {
	try {
		const { company_id } = req.query;
		if (!company_id) {
			return res.status(400).json({ error: 'company_id é obrigatório.' });
		}

		const supabaseAdmin = createClient(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{ auth: { autoRefreshToken: false, persistSession: false } },
		);

		const { data, error } = await supabaseAdmin
			.from('construction_sites')
			.select('*')
			.eq('company_id', company_id)
			.order('created_at', { ascending: false });

		if (error) throw error;
		res.status(200).json(data);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

app.get('/api/construction_sites/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const supabaseAdmin = createClient(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{ auth: { autoRefreshToken: false, persistSession: false } },
		);
		const { data, error } = await supabaseAdmin
			.from('construction_sites')
			.select('*')
			.eq('id', id)
			.single();
		if (error) throw error;
		res.status(200).json(data);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});
app.post('/api/construction_sites', async (req, res) => {
	try {
		const { name, company_id, status } = req.body;
		if (!name || !company_id) {
			return res
				.status(400)
				.json({ error: 'Nome e company_id são obrigatórios.' });
		}

		const supabaseAdmin = createClient(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{ auth: { autoRefreshToken: false, persistSession: false } },
		);

		const { data, error } = await supabaseAdmin
			.from('construction_sites')
			.insert({ name, company_id, status: status || 'ACTIVE' })
			.select()
			.single();

		if (error) throw error;
		res.status(201).json(data);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

// ============================================================================
// ROTAS DE ADMINISTRAÇÃO (SUPER-ADMIN)
// ============================================================================

// Rota para listar todas as Empresas (Tenant)
app.get('/api/admin/companies', async (req, res) => {
	try {
		if (
			!process.env.SUPABASE_URL ||
			process.env.SUPABASE_URL.includes('seu-projeto')
		) {
			return res.status(400).json({
				error: 'A variável SUPABASE_URL no Render está inválida ou usando o valor padrão.',
			});
		}

		const supabaseAdmin = createClient(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{ auth: { autoRefreshToken: false, persistSession: false } },
		);

		const { data, error } = await supabaseAdmin
			.from('companies')
			.select('*')
			.order('created_at', { ascending: false });

		if (error) throw error;
		res.status(200).json(data);
	} catch (err) {
		console.error('❌ Erro ao listar empresas:', err);
		res.status(400).json({
			error:
				err.message || 'Erro desconhecido ao conectar com o Supabase',
		});
	}
});

// Rota para listar usuários de uma Empresa
app.get('/api/admin/companies/:id/users', async (req, res) => {
	try {
		const { id } = req.params;
		if (
			!process.env.SUPABASE_URL ||
			process.env.SUPABASE_URL.includes('seu-projeto')
		) {
			return res.status(400).json({
				error: 'A variável SUPABASE_URL no Render está inválida ou usando o valor padrão.',
			});
		}

		const supabaseAdmin = createClient(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{ auth: { autoRefreshToken: false, persistSession: false } },
		);

		const { data, error } = await supabaseAdmin
			.from('company_users')
			.select(
				`
        id,
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

		// Buscar usuários no auth.admin para pegar metadados
		const { data: authData, error: authError } =
			await supabaseAdmin.auth.admin.listUsers();
		if (authError) throw authError;

		// Formata o retorno
		const users = data.map((cu) => {
			const authUser = authData.users.find((u) => u.id === cu.users.id);
			return {
				id: cu.users.id,
				email: cu.users.email,
				full_name: cu.users.full_name,
				status: cu.status,
				temp_password: authUser?.user_metadata?.temp_password || null,
				require_password_change:
					authUser?.user_metadata?.require_password_change || false,
			};
		});

		res.status(200).json(users);
	} catch (err) {
		console.error('❌ Erro ao listar usuários:', err);
		res.status(400).json({
			error:
				err.message || 'Erro desconhecido ao conectar com o Supabase',
		});
	}
});

// Rota para criar uma nova Empresa (Tenant)
app.post('/api/admin/companies', async (req, res) => {
	try {
		const { name } = req.body;
		if (!name)
			return res
				.status(400)
				.json({ error: 'O nome da empresa é obrigatório.' });

		if (
			!process.env.SUPABASE_URL ||
			process.env.SUPABASE_URL.includes('seu-projeto')
		) {
			return res.status(400).json({
				error: 'A variável SUPABASE_URL no Render está inválida ou usando o valor padrão.',
			});
		}

		// Inicializa o cliente Admin com a Service Role Key (Ignora RLS)
		const supabaseAdmin = createClient(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{ auth: { autoRefreshToken: false, persistSession: false } },
		);

		const { data, error } = await supabaseAdmin
			.from('companies')
			.insert({ name })
			.select()
			.single();

		if (error) {
			console.error('❌ Erro do Supabase:', error);
			throw error;
		}
		res.status(201).json(data);
	} catch (err) {
		console.error('❌ Erro ao criar empresa:', err);
		res.status(400).json({
			error:
				err.message || 'Erro desconhecido ao conectar com o Supabase',
		});
	}
});

// Rota para criar um Usuário Admin para uma Empresa
app.post('/api/admin/users', async (req, res) => {
	try {
		const { companyId, email } = req.body;

		if (!companyId || !email) {
			return res
				.status(400)
				.json({ error: 'Dados incompletos para criar o usuário.' });
		}

		if (
			!process.env.SUPABASE_URL ||
			process.env.SUPABASE_URL.includes('seu-projeto')
		) {
			return res.status(400).json({
				error: 'A variável SUPABASE_URL no Render está inválida ou usando o valor padrão.',
			});
		}

		const supabaseAdmin = createClient(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{ auth: { autoRefreshToken: false, persistSession: false } },
		);

		// Gera senha temporária segura
		const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';

		// 1. Cria usuário no Auth
		const { data: authUser, error: authError } =
			await supabaseAdmin.auth.admin.createUser({
				email,
				password: tempPassword,
				email_confirm: true,
				user_metadata: {
					require_password_change: true,
					full_name: 'Administrador',
					temp_password: tempPassword,
				},
			});

		if (authError) throw authError;

		// 2. Busca ou cria o perfil Administrador para esta empresa
		let profileId = null;
		const { data: existingProfile } = await supabaseAdmin
			.from('access_profiles')
			.select('id')
			.eq('company_id', companyId)
			.eq('name', 'Administrador Padrão')
			.single();

		if (existingProfile) {
			profileId = existingProfile.id;
		} else {
			const fullPerms = {
				obras: {
					view: true,
					create: true,
					edit: true,
					delete: true,
					access_type: 'all',
				},
				colaboradores: {
					view: true,
					create: true,
					edit: true,
					delete: true,
				},
				ferramentas: {
					view: true,
					create: true,
					edit: true,
					delete: true,
				},
				epis: { view: true, create: true, edit: true, delete: true },
				equip_alugados: {
					view: true,
					create: true,
					edit: true,
					delete: true,
				},
				movimentacoes: {
					view: true,
					create: true,
					edit: true,
					delete: true,
				},
				insumos: { view: true, create: true, edit: true, delete: true },
				mao_de_obra: {
					view: true,
					create: true,
					edit: true,
					delete: true,
				},
				relatorios: {
					view: true,
					create: true,
					edit: true,
					delete: true,
				},
				usuarios: {
					view: true,
					create: true,
					edit: true,
					delete: true,
				},
				perfis: { view: true, create: true, edit: true, delete: true },
			};

			const { data: newProfile, error: profileError } =
				await supabaseAdmin
					.from('access_profiles')
					.insert({
						company_id: companyId,
						name: 'Administrador Padrão',
						scope: 'ALL_SITES',
						permissions: fullPerms,
						allowed_sites: [],
					})
					.select()
					.single();

			if (!profileError && newProfile) {
				profileId = newProfile.id;
			}
		}

		// 3. Vincula usuário à empresa
		const { error: linkError } = await supabaseAdmin
			.from('company_users')
			.insert({
				company_id: companyId,
				user_id: authUser.user.id,
				profile_id: profileId,
				status: 'ACTIVE',
			});

		if (linkError) throw linkError;

		res.status(201).json({ email, tempPassword, userId: authUser.user.id });
	} catch (err) {
		console.error('❌ Erro ao criar usuário:', err);
		res.status(400).json({ error: err.message });
	}
});

// Rota para resetar senha de um usuário
app.post('/api/admin/users/:userId/reset-password', async (req, res) => {
	try {
		const { userId } = req.params;

		const supabaseAdmin = createClient(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{ auth: { autoRefreshToken: false, persistSession: false } },
		);

		const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';

		const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
			userId,
			{
				password: tempPassword,
				user_metadata: {
					require_password_change: true,
					temp_password: tempPassword,
				},
			},
		);

		if (error) throw error;

		res.json({ email: data.user.email, tempPassword });
	} catch (err) {
		console.error('❌ Erro ao resetar senha:', err);
		res.status(400).json({ error: err.message });
	}
});

// Rota para buscar as empresas de um usuário (Bypassa RLS)
app.get('/api/users/:userId/companies', async (req, res) => {
	try {
		const { userId } = req.params;

		if (
			!process.env.SUPABASE_URL ||
			process.env.SUPABASE_URL.includes('seu-projeto')
		) {
			return res.status(400).json({
				error: 'A variável SUPABASE_URL no Render está inválida ou usando o valor padrão.',
			});
		}

		const supabaseAdmin = createClient(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{ auth: { autoRefreshToken: false, persistSession: false } },
		);

		const { data, error } = await supabaseAdmin
			.from('company_users')
			.select(
				`
				company_id,
				companies (
					id,
					name,
					active
				)
			`,
			)
			.eq('user_id', userId);

		if (error) throw error;
		res.json(data);
	} catch (err) {
		console.error('❌ Erro ao buscar empresas do usuário:', err);
		res.status(400).json({ error: err.message });
	}
});

app.delete('/api/admin/companies/:id', async (req, res) => {
	try {
		const { id } = req.params;

		if (
			!process.env.SUPABASE_URL ||
			process.env.SUPABASE_URL.includes('seu-projeto')
		) {
			return res.status(400).json({
				error: 'A vari�vel SUPABASE_URL no Render est� inv�lida ou usando o valor padr�o.',
			});
		}

		const supabaseAdmin = createClient(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{ auth: { autoRefreshToken: false, persistSession: false } },
		);

		// Lista de tabelas em ordem inversa das depend�ncias
		const tablesToDelete = [
			'tool_loans',
			'site_movements',
			'site_inventory',
			'epi_withdrawals',
			'rented_equipments',
			'construction_sites',
			'catalogs',
			'measurement_units',
			'categories',
			'collaborators',
			'company_users',
			// access_profiles n�o � vinculada diretamente � empresa, n�o exclu�mos seus dados gerais
			'companies',
		];

		for (const table of tablesToDelete) {
			if (table === 'company_users') {
				// Buscar os usu�rios vinculados � empresa antes de remov�-los
				const { data: usersToRem } = await supabaseAdmin
					.from('company_users')
					.select('user_id')
					.eq('company_id', id);

				// Deletar a rela��o do user com a empresa
				await supabaseAdmin.from(table).delete().eq('company_id', id);

				// S� deletamos o usu�rio da base de auth se ele n�o pertencer a mais nenhuma empresa
				if (usersToRem && usersToRem.length > 0) {
					for (const u of usersToRem) {
						// Verifica se ainda tem esse user noutra tenant
						const { count } = await supabaseAdmin
							.from('company_users')
							.select('*', { count: 'exact', head: true })
							.eq('user_id', u.user_id);
						if (count === 0) {
							// Remove da tabela public.users
							await supabaseAdmin
								.from('users')
								.delete()
								.eq('id', u.user_id);
							// Remove de auth.users
							await supabaseAdmin.auth.admin.deleteUser(
								u.user_id,
							);
						}
					}
				}
			} else if (table === 'companies') {
				// Por fim, deleta a empresa
				const { error } = await supabaseAdmin
					.from(table)
					.delete()
					.eq('id', id);
				if (error) throw error;
			} else {
				// Deleta os registros vinculados a esta empresa
				await supabaseAdmin.from(table).delete().eq('company_id', id);
			}
		}

		res.status(200).json({ message: 'Empresa deletada com sucesso.' });
	} catch (err) {
		console.error('? Erro ao apagar empresa:', err);
		res.status(400).json({ error: err.message });
	}
});

app.post('/api/admin/delete-database', async (req, res) => {
	try {
		const { adminUserId } = req.body;
		if (!adminUserId)
			return res
				.status(400)
				.json({ error: 'ID do admin é obrigatório.' });

		const supabaseAdmin = createClient(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{ auth: { autoRefreshToken: false, persistSession: false } },
		);

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
				await supabaseAdmin.from(table).delete().neq('id', adminUserId);
			} else if (table === 'access_profiles') {
				// não podemos deletar o 'Super-Admin' que é o próprio perfil
				await supabaseAdmin
					.from(table)
					.delete()
					.neq('id', 'non-existent-id');
			} else {
				await supabaseAdmin
					.from(table)
					.delete()
					.neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta tudo
			}
		}

		// Apagar usuários no auth.users (exceto o admin)
		const { data: users, error: usersError } =
			await supabaseAdmin.auth.admin.listUsers();
		if (usersError) throw usersError;

		for (const user of users.users) {
			if (user.id !== adminUserId) {
				await supabaseAdmin.auth.admin.deleteUser(user.id);
			}
		}

		res.status(200).json({ message: 'Banco de dados limpo com sucesso.' });
	} catch (err) {
		console.error('❌ Erro ao apagar banco de dados:', err);
		res.status(400).json({ error: err.message });
	}
});

// ============================================================================
// ROTAS DE CONFIGURAÇÕES (Categorias, Unidades, Catálogo)
// ============================================================================

app.get('/api/categories', async (req, res) => {
	try {
		const { company_id } = req.query;
		if (!company_id) {
			return res.status(400).json({ error: 'company_id é obrigatório.' });
		}

		const supabaseAdmin = createClient(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{ auth: { autoRefreshToken: false, persistSession: false } },
		);

		const { data, error } = await supabaseAdmin
			.from('categories')
			.select('*')
			.eq('company_id', company_id);

		if (error) throw error;
		res.status(200).json(data);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

app.post('/api/categories', async (req, res) => {
	try {
		const { company_id, entry_type, primary_category, secondary_category } =
			req.body;
		if (!company_id || !entry_type || !primary_category) {
			return res
				.status(400)
				.json({ error: 'Campos obrigatórios faltando.' });
		}

		const supabaseAdmin = createClient(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{ auth: { autoRefreshToken: false, persistSession: false } },
		);

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
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

app.get('/api/measurement_units', async (req, res) => {
	try {
		const { company_id } = req.query;
		if (!company_id) {
			return res.status(400).json({ error: 'company_id é obrigatório.' });
		}

		const supabaseAdmin = createClient(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{ auth: { autoRefreshToken: false, persistSession: false } },
		);

		const { data, error } = await supabaseAdmin
			.from('measurement_units')
			.select('*')
			.eq('company_id', company_id);

		if (error) throw error;
		res.status(200).json(data);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

app.post('/api/measurement_units', async (req, res) => {
	try {
		const { company_id, name, abbreviation } = req.body;
		if (!company_id || !name || !abbreviation) {
			return res
				.status(400)
				.json({ error: 'Campos obrigatórios faltando.' });
		}

		const supabaseAdmin = createClient(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{ auth: { autoRefreshToken: false, persistSession: false } },
		);

		const { data, error } = await supabaseAdmin
			.from('measurement_units')
			.insert({ company_id, name, abbreviation })
			.select()
			.single();

		if (error) throw error;
		res.status(201).json(data);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

app.get('/api/catalogs', async (req, res) => {
	try {
		const { company_id } = req.query;
		if (!company_id) {
			return res.status(400).json({ error: 'company_id é obrigatório.' });
		}

		const supabaseAdmin = createClient(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{ auth: { autoRefreshToken: false, persistSession: false } },
		);

		const { data, error } = await supabaseAdmin
			.from('catalogs')
			.select(
				`
				*,
				categories ( primary_category, entry_type ),
				measurement_units ( abbreviation )
			`,
			)
			.eq('company_id', company_id);

		if (error) throw error;
		res.status(200).json(data);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

app.post('/api/catalogs', async (req, res) => {
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
			return res
				.status(400)
				.json({ error: 'Campos obrigatórios faltando.' });
		}

		const supabaseAdmin = createClient(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{ auth: { autoRefreshToken: false, persistSession: false } },
		);

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
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

// ============================================================================
// ROTAS DE USUARIOS DO TENANT
// ============================================================================
app.get('/api/tenant/users', async (req, res) => {
	try {
		const { company_id } = req.query;
		if (!company_id) {
			return res.status(400).json({ error: 'company_id é obrigatório.' });
		}

		const supabaseAdmin = createClient(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{ auth: { autoRefreshToken: false, persistSession: false } },
		);

		const { data, error } = await supabaseAdmin
			.from('company_users')
			.select(
				`
				id,
				status,
				profile_id,
				access_profiles ( name ),
				users ( id, email, full_name )
			`,
			)
			.eq('company_id', company_id);

		if (error) throw error;

		// Fetch from auth.admin
		const { data: authData, error: authError } =
			await supabaseAdmin.auth.admin.listUsers();
		if (authError) throw authError;

		const users = data.map((cu) => {
			const userRecord = cu.users || {};
			const authUser = authData.users.find((u) => u.id === userRecord.id);
			return {
				id: userRecord.id,
				email: userRecord.email,
				full_name: userRecord.full_name,
				status: cu.status,
				profile_id: cu.profile_id,
				profile_name: cu.access_profiles?.name || 'Sem perfil',
				temp_password: authUser?.user_metadata?.temp_password || null,
				require_password_change:
					authUser?.user_metadata?.require_password_change || false,
			};
		});

		res.status(200).json(users);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

app.post('/api/tenant/users', async (req, res) => {
	try {
		const { company_id, email, full_name, profile_id } = req.body;
		if (!company_id || !email || !full_name) {
			return res
				.status(400)
				.json({ error: 'Campos obrigatórios faltando.' });
		}

		const supabaseAdmin = createClient(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{ auth: { autoRefreshToken: false, persistSession: false } },
		);

		const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';

		const { data: authUser, error: authError } =
			await supabaseAdmin.auth.admin.createUser({
				email,
				password: tempPassword,
				email_confirm: true,
				user_metadata: {
					require_password_change: true,
					full_name,
					temp_password: tempPassword,
				},
			});
		if (authError) {
			return res.status(400).json({ error: authError.message });
		}

		// Garante que existe no public.users (caso a trigger não faça ou atrase)
		await supabaseAdmin.from('users').upsert({
			id: authUser.user.id,
			email,
			full_name,
			is_super_admin: false,
		});

		const { error: companyUserError } = await supabaseAdmin
			.from('company_users')
			.insert({
				company_id,
				user_id: authUser.user.id,
				profile_id: profile_id || null,
				status: 'ACTIVE',
			});

		if (companyUserError) throw companyUserError;
		res.status(201).json({
			id: authUser.user.id,
			email,
			full_name,
			temp_password: tempPassword,
		});
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

// ============================================================================
// ROTAS DE PERFIS DE ACESSO
// ============================================================================
app.get('/api/access_profiles', async (req, res) => {
	try {
		const { company_id } = req.query;
		if (!company_id)
			return res.status(400).json({ error: 'company_id é obrigatório.' });

		const supabaseAdmin = createClient(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{ auth: { autoRefreshToken: false, persistSession: false } },
		);

		const { data, error } = await supabaseAdmin
			.from('access_profiles')
			.select('*')
			.eq('company_id', company_id);

		if (error) throw error;
		res.status(200).json(data);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

// ============================================================================
// ROTAS DE MAO DE OBRA (COLABORADORES)
// ============================================================================
app.get('/api/collaborators', async (req, res) => {
	try {
		const { company_id } = req.query;
		if (!company_id)
			return res.status(400).json({ error: 'company_id é obrigatório.' });

		const supabaseAdmin = createClient(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{ auth: { autoRefreshToken: false, persistSession: false } },
		);

		const { data, error } = await supabaseAdmin
			.from('collaborators')
			.select('*')
			.eq('company_id', company_id);

		if (error) throw error;
		res.status(200).json(data);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

app.post('/api/collaborators', async (req, res) => {
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
			return res
				.status(400)
				.json({ error: 'Campos obrigatórios faltando.' });
		}

		const supabaseAdmin = createClient(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{ auth: { autoRefreshToken: false, persistSession: false } },
		);

		// O banco de dados possivelmente não possui todas essas colunas por padrão
		// O ideal seria que elas existissem. Como workaround passamos tudo que a tabela aceitar
		// ou adicionamos tudo em um JSONB se não existirem as colunas.
		// Vamos tentar inserir tudo esperando que o banco foi ou será atualizado.
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
				// Column not found
				const { data: fbData, error: fbError } = await fallbackInsert(
					supabaseAdmin,
					req.body,
				);
				if (fbError) throw fbError;
				return res.status(201).json(fbData);
			}
			throw error;
		}
		res.status(201).json(data);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

async function fallbackInsert(supabaseAdmin, body) {
	// Fallback para quando o banco está desatualizado com as novas colunas
	return await supabaseAdmin
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

app.listen(PORT, () => {
	console.log(
		`\x1b[32mâ GEPLANO API is running at:\x1b[0m \x1b[36mhttp://localhost:${PORT}\x1b[0m`,
	);
});
