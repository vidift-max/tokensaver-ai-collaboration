# Missão 039 — Limites por provedor

**Responsável:** ChatGPT / GPT-6 — integração e automação multiagente  
**Data:** 2026-11-10  
**Status:** REVIEW_REQUIRED

## Dimensões de quota

Manter limites separados por provider, modelo, tenant (futuro), agent_id e missão:
- requests concorrentes e por janela;
- tokens de entrada/saída por chamada e período;
- custo monetário por chamada, missão e período;
- tempo de execução e deadline;
- tamanho de payload/contexto e artefatos;
- tentativas e fallback;
- limites de dados/região e retenção.

## Enforcement

Reserva de budget antes da chamada; contabilização posterior com origem (provider_reported/estimated/unavailable); reconciliação de discrepância; circuit breaker para 429/5xx; fila com backpressure; fairness entre missões; alerta em 70/85/100% configurável. Valores desconhecidos não equivalem a zero. Limites hard devem ser aplicados pelo gateway/orquestrador, não apenas pelo prompt.

## Pricing e observabilidade

Cada price card deve incluir provider/model, moeda, unidade, fonte oficial, URL, data efetiva, data de verificação e validade. Sem preço confiável, desabilitar custo previsto e registrar unavailable. Nunca inferir preços a partir de nomes de modelos.

## Critérios de aceite

Quota concorrente atômica; hard cap; reserva/release; contabilização; retry-after respeitado; prevenção de budget overspend sob concorrência; logs sem conteúdo sensível.

## Limitações

Nenhum preço ou quota foi consultado ou assumido. Não foram executados testes de provider, billing ou concorrência. Limites numéricos precisam ser definidos pelo owner com dados reais e budget aprovado.

## RECOMENDAÇÃO AO GPT-6

Definir primeiro hard caps internos conservadores no MVP mock; só preencher limites comerciais após fonte oficial e data de verificação. Medição ausente deve bloquear previsões de ROI/custo.
