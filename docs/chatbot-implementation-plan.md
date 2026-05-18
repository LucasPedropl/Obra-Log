# Plano de Implementação: Chatbot de IA Obra-Log

Este documento detalha a estratégia para implementar um assistente de inteligência artificial integrado ao ecossistema Obra-Log, permitindo que gestores e colaboradores interajam com os dados da obra de forma natural.

## 1. Visão Geral
O chatbot servirá como um "copiloto" para a gestão de obras, capaz de responder perguntas sobre estoque, ferramentas, equipamentos alugados e movimentações recentes.

## 2. Arquitetura Proposta

### Stack Tecnológica
- **Motor de IA**: OpenAI GPT-4o ou Claude 3.5 Sonnet.
- **Framework**: [Vercel AI SDK](https://sdk.vercel.ai/docs) (para streaming de respostas e tool calling).
- **Integração**: Server Actions existentes no Next.js.
- **Interface**: Componente React customizado utilizando Shadcn/UI e Tailwind CSS.

### Fluxo de Dados
1. O usuário faz uma pergunta na UI.
2. O prompt é enviado para uma API Route ou Server Action.
3. O LLM analisa a intenção e decide se precisa chamar alguma "Tool" (ex: `get_inventory_status`).
4. A Tool executa a lógica necessária via Supabase (respeitando RLS).
5. O LLM processa o resultado e retorna uma resposta em linguagem natural.

## 3. Funcionalidades de Lançamento (MVP)

### A. Consulta de Inventário e Insumos
- "Quanto de cimento ainda temos no estoque?"
- "Quais itens estão abaixo do limite mínimo?"
- "Qual foi a última entrada de areia?"

### B. Gestão de Ferramentas e Equipamentos
- "Quem está com a furadeira X hoje?"
- "Quais equipamentos alugados vencem esta semana?"
- "Liste todas as ferramentas em uso na obra."

### C. Movimentações e Histórico
- "Resuma as movimentações de ontem."
- "Quem retirou material na última hora?"

### D. Colaboradores
- "Quantos colaboradores estão ativos hoje?"
- "Liste os colaboradores por função."

## 4. Plano de Execução

### Fase 1: Setup e Infraestrutura
- Configurar variáveis de ambiente (`OPENAI_API_KEY`).
- Instalar dependências (`ai`, `openai`).
- Criar a estrutura básica em `apps/app/src/features/ai-assistant`.

### Fase 2: Desenvolvimento de Tools (Funções)
- Criar mapeamento entre intenções da IA e Server Actions (ex: conectar com `getObraOverviewStats`).
- Implementar proteção de contexto (garantir que a IA só acesse dados da obra atual do usuário).

### Fase 3: Interface do Usuário (UI/UX)
- Desenvolver o componente `ChatBot` (floating bubble).
- Implementar suporte a markdown e streaming de texto.
- Adicionar sugestões de perguntas rápidas baseadas no contexto da página.

### Fase 4: Refinamento e Segurança
- Implementar limites de taxa (rate limiting).
- Validar permissões do Supabase (RLS) dentro das ferramentas da IA.
- Testar cenários de "alucinação" e definir instruções de sistema (System Prompt) rigorosas.

## 5. Próximos Passos & Perguntas

### Perguntas para o Time:
1. **Modelo de Custo**: Existe preferência por algum provedor de LLM específico (OpenAI vs Anthropic)?
2. **Privacidade**: Desejam que o histórico de chat seja persistido no banco de dados para auditoria?
3. **Escopo**: O chatbot deve ter permissão para *realizar ações* (ex: dar baixa em material) ou apenas *consultar dados* neste primeiro momento?

---
*Documento gerado por Gemini CLI em 17/05/2026.*
