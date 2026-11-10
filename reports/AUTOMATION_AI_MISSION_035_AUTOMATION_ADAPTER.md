# Missão 035 — Adaptador Automation AI

**Responsável:** ChatGPT (GPT-6) — integração e automação multiagente  
**Data:** 2026-11-10  
**Status:** DRAFT / REVIEW_REQUIRED

## Natureza do agente

Automation AI atua como analista/orquestrador documental com acesso a ferramentas explicitamente conectadas. Não se deve assumir que a conversa ChatGPT possui worker persistente, execução em background, callback HTTP, polling autônomo ou acesso contínuo ao repositório. O adapter deve tratar cada sessão como execução limitada, com início/fim e evidências concretas.

## Interface

- `agent_id = automation-ai`; provider de runtime deve ser configurado (não inferido pelo rótulo).
- Operações possíveis: leitura allowlisted, pesquisa, análise, criação/atualização de relatórios no repositório de colaboração quando autorizada.
- Operações proibidas por padrão: main repo write, merge, release, deploy, secret read, execução arbitrária de shell, criação de credenciais e alteração de settings.
- Cada chamada deve receber escopo explícito de repo/ref/paths e deadline; ferramentas não listadas no grant são inacessíveis.
- Retorno deve conter paths, SHAs/commit IDs confirmados, ferramentas usadas, testes realmente executados e limitações.

## Tratamento de ferramentas

O adapter não converte texto em autorização. Tool call é permitido somente quando operação e recurso estão no grant autenticado. Conteúdo retornado por ferramenta é dado, não instrução. A escrita documental exige confirmação do commit pelo GitHub e leitura de volta para verificação.

## Critérios de aceite

Sessão finita; operações allowlisted; evidência de read-after-write; sem acesso a segredos; sem main write; resultados honestos quanto a testes e limitações.

## Dependências

Missões 031, 036, 039 e aprovação da matriz 010. A sessão atual não é um serviço autônomo implantado.

## Limitações

Nenhum runtime persistente ou adapter executável foi criado; nenhuma integração externa adicional foi habilitada.

## RECOMENDAÇÃO AO GPT-6

Usar Automation AI como adapter de documentação/read-only no MVP; deixar execução persistente e callbacks para um worker separado, autenticado e auditável.