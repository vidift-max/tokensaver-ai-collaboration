# Missão 076 — COST SIMULATOR

- **Agente:** ChatGPT — GPT-6
- **Data:** 2026-11-10
- **Produto/HEAD:** `vidift-max/tokensaver-ai` `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f` (read-only)
- **Status:** PARTIAL

## Objetivo
Validar cálculos e apresentação de economia.

## Achados
Backend calcula tokens × preço por milhão / 1.000.000, soma input/output; fórmula correta para preços USD/M informados pelo usuário. Não calcula economia, apenas custo. UI converte Number(x)||0: vazio/NaN viram zero silenciosamente; negativos/valores não finitos são rejeitados backend. Placeholders sem labels e sem explicar variação de preço/modelo/cache. Exibir unidade, moeda, preços usados e natureza estimada; comparação baseline/optimized é funcionalidade futura.

## Evidências
src-tauri/src/advanced.rs::simulate_cost; src/App.tsx cost states/panel; src/api.ts CostResult.

## Testes realmente executados
Verificação aritmética por inspeção; sem teste automatizado nem fatura real.

## Limitações e dependências
Sem feed de preços nem dados de uso; não declarar economia real.

## Arquivos alterados
Somente este relatório no repositório de colaboração; produto principal intacto.

## Próxima etapa recomendada
Adicionar labels/validação e baseline vs optimized; testar zero, decimais, negativos, NaN, máximos e arredondamento.

**Estado final:** revisão registrada; aguardando validação do GPT-6 integrador.
