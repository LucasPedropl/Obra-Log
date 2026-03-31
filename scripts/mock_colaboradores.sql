-- 0. Atualizar a tabela de colaboradores (mão de obra global) para incluir as colunas exigidas pelo formulário do frontend
ALTER TABLE collaborators 
ADD COLUMN IF NOT EXISTS cpf character varying,
ADD COLUMN IF NOT EXISTS rg character varying,
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS phone character varying,
ADD COLUMN IF NOT EXISTS cellphone character varying,
ADD COLUMN IF NOT EXISTS email character varying,
ADD COLUMN IF NOT EXISTS cep character varying,
ADD COLUMN IF NOT EXISTS street character varying,
ADD COLUMN IF NOT EXISTS number character varying,
ADD COLUMN IF NOT EXISTS neighborhood character varying,
ADD COLUMN IF NOT EXISTS complement character varying,
ADD COLUMN IF NOT EXISTS state character varying,
ADD COLUMN IF NOT EXISTS city character varying,
ADD COLUMN IF NOT EXISTS profile_id uuid;

-- 1. Cadastro Geral de Mão de Obra da Empresa (Tabela: collaborators)
-- Estes profissionais ficarão disponíveis para serem alocados em qualquer obra.
INSERT INTO collaborators (id, company_id, name, cpf, phone, role_title, status) VALUES
(gen_random_uuid(), (SELECT id FROM companies LIMIT 1), 'João Silva', '111.111.111-11', '11999999991', 'Mestre de Obras', 'ACTIVE'),
(gen_random_uuid(), (SELECT id FROM companies LIMIT 1), 'Pedro Santos', '222.222.222-22', '11999999992', 'Pedreiro', 'ACTIVE'),
(gen_random_uuid(), (SELECT id FROM companies LIMIT 1), 'Lucas Lima', '333.333.333-33', '11999999993', 'Servente', 'ACTIVE'),
(gen_random_uuid(), (SELECT id FROM companies LIMIT 1), 'Marcos Costa', '444.444.444-44', '11999999994', 'Eletricista', 'ACTIVE'),
(gen_random_uuid(), (SELECT id FROM companies LIMIT 1), 'Felipe Neves', '555.555.555-55', '11999999995', 'Encanador', 'ACTIVE');

-- 2. Vínculo do profissional (mão de obra) com a Obra específica (Tabela: site_collaborators)
-- Substitua <ID_DA_OBRA_AQUI> pelo ID real da sua obra.
-- INSERT INTO site_collaborators (id, site_id, collaborator_id) SELECT gen_random_uuid(), '<ID_DA_OBRA_AQUI>', id FROM collaborators;
