# Relatório de Viabilidade Financeira e Estratégia de Precificação - Obra-Log

## 1. Visão Geral
Este documento detalha os custos de infraestrutura necessários para a operação profissional do sistema Obra-Log e propõe modelos de negócios para a comercialização do software (SaaS).

## 2. Custos de Infraestrutura (Estimativa Mensal)

O sistema exige alta confiabilidade e segurança de dados, justificando o uso de planos pagos.

### 2.1 Supabase (Plano Pro)
*   **Custo:** $25.00/mês (~R$ 150,00)
*   **Recursos Críticos:**
    *   **Backups Diários:** Retenção de 7 dias (vital para conformidade trabalhista de EPIs).
    *   **8GB de Banco de Dados:** Suporta milhões de registros de movimentação.
    *   **100GB de Storage:** Armazenamento de fotos de comprovantes e documentos.
    *   **Disponibilidade:** Banco de dados sempre ativo (sem modo "sleep").

### 2.2 Vercel (Hospedagem Frontend)
*   **Plano Free:** R$ 0,00 (Recomendado para fase Beta/Primeiros 2 clientes).
*   **Plano Pro:** $20.00/mês (~R$ 120,00) (Recomendado após validação).
*   **Diferenciais:** Performance otimizada para dispositivos móveis em canteiros de obras e maior limite de tráfego.

**Custo Total Operacional (Estágio Inicial): ~R$ 150,00/mês**
**Custo Total Operacional (Escalado): ~R$ 270,00/mês**

---

## 3. Proposta de Valor (O que estamos vendendo?)
O Obra-Log não é apenas um sistema de estoque, é uma ferramenta de redução de prejuízos:
1.  **Segurança Jurídica:** Prova de entrega e validade de EPIs.
2.  **Economia Real:** Controle de ferramentas e redução de perdas de insumos.
3.  **Gestão de Prazos:** Alerta de vencimento de aluguéis de máquinas.

---

## 4. Estratégia de Precificação Sugerida

### Modelo A: Por Obra (Foco em Construtoras)
| Plano | Limite | Preço Sugerido |
| :--- | :--- | :--- |
| **Starter** | 1 Obra Ativa | R$ 249,00/mês |
| **Professional** | Até 5 Obras | R$ 599,00/mês |
| **Enterprise** | Ilimitado | Sob Consulta |

### Modelo B: Por Usuário (Foco em Escalabilidade)
*   **Valor:** R$ 15,00 a R$ 25,00 por colaborador cadastrado/mês.
*   **Vantagem:** Preço cresce conforme a empresa cresce.

---

## 5. Próximos Passos Recomendados
1.  **Plano Piloto:** Fechar o primeiro cliente por um valor promocional (ex: R$ 299,00) com taxa de setup inclusa.
2.  **Upgrade Supabase:** Migrar para o plano Pro assim que o primeiro contrato for assinado.
3.  **Métricas de Uso:** Monitorar o consumo de Storage para ajustar os limites dos planos no futuro.

---
*Documento gerado em 14 de Maio de 2026*
