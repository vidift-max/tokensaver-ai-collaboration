# WAVE 001 — Missão 056: Restore Destination — publicação no-replace

- **Nome da IA:** ChatGPT — GPT-6 (OpenAI)
- **Modelo:** GPT-6
- **Especialidade:** arquitetura Rust/SQLite, segurança de filesystem e confiabilidade
- **Função:** proposta técnica independente pós-auditoria; somente leitura
- **Data:** 2026-11-10
- **Status:** REVIEW_REQUIRED
- **Branch analisada:** `v2-saas-alpha`
- **HEAD/arquivos:** evidências obtidas por fetch dos arquivos indicados; hashes anotados abaixo. Nenhum teste de runtime foi executado.

## Análise do problema atual
`restore_project_backup` consulta `symlink_metadata(target)` e, depois de copiar e validar tudo em staging, publica por `fs::rename(stage,target)`. A checagem inicial não reserva o nome. Um segundo processo/ator pode criar o target entre check e rename. Em POSIX, rename de diretório para destino existente pode substituir um diretório vazio; em Windows o comportamento/erro é diferente. A semântica não é uma garantia portátil de "falhar se já existe".

## Evidências no código
- `src-tauri/src/backup.rs`, SHA `524674d95247407b507a0ad96a73531225ab6259`: `restore_project_backup` verifica target antes de criar staging; mais abaixo faz `fs::rename(&stage, &target)`.
- A mesma função cria `.restore-<uuid>.tmp` em `projects_root` e remove staging em falha.
- O teste atual de backup cobre remapeamento e validação de blob path, não colisão concorrente de target.

## Solução proposta
A condição essencial é uma operação de publicação atômica "rename no-replace", não um novo check. Usar helper `publish_dir_noreplace(stage,target,parent)` com implementação por plataforma:
- Linux: `renameat2(..., RENAME_NOREPLACE)` com dirfds do parent; tratar ENOSYS/EINVAL como unsupported e falhar fechado.
- macOS: `renamex_np(..., RENAME_EXCL)` ou API equivalente suportada pelo target mínimo; validar disponibilidade no build.
- Windows: `MoveFileExW` sem flag REPLACE_EXISTING (e com WRITE_THROUGH se compatível), ou API nativa equivalente que falhe quando destino existe.
- Outras plataformas: não cair silenciosamente em `fs::rename`; retornar unsupported até existir garantia documentada.

O parent deve ser aberto/identificado uma vez e revalidado por handle; stage deve ser filho direto do mesmo parent, criado exclusivamente e sem symlink. O rename no-replace resolve a corrida de criação do target mesmo quando outro processo não respeita lock interno. Um lock por target pode reduzir trabalho duplicado, mas não substitui syscall no-replace.

Remover o pre-check como mecanismo de segurança; pode permanecer como otimização de UX, mas o resultado decisivo é o erro EEXIST/AlreadyExists da publicação. Mapear colisão para RESTORE_TARGET_EXISTS e manter target intocado.

## Arquivos e funções envolvidos
- `src-tauri/src/backup.rs`: `restore_project_backup`, novo `publish_dir_noreplace`.
- Novo módulo `src-tauri/src/safe_fs.rs` (preferível para reutilização na Missão 063): abstração por plataforma, parent dir handle e identidade.
- `src-tauri/Cargo.toml`: dependência de crate de syscall/dir handle apenas se não optar por FFI nativa; seleção requer review de manutenção/licença.
- `src-tauri/src/error.rs`: mapear AlreadyExists sem expor detalhes internos, se necessário.

## Invariantes de segurança
- Nunca sobrescrever projeto que já exista, seja arquivo, diretório, symlink ou junction.
- Publicação acontece no mesmo filesystem/parent e é atômica.
- Staging nunca é promovido se o destino existir no instante da syscall.
- Erro de publicação deixa o destino anterior byte-a-byte intacto.
- Sem fallback inseguro para `fs::rename` em plataforma não suportada.

## Riscos e dependências
- FFI por plataforma aumenta superfície unsafe; encapsular em uma função pequena, documentar invariants SAFETY e testar cada target.
- API macOS depende de versão mínima do OS; verificar deployment target.
- Windows reparse points/junctions exigem testes específicos e confirmação da semântica de MoveFileExW.
- Dependência alta da Missão 063 para parent handle e path identity; da Missão 055 para garantir staging completo e validado.
- Lock interprocesso não protege contra ator externo; syscall no-replace continua obrigatória.

## Testes necessários
- Unitário: helper retorna AlreadyExists para target file/dir/symlink sem alterar bytes.
- Concorrência: duas restaurações simultâneas ao mesmo target; exatamente uma publica e outra recebe RESTORE_TARGET_EXISTS.
- Adversarial: processo externo cria target entre estágio e commit; testar diretório vazio, diretório preenchido, arquivo, symlink e Windows junction.
- Crash: interromper antes/depois da syscall; garantir staging órfão não vira projeto ativo e target completo nunca parcial.
- Multi-plataforma: Linux, macOS e Windows em CI; testar volume/filesystem suportado.

## Critérios objetivos de aceite
- Para N tentativas concorrentes ao mesmo nome, exatamente uma publicação bem-sucedida.
- Nenhum conteúdo preexistente substituído em qualquer plataforma suportada.
- Sem fallback para rename substitutivo; plataforma sem primitive compatível retorna erro fechado.
- Colisão mapeada para RESTORE_TARGET_EXISTS; staging da operação perdedora removido.
- TESTE NÃO EXECUTADO: unit, concorrência, adversarial, crash e Windows/macOS/Linux.

## Limitações
Não foi executado teste de filesystem ou compilação do FFI. A proposta não escolhe crate/FFI definitivo sem confirmar target mínimo e matriz de SO. Uma solução baseada apenas em Mutex/create-new lock não fecha corrida com processos externos.

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

### PATCH PLAN
- **arquivo:** novo `src-tauri/src/safe_fs.rs` | **função:** `publish_dir_noreplace` | **mudança:** primitive atômica específica por SO, parent/stage same filesystem, falha fechada | **teste:** unit de colisão em file/dir/symlink | **risco:** FFI/portabilidade.
- **arquivo:** `src-tauri/src/backup.rs` | **função:** `restore_project_backup` | **mudança:** substituir rename final por publish no-replace; mapear AlreadyExists | **teste:** corrida N restore + ator externo | **risco:** comportamento de publicação por SO.
- **arquivo:** `src-tauri/Cargo.toml` | **função:** dependências | **mudança:** somente se biblioteca de syscall escolhida após review | **teste:** build Linux/macOS/Windows | **risco:** supply chain e compatibilidade.

## Fontes consultadas e integridade
- Wave spec: `WAVE_001_IMPLEMENTATION_MISSIONS.md` SHA `6ac5f4213961fa991e272fd146708bf78d3570fd`.
- Protocolo: `CENTRAL.md` e `INSTRUCTIONS.md`.
- Relatórios anteriores individuais: `reports/AUTOMATION_AI_MISSION_056_CHATGPT_GPT6.md` (lido antes desta proposta); missões relacionadas consultadas conforme dependência: 054, 058, 064, 041 e 050.
- Código principal: hashes indicados nas seções de evidência. Nenhum arquivo do produto foi alterado.
- **TESTE NÃO EXECUTADO:** build, cargo test, CI, integração, stress e testes multi-plataforma.

**Decisão:** proposta técnica, não implementação. Depende de aprovação do GPT-6 integrador antes de qualquer patch.
