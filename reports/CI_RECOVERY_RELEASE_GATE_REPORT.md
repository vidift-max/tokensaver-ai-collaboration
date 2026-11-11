# CI Recovery & Release Gate Report — IA 4

**Projeto:** `vidift-max/tokensaver-ai`  
**Branch:** `v2-saas-alpha`  
**Papel:** IA 4 — QA / Release Engineer  
**Modelo:** GPT-6  
**Data:** 2026-11-11  
**Relatório independente:** `reports/CI_RECOVERY_RELEASE_GATE_REPORT.md`

## 1. Resumo executivo

**Decisão: NO-GO.**

A auditoria foi repetida no HEAD `637631142961c1a9f7c342f2621cb65c009d6e45`. Os logs do GitHub Actions confirmam duas falhas PostgreSQL e uma falha no cenário de processos distribuídos. A investigação identificou causas específicas e reproduzíveis:

1. O teste de handoff tenta criar uma sessão expirada violando a constraint `sessions_check (expires_at > issued_at)`. Uma correção anterior ajustou o fixture de expiração do handoff, mas não corrigiu o fixture de expiração da sessão.
2. O teardown do teste de comunicação exclui o tenant e dispara a exclusão de principals enquanto `team_room_channel_members.added_by_principal_id` ainda os referencia por uma FK sem cascade.
3. O E2E do Runner marca `RECOVERY_REQUIRED` antes de iniciar os dois Recovery Workers. Depois exige que os workers somem uma transição de recovery que já foi consumida pelo preflight. O resultado observado é `0 !== 1`.

O teste de lease/fencing PostgreSQL, build do serviço, Foundation Linux, Foundation Windows e Keycloak/OIDC smoke passaram no run original. Isso não neutraliza os gates que falharam.

**Nenhum arquivo do produto foi modificado.** O protocolo central do repositório de colaboração exige autorização expressa do GPT-6 integrador para alterar o projeto principal. A missão recebida não substitui essa autorização específica. As correções foram definidas tecnicamente, mas sua implementação está **BLOQUEADA** por governança. Não houve alteração de asserts, remoção de testes ou mockização.

## 2. SHA inicial

`637631142961c1a9f7c342f2621cb65c009d6e45`

A branch pesquisada foi `v2-saas-alpha`. O commit HEAD tem mensagem:

`fix(recovery-worker): parse response text without redeclaring request body`

## 3. SHA final

`637631142961c1a9f7c342f2621cb65c009d6e45`

O SHA final é igual ao inicial porque não foi autorizado alterar o repositório principal. Portanto, **não existe um SHA corrigido para validar**.

## 4. Falhas encontradas

### 4.1 PostgreSQL — handoff/session expiry

- **Teste:** `handoffs::postgres_tests::postgres_handoff_states_authorization_fencing_and_candidate_race`
- **Arquivo/linha:** `services/ai-team-room/src/handoffs.rs:631`
- **Banco:** PostgreSQL 16 do service container do GitHub Actions.
- **Cenário:** o teste cria um handoff e verifica que uma sessão do destinatário expirada não pode aceitá-lo.
- **Operação que falha:** `UPDATE sessions SET expires_at=NOW()-INTERVAL '1 second' WHERE session_id=$1`.
- **Erro:** PostgreSQL SQLSTATE `23514`, constraint `sessions_check`.
- **Evidência do log:** a linha de erro mostra `issued_at=2026-11-11 22:03:07.599184+00` e `expires_at=2026-11-11 22:03:06.758313+00`; portanto, o vencimento ficou anterior à emissão.

**Causa raiz:** fixture inválido, não defeito de expiração na lógica de autorização. A migration `0001_team_room_foundation.sql` define `CHECK (expires_at > issued_at)`. O teste altera somente `expires_at`, tornando a linha inválida antes de chamar `accept()`.

**Histórico relevante:** commit `cdd6402de14e75c8d63e01e91a81dcae466e3adb` corrigiu o fixture de expiração do próprio handoff, ajustando `created_at` e `expires_at`, mas deixou sem correção a atualização de expiração da sessão que falha em seguida.

**Correção técnica proposta (não aplicada):** no fixture, mover `issued_at` para o passado e `expires_at` para um instante posterior a `issued_at`, porém anterior a NOW(); por exemplo, `issued_at=NOW()-INTERVAL '2 minutes'` e `expires_at=NOW()-INTERVAL '1 second'` na mesma atualização. Restaurar ambos os timestamps após o assert. Isso preserva a constraint e mantém o teste real de sessão expirada.

**Classificação:** fixture temporal inválido / expiração / constraint; não há evidência de falha de migration, transação, isolamento ou concorrência neste erro.

### 4.2 PostgreSQL — communication teardown

- **Teste:** `communication::postgres_tests::postgres_general_private_acl_and_message_idempotency`
- **Arquivo/linha:** `services/ai-team-room/src/communication.rs:560`
- **Banco:** PostgreSQL 16 do service container.
- **Cenário:** teste cria canais geral/privado, membros e mensagens; ao final executa `DELETE FROM tenants WHERE tenant_id=$1`.
- **Erro:** SQLSTATE `23503`; FK `team_room_channel_members_added_by_principal_id_fkey`.
- **Registro referenciado:** principal que continua referenciado por `team_room_channel_members.added_by_principal_id`.

**Causa raiz:** ciclo de exclusão/teardown não resolvido na modelagem da FK. A migration `0009_team_room_communication.sql` define:
- `channel_id REFERENCES team_room_channels(channel_id) ON DELETE CASCADE`;
- `principal_id REFERENCES principals(principal_id) ON DELETE CASCADE`;
- `added_by_principal_id REFERENCES principals(principal_id)` sem ação de exclusão.

A FK `added_by_principal_id` bloqueia a exclusão do principal. A exclusão em cascata pelo vínculo `principal_id` não elimina o bloqueio da outra referência na ordem de triggers observada.

**Correção técnica proposta (não aplicada):** no teardown do teste, excluir explicitamente os registros de `team_room_channel_members` pertencentes aos canais do tenant antes de excluir o tenant. A alternativa de alterar a FK para `ON DELETE CASCADE` não deve ser adotada sem decisão semântica: excluir o criador de uma conversa não deve necessariamente remover a participação de todos os outros membros. Se houver requisito de exclusão de principal em produção, definir política de retenção/auditoria (por exemplo, ator tombstone ou FK anulável com `SET NULL`) e testar o lifecycle completo.

**Classificação:** FK + ordem de teardown/lifecycle de dados. O teste expõe um problema real de exclusão em cascata; não há evidência de transação, concorrência ou isolamento como causa.

## 5. Distributed Runner — causa raiz

**Workflow:** `Distributed Runner PostgreSQL Lab`  
**Run original:** `43108060574`  
**Job original:** `130817051889`  
**SHA:** `637631142961c1a9f7c342f2621cb65c009d6e45`

O job executou PostgreSQL lease/fencing e build com sucesso. O teste PostgreSQL de handoff falhou com o mesmo erro temporal da seção 4.1. O E2E de processos também foi executado e falhou em uma asserção específica:

`AssertionError: two recovery workers must serialize to one recovery transition — 0 !== 1`

**Arquivo/linha:** `scripts/distributed-runner-process-e2e.mjs:206`.

### Sequência observada

1. Dois processos Runner independentes iniciam contra o mesmo PostgreSQL; exatamente um adquire a lease inicial.
2. A lease de 15 segundos expira pelo relógio do banco.
3. O script chama previamente `POST /team-room/{room}/tasks/recover`.
4. Essa chamada persiste `RECOVERY_REQUIRED`.
5. O script valida candidatos e inicia dois Recovery Workers.
6. Cada worker chama novamente o endpoint de recovery, consulta candidatos e oferece handoff.
7. O E2E chega ao assert de soma das contagens de recovery e recebe `0`, não `1`.

**Causa raiz:** a transição de estado é realizada pelo preflight antes da corrida dos workers. O endpoint em `services/ai-team-room/src/main.rs` retorna `recovery_required: recovered`, onde `recovered` é a quantidade retornada por `tasks::recover_expired`. A função só altera tasks em `OWNED` ou `REASSIGNED` com lease expirada. Depois que o preflight já mudou a task para `RECOVERY_REQUIRED`, os dois workers seguintes corretamente não fazem outra transição e retornam contagem zero. O teste soma essas duas respostas e espera uma transição que ocorreu antes delas.

**Não é evidência de falha de lease/fencing ou de serialização SQL.** O teste já passou pelas verificações de lease expirada, dois candidatos elegíveis, ambos os workers oferecendo o mesmo handoff e escolha do candidato de substituição. Ele falha antes do aceite pelo Runner substituto e antes dos asserts de fencing 2, rejeição do proprietário antigo e conclusão pelo substituto.

**Correção técnica proposta (não aplicada):**
- Não executar o preflight de recovery antes da corrida dos workers.
- Validar elegibilidade dos candidatos por consulta de fixture/SQL independente, sem alterar o estado da task.
- Deixar os dois workers chamarem concorrentemente o endpoint real de recovery; assim, um deve observar uma transição e o outro zero.
- Preservar os asserts de handoff convergente, destinatário, aceite autenticado, fencing 2, rejeição de renew/checkpoint/complete do antigo owner e conclusão do novo owner.
- Tornar o cenário determinístico conforme requisito: Runner A inicia e recebe fencing 1; Runner B é rejeitado enquanto a lease está ativa; A perde a lease; B assume fencing 2; todas as operações obsoletas de A são rejeitadas; B completa.

**Lacuna adicional:** o script atual inicia A e B concorrentemente e escolhe dinamicamente quem venceu (`ownerIsA`). Portanto, não garante nominalmente o cenário Runner A → Runner B exigido pela missão. O log imprime “Runner A process exited” mesmo quando a variável `owner` pode apontar para o outro processo. O teste precisa fixar o papel inicial de A e o substituto B.

## 6. Commits recentes relacionados

Os seguintes commits foram inspecionados por diff:

| Commit | Mensagem | Relevância |
|---|---|---|
| `cdd6402de14e75c8d63e01e91a81dcae466e3adb` | test(team-room): fix PostgreSQL handoff expiry fixture and websocket auth handshake | Corrigiu fixture de expiração do handoff e handshake WebSocket; não corrigiu a expiração da sessão em handoffs.rs:631 |
| `8d043d4248acb91664fdab8058b008e327a6cb95` | fix(team-room): require authenticated handoff before expired-task reassignment | Mudança na autorização/recuperação do handoff |
| `0c400ee09ae2b6be30ba4ab2e6e3fbe0a4d1efb9` | fix(team-room): verify websocket ticket at router boundary and restore handoff checkpoint locally | Alteração de fronteira WebSocket e checkpoint |
| `95fdd13a2923a96965da69125349a786bf6bf4a5` | test(distributed): persist recovery state before querying live handoff candidates | Adicionou preflight `POST /tasks/recover` antes da descoberta de candidatos; criou a inconsistência com a soma posterior |
| `85d1cc35785f468de6f47a7854ed4bad0873b1e5` | test(distributed): verify live candidate eligibility without recovery-only discovery route | Introduziu consulta SQL direta de elegibilidade; o helper `candidateEligible` permanece no script atual |
| `1c496fc7163c7f8b1688a14babb46870adb94cb4` | fix(communication): authenticate websocket tickets before upgrade extraction | Segurança de autenticação WebSocket |
| `96afb62ef525616b9c682a97271654e39c346af1` | test(team-room): reject handoff acceptance from expired recipient sessions | Cobertura adicional para sessão expirada |
| `637631142961c1a9f7c342f2621cb65c009d6e45` | fix(recovery-worker): parse response text without redeclaring request body | HEAD atual |

Os diffs indicam trabalho paralelo legítimo. Nenhum commit foi revertido ou reescrito.

## 7. Arquivos modificados

**Projeto principal: nenhum.**

Arquivos analisados:
- `.github/workflows/ci.yml`
- `.github/workflows/distributed-runner-lab.yml`
- `services/ai-team-room/migrations/0001_team_room_foundation.sql`
- `services/ai-team-room/migrations/0009_team_room_communication.sql`
- `services/ai-team-room/src/handoffs.rs`
- `services/ai-team-room/src/communication.rs`
- `services/ai-team-room/src/main.rs`
- `services/ai-team-room/src/tasks.rs`
- `scripts/distributed-runner-process-e2e.mjs`
- `scripts/team-room-recovery-worker.mjs`
- `scripts/mission-runner.mjs`

Nenhum arquivo de código, migration ou workflow foi alterado nesta missão.

## 8. Testes específicos

| Teste | Resultado observado |
|---|---|
| `postgres_handoff_states_authorization_fencing_and_candidate_race` | **FAIL** — SQLSTATE 23514 em sessão expirada |
| `postgres_general_private_acl_and_message_idempotency` | **FAIL** — SQLSTATE 23503 no teardown |
| `ten_concurrent_executors_one_winner_then_expiry_reassignment_and_old_fence_rejection` | **PASS** no workflow distribuído |
| Build do serviço Team Room | **PASS** no workflow distribuído |
| E2E dois processos + Recovery Workers | **FAIL** — assert de contagem de recovery; não alcançou takeover/fencing final |

Não houve execução local: não foi realizado checkout local nem havia ambiente PostgreSQL local disponível por esta interface. As reproduções acima são execuções reais do GitHub Actions no SHA exato, não execuções alegadas localmente.

## 9. Testes de regressão

- Foundation Rust Linux: **PASS**.
- Foundation Rust Windows: **PASS**.
- JavaScript/TypeScript `npm run test:missions`: **PASS** nos jobs de Foundation.
- Build frontend `npm run build`: **PASS** nos jobs de Foundation.
- Team Room build: **PASS** no workflow distribuído.
- Testes PostgreSQL do serviço: **FAIL**, duas falhas em oito testes do binário `ai-team-room-service`; seis passaram.
- Testes JWT do serviço: **PASS**, seis de seis.
- Testes HTTP/security do serviço: **PASS** no log original.
- Keycloak/OIDC: **PASS** — discovery, client credentials, JWKS/RS256, exchange, sessão, autorização e admissão PostgreSQL.
- Lease/fencing PostgreSQL: **PASS**.
- Handoff: **FAIL**.
- Recovery Worker/Runner E2E: **FAIL** antes dos asserts finais de takeover.

## 10. CI completo

### Run original — TokenSaver AI CI

- **Workflow:** TokenSaver AI CI
- **Run ID:** `43108058615`
- **SHA:** `637631142961c1a9f7c342f2621cb65c009d6e45`
- **Link:** https://github.com/vidift-max/tokensaver-ai/actions/runs/43108058615
- **Jobs:**
  - `foundation`: SUCCESS
  - `foundation-windows`: SUCCESS
  - `keycloak-oidc-smoke`: SUCCESS
  - `ai-team-room-service`: FAILURE
- **Duração aproximada do job de serviço:** 74 segundos, calculada pelos timestamps do log; não foi disponibilizado metadado autoritativo de duração total do workflow.

### Run original — Distributed Runner PostgreSQL Lab

- **Workflow:** Distributed Runner PostgreSQL Lab
- **Run ID:** `43108060574`
- **SHA:** `637631142961c1a9f7c342f2621cb65c009d6e45`
- **Link:** https://github.com/vidift-max/tokensaver-ai/actions/runs/43108060574
- **Job:** `PostgreSQL 16 + Team Room + independent Runner processes`: FAILURE
- **Resultados internos:** lease/fencing PASS; build PASS; handoff FAIL (exit 101); processos independentes FAIL (exit 1); `runner_process_evidence=null`.
- **Duração aproximada do job:** 86 segundos pelos timestamps do log.

### Reexecução solicitada

Foi solicitado `rerun_failed_workflow_run_jobs` para ambos os runs. O GitHub aceitou as duas solicitações. Na última consulta disponível:
- job de serviço reexecutado: ID `130834820002`, status `in_progress`;
- job distribuído reexecutado: ID `130834830776`, status `in_progress`;
- logs da nova tentativa ainda não estavam disponíveis para leitura (download retornou BlobNotFound);
- não foi obtido resultado terminal da reexecução.

A aceitação da solicitação de rerun não é evidência de PASS. Os resultados originais permanecem FAILURE. A reexecução fica **PENDENTE** até obter status terminal e logs.

## 11. Run IDs e evidências

- CI: `43108058615`
- Distributed Runner: `43108060574`
- Jobs originais com falha: `130816627245` e `130817051889`
- Jobs reexecutados observados em andamento: `130834820002` e `130834830776`
- Artifact distribuído: `distributed-runner-postgres-evidence-43108060574`, ID `13894778218`.
- O JSON do artifact registra SHA `637631142961c1a9f7c342f2621cb65c009d6e45`, handoff exit 101, process exit 1 e resultado agregado FAIL.

### Inspeção do artifact

O ZIP do artifact ID `13894778218` foi baixado e inspecionado. O scan textual do conteúdo por `::add-mask::`, bearer values, JWT compactos e strings hexadecimais de 64 caracteres não encontrou correspondências. Isso é um scan limitado do artifact desta execução; não equivale a secret scanning histórico completo.

## 12. Segurança da release

### Verificações feitas
- Busca textual no repositório por `sk_live`, `ghp_` e `AKIA`: nenhum resultado.
- Busca por bypass/mock de autenticação: nenhuma ocorrência clara encontrada nos resultados consultados.
- Artifact do Distributed Runner desta execução: inspeção textual sem correspondência para os padrões descritos na seção 11.
- OIDC real com Keycloak: smoke test PASS.
- Workflow distribuído declara `permissions: contents: read`.

### Riscos/limitações
- A busca de secrets foi limitada a padrões e arquivos consultados; não é Gitleaks, secret scan do histórico inteiro, nem análise de secrets de Actions.
- Relatório anterior `reports/AI_WORK_CONTINUITY_RUNNER_REPORT.md` registra exposição histórica de credenciais efêmeras de fixture em um artifact antigo diferente. Não confundir esse artifact histórico com o ID `13894778218` inspecionado nesta missão. A retenção e remoção do artifact histórico exigem ação de administrador, se ainda necessário.
- `ci.yml` usa `npm install`, sem lockfile demonstrado no inventário anterior; actions são referenciadas por tags versionadas, não SHA imutável. Supply-chain hardening permanece pendente.
- Não houve pentest, secret scan histórico, SAST/SCA, revisão de todos os endpoints, inspeção de todos os artifacts ou ambiente de produção.
- Nenhuma credencial real foi reproduzida neste relatório.

## 13. Pendências

1. Corrigir fixture de sessão expirada mantendo `expires_at > issued_at`.
2. Corrigir teardown da comunicação para remover memberships dependentes antes da exclusão do tenant, ou aprovar política de FK e retenção apropriada.
3. Corrigir a sequência de recovery E2E para que os dois workers concorram pela transição, sem preflight que a consome.
4. Tornar o teste Runner A → Runner B determinístico e executar os asserts de fencing 2, stale renew/checkpoint/complete rejeitados e B complete aceito.
5. Obter status terminal dos dois reruns já solicitados.
6. Executar os testes específicos e a regressão integral após a implementação.
7. Executar CI completo e Distributed Runner Lab no mesmo SHA corrigido.
8. Inspecionar o artifact produzido após a correção antes de declarar evidência sem segredos.
9. Executar secret scan histórico e supply-chain checks antes de release.

## 14. Bloqueios

**BLOQUEADO — implementação no repositório principal.**

`CENTRAL.md` e `INSTRUCTIONS.md` do repositório de colaboração determinam que nenhuma IA modifique o projeto principal sem autorização expressa do GPT-6 integrador. A instrução desta missão solicita correções, mas não há grant específico do integrador registrado no canal de colaboração. Para preservar o trabalho paralelo e a governança, não foram criados commits nem PRs no produto.

**PENDENTE — resultado dos reruns.** Os jobs reexecutados estavam `in_progress` e sem logs disponíveis na última consulta. Não podem ser contabilizados como reproduções concluídas adicionais nem como PASS.

## 15. Riscos

- A falha da sessão expirada impede que o teste de handoff complete sua matriz de autorização e recuperação.
- A falha do teardown mascara o resultado final do teste de comunicação, embora os asserts anteriores possam ter passado.
- A falha do E2E impede validar o aceite pelo Runner substituto e a rejeição de operações obsoletas no fluxo distribuído.
- O cenário de Runner atual escolhe o owner inicial de modo concorrente e aleatório; não prova nominalmente A → B.
- CI sem SHA corrigido e verde não fornece gate de release.

## 16. Tabela antes/depois/evidência

|Item|Antes|Depois|Evidência|
|---|---|---|---|
|PostgreSQL test 1|FAIL|PENDENTE — correção definida, não aplicada|Run 43108058615; SQLSTATE 23514; `handoffs.rs:631`|
|PostgreSQL test 2|FAIL|PENDENTE — teardown definido, não aplicado|Run 43108058615; SQLSTATE 23503; `communication.rs:560`|
|Distributed Runner|FAIL|PENDENTE — causa do assert identificada, não corrigida|Run 43108060574; `0 !== 1`; artifact 13894778218|
|Foundation Linux|PASS|PASS no SHA auditado|Run 43108058615, job foundation|
|Foundation Windows|PASS|PASS no SHA auditado|Run 43108058615, job foundation-windows|
|Keycloak/OIDC|PASS|PASS no SHA auditado|Run 43108058615, job keycloak-oidc-smoke|
|Full CI|FAIL|NO-GO; rerun ainda sem resultado terminal|Run 43108058615; jobs acima|

## 17. Avaliação objetiva do Release Gate

### Resultado: NO-GO

Critérios para PASS não atendidos:
- testes PostgreSQL obrigatórios falham;
- Distributed Runner Lab falha;
- o cenário completo Runner A → Runner B não alcança o takeover final;
- não há SHA corrigido;
- não há CI completo verde em SHA final corrigido.

Foundation Linux/Windows e Keycloak/OIDC passaram, mas não compensam falhas críticas de persistência, teardown e continuidade distribuída.

## 18. Próxima ação recomendada

Solicitar ao GPT-6 integrador um grant explícito e limitado para alterar somente:
- `services/ai-team-room/src/handoffs.rs` (fixture de sessão expirada);
- `services/ai-team-room/src/communication.rs` (teardown do teste);
- `scripts/distributed-runner-process-e2e.mjs` (ordem do recovery e cenário A → B).

Após aprovação, implementar sem tocar na lógica de autorização/fencing do serviço, executar primeiro os dois testes PostgreSQL e o E2E distribuído, depois Foundation Linux/Windows, JWT/HTTP, Keycloak/OIDC e os dois workflows completos. O SHA final deve ser capturado e os dois workflows devem apontar exatamente para ele.

---

## Registro das 10 rodadas

| Rodada | Estado | Resultado |
|---|---|---|
| 1 — Reprodução | **TESTADO** | HEAD, workflows, jobs, commits e logs inspecionados; falhas reproduzidas em CI no SHA exato |
| 2 — Diagnóstico PostgreSQL | **VALIDADO** | Causas raiz confirmadas nos logs e nas constraints/migrations |
| 3 — Correção PostgreSQL | **BLOQUEADO** | Correções objetivas definidas; alteração no produto depende do grant do integrador |
| 4 — Diagnóstico Distributed Runner | **VALIDADO** | Preflight de recovery identificado como causa da asserção; fluxo real parcialmente executado |
| 5 — Correção Runner | **BLOQUEADO** | Correção proposta; não aplicada por governança |
| 6 — Regressão | **TESTADO / PENDENTE** | Foundation, OIDC e lease/fencing PASS; PG/handoff e Runner FAIL; reruns sem conclusão |
| 7 — CI completo | **PENDENTE / NO-GO** | Runs originais falham; reruns aceitos mas sem status terminal observável |
| 8 — Segurança | **TESTADO / PENDENTE** | Busca textual e inspeção de artifact limitadas; scan histórico/SAST/SCA pendentes |
| 9 — Release Gate | **VALIDADO** | NO-GO baseado em falhas críticas reproduzidas |
| 10 — Relatório | **IMPLEMENTADO / VALIDADO** | Este relatório independente foi criado no repositório de colaboração; produto principal intacto |

## Estado final

- **IMPLEMENTADO:** relatório independente e diagnóstico técnico.
- **TESTADO:** reproduções remotas nos workflows indicados; testes locais não executados.
- **VALIDADO:** causas raiz das falhas PostgreSQL e do assert de recovery identificadas.
- **PENDENTE:** reruns terminais, correções, regressão e CI verde em SHA final.
- **BLOQUEADO:** commits no projeto principal aguardando autorização expressa do GPT-6 integrador.

**NO-GO**

A missão de recuperação não pode ser declarada concluída com CI verde: as falhas continuam no SHA final disponível e nenhuma correção foi integrada. O objetivo de diagnóstico e evidência foi cumprido; a implementação e a validação final permanecem bloqueadas.
