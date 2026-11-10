# WAVE 001 — Missão 057: Import Roots — serialização e persistência atômica

- **Nome da IA:** ChatGPT — GPT-6 (OpenAI)
- **Modelo:** GPT-6
- **Especialidade:** arquitetura Rust/SQLite, segurança de filesystem e confiabilidade
- **Função:** proposta técnica independente pós-auditoria; somente leitura
- **Data:** 2026-11-10
- **Status:** REVIEW_REQUIRED
- **Branch analisada:** `v2-saas-alpha`
- **HEAD/arquivos:** evidências obtidas por fetch dos arquivos indicados; hashes anotados abaixo. Nenhum teste de runtime foi executado.

## Análise do problema atual
`add_root` e `remove_root` fazem load-modify-save de JSON sem exclusão mútua. Chamadas concorrentes podem perder atualização: duas adições leem o mesmo snapshot e a última gravação descarta a outra. O limite 32 é checado no snapshot antes do save, então chamadas paralelas podem exceder o teto. `save_roots` usa nome temporário fixo `import_roots.json.tmp`; em Windows remove o destino antes de rename, abrindo janela sem configuração e falha irrecuperável. `load_roots` usa `exists` e `read_to_string` sem tamanho máximo ou rejeição explícita de symlink.

## Evidências no código
- `src-tauri/src/path_guard.rs`, SHA `588fc60077dad959263c8ad5c2a36df9b1df95ad`: `load_roots`, `save_roots`, `add_root`, `remove_root` e `list_roots`.
- `src-tauri/src/limits.rs`, SHA `07565208f5d9a3a3012ed5b68f6e1e09d0d46e6b`: `MAX_IMPORT_ROOTS=32`.
- `src-tauri/src/lib.rs`: comandos Tauri `add_import_root`, `remove_import_root`, `list_import_roots` encaminham para path_guard.

## Solução proposta
Preferência: mover roots para SQLite de configuração do aplicativo, com tabela `import_roots(path_key PRIMARY KEY, path, created_at)`, transaction IMMEDIATE e unique key normalizada. Isso elimina o arquivo JSON e faz count + insert/delete no mesmo lock transacional, inclusive entre processos. Porém, é uma migração de persistência; precisa preservar roots existentes e definir identidade/case-fold por plataforma.

Alternativa de patch menor (se GPT-6 não autorizar migração): sidecar lock interprocesso via crate de file-lock mantida, adquirido antes de load-modify-save; ler JSON limitado, rejeitar symlink/non-regular, validar tamanho/count/path; gravar em temp exclusivo `create_new`, flush+sync; replace atômico (POSIX rename; Windows ReplaceFileW/MoveFileExW com REPLACE_EXISTING); sincronizar diretório em POSIX. Não remover arquivo original antes de replace. O lock deve ter timeout e nunca ser quebrado por idade apenas.

Para ambas: normalizar canonical path e chave comparativa com semântica de volume/OS; manter `MAX_IMPORT_ROOTS` aplicado no commit. Revalidar a raiz no momento de abrir arquivos, não confiar no snapshot retornado à UI.

## Arquivos e funções envolvidos
- `src-tauri/src/path_guard.rs`: `load_roots`, `save_roots`, `add_root`, `remove_root`, `list_roots`, `open_verified`.
- `src-tauri/src/limits.rs`: limite de tamanho de config e número de roots.
- `src-tauri/src/db.rs` + novo `app_settings.rs` (se SQLite escolhido): inicialização/migração de DB de configuração e schema.
- `src-tauri/src/lib.rs`: módulo e comandos Tauri, se API interna mudar.
- `src-tauri/Cargo.toml`: crate de lock cross-process se abordagem JSON for escolhida.

## Invariantes de segurança
- Máximo 32 roots persistidos, inclusive sob concorrência.
- Add/remove são operações serializáveis; nenhuma atualização confirmada se perde.
- Arquivo de configuração nunca fica ausente por falha durante substituição.
- Config não segue symlink nem lê JSON sem limite.
- Root autorizada é validada novamente no uso; revogar root impede novas aberturas subsequentes.
- Falha de persistência não retorna snapshot como se tivesse sido salvo.

## Riscos e dependências
- Migração JSON→SQLite precisa preservar e validar o arquivo antigo; não apagar fonte até commit e verificação de equivalência.
- Chave canônica Windows case-insensitive vs volumes case-sensitive exige política por volume.
- Lock de arquivo introduz dependência e comportamento de timeout/crash; não usar lock file stale removido automaticamente sem prova de owner.
- Dependência da Missão 063: uso de root e handle seguro.
- UI talvez assuma retorno Vec<ImportRoot>; schema externo pode permanecer igual para evitar quebra.

## Testes necessários
- Unitário: canonical key, duplicata, count 31/32/33, JSON truncado/oversized/symlink.
- Integração: migração com arquivo válido, inválido, legado e interrupção antes/depois de commit.
- Concorrência: 20 processos/threads adicionando/removendo simultaneamente; última vaga do limite; operações mistas add/remove; confirmar ausência de lost update e count<=32.
- Falhas: permissão negada, disco cheio, temp já existente, falha no replace, lock timeout e crash recovery.
- Plataforma: Windows ReplaceFileW/MoveFileExW, Linux/macOS rename e path comparison.
- Segurança: trocar root por symlink/junction depois de cadastrar; open_verified deve negar ou usar handle de diretório fixo.

## Critérios objetivos de aceite
- Após N operações simultâneas, configuração equivale a uma serialização válida de todas as operações bem-sucedidas.
- Count persistido nunca >32.
- Em falha no replace, bytes do arquivo anterior permanecem idênticos e recuperáveis.
- Config > teto ou symlink é rejeitada sem alocação ilimitada.
- TESTE NÃO EXECUTADO: unit, integração, multiprocess, falha e multi-plataforma.

## Limitações
O repositório atual não mostra banco de configurações global; escolha SQLite requer desenho de migração e compatibilidade. A opção lock+replace precisa de dependência e teste de filesystem real. Não executei builds nem testes.

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

### PATCH PLAN
- **arquivo:** `src-tauri/src/path_guard.rs` | **função:** `add_root`, `remove_root` | **mudança:** serializar read-modify-write e validar limite sob lock/transação | **teste:** concorrência no último slot | **risco:** contenção e deadlock se lock mal delimitado.
- **arquivo:** `src-tauri/src/path_guard.rs` | **função:** `load_roots`, `save_roots` | **mudança:** leitura bounded, reject symlink, temp exclusivo e replace atômico sem delete prévio | **teste:** config corrupta/oversized + falha injetada no replace | **risco:** diferenças Windows/POSIX.
- **arquivo:** novo `src-tauri/src/app_settings.rs` e `src-tauri/src/db.rs` | **função:** init/migrate e transações de roots | **mudança:** alternativa preferida SQLite global, unique key + count/insert em IMMEDIATE | **teste:** migração e multiprocess | **risco:** migração de dados de configuração.
- **arquivo:** `src-tauri/src/path_guard.rs` | **função:** `open_verified` | **mudança:** revalidar root/handle com primitive segura da Missão 063 | **teste:** root swap/symlink/junction | **risco:** API OS-specific.

## Fontes consultadas e integridade
- Wave spec: `WAVE_001_IMPLEMENTATION_MISSIONS.md` SHA `6ac5f4213961fa991e272fd146708bf78d3570fd`.
- Protocolo: `CENTRAL.md` e `INSTRUCTIONS.md`.
- Relatórios anteriores individuais: `reports/AUTOMATION_AI_MISSION_057_CHATGPT_GPT6.md` (lido antes desta proposta); missões relacionadas consultadas conforme dependência: 054, 058, 064, 041 e 050.
- Código principal: hashes indicados nas seções de evidência. Nenhum arquivo do produto foi alterado.
- **TESTE NÃO EXECUTADO:** build, cargo test, CI, integração, stress e testes multi-plataforma.

**Decisão:** proposta técnica, não implementação. Depende de aprovação do GPT-6 integrador antes de qualquer patch.
