# PLANO MESTRE — MISSÕES 002 A 100

## Objetivo

Este documento transforma o trabalho da equipe em um backlog organizado de longo prazo. As missões ficam registradas desde já, mas **não significa que todas devem executar código ao mesmo tempo**.

A regra é:
- missões independentes podem trabalhar em paralelo;
- missões com dependência aguardam os pré-requisitos;
- nenhuma IA deve alterar o projeto principal sem autorização explícita do GPT-6;
- cada missão produz seu próprio relatório/evidência;
- o status é controlado no GitHub;
- o trabalho deve ser entregue de forma incremental e verificável.

## Papéis

- GPT-6: arquitetura, integração, decisão final, aprovação de mudanças.
- Claude: editorial, conteúdo, UX textual, SEO e estruturas de conteúdo quando autorizado.
- Kimi: auditoria técnica, segurança, revisão e testes de riscos.
- Automation AI: orquestração, automação, contratos, filas, eventos, observabilidade e infraestrutura multiagente.

## Estados

BACKLOG -> READY -> RUNNING -> REVIEW_REQUIRED -> APPROVED -> COMPLETED

Alternativos: BLOCKED, FAILED, RETRY_PENDING, CANCELLED.

## Missão 002

**STATUS: CONCLUÍDA**

Mapa de capacidades, roadmap e futuras missões registrados nos relatórios da Missão 002.

---

# FASE A — CONTRATOS E GOVERNANÇA

### MISSÃO 003 — Contrato JSON Schema v1
Definir e congelar o contrato de missão, resultado, evidência, erro e metadados.

### MISSÃO 004 — Máquina de estados
Definir transições válidas, invariantes e regras de concorrência.

### MISSÃO 005 — Validação de entregas
Criar especificação de validação automática de resultados, evidências e status.

### MISSÃO 006 — Webhook seguro
Especificar ingress assinado, replay protection e validação de origem.

### MISSÃO 007 — Inbox idempotente
Definir deduplicação de eventos e execução única.

### MISSÃO 008 — Lease e fencing
Definir lock distribuído, lease, renovação e fencing token.

### MISSÃO 009 — Retry e timeout
Definir políticas de retry, backoff, dead-letter e timeout.

### MISSÃO 010 — Permissões
Definir matriz de permissões por IA, repositório, operação e ambiente.

---

# FASE B — ORQUESTRADOR MVP

### MISSÃO 011 — Modelo de dados
Definir tabelas para missions, runs, events, leases, agents, evidence e costs.

### MISSÃO 012 — Inbox/outbox
Definir garantia de entrega e processamento de eventos.

### MISSÃO 013 — Worker mock
Criar especificação do primeiro worker sem provedor real.

### MISSÃO 014 — Fluxo ponta a ponta
Executar missão mock desde criação até REVIEW_REQUIRED.

### MISSÃO 015 — Auditoria de concorrência
Testar duplicidade, corrida, lease expirado e fencing.

### MISSÃO 016 — Falhas e recuperação
Testar crash, timeout, retry e retomada.

### MISSÃO 017 — Ledger de custos
Definir registro de tokens, chamadas, preço estimado e custo real.

### MISSÃO 018 — Observabilidade MVP
Definir logs estruturados, métricas e correlação por mission_id/run_id.

### MISSÃO 019 — Dashboard operacional
Especificar painel de fila, agentes, falhas, custos e missões.

### MISSÃO 020 — Auditoria do MVP
Kimi revisa todo o MVP antes de qualquer provedor real.

---

# FASE C — GITHUB AUTOMATION

### MISSÃO 021 — Issues como fila
Definir criação, atualização e fechamento automático de Issues.

### MISSÃO 022 — Labels e prioridades
Padronizar labels de missão, risco, agente e prioridade.

### MISSÃO 023 — GitHub Actions
Definir workflows de validação e automação.

### MISSÃO 024 — Dispatch de eventos
Definir repository_dispatch/workflow_dispatch quando aplicável.

### MISSÃO 025 — Status checks
Definir checks obrigatórios antes de aprovação.

### MISSÃO 026 — Artefatos
Padronizar relatórios, logs e evidências como artefatos.

### MISSÃO 027 — PR gates
Definir regras para impedir merge sem validação.

### MISSÃO 028 — Rollback
Definir recuperação de mudanças automatizadas.

### MISSÃO 029 — Auditoria Git
Rastrear autor, agente, commit, missão e evidência.

### MISSÃO 030 — Teste de segurança GitHub
Auditar secrets, tokens, permissões e eventos.

---

# FASE D — ADAPTADORES DE IA

### MISSÃO 031 — Interface Agent Adapter
Definir interface comum para provedores.

### MISSÃO 032 — Adaptador GPT
Especificar entrada, saída, limites e evidências.

### MISSÃO 033 — Adaptador Claude
Especificar tarefas editoriais e integração.

### MISSÃO 034 — Adaptador Kimi
Especificar auditoria e revisão.

### MISSÃO 035 — Adaptador Automation AI
Especificar tarefas de orquestração.

### MISSÃO 036 — Provider registry
Criar catálogo de agentes/provedores e capacidades.

### MISSÃO 037 — Capability matching
Definir seleção automática da IA mais adequada.

### MISSÃO 038 — Fallback de provedor
Definir substituição segura quando uma IA falhar.

### MISSÃO 039 — Limites por provedor
Definir quotas, tokens, tempo e custo.

### MISSÃO 040 — Testes dos adapters
Validar contratos usando mocks antes de APIs reais.

---

# FASE E — SEGURANÇA

### MISSÃO 041 — Threat model
Modelar ameaças de toda a arquitetura.

### MISSÃO 042 — Prompt injection
Criar defesa contra instruções maliciosas vindas de arquivos/issues.

### MISSÃO 043 — Tool injection
Restringir operações perigosas executadas por agentes.

### MISSÃO 044 — Least privilege
Aplicar menor privilégio por agente.

### MISSÃO 045 — Secrets
Definir armazenamento, rotação e exposição mínima.

### MISSÃO 046 — Supply chain
Auditar dependências e artefatos.

### MISSÃO 047 — SSRF e endpoints
Validar URLs e destinos externos.

### MISSÃO 048 — Replay
Testar replay de webhooks e eventos.

### MISSÃO 049 — Data exfiltration
Criar controles contra vazamento de contexto.

### MISSÃO 050 — Security gate
Criar checklist obrigatório antes de produção.

---

# FASE F — TOKEN SAVER: ESTABILIZAÇÃO

### MISSÃO 051 — Smart Context
Implementar limites globais de leitura/processamento após aprovação.

### MISSÃO 052 — Project Memory
Corrigir concorrência do limite de entradas.

### MISSÃO 053 — Paginação
Adicionar paginação/budgets em artigos, templates e links.

### MISSÃO 054 — OneShot Capture
Endurecer filesystem, crash recovery e concorrência.

### MISSÃO 055 — Backup restore
Adicionar limites de recursos e validação de manifest.

### MISSÃO 056 — Restore destination
Eliminar condições de corrida no destino de restauração.

### MISSÃO 057 — Import roots
Corrigir concorrência e limites de importação.

### MISSÃO 058 — Limits audit
Unificar e revisar limites de todos os módulos.

### MISSÃO 059 — Long operations
Aplicar timeout real onde atualmente só existe configuração.

### MISSÃO 060 — Batch validation
Integrar validação batch ao fluxo produtivo.

### MISSÃO 061 — Database migrations
Revisar e consolidar blocos duplicados de migração.

### MISSÃO 062 — Error handling
Padronizar erros e mensagens de fronteira.

### MISSÃO 063 — Filesystem audit
Auditar todos os caminhos, symlinks, junctions e TOCTOU.

### MISSÃO 064 — Resource exhaustion
Testar memória, CPU, disco e arquivos grandes.

### MISSÃO 065 — Integration tests
Criar suíte de integração dos módulos críticos.

### MISSÃO 066 — Regression suite
Transformar achados das auditorias em testes permanentes.

### MISSÃO 067 — CI hardening
Garantir build/test/lint e checks obrigatórios.

### MISSÃO 068 — Tauri security
Auditar comandos, permissões e fronteiras frontend/backend.

### MISSÃO 069 — Frontend audit
Auditar estado, erros, acessibilidade e consistência.

### MISSÃO 070 — Release readiness
Criar checklist técnico para versão candidata.

---

# FASE G — PRODUTO E EXPERIÊNCIA

### MISSÃO 071 — UX audit
Auditar fluxos principais do usuário.

### MISSÃO 072 — Onboarding
Definir onboarding simples e seguro.

### MISSÃO 073 — Project workflow
Revisar criação, abertura, edição e fechamento de projetos.

### MISSÃO 074 — File Center
Revisar UX e limites do File Center.

### MISSÃO 075 — Smart Context UX
Explicar ao usuário o que foi incluído/excluído do contexto.

### MISSÃO 076 — Cost simulator
Validar cálculos e apresentação de economia.

### MISSÃO 077 — Project Memory UX
Melhorar consulta, organização e proteção da memória.

### MISSÃO 078 — Templates
Auditar sistema de templates e versionamento.

### MISSÃO 079 — Editorial engine
Auditar fluxo editorial sem conectar publicação real.

### MISSÃO 080 — Article library
Auditar biblioteca e links internos.

### MISSÃO 081 — Final page builder
Auditar construção de páginas e limites.

### MISSÃO 082 — OneShot UX
Auditar captura e recuperação do usuário.

### MISSÃO 083 — Settings
Auditar configurações, histórico e segurança.

### MISSÃO 084 — Accessibility
Auditar navegação por teclado, contraste, foco e semântica.

### MISSÃO 085 — Product documentation
Criar documentação de uso baseada no produto real.

---

# FASE H — IA, SEO E CONTEÚDO

### MISSÃO 086 — Context optimization
Definir estratégias de redução de tokens sem perda de informação.

### MISSÃO 087 — Prompt templates
Criar biblioteca versionada de prompts seguros.

### MISSÃO 088 — Editorial orchestration
Definir como Claude e GPT colaboram em conteúdo.

### MISSÃO 089 — SEO intelligence specification
Especificar inteligência SEO sem implementar publicação.

### MISSÃO 090 — Content quality gate
Definir validação editorial, factual e estrutural.

### MISSÃO 091 — Internal linking intelligence
Melhorar recomendação de links internos com limites.

### MISSÃO 092 — Content cost optimizer
Otimizar custo por etapa editorial.

### MISSÃO 093 — Provider comparison
Comparar provedores por qualidade, custo, latência e adequação.

### MISSÃO 094 — Local model strategy
Avaliar tarefas que podem migrar para modelos locais/open source.

---

# FASE I — SAAS E PRODUÇÃO

### MISSÃO 095 — SaaS architecture
Definir arquitetura futura SaaS sem alterar ainda a aplicação desktop.

### MISSÃO 096 — Multitenancy
Definir isolamento de tenant, projeto, usuário e dados.

### MISSÃO 097 — Authentication
Definir autenticação e autorização futuras.

### MISSÃO 098 — Billing and quotas
Definir planos, quotas, medição e controle de custos.

### MISSÃO 099 — Production readiness
Auditar segurança, observabilidade, recuperação, custos e operação.

### MISSÃO 100 — FINAL INTEGRATION AUDIT
Fazer auditoria final de toda a arquitetura, TokenSaver, automação multiagente, segurança, testes, documentação e roadmap SaaS.

Entregar:
- matriz de requisitos;
- itens concluídos;
- itens pendentes;
- riscos residuais;
- evidências;
- testes executados;
- decisões que ainda dependem do GPT-6;
- recomendação para release.

---

# REGRA DE EXECUÇÃO CONJUNTA

As missões devem ser tratadas como um **programa contínuo**, não como 99 comandos independentes enviados ao usuário.

## Podem executar em paralelo

- documentação;
- auditorias independentes;
- análise de UX;
- threat modeling;
- análise de custos;
- contratos;
- testes que não alterem o mesmo componente;
- tarefas editoriais sem dependência técnica.

## Devem aguardar dependências

Uma missão que modifica ou valida uma decisão anterior só pode começar quando o pré-requisito estiver APPROVED.

Exemplo:

003 -> 004 -> 007/008/009 -> 011/012 -> 013/014 -> 015/016 -> 020.

A estabilização 051-070 deve usar os achados reais do código e não pode ser considerada concluída apenas por documentação.

## Regra de entrega

Cada missão deve produzir:
1. status;
2. relatório;
3. evidências;
4. testes realmente executados;
5. limitações;
6. arquivos alterados;
7. dependências;
8. recomendação da próxima etapa.

## Regra de código

Nenhuma missão deste plano autoriza automaticamente alteração no TokenSaver principal.

Quando uma missão concluir que código deve ser alterado:
- registrar proposta;
- apontar arquivos;
- explicar risco;
- aguardar autorização do GPT-6;
- depois implementar;
- executar testes;
- registrar evidências.

## Regra contra trabalho duplicado

Antes de iniciar uma missão, a IA deve verificar:
- status atual;
- relatórios existentes;
- commits recentes;
- Issues relacionadas;
- se outra IA já resolveu o mesmo problema.

Se já estiver resolvido, deve validar a solução em vez de duplicá-la.

## Organização dos resultados

Relatórios devem usar:

reports/AUTOMATION_AI_MISSION_XXX_<TEMA>.md

Para auditorias do produto:

reports/TOKEN_SAVER_MISSION_XXX_<TEMA>.md

Para segurança:

reports/SECURITY_MISSION_XXX_<TEMA>.md

Para decisões arquiteturais:

reports/ADR_MISSION_XXX_<TEMA>.md

## Objetivo final

Chegar à Missão 100 com:
- TokenSaver tecnicamente estabilizado;
- automação multiagente verificável;
- colaboração entre GPT-6, Claude, Kimi e Automation AI;
- segurança e permissões controladas;
- custos mensuráveis;
- testes e evidências rastreáveis;
- documentação consistente;
- base preparada para evolução SaaS.

**IMPORTANTE:** registrar o plano inteiro agora não significa executar cegamente 99 missões simultaneamente. A execução deve ser contínua, paralelizável onde seguro, mas sempre controlada por dependências, evidências e aprovação.


---

# CONTROLE DE EXECUÇÃO — MISSÕES 003 A 010

Atualizado em 2026-11-10 pela Automation AI. Status abaixo significa entrega documental/especificação registrada; **não significa aprovação do GPT-6 nem implementação em produção**.

| Missão | Entrega | Relatório/artefatos | Status |
|---|---|---|---|
| 003 | Contrato JSON Schema v1.0.0 proposto | `reports/AUTOMATION_AI_MISSION_003_CONTRACT_V1.md`; `contracts/v1/*.schema.json`; README | REVIEW_REQUIRED |
| 004 | Máquina de estados, transições e invariantes | `reports/AUTOMATION_AI_MISSION_004_STATE_MACHINE.md` | REVIEW_REQUIRED |
| 005 | Pipeline e critérios de validação de entregas/evidências | `reports/AUTOMATION_AI_MISSION_005_DELIVERY_VALIDATION.md` | REVIEW_REQUIRED |
| 006 | Especificação de webhook ingress seguro | `reports/AUTOMATION_AI_MISSION_006_WEBHOOK_SECURITY.md` | REVIEW_REQUIRED |
| 007 | Inbox/outbox, deduplicação e reconciliação | `reports/AUTOMATION_AI_MISSION_007_IDEMPOTENT_INBOX.md` | REVIEW_REQUIRED |
| 008 | Lease, heartbeat e fencing token | `reports/AUTOMATION_AI_MISSION_008_LEASE_FENCING.md` | REVIEW_REQUIRED |
| 009 | Retry, timeout, backoff e dead-letter | `reports/AUTOMATION_AI_MISSION_009_RETRY_TIMEOUT.md` | REVIEW_REQUIRED |
| 010 | Matriz default-deny de permissões | `reports/AUTOMATION_AI_MISSION_010_PERMISSION_MATRIX.md` | REVIEW_REQUIRED |

## Limites desta entrega

- Nenhum código do TokenSaver principal foi modificado.
- Nenhum serviço, webhook, banco, GitHub App, segredo ou worker foi provisionado.
- Não foram executados testes de integração, concorrência, HMAC ou JSON Schema semântico.
- Os schemas foram recuperados do GitHub e todos passaram por parsing JSON sintático; isso não prova conformidade integral com Draft 2020-12.
- Os relatórios são propostas técnicas para validação do GPT-6. A aprovação formal continua pendente.

**Próxima etapa sugerida:** GPT-6 revisar e aprovar/rejeitar 003–010; após congelar o contrato, autorizar implementação incremental das missões 011–014 no repositório de colaboração, sem acesso de escrita ao TokenSaver principal.


---

# STATUS OPERACIONAL — MISSÕES 003 A 010 (2026-11-10)

As oito entregas documentais foram registradas e permanecem em **REVIEW_REQUIRED**, aguardando aprovação explícita do GPT-6. "Concluída" abaixo significa entrega documental concluída, não implementação operacional nem aprovação do contrato.

| Missão | Entrega | Status |
|---|---|---|
| 003 | Contrato JSON Schema v1.0.0 e cinco schemas em `contracts/v1/` | REVIEW_REQUIRED |
| 004 | Máquina de estados, transições e invariantes | REVIEW_REQUIRED |
| 005 | Pipeline de validação de resultados/evidências | REVIEW_REQUIRED |
| 006 | Webhook HMAC, allowlist e replay protection | REVIEW_REQUIRED |
| 007 | Inbox/outbox e idempotência | REVIEW_REQUIRED |
| 008 | Lease, heartbeat e fencing token | REVIEW_REQUIRED |
| 009 | Retry, timeout, backoff, DLQ e ambiguidades | REVIEW_REQUIRED |
| 010 | Matriz RBAC/ABAC e grants por agente | REVIEW_REQUIRED |

**Validação realizada:** os cinco arquivos JSON em `contracts/v1/` foram recuperados do GitHub e passaram por parsing sintático JSON (5/5). Nenhum validador semântico Draft 2020-12, fixture, teste de integração, webhook, banco, worker ou teste de concorrência foi executado.

**Gate:** não iniciar Missão 011–014 até o GPT-6 aprovar formalmente as missões 003–010 ou emitir uma instrução específica. A existência de schemas e relatórios não representa infraestrutura em execução.


---

# CONTROLE — SOLICITAÇÃO DAS MISSÕES 011 A 020 (2026-11-10)

| Missões | Status | Motivo |
|---|---|---|
| 011–014 | BLOCKED | Gate explícito exige aprovação GPT-6 de 003–010 ou autorização específica; não localizada |
| 015–016 | BLOCKED | Dependem de worker/fluxo mock executável de 011–014 |
| 017–018 | BLOCKED | Dependem de modelo de dados e eventos/runtime do MVP |
| 019 | BLOCKED | Depende de dados operacionais e observabilidade do MVP |
| 020 | BLOCKED | Auditoria independente exige MVP e evidências; Kimi não deve auditar implementação inexistente |

Relatório de bloqueio: `reports/AUTOMATION_AI_MISSIONS_011_020_BLOCKED.md`.

Nenhuma das missões 011–020 foi marcada como concluída. O pedido de execução não removeu o gate de aprovação definido no protocolo central. Nenhuma alteração foi feita no repositório principal.


---

# CONTROLE — SOLICITAÇÃO DAS MISSÕES 021 A 030 (2026-11-10)

| Missões | Status | Motivo |
|---|---|---|
| 021–022 | BLOCKED | Backlog resumido; dependem de contrato/modelo operacional aprovados e taxonomia definida |
| 023–025 | BLOCKED | Exigem autorização e configuração explícitas de Actions, dispatch, status checks e branch protection |
| 026–029 | BLOCKED | Exigem políticas aprovadas de artefatos, PR gates, rollback e identidade/auditoria Git |
| 030 | BLOCKED | Escopo e permissões para auditoria de segurança GitHub não foram atribuídos formalmente |

Relatório: `reports/AUTOMATION_AI_MISSIONS_021_030_BLOCKED.md`.

A Fase B (011–020) permanece bloqueada e 003–010 permanecem em REVIEW_REQUIRED. Nenhuma Issue, Action, webhook, secret, environment, branch protection ou regra de merge foi criada ou alterada. Nenhuma missão 021–030 foi marcada como concluída. A descrição no backlog não equivale a uma autorização operacional do GPT-6.


---

# CONTROLE DE EXECUÇÃO — MISSÕES 021 A 030

Atualizado em 2026-11-10. As dez missões da Fase C foram entregues como **especificações técnicas e auditoria estática**, permanecendo em REVIEW_REQUIRED para aprovação do GPT-6. Nenhuma delas representa automação operacional implantada.

| Missão | Entrega | Relatório | Status |
|---|---|---|---|
| 021 | Issues como projeção reconciliável da fila, lifecycle e idempotência | `reports/AUTOMATION_AI_MISSION_021_ISSUES_QUEUE.md` | REVIEW_REQUIRED |
| 022 | Taxonomia de labels, prioridade, risco, agente e status | `reports/AUTOMATION_AI_MISSION_022_LABELS_PRIORITIES.md` | REVIEW_REQUIRED |
| 023 | Arquitetura de workflows Actions e hardening | `reports/AUTOMATION_AI_MISSION_023_ACTIONS_WORKFLOWS.md` | REVIEW_REQUIRED |
| 024 | Contrato e segurança de repository_dispatch/workflow_dispatch | `reports/AUTOMATION_AI_MISSION_024_EVENT_DISPATCH.md` | REVIEW_REQUIRED |
| 025 | Matriz de required status checks e política fail-closed | `reports/AUTOMATION_AI_MISSION_025_STATUS_CHECKS.md` | REVIEW_REQUIRED |
| 026 | Estrutura, manifesto, hashes e retenção de artefatos | `reports/AUTOMATION_AI_MISSION_026_ARTIFACTS.md` | REVIEW_REQUIRED |
| 027 | PR gates, branch protection e separação de funções | `reports/AUTOMATION_AI_MISSION_027_PR_GATES.md` | REVIEW_REQUIRED |
| 028 | Runbook de rollback e recuperação | `reports/AUTOMATION_AI_MISSION_028_ROLLBACK.md` | REVIEW_REQUIRED |
| 029 | Auditoria de identidade, commit, missão, grant e evidência | `reports/AUTOMATION_AI_MISSION_029_GIT_AUDIT.md` | REVIEW_REQUIRED |
| 030 | Auditoria estática GitHub e checklist operacional de segurança | `reports/AUTOMATION_AI_MISSION_030_GITHUB_SECURITY.md` | REVIEW_REQUIRED |

## Evidências e limites

- Consultado o `AUTOMATION_AI_MISSION.md`, `CENTRAL.md`, `INSTRUCTIONS.md`, plano mestre e matriz de permissões da Missão 010.
- Consultado o workflow `.github/workflows/ci.yml` do TokenSaver principal na branch `v2-saas-alpha`; evidências específicas constam no relatório 030.
- Pesquisa de Issues abertas/fechadas no repositório de colaboração retornou zero itens.
- Nenhum teste automatizado, workflow run, dispatch, secret scan ou teste de integração foi executado.
- Nenhuma Issue ou label foi criada/modificada; nenhum workflow, branch protection, CODEOWNERS, secret, token, webhook ou setting foi alterado.
- Nenhum código do TokenSaver principal foi modificado.
- As permissões reais de secrets, environments, audit log e branch protection não estavam acessíveis nesta inspeção; não se afirma que foram auditadas.

**Próximo passo:** GPT-6 revisar os relatórios 021–030, aprovar a taxonomia e a política de eventos, e emitir autorização explícita antes de qualquer alteração operacional em GitHub.


---

# CONTROLE DE EXECUÇÃO — MISSÕES 021 A 030

**Atualizado:** 2026-11-10  
**Relatório:** reports/AUTOMATION_AI_MISSIONS_021_030_GITHUB_AUTOMATION.md

| Missão | Entrega documental | Status |
|---|---|---|
| 021 | Issues como interface/fila, schema mínimo, eventos e idempotência | REVIEW_REQUIRED |
| 022 | Taxonomia de labels, prioridades e invariantes | REVIEW_REQUIRED |
| 023 | Arquitetura de workflows e segurança Actions | REVIEW_REQUIRED |
| 024 | Dispatch, payload mínimo e reconciliação | REVIEW_REQUIRED |
| 025 | Matriz de status checks e critérios para torná-los required | REVIEW_REQUIRED |
| 026 | Manifesto, classificação, hash e retenção de artifacts | REVIEW_REQUIRED |
| 027 | PR gates, review independente e CODEOWNERS | REVIEW_REQUIRED |
| 028 | Procedimento de rollback e recuperação | REVIEW_REQUIRED |
| 029 | Ledger Git e correlação auditável | REVIEW_REQUIRED |
| 030 | Auditoria estática GitHub; testes ativos pendentes | REVIEW_REQUIRED |

**Limite:** a Fase C foi preparada documentalmente em paralelo. Não significa que a Fase B 011–020 foi concluída ou que as especificações 003–010 foram aprovadas. Nenhuma Issue/label/workflow/webhook/secret/environment/ruleset/branch protection foi criada ou alterada. Nenhuma alteração no TokenSaver principal.

**Achados de segurança prioritários:** GH-01 permissions explícitas ausentes no workflow atual; GH-02 actions referenciadas por tags e não SHA imutável; GH-05 timeout/concurrency ausentes. Configurações administrativas remotas não puderam ser inspecionadas pela conexão.

**Próximo gate:** aprovação do GPT-6 e revisão manual do owner; começar apenas por workflows read-only no repositório de colaboração. Não ativar dispatch ou automação de Issues antes do MVP e dos controles de idempotência/permissão.


---

# VERIFICAÇÃO — SOLICITAÇÃO DAS MISSÕES 031 A 040 (2026-11-10)

**STATUS: BLOCKED — ATRIBUIÇÃO OPERACIONAL FORMAL NÃO LOCALIZADA**

| Missão | Escopo resumido no roadmap | Status desta solicitação |
|---|---|---|
| 031 | Interface comum para provedores | BLOCKED |
| 032 | Adaptador GPT | BLOCKED |
| 033 | Adaptador Claude | BLOCKED |
| 034 | Adaptador Kimi | BLOCKED |
| 035 | Adaptador Automation AI | BLOCKED |
| 036 | Provider registry | BLOCKED |
| 037 | Capability matching | BLOCKED |
| 038 | Fallback de provedor | BLOCKED |
| 039 | Limites por provedor | BLOCKED |
| 040 | Testes dos adapters com mocks | BLOCKED |

**Motivo:** o plano mestre contém apenas descrições resumidas da Fase D. O arquivo oficial `AUTOMATION_AI_MISSION.md` não contém enunciados operacionais 031–040, critérios de aceite ou autorização específica do GPT-6. Não foram localizados relatórios, artefatos ou Issues de atribuição dessas missões.

**Dependências:** 003–010 permanecem REVIEW_REQUIRED; 011–020 permanecem BLOCKED; 021–030 permanecem REVIEW_REQUIRED. O protocolo exige aprovação dos pré-requisitos quando uma missão valida ou implementa decisões anteriores.

**Relatório:** `reports/AUTOMATION_AI_MISSIONS_031_040_READINESS_BLOCKED.md`.

**Testes:** leitura e busca documental executadas. Nenhum adapter, mock, registry, matcher, fallback ou quota enforcer foi implementado; nenhum teste unitário, integração, contrato, build ou CI foi executado.

**Ações e limites:** nenhuma integração com provedores, credencial, workflow, Issue, webhook ou configuração foi alterada. Nenhum código do TokenSaver principal foi modificado. As Missões 031–040 não foram marcadas como concluídas.

**Próximo gate:** GPT-6 deve publicar a atribuição formal, contrato canônico, interfaces autorizadas, taxonomia de capabilities, política de fallback, budgets, fixtures, critérios de aceite, dependências liberadas e paths/permissões permitidos.

**Estado final:** aguardando instrução formal do GPT-6 integrador.


---

# CONTROLE DE EXECUÇÃO — MISSÕES 031 A 040

**Atualizado:** 2026-11-10  
**Resultado:** especificações preparadas para revisão; execução operacional de adapters/testes permanece bloqueada.

| Missão | Entrega registrada | Relatório | Status |
|---|---|---|---|
| 031 | Interface lógica comum Agent Adapter, fronteiras, request/response e invariantes | `reports/AUTOMATION_AI_MISSION_031_AGENT_ADAPTER_INTERFACE.md` | REVIEW_REQUIRED |
| 032 | Especificação de adapter GPT/OpenAI | `reports/AUTOMATION_AI_MISSION_032_GPT_ADAPTER.md` | REVIEW_REQUIRED |
| 033 | Especificação de adapter Claude/Anthropic, alinhada ao estado real do produto | `reports/AUTOMATION_AI_MISSION_033_CLAUDE_ADAPTER.md` | REVIEW_REQUIRED |
| 034 | Especificação de adapter Kimi/Moonshot e independência de auditoria | `reports/AUTOMATION_AI_MISSION_034_KIMI_ADAPTER.md` | REVIEW_REQUIRED |
| 035 | Especificação de adapter Automation AI e limites de sessão/ferramentas | `reports/AUTOMATION_AI_MISSION_035_AUTOMATION_ADAPTER.md` | REVIEW_REQUIRED |
| 036 | Modelo de Provider Registry, manifestos, capacidades e lifecycle | `reports/AUTOMATION_AI_MISSION_036_PROVIDER_REGISTRY.md` | REVIEW_REQUIRED |
| 037 | Matching determinístico por hard filters e ranking explicável | `reports/AUTOMATION_AI_MISSION_037_CAPABILITY_MATCHING.md` | REVIEW_REQUIRED |
| 038 | Política de fallback, timeout ambíguo e proteção contra duplicidade | `reports/AUTOMATION_AI_MISSION_038_PROVIDER_FALLBACK.md` | REVIEW_REQUIRED |
| 039 | Quotas, budget, rate/concurrency limits e proveniência de preços | `reports/AUTOMATION_AI_MISSION_039_PROVIDER_LIMITS.md` | REVIEW_REQUIRED |
| 040 | Matriz de 20 testes de contrato com mocks e harness proposto | `reports/AUTOMATION_AI_MISSION_040_ADAPTER_TESTS.md` | BLOCKED — plano apenas |

## Evidências e limites

- Fontes consultadas: `AUTOMATION_AI_MISSION.md`, `MISSION_PLAN_002_100.md`, `CENTRAL.md`, `INSTRUCTIONS.md`, contratos `contracts/v1/`, README e código real do TokenSaver na branch `v2-saas-alpha`.
- Evidência do produto: README declara que chamadas reais a Claude ainda dependem de backend seguro de credenciais/HTTP; `src-tauri/src/advanced.rs` contém apenas `ClaudeConfig { enabled, endpoint, model }`; `src/api.ts` expõe leitura/gravação dessa configuração. Isso não comprova integração de inferência.
- `package.json` não declara SDK OpenAI/Anthropic/Moonshot nem runner dedicado de testes frontend. Nenhum adapter executável foi localizado.
- Nenhuma API real foi chamada; nenhuma credencial, quota, preço ou capacidade comercial foi consultada.
- Nenhum harness, mock executável, fixture executada, build, teste de integração ou CI foi rodado.
- Nenhum arquivo do TokenSaver principal foi alterado; nenhum provider foi habilitado.
- Os documentos 031–039 são propostas de arquitetura, não adapters implementados. Missão 040 contém plano de teste, não evidência de aprovação/passagem.

## Dependências e gate

O protocolo central exige que missões dependentes aguardem decisões anteriores em estado APPROVED. As especificações 003–010 continuam registradas como REVIEW_REQUIRED; 011–020 não possuem implementação/MVP executável aprovada. Portanto, esta entrega prepara 031–039 para revisão, mas não declara as dependências aprovadas nem autoriza código/runtime. A Missão 040 permanece BLOCKED até existir interface aprovada, MockAdapter/harness autorizado e ambiente de teste.

**Próxima ação:** GPT-6 revisar 031–039 e aprovar/revisar 003–010; depois autorizar implementação isolada do MockAdapter/harness no repositório de colaboração. Executar AD-001..020 antes de integrar qualquer API real.
