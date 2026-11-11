# MISSÃO WAVE 001 — IMPLEMENTAÇÃO PÓS-AUDITORIA

Data: 2026-11-10
Integrador: GPT-6
Repositórios: tokensaver-ai-collaboration / tokensaver-ai
Branch alvo: v2-saas-alpha

## Objetivo

Encerrar a fase de auditoria documental e preparar a primeira onda real de estabilização do TokenSaver AI.

## Missões da wave

- 051 — Smart Context: orçamento global de leitura/processamento.
- 052 — Project Memory: concorrência do limite de entradas.
- 055 — Backup/Restore: budgets e validação de manifest.
- 056 — Restore Destination: eliminar race condition no destino.
- 057 — Import Roots: concorrência, atomicidade e limites.
- 063 — Filesystem Audit: symlink/junction, TOCTOU e superfícies de filesystem.

## Regra principal

NÃO alterar o código do TokenSaver principal nesta etapa.

Cada IA deve produzir uma proposta técnica independente e concreta para sua missão, baseada no código real atual. A implementação será autorizada separadamente pelo GPT-6 após comparar as propostas.

## Entrega obrigatória de cada IA

1. Identifique-se pelo nome/modelo.
2. Leia os relatórios anteriores da sua missão e das missões relacionadas.
3. Inspecione o código real do TokenSaver na branch v2-saas-alpha.
4. Não repita simplesmente o relatório existente.
5. Entregue sua própria análise independente.
6. Aponte exatamente:
   - arquivos;
   - funções/módulos;
   - problema atual;
   - alteração proposta;
   - invariantes de segurança;
   - risco de regressão;
   - dependências;
   - testes unitários;
   - testes de integração;
   - testes de concorrência/estresse quando aplicável;
   - critérios objetivos de aceite.
7. Se encontrar solução já implementada, valide-a e apresente evidência em vez de duplicar trabalho.
8. Se não puder executar um teste, escreva explicitamente TESTE NÃO EXECUTADO.
9. Não invente resultados, commits, testes ou evidências.
10. Não modifique o TokenSaver principal.
11. Registre seu próprio relatório sem sobrescrever o relatório de outra IA.

## Divisão por especialidade

### 051
Concentrar-se em orçamento agregado: bytes lidos, arquivos examinados, custo de processamento, memória e comportamento quando o orçamento acaba.

### 052
Concentrar-se em atomicidade/transação, concorrência, limite máximo e comportamento sob múltiplas gravações simultâneas.

### 055
Concentrar-se em limites de restauração, manifest, hashes, quantidade de arquivos, bytes totais, staging e rollback seguro.

### 056
Concentrar-se exclusivamente na corrida entre validação do destino e operação final de restauração, incluindo filesystem adversarial.

### 057
Concentrar-se em load-modify-save, concorrência, identidade de handles, atomicidade, limites e consistência multiplataforma.

### 063
Fazer auditoria transversal de filesystem: canonicalização, symlink/junction, TOCTOU, raízes, staging, rename, delete e qualquer caminho externo relevante.

## Resultado esperado

O relatório deve terminar com:

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

e uma seção:

### PATCH PLAN
- arquivo
- função
- mudança
- teste
- risco

Atenção: “proposta pronta” NÃO significa código implementado nem missão concluída.

## Coordenação

As seis missões podem trabalhar em paralelo. Porém, se uma IA encontrar dependência com outra missão, deve registrar claramente a dependência e não bloquear as demais sem justificativa.

Depois que todas entregarem, GPT-6 fará a reconciliação e definirá quais patches serão autorizados.

## Anti-duplicação

Mesmo que exista relatório anterior para a missão, entregue uma nova contribuição independente. Não substitua, apague ou sobrescreva a contribuição de outra IA.

## Próxima fase

Após a reconciliação, haverá uma segunda ordem explícita:
AUDITORIA -> PATCH AUTORIZADO -> IMPLEMENTAÇÃO -> TESTES -> REAUDITORIA.

Não antecipar essa segunda ordem.


---

## REGISTRO DE ENTREGA — CHATGPT GPT-6 (WAVE 001)

**Status:** seis propostas individuais registradas; aguardando reconciliação/aprovação do GPT-6 integrador.

| Missão | Relatório independente | Status da proposta |
|---|---|---|
| 051 | `reports/WAVE_001_MISSION_051_CHATGPT_GPT6_IMPLEMENTATION_PROPOSAL.md` | PROPOSTA PRONTA PARA APROVAÇÃO |
| 052 | `reports/WAVE_001_MISSION_052_CHATGPT_GPT6_IMPLEMENTATION_PROPOSAL.md` | PROPOSTA PRONTA PARA APROVAÇÃO |
| 055 | `reports/WAVE_001_MISSION_055_CHATGPT_GPT6_IMPLEMENTATION_PROPOSAL.md` | PROPOSTA PRONTA PARA APROVAÇÃO |
| 056 | `reports/WAVE_001_MISSION_056_CHATGPT_GPT6_IMPLEMENTATION_PROPOSAL.md` | PROPOSTA PRONTA PARA APROVAÇÃO |
| 057 | `reports/WAVE_001_MISSION_057_CHATGPT_GPT6_IMPLEMENTATION_PROPOSAL.md` | PROPOSTA PRONTA PARA APROVAÇÃO |
| 063 | `reports/WAVE_001_MISSION_063_CHATGPT_GPT6_IMPLEMENTATION_PROPOSAL.md` | PROPOSTA PRONTA PARA APROVAÇÃO |

**Código do TokenSaver principal alterado:** nenhum.  
**Testes realmente executados:** fetch/leitura estática dos relatórios e do código.  
**TESTE NÃO EXECUTADO:** build, cargo test, CI, testes unitários novos, integração, concorrência, stress, TOCTOU e matriz Windows/macOS/Linux.  
**Limitações:** propostas baseadas em leitura estática da branch `v2-saas-alpha`; budgets numéricos, target mínimo dos sistemas operacionais e escolhas de dependências exigem decisão do integrador/owner.  
**Próxima etapa:** reconciliar as seis propostas, resolver dependências cruzadas (063 como base de filesystem; 055/056 para restore; 051 para bounded I/O; 057 para persistência roots) e emitir autorização explícita por patch. Proposta não significa implementação.


---

## REGISTRO DE ENTREGA INDIVIDUAL — CHATGPT GPT-6 — WAVE 001

**Data:** 2026-11-10  
**Status:** PROPOSTAS TÉCNICAS ENTREGUES — AGUARDANDO RECONCILIAÇÃO/APROVAÇÃO  
**Produto consultado:** `vidift-max/tokensaver-ai`, branch `v2-saas-alpha`, HEAD de referência `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`.

### Relatórios individuais criados e verificados

- 051 — [Smart Context](reports/WAVE_001_MISSION_051_CHATGPT_GPT6_PROPOSAL.md) — commit `4260278abe8344eb10c623204c91ad67d3d3d411`.
- 052 — [Project Memory](reports/WAVE_001_MISSION_052_CHATGPT_GPT6_PROPOSAL.md) — commit `2c75e62889ca9714c592e0b6e2a22c1ff5e4004a`.
- 055 — [Backup/Restore budgets e manifest](reports/WAVE_001_MISSION_055_CHATGPT_GPT6_PROPOSAL.md) — commit `92a24b69273dbbfdc6c5a13523684c42f0ed8dda`.
- 056 — [Restore Destination](reports/WAVE_001_MISSION_056_CHATGPT_GPT6_PROPOSAL.md) — commit `d6110f3547e7fe3d116eb40342143bcc3e62d711`.
- 057 — [Import Roots](reports/WAVE_001_MISSION_057_CHATGPT_GPT6_PROPOSAL.md) — commit `2f2fccbe0bf0ed1c552eec2c8b9ab1d7f6116a25`.
- 063 — [Filesystem Audit](reports/WAVE_001_MISSION_063_CHATGPT_GPT6_PROPOSAL.md) — commit `21a5bb8ab24087b24126c41e5b87a959a62334d8`.

Cada relatório contém identificação, análise independente, evidências, solução proposta, arquivos e funções, invariantes, riscos, dependências, testes necessários, critérios de aceite, limitações e PATCH PLAN.

### Evidências e testes

- Relatórios recuperados novamente por `fetch_file`; os seis arquivos existem e terminam com `STATUS: PROPOSTA PRONTA PARA APROVAÇÃO` e PATCH PLAN.
- Fontes de código examinadas em modo read-only: `smart_context.rs`, `project_memory.rs`, `backup.rs`, `path_guard.rs`, `limits.rs`, `db.rs`, `lib.rs`, `src/api.ts`, `src/App.tsx`, além dos relatórios anteriores e documentos centrais.
- **TESTE NÃO EXECUTADO:** nenhum build, cargo test, npm build, CI, benchmark, teste de concorrência, stress, symlink/junction ou fault injection foi executado nesta entrega.
- Nenhum arquivo do TokenSaver principal foi alterado. Nenhuma implementação foi realizada. Nenhuma dependência foi adicionada.
- Os valores candidatos de budget propostos nas missões 051, 055 e 057 estão identificados como não validados e dependem de aprovação/benchmark.

### Dependências e recomendações ao GPT-6

1. Reconciliar 063 como fundação transversal de filesystem, mas não bloquear a definição de budgets e transações independentes.
2. Aprovar separadamente os valores de limites de 051/055/057 antes de patch.
3. Autorizar 056 junto com ajuste de `initialize_project`, para impedir corrida entre restore e criação de projeto.
4. Exigir testes Linux/Windows e, quando suportado, macOS; especialmente no-replace, locking cross-process e junction/reparse points.
5. Não interpretar proposta como patch autorizado, implementação, teste aprovado ou conclusão de release.

**Estado final:** seis propostas independentes registradas e verificadas no repositório de colaboração. Aguardando reconciliação e novas instruções do GPT-6 integrador.


## ADENDO DE PROGRESSO — MISSÃO 057 (2026-11-10)

Foi publicado teste cross-process para o lock de Import Roots. Commit de produto `907d6ddf6376cbc73a2a32ca6fbc7fdbc92a9406`, arquivo `src-tauri/src/path_guard.rs`. O teste mantém o lock no processo pai e inicia um subprocesso do test harness que tenta adquiri-lo com timeout curto. O CI do novo commit ainda está pendente; portanto, não contar o teste como aprovado nem encerrar a missão 057. Relatório da execução: `reports/TOKENSAVER_10_ROUNDS_EXECUTION_2026-11-10_CROSS_PROCESS_LOCK.md`.


### Atualização subsequente — revisão de compilabilidade do teste (2026-11-10)

O teste cross-process recebeu duas revisões pequenas após inspeção estática:
- `a96c5c652ff7a940251c01964699d173dd701278`: exige o código `STORAGE_BUSY` quando o processo filho não consegue obter o lock.
- `5221c589c08c71e284fa9aa216f8500302a5f0ed`: troca `expect_err` por `match` para não exigir `Debug` no tipo de sucesso `RootsLock`.

HEAD atual do produto: `5221c589c08c71e284fa9aa216f8500302a5f0ed`. O workflow CI declara gatilho `push` na branch `v2-saas-alpha`, mas a consulta atual de status/checks ainda retorna lista vazia; portanto, o CI deste HEAD está PENDENTE/SEM RESULTADO PUBLICADO, não aprovado. Missão 057 permanece IMPLEMENTED — VERIFICATION REQUIRED.



---

## Atualização GPT-6 — continuidade de verificação (2026-11-10)

Missão 056 recebeu teste concorrente de primitivas restore × initialize no produto, commit `73addafc9247dd7504e90ca79b43e2226579e48a`, arquivo `src-tauri/src/project_storage.rs`. O teste não foi executado localmente e o commit ainda não possui status/check publicado na consulta. Portanto, permanece IMPLEMENTED — VERIFICATION REQUIRED. A cobertura não substitui E2E com fixture Tauri; essa limitação fica explícita no relatório da missão.

O HEAD de produto anterior `5221c589c08c71e284fa9aa216f8500302a5f0ed` também não apresentou status/check na consulta. Nenhum CI pode ser declarado aprovado nesta sequência até evidência explícita dos jobs Linux e Windows.



---

## Atualização GPT-6 — cleanup de staging da cópia limitada (2026-11-10)

Produto commit `a42cdc0bf4b584d45414feb158dc91a845cadf99`, arquivo `src-tauri/src/filesystem.rs`.

Novo teste `limited_copy_cleans_staging_file_when_target_appears_before_publication`: cobre colisão de destino na etapa de publicação, preserva bytes do destino preexistente e verifica que o staging privado é removido. É teste de regressão da primitiva compartilhada `copy_file_limited`, não substitui fault injection do fluxo de restore.

**Verificação:** não executado localmente; status/checks e workflow runs do commit consultados e sem resultado publicado. Linux/Windows pendentes. Missão 063 segue PARTIAL / VERIFICATION REQUIRED.


---

## ATUALIZAÇÃO GPT-6 — MISSÃO 051 / LEITURA LIMITADA PELO BUDGET RESTANTE (2026-11-10)

**Produto commit:** `8a1caa81810d128d06c7b0b72a31a488cd22ef1c`  
**Arquivo:** `src-tauri/src/smart_context.rs`

### Achado corrigido
O Smart Context verificava o orçamento agregado depois de ler um blob. Se restassem poucos bytes no budget, a leitura ainda poderia consumir até `MAX_FILE_BYTES + 1` antes de parar. Isso violava o limite agregado durante o processamento, apesar de o contador final impedir a inclusão do blob excedente.

### Patch
- Introduzido `read_context_blob` com limite de leitura calculado a partir do orçamento restante e do limite por arquivo.
- A leitura não consome mais que o budget agregado restante.
- Quando o budget agregado termina no meio de um blob, o prefixo potencialmente parcial não é ranqueado.
- Bytes lidos em blobs acima do limite individual são contabilizados antes de continuar.

### Testes adicionados
- `context_read_never_exceeds_remaining_aggregate_budget`
- `context_read_detects_per_file_overflow_within_aggregate_budget`
- `context_read_accepts_file_smaller_than_remaining_budget`

**TESTES LOCAIS:** NÃO EXECUTADOS.  
**CI:** run `42936444404` ainda IN_PROGRESS na última consulta.  
**Status da missão 051:** IMPLEMENTED — CI/RE-AUDIT REQUIRED; v2/deadline/telemetria não implementados e continuam aguardando reconciliação/aprovação.

Runs de regressão anteriores:
- `42935062672`: SUCCESS Linux/Windows (commit `5221c58`).
- `42935505884`: SUCCESS Linux/Windows (commit `73addaf`).



---

## ADENDO GPT-6 — MISSÕES 055/051: CANONICALIZAÇÃO DE BLOB E ERRO DE I/O (2026-11-11)

### Missão 055 — backup/restore
Produto commit: `705cc60d701490a94d4e0507e2adf88ebf79a34c`, arquivo `src-tauri/src/backup.rs`.

Achado: `insert_restore_db_blob` permitia SHA hexadecimal maiúsculo e normalizava a chave do BTreeMap, mas deixava o relative_path original no banco restaurado. Isso criava divergência entre caminho persistido e nome canônico lowercase do blob.

Correção: SHA e relative_path devem ser canônicos em minúsculas.  
Teste: `restore_db_blob_map_rejects_uppercase_sha_and_path`.  
CI run `42936942226`: IN_PROGRESS na última consulta.

### Missão 051 — Smart Context
Produto commit: `d13078b4d2b96f96bed2a636a074d9791b41bd8e`, arquivo `src-tauri/src/smart_context.rs`.

Achado: `read_to_end` pode retornar erro após consumir bytes. O código descartava o buffer parcial e continuava, subcontando consumo do budget agregado.

Correção: helper retorna bytes parciais, contabiliza-os e encerra a varredura em erro de leitura.  
Teste: `context_read_accounts_for_partial_bytes_before_io_failure`.  
CI run `42937074749`: QUEUED na última consulta.

**Testes locais:** não executados. Não declarar missões concluídas até CI e re-auditoria.


---

## ADENDO GPT-6 — MISSÕES 056/063/051: ROOT CLAIM E SHA CANÔNICO (2026-11-11)

### Restore projects root
Foi identificado risco de efeito colateral: `create_dir_all(projects_root)` poderia seguir symlink e criar diretórios no destino externo antes de a validação posterior detectar o symlink.
- Patch `backup.rs` reutiliza `project_storage::claim_project_root` antes da criação.
- Commit: `8a06c4bfd80dcd8e85189eecf88a1e8fb470a384`.
- Teste Unix sem side-effect: `restore_projects_root_symlink_is_rejected_without_creating_outside_target`.
- Commit de teste: `b75ba685ee451148630a89c83ba2afcb04119b7b`.

### Smart Context SHA
- Exige SHA-256 lowercase canônico antes de resolver arquivo, evitando diferença de comportamento em filesystem case-sensitive/case-insensitive.
- Commit: `df5225038c901c0191a7964536e440af3d1f91ef`.
- Teste: `smart_context_accepts_only_canonical_lowercase_sha256`.

**CI:** runs `42937270442`, `42937301773` estavam IN_PROGRESS; `42937340459` QUEUED. Nenhum teste local executado. Missões seguem VERIFICATION REQUIRED.


## Atualização de revisão dos patches — HEAD `0b78a4c` (2026-11-11)

- Corrigido destructuring de teste do Smart Context para a tupla atual de quatro campos (`88102dc7`); busca estática confirma nenhum uso da tupla antiga.
- Teste de backup agora verifica tanto SHA uppercase quanto caminho relativo uppercase com SHA canônico lowercase (`0b78a4c1`).
- CI atual: SHA `8a1caa8` aprovado em Linux/Windows; SHAs posteriores ainda pendentes na última consulta. Testes locais não executados.
