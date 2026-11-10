
# Missões 021–030 — Especificação de GitHub Automation e auditoria estática

**Agente:** ChatGPT — GPT-6 (OpenAI)  
**Especialidade:** integração, automação GitHub e governança multiagente  
**Data:** 2026-11-10  
**Repositório:** vidift-max/tokensaver-ai-collaboration  
**Branch:** v2-saas-alpha  
**Status:** DOCUMENTAÇÃO ENTREGUE — REVIEW_REQUIRED  
**Escopo:** especificação e auditoria estática. Nenhuma automação operacional foi ativada.

## 1. Resumo executivo

As Missões 021–030 foram trabalhadas como pacote documental: Issues como interface/fila, taxonomia de labels, workflows Actions, dispatch, status checks, artefatos, gates de PR, rollback, auditoria Git e segurança GitHub.

A solicitação atual foi tratada como autorização para preparar as especificações da Fase C em paralelo, sem alterar configurações. Isso não aprova os contratos 003–010, não conclui a Fase B 011–020 e não declara um MVP operacional. A Fase C fica pronta para revisão; o uso operacional aguarda dependências e aprovação do GPT-6.

Decisões:
1. Uma Issue por missão; GitHub é interface de trabalho e decisão humana, enquanto o banco do orquestrador é fonte operacional para leases, runs e idempotência.
2. Comentários em texto livre nunca são comandos. Só eventos e ações allowlisted, autenticados e autorizados podem mudar estado.
3. Actions usa permissões mínimas explícitas, concurrency, timeouts, inputs validados e nenhuma credencial em PR de fork.
4. Checks obrigatórios são contextos estáveis de CI, não labels ou comentários.
5. Artefatos são evidências versionadas com manifesto, hash, retenção e classificação.
6. Nenhum agente aprova o próprio PR, faz merge, release ou escreve no TokenSaver principal sem grant separado e verificável.
7. Rollback preferencial é revert auditável, não force-push/reset em branch compartilhada.

## 2. Auditoria estática do estado consultável

### 2.1 Repositório principal

Repositório: vidift-max/tokensaver-ai, branch v2-saas-alpha. HEAD consultado: 935b6fc5d0c126e93697a16f73d56bb3a4d1e55f.

Arquivos recuperados:
- .github/workflows/ci.yml
- README.md
- package.json

O workflow atual contém:
- triggers push e pull_request para v2-saas-alpha;
- job foundation em ubuntu-latest: Rust check/test, Node 22, npm install, npm run build, ZIP de fonte e upload de artifact por 14 dias;
- job foundation-windows em windows-latest: Rust check/test e build frontend.

O README confirma Tauri 2 + React + TypeScript + Rust e descreve CI como parte da fundação. package.json define build como tsc && vite build, mas não define scripts test ou lint.

### 2.2 Findings

| ID | Achado observado | Risco / recomendação |
|---|---|---|
| GH-01 | ci.yml não declara permissions explícitas no workflow/job | GITHUB_TOKEN pode receber permissões padrão excessivas conforme settings. Definir contents: read e elevar por job somente quando necessário. |
| GH-02 | Actions externas referenciadas por tags: checkout@v4, setup-node@v4, upload-artifact@v4 | Tags podem ser movidas. Fixar SHA completo revisado e atualizar por PR controlado. |
| GH-03 | package-lock.json não encontrado no caminho raiz consultado | npm install pode resolver versões diferentes. Confirmar lockfile e, se aplicável, versioná-lo e usar npm ci. |
| GH-04 | Cargo.lock não encontrado no caminho raiz consultado | Confirmar política de lockfile Rust e usar --locked quando aplicável. |
| GH-05 | Sem timeout-minutes ou concurrency explícitos | Jobs podem consumir runner por tempo excessivo; definir timeout e grupo de concorrência. |
| GH-06 | ZIP de fonte usa exclusões de diretórios conhecidos | Exclusões podem não cobrir novos arquivos sensíveis. Preferir allowlist, scan de segredo e manifesto SHA-256. |
| GH-07 | Job Windows não publica artifact e não tem timeout explícito | Decidir se artifact Windows é necessário e limitar duração. |
| GH-08 | Workflow não tem job explícito de validação JSON Schema/lint | Contratos e qualidade documental podem regredir sem checks específicos. |
| GH-09 | package.json não define npm test/lint | Não declarar esses checks como existentes; criar scripts/testes antes de torná-los required. |
| GH-10 | CODEOWNERS não encontrado em CODEOWNERS nem .github/CODEOWNERS | Política de ownership por path não está documentada nos locais padrão consultados. |
| GH-11 | Consulta de workflow runs para o HEAD retornou lista vazia | Não há evidência de run para esse SHA na consulta; isso não prova que Actions esteja desabilitado. |
| GH-12 | Branch protection, rulesets, secrets, environments e required checks não são expostos pelas ferramentas consultadas | Owner precisa inspecionar settings diretamente antes de habilitar automação. |

Ausência de arquivo/resultado na conexão não prova inexistência de configuração remota. GH-10 e GH-12 são limitações de observabilidade, não afirmações absolutas.

### 2.3 Repositório de colaboração e dependências

CENTRAL.md designa GPT-6 como integrador. INSTRUCTIONS.md proíbe alterar o projeto principal sem autorização. A matriz da Missão 010 determina default-deny, main write desabilitado e PR/Actions write desabilitados no MVP. A especificação 006 define HMAC, allowlist, delivery ID e persistência na inbox antes do ACK.

O registro vigente mantém 003–010 como REVIEW_REQUIRED e 011–020 bloqueadas por dependência/gate. A solicitação atual permite preparar documentação da Fase C, não operar Actions/Issues/dispatch nem contornar os gates.

## 3. MISSÃO 021 — Issues como fila

Uma Issue representa uma missão/revisão solicitada, mas não substitui a fila transacional do orquestrador.

Campos mínimos:
- mission_id estável e revision inteiro monotônico;
- contract_version, título, objetivo e escopo;
- acceptance_criteria[];
- assigned_agent e capability requirements;
- priority, risk_level;
- allowed_repositories[] e allowed_paths[];
- deadline, budget, dependencies[];
- approval_required;
- links para especificação e evidências.

Issue number é identificador externo, não chave primária. Chave canônica: repository_id + mission_id + revision. Guardar issue_node_id e issue_number como referências.

Eventos:
- issues.opened: persistir inbox; dispatcher só avalia execução se label mission:ready, schema e autorização forem válidos.
- issues.edited: mudança relevante cria revisão nova e invalida lease/run anterior conforme política.
- issues.labeled/unlabeled: só labels allowlisted alteram projeções de estado após validação.
- issue_comment.created: comentário é dado não confiável; nunca executar instrução livre.
- issues.closed: cancelar apenas se ator autorizado; fechamento não significa aprovação.

O orquestrador mantém estado operacional. Labels/título são projeções humanas, não fonte transacional. Atualizações GitHub saem de outbox idempotente e carregam mission_id/revision.

Anti-loop: ignorar eventos do próprio bot quando dispensáveis; comparar estado antes de gravar; idempotência por delivery_id e operação lógica; rate limit de comentários automáticos; reconciliação periódica sem dispatch duplicado.

Aceite: Issue válida + mission:ready cria um único registro; edição relevante gera revisão; duplicata não cria run; comentário livre nunca executa comando; Issue fechada preserva histórico.

## 4. MISSÃO 022 — Labels e prioridades

Taxonomia proposta:
- Tipo: type:mission, type:incident, type:decision, type:question.
- Estado: status:backlog, status:ready, status:running, status:review, status:approved, status:blocked, status:failed, status:completed, status:cancelled.
- Agente: agent:gpt6, agent:claude, agent:kimi, agent:automation, agent:human.
- Prioridade: priority:p0, priority:p1, priority:p2, priority:p3.
- Risco: risk:critical, risk:high, risk:medium, risk:low.
- Escopo: scope:docs-only, scope:readonly, scope:collab-write, scope:main-write-approved.
- Revisão: review:required, review:changes-requested, review:approved.
- Bloqueio: blocked:dependency, blocked:approval, blocked:external.

Prioridades: P0 incidente crítico/risco ativo; P1 bloqueador de release/fundação ou segurança; P2 trabalho planejado importante; P3 melhoria não bloqueadora.

Invariantes:
- Exatamente uma label status:* por Issue.
- No máximo uma priority:* e uma agent:*.
- Labels de escopo não concedem permissão; devem coincidir com grant autenticado.
- Executor/worker não define status:approved.
- status:completed requer decisão de aprovação e evidência.
- Cores são apresentação, nunca lógica de negócio.

Nenhuma label foi criada. Owner/GPT-6 deve aprovar nomes, cores e descrições.

## 5. MISSÃO 023 — GitHub Actions

Workflows recomendados:
1. ci.yml existente: build/test do produto, sem executar agentes.
2. contract-validation.yml: schemas e fixtures em PR/push no repositório de colaboração.
3. docs-validation.yml: links, lint documental e manifesto.
4. mission-dispatch.yml futuro: validar payload e chamar endpoint autenticado; nunca executar LLM no runner.
5. artifact-attestation.yml futuro: hashes e manifesto após jobs aprovados.

Requisitos:
- permissions explícitas; padrão contents: read.
- Elevar issues/checks/statuses/actions write somente no job que precisa.
- Usar pull_request para CI de contribuições não confiáveis; nunca executar código de fork com secrets via pull_request_target.
- Não usar secrets: inherit genericamente.
- Fixar actions de terceiros por SHA completo revisado.
- timeout-minutes em todo job.
- concurrency com grupo determinístico e cancelamento adequado.
- Validar inputs; não interpolar texto de Issue em shell.
- Sem credenciais em artifacts, cache, logs ou outputs.
- Environment approval para etapa privilegiada.
- Workflow disparado por label/comentário não pode fazer merge/release.

Pseudoconfiguração, não pronta para commit:

~~~yaml
name: Mission contract validation
on:
  pull_request:
    paths: ['contracts/**', 'missions/**', 'reports/**']
  push:
    branches: [v2-saas-alpha]
permissions:
  contents: read
concurrency:
  group: mission-contract-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
jobs:
  validate:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@PINNED_FULL_SHA
      - name: Validate schemas and fixtures
        run: APPROVED_VALIDATOR_COMMAND
~~~

SHA e comando são placeholders. Scripts/validator precisam existir e ser aprovados antes da ativação.

## 6. MISSÃO 024 — Dispatch de eventos

Caminho primário: GitHub Webhook → ingress próprio → inbox/outbox. repository_dispatch é apropriado quando serviço externo inicia workflow noutro contexto. workflow_dispatch é apropriado para operação manual/admin com inputs tipados e confirmação humana. Não usar comentário livre como comando nem Actions como daemon.

Payload mínimo:
~~~json
{
  "event_type": "mission.ready.v1",
  "client_payload": {
    "mission_id": "TS-021-EXAMPLE",
    "revision": 1,
    "contract_version": "1.0.0",
    "source_repository_id": 123456,
    "source_issue_number": 21,
    "delivery_id": "github-delivery-uuid",
    "correlation_id": "uuid"
  }
}
~~~

Não transportar prompt integral, tokens, secrets, dados privados ou grant completo. Dispatcher busca a fonte autorizada e revalida escopo. mission_id + revision + event_type é chave lógica; delivery_id protege replay. Evento deve ser persistido antes do ACK; timeout ambíguo exige reconciliação antes de repetir.

## 7. MISSÃO 025 — Status checks

Checks candidatos:
- foundation: Linux Rust check/test + frontend build.
- foundation-windows: Windows Rust check/test + frontend build.
- contract-validation: quando workflow dedicado existir.
- security-static: quando scanner e política forem aprovados.

Só exigir checks após observar execução bem-sucedida e estável em PR real. Usar nome exato do job/contexto. Não tornar checks inexistentes required. Falha, ausência ou estado inconclusivo bloqueia merge. Labels não substituem checks. A consulta não confirmou se foundation e foundation-windows estão configurados como required.

## 8. MISSÃO 026 — Artefatos

Manifesto mínimo: artifact_id, mission_id, revision, run_id, name, path, media_type, size_bytes, sha256, created_at, producer, workflow_run_id, commit_sha, classification, retention_days, expires_at, evidence_kind, test_status e source_refs[].

SHA-256 deve ser recomputado sobre os bytes publicados; hash fornecido pelo agente não é suficiente.

Permitidos: logs sanitizados, relatórios Markdown, JSON de resultado, reports de teste/cobertura e ZIP de fonte allowlisted.

Proibidos: tokens, secrets, cookies, installation tokens, dumps com dados reais, prompts completos sensíveis, arquivos pessoais sem necessidade, .env e caches.

Retenção sugerida: CI logs 14 dias; artifacts de PR 7–14 dias; evidência de release aprovada 90 dias ou política do owner. A retenção atual de 14 dias observada no artifact Linux é fato do workflow, não política geral aprovada.

Verificações: hash, allowlist de paths, tamanho, secret scan, classificação, retenção, workflow run e commit. Link de artifact não é permanente após expiração.

## 9. MISSÃO 027 — PR gates

Fluxo:
1. Branch curta e PR para v2-saas-alpha.
2. CI Linux e Windows obrigatórios após estabilização.
3. Validação de contratos/docs por paths.
4. Um review de owner/integrador; dois reviews para mudança de segurança, permissões, dispatch, secrets ou workflows privilegiados.
5. Dismiss stale approvals e exigir aprovação após último push.
6. CODEOWNERS para .github/workflows/**, contracts/**, security/** e documentação de autorização.
7. Resolver conversas antes de merge.
8. Bloquear force-push e deleção da branch protegida.
9. Merge só por identidade autorizada; executor não aprova o próprio PR.
10. Sem auto-merge/auto-release no MVP.

Paths de alto risco: .github/workflows/**, .github/actions/**, contracts/**, permissions/**, security/**, deployment, secrets/environments e código de filesystem/subprocess/IPC/persistência. Confirmar usernames/equipes antes de escrever CODEOWNERS; não inventar handles.

## 10. MISSÃO 028 — Rollback

- Código/docs: PR de revert do commit/PR aprovado; preservar histórico.
- Configuração GitHub: snapshot anterior e plano de restauração; owner aprova.
- Workflow: desabilitar via grant, corrigir e reativar por PR.
- Dispatch: parar novas reivindicações, manter inbox/outbox para reconciliação.
- Artifact: revogar acesso/expirar/delete conforme política, preservando evidência forense necessária.
- Banco/migração: preferir forward-fix; rollback destrutivo somente com backup testado e aprovação.
- Segredo: revogar/rotacionar; nunca reutilizar segredo comprometido.

Procedimento: declarar incidente; congelar novas execuções; capturar mission/run/event/commit; identificar último estado bom; avaliar perda de dados; obter aprovação; reverter; validar; reconciliar estados/outbox; registrar postmortem. Revert não desfaz automaticamente comentários, chamadas de modelo ou publicação de artifacts.

## 11. MISSÃO 029 — Auditoria Git

Por operação registrar:
- audit_event_id, actor GitHub ID/login/type, app_id/installation_id;
- agent_id, mission_id, revision, run_id;
- repository_id/full_name, branch/ref, commit SHA e parent SHA;
- PR number, paths alterados e diff stats;
- operação, grant_id e approver identity;
- timestamp UTC, workflow_run_id e check IDs;
- resultado success/denied/failed, reason/error code;
- artifact IDs e checksums.

Invariantes: autoria vem da API/evento GitHub, não de texto; commit associa mission/revision/run/grant válidos; paths fora do allowlist são negados; branch protegida rejeita push direto; aprovação e execução são identidades distintas; ledger append-only; correlação webhook→Issue→workflow→PR→commit→artifact obrigatória.

Reconciliação periódica compara commits, PRs, Issues e runs com ledger e sinaliza commits sem mission_id, grants expirados, actor desconhecido, branch inesperada e artifacts sem manifesto.

## 12. MISSÃO 030 — Segurança GitHub: auditoria estática

Escopo executado: inspeção estática de ci.yml, README, package.json, matriz de permissões 010 e webhook 006. Não foi possível ler configurações administrativas/privadas do repositório com as operações disponíveis.

Findings de maior prioridade:
- Alta: GH-01 ausência de permissions explícitas; GH-02 actions por tag e não SHA; GH-12 branch protection/rulesets/required checks não verificáveis.
- Média: GH-03/04 lockfiles não encontrados; GH-05 timeout/concurrency ausentes; GH-06 artifact amplo por exclusões; GH-08/09 ausência de jobs/scripts explícitos schema/lint/test; GH-10 CODEOWNERS não encontrado; GH-11 sem workflow run retornado para HEAD.

Checklist para owner:
- revisar secrets e remover tokens pessoais antigos;
- GitHub App restrita aos repositórios necessários;
- separar credenciais de colaboração e produto;
- proibir secrets em PRs de fork;
- limitar GITHUB_TOKEN por workflow/job;
- environment approval em operações privilegiadas;
- scan de logs/artifacts;
- rotação de webhook secret/installation credentials em incidente;
- allowlist de eventos/repositórios;
- secret scanning e alertas de dependência conforme plano.

Testes necessários, não executados:
- PR de fork não recebe secrets nem grava.
- CI com contents: read falha ao tentar escrever.
- Prompt injection em Issue/comment não altera missão nem chama ferramenta.
- Webhook inválido/replay não dispara.
- Actor sem grant não altera labels/status nem fecha Issue.
- Worker não escreve no TokenSaver principal.
- PR que altera workflow privilegiado exige CODEOWNER/review independente.
- Scan detecta secret sintético em artifact.
- Commit sem mission/run/grant é sinalizado.
- Branch protegida rejeita push direto e force-push.

Resultado 030: auditoria estática concluída; auditoria de configurações remotas e testes ativos pendentes.

## 13. Implantação incremental

0. GPT-6 aprova contratos 003–010 e decide estado/ordem 011–020; owner confirma settings.
1. Aprovar taxonomia 022, Issue schema 021, eventos 024, manifesto 026, checks 025 e gates 027.
2. Read-only: workflows de validação em colaboração, sem secrets e contents: read.
3. Ingress controlado: HMAC + inbox/outbox; sem chamadas LLM automáticas.
4. Estabilizar checks e só então torná-los required.
5. PR automation limitada; sem merge, release ou main write.
6. Testar denies, rotação, rollback e reconciliação; Kimi revisa independentemente.

## 14. Registro de execução

| Missão | Entrega | Status |
|---|---|---|
| 021 | Issue como interface/fila, campos, eventos e idempotência | CONCLUÍDA — DOCUMENTAL |
| 022 | Taxonomia de labels e prioridades | CONCLUÍDA — PROPOSTA |
| 023 | Arquitetura de workflows e baseline security | CONCLUÍDA — PROPOSTA |
| 024 | Estratégia de dispatch e payload | CONCLUÍDA — PROPOSTA |
| 025 | Matriz de status checks e critérios de ativação | CONCLUÍDA — PROPOSTA |
| 026 | Manifesto, classificação, retenção e política de artifacts | CONCLUÍDA — PROPOSTA |
| 027 | Gates de PR, reviews e CODEOWNERS | CONCLUÍDA — PROPOSTA |
| 028 | Procedimento de rollback | CONCLUÍDA — PROPOSTA |
| 029 | Ledger Git, correlação e reconciliação | CONCLUÍDA — PROPOSTA |
| 030 | Auditoria estática de workflow e checklist remoto | CONCLUÍDA — ESTÁTICA; testes ativos pendentes |

### Testes e evidências reais
- Arquivos recuperados do GitHub: sim.
- Inspeção estática de workflow, README, package.json, permissão 010 e webhook 006: sim.
- Busca de Issues no repositório de colaboração: sem resultados.
- Busca de dez caminhos canônicos de relatórios 011–020: não localizados.
- Consulta de workflow runs para HEAD 935b6fc5d0c126e93697a16f73d56bb3a4d1e55f: lista vazia.
- Workflow/CI executado: não.
- Testes de dispatch/webhook, branch protection, checks, secrets, rollback ou artifacts: não.
- Build/test do TokenSaver: não.

### Alterações e limites
- Relatório: reports/AUTOMATION_AI_MISSIONS_021_030_GITHUB_AUTOMATION.md
- Repositório principal: nenhuma alteração.
- Issues, labels, PRs, Actions, webhooks, secrets, environments, branch protection e rulesets: nenhuma alteração.
- Limitação: conexão não expõe listagem/alteração de settings administrativos; auditoria é estática.
- Fase B continua bloqueada no registro vigente; Fase C está documentada, não operacional.

## RECOMENDAÇÃO AO GPT-6

1. Revisar/aprovar a especificação e o pacote de labels/Issue schema antes de criar automações.
2. Resolver o gate 003–010 e decidir formalmente 011–020; documentação 021–030 não prova MVP.
3. Solicitar ao owner auditoria manual de rulesets, branch protection, secrets, environments, webhooks e required checks.
4. Corrigir GH-01/02/05 antes de conceder credenciais de escrita.
5. Começar com workflows read-only no repositório de colaboração; só depois ativar dispatch e Issues como fila.

**Estado final:** documentação 021–030 entregue para revisão. Automação operacional desativada. AGUARDANDO VALIDAÇÃO DO GPT-6 INTEGRADOR.
