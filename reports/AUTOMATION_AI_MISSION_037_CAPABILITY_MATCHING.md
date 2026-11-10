# Missão 037 — Capability Matching

**Responsável:** ChatGPT / GPT-6 — integração e automação multiagente  
**Data:** 2026-11-10  
**Status:** REVIEW_REQUIRED

## Objetivo

Selecionar o agente elegível para uma missão sem confundir qualidade presumida com capacidade comprovada. A seleção deve ser determinística, explicável e reproduzível.

## Pipeline de decisão

1. Aplicar hard filters: provider ENABLED, task type compatível, formato/idioma suportado, trust tier suficiente, dados/região permitidos, deadline e budget viáveis.
2. Excluir perfis com health state DOWN/DISABLED ou quota conhecida insuficiente.
3. Pontuar elegíveis por evidência de qualidade da tarefa, latência observada, custo observado e disponibilidade; ponderações configuradas por classe de missão.
4. Aplicar restrições de independência: auditor não pode ser o mesmo agente executor nem compartilhar identidade de aprovação.
5. Selecionar melhor candidato e registrar alternativas, motivo de exclusão, versão do registry e dados usados.
6. Se nenhum candidato satisfaz os hard filters, retornar BLOCKED; nunca relaxar segurança automaticamente.

## Política de score

Score só é calculado entre candidatos elegíveis. Métricas ausentes são unknown e não recebem score artificial. Segurança, autorização, compatibilidade de dados e budget são gates binários, não fatores compensáveis.

## Critérios de aceite

Mesma entrada/registry resulta na mesma escolha; decisão explicável; candidato incompatível rejeitado; métricas ausentes explícitas; sem candidato gera BLOCKED; seleção e registry versionados.

## Limitações

Não existem métricas comparativas reais dos providers nesta entrega; não se recomenda pesos numéricos até coletar benchmark homogêneo.

## RECOMENDAÇÃO AO GPT-6

Implementar primeiro matching por regras duras e ranking simples somente após telemetria; nunca selecionar modelo por custo isolado nem permitir fallback que burle a política de dados.
