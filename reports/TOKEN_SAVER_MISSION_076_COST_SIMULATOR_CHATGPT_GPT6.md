# Missão 076 — Cost simulator

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: revisão de cálculo financeiro, validação de entrada e UX de custos
- Data: 2026-11-10
- Status: REVIEW_REQUIRED — fórmula conferida estaticamente; testes não executados

## Objetivo
Validar cálculos e apresentação de economia/custo.

## O que esta IA fez
Inspecionou `runCost` em `src/App.tsx`, API em `src/api.ts` e `simulate_cost` em `src-tauri/src/advanced.rs`.

## Evidências
- Fórmula backend: input_tokens × input_price_per_million / 1.000.000; idem output; total é soma. A fórmula é matematicamente correta para preço USD por milhão de tokens.
- Backend rejeita tokens acima de 100.000.000, preços negativos e valores não finitos.
- UI converte strings com `Number(value)||0`; campos vazios, inválidos e zero viram zero; não valida feedback inline, sinaliza unidade apenas em placeholder.
- Preços são informados manualmente; não há provider/model, fonte ou data de atualização do preço, comparação de cenário ou baseline.
- UI mostra custos de entrada/saída/total em USD com seis casas; não calcula economia percentual/absoluta entre dois cenários.
- Não há testes dedicados da fórmula apresentados nesta missão.

## Problemas e gravidade
MÉDIO — fórmula correta, mas UX permite entradas inválidas silenciosamente tratadas como zero. MÉDIO — sem origem/data/modelo, estimativas podem parecer preços atuais oficiais. BAIXO/MÉDIO — nome “Cost Simulator” não promete savings calculation, mas o plano pede apresentação de economia; essa métrica não está implementada.

## Recomendações
- Campos tipados e validados: tokens inteiros >=0; preço decimal >=0; rejeitar NaN/Infinity/overflow; mensagens inline.
- Exibir fórmula, unidade USD / 1M tokens, arredondamento e aviso “preços informados pelo usuário; não são feed oficial”.
- Adicionar cenários A/B com mesmos volumes e preços diferentes; economia = custo baseline − custo otimizado; percentual somente quando baseline >0.
- Associar preço a provider/model, effective_date, source_url opcional e moeda; não embutir tabela de preço sem atualização/validação.
- Adicionar vetores de teste: zeros, 1 token, 1M tokens, preço fracionário, máximo permitido, negativo, NaN, Infinity e arredondamento.

## Testes executados
Não executado. Fórmula revisada por leitura de código; nenhum teste numérico foi rodado.

## Arquivos examinados ou alterados
Examinados: `src/App.tsx`, `src/api.ts`, `src-tauri/src/advanced.rs`. Nenhum arquivo do produto alterado.

## Relação com trabalhos anteriores
Complementa missão de custos/controle de budgets; não confunde custo simulado com billing real nem savings de tokens já medido.

## RECOMENDAÇÃO AO GPT-6
Manter fórmula backend; melhorar validação e transparência de preço antes de acrescentar comparação de economia. Testar casos-limite em Rust e UI.
