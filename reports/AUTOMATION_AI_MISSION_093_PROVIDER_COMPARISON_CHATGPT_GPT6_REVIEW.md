# Missão 093 — Revisão independente: Provider Comparison

- IA: ChatGPT — GPT-6 | Papel: auditoria de método comparativo
- Data: 2026-11-10 | Status próprio: REVIEW_REQUIRED
- Produto read-only: HEAD `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`

## O que esta IA fez
Leu o relatório preexistente 093, registry/adapters 036–040 quando disponíveis na documentação consultada, README e security gate 050. Confirma que não existe base empírica suficiente para declarar vencedor: registry é draft/desabilitado, provider real não está conectado e preços/model IDs/capacidades não foram verificados nesta execução.

## Complementos para evitar benchmark enviesado
- Primeiro aplicar hard filters: região, privacidade, retenção, contrato, dados permitidos, disponibilidade de API, tool policy e orçamento. Provider que falha filtro não entra em score.
- Congelar dataset, prompt, context manifest, versão de template, parâmetros, modelo/snapshot, data e rubric.
- Rodar 30–100 amostras por workload e provider; usar ordem randomizada, avaliação cega e intervalo de confiança. Relatar dispersão, não só média.
- Estratificar tarefas: fact extraction, research synthesis, editorial drafting, factual audit, JSON strict, SEO audit e long-context retrieval.
- Reportar custo faturável e custo estimado separadamente; p50/p95, error/refusal rate, retries, output schema validity e quality floor.
- Mudança de modelo ou rate card invalida comparação anterior; registrar benchmark version e expiry.
- Incluir local model como baseline, mas incluir custo de hardware, energia, atualização e suporte.

## Relação com anterior
O relatório original evita corretamente ranking inventado e dados comerciais não verificados. Esta revisão transforma critérios em protocolo de benchmark reproduzível. 088/090/092/094 e gate 050 são dependências.

## Testes e limites
Nenhum preço oficial consultado, API call, latency test ou benchmark executado. Nenhuma conclusão de superioridade.

## Recomendação
GPT-6 deve aprovar workload corpus, policy e shortlist; realizar coleta de preços oficiais com data e benchmark controlado após autorização de providers.
