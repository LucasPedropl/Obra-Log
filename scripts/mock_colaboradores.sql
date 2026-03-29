-- 1. Cadastro Geral de Mão de Obra da Empresa (Tabela: collaborators)
-- Estes profissionais ficarão disponíveis para serem alocados em qualquer obra.
INSERT INTO collaborators (id, company_id, name, document, role_title, status) VALUES
(gen_random_uuid(), (SELECT id FROM companies LIMIT 1), 'João Silva', '111.111.111-11', 'Mestre de Obras', 'ACTIVE'),
(gen_random_uuid(), (SELECT id FROM companies LIMIT 1), 'Pedro Santos', '222.222.222-22', 'Pedreiro', 'ACTIVE'),
(gen_random_uuid(), (SELECT id FROM companies LIMIT 1), 'Lucas Lima', '333.333.333-33', 'Servente', 'ACTIVE'),
(gen_random_uuid(), (SELECT id FROM companies LIMIT 1), 'Marcos Costa', '444.444.444-44', 'Eletricista', 'ACTIVE'),
(gen_random_uuid(), (SELECT id FROM companies LIMIT 1), 'Felipe Neves', '555.555.555-55', 'Encanador', 'ACTIVE');

-- 2. (Opcional) Vínculo do profissional (mão de obra) com a Obra específica (Tabela: site_collaborators)
-- Caso você vá testar a vinculação diretamente pela interface do sistema, você NÃO precisa rodar o script abaixo.
-- Se quiser vincular direto pelo banco de dados, insira o ID da obra abaixo e execute:
-- INSERT INTO site_collaborators (id, site_id, collaborator_id) SELECT gen_random_uuid(), '<ID_DA_OBRA_AQUI>', id FROM collaborators;
