# Planejamento Final: Reconstrução do Banco de Dados Obra-Log

Este documento detalha a nova arquitetura do banco de dados, estruturada em 3 níveis de profundidade, com isolamento total de instâncias e um sistema híbrido de permissões.

## 1. Hierarquia de Dados (As 3 Camadas)

1.  **Accounts (Conta/Empresa)**: 
    *   O nível mais alto, gerenciado via `apps/admin`.
    *   Representa o contrato e o usuário "Dono/Titular".
    *   Define o limite de instâncias contratadas.
    *   Contém os **Perfis de Acesso Globais**.

2.  **Instances (Unidade/Filial/Instância)**: 
    *   Subdivisões da conta (ex: Filial Sul, Filial Norte).
    *   **Isolamento Total**: Cada instância possui seus próprios Insumos, Ferramentas, Categorias, Unidades de Medida e Colaboradores.
    *   Dados de uma instância nunca vazam para outra.

3.  **Construction Sites (Obras)**: 
    *   Projetos físicos dentro de uma instância.
    *   **Almoxarifado da Obra**: Composto pelo saldo dos itens do catálogo da instância + Equipamentos Alugados exclusivos daquela obra (com tag "Alugado").
    *   **Colaboradores da Obra**: Subconjunto de colaboradores da instância alocados para aquela frente de trabalho.

## 2. Gestão de Usuários e Perfis de Acesso

O sistema utiliza um modelo RBAC (Role-Based Access Control) sofisticado:

*   **Administradores de Conta**: Poder total sobre a conta e todas as instâncias. Não podem se excluir mutuamente (apenas o Super Admin no painel administrativo tem esse poder).
*   **Perfis Globais (Templates)**: Criados pelo Titular no nível da conta.
    *   Permissões granulares por página: Visualizar, Cadastrar, Editar, Excluir, Importar e Exportar.
    *   **Dependência Lógica**: Se "Visualizar" for `false`, todas as outras ações daquela página são automaticamente desativadas.
*   **Escopo de Obra**:
    *   O perfil define se o usuário vê **Tudo** na instância ou apenas **Obras Selecionadas**.
    *   Se for selecionada, o Admin deve marcar manualmente quais obras o usuário acessa.
*   **Usuários Globais vs Granulares**:
    *   Um usuário pode ter acesso a **Todas as Instâncias** (atuais e futuras) com um perfil padrão.
    *   Ou pode ter acesso apenas a instâncias específicas, com perfis possivelmente diferentes em cada uma.

## 3. Colaboradores e Acesso ao Sistema

*   **Registro Interno**: O cadastro de colaborador serve primariamente para controle de entregas (EPIs) e cautelas (Ferramentas).
*   **Acesso Opcional**: No cadastro do colaborador, se um "Perfil de Acesso" for selecionado, o sistema cria automaticamente um usuário no Supabase Auth, permitindo que ele logue no ERP.

## 4. Regras de Negócio e Integridade

*   **Unidades de Medida**: Toda nova instância recebe um pacote padrão (Un, Kg, M, etc.). Esses itens são protegidos contra edição ou exclusão (flag `is_system_default`).
*   **Exclusão Destrutiva**:
    1.  O sistema gera um relatório de impacto (obras e saldos afetados).
    2.  Se confirmado, exclui em cascata (`CASCADE`) saldos e empréstimos em aberto.
    3.  **Histórico Preservado**: Movimentações financeiras e histórico de EPIs são mantidos com referência `SET NULL` para o item excluído, garantindo integridade de auditoria.
*   **Equipamentos Alugados**: São cadastrados diretamente na obra. Não aparecem no catálogo global da filial para não poluir a lista de insumos permanentes.

## 5. Próximos Passos (Implementação)

1.  **Script SQL**: Gerar e aplicar o DDL completo (Tabelas, FKs, RLS, Triggers).
2.  **Seed Data**: Inserir unidades de medida e perfis básicos.
3.  **Atualização de Actions**: Refatorar todas as chamadas no ERP para respeitar os 3 níveis de ID (`account_id`, `instance_id`, `site_id`).
4.  **Middleware de Segurança**: Implementar a verificação da matriz de permissões no lado do servidor.
