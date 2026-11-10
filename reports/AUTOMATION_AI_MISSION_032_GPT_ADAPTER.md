# Missão 032 — Adaptador GPT

**Responsável:** ChatGPT / GPT-6 — integração e automação multiagente  
**Data:** 2026-11-10  
**Status:** REVIEW_REQUIRED

## Papel

O adapter GPT atende tarefas de síntese, planejamento, análise técnica, decomposição de missões e integração. Atribuição deve ser explícita no registry; não presumir que todo modelo OpenAI tem as mesmas ferramentas, contexto, modalidades ou permissões.

## Mapeamento

- Entrada: request canônico 031, instrução de missão, critérios de aceite, referências de arquivos e limites de contexto.
- Execução: invocação pelo gateway autorizado, com modelo/versão e parâmetros registrados; ferramentas só por allowlist externa.
- Saída: resposta normalizada para AgentResult v1; conclusões sem evidência ficam identificadas como inferência/limitação.
- Evidências: referências de arquivo/commit, hashes de artefatos e logs de execução sem prompt/segredo integral.
- Limites: deadline, tokens, custo e tamanho de contexto fornecidos pelo orquestrador; indisponibilidade de medição vira `unavailable`.

## Regras específicas

Não usar o nome do modelo como autenticação. O papel de integrador é autoridade de governança apenas quando autenticado por identidade e grant externos. Um GPT executor não pode aprovar a própria entrega, conceder permissões ou escrever no repositório principal. Saída estruturada deve ser validada; recusa/safety e tool failure são estados distintos.

## Critérios de aceite

Request/response mapeados; modelo e versão rastreáveis; saída estruturada validada; tool calls restritas; custos desconhecidos não zerados; nenhuma autoridade implícita derivada do provider.

## Testes requeridos

Mock de resposta válida/inválida; saída truncada; refusal; timeout; rate limit; tool call não permitida; token/custo ausente; tentativa de declarar APPROVED ou main write.

## Limitações

Não foi feita chamada à API OpenAI nem assumida disponibilidade de endpoint, modelo, preço ou quota específica. O documento descreve o adapter lógico e precisa ser validado contra a interface real escolhida pelo owner.

## RECOMENDAÇÃO AO GPT-6

Manter GPT adapter atrás de gateway; registrar modelo/versão e separar identidade de execução da identidade de aprovação.
