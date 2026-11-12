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

### Reexecução dos jobs com falha

Foi solicitado `rerun_failed_workflow_run_jobs` para ambos os runs originais. As reexecuções terminaram e reproduziram as mesmas falhas, no mesmo SHA:
- CI, job reexecutado `ai-team-room-service` ID `130834820002`: **FAILURE**; novamente seis testes passaram e os mesmos dois testes PostgreSQL falharam (SQLSTATE 23514 e 23503).
- Distributed Runner, job reexecutado ID `130834830776`: **FAILURE**; lease/fencing e build passaram, handoff terminou com exit 101 e o E2E de processos com exit 1 na asserção `two recovery workers must serialize to one recovery transition`.
- Logs reexecutados disponíveis; timestamps do CI entre 22:39:35Z e 22:40:10Z.

A reprodução adicional confirma que não se tratava de falha transitória do ambiente. Os resultados terminais são FAILURE, não PASS.

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
5. Reruns concluídos e falhas reproduzidas no mesmo SHA; aguardar correção autorizada.
6. Executar os testes específicos e a regressão integral após a implementação.
7. Executar CI completo e Distributed Runner Lab no mesmo SHA corrigido.
8. Inspecionar o artifact produzido após a correção antes de declarar evidência sem segredos.
9. Executar secret scan histórico e supply-chain checks antes de release.

## 14. Bloqueios

**BLOQUEADO — implementação no repositório principal.**

`CENTRAL.md` e `INSTRUCTIONS.md` do repositório de colaboração determinam que nenhuma IA modifique o projeto principal sem autorização expressa do GPT-6 integrador. A instrução desta missão solicita correções, mas não há grant específico do integrador registrado no canal de colaboração. Para preservar o trabalho paralelo e a governança, não foram criados commits nem PRs no produto.

**VALIDADO — reruns reproduziram as falhas.** Ambos os jobs reexecutados terminaram FAILURE no mesmo SHA; os logs confirmam novamente os dois erros PostgreSQL e a asserção do Runner.

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
|Full CI|FAIL|FAIL novamente após rerun; NO-GO|Run 43108058615; job reexecutado 130834820002|

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
| 6 — Regressão | **TESTADO** | Foundation, OIDC e lease/fencing PASS; os reruns reproduziram PG/handoff e Runner FAIL |
| 7 — CI completo | **VALIDADO / NO-GO** | Runs originais e reexecuções terminam FAILURE no SHA atual |
| 8 — Segurança | **TESTADO / PENDENTE** | Busca textual e inspeção de artifact limitadas; scan histórico/SAST/SCA pendentes |
| 9 — Release Gate | **VALIDADO** | NO-GO baseado em falhas críticas reproduzidas |
| 10 — Relatório | **IMPLEMENTADO / VALIDADO** | Este relatório independente foi criado no repositório de colaboração; produto principal intacto |

## Estado final

- **IMPLEMENTADO:** relatório independente e diagnóstico técnico.
- **TESTADO:** reproduções remotas nos workflows indicados; testes locais não executados.
- **VALIDADO:** causas raiz das falhas PostgreSQL e do assert de recovery identificadas.
- **PENDENTE:** correções, regressão e CI verde em SHA final.
- **BLOQUEADO:** commits no projeto principal aguardando autorização expressa do GPT-6 integrador.

**NO-GO**

A missão de recuperação não pode ser declarada concluída com CI verde: as falhas continuam no SHA final disponível e nenhuma correção foi integrada. O objetivo de diagnóstico e evidência foi cumprido; a implementação e a validação final permanecem bloqueadas.


---

# Mission 5 — Authorized Recovery Implementation & Final CI Gate

**Updated:** 2026-11-12  
**Role:** IA 4 — QA / Release Engineer  
**Authorization:** explicit authorization from GPT-6 integrator received for the three Mission 5 fixes.  
**Product repository:** `vidift-max/tokensaver-ai`  
**Target branch:** `v2-saas-alpha`

## 1. Final executive result

<badge color="success">GO — CI recovery gate passed</badge>

All three originally confirmed causes were corrected. A fourth defect uncovered by the real distributed E2E was also corrected without weakening its checkpoint assertions. The pull request was merged and **both complete workflows passed on the exact final branch SHA**:

`e18557c65753714bf926845639526b22c0309826`

The branch head was independently read after merge and matched this SHA. Both final push-triggered workflows report that same SHA and terminal `success`.

**Scope qualification:** GO applies to this Mission 5 CI-recovery gate. It is not a blanket production/commercial launch approval and does not close the separate product-readiness, billing, model-provider, installer/signing, deployment, and operations gaps recorded in the earlier production-readiness report.

## 2. SHA initial and final

| Item | SHA |
|---|---|
| Initial audited HEAD | `637631142961c1a9f7c342f2621cb65c009d6e45` |
| PR head SHA | `8b2db8d8e45667b1c9ad7d3a9cd90ef6ee7ba206` |
| PR synthetic merge SHA tested | `0006c4a0cb0d6e55820428fa1f38dd69e965bae0` |
| **Final merged branch SHA** | **`e18557c65753714bf926845639526b22c0309826`** |

The merge commit differed from the synthetic PR merge SHA. In accordance with the exact-SHA rule, CI was run again after merge on the final branch SHA. The branch reference `v2-saas-alpha` was read after completion and resolved to `e18557c65753714bf926845639526b22c0309826`.

## 3. Handoff — cause and correction

**Before:** the PostgreSQL test set only `expires_at=NOW()-1 second`. Its existing `issued_at` remained later than that timestamp, violating `sessions_check (expires_at > issued_at)` with SQLSTATE 23514.

**Correction:** `services/ai-team-room/src/handoffs.rs` now:
- saves the original `issued_at` and `expires_at`;
- sets `issued_at=NOW()-2 minutes` and `expires_at=NOW()-1 second`;
- queries and asserts `issued_at < expires_at AND expires_at <= NOW()`;
- runs the real authenticated acceptance attempt and expects `HandoffError::Forbidden`;
- restores the original timestamps.

No migration or database constraint was relaxed.

**Result:** `postgres_handoff_states_authorization_fencing_and_candidate_race` passed in both the service PostgreSQL suite and the independent distributed workflow. The targeted failure is resolved.

## 4. Communication — foreign key and teardown

**Before:** tenant teardown attempted to delete principals while `team_room_channel_members.added_by_principal_id` still referenced the actor, causing SQLSTATE 23503.

**Model decision:** preserve the restrictive FK. `added_by_principal_id` is an actor/audit reference; automatic cascade deletion could erase provenance or unexpectedly remove membership records. `SET NULL` would also require a separate schema/product decision and nullable audit semantics.

**Correction:** in `services/ai-team-room/src/communication.rs`, the PostgreSQL test teardown explicitly deletes memberships belonging to the fixture tenant's channels before deleting the tenant. The production FK and migration remain unchanged.

**Result:** `postgres_general_private_acl_and_message_idempotency` passed. The complete Team Room service test binary passed with 8/8 tests. No migration was necessary.

## 5. Distributed Runner — cause and correction

**Before:** the E2E called the authenticated recovery endpoint as a preflight, persisting `RECOVERY_REQUIRED` before launching Recovery Worker A and B. Both workers then correctly observed no new transition, and the old assertion failed with `0 !== 1`.

**Correction:** `scripts/distributed-runner-process-e2e.mjs` no longer mutates task state before worker startup. It checks candidate eligibility without consuming recovery, then starts two independently authenticated Recovery Worker processes against the same PostgreSQL task. The assertion now requires exactly the sorted results `[0,1]`, proving one and only one transition winner. The existing real handoff, takeover, ownership, and fencing assertions remain active.

### Additional defect found during validation

The first revised E2E passed the two PostgreSQL tests and reached a later owner-initiated handoff assertion. That assertion exposed a separate payload-shape defect: `mission-runner.mjs` passed an envelope containing a nested `checkpoint` object to `TeamRoomClient.checkpoint`, which itself wraps the value for the API. PostgreSQL therefore stored the document one level too deep, so the recipient did not restore `checkpoint.description` at the expected location.

**Correction:** `scripts/mission-runner.mjs` now sends the checkpoint document itself to `TeamRoomClient.checkpoint`. The E2E adds a direct PostgreSQL assertion that the stored checkpoint document has the expected `description`, then retains the post-acceptance assertion that the exact checkpoint was restored. No assertion was weakened.

## 6. Files changed

Exactly four product files were changed:

| File | Change |
|---|---|
| `services/ai-team-room/src/handoffs.rs` | Valid expired-session fixture, temporal invariant assertion, restore original timestamps |
| `services/ai-team-room/src/communication.rs` | Explicit ordered teardown of fixture channel memberships |
| `scripts/distributed-runner-process-e2e.mjs` | Remove preflight recovery mutation; concurrent worker race and exact one-winner assertion; verify checkpoint document persisted |
| `scripts/mission-runner.mjs` | Send the checkpoint document without an extra nested wrapper |

No migration, production FK, authentication, authorization, lease, or fencing implementation was weakened or altered.

## 7. Commits and integration

| Commit | Change |
|---|---|
| `e76a07dc6911019169fcbafc81383d0b9813c087` | Handoff temporal fixture |
| `59d3bba68aef5223034085ca66b0c8986a06f368` | Communication teardown |
| `3f2054b060eaccc1de23d4e9dde87e425c91b862` | Concurrent Recovery Worker E2E |
| `f9e9541e49afd7af02385474c146a427bfda8330` | Correct checkpoint payload shape |
| `8b2db8d8e45667b1c9ad7d3a9cd90ef6ee7ba206` | Assert checkpoint document in PostgreSQL |
| **`e18557c65753714bf926845639526b22c0309826`** | Merge commit into `v2-saas-alpha` |

PR: https://github.com/vidift-max/tokensaver-ai/pull/1

## 8. Individual and regression tests

### Final Team Room service PostgreSQL job

Workflow `TokenSaver AI CI`, run `43125683693`, job `130877032536`:

- JWT tests: 6 passed.
- HTTP/security boundary tests: 5 passed.
- Team Room PostgreSQL service tests: 8 passed, including both previously failing tests and distributed lease/fencing.
- Admission tests: 3 passed.
- Identity/session tests: 4 passed.
- No test removed, ignored, filtered to hide failure, or converted to a mock.

### Foundation Linux

Workflow `TokenSaver AI CI`, run `43125683693`, job `130877032719`:

- `cargo check`: PASS.
- `cargo test`: 86 passed, 0 failed.
- `npm run test:missions`: 19 passed, 0 failed.
- `npm run build`: PASS.
- Source ZIP packaged and uploaded.

### Foundation Windows

Workflow `TokenSaver AI CI`, run `43125683693`, job `130877031965`:

- `CONTINUE_MISSION.bat` smoke: PASS.
- `cargo check`: PASS.
- `cargo test`: 83 passed, 0 failed.
- `npm run test:missions`: 19 passed, 0 failed.
- `npm run build`: PASS.

The platform-specific Rust test totals differ (86 Linux, 83 Windows); both native test commands completed successfully with zero failures.

### Keycloak/OIDC

Workflow `TokenSaver AI CI`, run `43125683693`, job `130877032403`:

- Ephemeral Keycloak startup/readiness: PASS.
- Realm and confidential client creation: PASS.
- Real discovery, client-credentials token, JWKS signature: PASS.
- Exchange, session, authorization and PostgreSQL admission: PASS.

### Distributed Runner and Recovery Workers

Workflow `Distributed Runner PostgreSQL Lab`, run `43125683708`, job `130877032294`:

- PostgreSQL lease/fencing integration: PASS.
- Authenticated handoff PostgreSQL integration: PASS.
- Real Team Room service build: PASS.
- Two independent Mission Runner processes: PASS.
- Recovery Worker A and B ran as distinct processes and identities against the same PostgreSQL 16 task.
- `recovery_transition_count=1`; `recovery_status_persisted=RECOVERY_REQUIRED`.
- Database clock confirmed lease expiration after 16 seconds.
- Fencing A=1, B=2.
- Stale A renew/checkpoint/complete/release: REJECTED.
- B renew/checkpoint/complete: ACCEPTED.
- Competing eligible recipient: REJECTED_HTTP_403.
- Final task status: COMPLETED.
- Owner-initiated handoff: COMPLETED, fencing 1→2, checkpoint preserved, stale owner operations rejected.

This is a real PostgreSQL/service/process proof, not a mock or in-memory concurrency test.

## 9. Full CI on the exact final SHA

### TokenSaver AI CI

- Workflow run: `43125683693`
- Link: https://github.com/vidift-max/tokensaver-ai/actions/runs/43125683693
- Event: push to `v2-saas-alpha`
- SHA: `e18557c65753714bf926845639526b22c0309826`
- Result: **SUCCESS**
- Jobs:
  - `foundation-windows` — SUCCESS
  - `foundation` — SUCCESS
  - `ai-team-room-service` — SUCCESS
  - `keycloak-oidc-smoke` — SUCCESS
- Approximate run duration from GitHub timestamps: 5m11s.

### Distributed Runner PostgreSQL Lab

- Workflow run: `43125683708`
- Link: https://github.com/vidift-max/tokensaver-ai/actions/runs/43125683708
- Event: push to `v2-saas-alpha`
- SHA: `e18557c65753714bf926845639526b22c0309826`
- Result: **SUCCESS**
- Job `PostgreSQL 16 + Team Room + independent Runner processes` — SUCCESS
- Approximate run duration from GitHub timestamps: 2m00s.

Both workflows ran against the **same exact final SHA**. The branch reference was independently queried after both completed and still pointed to that SHA. No later product commit was made.

### PR validation history

The PR synthetic merge SHA `0006c4a0cb0d6e55820428fa1f38dd69e965bae0` also passed both workflows (runs `43124904319` and `43124904241`). The first PR revision had exposed the nested checkpoint defect and failed the distributed E2E (run `43124528769`); that failure was retained, fixed, and covered by the added PostgreSQL checkpoint-shape assertion. The merge created a new SHA, so both workflows were rerun on the final branch SHA as required.

## 10. Artifacts and evidence

Final distributed artifact:
- Artifact ID: `13902587483`
- Name: `distributed-runner-postgres-evidence-43125683708`
- Contains: `distributed-runner-evidence.json`, `runner-process-evidence.json`, `test.log`, `team-room-service.log`.
- Artifact JSON records final SHA `e18557c65753714bf926845639526b22c0309826` and aggregate `PASS`.
- The archive was downloaded and inspected.

Artifact security scan covered compact JWT patterns, bearer strings, GitHub token patterns, AWS access key patterns, and private-key headers across all four artifact files. **No matches were found.** Service log contained only local test startup/health messages and no bearer credentials.

Repository-level pattern searches also found no `sk_live`, `ghp_`, or `AKIA` matches. Existing synthetic RSA private-key fixtures and `test-only-secret` remain in test-oriented code; this is not a full historical Gitleaks/SAST/SCA audit and no claim of comprehensive secret scanning is made.

## 11. Security and integrity

- Session expiry fixture now models a valid expired session and preserves the DB constraint.
- Communication FK remains restrictive; test teardown is explicit and ordered.
- No production authentication or authorization bypass introduced.
- No lease or fencing checks removed or weakened.
- Two independent worker identities and processes are evidenced.
- Artifact scan found no token/credential patterns.
- No production migration was required.
- No full production penetration test, historical secret scan, SAST/SCA, or supply-chain review was performed as part of this mission.

## 12. Final validation matrix

| Validação | Resultado | Evidência |
|---|---|---|
| Handoff expiration | **PASS** | Run 43125683693, job 130877032536; SQLSTATE 23514 no longer occurs |
| PostgreSQL communication | **PASS** | Run 43125683693, job 130877032536; 8/8 service tests |
| Foreign key integrity | **PASS** | Same test passes with restrictive `added_by_principal_id` FK preserved |
| Distributed Runner | **PASS** | Run 43125683708, job 130877032294 |
| Recovery Worker A/B | **PASS** | Two distinct PIDs/sessions; transition count exactly 1 |
| Fencing | **PASS** | A=1, B=2; stale A operations rejected; B completion accepted |
| Regression suite | **PASS** | Rust, JS/TS, Team Room, sessions, handoff, ownership, lease/fencing |
| Linux | **PASS** | 86 Rust + 19 JS tests; build PASS |
| Windows | **PASS** | 83 Rust + 19 JS tests; build PASS |
| Keycloak/OIDC | **PASS** | Run 43125683693, job 130877032403 |
| Full CI | **PASS** | Runs 43125683693 and 43125683708 both SUCCESS on final SHA |

## 13. Ten-round completion status

| Rodada | Estado | Evidência/resultado |
|---|---|---|
| 1 — Audit before changes | **VALIDADO** | Reconfirmed branch, SHA, code, tests, workflows, previous reports and commits before editing |
| 2 — Fix Handoff | **IMPLEMENTADO / TESTADO** | Coherent timestamps; target PostgreSQL test PASS |
| 3 — Validate Handoff | **TESTADO / VALIDADO** | JWT, sessions, authorization, handoff, lease/fencing and service PG suites PASS |
| 4 — Fix Communication FK/teardown | **IMPLEMENTADO / TESTADO** | Explicit test teardown; restrictive FK retained; PG test PASS |
| 5 — Validate Communication | **TESTADO / VALIDADO** | Channels, memberships, ACL, idempotency, admission and migrations through service suite PASS |
| 6 — Fix Distributed Runner | **IMPLEMENTADO / TESTADO** | Real workers compete; exactly one transition; checkpoint payload corrected |
| 7 — Prove concurrency | **TESTADO / VALIDADO** | PostgreSQL 16, two worker PIDs/sessions, one winner, fencing and checkpoint evidence PASS |
| 8 — Full regression | **TESTADO / VALIDADO** | Rust Linux/Windows, JS 19/19 each, Team Room, Keycloak/OIDC and distributed E2E PASS |
| 9 — Exact-SHA CI | **VALIDADO** | Both final push workflows SUCCESS on `e18557c...`; branch HEAD matches |
| 10 — Final report | **IMPLEMENTADO / VALIDADO** | This follow-up appended and verified in collaboration repo |

## 14. Pending items and risks

For the **Mission 5 CI recovery gate**, no blocking item remains.

Separate product-readiness work remains outside this mission: actual AI provider integration, SaaS customer identity/billing/usage ledger, signed desktop release/update pipeline, production ingress/CSP/CORS hardening, PostgreSQL backup/PITR and deployment/observability. Those remain governed by the earlier `PRODUCTION_READINESS_COMMERCIAL_REPORT.md` and must not be treated as resolved by a green CI run.

No local test execution is claimed; the evidence in this report is from actual GitHub Actions runs on the exact final branch SHA.

## 15. Final release decision

**GO — Mission 5 CI Recovery Release Gate.**

Reason:
- all three confirmed causes were corrected;
- the additional checkpoint-shape defect found during E2E was corrected;
- both previously failing PostgreSQL tests pass;
- concurrent independent Recovery Workers produce exactly one persisted transition;
- fencing and stale-owner rejection remain enforced;
- Linux, Windows, Team Room, Keycloak/OIDC and Distributed Runner workflows all pass;
- both complete workflows report SUCCESS on the exact final branch SHA `e18557c65753714bf926845639526b22c0309826`.

This GO is limited to the CI recovery mission. It does not supersede separate NO-GO production/commercial readiness findings.
