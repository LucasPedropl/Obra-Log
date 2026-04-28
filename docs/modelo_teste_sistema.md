# 🧪 Protocolo de Teste Geral — ObraLog ERP

Este documento serve como roteiro para validação completa das funcionalidades do sistema. O teste deve ser executado sequencialmente.

**Ponto de Partida:** `http://localhost:3005/dashboard` (Usuário já logado e instância selecionada).

---

## 🏗️ Fase 1: Cadastros Globais (Base de Dados)

### 1. Cadastro de Insumos (Catálogo)
*   **Ação:** Acesse o menu **Insumos**.
*   **Tarefa:** Cadastrar **3 itens** distintos.
*   **Fluxo Obrigatório (Dentro do formulário de cada item):**
    1.  Clique no ícone de engrenagem/configuração ao lado de **Categoria** para cadastrar uma nova categoria (Ex: "EPI", "Ferramenta Elétrica", "Materiais de Construção").
    2.  Clique no ícone de engrenagem ao lado de **Unidade de Medida** para cadastrar uma nova unidade (Ex: "UN", "KG", "M").
    3.  **Item 1:** Nome "Capacete de Segurança", marque como **EPI**.
    4.  **Item 2:** Nome "Furadeira Bosch", marque como **Ferramenta**.
    5.  **Item 3:** Nome "Cimento CP-II", não marque nada especial.
*   **Validação:** Verifique se os 3 itens aparecem na lista global de insumos.

### 2. Cadastro de Colaboradores
*   **Ação:** Acesse o menu **Colaboradores**.
*   **Tarefa:** Cadastrar **3 colaboradores**.
*   **Dados:** Use nomes fictícios, CPF válido (ou máscara compatível) e atribua cargos diferentes.
*   **Validação:** Verifique se os 3 nomes estão listados corretamente.

### 3. Criação da Obra
*   **Ação:** Acesse o menu **Obras**.
*   **Tarefa:** Criar **1 nova obra**.
*   **Dados:** Nome: "Obra de Teste Estrutural".
*   **Validação:** Após criar, clique no card da obra para entrar na **Gestão Interna da Obra**.

---

## 🏗️ Fase 2: Gestão Interna da Obra
*(Ações dentro de `http://localhost:3005/obras/[ID]/...`)*

### 4. Almoxarifado (Estoque Inicial)
*   **Ação:** Entre no menu **Almoxarifado**.
*   **Tarefa:** Adicionar os 3 insumos cadastrados na Fase 1 ao estoque desta obra.
*   **Fluxo:** Clique em "Adicionar ao Inventário", pesquise o item, defina uma quantidade inicial (Ex: 10) e salve. Repita para os 3 itens.
*   **Validação:** O saldo deve ser atualizado para os 3 itens na tabela.

### 5. Movimentações (Entrada/Saída)
*   **Ação:** Entre no menu **Movimentações**.
*   **Tarefa:** Realizar uma **Saída** de insumo (Cimento).
*   **Dados:** Escolha o item "Cimento", quantidade 2, motivo "Aplicação".
*   **Validação:** O histórico de movimentação deve registrar a saída e o saldo no Almoxarifado deve cair para 8.

### 6. Gestão de Colaboradores da Obra
*   **Ação:** Entre no menu **Colaboradores** (Interno da Obra).
*   **Tarefa:** Vincular os 3 colaboradores cadastrados na Fase 1 a esta obra específica.
*   **Validação:** Os 3 nomes devem aparecer na lista de colaboradores ativos na obra.

### 7. Gestão de EPIs (Retirada)
*   **Ação:** Entre no menu **EPIs**.
*   **Tarefa:** Registrar a entrega de um EPI para um colaborador.
*   **Fluxo:** Clique em "Registrar Retirada", selecione um colaborador, selecione o "Capacete de Segurança", quantidade 1 e confirme.
*   **Validação:** Verifique se a retirada aparece no sub-menu **Histórico** de EPIs.

### 8. Gestão de Ferramentas (Empréstimo)
*   **Ação:** Entre no menu **Ferramentas**.
*   **Tarefa:** Emprestar a "Furadeira Bosch" para um colaborador.
*   **Fluxo:** No menu **Disponíveis**, localize a furadeira e clique em "Emprestar". Selecione o colaborador e confirme.
*   **Validação:** 
    1. O item deve sumir de "Disponíveis" e aparecer em **Em Uso**.
    2. Verifique se o registro aparece no sub-menu **Histórico**.

### 9. Equipamentos Alugados
*   **Ação:** Entre no menu **Equip. Alugados**.
*   **Tarefa:** Cadastrar um novo contrato de aluguel.
*   **Dados:** Nome: "Gerador 50kVA", Empresa: "LocaTudo", Data Início: Hoje.
*   **Validação:** O gerador deve aparecer em **Ativos**.

---

## 📊 Fase 3: Visão Geral e Dashboard

### 10. Visão Geral da Obra
*   **Ação:** Entre no menu **Visão Geral** (dentro da obra).
*   **Validação:** Verifique se os indicadores (Cards de resumo) refletem os dados:
    *   Total de itens em estoque.
    *   Ferramentas em uso (deve constar 1).
    *   Equipamentos alugados (deve constar 1).

### 11. Dashboard Principal
*   **Ação:** Volte para o menu principal **Dashboard** (`/dashboard`).
*   **Validação:** O dashboard deve mostrar o resumo consolidado da obra e as últimas movimentações realizadas.

---

## 🏁 Fim do Teste
Se todos os itens acima foram concluídos sem erros de console ou alertas de RLS, o sistema está **estável e aprovado**.