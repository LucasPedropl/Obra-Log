---
trigger: always_on
---

---
description:
    Diretrizes de Arquitetura, Engenharia e Boas Práticas para o Sistema
    Obra-Log (ERP Multi-Tenant e Super-Admin)
---

# Missão do Projeto

Seu objetivo neste projeto é construir um sistema SaaS robusto, composto por um **Painel de Gestão ERP Multi-Tenant** focado em gerenciamento de obras e um **Painel Super-Admin isolado**. 

# Dicas/Sugestões de Contexto do Projeto:

- **banco_atual.sql**: Em `/docs/banco_atual.sql` tem um dump do banco de dados atual. Use-o para entender a estrutura do banco e as relações entre as tabelas. Isso vai te ajudar a criar os hooks e services de forma mais eficiente. 
- **Modificações de Banco**: Se for preciso modificar o banco para o que precisa ser feito, gere o código SQL correspondente e me passe diretamente no chat para que eu possa rodar no SQL Editor do Supabase.