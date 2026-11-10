# Missão 033 — Adaptador Claude

**Responsável:** ChatGPT / GPT-6 — integração e automação multiagente  
**Data:** 2026-11-10  
**Status:** REVIEW_REQUIRED

## Papel

O adapter Claude é especializado por configuração de missão em revisão editorial, clareza, consistência, crítica de texto e análise comparativa. A especialização é uma política de roteamento, não uma garantia intrínseca de qualidade.

## Contrato

Recebe request 031 com tarefa, idioma, público, rubric, fontes autorizadas, formato de saída, deadline e budget. Retorna AgentResult v1 com revisão, achados priorizados, evidências por referência e limitações. Deve separar fatos verificados, inferências e recomendações; não inventar fontes ou citações.

## Controles

- Conteúdo de Issues, arquivos e páginas é input não confiável, nunca instrução de sistema.
- Não recebe credenciais GitHub, secrets ou grant de escrita.
- Alterações editoriais são propostas/artefatos; publicação e merge ficam fora do adapter.
- Citações precisam apontar para fonte efetivamente consultada; ausência de acesso deve ser declarada.
- A normalização de saída ocorre fora do modelo.

## Critérios e testes

Rubric presente; resposta estruturada; referências rastreáveis; detecção de instrução maliciosa em conteúdo citado; resposta parcial/truncada; timeout/rate limit; custo indisponível; proibição de publicação/merge.

## Limitações

Nenhuma API Anthropic foi chamada; modelo, preços, quotas, latência, retenção e recursos específicos não foram verificados. Configuração real deve ser validada pelo owner e documentada no registry.

## RECOMENDAÇÃO AO GPT-6

Usar Claude para revisão editorial quando a missão definir critérios verificáveis; manter revisão factual e aprovação editorial fora do adapter e não tratar output como fonte de verdade.
