# WAVE 001 — Missão 056: Restore Destination — proposta independente

## Identificação
- IA: ChatGPT | Modelo: GPT-6 | Especialidade: Rust, filesystem transacional e concorrência multiplataforma
- Papel: auditoria estática independente e proposta de patch | Data: 2026-11-10
- Status próprio: REVIEW_REQUIRED; aguarda reconciliação/aprovação

## Análise do problema atual
`restore_project_backup` verifica `symlink_metadata(target)` antes de iniciar staging, executa cópia/hash/remapeamento e publica com `fs::rename(stage,target)`. Durante esse intervalo outro comando/processo pode criar o mesmo target. A expressão `is_ok()` trata qualquer erro de metadata como se o destino não existisse, inclusive PermissionDenied. `std::fs::rename` não oferece, por si só, garantia uniforme de publicação no-replace em todas as plataformas. `initialize_project` usa `create_dir_all` e pode disputar o mesmo ID.

## Evidências no código
Projeto principal `vidift-max/tokensaver-ai`, branch `v2-saas-alpha`, HEAD `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`.
- `src-tauri/src/backup.rs::restore_project_backup`: check inicial, stage UUID e rename final.
- `src-tauri/src/lib.rs::initialize_project`: cria o diretório de projeto sem reserva comum.
- Testes de `backup.rs`: IDs e remapeamento SQL; não cobrem disputa de target.
- Relatórios anteriores lidos: 055 e 056; correlato 063.

## Solução proposta
Implementar `publish_directory_noreplace(stage,target)` com primitiva OS-level: Linux `renameat2(RENAME_NOREPLACE)`; Windows move sem replace; macOS/BSD primitiva equivalente validada. Plataforma/FS sem garantia deve falhar fechado; nunca fazer fallback para rename substitutivo ou apagar target. Metadata inicial é apenas fast-fail e deve distinguir NotFound de PermissionDenied. Criar claim/lock tokenizado de project ID compartilhado por restore e initialize; manter handle durante a operação. O lock cooperativo não substitui publish no-replace, pois processos externos podem ignorá-lo. Stage deve estar no mesmo filesystem e raiz validada. Cleanup remove somente stage/claim cuja identidade/token pertença à operação. Lock stale requer recuperação verificável, não timeout arbitrário. Sync de conteúdo e diretório pai quando suportado.

## Invariantes de segurança
- Publish atômico e no-replace.
- Se target existir em qualquer instante, restore falha sem modificar conteúdo preexistente.
- Só ErrorKind::NotFound significa ausência; outros erros abortam.
- Stage e target no mesmo filesystem e dentro de projects root.
- Cleanup nunca remove objeto de outra operação.
- initialize e restore compartilham claim; no-replace continua última defesa.

## Riscos
APIs nativas variam por SO/FS; locks stale podem bloquear IDs; initialize sem claim pode causar falha de restore, embora no-replace proteja o conteúdo; testes em tmp podem não representar NTFS/APFS/network FS; bindings nativos aumentam manutenção.

## Dependências
Missão 055 valida backup antes da publicação; 063 fornece root/handles; revisão de initialize_project; possível libc/rustix/windows-sys. Dependências precisam aprovação GPT-6.

## Testes necessários
Unitários: target ausente, diretório/arquivo existente, symlink/junction, PermissionDenied e NotFound. Concorrência: 100 restores no mesmo ID; restore vs initialize; processo cria target entre check e publish; exatamente um vencedor e bytes do target preservados. Fault injection em cada fase, crash recovery, matriz Linux/Windows/macOS e FS local. **TESTE NÃO EXECUTADO:** nenhum teste de corrida, filesystem, build ou cross-platform.

## Critérios objetivos de aceite
No máximo um publish concorrente; target criado depois do check nunca é substituído; erro não remove target; stage/claim recuperáveis; testes demonstram no-replace em todos os SOs suportados.

## Limitações
Rust std rename não garante universalmente no-replace. A primitiva deve ser validada por plataforma/filesystem. Nenhum teste dinâmico foi executado.

## Relação com trabalho anterior
A proposta anterior registrava a corrida entre check e rename. Esta análise acrescenta disputa com initialize_project, erro de metadata interpretado incorretamente, no-replace OS-level obrigatório e ownership de cleanup.

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

### PATCH PLAN
| arquivo | função | mudança | teste | risco |
|---|---|---|---|---|
| `src-tauri/src/backup.rs` | `restore_project_backup` | trocar check-then-rename por publish no-replace | target criado durante restore | compatibilidade FS |
| `src-tauri/src/fs_publish.rs` novo | `publish_directory_noreplace` | wrapper OS-specific sem fallback substitutivo | teste por SO/FS | implementação nativa |
| `src-tauri/src/project_lock.rs` novo | claim/release ID | lock tokenizado por create_new e ownership | restore vs restore/initialize | lock stale |
| `src-tauri/src/lib.rs` | `initialize_project` | usar claim comum | corrida initialize vs restore | contenção |
| `src-tauri/Cargo.toml` | dependências | bindings/crate nativa somente aprovada | build matrix | manutenção |
