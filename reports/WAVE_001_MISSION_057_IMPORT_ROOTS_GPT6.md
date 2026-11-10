# WAVE 001 — Missão 057: Import Roots
- IA/modelo: ChatGPT — GPT-6 (OpenAI)
- Data: 2026-11-10
- Status: PROPOSTA / aguardando aprovação do integrador
- Produto: vidift-max/tokensaver-ai, branch v2-saas-alpha, HEAD 935b6fc5d0c126e93697a16f73d56bb3a4d1e55f (read-only)

## Análise do problema atual
add_root/remove_root fazem load-modify-save em JSON sem lock. Limite 32 e deduplicação são avaliados sobre snapshots concorrentes. save_roots usa import_roots.json.tmp fixo; writers podem disputar/sobrescrever o temporário. No Windows remove o arquivo anterior antes de rename, abrindo janela sem configuração e perda se rename falhar. open_verified usa snapshot de roots e compara identidade do arquivo aberto, o que protege parte da importação, mas não coordena mutações simultâneas.

## Evidências no código
- path_guard.rs: load_roots() lê JSON e valida MAX_IMPORT_ROOTS.
- add_root(): carrega, checa duplicidade/limite, adiciona e salva sem lock.
- remove_root(): carrega, filtra e salva sem lock.
- save_roots(): temp fixo, fs::write; no Windows remove_file(path) antes de rename.
- open_verified(): canonicalização, verificação de root, identidade de arquivo aberto.

## Solução proposta
Preferência: lock interprocesso OS-backed em import_roots.lock, exclusivo em add/remove, mantido durante load-modify-save; mutex de processo não é suficiente. Sob lock, reler JSON, validar, deduplicar e aplicar limite. Temp exclusivo UUID com CREATE_NEW no mesmo diretório, write+sync_all, e atomic replace multiplataforma sem apagar antecipadamente o arquivo antigo. Liberar lock por RAII; lock OS é liberado após crash. Limitar config a 256 KiB antes de parse (valor proposto, confirmar no patch review).
open_verified deve consumir snapshot consistente. Definir semântica: remoção revoga novos opens, mas não cancela handle já aberto; se revogação imediata for requisito, usar lock compartilhado até abertura verificada terminar.
Alternativa: migrar roots para SQLite e usar transação IMMEDIATE, com migração JSON→SQLite e rollback. Escolher uma estratégia, não combinar as duas sem necessidade.

## Arquivos e funções envolvidos
- src-tauri/src/path_guard.rs: load_roots(), save_roots(), add_root(), remove_root(), list_roots(), open_verified().
- src-tauri/src/limits.rs: MAX_IMPORT_ROOTS_CONFIG_BYTES.
- src-tauri/Cargo.toml: dependência de lock/atomic replace somente se necessária.
- testes em path_guard.rs e src-tauri/src/tests.rs.

## Invariantes de segurança
Teto 32 após operação confirmada; sem lost update; config anterior íntegra se replace falhar; temp exclusivo e propriedade por operação; roots absolutos/canonicalizados; lock não substitui validação de symlink/junction; config inválida/grande falha sem apagar o original.

## Riscos de regressão
File locks variam em NFS/FS de rede; ReplaceFileW/rename podem falhar por ACL/antivírus; limite de config pode rejeitar paths legítimos; lock compartilhado durante import pode elevar latência.

## Dependências
058 para limite; 063 para filesystem/TOCTOU; 054 para coerência do fluxo de import/OneShot; 065–067 para integração e CI Windows/Linux.

## Testes necessários
Adições/remoções concorrentes em threads e processos; 31→32 roots com muitos writers; duplicatas; falha antes/durante replace preservando config antiga; crash e temp órfão; symlink/junction e root removida durante open; Linux/Windows. TESTE NÃO EXECUTADO: nenhum teste concorrente, crash ou multiplataforma foi executado.

## Critérios objetivos de aceite
32 é teto rígido; operações confirmadas não se perdem; em falha config anterior continua íntegra ou nova versão completa é publicada; nenhum temp ativo removido; import continua restrito a roots aprovadas.

## Limitações
A crate/API de lock e replace precisa ser escolhida e validada para targets oficialmente suportados. A proposta não executou teste.

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

### PATCH PLAN
- arquivo: src-tauri/src/path_guard.rs; função: add_root()/remove_root(); mudança: lock interprocesso, reload sob lock e validação do limite; teste: stress multiprocesso e 31→32; risco: lock contention/FS remoto.
- arquivo: src-tauri/src/path_guard.rs; função: save_roots(); mudança: temp UUID, sync e replace atômico; teste: falha/crash em cada boundary; risco: semântica Windows/Unix.
- arquivo: src-tauri/src/path_guard.rs; função: load_roots()/open_verified(); mudança: teto de bytes e snapshot consistente; teste: oversized config e revoke/open race; risco: política de revogação/latência.
- arquivo: src-tauri/src/limits.rs; função: constantes; mudança: limite de bytes da configuração; teste: limite exato/+1; risco: tamanho insuficiente.